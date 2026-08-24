import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { notifyStatusChange } from "./notificationService.js";

const AGENT_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: [],
  UNASSIGNED: [],
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: [],
  RESCHEDULED: [],
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

export async function appendStatus(params: {
  orderId: string;
  status: OrderStatus;
  actorId: string;
  note?: string;
  extra?: { assignedAgentId?: string | null; scheduledDate?: Date };
}) {
  const order = await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: params.status,
      ...(params.extra?.assignedAgentId !== undefined
        ? { assignedAgentId: params.extra.assignedAgentId }
        : {}),
      ...(params.extra?.scheduledDate ? { scheduledDate: params.extra.scheduledDate } : {}),
      statusHistory: {
        create: {
          status: params.status,
          changedByUserId: params.actorId,
          note: params.note,
        },
      },
    },
  });
  await notifyStatusChange(params.orderId, params.status, params.note);
  return order;
}

export function assertAgentTransition(from: OrderStatus, to: OrderStatus) {
  const allowed = AGENT_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status jump: ${from} → ${to}`);
  }
}

export async function changeOrderStatus(params: {
  orderId: string;
  nextStatus: OrderStatus;
  actorId: string;
  actorRole: Role;
  note?: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error("Order not found");

  if (order.status === "DELIVERED") {
    throw new Error("Cannot change status of a delivered order (DELIVERED is terminal)");
  }

  if (params.actorRole === "AGENT") {
    if (order.assignedAgentId !== params.actorId) {
      throw new Error("You can only update orders assigned to you");
    }
    assertAgentTransition(order.status, params.nextStatus);
  } else if (params.actorRole !== "ADMIN") {
    throw new Error("Not allowed to change status");
  }

  if (params.nextStatus === "FAILED" && order.status === params.nextStatus) {
    throw new Error("Order is already failed");
  }

  return appendStatus({
    orderId: params.orderId,
    status: params.nextStatus,
    actorId: params.actorId,
    note: params.note ?? (params.actorRole === "ADMIN" ? "Admin override" : undefined),
  });
}
