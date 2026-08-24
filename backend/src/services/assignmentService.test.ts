import { describe, expect, it, vi } from "vitest";
import { prisma } from "../lib/prisma.js";
import {
  autoAssignOrder,
  listEligibleAgents,
  manualAssignOrder,
  unassignedCount,
} from "./assignmentService.js";

describe("Dynamic Agent Assignment Engine", () => {
  const pickupZoneId = "zone-north-uuid";
  const dropZoneId = "zone-south-uuid";

  const agent1 = {
    userId: "agent-1",
    isAvailable: true,
    currentZoneId: pickupZoneId,
    maxActiveOrders: 5,
    user: { id: "agent-1", name: "Agent Alpha", role: "AGENT" },
    currentZone: { id: pickupZoneId, name: "North", code: "NORTH" },
  };

  const agent2 = {
    userId: "agent-2",
    isAvailable: true,
    currentZoneId: pickupZoneId,
    maxActiveOrders: 3,
    user: { id: "agent-2", name: "Agent Beta", role: "AGENT" },
    currentZone: { id: pickupZoneId, name: "North", code: "NORTH" },
  };

  describe("listEligibleAgents", () => {
    it("returns eligible agents sorted by fewest active orders (load-balancing)", async () => {
      vi.spyOn(prisma.agentProfile, "findMany").mockResolvedValueOnce([agent1, agent2] as any);

      // Agent 1 has 2 active orders, Agent 2 has 0 active orders
      vi.spyOn(prisma.order, "count")
        .mockResolvedValueOnce(2) // agent1
        .mockResolvedValueOnce(0); // agent2

      const eligible = await listEligibleAgents(pickupZoneId);

      expect(eligible).toHaveLength(2);
      expect(eligible[0].userId).toBe("agent-2"); // 0 active orders wins
      expect(eligible[0].active).toBe(0);
      expect(eligible[1].userId).toBe("agent-1");
      expect(eligible[1].active).toBe(2);
    });

    it("filters out agents who have reached maxActiveOrders capacity", async () => {
      vi.spyOn(prisma.agentProfile, "findMany").mockResolvedValueOnce([agent1, agent2] as any);

      // Agent 1 has 5/5 active orders (saturated), Agent 2 has 1/3 active orders
      vi.spyOn(prisma.order, "count")
        .mockResolvedValueOnce(5) // agent1 is at max (5)
        .mockResolvedValueOnce(1); // agent2 has headroom (1 < 3)

      const eligible = await listEligibleAgents(pickupZoneId);

      expect(eligible).toHaveLength(1);
      expect(eligible[0].userId).toBe("agent-2");
    });
  });

  describe("autoAssignOrder", () => {
    it("auto-assigns to the least loaded available agent in pickup zone", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-101",
        pickupZoneId,
        status: "CREATED",
      } as any);

      vi.spyOn(prisma.agentProfile, "findMany").mockResolvedValueOnce([agent1] as any);
      vi.spyOn(prisma.order, "count").mockResolvedValueOnce(1); // 1 active order

      vi.spyOn(prisma as any, "$transaction").mockImplementationOnce(async (cb: any) => cb(prisma));
      vi.spyOn(prisma.order, "update").mockResolvedValueOnce({ id: "order-101" } as any);
      vi.spyOn(prisma.orderStatusHistory, "create").mockResolvedValueOnce({ id: "hist-1" } as any);

      const result = await autoAssignOrder("order-101", "system-actor");
      expect(result.assigned).toBe(true);
      if (result.assigned) {
        expect(result.agentId).toBe("agent-1");
        expect(result.agentName).toBe("Agent Alpha");
      }
    });

    it("marks order UNASSIGNED when zero agents are available in pickup zone", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-102",
        pickupZoneId,
        status: "CREATED",
      } as any);

      // No agents in zone
      vi.spyOn(prisma.agentProfile, "findMany").mockResolvedValueOnce([]);

      vi.spyOn(prisma as any, "$transaction").mockImplementationOnce(async (cb: any) => cb(prisma));
      vi.spyOn(prisma.order, "update").mockResolvedValueOnce({ id: "order-102" } as any);
      vi.spyOn(prisma.orderStatusHistory, "create").mockResolvedValueOnce({ id: "hist-2" } as any);

      const result = await autoAssignOrder("order-102", "system-actor");
      expect(result.assigned).toBe(false);
      expect(result.reason).toContain("UNASSIGNED");
    });
  });

  describe("manualAssignOrder", () => {
    it("assigns agent when zone matches and capacity is available", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-201",
        pickupZoneId,
        status: "UNASSIGNED",
      } as any);

      vi.spyOn(prisma.agentProfile, "findUnique").mockResolvedValueOnce({
        ...agent1,
        isAvailable: true,
        currentZoneId: pickupZoneId,
        maxActiveOrders: 5,
      } as any);

      vi.spyOn(prisma.order, "count").mockResolvedValueOnce(2); // 2 < 5

      vi.spyOn(prisma as any, "$transaction").mockImplementationOnce(async (cb: any) => cb(prisma));
      vi.spyOn(prisma.order, "update").mockResolvedValueOnce({ id: "order-201" } as any);
      vi.spyOn(prisma.orderStatusHistory, "create").mockResolvedValueOnce({ id: "hist-3" } as any);

      const result = await manualAssignOrder("order-201", "agent-1", "admin-1");
      expect(result.assigned).toBe(true);
      expect(result.agentId).toBe("agent-1");
    });

    it("rejects manual assignment if agent zone does not match pickup zone", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-202",
        pickupZoneId,
        status: "UNASSIGNED",
      } as any);

      vi.spyOn(prisma.agentProfile, "findUnique").mockResolvedValueOnce({
        ...agent1,
        currentZoneId: "different-zone-id", // Mismatch
      } as any);

      await expect(manualAssignOrder("order-202", "agent-1", "admin-1")).rejects.toThrow(
        "Agent current zone must match the order pickup zone"
      );
    });

    it("rejects manual assignment if agent is saturated at max capacity", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-203",
        pickupZoneId,
        status: "UNASSIGNED",
      } as any);

      vi.spyOn(prisma.agentProfile, "findUnique").mockResolvedValueOnce({
        ...agent1,
        maxActiveOrders: 3,
      } as any);

      vi.spyOn(prisma.order, "count").mockResolvedValueOnce(3); // 3 >= 3 (saturated)

      await expect(manualAssignOrder("order-203", "agent-1", "admin-1")).rejects.toThrow(
        "Agent is at max active orders"
      );
    });
  });

  describe("unassignedCount", () => {
    it("returns count of UNASSIGNED orders for admin alert polling", async () => {
      vi.spyOn(prisma.order, "count").mockResolvedValueOnce(4);

      const count = await unassignedCount();
      expect(count).toBe(4);
    });
  });
});
