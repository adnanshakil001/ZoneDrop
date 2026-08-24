import { prisma } from "../lib/prisma.js";
import {
  computeChargeFromParts,
  lookupRate,
  type ChargeBreakdown,
  type CodConfigRow,
  type OrderType,
  type PaymentType,
  type RateCardRow,
} from "./rateEngine.js";

function money(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export async function detectZone(pincode: string) {
  const normalized = pincode.trim().toUpperCase();
  const map = await prisma.pincodeZoneMap.findUnique({
    where: { pincode: normalized },
    include: { zone: true },
  });
  if (!map) {
    throw new Error(`Pincode ${normalized} is not mapped to a zone. Ask an admin to add it.`);
  }
  return { id: map.zone.id, name: map.zone.name, code: map.zone.code };
}

export async function calculateOrderCharge(input: {
  pickupPincode: string;
  dropPincode: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeight: number;
  orderType: OrderType;
  paymentType: PaymentType;
}): Promise<ChargeBreakdown> {
  const pickupPincode = input.pickupPincode.trim().toUpperCase();
  const dropPincode = input.dropPincode.trim().toUpperCase();
  const pickupZone = await detectZone(pickupPincode);
  const dropZone = await detectZone(dropPincode);

  const cardsRaw = await prisma.rateCard.findMany({
    where: { orderType: input.orderType },
  });
  const cards: RateCardRow[] = cardsRaw.map((c) => ({
    id: c.id,
    orderType: c.orderType,
    zoneType: c.zoneType,
    fromZoneId: c.fromZoneId,
    toZoneId: c.toZoneId,
    baseFee: money(c.baseFee),
    ratePerKg: money(c.ratePerKg),
  }));
  const rateCard = lookupRate(cards, input.orderType, pickupZone.id, dropZone.id);

  const codRaw = await prisma.codConfig.findUnique({ where: { orderType: input.orderType } });
  const codConfig: CodConfigRow | undefined = codRaw
    ? {
        orderType: codRaw.orderType,
        surchargeFlat: money(codRaw.surchargeFlat),
        surchargePercent: money(codRaw.surchargePercent),
      }
    : undefined;

  return computeChargeFromParts({
    pickupPincode: input.pickupPincode,
    dropPincode: input.dropPincode,
    pickupZone,
    dropZone,
    orderType: input.orderType,
    paymentType: input.paymentType,
    lengthCm: input.lengthCm,
    breadthCm: input.breadthCm,
    heightCm: input.heightCm,
    actualWeight: input.actualWeight,
    rateCard,
    codConfig,
  });
}
