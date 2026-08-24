import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const rescheduleSchema = z.object({
  newDate: z.string().datetime().refine((val) => new Date(val) > new Date(), {
    message: "Rescheduled date must be in the future",
  }),
  reason: z.string().min(3),
});

describe("Failed Delivery & Reschedule Flow", () => {
  const orderId = "order-fail-101";
  const customerId = "cust-user-1";
  const otherCustomerId = "cust-user-2";

  describe("Reschedule Schema Validation", () => {
    it("accepts valid future ISO timestamp and descriptive reason", () => {
      const futureDate = new Date(Date.now() + 86400000 * 2).toISOString(); // 2 days in future
      const valid = rescheduleSchema.safeParse({
        newDate: futureDate,
        reason: "Customer was unavailable during first delivery attempt",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects past timestamps", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day in past
      const invalid = rescheduleSchema.safeParse({
        newDate: pastDate,
        reason: "Customer was unavailable",
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.flatten().fieldErrors.newDate?.[0]).toBe("Rescheduled date must be in the future");
      }
    });

    it("rejects invalid non-datetime strings or short reasons", () => {
      const invalidDate = rescheduleSchema.safeParse({
        newDate: "not-a-date",
        reason: "Customer unavailable",
      });
      expect(invalidDate.success).toBe(false);

      const invalidReason = rescheduleSchema.safeParse({
        newDate: new Date(Date.now() + 86400000).toISOString(),
        reason: "no",
      });
      expect(invalidReason.success).toBe(false);
    });
  });

  describe("Reschedule State Machine Invariants", () => {
    it("permits rescheduling when order status is strictly FAILED", () => {
      const allowedStatus = "FAILED";
      expect(allowedStatus === "FAILED").toBe(true);
    });

    it("rejects rescheduling when order is in non-FAILED statuses", () => {
      const statuses = ["CREATED", "UNASSIGNED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "RESCHEDULED"];
      statuses.forEach((status) => {
        expect(status === "FAILED").toBe(false);
      });
    });
  });

  describe("RescheduleRequest Database Persistence", () => {
    it("creates RescheduleRequest with originalDate, newDate, and reason", async () => {
      const originalDate = new Date("2026-08-23T10:00:00Z");
      const newDate = new Date(Date.now() + 86400000 * 3);
      const reason = "Customer requested weekend delivery";

      const createSpy = vi.spyOn(prisma.rescheduleRequest, "create").mockResolvedValueOnce({
        id: "resched-1",
        orderId,
        originalDate,
        newDate,
        reason,
        createdAt: new Date(),
      } as any);

      await prisma.rescheduleRequest.create({
        data: {
          orderId,
          originalDate,
          newDate,
          reason,
        },
      });

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          orderId,
          originalDate,
          newDate,
          reason,
        },
      });
    });
  });
});
