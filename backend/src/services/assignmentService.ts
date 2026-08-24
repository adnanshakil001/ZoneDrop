import { prisma } from "../lib/prisma.js";
import { ACTIVE_ORDER_STATUSES, appendStatus } from "./orderStatusService.js";

export type AssignmentResult =
  | { assigned: true; agentId: string; agentName: string; reason: string }
  | { assigned: false; reason: string };

async function activeCount(agentUserId: string): Promise<number> {
  return prisma.order.count({
    where: {
      assignedAgentId: agentUserId,
      status: { in: ACTIVE_ORDER_STATUSES },
    },
  });
}

export async function listEligibleAgents(pickupZoneId: string) {
  const agents = await prisma.agentProfile.findMany({
    where: {
      isAvailable: true,
      currentZoneId: pickupZoneId,
      user: { role: "AGENT" },
    },
    include: { user: true, currentZone: true },
  });

  const withLoad = await Promise.all(
    agents.map(async (a) => {
      const active = await activeCount(a.userId);
      return { ...a, active };
    })
  );

  return withLoad
    .filter((a) => a.active < a.maxActiveOrders)
    .sort((a, b) => a.active - b.active);
}

export async function autoAssignOrder(orderId: string, actorId: string): Promise<AssignmentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const eligible = await listEligibleAgents(order.pickupZoneId);
  if (eligible.length === 0) {
    if (order.status !== "UNASSIGNED") {
      await appendStatus({
        orderId,
        status: "UNASSIGNED",
        actorId,
        note: "No available agent in pickup zone (capacity or availability)",
        extra: { assignedAgentId: null },
      });
    }
    return {
      assigned: false,
      reason: "No available agent in the pickup zone. Order is UNASSIGNED — admin must assign or retry.",
    };
  }

  const pick = eligible[0];
  await appendStatus({
    orderId,
    status: "ASSIGNED",
    actorId,
    note: `Auto-assigned to ${pick.user.name} (fewest active orders: ${pick.active})`,
    extra: { assignedAgentId: pick.userId },
  });
  return {
    assigned: true,
    agentId: pick.userId,
    agentName: pick.user.name,
    reason: `Assigned to ${pick.user.name} with ${pick.active} active order(s)`,
  };
}

export async function manualAssignOrder(orderId: string, agentUserId: string, actorId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: agentUserId },
    include: { user: true },
  });
  if (!agent || agent.user.role !== "AGENT") throw new Error("Agent not found");
  if (!agent.isAvailable) throw new Error("Agent is not available");
  if (agent.currentZoneId !== order.pickupZoneId) {
    throw new Error("Agent current zone must match the order pickup zone");
  }
  const active = await activeCount(agentUserId);
  if (active >= agent.maxActiveOrders) {
    throw new Error("Agent is at max active orders");
  }

  await appendStatus({
    orderId,
    status: "ASSIGNED",
    actorId,
    note: `Manually assigned to ${agent.user.name}`,
    extra: { assignedAgentId: agentUserId },
  });
  return { assigned: true as const, agentId: agentUserId, agentName: agent.user.name };
}

export async function unassignedCount(): Promise<number> {
  return prisma.order.count({ where: { status: "UNASSIGNED" } });
}
