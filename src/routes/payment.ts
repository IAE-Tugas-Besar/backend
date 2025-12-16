import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { snap } from "../config/midtrans";
import crypto from "crypto";

const router: Router = Router();

// Helper to generate unique ticket code
const generateTicketCode = (): string => {
  return `TKT-${crypto
    .randomUUID()
    .toUpperCase()
    .replace(/-/g, "")
    .slice(0, 12)}`;
};

/**
 * @swagger
 * /payments/{orderId}/create:
 *   post:
 *     summary: Create Midtrans Snap payment token
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to pay
 *     responses:
 *       200:
 *         description: Snap token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Midtrans Snap token
 *                     redirect_url:
 *                       type: string
 *                       description: Redirect URL for payment
 *       400:
 *         description: Order already paid or cancelled
 *       404:
 *         description: Order not found
 */
router.post(
  "/:orderId/create",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id;

      // Find order with relations
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
          user: true,
          concert: true,
          orderItems: {
            include: {
              ticketType: true,
            },
          },
        },
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found",
        });
        return;
      }

      // Check if order is in valid state for payment
      if (order.status !== "PENDING") {
        res.status(400).json({
          success: false,
          message: `Order cannot be paid. Current status: ${order.status}`,
        });
        return;
      }

      // Check if order has expired
      if (new Date() > order.expiresAt) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "EXPIRED" },
        });
        res.status(400).json({
          success: false,
          message: "Order has expired",
        });
        return;
      }

      // Build Midtrans transaction payload
      const transactionDetails = {
        order_id: order.midtransOrderId,
        gross_amount: Number(order.grossAmount),
      };

      const itemDetails = order.orderItems.map((item) => ({
        id: item.ticketTypeId,
        price: Number(item.unitPrice),
        quantity: item.qty,
        name: `${order.concert.title} - ${item.ticketType.name}`,
      }));

      const customerDetails = {
        first_name: order.user.name,
        email: order.user.email,
      };

      const parameter = {
        transaction_details: transactionDetails,
        item_details: itemDetails,
        customer_details: customerDetails,
      };

      // Create Snap transaction
      const transaction = await snap.createTransaction(parameter);

      // Update order status to AWAITING_PAYMENT
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "AWAITING_PAYMENT" },
      });

      // Create or update payment record
      await prisma.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          provider: "MIDTRANS",
          status: "PENDING",
          snapToken: transaction.token,
        },
        update: {
          snapToken: transaction.token,
          status: "PENDING",
        },
      });

      res.json({
        success: true,
        data: {
          token: transaction.token,
          redirect_url: transaction.redirect_url,
        },
      });
    } catch (error) {
      console.error("Create payment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create payment",
      });
    }
  }
);

/**
 * @swagger
 * /payments/{orderId}:
 *   get:
 *     summary: Get payment status for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 *       404:
 *         description: Payment not found
 */
router.get("/:orderId", authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        order: { userId },
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        provider: payment.provider,
        snapToken: payment.snapToken,
        transactionStatus: payment.transactionStatus,
        orderStatus: payment.order.status,
      },
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Midtrans payment notification webhook
 *     tags: [Payments]
 *     description: |
 *       This endpoint receives payment notifications from Midtrans.
 *       Configure this URL in Midtrans Dashboard > Settings > Configuration > Payment Notification URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const notification = req.body;

    console.log(
      "Midtrans webhook received:",
      JSON.stringify(notification, null, 2)
    );

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Find order by midtransOrderId
    const order = await prisma.order.findFirst({
      where: { midtransOrderId: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      console.error("Order not found for midtransOrderId:", orderId);
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Determine payment status based on transaction status
    let paymentStatus:
      | "PENDING"
      | "SETTLED"
      | "FAILED"
      | "EXPIRED"
      | "CANCELLED" = "PENDING";
    let orderStatus = order.status;

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept" || !fraudStatus) {
        paymentStatus = "SETTLED";
        orderStatus = "PAID";
      } else {
        paymentStatus = "FAILED";
        orderStatus = "CANCELLED";
      }
    } else if (transactionStatus === "pending") {
      paymentStatus = "PENDING";
      orderStatus = "AWAITING_PAYMENT";
    } else if (transactionStatus === "deny" || transactionStatus === "cancel") {
      paymentStatus = "CANCELLED";
      orderStatus = "CANCELLED";
    } else if (transactionStatus === "expire") {
      paymentStatus = "EXPIRED";
      orderStatus = "EXPIRED";
    } else if (transactionStatus === "refund") {
      paymentStatus = "CANCELLED";
      orderStatus = "REFUNDED";
    }

    // Update payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: "MIDTRANS",
        status: paymentStatus,
        transactionStatus,
        fraudStatus,
        rawPayloadJson: notification,
      },
      update: {
        status: paymentStatus,
        transactionStatus,
        fraudStatus,
        rawPayloadJson: notification,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: orderStatus },
    });

    // If payment is successful, generate tickets
    if (paymentStatus === "SETTLED" && orderStatus === "PAID") {
      console.log("Payment successful, generating tickets...");

      const ticketsToCreate = [];
      for (const item of order.orderItems) {
        for (let i = 0; i < item.qty; i++) {
          ticketsToCreate.push({
            orderId: order.id,
            userId: order.userId,
            concertId: order.concertId,
            ticketTypeId: item.ticketTypeId,
            code: generateTicketCode(),
            status: "ISSUED" as const,
          });
        }
      }

      if (ticketsToCreate.length > 0) {
        await prisma.ticket.createMany({ data: ticketsToCreate });
        console.log(
          `Created ${ticketsToCreate.length} tickets for order ${order.id}`
        );

        // Update ticket type sold count
        for (const item of order.orderItems) {
          await prisma.ticketType.update({
            where: { id: item.ticketTypeId },
            data: {
              quotaSold: {
                increment: item.qty,
              },
            },
          });
        }
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});

export default router;
