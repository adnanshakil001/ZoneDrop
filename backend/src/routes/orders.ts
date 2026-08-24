import { OrderStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { canAccessOrder, requireAuth, requireRole } from "../middleware/auth.js";
import {
  autoAssignOrder,
  listEligibleAgents,
  manualAssignOrder,
  unassignedCount,
} from "../services/assignmentService.js";
import { notifyStatusChange } from "../services/notificationService.js";
import { appendStatus, changeOrderStatus } from "../services/orderStatusService.js";
import { calculateOrderCharge } from "../services/quoteService.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const quoteSchema = z.object({
  pickupPincode: z.string().min(3).transform((s) => s.trim().toUpperCase()),
  dropPincode: z.string().min(3).transform((s) => s.trim().toUpperCase()),
  lengthCm: z.number().positive(),
  breadthCm: z.number().positive(),
  heightCm: z.number().positive(),
  actualWeight: z.number().nonnegative(),
  orderType: z.enum(["B2B", "B2C"]),
  paymentType: z.enum(["PREPAID", "COD"]),
});

const createSchema = quoteSchema.extend({
  pickupAddress: z.string().min(5),
  dropAddress: z.string().min(5),
  scheduledDate: z.string().min(8),
  customerId: z.string().uuid().optional(),
  autoAssign: z.boolean().optional(),
});

ordersRouter.post("/quote", requireRole("CUSTOMER", "ADMIN"), async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const breakdown = await calculateOrderCharge(parsed.data);
    res.json(breakdown);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Quote failed" });
  }
});

ordersRouter.get("/unassigned-alert", requireRole("ADMIN"), async (_req, res) => {
  const count = await unassignedCount();
  res.json({ count, alert: count > 0, message: count ? `${count} order(s) waiting for an agent` : null });
});

ordersRouter.get("/", async (req, res) => {
  const user = req.user!;
  const status = typeof req.query.status === "string" ? (req.query.status as OrderStatus) : undefined;
  const zoneId = typeof req.query.zoneId === "string" ? req.query.zoneId : undefined;
  const agentId = typeof req.query.agentId === "string" ? req.query.agentId : undefined;

  const where =
    user.role === "ADMIN"
      ? {
          ...(status ? { status } : {}),
          ...(zoneId ? { pickupZoneId: zoneId } : {}),
          ...(agentId ? { assignedAgentId: agentId } : {}),
        }
      : user.role === "AGENT"
        ? { assignedAgentId: user.id, ...(status ? { status } : {}) }
        : { customerId: user.id, ...(status ? { status } : {}) };

  const orders = await prisma.order.findMany({
    where,
    include: {
      pickupZone: true,
      dropZone: true,
      assignedAgent: { select: { id: true, name: true, email: true, phone: true } },
      customer: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

ordersRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  if (!(await canAccessOrder(req.user!, id))) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      pickupZone: true,
      dropZone: true,
      assignedAgent: { select: { id: true, name: true, email: true, phone: true } },
      customer: { select: { id: true, name: true, email: true, phone: true } },
      statusHistory: { include: { changedBy: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
      reschedules: { orderBy: { createdAt: "asc" } },
      notifications: { orderBy: { sentAt: "desc" } },
    },
  });
  res.json(order);
});

ordersRouter.post("/", requireRole("CUSTOMER", "ADMIN"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const actor = req.user!;
  let customerId = actor.id;
  if (actor.role === "ADMIN") {
    if (!parsed.data.customerId) {
      res.status(400).json({ error: "Admin must pass customerId" });
      return;
    }
    const customer = await prisma.user.findUnique({ where: { id: parsed.data.customerId } });
    if (!customer || customer.role !== "CUSTOMER") {
      res.status(400).json({ error: "customerId must be a CUSTOMER user" });
      return;
    }
    customerId = customer.id;
  }

  try {
    const breakdown = await calculateOrderCharge(parsed.data);
    const order = await prisma.order.create({
      data: {
        customerId,
        createdByAdminId: actor.role === "ADMIN" ? actor.id : null,
        pickupAddress: parsed.data.pickupAddress,
        dropAddress: parsed.data.dropAddress,
        pickupPincode: parsed.data.pickupPincode,
        dropPincode: parsed.data.dropPincode,
        pickupZoneId: breakdown.pickupZone.id,
        dropZoneId: breakdown.dropZone.id,
        lengthCm: parsed.data.lengthCm,
        breadthCm: parsed.data.breadthCm,
        heightCm: parsed.data.heightCm,
        actualWeight: parsed.data.actualWeight,
        volumetricWeight: breakdown.volumetricWeight,
        chargeableWeight: breakdown.chargeableWeight,
        orderType: parsed.data.orderType,
        paymentType: parsed.data.paymentType,
        calculatedCharge: breakdown.total,
        quoteSnapshot: breakdown,
        scheduledDate: new Date(parsed.data.scheduledDate),
        status: "CREATED",
        statusHistory: {
          create: {
            status: "CREATED",
            changedByUserId: actor.id,
            note: actor.role === "ADMIN" ? "Created by admin on behalf of customer" : "Order confirmed after quote",
          },
        },
      },
    });
    await notifyStatusChange(order.id, "CREATED", "Order confirmed");

    if (parsed.data.autoAssign) {
      await autoAssignOrder(order.id, actor.id);
    } else {
      await appendStatus({
        orderId: order.id,
        status: "UNASSIGNED",
        actorId: actor.id,
        note: "Awaiting agent assignment",
      });
    }

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { pickupZone: true, dropZone: true, statusHistory: true, assignedAgent: true },
    });
    res.status(201).json(full);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
  }
});

