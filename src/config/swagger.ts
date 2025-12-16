import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Concert Ticketing API",
      version: "1.0.0",
      description: "Backend API untuk sistem ticketing konser",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "cm4pxyz123" },
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthPayload: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", minLength: 6, example: "password123" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "password123" },
          },
        },
        Concert: {
          type: "object",
          properties: {
            id: { type: "string", example: "cm4pxyz123" },
            title: { type: "string", example: "Rock Festival 2025" },
            venue: { type: "string", example: "Jakarta International Stadium" },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            description: { type: "string", example: "The biggest rock festival" },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ENDED"],
              example: "PUBLISHED",
            },
            ticketTypes: {
              type: "array",
              items: { $ref: "#/components/schemas/TicketType" },
            },
          },
        },
        TicketType: {
          type: "object",
          properties: {
            id: { type: "string", example: "cm4pxyz456" },
            concertId: { type: "string", example: "cm4pxyz123" },
            name: { type: "string", example: "VIP" },
            price: { type: "number", example: 2500000 },
            quotaTotal: { type: "integer", example: 100 },
            quotaSold: { type: "integer", example: 25 },
            salesStartAt: { type: "string", format: "date-time" },
            salesEndAt: { type: "string", format: "date-time" },
          },
        },
        CreateConcertInput: {
          type: "object",
          required: ["title", "venue", "startAt", "endAt"],
          properties: {
            title: { type: "string", example: "Rock Festival 2025" },
            venue: { type: "string", example: "Jakarta International Stadium" },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            description: { type: "string", example: "The biggest rock festival" },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ENDED"],
              example: "DRAFT",
            },
          },
        },
        UpdateConcertInput: {
          type: "object",
          properties: {
            title: { type: "string", example: "Rock Festival 2025" },
            venue: { type: "string", example: "Jakarta International Stadium" },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            description: { type: "string", example: "The biggest rock festival" },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ENDED"],
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 50 },
            totalPages: { type: "integer", example: 5 },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Orders",
        description: "Order & ticket booking endpoints",
      },
      {
        name: "Concert",
        description: "Concert management endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);


