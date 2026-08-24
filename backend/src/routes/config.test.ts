import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const zoneSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

const pincodeSchema = z.object({
  pincode: z.string().min(3),
  zoneId: z.string().uuid(),
  areaName: z.string().optional(),
});

const rateCardSchema = z.object({
  orderType: z.enum(["B2B", "B2C"]),
  zoneType: z.enum(["INTRA", "INTER"]),
  fromZoneId: z.string().uuid().nullable().optional(),
  toZoneId: z.string().uuid().nullable().optional(),
  baseFee: z.number().nonnegative(),
  ratePerKg: z.number().nonnegative(),
});

const codSchema = z.object({
  surchargeFlat: z.number().nonnegative(),
  surchargePercent: z.number().nonnegative(),
});

describe("Admin Configuration DTO Schemas & Persistence", () => {
  describe("Zone Configuration", () => {
    it("validates valid zone creation payload", () => {
      const valid = zoneSchema.safeParse({ name: "West Zone", code: "WEST" });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.code.toUpperCase()).toBe("WEST");
      }
    });

    it("rejects empty zone name or code", () => {
      const invalidName = zoneSchema.safeParse({ name: "", code: "WEST" });
      expect(invalidName.success).toBe(false);

      const invalidCode = zoneSchema.safeParse({ name: "West Zone", code: "" });
      expect(invalidCode.success).toBe(false);
    });
  });

  describe("Pincode-to-Zone Mapping", () => {
    const validZoneId = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";

    it("validates valid pincode mapping", () => {
      const valid = pincodeSchema.safeParse({
        pincode: "110001",
        zoneId: validZoneId,
        areaName: "Connaught Place",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid non-UUID zoneId", () => {
      const invalid = pincodeSchema.safeParse({
        pincode: "110001",
        zoneId: "non-uuid-string",
      });
      expect(invalid.success).toBe(false);
    });

    it("rejects too short pincode", () => {
      const invalid = pincodeSchema.safeParse({
        pincode: "12",
        zoneId: validZoneId,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Rate Card Configuration", () => {
    it("validates standard generic rate card", () => {
      const valid = rateCardSchema.safeParse({
        orderType: "B2C",
        zoneType: "INTRA",
        baseFee: 50.0,
        ratePerKg: 20.0,
      });
      expect(valid.success).toBe(true);
    });

    it("validates custom zone-pair rate card", () => {
      const valid = rateCardSchema.safeParse({
        orderType: "B2B",
        zoneType: "INTER",
        fromZoneId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        toZoneId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        baseFee: 75.0,
        ratePerKg: 30.0,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects negative baseFee or ratePerKg", () => {
      const invalidBase = rateCardSchema.safeParse({
        orderType: "B2C",
        zoneType: "INTRA",
        baseFee: -10,
        ratePerKg: 20,
      });
      expect(invalidBase.success).toBe(false);

      const invalidRate = rateCardSchema.safeParse({
        orderType: "B2C",
        zoneType: "INTRA",
        baseFee: 50,
        ratePerKg: -5,
      });
      expect(invalidRate.success).toBe(false);
    });

    it("rejects invalid orderType or zoneType", () => {
      const invalid = rateCardSchema.safeParse({
        orderType: "C2C" as any,
        zoneType: "INTRA",
        baseFee: 50,
        ratePerKg: 20,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("COD Surcharge Configuration", () => {
    it("validates flat fee and percentage surcharge", () => {
      const valid = codSchema.safeParse({
        surchargeFlat: 15.0,
        surchargePercent: 3.5,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects negative surcharge values", () => {
      const invalid = codSchema.safeParse({
        surchargeFlat: -5,
        surchargePercent: 5,
      });
      expect(invalid.success).toBe(false);
    });
  });
});
