export const VOLUMETRIC_DIVISOR = 5000;

export type OrderType = "B2B" | "B2C";
export type PaymentType = "PREPAID" | "COD";
export type ZoneType = "INTRA" | "INTER";

export type RateCardRow = {
  id: string;
  orderType: OrderType;
  zoneType: ZoneType;
  fromZoneId: string | null;
  toZoneId: string | null;
  baseFee: number;
  ratePerKg: number;
};

export type CodConfigRow = {
  orderType: OrderType;
  surchargeFlat: number;
  surchargePercent: number;
};

export type ChargeBreakdown = {
  pickupPincode: string;
  dropPincode: string;
  pickupZone: { id: string; name: string; code: string };
  dropZone: { id: string; name: string; code: string };
  zoneType: ZoneType;
  orderType: OrderType;
  paymentType: PaymentType;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  volumetricDivisor: number;
  rateCardId: string;
  baseFee: number;
  ratePerKg: number;
  weightCharge: number;
  subtotal: number;
  codSurchargeFlat: number;
  codSurchargePercent: number;
  codSurcharge: number;
  total: number;
};

export function calculateVolumetricWeight(lengthCm: number, breadthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) {
    throw new Error("Dimensions must be greater than zero");
  }
  return round3((lengthCm * breadthCm * heightCm) / VOLUMETRIC_DIVISOR);
}

export function getChargeableWeight(actualWeight: number, volumetricWeight: number): number {
  if (actualWeight < 0) throw new Error("Actual weight cannot be negative");
  return round3(Math.max(actualWeight, volumetricWeight));
}

export function zoneTypeFor(pickupZoneId: string, dropZoneId: string): ZoneType {
  return pickupZoneId === dropZoneId ? "INTRA" : "INTER";
}

export function lookupRate(
  cards: RateCardRow[],
  orderType: OrderType,
  pickupZoneId: string,
  dropZoneId: string
): RateCardRow {
  const zoneType = zoneTypeFor(pickupZoneId, dropZoneId);
  const matching = cards.filter((c) => c.orderType === orderType && c.zoneType === zoneType);
  const pair = matching.find((c) => c.fromZoneId === pickupZoneId && c.toZoneId === dropZoneId);
  if (pair) return pair;
  const generic = matching.find((c) => c.fromZoneId == null && c.toZoneId == null);
  if (generic) return generic;
  throw new Error(`No rate card for ${orderType} ${zoneType} (admin must configure one)`);
}

export function applyCODSurcharge(
  subtotal: number,
  paymentType: PaymentType,
  config: CodConfigRow | undefined
): { codSurcharge: number; flat: number; percent: number } {
  if (paymentType !== "COD") {
    return { codSurcharge: 0, flat: 0, percent: 0 };
  }
  if (!config) {
    throw new Error("COD config missing for this order type (admin must configure it)");
  }
  const flat = config.surchargeFlat;
  const percent = config.surchargePercent;
  const codSurcharge = round2(flat + subtotal * (percent / 100));
  return { codSurcharge, flat, percent };
}

export function computeChargeFromParts(input: {
  pickupPincode: string;
  dropPincode: string;
  pickupZone: ChargeBreakdown["pickupZone"];
  dropZone: ChargeBreakdown["dropZone"];
  orderType: OrderType;
  paymentType: PaymentType;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeight: number;
  rateCard: RateCardRow;
  codConfig: CodConfigRow | undefined;
}): ChargeBreakdown {
  const volumetricWeight = calculateVolumetricWeight(input.lengthCm, input.breadthCm, input.heightCm);
  const chargeableWeight = getChargeableWeight(input.actualWeight, volumetricWeight);
  const zoneType = zoneTypeFor(input.pickupZone.id, input.dropZone.id);
  const weightCharge = round2(chargeableWeight * input.rateCard.ratePerKg);
  const subtotal = round2(input.rateCard.baseFee + weightCharge);
  const { codSurcharge, flat, percent } = applyCODSurcharge(subtotal, input.paymentType, input.codConfig);
  const total = round2(subtotal + codSurcharge);

  return {
    pickupPincode: input.pickupPincode,
    dropPincode: input.dropPincode,
    pickupZone: input.pickupZone,
    dropZone: input.dropZone,
    zoneType,
    orderType: input.orderType,
    paymentType: input.paymentType,
    lengthCm: input.lengthCm,
    breadthCm: input.breadthCm,
    heightCm: input.heightCm,
    actualWeight: input.actualWeight,
    volumetricWeight,
    chargeableWeight,
    volumetricDivisor: VOLUMETRIC_DIVISOR,
    rateCardId: input.rateCard.id,
    baseFee: input.rateCard.baseFee,
    ratePerKg: input.rateCard.ratePerKg,
    weightCharge,
    subtotal,
    codSurchargeFlat: flat,
    codSurchargePercent: percent,
    codSurcharge,
    total,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
