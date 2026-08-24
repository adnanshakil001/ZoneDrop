import { describe, expect, it, vi } from "vitest";
import { prisma } from "../lib/prisma.js";
import {
  appendStatus,
  assertAgentTransition,
  changeOrderStatus,
} from "./orderStatusService.js";

describe("Order Status State Machine & Audit Service", () => {
  const agentId = "agent-user-uuid";
  const otherAgentId = "other-agent-uuid";
  const orderId = "order-uuid-101";

  describe("assertAgentTransition", () => {
    it("allows valid sequential agent transitions", () => {
      expect(() => assertAgentTransition("ASSIGNED", "PICKED_UP")).not.toThrow();
      expect(() => assertAgentTransition("PICKED_UP", "IN_TRANSIT")).not.toThrow();
      expect(() => assertAgentTransition("IN_TRANSIT", "OUT_FOR_DELIVERY")).not.toThrow();
      expect(() => assertAgentTransition("OUT_FOR_DELIVERY", "DELIVERED")).not.toThrow();
      expect(() => assertAgentTransition("OUT_FOR_DELIVERY", "FAILED")).not.toThrow();
    });

    it("rejects illegal status skips", () => {
      expect(() => assertAgentTransition("ASSIGNED", "DELIVERED")).toThrow("Invalid status jump");
      expect(() => assertAgentTransition("ASSIGNED", "IN_TRANSIT")).toThrow("Invalid status jump");
      expect(() => assertAgentTransition("PICKED_UP", "DELIVERED")).toThrow("Invalid status jump");
      expect(() => assertAgentTransition("CREATED", "PICKED_UP")).toThrow("Invalid status jump");
    });
  });

  describe("changeOrderStatus lifecycle enforcement", () => {
    it("allows assigned agent to advance order along permitted path", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: orderId,
        status: "ASSIGNED",
        assignedAgentId: agentId,
      } as any);

      vi.spyOn(prisma.order, "update").mockResolvedValueOnce({
        id: orderId,
        status: "PICKED_UP",
      } as any);

      vi.spyOn(prisma.notificationLog, "create").mockResolvedValueOnce({ id: "notif-1" } as any);

      const updated = await changeOrderStatus({
        orderId,
        nextStatus: "PICKED_UP",
        actorId: agentId,
        actorRole: "AGENT",
        note: "Package collected from vendor",
      });

      expect(updated.status).toBe("PICKED_UP");
    });

    it("prevents transitions out of DELIVERED (terminal state immutability)", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: orderId,
        status: "DELIVERED",
        assignedAgentId: agentId,
      } as any);

      await expect(
        changeOrderStatus({
          orderId,
          nextStatus: "FAILED",
          actorId: agentId,
          actorRole: "AGENT",
        })
      ).rejects.toThrow("DELIVERED is terminal");
    });

    it("rejects an agent trying to update an order assigned to someone else", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: orderId,
        status: "ASSIGNED",
        assignedAgentId: otherAgentId, // Different agent
      } as any);

      await expect(
        changeOrderStatus({
          orderId,
          nextStatus: "PICKED_UP",
          actorId: agentId,
          actorRole: "AGENT",
        })
      ).rejects.toThrow("You can only update orders assigned to you");
    });

    it("allows Admin to override non-terminal order status with note", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: orderId,
        status: "ASSIGNED",
        assignedAgentId: agentId,
      } as any);

      vi.spyOn(prisma.order, "update").mockResolvedValueOnce({
        id: orderId,
        status: "IN_TRANSIT",
      } as any);

      vi.spyOn(prisma.notificationLog, "create").mockResolvedValueOnce({ id: "notif-2" } as any);

      const updated = await changeOrderStatus({
        orderId,
        nextStatus: "IN_TRANSIT",
        actorId: "admin-user-uuid",
        actorRole: "ADMIN",
        note: "Admin manual re-routing",
      });

      expect(updated.status).toBe("IN_TRANSIT");
    });
  });

  describe("appendStatus audit logging", () => {
    it("atomically updates order and appends statusHistory record", async () => {
      const updateSpy = vi.spyOn(prisma.order, "update").mockResolvedValueOnce({
        id: orderId,
        status: "PICKED_UP",
      } as any);

      vi.spyOn(prisma.notificationLog, "create").mockResolvedValueOnce({ id: "notif-3" } as any);

      await appendStatus({
        orderId,
        status: "PICKED_UP",
        actorId: agentId,
        note: "Scanned at hub",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: expect.objectContaining({
            status: "PICKED_UP",
            statusHistory: {
              create: {
                status: "PICKED_UP",
                changedByUserId: agentId,
                note: "Scanned at hub",
              },
            },
          }),
        })
      );
    });
  });
});
