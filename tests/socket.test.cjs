const { test } = require("node:test");
const assert = require("node:assert/strict");
const { RoomManager } = require("../apps/socket/dist/modules/chat/chat.service");
test("presence survives one tab disconnecting and disappears after the last tab leaves", () => {
  const rooms = RoomManager.getInstance();
  rooms.addUser("room", "user", { name: "student" }, "tab-1");
  rooms.addUser("room", "user", { name: "student" }, "tab-2");
  assert.equal(rooms.getAllRoomStats().room, 1);
  rooms.removeUserFromAllRooms("user", "tab-1");
  assert.equal(rooms.getOnlineUsers("room").length, 1);
  rooms.removeUser("room", "user", "tab-2");
  assert.equal(rooms.getOnlineUsers("room").length, 0);
  assert.equal(rooms.getAllRoomStats().room, undefined);
});
