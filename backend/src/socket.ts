import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "./config/env";

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket]: Client connected: ${socket.id}`);

    // Salon admin joins their specific salon room
    socket.on("joinSalon", (salonId: string) => {
      socket.join(`salon_${salonId}`);
      console.log(`[socket]: Client ${socket.id} joined room salon_${salonId}`);
    });

    // Customer might join their specific user room or booking room
    socket.on("joinCustomer", (customerId: string) => {
      socket.join(`customer_${customerId}`);
      console.log(`[socket]: Client ${socket.id} joined room customer_${customerId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket]: Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
