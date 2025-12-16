import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";
import path from "path";

const router: Router = Router();

/**
 * @swagger
 * /concerts:
 *   get:
 *     summary: List semua konser dengan filter, search, dan pagination
 *     tags: [Concert]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title atau venue
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ENDED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List konser berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Concert'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.concert.count({ where });

    // Get concerts with ticket types
    const concerts = await prisma.concert.findMany({
      where,
      skip,
      take: limit,
      include: {
        ticketTypes: true,
      },
      orderBy: {
        startAt: "asc",
      },
    });

    res.json({
      success: true,
      data: concerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get concerts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /concerts:
 *   post:
 *     summary: Membuat konser baru
 *     tags: [Concert]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, venue, startAt, endAt]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Rock Festival 2025
 *               venue:
 *                 type: string
 *                 example: Jakarta International Stadium
 *               startAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *                 example: The biggest rock festival
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Concert image (JPEG, PNG, GIF, WebP - max 5MB)
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ENDED]
 *     responses:
 *       201:
 *         description: Konser berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Concert'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/", authenticate, requireAdmin, uploadSingle, async (req: Request, res: Response) => {
  try {
    const { title, venue, startAt, endAt, description, status } = req.body;
    const file = req.file;

    // Validate required fields
    if (!title || !venue || !startAt || !endAt) {
      res.status(400).json({
        success: false,
        message: "Title, venue, startAt, and endAt are required",
      });
      return;
    }

    // Validate dates
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
      return;
    }

    if (startDate >= endDate) {
      res.status(400).json({
        success: false,
        message: "endAt must be after startAt",
      });
      return;
    }

    // Generate image URL if file is uploaded
    let imageUrl: string | undefined;
    if (file) {
      // Construct URL: /uploads/concerts/filename
      imageUrl = `/uploads/concerts/${file.filename}`;
    }

    const concert = await prisma.concert.create({
      data: {
        title,
        venue,
        startAt: startDate,
        endAt: endDate,
        description,
        imageUrl,
        status: status || "DRAFT",
      },
      include: {
        ticketTypes: true,
      },
    });

    res.status(201).json({
      success: true,
      data: concert,
    });
  } catch (error) {
    console.error("Create concert error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /concerts/{id}:
 *   get:
 *     summary: Menampilkan detail konser tertentu
 *     tags: [Concert]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Concert ID
 *     responses:
 *       200:
 *         description: Detail konser berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Concert'
 *       404:
 *         description: Konser tidak ditemukan
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const concert = await prisma.concert.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
      },
    });

    if (!concert) {
      res.status(404).json({
        success: false,
        message: "Concert not found",
      });
      return;
    }

    res.json({
      success: true,
      data: concert,
    });
  } catch (error) {
    console.error("Get concert error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /concerts/{id}:
 *   put:
 *     summary: Memperbarui detail konser tertentu
 *     tags: [Concert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Concert ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               venue:
 *                 type: string
 *               startAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Concert image (JPEG, PNG, GIF, WebP - max 5MB)
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ENDED]
 *     responses:
 *       200:
 *         description: Konser berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Concert'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Konser tidak ditemukan
 */
router.put("/:id", authenticate, requireAdmin, uploadSingle, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, venue, startAt, endAt, description, status } = req.body;
    const file = req.file;

    // Check if concert exists
    const existingConcert = await prisma.concert.findUnique({
      where: { id },
    });

    if (!existingConcert) {
      res.status(404).json({
        success: false,
        message: "Concert not found",
      });
      return;
    }

    // Build update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (venue !== undefined) updateData.venue = venue;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    // Handle image upload
    if (file) {
      // Delete old image if exists
      if (existingConcert.imageUrl) {
        const fs = require("fs");
        const oldImagePath = path.join(
          process.cwd(),
          existingConcert.imageUrl.replace(/^\//, "")
        );
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }
      // Set new image URL
      updateData.imageUrl = `/uploads/concerts/${file.filename}`;
    }

    if (startAt !== undefined) {
      const startDate = new Date(startAt);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid startAt date format",
        });
        return;
      }
      updateData.startAt = startDate;
    }

    if (endAt !== undefined) {
      const endDate = new Date(endAt);
      if (isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid endAt date format",
        });
        return;
      }
      updateData.endAt = endDate;
    }

    // Validate dates if both are provided
    const finalStartAt = updateData.startAt || existingConcert.startAt;
    const finalEndAt = updateData.endAt || existingConcert.endAt;

    if (finalStartAt >= finalEndAt) {
      res.status(400).json({
        success: false,
        message: "endAt must be after startAt",
      });
      return;
    }

    const concert = await prisma.concert.update({
      where: { id },
      data: updateData,
      include: {
        ticketTypes: true,
      },
    });

    res.json({
      success: true,
      data: concert,
    });
  } catch (error) {
    console.error("Update concert error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /concerts/{id}:
 *   delete:
 *     summary: Menghapus konser tertentu
 *     tags: [Concert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Concert ID
 *     responses:
 *       200:
 *         description: Konser berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Konser tidak ditemukan
 */
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const concert = await prisma.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      res.status(404).json({
        success: false,
        message: "Concert not found",
      });
      return;
    }

    await prisma.concert.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Concert deleted successfully",
    });
  } catch (error) {
    console.error("Delete concert error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /concerts/{id}/publish:
 *   put:
 *     summary: Mengubah status konser menjadi Published
 *     tags: [Concert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Concert ID
 *     responses:
 *       200:
 *         description: Status konser berhasil diubah menjadi Published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Concert'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Konser tidak ditemukan
 */
router.put("/:id/publish", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const concert = await prisma.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      res.status(404).json({
        success: false,
        message: "Concert not found",
      });
      return;
    }

    const updatedConcert = await prisma.concert.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
      include: {
        ticketTypes: true,
      },
    });

    res.json({
      success: true,
      data: updatedConcert,
    });
  } catch (error) {
    console.error("Publish concert error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;

