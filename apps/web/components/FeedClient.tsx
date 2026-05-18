"use client";

import { useState, useEffect, useRef } from "react";
import Feed from "@repo/ui/community/Feed";
import { FeedTab } from "@repo/ui/community/FeedTabs";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "../store/useToastStore";
import { io, Socket } from "socket.io-client";

interface FeedClientProps {
    initialData: {
        trendingTags: string[];
        posts: any[];
        leaderboard: any[];
        events: any[];
    };
}

export default function FeedClient({ initialData }: FeedClientProps) {
    const [posts, setPosts] = useState(initialData.posts);
    const [activeTab, setActiveTab] = useState<FeedTab>("Recent");
    const [isLoading, setIsLoading] = useState(true);
    const { user, token, setUser } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);
    const hasLoggedConnectErrorRef = useRef(false);

    useEffect(() => {
        // Connect to socket server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";
        console.log(`[FeedClient] Connecting to socket at ${socketUrl}`);

        const socket = io(socketUrl, {
            auth: {
                token: token || ""
            },
            transports: ["websocket"],
            timeout: 10000,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            hasLoggedConnectErrorRef.current = false;
            console.log("[FeedClient] Connected to post socket");
        });

        socket.on("connect_error", (err) => {
            if (!hasLoggedConnectErrorRef.current) {
                console.warn("[FeedClient] Socket connection error:", err.message);
                hasLoggedConnectErrorRef.current = true;
            }
        });

        socket.on("new-post", (newPost) => {
            console.log("Received new post via socket:", newPost);
            setPosts((prevPosts) => {
                // Avoid duplicates
                const exists = prevPosts.some(p => (p.id || p._id) === (newPost.id || newPost._id));
                if (exists) return prevPosts;
                return [newPost, ...prevPosts];
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    useEffect(() => {
        const initAuth = async () => {
            if (!user) {
                try {
                    const profile = await apiFetch("/user/profile");
                    if (profile) {
                        setUser(profile);
                    }
                } catch (error) {
                    // Silently fail if not logged in
                }
            }
        };
        initAuth();
    }, [user, setUser]);

    useEffect(() => {
        const loadPosts = async () => {
            setIsLoading(true);
            try {
                const fetchedPosts = await apiFetch("/posts");
                if (Array.isArray(fetchedPosts)) {
                    setPosts(fetchedPosts);
                }
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPosts();
    }, []);

    const handlePost = async (data: { content: string; type: string }) => {
        try {
            const response = await apiFetch("/posts", {
                method: "POST",
                body: JSON.stringify(data),
            });

            if (response.post) {
                setPosts((prevPosts) => [response.post, ...prevPosts]);
                toast.success("Post shared successfully!");
            }
        } catch (error) {
            console.error("Failed to create post:", error);
            toast.error("Failed to share post.");
            throw error;
        }
    };

    const handleLike = async (postId: string) => {
        try {
            const response = await apiFetch(`/posts/${postId}/like`, {
                method: "POST"
            });

            if (response) {
                setPosts(posts.map(post => {
                    const id = post.id || post._id;
                    if (id === postId) {
                        const userId = user?.id;
                        if (!userId) return post;

                        const currentLikes = Array.isArray(post.likes) ? post.likes : [];
                        const isLikedNow = response.isLiked;

                        const newLikes = isLikedNow
                            ? [...currentLikes, userId]
                            : currentLikes.filter((uid: string) => String(uid) !== String(userId));

                        return { ...post, likes: newLikes };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error("Failed to like post:", error);
        }
    };

    const handleBookmark = async (postId: string) => {
        try {
            const response = await apiFetch(`/posts/${postId}/bookmark`, {
                method: "POST"
            });

            if (response) {
                // Update local user state in store
                const currentSaved = user?.savedPosts || [];
                const newSaved = response.isBookmarked
                    ? [...currentSaved, postId]
                    : currentSaved.filter(id => id !== postId);

                if (user) {
                    useAuthStore.getState().setUser({ ...user, savedPosts: newSaved });
                }

                if (response.isBookmarked) {
                    toast.success("Snippet has been saved!");
                } else {
                    toast.info("Removed from saved snippets");
                }
            }
        } catch (error) {
            console.error("Failed to bookmark post:", error);
            toast.error("Failed to save snippet");
        }
    };

    return (
        <Feed
            data={{ ...initialData, posts }}
            isLoading={isLoading}
            onPost={handlePost}
            onLike={handleLike}
            onBookmark={handleBookmark}
            userAvatar={user?.avatar}
            userName={user?.fullName}
            currentUserId={user?.id}
            savedPosts={user?.savedPosts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />
    );
}
