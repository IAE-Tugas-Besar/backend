import express, { RequestHandler } from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import swaggerUi from "swagger-ui-express";
import { typeDefs } from "./schema";
import { resolvers } from "./schema/resolvers";
import authRoutes from "./routes/auth";
<<<<<<< HEAD
import orderRoutes from "./routes/order";
=======
import concertRoutes from "./routes/concerts";
>>>>>>> c89531f00279248f1b8a03d0885d8558cbdf5400
import { swaggerSpec } from "./config/swagger";
import ticketRoutes from "./routes/ticket";


const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  // Apply global middleware
  app.use(cors());
  app.use(express.json());

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

<<<<<<< HEAD
  // Order routes
  app.use(orderRoutes);
=======
  // Concert routes
  app.use("/concerts", concertRoutes);

  // Ticket routes
  app.use("/tickets", ticketRoutes);
>>>>>>> c89531f00279248f1b8a03d0885d8558cbdf5400

  // GraphQL endpoint
  app.use("/graphql", expressMiddleware(server) as unknown as RequestHandler);

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📚 API Docs at http://localhost:${PORT}/api-docs`);
    console.log(`🔐 Auth endpoints at http://localhost:${PORT}/auth`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
