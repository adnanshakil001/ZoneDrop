import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).transform((s) => s.trim()),
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(6),
  phone: z.string().optional().transform((s) => s?.trim()),
});

const loginSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      phone: parsed.data.phone,
      role: "CUSTOMER",
    },
  });
  const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
});

authRouter.patch("/availability", requireAuth, async (req, res) => {
  if (req.user!.role !== "AGENT") {
    res.status(403).json({ error: "Only agents can toggle availability" });
    return;
  }
  const isAvailable = Boolean(req.body?.isAvailable);
  const profile = await prisma.agentProfile.update({
    where: { userId: req.user!.id },
    data: { isAvailable },
  });
  res.json(profile);
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { agentProfile: { include: { currentZone: true } } },
  });
  res.json({
    id: user!.id,
    name: user!.name,
    email: user!.email,
    role: user!.role,
    phone: user!.phone,
    agentProfile: user!.agentProfile,
  });
});
