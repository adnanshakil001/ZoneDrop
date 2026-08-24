import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const zonesRouter = Router();
zonesRouter.use(requireAuth);

zonesRouter.get("/", async (_req, res) => {
  const zones = await prisma.zone.findMany({
    include: { pincodes: true },
    orderBy: { name: "asc" },
  });
  res.json(zones);
});

zonesRouter.post("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = z.object({ name: z.string().min(1), code: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const zone = await prisma.zone.create({
    data: { name: parsed.data.name, code: parsed.data.code.toUpperCase() },
  });
  res.status(201).json(zone);
});

zonesRouter.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const parsed = z.object({ name: z.string().min(1).optional(), code: z.string().min(1).optional() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const zone = await prisma.zone.update({
    where: { id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.code ? { code: parsed.data.code.toUpperCase() } : {}),
    },
  });
  res.json(zone);
});

zonesRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  await prisma.zone.delete({ where: { id } });
  res.status(204).end();
});

export const pincodesRouter = Router();
pincodesRouter.use(requireAuth);

pincodesRouter.get("/", async (_req, res) => {
  const maps = await prisma.pincodeZoneMap.findMany({ include: { zone: true }, orderBy: { pincode: "asc" } });
  res.json(maps);
});

pincodesRouter.post("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = z
    .object({ pincode: z.string().min(3), zoneId: z.string().uuid(), areaName: z.string().optional() })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const row = await prisma.pincodeZoneMap.create({
    data: {
      pincode: parsed.data.pincode,
      zoneId: parsed.data.zoneId,
      areaName: parsed.data.areaName,
    },
    include: { zone: true },
  });
  res.status(201).json(row);
});

pincodesRouter.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const parsed = z
    .object({
      pincode: z.string().min(3).optional(),
      zoneId: z.string().uuid().optional(),
      areaName: z.string().nullable().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const row = await prisma.pincodeZoneMap.update({
    where: { id },
    data: parsed.data,
    include: { zone: true },
  });
  res.json(row);
});

pincodesRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  await prisma.pincodeZoneMap.delete({ where: { id } });
  res.status(204).end();
});
