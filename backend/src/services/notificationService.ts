import { OrderStatus, Role } from "@prisma/client";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.js";

export type NotificationEvent = {
  orderId: string;
  toEmail: string;
  subject: string;
  text: string;
};

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendOrderEmail(event: NotificationEvent): Promise<void> {
  const enabled = process.env.EMAIL_ENABLED === "true";
  const transporter = enabled ? createTransport() : null;
  let status: "SENT" | "FAILED" = "SENT";
  let error: string | null = null;

  if (!enabled) {
    status = "SENT";
  } else if (!transporter) {
    status = "FAILED";
    error = "SMTP is not configured";
  } else {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "noreply@lastmile.local",
        to: event.toEmail,
        subject: event.subject,
        text: event.text,
      });
    } catch (err) {
      status = "FAILED";
      error = err instanceof Error ? err.message : "Unknown SMTP error";
    }
  }

  await prisma.notificationLog.create({
    data: {
      orderId: event.orderId,
      channel: "EMAIL",
      status,
      error,
      subject: event.subject,
    },
  });
}

export async function notifyStatusChange(orderId: string, status: OrderStatus, note?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order) return;
  await sendOrderEmail({
    orderId,
    toEmail: order.customer.email,
    subject: `Order ${orderId.slice(0, 8)} is now ${status}`,
    text: [
      `Hello ${order.customer.name},`,
      ``,
      `Your delivery order status is now: ${status}.`,
      note ? `Note: ${note}` : "",
      ``,
      `Pickup: ${order.pickupAddress} (${order.pickupPincode})`,
      `Drop: ${order.dropAddress} (${order.dropPincode})`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}
