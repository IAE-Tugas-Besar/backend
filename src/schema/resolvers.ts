import { prisma } from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Helper to generate unique midtrans order id
const generateMidtransOrderId = () =>
  `ORDER-${Date.now()}-${uuidv4().slice(0, 8)}`;

// Helper to generate unique ticket code
const generateTicketCode = () =>
  `TKT-${uuidv4().toUpperCase().replace(/-/g, "").slice(0, 12)}`;

export const resolvers = {
  Query: {
    // User queries
    users: () => prisma.user.findMany(),
    user: (_: unknown, { id }: { id: string }) =>
      prisma.user.findUnique({ where: { id } }),

    // Concert queries
    concerts: () => prisma.concert.findMany(),
    concert: (_: unknown, { id }: { id: string }) =>
      prisma.concert.findUnique({ where: { id } }),
    publishedConcerts: () =>
      prisma.concert.findMany({ where: { status: "PUBLISHED" } }),

    // TicketType queries
    ticketTypes: (_: unknown, { concertId }: { concertId: string }) =>
      prisma.ticketType.findMany({ where: { concertId } }),
    ticketType: (_: unknown, { id }: { id: string }) =>
      prisma.ticketType.findUnique({ where: { id } }),

    // Order queries
    orders: () => prisma.order.findMany(),
    order: (_: unknown, { id }: { id: string }) =>
      prisma.order.findUnique({ where: { id } }),
    userOrders: (_: unknown, { userId }: { userId: string }) =>
      prisma.order.findMany({ where: { userId } }),

    // Ticket queries
    tickets: () => prisma.ticket.findMany(),
    ticket: (_: unknown, { id }: { id: string }) =>
      prisma.ticket.findUnique({ where: { id } }),
    ticketByCode: (_: unknown, { code }: { code: string }) =>
      prisma.ticket.findUnique({ where: { code } }),
    userTickets: (_: unknown, { userId }: { userId: string }) =>
      prisma.ticket.findMany({ where: { userId } }),

    // Payment queries
    payment: (_: unknown, { orderId }: { orderId: string }) =>
      prisma.payment.findUnique({ where: { orderId } }),
  },

  Mutation: {
    // User mutations
    createUser: (
      _: unknown,
      {
        input,
      }: {
        input: {
          name: string;
          email: string;
          passwordHash: string;
          role?: "USER" | "ADMIN";
        };
      }
    ) => prisma.user.create({ data: input }),

    updateUser: (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: { name?: string; email?: string; role?: "USER" | "ADMIN" };
      }
    ) => prisma.user.update({ where: { id }, data: input }),

    deleteUser: (_: unknown, { id }: { id: string }) =>
      prisma.user.delete({ where: { id } }),

    // Concert mutations
    createConcert: (
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string;
          venue: string;
          startAt: string;
          endAt: string;
          description?: string;
          status?: "DRAFT" | "PUBLISHED" | "ENDED";
        };
      }
    ) =>
      prisma.concert.create({
        data: {
          ...input,
          startAt: new Date(input.startAt),
          endAt: new Date(input.endAt),
        },
      }),

    updateConcert: (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          title?: string;
          venue?: string;
          startAt?: string;
          endAt?: string;
          description?: string;
          status?: "DRAFT" | "PUBLISHED" | "ENDED";
        };
      }
    ) =>
      prisma.concert.update({
        where: { id },
        data: {
          ...input,
          startAt: input.startAt ? new Date(input.startAt) : undefined,
          endAt: input.endAt ? new Date(input.endAt) : undefined,
        },
      }),

    deleteConcert: (_: unknown, { id }: { id: string }) =>
      prisma.concert.delete({ where: { id } }),

    // TicketType mutations
    createTicketType: (
      _: unknown,
      {
        input,
      }: {
        input: {
          concertId: string;
          name: string;
          price: number;
          quotaTotal: number;
          salesStartAt: string;
          salesEndAt: string;
        };
      }
    ) =>
      prisma.ticketType.create({
        data: {
          ...input,
          salesStartAt: new Date(input.salesStartAt),
          salesEndAt: new Date(input.salesEndAt),
        },
      }),

    updateTicketType: (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          name?: string;
          price?: number;
          quotaTotal?: number;
          salesStartAt?: string;
          salesEndAt?: string;
        };
      }
    ) =>
      prisma.ticketType.update({
        where: { id },
        data: {
          ...input,
          salesStartAt: input.salesStartAt
            ? new Date(input.salesStartAt)
            : undefined,
          salesEndAt: input.salesEndAt ? new Date(input.salesEndAt) : undefined,
        },
      }),

    deleteTicketType: (_: unknown, { id }: { id: string }) =>
      prisma.ticketType.delete({ where: { id } }),

    // Order mutations
    createOrder: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          userId: string;
          concertId: string;
          grossAmount: number;
          expiresAt: string;
          items: Array<{
            ticketTypeId: string;
            qty: number;
            unitPrice: number;
            subtotal: number;
          }>;
        };
      }
    ) => {
      const midtransOrderId = generateMidtransOrderId();

      return prisma.order.create({
        data: {
          userId: input.userId,
          concertId: input.concertId,
          midtransOrderId,
          grossAmount: input.grossAmount,
          expiresAt: new Date(input.expiresAt),
          orderItems: {
            create: input.items,
          },
        },
        include: {
          orderItems: true,
        },
      });
    },

    updateOrderStatus: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          status:
            | "PENDING"
            | "AWAITING_PAYMENT"
            | "PAID"
            | "CANCELLED"
            | "EXPIRED"
            | "REFUNDED";
        };
      }
    ) => {
      const order = await prisma.order.update({
        where: { id },
        data: { status: input.status },
        include: { orderItems: true },
      });

      // If order is PAID, generate tickets
      if (input.status === "PAID") {
        const orderWithItems = await prisma.order.findUnique({
          where: { id },
          include: { orderItems: true },
        });

        if (orderWithItems) {
          const ticketsToCreate = [];
          for (const item of orderWithItems.orderItems) {
            for (let i = 0; i < item.qty; i++) {
              ticketsToCreate.push({
                orderId: order.id,
                userId: order.userId,
                concertId: order.concertId,
                ticketTypeId: item.ticketTypeId,
                code: generateTicketCode(),
              });
            }
          }

          await prisma.ticket.createMany({ data: ticketsToCreate });
        }
      }

      return order;
    },

    cancelOrder: (_: unknown, { id }: { id: string }) =>
      prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),

    // Ticket mutations
    useTicket: (_: unknown, { code }: { code: string }) =>
      prisma.ticket.update({
        where: { code },
        data: {
          status: "USED",
          usedAt: new Date(),
        },
      }),

    voidTicket: (_: unknown, { id }: { id: string }) =>
      prisma.ticket.update({
        where: { id },
        data: { status: "VOID" },
      }),
  },

  // Field resolvers for relations
  User: {
    orders: (parent: { id: string }) =>
      prisma.order.findMany({ where: { userId: parent.id } }),
    tickets: (parent: { id: string }) =>
      prisma.ticket.findMany({ where: { userId: parent.id } }),
  },

  Concert: {
    ticketTypes: (parent: { id: string }) =>
      prisma.ticketType.findMany({ where: { concertId: parent.id } }),
    orders: (parent: { id: string }) =>
      prisma.order.findMany({ where: { concertId: parent.id } }),
    tickets: (parent: { id: string }) =>
      prisma.ticket.findMany({ where: { concertId: parent.id } }),
  },

  TicketType: {
    concert: (parent: { concertId: string }) =>
      prisma.concert.findUnique({ where: { id: parent.concertId } }),
  },

  Order: {
    user: (parent: { userId: string }) =>
      prisma.user.findUnique({ where: { id: parent.userId } }),
    concert: (parent: { concertId: string }) =>
      prisma.concert.findUnique({ where: { id: parent.concertId } }),
    orderItems: (parent: { id: string }) =>
      prisma.orderItem.findMany({ where: { orderId: parent.id } }),
    tickets: (parent: { id: string }) =>
      prisma.ticket.findMany({ where: { orderId: parent.id } }),
    payment: (parent: { id: string }) =>
      prisma.payment.findUnique({ where: { orderId: parent.id } }),
  },

  OrderItem: {
    order: (parent: { orderId: string }) =>
      prisma.order.findUnique({ where: { id: parent.orderId } }),
    ticketType: (parent: { ticketTypeId: string }) =>
      prisma.ticketType.findUnique({ where: { id: parent.ticketTypeId } }),
  },

  Ticket: {
    order: (parent: { orderId: string }) =>
      prisma.order.findUnique({ where: { id: parent.orderId } }),
    user: (parent: { userId: string }) =>
      prisma.user.findUnique({ where: { id: parent.userId } }),
    concert: (parent: { concertId: string }) =>
      prisma.concert.findUnique({ where: { id: parent.concertId } }),
    ticketType: (parent: { ticketTypeId: string }) =>
      prisma.ticketType.findUnique({ where: { id: parent.ticketTypeId } }),
  },

  Payment: {
    order: (parent: { orderId: string }) =>
      prisma.order.findUnique({ where: { id: parent.orderId } }),
  },
};
