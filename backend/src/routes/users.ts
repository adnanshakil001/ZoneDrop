import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("ADMIN"));

const agentSchema = z.object({
  name: z.string().min(2).transform((s) => s.trim()),
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(6),
  phone: z.string().optional().transform((s) => s?.trim()),
  currentZoneId: z.string().uuid().optional(),
  maxActiveOrders: z.number().int().min(1).optional(),
  isAvailable: z.boolean().optional(),
});

usersRouter.post("/agents", async (req, res) => {
  const parsed = agentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      phone: parsed.data.phone,
      role: "AGENT",
      agentProfile: {
        create: {
          currentZoneId: parsed.data.currentZoneId,
          maxActiveOrders: parsed.data.maxActiveOrders ?? 5,
          isAvailable: parsed.data.isAvailable ?? true,
        },
      },
    },
    include: { agentProfile: true },
  });
  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    agentProfile: user.agentProfile,
  });
});

usersRouter.get("/agents", async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    include: { agentProfile: { include: { currentZone: true } } },
    orderBy: { name: "asc" },
  });
  res.json(
    agents.map(({ passwordHash: _h, ...a }) => a)
  );
});

usersRouter.get("/customers", async (_req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true },
  });
  res.json(customers);
});

usersRouter.patch("/agents/:id/availability", async (req, res) => {
  const id = req.params.id as string;
  const isAvailable = Boolean(req.body?.isAvailable);
  const profile = await prisma.agentProfile.update({
    where: { userId: id },
    data: { isAvailable },
  });
  res.json(profile);
});

const adminSchema = z.object({
  name: z.string().min(2).transform((s) => s.trim()),
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(6),
});

usersRouter.post("/admins", async (req, res) => {
  const parsed = adminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: "ADMIN",
    },
  });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
