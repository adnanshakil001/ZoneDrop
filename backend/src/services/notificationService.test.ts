import { describe, expect, it, vi } from "vitest";
import { prisma } from "../lib/prisma.js";
import {
  notifyStatusChange,
  sendOrderEmail,
  type NotificationEvent,
} from "./notificationService.js";

describe("Decoupled Notification Subsystem", () => {
  const orderId = "order-notif-101";

  describe("sendOrderEmail", () => {
    it("creates a SENT log in NotificationLog when email is processed", async () => {
      const createSpy = vi.spyOn(prisma.notificationLog, "create").mockResolvedValueOnce({
        id: "log-1",
        orderId,
        channel: "EMAIL",
        status: "SENT",
        subject: "Order Updated",
        error: null,
        sentAt: new Date(),
      } as any);

      const event: NotificationEvent = {
        orderId,
        toEmail: "customer@example.com",
        subject: "Order Updated",
        text: "Your shipment has been picked up.",
      };

      await sendOrderEmail(event);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          orderId,
          channel: "EMAIL",
          status: "SENT",
          error: null,
          subject: "Order Updated",
        },
      });
    });

    it("records FAILED in NotificationLog without throwing exception when SMTP fails", async () => {
      process.env.EMAIL_ENABLED = "true";
      process.env.SMTP_HOST = ""; // Missing config

      const createSpy = vi.spyOn(prisma.notificationLog, "create").mockResolvedValueOnce({
        id: "log-2",
        orderId,
        channel: "EMAIL",
        status: "FAILED",
        subject: "Order Update",
        error: "SMTP is not configured",
        sentAt: new Date(),
      } as any);

      const event: NotificationEvent = {
        orderId,
        toEmail: "customer@example.com",
        subject: "Order Update",
        text: "Status changed",
      };

      // Execution MUST NOT throw an exception to caller
      await expect(sendOrderEmail(event)).resolves.not.toThrow();

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          orderId,
          channel: "EMAIL",
          status: "FAILED",
          error: "SMTP is not configured",
          subject: "Order Update",
        },
      });

      process.env.EMAIL_ENABLED = "false";
    });
  });

  describe("notifyStatusChange event triggers", () => {
    it("fetches order recipient and sends status change email", async () => {
      vi.spyOn(prisma.order, "findUnique").mockResolvedValueOnce({
        id: orderId,
        pickupAddress: "123 Hub Lane",
        dropAddress: "456 Destination Ave",
        pickupPincode: "110001",
        dropPincode: "110021",
        customer: {
          id: "cust-1",
          name: "John Doe",
          email: "john@example.com",
        },
      } as any);

      const logSpy = vi.spyOn(prisma.notificationLog, "create").mockResolvedValueOnce({
        id: "log-3",
        orderId,
        channel: "EMAIL",
        status: "SENT",
        subject: `Order ${orderId.slice(0, 8)} is now OUT_FOR_DELIVERY`,
        error: null,
        sentAt: new Date(),
      } as any);

      await notifyStatusChange(orderId, "OUT_FOR_DELIVERY", "Agent is on the way");

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId,
            channel: "EMAIL",
            status: "SENT",
            subject: `Order ${orderId.slice(0, 8)} is now OUT_FOR_DELIVERY`,
          }),
        })
      );
    });
  });
});
