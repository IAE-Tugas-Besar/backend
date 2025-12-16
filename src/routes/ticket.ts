import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

const router: Router = Router();

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get user's tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tickets
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        code: true,
        status: true,
        issuedAt: true,
        usedAt: true,
        concert: { select: { title: true } },
        ticketType: { select: { name: true } },
      },
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket detail by ID
 *     tags: [Tickets]
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
 *         description: Ticket detail
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const ticket = await prisma.ticket.findFirst({
      where: { id, userId },
      select: {
        id: true,
        code: true,
        status: true,
        issuedAt: true,
        usedAt: true,
        concert: { select: { title: true } },
        ticketType: { select: { name: true } },
      },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /tickets/{code}/validate:
 *   get:
 *     summary: Validate ticket by code
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket is valid
 */
router.get("/:code/validate", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { code },
      include: {
        concert: true,
        ticketType: true,
        user: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    if (ticket.status !== "ISSUED") {
      res.status(400).json({
        success: false,
        message: `Ticket is ${ticket.status}`,
      });
      return;
    }

    res.json({
      success: true,
      message: "Ticket is valid",
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /tickets/{code}/use:
 *   put:
 *     summary: Use / scan ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket successfully used
 */
router.put("/:code/use", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const ticket = await prisma.ticket.findUnique({ where: { code } });

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    if (ticket.status !== "ISSUED") {
      res.status(400).json({
        success: false,
        message: `Ticket already ${ticket.status}`,
      });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { code },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Ticket successfully used",
      data: updatedTicket,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
