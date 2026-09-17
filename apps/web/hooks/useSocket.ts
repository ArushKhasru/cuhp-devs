"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";
const HTTP_URL = "/api";

const getPersistedAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("auth-storage");
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { state?: { token?: unknown } };
        const token = parsed?.state?.token;
        return typeof token === "string" && token.trim() ? token : null;
    } catch {
        return null;
    }
};

export const useSocket = (token: string | null): {
    socket: Socket | null;
    isConnected: boolean;
    joinRoom: (roomName: string) => void;
    leaveRoom: (roomName: string) => void;
    sendMessage: (roomName: string, content: string) => void;
} => {
    const socketRef = useRef<Socket | null>(null);
    const joinedRooms = useRef(new Set<string>());
    const hasLoggedConnectErrorRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const [resolvedToken, setResolvedToken] = useState<string | null>(token || null);
    const [isResolvingToken, setIsResolvingToken] = useState(false);
    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        if (token) {
            setResolvedToken(token);
            return;
        }

        const persistedToken = getPersistedAuthToken();
        if (persistedToken) {
            setResolvedToken(persistedToken);
            return;
        }

        setResolvedToken(null);
        let isMounted = true;
        setIsResolvingToken(true);

        const loadSocketToken = async () => {
            try {
                const response = await fetch(`${HTTP_URL}/auth/socket-token`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    return;
                }

                const data = (await response.json()) as { token?: string };
                if (!data.token || !isMounted) {
                    return;
                }

                setResolvedToken(data.token);
                setToken(data.token);
            } catch {
                // No-op: socket remains disconnected until auth token is available.
            } finally {
                if (isMounted) {
                    setIsResolvingToken(false);
                }
            }
        };

        void loadSocketToken();

        return () => {
            isMounted = false;
        };
    }, [token, setToken]);

    useEffect(() => {
        if (!resolvedToken || isResolvingToken) return;

        const socket = io(SOCKET_URL, {
            auth: { token: resolvedToken },
            transports: ["polling", "websocket"],
            timeout: 10000,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
            joinedRooms.current.forEach(roomName => socket.emit("join-room", { roomName }));
            hasLoggedConnectErrorRef.current = false;
            console.log("Socket connected:", socket.id);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
            console.log("Socket disconnected");
        });

        socket.on("connect_error", (err) => {
            if (!hasLoggedConnectErrorRef.current) {
                console.warn("Socket connection error:", err.message);
                hasLoggedConnectErrorRef.current = true;
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [resolvedToken, isResolvingToken]);

    const joinRoom = useCallback((roomName: string) => {
        joinedRooms.current.add(roomName);
        if (socketRef.current) {
            console.log(`[useSocket] Joining room: ${roomName}`);
            socketRef.current.emit("join-room", { roomName });
        }
    }, []);

    const leaveRoom = useCallback((roomName: string) => {
        joinedRooms.current.delete(roomName);
        if (socketRef.current) {
            console.log(`[useSocket] Leaving room: ${roomName}`);
            socketRef.current.emit("leave-room", { roomName });
        }
    }, []);

    const sendMessage = useCallback((roomName: string, content: string) => {
        if (socketRef.current) {
            console.log(`[useSocket] Sending message to ${roomName}`);
            socketRef.current.emit("send-message", { roomName, content });
        } else {
            console.warn("[useSocket] Cannot send message: socket is null");
        }
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
    };
};
