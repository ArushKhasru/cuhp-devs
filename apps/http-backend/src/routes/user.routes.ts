import { Router } from "express";
import { 
    updateProfile, 
    getProfile, 
    getDashboardData, 
    getCommunityFeed, 
    getCommunityRooms, 
    getCommunitySnippets, 
    getChatMessages, 
    getChatRoomMembers,
    getProfileByHandle,
    searchUsers,
    getUserSubmissions,
    followUser,
    unfollowUser,
    getNotifications,
    markNotificationsRead
} from "../controller/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.put("/profile", protect, updateProfile);
router.get("/profile", protect, getProfile);
router.get("/suggest", searchUsers);
router.get("/profile/handle/:handle", protect, getProfileByHandle);
router.get("/dashboard", protect, getDashboardData);
router.get("/submissions", protect, getUserSubmissions);
router.get("/community/feed", protect, getCommunityFeed);
router.get("/community/rooms", protect, getCommunityRooms);
router.get("/community/snippets", protect, getCommunitySnippets);
router.get("/community/rooms/:roomName/messages", protect, getChatMessages);
router.get("/community/rooms/:roomName/members", protect, getChatRoomMembers);

// Follow and notifications routes
router.post("/follow/:targetUserId", protect, followUser);
router.post("/unfollow/:targetUserId", protect, unfollowUser);
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsRead);

export default router;
