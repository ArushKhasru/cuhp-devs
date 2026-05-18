"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { useAuthStore } from "../store/useAuthStore";
import { apiFetch } from "../lib/api";

interface ChatRoomPageClientProps {
    roomName: string;
}

interface Message {
    _id: string;
    content: string;
    senderId: {
        _id: string;
        fullName: string;
        email: string;
        avatar?: string;
    };
    createdAt: string;
}

export function ChatRoomPageClient({ roomName }: ChatRoomPageClientProps) {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const [initialMessages, setInitialMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadMessages = async () => {
            setIsLoading(true);
            const url = `/user/community/rooms/${encodeURIComponent(roomName)}/messages`;
            console.log(`[ChatRoomPageClient] Fetching history from: ${url}`);
            try {
                const messages = await apiFetch(url);
                console.log(`[ChatRoomPageClient] Received ${Array.isArray(messages) ? messages.length : 'error/null'} messages`);
                if (isMounted && Array.isArray(messages)) {
                    setInitialMessages(messages);
                }
            } catch (error) {
                console.error("[ChatRoomPageClient] Failed to load chat room data:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadMessages();

        return () => {
            isMounted = false;
        };
    }, [roomName]);

    const currentUser = useMemo(() => {
        if (!user) return null;
        return {
            id: user.id,
            name: user.fullName,
            avatar: user.avatar,
        };
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex-1 flex overflow-hidden bg-background relative border-x border-primary-custom/10 animate-pulse">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                    {/* Header */}
                    <header className="h-16 shrink-0 border-b border-card-border px-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-slate-800 rounded-lg" />
                                <div className="h-3 w-20 bg-slate-800/60 rounded-md" />
                            </div>
                        </div>
                    </header>

                    {/* Messages Area */}
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        {[1, 2, 3, 4].map((i) => {
                            const isRight = i % 2 === 0;
                            return (
                                <div key={i} className={`flex gap-3 max-w-lg ${isRight ? 'ml-auto flex-row-reverse' : ''}`}>
                                    <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className={`h-4 w-20 bg-slate-800 rounded-md ${isRight ? 'ml-auto' : ''}`} />
                                        <div className={`p-4 bg-card-custom border border-card-border rounded-3xl ${isRight ? 'rounded-tr-none' : 'rounded-tl-none'} space-y-1.5`}>
                                            <div className="h-3 w-full bg-slate-800 rounded" />
                                            <div className="h-3 w-4/6 bg-slate-800 rounded" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <footer className="p-4 bg-background/50 border-t border-card-border/50">
                        <div className="h-12 w-full bg-card-custom border border-card-border rounded-2xl" />
                    </footer>
                </div>

                {/* Sidebar */}
                <aside className="hidden xl:flex flex-col w-80 shrink-0 p-6 space-y-6 border-l border-card-border">
                    <div className="bg-card-custom border border-card-border rounded-2xl p-5 h-44 flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl" />
                        <div className="h-5 w-24 bg-slate-800 rounded-md" />
                        <div className="h-3 w-32 bg-slate-800/60 rounded-md" />
                    </div>
                </aside>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            <ChatWindow
                roomName={roomName}
                initialMessages={initialMessages}
                token={token}
                currentUser={currentUser}
            />
        </div>
    );
}
