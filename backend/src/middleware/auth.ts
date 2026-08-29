import { createClerkClient, verifyToken } from "@clerk/express";
import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign(user, secret, { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"] });
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;

const clerkClient = clerkSecretKey
  ? createClerkClient({
      secretKey: clerkSecretKey,
      publishableKey: clerkPublishableKey,
    })
  : null;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  const rawToken = header.slice(7).trim();
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;

  // 1. Attempt Clerk Token Verification if configured
  if (clerkSecretKey && !clerkSecretKey.includes("YOUR_SECRET_KEY")) {
    try {
      const claims = await verifyToken(rawToken, {
        secretKey: clerkSecretKey,
      });

      if (claims && claims.sub) {
        const clerkUserId = claims.sub;

        // Find user by clerkUserId or email
        let dbUser = await prisma.user.findUnique({
          where: { clerkUserId },
        });

        if (!dbUser) {
          const clerkClient = createClerkClient({
            secretKey: clerkSecretKey,
            publishableKey: clerkPublishableKey,
          });
          // Fetch user details from Clerk to get email & name
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
          const name =
            `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
            email?.split("@")[0] ||
            "ZoneDrop Customer";

          if (email) {
            // Check if existing user by email
            const existingByEmail = await prisma.user.findUnique({ where: { email } });
            if (existingByEmail) {
              dbUser = await prisma.user.update({
                where: { id: existingByEmail.id },
                data: { clerkUserId },
              });
            } else {
              // JIT Provision new Customer
              dbUser = await prisma.user.create({
                data: {
                  clerkUserId,
                  email,
                  name,
                  role: "CUSTOMER",
                },
              });
            }
          }
        }

        if (dbUser) {
          req.user = {
            id: dbUser.id,
            role: dbUser.role,
            email: dbUser.email,
            name: dbUser.name,
          };
          return next();
        }
      }
    } catch {
      // Not a valid Clerk token, fall through to custom JWT verification
    }
  }

  // 2. Fallback: Verify legacy custom JWT token (for seeded demo accounts)
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    const payload = jwt.verify(rawToken, secret) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden for this role" });
      return;
    }
    next();
  };
}

export async function canAccessOrder(user: AuthUser, orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "CUSTOMER") return order.customerId === user.id;
  if (user.role === "AGENT") return order.assignedAgentId === user.id;
  return false;
}
