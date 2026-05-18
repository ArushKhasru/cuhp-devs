"use client";

import { useEffect, useState } from "react";
import ChatRooms from "@repo/ui/community/ChatRooms";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";

const DEFAULT_ROOMS_DATA = {
    trendingRooms: [],
    communityRooms: [],
    masters: [],
    liveActivity: [],
};

export function CommunityChatRoomsClient() {
    const token = useAuthStore((state) => state.token);
    const [roomsData, setRoomsData] = useState(DEFAULT_ROOMS_DATA);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadRooms = async () => {
            setIsLoading(true);
            try {
                const data = await apiFetch("/user/community/rooms");
                if (isMounted && data) {
                    setRoomsData(data);
                }
            } catch (error) {
                console.error("Failed to fetch community rooms:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadRooms();

        return () => {
            isMounted = false;
        };
    }, []);

    return <ChatRooms data={roomsData} token={token} isLoading={isLoading} />;
}
