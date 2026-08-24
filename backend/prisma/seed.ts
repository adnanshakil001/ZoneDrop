import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const north = await prisma.zone.upsert({
    where: { code: "NORTH" },
    update: {},
    create: { name: "North", code: "NORTH" },
  });
  const south = await prisma.zone.upsert({
    where: { code: "SOUTH" },
    update: {},
    create: { name: "South", code: "SOUTH" },
  });
  const central = await prisma.zone.upsert({
    where: { code: "CENTRAL" },
    update: {},
    create: { name: "Central", code: "CENTRAL" },
  });

  const pincodes = [
    { pincode: "110001", areaName: "Connaught Place", zoneId: north.id },
    { pincode: "110021", areaName: "Chanakyapuri", zoneId: north.id },
    { pincode: "560001", areaName: "Bengaluru GPO", zoneId: south.id },
    { pincode: "560034", areaName: "Koramangala", zoneId: south.id },
    { pincode: "400001", areaName: "Fort Mumbai", zoneId: central.id },
    { pincode: "400050", areaName: "Bandra", zoneId: central.id },
  ];
  for (const p of pincodes) {
    await prisma.pincodeZoneMap.upsert({
      where: { pincode: p.pincode },
      update: { zoneId: p.zoneId, areaName: p.areaName },
      create: p,
    });
  }

  const cards = [
    { orderType: "B2C" as const, zoneType: "INTRA" as const, baseFee: 50, ratePerKg: 20 },
    { orderType: "B2C" as const, zoneType: "INTER" as const, baseFee: 80, ratePerKg: 35 },
    { orderType: "B2B" as const, zoneType: "INTRA" as const, baseFee: 40, ratePerKg: 15 },
    { orderType: "B2B" as const, zoneType: "INTER" as const, baseFee: 70, ratePerKg: 28 },
  ];
  for (const c of cards) {
    const existing = await prisma.rateCard.findFirst({
      where: { orderType: c.orderType, zoneType: c.zoneType, fromZoneId: null, toZoneId: null },
    });
    if (!existing) await prisma.rateCard.create({ data: c });
  }

  await prisma.codConfig.upsert({
    where: { orderType: "B2C" },
    update: { surchargeFlat: 10, surchargePercent: 5 },
    create: { orderType: "B2C", surchargeFlat: 10, surchargePercent: 5 },
  });
  await prisma.codConfig.upsert({
    where: { orderType: "B2B" },
    update: { surchargeFlat: 20, surchargePercent: 2 },
    create: { orderType: "B2B", surchargeFlat: 20, surchargePercent: 2 },
  });

  await prisma.user.upsert({
    where: { email: "admin@lastmile.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@lastmile.com",
      passwordHash,
      role: "ADMIN",
      phone: "9999999999",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@lastmile.com" },
    update: {},
    create: {
      name: "Ada Customer",
      email: "customer@lastmile.com",
      passwordHash,
      role: "CUSTOMER",
      phone: "9000000001",
    },
  });

  const agentA = await prisma.user.upsert({
    where: { email: "agent.north@lastmile.com" },
    update: {},
    create: {
      name: "North Agent",
      email: "agent.north@lastmile.com",
      passwordHash,
      role: "AGENT",
      phone: "9000000002",
      agentProfile: { create: { currentZoneId: north.id, isAvailable: true, maxActiveOrders: 5 } },
    },
  });
  if (!(await prisma.agentProfile.findUnique({ where: { userId: agentA.id } }))) {
    await prisma.agentProfile.create({
      data: { userId: agentA.id, currentZoneId: north.id, isAvailable: true, maxActiveOrders: 5 },
    });
  }

  const agentB = await prisma.user.upsert({
    where: { email: "agent.south@lastmile.com" },
    update: {},
    create: {
      name: "South Agent",
      email: "agent.south@lastmile.com",
      passwordHash,
      role: "AGENT",
      phone: "9000000003",
      agentProfile: { create: { currentZoneId: south.id, isAvailable: true, maxActiveOrders: 3 } },
    },
  });
  if (!(await prisma.agentProfile.findUnique({ where: { userId: agentB.id } }))) {
    await prisma.agentProfile.create({
      data: { userId: agentB.id, currentZoneId: south.id, isAvailable: true, maxActiveOrders: 3 },
    });
  }

  console.log("Seed complete. Login with password123:");
  console.log("  admin@lastmile.com");
  console.log("  customer@lastmile.com");
  console.log("  agent.north@lastmile.com");
  console.log("  agent.south@lastmile.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
