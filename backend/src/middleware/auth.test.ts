import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { canAccessOrder, requireRole, signToken, type AuthUser } from "./auth.js";
import { prisma } from "../lib/prisma.js";

process.env.JWT_SECRET = "test-jwt-secret-key-12345";
process.env.JWT_EXPIRES_IN = "1d";

describe("Auth & RBAC Middleware", () => {
  const customerUser: AuthUser = {
    id: "user-cust-1",
    name: "Customer One",
    email: "customer@example.com",
    role: "CUSTOMER",
  };

  const agentUser: AuthUser = {
    id: "user-agent-1",
    name: "Agent One",
    email: "agent@example.com",
    role: "AGENT",
  };

  const adminUser: AuthUser = {
    id: "user-admin-1",
    name: "Admin One",
    email: "admin@example.com",
    role: "ADMIN",
  };

  describe("signToken", () => {
    it("signs a JWT token that decodes correctly", () => {
      const token = signToken(customerUser);
      expect(typeof token).toBe("string");
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
      expect(decoded.id).toBe(customerUser.id);
      expect(decoded.email).toBe(customerUser.email);
      expect(decoded.role).toBe(customerUser.role);
    });
  });

  describe("requireRole middleware guard", () => {
    it("calls next() when user role matches allowed roles", () => {
      const middleware = requireRole("ADMIN", "AGENT");
      const req: any = { user: adminUser };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 Forbidden when user role is not allowed", () => {
      const middleware = requireRole("ADMIN");
      const req: any = { user: customerUser };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden for this role" });
    });

    it("returns 401 Unauthenticated when req.user is missing", () => {
      const middleware = requireRole("CUSTOMER");
      const req: any = {};
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthenticated" });
    });
  });

  describe("canAccessOrder IDOR ownership validation", () => {
    it("grants Admin unrestricted access to any order", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-1",
        customerId: "user-cust-99",
        assignedAgentId: "user-agent-99",
      } as any);

      const allowed = await canAccessOrder(adminUser, "order-1");
      expect(allowed).toBe(true);
    });

    it("grants Customer access only to their own order", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-1",
        customerId: customerUser.id,
        assignedAgentId: "user-agent-99",
      } as any);

      const allowed = await canAccessOrder(customerUser, "order-1");
      expect(allowed).toBe(true);
    });

    it("rejects Customer trying to access another customer's order (IDOR)", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-2",
        customerId: "different-customer-id",
        assignedAgentId: "user-agent-99",
      } as any);

      const allowed = await canAccessOrder(customerUser, "order-2");
      expect(allowed).toBe(false);
    });

    it("grants Agent access only to orders assigned to them", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-3",
        customerId: customerUser.id,
        assignedAgentId: agentUser.id,
      } as any);

      const allowed = await canAccessOrder(agentUser, "order-3");
      expect(allowed).toBe(true);
    });

    it("rejects Agent trying to access an order assigned to a different agent", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: "order-4",
        customerId: customerUser.id,
        assignedAgentId: "different-agent-id",
      } as any);

      const allowed = await canAccessOrder(agentUser, "order-4");
      expect(allowed).toBe(false);
    });

    it("returns false if order does not exist", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce(null);

      const allowed = await canAccessOrder(customerUser, "non-existent-order");
      expect(allowed).toBe(false);
    });
  });
});
