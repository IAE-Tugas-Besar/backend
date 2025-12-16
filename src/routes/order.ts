import express, { Request, Response, Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { randomUUID } from "crypto";

const router: Router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - concertId
 *               - items
 *             properties:
 *               concertId:
 *                 type: string
 *                 example: "cm4concert123"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ticketTypeId
 *                     - qty
 *                   properties:
 *                     ticketTypeId:
 *                       type: string
 *                       example: "cm4ticket123"
 *                     qty:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/orders", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { concertId, items } = req.body;

    if (!concertId || !items || items.length === 0) {
      return res.status(400).json({ message: "Data order tidak lengkap" });
    }

    let grossAmount = 0;

    const orderItems = await Promise.all(
      items.map(async (item: any) => {
        const ticketType = await prisma.ticketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        if (!ticketType) {
          throw new Error("Ticket type tidak ditemukan");
        }

        const unitPrice = Number(ticketType.price);
        const subtotal = unitPrice * item.qty;

        grossAmount += subtotal;

        return {
          ticketTypeId: item.ticketTypeId,
          qty: item.qty,
          unitPrice,
          subtotal,
        };
      })
    );

    const order = await prisma.order.create({
      data: {
        userId,
        concertId,
        midtransOrderId: `ORDER-${randomUUID()}`,
        grossAmount,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get list of user orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get("/orders", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { orderItems: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Order not found
 */
router.get("/orders/:id", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { orderItems: true },
  });

  if (!order) {
    return res.status(404).json({ message: "Order tidak ditemukan" });
  }

  res.json(order);
});

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Cancel order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel order
 *       404:
 *         description: Order not found
 */
router.put(
  "/orders/:id/cancel",
  authenticate,
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "Order tidak bisa dibatalkan",
      });
    }

    const cancelled = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.json(cancelled);
  }
);

export default router;
