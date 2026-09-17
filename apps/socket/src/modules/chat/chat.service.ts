import { ChatRoom, Message, User, Activity } from "@repo/db";

const ROOM_NAME_ALIASES: Record<string, string> = {
  "machine learning": "Machine Learning",
  "deep learning": "Deep Learning",
  "data structures & algorithms": "Data Structures & Algorithms",
  blockchain: "Blockchain",
  "blockchain tech": "Blockchain",
  "deep learning mastery": "Deep Learning",
  "rust systems dev": "Data Structures & Algorithms",
  "system design": "Data Structures & Algorithms",
  "web ecosystem": "Deep Learning",
};

export const getRoomByName = async (roomName: string) => {
  // 1. Basic decoding and cleaning
  const decoded = decodeURIComponent(roomName).trim();
  
  // 2. Normalization: spaces instead of hyphens (common for URL slugs)
  const normalized = decoded.replace(/-/g, " ");

  // 3. Check specific aliases first
  const aliasKey = normalized.toLowerCase();
  const canonicalName = ROOM_NAME_ALIASES[aliasKey];

  if (canonicalName) {
    return ChatRoom.findOne({ name: canonicalName });
  }

  // 4. Case-insensitive search as a fallback to catch "blockchain" -> "Blockchain"
  // We use regex for case-insensitive matching if it's not a known alias
  return ChatRoom.findOne({ 
    name: { $regex: new RegExp(`^${normalized}$`, "i") } 
  });
};
export const createMessage = async (
  roomId: string,
  senderId: string,
  content: string
) => {
  return Message.create({
    roomId,
    senderId,
    content,
  });
};

export const deleteMessageByOwner = async (
  messageId: string,
  userId: string
) => {
  const message = await Message.findById(messageId);
  if (!message) return null;

  if (message.senderId.toString() !== userId) return null;

  message.isDeleted = true;
  return message.save();
};
export const createRoom = async (roomName: string, userId: string) => {
  const decoded = decodeURIComponent(roomName).trim();

  // Check if already exists
  const existing = await ChatRoom.findOne({ name: decoded });
  if (existing) return existing;

  const room = await ChatRoom.create({
    name: decoded,
    createdBy: userId,
  });

  return room;
};

export const getUserById = async (userId: string) => {
  return User.findById(userId).select("fullName email avatar").lean();
};

export const logActivityDB = async (user: string, action: string, room?: string) => {
  try {
    return await Activity.create({ user, action, room });
  } catch (error) {
    console.error("[Socket] Failed to log activity to DB:", error);
    return null;
  }
};

export class RoomManager {
  private static instance: RoomManager;
  private roomUsers = new Map<string, Map<string, { user: any; sockets: Set<string> }>>();
  private activityLog: any[] = [];
  private constructor() {}
  static getInstance() {
    return RoomManager.instance ??= new RoomManager();
  }
  logActivity(user: string, action: string, room: string) {
    const activity = { user, action, room, time: "Just now" };
    this.activityLog.unshift(activity);
    this.activityLog = this.activityLog.slice(0, 20);
    return activity;
  }
  getActivityLog() { return this.activityLog; }
  addUser(roomId: string, userId: string, user: any, socketId: string) {
    const users = this.roomUsers.get(roomId) ?? new Map();
    const entry = users.get(userId) ?? { user, sockets: new Set<string>() };
    entry.user = user;
    entry.sockets.add(socketId);
    users.set(userId, entry);
    this.roomUsers.set(roomId, users);
  }
  removeUser(roomId: string, userId: string, socketId: string) {
    const users = this.roomUsers.get(roomId);
    const entry = users?.get(userId);
    if (!entry) return;
    entry.sockets.delete(socketId);
    if (!entry.sockets.size) users!.delete(userId);
    if (!users!.size) this.roomUsers.delete(roomId);
  }
  getOnlineUsers(roomId: string) {
    return Array.from(this.roomUsers.get(roomId)?.values() ?? [], entry => entry.user);
  }
  getAllRoomStats() {
    return Object.fromEntries(Array.from(this.roomUsers, ([id, users]) => [id, users.size]));
  }
  removeUserFromAllRooms(userId: string, socketId: string) {
    const affected: string[] = [];
    for (const [roomId, users] of this.roomUsers) {
      if (users.get(userId)?.sockets.has(socketId)) {
        this.removeUser(roomId, userId, socketId);
        affected.push(roomId);
      }
    }
    return affected;
  }
}
