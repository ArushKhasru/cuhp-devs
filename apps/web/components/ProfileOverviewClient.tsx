"use client";

import { ProfileOverview } from "@repo/ui";
import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";

interface ProfileOverviewClientProps {
    user: any;
    isOwnProfile: boolean;
}

export function ProfileOverviewClient({ user: initialUser, isOwnProfile }: ProfileOverviewClientProps) {
    const [user, setUser] = useState(initialUser);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleSearch = async (query: string) => {
        return apiFetch(`/user/suggest?q=${query}`);
    };

    const handleFollowToggle = async () => {
        if (!user?._id) return;
        try {
            const endpoint = user.isFollowing 
                ? `/user/unfollow/${user._id}`
                : `/user/follow/${user._id}`;
            await apiFetch(endpoint, { method: "POST" });
            await refreshUserData();
        } catch (err) {
            console.error("Failed to toggle follow status:", err);
        }
    };

    // Fetch fresh user data
    const refreshUserData = async () => {
        if (isRefreshing) return;
        
        try {
            setIsRefreshing(true);
            const response = await apiFetch(`/user/profile/handle/${initialUser.handle}`);
            if (response?.user) {
                setUser(response.user);
            }
        } catch (err) {
            console.error("Failed to refresh profile data:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshUserData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialUser.handle]);

    // Also refresh on mount to get latest data
    useEffect(() => {
        refreshUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialUser.handle]);

    return (
        <ProfileOverview 
            user={user} 
            isOwnProfile={isOwnProfile} 
            onSearch={handleSearch} 
            onFollowToggle={handleFollowToggle}
        />
    );
}
