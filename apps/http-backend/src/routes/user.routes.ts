import { Router } from "express";
import { User } from "@repo/db";
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
// Resolve missing handles before authentication so unknown page URLs are 404s.
router.get("/profile/handle/:handle", async (req, res, next) => {
    try {
        if (!await User.exists({ handle: req.params.handle })) {
            return res.status(404).json({ message: "User not found" });
        }
        next();
    } catch (error) {
        next(error);
    }
}, protect, getProfileByHandle);
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
