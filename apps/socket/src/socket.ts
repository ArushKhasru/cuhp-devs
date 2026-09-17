import { Server } from "socket.io";
import { authenticateSocket } from "./utils/authSocket";
import { registerChatEvents } from "./modules/chat/chat.events";
import { initPostChangeStream } from "./modules/post/post.events";

export const setupSocket = (io: Server) => {
  io.use(authenticateSocket);

  // Initialize change streams
  const stopStreams = initPostChangeStream(io);

  io.on("connection", (socket) => {


    registerChatEvents(io, socket);
  });
  return stopStreams;
};