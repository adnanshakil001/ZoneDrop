import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { calculateOrderCharge, detectZone } from "../services/quoteService.js";

const quoteSchema = z.object({
  pickupPincode: z.string().min(3),
  dropPincode: z.string().min(3),
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

describe("Quote-First Order Pipeline", () => {
  describe("detectZone", () => {
    it("returns mapped zone for valid pincode", async () => {
      vi.spyOn(prisma.pincodeZoneMap, "findUnique").mockResolvedValueOnce({
        id: "map-1",
        pincode: "110001",
        zoneId: "z-north",
        areaName: "CP",
        createdAt: new Date(),
        zone: { id: "z-north", name: "North Zone", code: "NORTH", createdAt: new Date() },
      } as any);

      const zone = await detectZone("110001");
      expect(zone).toEqual({ id: "z-north", name: "North Zone", code: "NORTH" });
    });

    it("throws clear error when pincode has no zone mapping", async () => {
      vi.spyOn(prisma.pincodeZoneMap, "findUnique").mockResolvedValueOnce(null);

      await expect(detectZone("999999")).rejects.toThrow(
        "Pincode 999999 is not mapped to a zone. Ask an admin to add it."
      );
    });
  });

  describe("calculateOrderCharge Integration", () => {
    it("fetches dynamic rate card & COD config and produces full breakdown", async () => {
      vi.spyOn(prisma.pincodeZoneMap, "findUnique")
        .mockResolvedValueOnce({
          id: "m-1",
          pincode: "110001",
          zoneId: "z-north",
          zone: { id: "z-north", name: "North Zone", code: "NORTH" },
        } as any)
        .mockResolvedValueOnce({
          id: "m-2",
          pincode: "110021",
          zoneId: "z-north",
          zone: { id: "z-north", name: "North Zone", code: "NORTH" },
        } as any);

      vi.spyOn(prisma.rateCard, "findMany").mockResolvedValueOnce([
        {
          id: "card-b2c-intra",
          orderType: "B2C",
          zoneType: "INTRA",
          fromZoneId: null,
          toZoneId: null,
          baseFee: { toString: () => "50.00" },
          ratePerKg: { toString: () => "20.00" },
        } as any,
      ]);

      vi.spyOn(prisma.codConfig, "findUnique").mockResolvedValueOnce({
        id: "cod-b2c",
        orderType: "B2C",
        surchargeFlat: { toString: () => "10.00" },
        surchargePercent: { toString: () => "5.00" },
      } as any);

      const quote = await calculateOrderCharge({
        pickupPincode: "110001",
        dropPincode: "110021",
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 0.4,
        orderType: "B2C",
        paymentType: "COD",
      });

      expect(quote.pickupZone.id).toBe("z-north");
      expect(quote.dropZone.id).toBe("z-north");
      expect(quote.zoneType).toBe("INTRA");
      expect(quote.volumetricWeight).toBe(0.6);
      expect(quote.chargeableWeight).toBe(0.6);
      expect(quote.subtotal).toBe(62.0);
      expect(quote.codSurcharge).toBe(13.1);
      expect(quote.total).toBe(75.1);
    });
  });

  describe("Schema Validations", () => {
    it("accepts valid quote request payload", () => {
      const valid = quoteSchema.safeParse({
        pickupPincode: "110001",
        dropPincode: "110021",
        lengthCm: 25,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 1.2,
        orderType: "B2C",
        paymentType: "PREPAID",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects non-positive dimensions in quote schema", () => {
      const invalid = quoteSchema.safeParse({
        pickupPincode: "110001",
        dropPincode: "110021",
        lengthCm: -5,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 1.2,
        orderType: "B2C",
        paymentType: "PREPAID",
      });
      expect(invalid.success).toBe(false);
    });

    it("accepts valid order creation payload", () => {
      const valid = createSchema.safeParse({
        pickupPincode: "110001",
        dropPincode: "110021",
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 0.4,
        orderType: "B2C",
        paymentType: "COD",
        pickupAddress: "42 Connaught Circle, New Delhi",
        dropAddress: "15 Chanakyapuri Diplomatic Enclave",
        scheduledDate: "2026-08-25T10:00:00.000Z",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects order creation with address too short", () => {
      const invalid = createSchema.safeParse({
        pickupPincode: "110001",
        dropPincode: "110021",
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 0.4,
        orderType: "B2C",
        paymentType: "COD",
        pickupAddress: "123",
        dropAddress: "15 Chanakyapuri Diplomatic Enclave",
        scheduledDate: "2026-08-25T10:00:00.000Z",
      });
      expect(invalid.success).toBe(false);
    });
  });
});
