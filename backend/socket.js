import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
    },
  });

  return io;
};

export const emitBookingsChanged = (changeType) => {
  if (!io) {
    return;
  }

  io.emit("bookings:changed", { type: changeType });
};
