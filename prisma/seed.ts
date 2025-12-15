import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (in reverse order of dependencies)
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.concert.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Create Users
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      passwordHash,
      role: "USER",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      passwordHash,
      role: "USER",
    },
  });

  console.log("✅ Created 3 users");

  // Create Concerts
  const concert1 = await prisma.concert.create({
    data: {
      title: "Rock Festival 2025",
      venue: "Jakarta International Stadium",
      description: "The biggest rock festival in Southeast Asia",
      startAt: new Date("2025-06-15T18:00:00Z"),
      endAt: new Date("2025-06-15T23:00:00Z"),
      status: "PUBLISHED",
    },
  });

  const concert2 = await prisma.concert.create({
    data: {
      title: "Jazz Night",
      venue: "Balai Sarbini",
      description: "An evening of smooth jazz",
      startAt: new Date("2025-07-20T19:00:00Z"),
      endAt: new Date("2025-07-20T22:00:00Z"),
      status: "PUBLISHED",
    },
  });

  const concert3 = await prisma.concert.create({
    data: {
      title: "Pop Music Extravaganza",
      venue: "Gelora Bung Karno",
      description: "Featuring top pop artists",
      startAt: new Date("2025-08-10T17:00:00Z"),
      endAt: new Date("2025-08-10T23:00:00Z"),
      status: "DRAFT",
    },
  });

  console.log("✅ Created 3 concerts");

  // Create Ticket Types
  const vipRock = await prisma.ticketType.create({
    data: {
      concertId: concert1.id,
      name: "VIP",
      price: 2500000,
      quotaTotal: 100,
      quotaSold: 25,
      salesStartAt: new Date("2025-01-01T00:00:00Z"),
      salesEndAt: new Date("2025-06-14T23:59:59Z"),
    },
  });

  const regularRock = await prisma.ticketType.create({
    data: {
      concertId: concert1.id,
      name: "Regular",
      price: 750000,
      quotaTotal: 500,
      quotaSold: 150,
      salesStartAt: new Date("2025-01-01T00:00:00Z"),
      salesEndAt: new Date("2025-06-14T23:59:59Z"),
    },
  });

  const vipJazz = await prisma.ticketType.create({
    data: {
      concertId: concert2.id,
      name: "VIP",
      price: 1500000,
      quotaTotal: 50,
      quotaSold: 10,
      salesStartAt: new Date("2025-02-01T00:00:00Z"),
      salesEndAt: new Date("2025-07-19T23:59:59Z"),
    },
  });

  const regularJazz = await prisma.ticketType.create({
    data: {
      concertId: concert2.id,
      name: "Regular",
      price: 500000,
      quotaTotal: 200,
      quotaSold: 45,
      salesStartAt: new Date("2025-02-01T00:00:00Z"),
      salesEndAt: new Date("2025-07-19T23:59:59Z"),
    },
  });

  console.log("✅ Created 4 ticket types");

  // Create Orders
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      concertId: concert1.id,
      midtransOrderId: `ORDER-${Date.now()}-001`,
      status: "PAID",
      grossAmount: 3250000, // 1 VIP + 1 Regular
      expiresAt: new Date("2025-06-14T23:59:59Z"),
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      concertId: concert2.id,
      midtransOrderId: `ORDER-${Date.now()}-002`,
      status: "PAID",
      grossAmount: 1000000, // 2 Regular Jazz
      expiresAt: new Date("2025-07-19T23:59:59Z"),
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: user1.id,
      concertId: concert2.id,
      midtransOrderId: `ORDER-${Date.now()}-003`,
      status: "PENDING",
      grossAmount: 1500000, // 1 VIP Jazz
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  console.log("✅ Created 3 orders");

  // Create Order Items
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        ticketTypeId: vipRock.id,
        qty: 1,
        unitPrice: 2500000,
        subtotal: 2500000,
      },
      {
        orderId: order1.id,
        ticketTypeId: regularRock.id,
        qty: 1,
        unitPrice: 750000,
        subtotal: 750000,
      },
      {
        orderId: order2.id,
        ticketTypeId: regularJazz.id,
        qty: 2,
        unitPrice: 500000,
        subtotal: 1000000,
      },
      {
        orderId: order3.id,
        ticketTypeId: vipJazz.id,
        qty: 1,
        unitPrice: 1500000,
        subtotal: 1500000,
      },
    ],
  });

  console.log("✅ Created 4 order items");

  // Create Tickets (only for PAID orders)
  await prisma.ticket.createMany({
    data: [
      {
        orderId: order1.id,
        userId: user1.id,
        concertId: concert1.id,
        ticketTypeId: vipRock.id,
        code: "TKT-ROCK-VIP-001",
        status: "ISSUED",
      },
      {
        orderId: order1.id,
        userId: user1.id,
        concertId: concert1.id,
        ticketTypeId: regularRock.id,
        code: "TKT-ROCK-REG-001",
        status: "ISSUED",
      },
      {
        orderId: order2.id,
        userId: user2.id,
        concertId: concert2.id,
        ticketTypeId: regularJazz.id,
        code: "TKT-JAZZ-REG-001",
        status: "ISSUED",
      },
      {
        orderId: order2.id,
        userId: user2.id,
        concertId: concert2.id,
        ticketTypeId: regularJazz.id,
        code: "TKT-JAZZ-REG-002",
        status: "USED",
        usedAt: new Date(),
      },
    ],
  });

  console.log("✅ Created 4 tickets");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nTest accounts:");
  console.log("  Admin: admin@example.com / password123");
  console.log("  User 1: john@example.com / password123");
  console.log("  User 2: jane@example.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
