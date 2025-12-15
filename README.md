# Concert Ticketing Backend

Backend API untuk sistem ticketing konser menggunakan **Express.js**, **Prisma**, **PostgreSQL**, **Docker**, dan **GraphQL**.

## Tech Stack

- **Express.js** - Web framework
- **Apollo Server** - GraphQL server
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Docker** - Containerization
- **TypeScript** - Type safety

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm atau yarn

### 1. Clone & Install

```bash
npm install
```

### 2. Start PostgreSQL dengan Docker

```bash
docker-compose up -d postgres
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database dengan sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:4000`

### API Documentation

Swagger UI tersedia di: `http://localhost:4000/api-docs`

| Script                    | Description                                |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Start development server dengan hot reload |
| `npm run build`           | Build untuk production                     |
| `npm start`               | Start production server                    |
| `npm run prisma:generate` | Generate Prisma client                     |
| `npm run prisma:migrate`  | Run database migrations                    |
| `npm run prisma:studio`   | Open Prisma Studio                         |
| `npx prisma db seed`      | Seed database dengan sample data           |

## Project Structure

```
├── src/
│   ├── index.ts          # Server entry point
│   ├── lib/
│   │   ├── prisma.ts     # Prisma client
│   │   └── auth.ts       # Auth utilities (JWT, bcrypt)
│   ├── routes/
│   │   └── auth.ts       # REST auth endpoints
│   └── schema/
│       ├── index.ts      # GraphQL type definitions
│       └── resolvers.ts  # GraphQL resolvers
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeder
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Database Entities

- **User** - User accounts (USER/ADMIN roles)
- **Concert** - Concert events
- **TicketType** - Types of tickets for concerts
- **Order** - User orders
- **OrderItem** - Items in an order
- **Ticket** - Issued tickets
- **Payment** - Payment records (Midtrans integration ready)

## GraphQL Endpoints

### Queries

- `users`, `user(id)`
- `concerts`, `concert(id)`, `publishedConcerts`
- `ticketTypes(concertId)`, `ticketType(id)`
- `orders`, `order(id)`, `userOrders(userId)`
- `tickets`, `ticket(id)`, `ticketByCode(code)`, `userTickets(userId)`
- `payment(orderId)`

### Mutations

- User: `createUser`, `updateUser`, `deleteUser`
- Concert: `createConcert`, `updateConcert`, `deleteConcert`
- TicketType: `createTicketType`, `updateTicketType`, `deleteTicketType`
- Order: `createOrder`, `updateOrderStatus`, `cancelOrder`
- Ticket: `useTicket`, `voidTicket`

## REST Auth Endpoints

| Method | Endpoint         | Description                        |
| ------ | ---------------- | ---------------------------------- |
| POST   | `/auth/register` | Register user baru                 |
| POST   | `/auth/login`    | Login dan dapat JWT token          |
| POST   | `/auth/logout`   | Logout (client-side token removal) |

### Test Accounts (setelah seed)

| Email             | Password    | Role  |
| ----------------- | ----------- | ----- |
| admin@example.com | password123 | ADMIN |
| john@example.com  | password123 | USER  |
| jane@example.com  | password123 | USER  |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/concert_ticketing?schema=public
PORT=4000
NODE_ENV=development
```

## Docker

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```
