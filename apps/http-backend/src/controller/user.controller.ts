import { Request, Response } from "express";
import { User, ChatRoom, Message, ChatRoomName, IUser, Submission, Post, SubmissionResult, Problem, Activity } from "@repo/db/index.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { fullName, program, semester, interests, bio, handle, avatar, theme } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const updateData: any = {
            fullName,
            program,
            semester,
            interests: Array.isArray(interests) ? interests : [],
            bio,
            handle,
            avatar,
            theme,
            onboardingCompleted: Boolean(program && semester && handle),
        };

        // Check if handle is already taken (case-insensitive)
        if (handle) {
            const trimmedHandle = handle.trim();
            const existingUser = await User.findOne({ 
                handle: { $regex: new RegExp(`^${trimmedHandle}$`, "i") }, 
                _id: { $ne: userId } 
            });
            if (existingUser) {
                return res.status(400).json({ message: "Handle is already taken" });
            }
        }

        // Remove undefined fields to avoid overwriting with null/undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            res.clearCookie("token");
            return res.status(401).json({ message: "Session invalid. Please sign in again." });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
            res.clearCookie("token");
            return res.status(401).json({ message: "Session invalid. Please sign in again." });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Helper to ensure chat rooms exist
const seedRooms = async () => {
    for (const name of Object.values(ChatRoomName)) {
        await ChatRoom.findOneAndUpdate(
            { name },
            { name },
            { upsert: true, new: true }
        );
    }
};

// Seed rooms lazily on first dashboard/community request
let roomsSeeded = false;

const ROOM_NAME_ALIASES: Record<string, ChatRoomName> = {
    "machine learning": ChatRoomName.ML,
    "deep learning": ChatRoomName.DL,
    "data structures & algorithms": ChatRoomName.DSA,
    "blockchain": ChatRoomName.BLOCKCHAIN,
    "blockchain tech": ChatRoomName.BLOCKCHAIN,
    "deep learning mastery": ChatRoomName.DL,
    "rust systems dev": ChatRoomName.DSA,
    "system design": ChatRoomName.DSA,
    "web ecosystem": ChatRoomName.DL,
};

const normalizeRoomName = (rawRoomName: string): string => {
    const decoded = decodeURIComponent(rawRoomName).trim();
    // Replace hyphens with spaces for URL slug support
    const normalized = decoded.replace(/-/g, " ");
    
    // Check aliases
    const aliasKey = normalized.toLowerCase();
    const canonicalName = ROOM_NAME_ALIASES[aliasKey];
    
    return canonicalName || normalized;
};

