import { describe, expect, it } from "vitest";
import {
  applyCODSurcharge,
  calculateVolumetricWeight,
  computeChargeFromParts,
  getChargeableWeight,
  lookupRate,
  zoneTypeFor,
  type RateCardRow,
} from "./rateEngine.js";

const intraB2c: RateCardRow = {
  id: "intra-b2c",
  orderType: "B2C",
  zoneType: "INTRA",
  fromZoneId: null,
  toZoneId: null,
  baseFee: 50,
  ratePerKg: 20,
};
const interB2c: RateCardRow = {
  id: "inter-b2c",
  orderType: "B2C",
  zoneType: "INTER",
  fromZoneId: null,
  toZoneId: null,
  baseFee: 80,
  ratePerKg: 35,
};
const intraB2b: RateCardRow = {
  id: "intra-b2b",
  orderType: "B2B",
  zoneType: "INTRA",
  fromZoneId: null,
  toZoneId: null,
  baseFee: 40,
  ratePerKg: 15,
};

const cards = [intraB2c, interB2c, intraB2b];
const north = { id: "z-north", name: "North", code: "NORTH" };
const south = { id: "z-south", name: "South", code: "SOUTH" };

describe("Rate Engine Pure Functions", () => {
  describe("calculateVolumetricWeight", () => {
    it("computes volumetric weight accurately using (L×B×H)/5000", () => {
      expect(calculateVolumetricWeight(20, 15, 10)).toBe(0.6);
      expect(calculateVolumetricWeight(50, 40, 30)).toBe(12);
    });

    it("throws error for non-positive dimensions", () => {
      expect(() => calculateVolumetricWeight(0, 15, 10)).toThrow("Dimensions must be greater than zero");
      expect(() => calculateVolumetricWeight(20, -5, 10)).toThrow("Dimensions must be greater than zero");
      expect(() => calculateVolumetricWeight(20, 15, 0)).toThrow("Dimensions must be greater than zero");
    });
  });

  describe("getChargeableWeight", () => {
    it("selects volumetric weight when volumetric > actual", () => {
      expect(getChargeableWeight(0.4, 0.6)).toBe(0.6);
    });

    it("selects actual weight when actual > volumetric", () => {
      expect(getChargeableWeight(2.0, 0.6)).toBe(2.0);
    });

    it("handles tie-break when actual == volumetric", () => {
      expect(getChargeableWeight(1.5, 1.5)).toBe(1.5);
    });

    it("throws error for negative actual weight", () => {
      expect(() => getChargeableWeight(-1, 0.6)).toThrow("Actual weight cannot be negative");
    });
  });

  describe("zoneTypeFor", () => {
    it("returns INTRA when pickup and drop zones are identical", () => {
      expect(zoneTypeFor(north.id, north.id)).toBe("INTRA");
    });

    it("returns INTER when pickup and drop zones differ", () => {
      expect(zoneTypeFor(north.id, south.id)).toBe("INTER");
    });
  });

  describe("lookupRate", () => {
    it("looks up generic INTRA B2C, INTER B2C, and INTRA B2B correctly", () => {
      expect(lookupRate(cards, "B2C", north.id, north.id).id).toBe("intra-b2c");
      expect(lookupRate(cards, "B2C", north.id, south.id).id).toBe("inter-b2c");
      expect(lookupRate(cards, "B2B", north.id, north.id).id).toBe("intra-b2b");
    });

    it("prioritizes specific zone-pair rate card over generic fallback", () => {
      const pair: RateCardRow = {
        ...interB2c,
        id: "pair-override-north-south",
        fromZoneId: north.id,
        toZoneId: south.id,
        baseFee: 99,
      };
      expect(lookupRate([...cards, pair], "B2C", north.id, south.id).id).toBe("pair-override-north-south");
    });

    it("throws descriptive error when no rate card matches", () => {
      expect(() => lookupRate(cards, "B2B", north.id, south.id)).toThrow("No rate card for B2B INTER");
    });
  });

  describe("applyCODSurcharge", () => {
    it("returns zero surcharge for PREPAID orders", () => {
      const res = applyCODSurcharge(62, "PREPAID", { orderType: "B2C", surchargeFlat: 10, surchargePercent: 5 });
      expect(res).toEqual({ codSurcharge: 0, flat: 0, percent: 0 });
    });

    it("computes flat fee + percentage surcharge for COD orders", () => {
      const res = applyCODSurcharge(62, "COD", { orderType: "B2C", surchargeFlat: 10, surchargePercent: 5 });
      // 10 + (62 * 0.05) = 10 + 3.10 = 13.10
      expect(res.codSurcharge).toBe(13.1);
      expect(res.flat).toBe(10);
      expect(res.percent).toBe(5);
    });

    it("computes flat fee only when percentage is zero", () => {
      const res = applyCODSurcharge(100, "COD", { orderType: "B2C", surchargeFlat: 25, surchargePercent: 0 });
      expect(res.codSurcharge).toBe(25);
    });

    it("throws error when COD config is missing for COD order", () => {
      expect(() => applyCODSurcharge(62, "COD", undefined)).toThrow("COD config missing");
    });
  });

  describe("computeChargeFromParts End-to-End Formulas", () => {
    it("calculates exact worked example from spec (B2C INTRA COD 20×15×10, actual 0.4kg → 75.10)", () => {
      const breakdown = computeChargeFromParts({
        pickupPincode: "110001",
        dropPincode: "110021",
        pickupZone: north,
        dropZone: north,
        orderType: "B2C",
        paymentType: "COD",
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 0.4,
        rateCard: intraB2c,
        codConfig: { orderType: "B2C", surchargeFlat: 10, surchargePercent: 5 },
      });

      expect(breakdown.volumetricWeight).toBe(0.6);
      expect(breakdown.chargeableWeight).toBe(0.6);
      expect(breakdown.weightCharge).toBe(12.0);
      expect(breakdown.subtotal).toBe(62.0);
      expect(breakdown.codSurcharge).toBe(13.1);
      expect(breakdown.total).toBe(75.1);
      expect(breakdown.zoneType).toBe("INTRA");
    });

    it("calculates B2C INTER PREPAID with chargeable weight based on actual weight", () => {
      const breakdown = computeChargeFromParts({
        pickupPincode: "110001",
        dropPincode: "560001",
        pickupZone: north,
        dropZone: south,
        orderType: "B2C",
        paymentType: "PREPAID",
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeight: 2.0, // actual 2.0 > volumetric 0.6
        rateCard: interB2c, // base 80, ratePerKg 35
        codConfig: { orderType: "B2C", surchargeFlat: 10, surchargePercent: 5 },
      });

      expect(breakdown.volumetricWeight).toBe(0.6);
      expect(breakdown.chargeableWeight).toBe(2.0);
      expect(breakdown.weightCharge).toBe(70.0); // 2.0 * 35 = 70.0
      expect(breakdown.subtotal).toBe(150.0); // 80 + 70 = 150
      expect(breakdown.codSurcharge).toBe(0);
      expect(breakdown.total).toBe(150.0);
      expect(breakdown.zoneType).toBe("INTER");
    });
  });
});
