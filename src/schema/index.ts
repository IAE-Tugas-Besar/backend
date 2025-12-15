export const typeDefs = `#graphql
  # Enums
  enum Role {
    USER
    ADMIN
  }

  enum ConcertStatus {
    DRAFT
    PUBLISHED
    ENDED
  }

  enum OrderStatus {
    PENDING
    AWAITING_PAYMENT
    PAID
    CANCELLED
    EXPIRED
    REFUNDED
  }

  enum TicketStatus {
    ISSUED
    VOID
    USED
  }

  enum PaymentProvider {
    MIDTRANS
  }

  enum PaymentStatus {
    INITIATED
    PENDING
    SETTLED
    FAILED
    EXPIRED
    CANCELLED
    REFUNDED
  }

  # Types
  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    createdAt: String!
    orders: [Order!]!
    tickets: [Ticket!]!
  }

  type Concert {
    id: ID!
    title: String!
    venue: String!
    startAt: String!
    endAt: String!
    description: String
    status: ConcertStatus!
    ticketTypes: [TicketType!]!
    orders: [Order!]!
    tickets: [Ticket!]!
  }

  type TicketType {
    id: ID!
    concertId: ID!
    name: String!
    price: Float!
    quotaTotal: Int!
    quotaSold: Int!
    salesStartAt: String!
    salesEndAt: String!
    concert: Concert!
  }

  type Order {
    id: ID!
    userId: ID!
    concertId: ID!
    midtransOrderId: String!
    status: OrderStatus!
    grossAmount: Float!
    createdAt: String!
    expiresAt: String!
    user: User!
    concert: Concert!
    orderItems: [OrderItem!]!
    tickets: [Ticket!]!
    payment: Payment
  }

  type OrderItem {
    id: ID!
    orderId: ID!
    ticketTypeId: ID!
    qty: Int!
    unitPrice: Float!
    subtotal: Float!
    order: Order!
    ticketType: TicketType!
  }

  type Ticket {
    id: ID!
    orderId: ID!
    userId: ID!
    concertId: ID!
    ticketTypeId: ID!
    code: String!
    status: TicketStatus!
    issuedAt: String!
    usedAt: String
    order: Order!
    user: User!
    concert: Concert!
    ticketType: TicketType!
  }

  type Payment {
    id: ID!
    orderId: ID!
    provider: PaymentProvider!
    status: PaymentStatus!
    snapToken: String
    transactionStatus: String
    fraudStatus: String
    updatedAt: String!
    order: Order!
  }

  # Queries
  type Query {
    # User
    users: [User!]!
    user(id: ID!): User

    # Concert
    concerts: [Concert!]!
    concert(id: ID!): Concert
    publishedConcerts: [Concert!]!

    # TicketType
    ticketTypes(concertId: ID!): [TicketType!]!
    ticketType(id: ID!): TicketType

    # Order
    orders: [Order!]!
    order(id: ID!): Order
    userOrders(userId: ID!): [Order!]!

    # Ticket
    tickets: [Ticket!]!
    ticket(id: ID!): Ticket
    ticketByCode(code: String!): Ticket
    userTickets(userId: ID!): [Ticket!]!

    # Payment
    payment(orderId: ID!): Payment
  }

  # Input types
  input CreateUserInput {
    name: String!
    email: String!
    passwordHash: String!
    role: Role
  }

  input UpdateUserInput {
    name: String
    email: String
    role: Role
  }

  input CreateConcertInput {
    title: String!
    venue: String!
    startAt: String!
    endAt: String!
    description: String
    status: ConcertStatus
  }

  input UpdateConcertInput {
    title: String
    venue: String
    startAt: String
    endAt: String
    description: String
    status: ConcertStatus
  }

  input CreateTicketTypeInput {
    concertId: ID!
    name: String!
    price: Float!
    quotaTotal: Int!
    salesStartAt: String!
    salesEndAt: String!
  }

  input UpdateTicketTypeInput {
    name: String
    price: Float
    quotaTotal: Int
    salesStartAt: String
    salesEndAt: String
  }

  input CreateOrderInput {
    userId: ID!
    concertId: ID!
    grossAmount: Float!
    expiresAt: String!
    items: [OrderItemInput!]!
  }

  input OrderItemInput {
    ticketTypeId: ID!
    qty: Int!
    unitPrice: Float!
    subtotal: Float!
  }

  input UpdateOrderStatusInput {
    status: OrderStatus!
  }

  # Mutations
  type Mutation {
    # User
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): User!

    # Concert
    createConcert(input: CreateConcertInput!): Concert!
    updateConcert(id: ID!, input: UpdateConcertInput!): Concert!
    deleteConcert(id: ID!): Concert!

    # TicketType
    createTicketType(input: CreateTicketTypeInput!): TicketType!
    updateTicketType(id: ID!, input: UpdateTicketTypeInput!): TicketType!
    deleteTicketType(id: ID!): TicketType!

    # Order
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, input: UpdateOrderStatusInput!): Order!
    cancelOrder(id: ID!): Order!

    # Ticket
    useTicket(code: String!): Ticket!
    voidTicket(id: ID!): Ticket!
  }
`;