ordersRouter.get("/:id/eligible-agents", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const agents = await listEligibleAgents(order.pickupZoneId);
  res.json(
    agents.map((a) => ({
      id: a.userId,
      name: a.user.name,
      email: a.user.email,
      isAvailable: a.isAvailable,
      maxActiveOrders: a.maxActiveOrders,
      activeOrders: a.active,
      zone: a.currentZone,
    }))
  );
});

ordersRouter.post("/:id/assign", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const agentId = z.string().uuid().safeParse(req.body?.agentId);
  if (!agentId.success) {
    res.status(400).json({ error: "agentId required" });
    return;
  }
  try {
    const result = await manualAssignOrder(id, agentId.data, req.user!.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Assign failed" });
  }
});

ordersRouter.post("/:id/auto-assign", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  try {
    const result = await autoAssignOrder(id, req.user!.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Auto-assign failed" });
  }
});

ordersRouter.patch("/:id/status", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const parsed = z
    .object({
      status: z.enum([
        "CREATED",
        "UNASSIGNED",
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "RESCHEDULED",
      ]),
      note: z.string().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const order = await changeOrderStatus({
      orderId: id,
      nextStatus: parsed.data.status,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      note: parsed.data.note,
    });
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Status update failed" });
  }
});

ordersRouter.post("/:id/reschedule", requireRole("CUSTOMER", "ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const parsed = z
    .object({
      newDate: z.string().datetime().refine((val) => new Date(val) > new Date(), {
        message: "Rescheduled date must be in the future",
      }),
      reason: z.string().min(3),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (req.user!.role === "CUSTOMER" && order.customerId !== req.user!.id) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "FAILED") {
    res.status(400).json({ error: "Only failed deliveries can be rescheduled" });
    return;
  }

  await prisma.rescheduleRequest.create({
    data: {
      orderId: order.id,
      originalDate: order.scheduledDate,
      newDate: new Date(parsed.data.newDate),
      reason: parsed.data.reason,
    },
  });

  await appendStatus({
    orderId: order.id,
    status: "RESCHEDULED",
    actorId: req.user!.id,
    note: parsed.data.reason,
    extra: { scheduledDate: new Date(parsed.data.newDate), assignedAgentId: null },
  });

  const assignment = await autoAssignOrder(order.id, req.user!.id);
  const full = await prisma.order.findUnique({
    where: { id: order.id },
    include: { statusHistory: true, reschedules: true, assignedAgent: true },
  });
  res.json({ order: full, assignment });
});

ordersRouter.get("/:id/notifications", async (req, res) => {
  const id = req.params.id as string;
  if (!(await canAccessOrder(req.user!, id))) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const logs = await prisma.notificationLog.findMany({
    where: { orderId: id },
    orderBy: { sentAt: "desc" },
  });
  res.json(logs);
});
