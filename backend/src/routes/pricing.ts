import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const rateCardsRouter = Router();
rateCardsRouter.use(requireAuth, requireRole("ADMIN"));

const schema = z.object({
  orderType: z.enum(["B2B", "B2C"]),
  zoneType: z.enum(["INTRA", "INTER"]),
  fromZoneId: z.string().uuid().nullable().optional(),
  toZoneId: z.string().uuid().nullable().optional(),
  baseFee: z.number().nonnegative(),
  ratePerKg: z.number().nonnegative(),
});

rateCardsRouter.get("/", async (_req, res) => {
  const cards = await prisma.rateCard.findMany({
    include: { fromZone: true, toZone: true },
    orderBy: [{ orderType: "asc" }, { zoneType: "asc" }],
  });
  res.json(cards);
});

rateCardsRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const card = await prisma.rateCard.create({ data: parsed.data });
  res.status(201).json(card);
});

rateCardsRouter.patch("/:id", async (req, res) => {
  const id = req.params.id as string;
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const card = await prisma.rateCard.update({ where: { id }, data: parsed.data });
  res.json(card);
});

rateCardsRouter.delete("/:id", async (req, res) => {
  const id = req.params.id as string;
  await prisma.rateCard.delete({ where: { id } });
  res.status(204).end();
});

export const codRouter = Router();
codRouter.use(requireAuth, requireRole("ADMIN"));

codRouter.get("/", async (_req, res) => {
  res.json(await prisma.codConfig.findMany({ orderBy: { orderType: "asc" } }));
});

codRouter.put("/:orderType", async (req, res) => {
  const orderType = z.enum(["B2B", "B2C"]).safeParse(req.params.orderType);
  const body = z
    .object({
      surchargeFlat: z.number().nonnegative(),
      surchargePercent: z.number().nonnegative(),
    })
    .safeParse(req.body);
  if (!orderType.success || !body.success) {
    res.status(400).json({ error: "Invalid COD config" });
    return;
  }
  const row = await prisma.codConfig.upsert({
    where: { orderType: orderType.data },
    create: { orderType: orderType.data, ...body.data },
    update: body.data,
  });
  res.json(row);
});