export const getDashboardData = async (req: AuthRequest, res: Response) => {
    try {
        if (!roomsSeeded) {
            await seedRooms();
            roomsSeeded = true;
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
            res.clearCookie("token");
            return res.status(401).json({ message: "Session invalid. Please sign in again." });
        }
        //TODO: 

        //This is Mock dashboard data based on user profile
        // In a real app, this would be fetched from various collections
        // Calculate if streak is still active
        let liveStreak = user.streak || 0;
        if (user.lastStreakUpdate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastDate = new Date(user.lastStreakUpdate);
            lastDate.setHours(0, 0, 0, 0);
            
            const diffInDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
            // If missed more than 1 day, the streak is broken (0).
            // (Note: if diffInDays is 1, it's "yesterday", streak is still active until today ends)
            if (diffInDays > 1) {
                liveStreak = 0;
            }
        }

        // Fetch XP/Points based on problem difficulty
        // EASY = 100 XP, MEDIUM = 200 XP, HARD = 400 XP
        
        // Step 1: Get unique problem IDs from accepted submissions
        const uniqueProblemIds = await Submission.distinct("problemId", { 
            userId, 
            status: SubmissionResult.ACCEPTED 
        });

        console.log("=== DASHBOARD XP CALCULATION DEBUG ===");
        console.log("User ID:", userId);
        console.log("Unique problem IDs found:", uniqueProblemIds.length);
        console.log("Problem IDs:", uniqueProblemIds);

        // Step 2: Fetch the actual problems with their difficulty
        const problems = await Problem.find({ _id: { $in: uniqueProblemIds } }).select('difficulty');
        
        console.log("Problems fetched:", problems.length);
        console.log("Problems data:", JSON.stringify(problems, null, 2));

        // Step 3: Calculate XP based on difficulty
        let xp = 0;
        problems.forEach((problem: any) => {
            const difficulty = problem.difficulty;
            console.log(`Processing problem ${problem._id} - Difficulty: ${difficulty}`);
            if (difficulty === "EASY") xp += 100;
            else if (difficulty === "MEDIUM") xp += 200;
            else if (difficulty === "HARD") xp += 400;
            else {
                console.log(`WARNING: Unknown difficulty "${difficulty}", defaulting to 100 XP`);
                xp += 100; // Default to EASY if difficulty is missing
            }
        });

        console.log("Total XP calculated:", xp);
        console.log("=== END DASHBOARD XP DEBUG ===");

        const level = Math.floor(xp / 1000) + 1;
        const xpTarget = level * 1000;

        const dashboardData = {
            user: {
                name: user.fullName,
                handle: user.handle,
                role: "Student",
                avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((user.fullName || 'user').trim().toLowerCase())}`,
                program: user.program || "Not selected",
                semester: user.semester || "Not selected",
                interests: user.interests || [],
                level: level,
                xp: xp,
                xpTarget: xpTarget,
                streakDays: liveStreak,
            },
            badges: [],
            feedItems: await (async () => {
                // Fetch recent accepted submissions (deduplicated by user-problem combination)
                const submissions = await Submission.aggregate([
                    { $match: { status: SubmissionResult.ACCEPTED } },
                    { $sort: { createdAt: -1 } },
                    { $group: { 
                        _id: { userId: "$userId", problemId: "$problemId" },
                        latestSubmission: { $first: "$$ROOT" }
                    }},
                    { $replaceRoot: { newRoot: "$latestSubmission" } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 15 },
                    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userId" } },
                    { $lookup: { from: "problems", localField: "problemId", foreignField: "_id", as: "problemId" } },
                    { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$problemId", preserveNullAndEmptyArrays: true } }
                ]);
                
                console.log(`Dashboard API - Found ${submissions.length} unique accepted submissions`);

                // Fetch recent posts
                const posts = await Post.find({})
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .populate("author", "fullName avatar");
                    
                console.log(`Dashboard API - Found ${posts.length} posts`);

                // Map to FeedItems
                const submissionItems: any[] = submissions.map(s => ({
                    id: s._id.toString(),
                    type: "solved",
                    user: {
                        id: s.userId?._id?.toString() || s.userId?.toString(),
                        name: s.userId?.fullName || "Unknown User",
                        avatar: s.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((s.userId?.fullName || 'user').trim().toLowerCase())}`
                    },
                    problemName: s.problemId?.title || "Problem",
                    problemSlug: s.problemId?.slug || "",
                    difficulty: (s.problemId?.difficulty || "EASY").toLowerCase(),
                    content: `${s.userId?.fullName || "User"} solved ${s.problemId?.title || "a problem"}`,
                    time: s.createdAt?.toISOString ? s.createdAt.toISOString() : new Date(s.createdAt).toISOString(),
                    meta: "Practice"
                }));
                
                console.log(`Dashboard API - Mapped ${submissionItems.length} submission items`);

                const postItems: any[] = posts.map(p => ({
                    id: p._id.toString(),
                    type: "post",
                    user: {
                        id: (p.author as any)?._id.toString(),
                        name: (p.author as any)?.fullName || "Unknown User",
                        avatar: (p.author as any)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(((p.author as any)?.fullName || 'user').trim().toLowerCase())}`
                    },
                    content: p.type === "Win" 
                        ? `${(p.author as any)?.fullName || "User"} shared a new achievement!` 
                        : p.type === "Question"
                        ? `${(p.author as any)?.fullName || "User"} asked a new question.`
                        : `${(p.author as any)?.fullName || "User"} shared a new post.`,
                    postPreview: p.content.substring(0, 100),
                    postType: p.type, // "Snippet", "Question", "Win"
                    time: (p as any).createdAt.toISOString(),
                    meta: "Community"
                }));
                
                console.log(`Dashboard API - Mapped ${postItems.length} post items`);

                // Combine and sort
                const combinedItems = [...submissionItems, ...postItems]
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 15);
                    
                console.log(`Dashboard API - Combined ${combinedItems.length} feed items`);
                console.log(`Dashboard API - User streak: ${liveStreak}, XP: ${xp}, Level: ${level}`);

                return combinedItems;
            })(),
            events: [],
            stats: {
                topPercentile: 0,
                activeStudents: 124,
                registeredCount: 850,
            },
        };

        return res.status(200).json(dashboardData);
    } catch (error) {
        console.error("Get dashboard data error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCommunityFeed = async (req: AuthRequest, res: Response) => {
    try {
        const feedData = {
            trendingTags: ["#javascript", "#rust", "#algorithms", "#internship", "#react_tips", "#python"],
            posts: [
            ],
            leaderboard: [
            
            ],
            events: [
           
            ]
        };
        return res.status(200).json(feedData);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCommunityRooms = async (req: AuthRequest, res: Response) => {
    try {
        if (!roomsSeeded) {
            await seedRooms();
            roomsSeeded = true;
        }

        const allRooms = await ChatRoom.find({}).lean();
        const roomMap = new Map(allRooms.map(r => [r.name, r]));

        // Fetch user activity from the database
        const rawActivity = await Activity.find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        const liveActivity = rawActivity.map(act => ({
            user: act.user,
            action: act.action,
            room: act.room,
            time: "Just now" // Front-end can format this
        }));

        // Dynamic member count simulation (based on unique recent messages)
        // In a real app with Redis, we'd pull exact online counts.
        // For now, let's count unique senders in the last 15 minutes as "active".
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const activeStats = await Message.aggregate([
            { $match: { createdAt: { $gte: fifteenMinsAgo } } },
            { $group: { _id: "$roomId", count: { $addToSet: "$senderId" } } },
            { $project: { _id: 1, count: { $size: "$count" } } }
        ]);
        const activeMap = new Map(activeStats.map(s => [s._id.toString(), s.count]));

        const trendingRooms = [
            {
                title: "Deep Learning",
                description: "Discussing PyTorch, TensorFlow and Neural Network architectures.",
                badge: "Hot Room",
                members: (activeMap.get(roomMap.get(ChatRoomName.DL)?._id.toString() || "") || 0).toString(),
                icon: "neurology",
                avatars: [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuD_MRocfAc3G7cAcAopZxpRTMMkXNFumYLVw-XomndRyV5EcHVrdD65-55rfGYIg9iKQQutDwr02e3qB7zJ9OzKXwQupZ5tFbqDUnYYubfQ4T-T2FIrp9YJehyWAr-3jJa7sbeGZLm54o6NJ1kDiI6bx7ji575hLuMPxdcC2Z6qUj2gEqH50i5Org4eFRMTWk1yUi6iI0bRhR7pUdJEd7x1RRkuVu5wrK5eWw_cCaf5vvoRzSSRupJ-qD87iz1dVtL0uKo5B85b2dmr",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAes5h4fmh72X8ydxiowrLL-ybzOL38IODt3PqyfCRPSo-ARtBXANbfbKzMb-bN7y3CFm5AxwBoPDb-R7_UJFcDB1Z_mh4iADbuaLxu1R7QfXupK-do-lkCAvWnI2h6LCQ_0kHPFRm-ybbZiBJ2who5yOndYpLqUkFm4xBNOsZc5ZW0XhNw_t2DXhtQ2_e7VdFEvsrI2kplh3Kgp5GkNs3xDPfIKOGP2zPKGo0qtltg8J-4YM3WUDqkJujrv748MIRE6mCRuI_qD5G4",
                ]
            },
            {
                title: "Data Structures & Algorithms",
                description: "Memory safety, ownership, and low-level optimization in Rust.",
                badge: "Featured",
                members: (activeMap.get(roomMap.get(ChatRoomName.DSA)?._id.toString() || "") || 0).toString(),
                icon: "data_object",
                avatars: [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBiHXl0P06fpJnbhQctvcP96mrHRjEHG_v5CCxmj1EesAwjaLDW7psQM_Qs9fuwyz59btEc9Avof9pJuR0ZXeBznXEQsE4sWcCMcd5mWt7C_HTvvQcGT_wqQkFD1Vq58M_SRSbFWUuSTuM-7Gs8DrYf5FlHS5f4--8cY6WgUVy2gLF2LplRYIppQloKsxbArJ6NE3FKC3nf0vUibSHrJUR5lh7ZlcWXF4IQXYS1KxNpXecFAycr3WcuPWjuGQ5MrQjK4aHHHBRZKLoi",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCfpcVKWjO4AEFrvRQbTlN2oFj7Cg9JZIGigtJzhKAjVEVG4qtYijisaj3cfaD0tJ23nms7jQi3WiRtD-WrjQZp8Cb9oRV1f7TOWJoXypeK5IFQL6HgIcoflooNNfDvsjFRiLCMNTQ8ftdkBYmoznaZQizRJGzXc9gsvfnW_X7OziwtMw6_WlfcaiDyHLWTrZXkDUwWiz_BWN5femIxz4bnoGrtD9e5qdcAsJ3XZek9lMAh2GE7wSCJ6SLaJG6iqFopyOsBtPfmp4Yy",
                ]
            }
        ].map(r => ({ ...r, id: roomMap.get(r.title as ChatRoomName)?._id.toString() || Math.random().toString() }));

        const communityRooms = [
            { title: "Machine Learning", members: (activeMap.get(roomMap.get(ChatRoomName.ML)?._id.toString() || "") || 0).toString(), icon: "smart_toy" },
            { title: "Blockchain", members: (activeMap.get(roomMap.get(ChatRoomName.BLOCKCHAIN)?._id.toString() || "") || 0).toString(), icon: "hub" },
            { title: "Data Structures & Algorithms", members: (activeMap.get(roomMap.get(ChatRoomName.DSA)?._id.toString() || "") || 0).toString(), icon: "memory" },
            { title: "Deep Learning", members: (activeMap.get(roomMap.get(ChatRoomName.DL)?._id.toString() || "") || 0).toString(), icon: "javascript" }
        ].map(r => ({ ...r, id: roomMap.get(r.title as ChatRoomName)?._id.toString() || Math.random().toString() }));

        const roomsData = {
            trendingRooms,
            communityRooms,
            masters: [
                {},
                {}
            ],
            liveActivity
        };
        return res.status(200).json(roomsData);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCommunitySnippets = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findById(userId).populate({
            path: "savedPosts",
            populate: { path: "author", select: "fullName avatar" }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Filter for Snippets only (though UI might show all saved posts in this section)
        const savedSnippets = (user.savedPosts as any[] || [])
            .filter(post => post.type === "Snippet")
            .map(post => ({
                id: post._id,
                title: post.content.split("\n")[0].substring(0, 50) || "Code Snippet",
                language: "Text", // Logic for language detection could be added later
                code: post.code || post.content,
                tags: [], // Tags logic can be added later
                updated: `Saved ${new Date(post.createdAt).toLocaleDateString()}`,
                collection: "Favorites"
            }));

        const snippetsData = {
            snippets: savedSnippets,
            collections: [
                { label: "All Snippets", count: savedSnippets.length, active: true },
                { label: "Interview Prep", count: 0, active: false },
                { label: "Favorites", count: savedSnippets.length, active: false },
            ],
            recentTags: []
        };
        return res.status(200).json(snippetsData);
    } catch (error) {
        console.error("Get community snippets error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getChatMessages = async (req: AuthRequest, res: Response) => {
    try {
        if (!roomsSeeded) {
            await seedRooms();
            roomsSeeded = true;
        }

        const { roomName } = req.params;
        if (typeof roomName !== "string") {
            return res.status(400).json({ message: "Invalid chat room name" });
        }

        const normalizedRoomName = normalizeRoomName(roomName);
        console.log(`[ChatHistory] Request for room: "${roomName}" -> Normalized: "${normalizedRoomName}"`);

        // Case-insensitive search for robust matching
        const room = await ChatRoom.findOne({ 
            name: { $regex: new RegExp(`^${normalizedRoomName}$`, "i") } 
        });
        console.log(`[getChatMessages] Room DB search result:`, room);

        if (!room) {
            console.warn(`[ChatHistory] Room NOT FOUND in database for "${normalizedRoomName}"`);
            return res.status(404).json({ message: "Chat room not found" });
        }

        console.log(`[ChatHistory] Found room: "${room.name}" ID: ${room._id}`);

        const messages = await Message.find({ roomId: room._id, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("senderId", "fullName email avatar");

        console.log(`[ChatHistory] Found ${messages.length} messages for room ID ${room._id}`);

        // Reverse to get chronological order for the client
        return res.status(200).json(messages.reverse());
    } catch (error) {
        console.error("Get chat messages error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getChatRoomMembers = async (req: AuthRequest, res: Response) => {
    try {
        const { roomName } = req.params;
        if (typeof roomName !== "string") {
            return res.status(400).json({ message: "Invalid chat room name" });
        }

        const normalizedRoomName = normalizeRoomName(roomName);
        const room = await ChatRoom.findOne({ 
            name: { $regex: new RegExp(`^${normalizedRoomName}$`, "i") } 
        });
        if (!room) {
            return res.status(404).json({ message: "Chat room not found" });
        }

        // Find all unique senderIds in this room from messages
        const memberIds = await Message.distinct("senderId", { roomId: room._id });

        // Fetch user details for these IDs
        const members = await User.find(
            { _id: { $in: memberIds } },
            "fullName email avatar"
        ).lean();

        return res.status(200).json(members);
    } catch (error) {
        console.error("Get chat room members error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getProfileByHandle = async (req: AuthRequest, res: Response) => {
    try {
        const { handle } = req.params;
        if (!handle) {
            return res.status(400).json({ message: "Handle is required" });
        }

        const user = await User.findOne({ handle })
            .select("-password")
            .populate("followers", "fullName handle avatar bio")
            .populate("following", "fullName handle avatar bio");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = user._id;

        // 1. Fetch solved problems with difficulty for XP calculation
        
        // Step 1: Get unique problem IDs from accepted submissions
        const uniqueProblemIds = await Submission.distinct("problemId", { 
            userId, 
            status: SubmissionResult.ACCEPTED 
        });

        console.log("=== PROFILE XP CALCULATION DEBUG ===");
        console.log("User handle:", handle);
        console.log("User ID:", userId);
        console.log("Unique problem IDs found:", uniqueProblemIds.length);
        console.log("Problem IDs:", uniqueProblemIds);

        // Step 2: Fetch the actual problems with their difficulty
        const solvedProblems = await Problem.find({ _id: { $in: uniqueProblemIds } }).select('difficulty');
        
        console.log("Problems fetched:", solvedProblems.length);
        console.log("Problems data:", JSON.stringify(solvedProblems, null, 2));

        // Step 3: Calculate XP based on difficulty: EASY=100, MEDIUM=200, HARD=400
        let totalXp = 0;
        solvedProblems.forEach((problem: any) => {
            const difficulty = problem.difficulty;
            console.log(`Processing problem ${problem._id} - Difficulty: ${difficulty}`);
            if (difficulty === "EASY") totalXp += 100;
            else if (difficulty === "MEDIUM") totalXp += 200;
            else if (difficulty === "HARD") totalXp += 400;
            else {
                console.log(`WARNING: Unknown difficulty "${difficulty}", defaulting to 100 XP`);
                totalXp += 100; // Default to EASY if difficulty is missing
            }
        });

        console.log("Total XP calculated:", totalXp);
        console.log("=== END PROFILE XP DEBUG ===");

        // Get list of solved problem IDs (for count)
        const solvedSubmissions = uniqueProblemIds;

        // 2. Total Points (Solved count * 10 for compatibility)
        const totalPoints = solvedSubmissions.length * 10;

        // 3. Department Rank (Based on solved problems)
        const allUserSolves = await Submission.aggregate([
            { $match: { status: SubmissionResult.ACCEPTED } },
            { $group: { _id: "$userId", count: { $addToSet: "$problemId" } } },
            { $project: { _id: 1, solveCount: { $size: "$count" } } },
            { $sort: { solveCount: -1 } }
        ]);
        
        const userIndex = allUserSolves.findIndex(u => u._id?.toString() === userId.toString());
        const rank = userIndex !== -1 ? userIndex + 1 : allUserSolves.length + 1;

        // 4. Activity Heatmap (Start from March 2026)
        const startDate = new Date(2026, 2, 1);
        
        const heatmapData = await Submission.aggregate([
            { $match: { userId, createdAt: { $gte: startDate } } },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $project: { date: "$_id", count: 1, _id: 0 } }
        ]);

        // 5. Current Streak
        
        let currentStreak = user.streak || 0;
        if (user.lastStreakUpdate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastDate = new Date(user.lastStreakUpdate);
            lastDate.setHours(0, 0, 0, 0);
            const diffInDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
            if (diffInDays > 1) {
                currentStreak = 0; // Broken streak
            }
        }
            
            
            

        // 6. Submissions Today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const submissionsToday = await Submission.find({ 
            userId, 
            createdAt: { $gte: startOfToday } 
        }).populate("problemId", "title difficulty");

        // 7. Recent Activity - Only show accepted submissions
        const recentSubmissions = await Submission.find({ 
            userId,
            status: SubmissionResult.ACCEPTED // Only show accepted submissions
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("problemId", "title");
            
        const recentPosts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        const recentActivity = [
            ...recentSubmissions.map(s => ({
                id: s._id,
                type: "submission",
                content: `Solved problem: ${ (s.problemId as any)?.title || "Unknown" }`,
                time: (s as any).createdAt,
                status: s.status
            })),
            ...recentPosts.map(p => ({
                id: p._id,
                type: "post",
                content: `Shared a post: ${ (p.content || "").substring(0, 50) }...`,
                time: (p as any).createdAt
            }))
        ]
        .filter(item => item.time != null)
        .sort((a, b) => {
            const timeA = a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime();
            const timeB = b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime();
            return timeB - timeA;
        })
        .slice(0, 10);

                // 8. Badges Earned (Based on milestones)
                let badgesCount = 0;
                if (solvedSubmissions.length >= 1) badgesCount++; // First Solve
                if (solvedSubmissions.length >= 5) badgesCount++; // 5 Solves
                if (solvedSubmissions.length >= 25) badgesCount++; // 25 Solves
                if (solvedSubmissions.length >= 100) badgesCount++; // 100 Solves
                if (currentStreak >= 7) badgesCount++; // Weekly Warrior
                if (currentStreak >= 30) badgesCount++; // Monthly Master

                return res.status(200).json({
                    user: {
                        _id: user._id,
                        fullName: user.fullName,
                        handle: user.handle,
                        avatar: user.avatar,
                        program: user.program,
                        semester: user.semester,
                        bio: user.bio,
                        points: totalPoints,
                        solvedCount: solvedSubmissions.length,
                        rank,
                        currentStreak,
                        heatmapData,
                        totalXp,
                        badgesCount,
                        followersCount: (user.followers || []).length,
                        followingCount: (user.following || []).length,
                        followers: user.followers || [],
                        following: user.following || [],
                        isFollowing: req.user?.id ? (user.followers || []).some((f: any) => (f._id || f).toString() === req.user?.id) : false,
                        submissionsToday: submissionsToday.map(s => ({
                            id: s._id,
                            title: (s.problemId as any)?.title || "Unknown",
                            difficulty: (s.problemId as any)?.difficulty || "Easy",
                            time: (s as any).createdAt,
                            status: s.status
                        })),
                        recentActivity
                    }
                });
    } catch (error: any) {
        console.error("Get profile by handle error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message, stack: error.stack });
    }
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.trim() === '') {
            return res.json({ users: [] });
        }

        const users = await User.find({
            $or: [
                { fullName: { $regex: q.trim(), $options: 'i' } },
                { handle: { $regex: q.trim(), $options: 'i' } }
            ]
        })
        .select('fullName handle avatar profile')
        .limit(10);

        const results = users.map(user => ({
            _id: user._id,
            fullName: user.fullName,
            handle: user.handle,
            avatar: user.avatar,
            program: (user as any).profile?.program || "CUHP Dev"
        }));

        return res.json({ users: results });
    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({ message: "Error searching users" });
    }
};

/**
 * Get user submissions since a specific timestamp
 * Query param: ?since=<timestamp in milliseconds>
 */
export const getUserSubmissions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const { since } = req.query;
        const sinceTimestamp = since ? parseInt(since as string, 10) : 0;

        if (isNaN(sinceTimestamp)) {
            return res.status(400).json({ message: "Invalid 'since' parameter. Must be a valid timestamp." });
        }

        const sinceDate = new Date(sinceTimestamp);

        // Fetch submissions since the given timestamp
        const submissions = await Submission.find({
            userId,
            createdAt: { $gte: sinceDate }
        })
        .populate("problemId", "title slug difficulty")
        .sort({ createdAt: -1 })
        .lean();

        // Format response
        const formattedSubmissions = submissions.map(sub => ({
            id: sub._id,
            problemId: (sub.problemId as any)?._id,
            problemTitle: (sub.problemId as any)?.title || "Unknown",
            problemSlug: (sub.problemId as any)?.slug || "",
            difficulty: (sub.problemId as any)?.difficulty || "EASY",
            language: sub.language,
            status: sub.status,
            createdAt: (sub as any).createdAt,
            testcasesPassed: sub.testcasesPassed,
            totalTestcases: sub.totalTestcases
        }));

        return res.status(200).json(formattedSubmissions);

    } catch (error) {
        console.error("Get user submissions error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const followUser = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?.id;
        const { targetUserId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already following
        const isFollowing = (currentUser.following || []).some(id => id.toString() === targetUserId);
        if (isFollowing) {
            return res.status(400).json({ message: "You are already following this user" });
        }

        // Initialize lists if undefined
        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];
        if (!targetUser.notifications) targetUser.notifications = [];

        // Add to following
        currentUser.following.push(targetUser._id as any);
        await currentUser.save();

        // Add to target's followers
        targetUser.followers.push(currentUser._id as any);

        // Check if targetUser is already following currentUser (Mutual follow / Follow back)
        const isTargetFollowingBack = (targetUser.following || []).some(id => id.toString() === currentUserId);
        
        let notificationType: "follow" | "follow_back" = "follow";
        let notificationMessage = `${currentUser.fullName} started following you.`;

        if (isTargetFollowingBack) {
            notificationType = "follow_back";
            notificationMessage = `${currentUser.fullName} followed you back!`;
        }

        // Push notification to targetUser
        targetUser.notifications.push({
            type: notificationType,
            fromUser: currentUser._id as any,
            message: notificationMessage,
            read: false,
            createdAt: new Date()
        });

        await targetUser.save();

        return res.status(200).json({
            message: notificationType === "follow_back" ? "Followed back successfully" : "Followed user successfully",
            followingCount: currentUser.following.length,
            followersCount: targetUser.followers.length,
            isFollowing: true
        });
    } catch (error) {
        console.error("Follow user error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?.id;
        const { targetUserId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if following
        const isFollowing = (currentUser.following || []).some(id => id.toString() === targetUserId);
        if (!isFollowing) {
            return res.status(400).json({ message: "You are not following this user" });
        }

        // Remove from following
        currentUser.following = (currentUser.following || []).filter(id => id.toString() !== targetUserId);
        await currentUser.save();

        // Remove from target's followers
        targetUser.followers = (targetUser.followers || []).filter(id => id.toString() !== currentUserId);
        await targetUser.save();

        return res.status(200).json({
            message: "Unfollowed user successfully",
            followingCount: currentUser.following.length,
            followersCount: targetUser.followers.length,
            isFollowing: false
        });
    } catch (error) {
        console.error("Unfollow user error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findById(userId)
            .populate("notifications.fromUser", "fullName handle avatar")
            .select("notifications");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Sort notifications by date descending
        const sortedNotifications = (user.notifications || []).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return res.status(200).json(sortedNotifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.notifications) {
            user.notifications.forEach(n => {
                n.read = true;
            });
            await user.save();
        }

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark notifications read error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
