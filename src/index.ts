import express, { RequestHandler } from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import swaggerUi from "swagger-ui-express";
import { typeDefs } from "./schema";
import { resolvers } from "./schema/resolvers";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/order";
import concertRoutes from "./routes/concerts";
import ticketRoutes from "./routes/ticket";
import paymentRoutes from "./routes/payment";
import { swaggerSpec } from "./config/swagger";

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  // Apply global middleware
  app.use(cors());
  app.use(express.json());
  
  // Serve static files from uploads directory
  app.use("/uploads", express.static("uploads"));

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start Apollo Server
  await server.start();

  // Swagger documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Auth routes
  app.use("/auth", authRoutes);

  // Order routes
  app.use(orderRoutes);

  // Concert routes
  app.use("/concerts", concertRoutes);

  // Ticket routes
  app.use("/tickets", ticketRoutes);

  // Payment routes
  app.use("/payments", paymentRoutes);

  // GraphQL endpoint
  app.use("/graphql", expressMiddleware(server) as unknown as RequestHandler);

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📚 API Docs at http://localhost:${PORT}/api-docs`);
    console.log(`🔐 Auth endpoints at http://localhost:${PORT}/auth`);
    console.log(`💳 Payment endpoints at http://localhost:${PORT}/payments`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
