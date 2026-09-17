import { Server, Socket } from "socket.io";
import {
  getRoomByName,
  createMessage,
  deleteMessageByOwner,
  createRoom,
  RoomManager,
  getUserById,
  logActivityDB,
} from "./chat.service";

export const registerChatEvents = (
  io: Server,
  socket: Socket
) => {
  const userId = String(socket.data?.user?.id || "");
  const hasValidUserId = /^[a-f\d]{24}$/i.test(userId);
  const roomManager = RoomManager.getInstance();

  // Join room
  socket.on("join-room", async ({ roomName }) => {
    if (!hasValidUserId) {
      socket.emit("chat-error", { message: "Authentication required." });
      return;
    }
    try {
      const room = await getRoomByName(roomName);
      if (!room) return;

      const roomId = room._id.toString();
      socket.join(roomId);

      // Track online user - Always fetch fresh data from DB to avoid stale JWT tokens
      // But keep JWT data as fallback if DB fetch fails
      try {
        const freshUser = await getUserById(userId);
        if (freshUser) {
          socket.data.user.fullName = freshUser.fullName;
          socket.data.user.email = freshUser.email;
          socket.data.user.avatar = freshUser.avatar;
        }
      } catch (e: any) {
        console.warn(`[Socket] Failed to fetch fresh user data for ${userId}:`, e.message);
      }

      const fullName = socket.data.user.fullName || socket.data.user.name || "User";
      const email = socket.data.user.email || "";
      const avatar = socket.data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

      const userData = {
        _id: userId,
        fullName,
        email,
        avatar,
      };
      roomManager.addUser(roomId, userId, userData, socket.id);
      const activity = roomManager.logActivity(userData.fullName || "User", "joined", room.name);
      
      // PERSIST to DB for global visibility
      logActivityDB(userData.fullName || "User", "joined", room.name);

      // Broadcast full online list to the room
      io.to(roomId).emit("room-members-online", {
        roomName,
        onlineMembers: roomManager.getOnlineUsers(roomId),
      });

      // Global broadcasts
      io.emit("global-user-activity", activity);
      io.emit("global-rooms-stats", {
        stats: roomManager.getAllRoomStats()
      });
    } catch (error) {
       console.error("[Socket][join-room] Error:", error);
    }
  });

  // Get initial global stats
  socket.on("get-global-stats", () => {
    socket.emit("global-stats", {
      stats: roomManager.getAllRoomStats(),
      activityLog: roomManager.getActivityLog()
    });
  });

  // Leave room
  socket.on("leave-room", async ({ roomName }) => {
    if (!hasValidUserId) return;
    try {
      const room = await getRoomByName(roomName);
      if (!room) return;

      const roomId = room._id.toString();
      socket.leave(roomId);

      roomManager.removeUser(roomId, userId, socket.id);
      const activity = roomManager.logActivity(socket.data.user.fullName || "User", "left", room.name);
      
      // PERSIST to DB for global visibility
      logActivityDB(socket.data.user.fullName || "User", "left", room.name);

      // Broadcast update
      io.to(roomId).emit("room-members-online", {
        roomName,
        onlineMembers: roomManager.getOnlineUsers(roomId),
      });

      // Global broadcasts
      io.emit("global-user-activity", activity);
      io.emit("global-rooms-stats", {
        stats: roomManager.getAllRoomStats()
      });
    } catch (error) {
      console.error("[Socket][leave-room] Error:", error);
    }
  });

  // Disconnect handler to clean up all rooms
  socket.on("disconnect", () => {
    const userIdToCleanup = userId || socket.data?.user?.id;
    if (!userIdToCleanup) return;

    try {
      const roomsAffected = roomManager.removeUserFromAllRooms(userIdToCleanup, socket.id);

      roomsAffected.forEach(roomId => {
        io.to(roomId).emit("room-members-online", {
          roomId,
          onlineMembers: roomManager.getOnlineUsers(roomId),
        });
      });

      if (roomsAffected.length > 0) {
        io.emit("global-rooms-stats", {
          stats: roomManager.getAllRoomStats()
        });
      }
    } catch (error) {
      console.error("[Socket][disconnect] Cleanup error:", error);
    }
  });

  // Send message
  socket.on("send-message", async ({ roomName, content }) => {
    if (!hasValidUserId) return;
    
    try {
      const room = await getRoomByName(roomName);
      if (!room) return;

      const message = await createMessage(
        room._id.toString(),
        userId,
        content
      );

      // Log message activity to DB
      logActivityDB(socket.data.user.fullName || "User", "sent a message", room.name);

      const populated = await message.populate(
        "senderId",
        "fullName email avatar"
      );

      console.log(`[Socket] Broadcasting new message in ${room._id}:`, populated.content);
      io.to(room._id.toString()).emit("new-message", populated);
    } catch (error) {
      console.error("[Socket][send-message] Error:", error);
    }
  });

  // Delete message
  socket.on("delete-message", async ({ messageId }) => {
    if (!hasValidUserId) return;
    try {
      const message = await deleteMessageByOwner(
        messageId,
        userId
      );

      if (!message) return;

      io.to(message.roomId.toString()).emit("message-deleted", {
        messageId,
      });
    } catch (error) {
      console.error("[Socket][delete-message] Error:", error);
    }
  });

  // Typing
  socket.on("typing", async ({ roomName }) => {
    if (!hasValidUserId) return;
    try {
      const room = await getRoomByName(roomName);
      if (!room) return;
      socket.to(room._id.toString()).emit("user-typing", {
        user: socket.data.user.fullName,
      });
    } catch (error) {
      console.error("[Socket][typing] Error:", error);
    }
  });

  // Stop typing
  socket.on("stop-typing", async ({ roomName }) => {
    if (!hasValidUserId) return;
    try {
      const room = await getRoomByName(roomName);
      if (!room) return;
      socket.to(room._id.toString()).emit("user-stop-typing", {
        user: socket.data.user.fullName,
      });
    } catch (error) {
      console.error("[Socket][stop-typing] Error:", error);
    }
  });

  // Create room
  socket.on("create-room", async ({ roomName }) => {
    if (!hasValidUserId) return;
    try {
      const room = await createRoom(roomName, userId);

      if (!room) return;

      socket.join(room._id.toString());

      socket.emit("room-created", {
        name: room.name,
        id: room._id
      });

      socket.broadcast.emit("new-room-available", {
        id: room._id,
        name: room.name,
        members: "1",
        topContributor: socket.data.user.fullName || socket.data.user.email || "Unknown"
      });
    } catch (error) {
      console.error("[Socket][create-room] Error:", error);
    }
  });
};