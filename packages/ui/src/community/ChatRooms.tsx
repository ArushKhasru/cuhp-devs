"use client";

import { useEffect, useState } from "react";
import { TrendingUp, LayoutGrid, List, Plus, MessageSquare, X, Shield, Users, Hash } from "../icons";
import { RoomCard } from "./RoomCard";
import { RoomCategoryCard } from "./RoomCategoryCard";
import { RoomsRightSidebar } from "./RoomsRightSidebar";
import { useSocket } from "../../../../apps/web/hooks/useSocket";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ChatRoomsProps {
  data: {
    trendingRooms: any[];
    communityRooms: any[];
    masters: any[];
    liveActivity: any[];
  };
  token: string | null;
  isLoading?: boolean;
}

function EmptyRoomsPlaceholder({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-card-border rounded-3xl bg-background/20">
      <div className="w-20 h-20 bg-background/40 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-card-border">
        <MessageSquare size={40} className="text-muted-custom/40" />
      </div>
      <p className="text-foreground/60 text-lg font-bold">{message}</p>
      <p className="text-muted-custom/40 text-sm mt-2 max-w-[200px]">Check back soon or be the first to start a conversation!</p>
    </div>
  );
}

function CreateRoomCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-card-custom/50 backdrop-blur-xl rounded-2xl border border-dashed border-card-border p-5 flex flex-col items-center justify-center text-center hover:bg-primary-custom/5 hover:border-primary-custom/50 transition-all cursor-pointer group h-full min-h-[220px] relative overflow-hidden"
    >
      <div className="w-14 h-14 rounded-full border border-dashed border-card-border flex items-center justify-center text-muted-custom/30 mb-4 group-hover:scale-110 group-hover:bg-primary-custom group-hover:text-primary-foreground-custom group-hover:border-primary-custom transition-all duration-500 shadow-xl group-hover:shadow-primary-custom/40">
        <Plus size={28} />
      </div>
      <h4 className="font-bold text-foreground/80 group-hover:text-primary-custom transition-colors text-lg">Start or Join a New Room</h4>
      <p className="text-xs text-muted-custom max-w-[160px] mt-2 leading-relaxed">Can't find a topic? Create your own study group and invite friends.</p>

      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-custom/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function CreateRoomModal({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (name: string) => void }) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card-custom border border-card-border rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight">Create New Room</h3>
              <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-xl transition-colors text-muted-custom">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-custom uppercase tracking-[0.2em] ml-1">Room Name</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-custom group-focus-within:text-primary-custom transition-colors">
                    <Hash size={18} />
                  </div>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Distributed Systems"
                    className="w-full bg-background/50 border border-card-border rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary-custom/20 focus:border-primary-custom transition-all placeholder:text-muted-custom/30"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary-custom/5 border border-primary-custom/10 rounded-2xl flex gap-3 italic">
                <Shield size={16} className="text-primary-custom shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-custom leading-relaxed">
                  New rooms are public by default. Be the first to start the discussion!
                </p>
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-4 bg-primary-custom text-primary-foreground-custom rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-custom/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
              >
                Launch Room
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function ChatRooms({ data: initialData, token, isLoading }: ChatRoomsProps) {
  const [data, setData] = useState(initialData);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { socket, isConnected } = useSocket(token);
  const router = useRouter();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Request initial global stats
    socket.emit("get-global-stats");

    const handleGlobalStats = ({ stats, activityLog }: { stats: Record<string, number>, activityLog: any[] }) => {
      setData(prev => {
        const updateRoomMembers = (rooms: any[]) => rooms.map(room => ({
          ...room,
          members: stats[room.id]?.toString() || "0"
        }));

        return {
          ...prev,
          trendingRooms: updateRoomMembers(prev.trendingRooms),
          communityRooms: updateRoomMembers(prev.communityRooms),
          liveActivity: activityLog.length > 0 ? activityLog : prev.liveActivity
        };
      });
    };

    const handleGlobalActivity = (activity: any) => {
      setData(prev => ({
        ...prev,
        liveActivity: [activity, ...prev.liveActivity].slice(0, 20)
      }));
    };

    const handleRoomsStats = ({ stats }: { stats: Record<string, number> }) => {
      setData(prev => {
        const updateRoomMembers = (rooms: any[]) => rooms.map(room => ({
          ...room,
          members: stats[room.id]?.toString() || "0"
        }));

        return {
          ...prev,
          trendingRooms: updateRoomMembers(prev.trendingRooms),
          communityRooms: updateRoomMembers(prev.communityRooms),
        };
      });
    };

    const handleNewRoomAvailable = (room: any) => {
      const normalizedRoom = {
        ...room,
        id: typeof room.id === 'string' ? [...room.id].reduce((acc, char) => acc + char.charCodeAt(0), 0) : Date.now(),
        title: room.title || room.name || "New Room",
        icon: room.icon || "hub",
        contributor: room.topContributor || room.contributor || "Unknown"
      };

      setData(prev => ({
        ...prev,
        communityRooms: [normalizedRoom, ...prev.communityRooms]
      }));
    };

    const handleRoomCreated = ({ name, id }: { name: string, id: string }) => {
      router.push(`/community/chat-rooms/${name}`);
    };

    socket.on("global-stats", handleGlobalStats);
    socket.on("global-user-activity", handleGlobalActivity);
    socket.on("global-rooms-stats", handleRoomsStats);
    socket.on("room-created", handleRoomCreated);
    socket.on("new-room-available", handleNewRoomAvailable);

    return () => {
      socket.off("global-stats", handleGlobalStats);
      socket.off("global-user-activity", handleGlobalActivity);
      socket.off("global-rooms-stats", handleRoomsStats);
      socket.off("room-created", handleRoomCreated);
      socket.off("new-room-available", handleNewRoomAvailable);
    };
  }, [socket, isConnected]);

  return (
    <main className="flex-1 min-h-0 flex flex-col xl:flex-row gap-8 p-4 md:p-8 overflow-y-auto w-full custom-scrollbar bg-transparent animate-fade-in">
      <div className="flex-1 space-y-12">
        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-4 tracking-tight">
                <span className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                  <TrendingUp size={24} className="text-orange-500" />
                </span>
                Trending Rooms
              </h2>
              <p className="text-muted-custom text-sm mt-2 ml-14 font-medium uppercase tracking-widest leading-none">Most active study groups right now</p>
            </div>
            <button className="text-xs font-black text-primary-custom uppercase tracking-widest px-4 py-2 bg-primary-custom/5 rounded-full border border-primary-custom/20 hover:bg-primary-custom hover:text-primary-foreground-custom transition-all">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="bg-card-custom border border-card-border rounded-3xl p-6 h-48 animate-pulse space-y-4 flex flex-col justify-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 bg-slate-800 rounded-lg" />
                      <div className="h-3 w-16 bg-slate-800/60 rounded-md" />
                    </div>
                  </div>
                  <div className="h-3.5 w-full bg-slate-800/40 rounded-md" />
                  <div className="h-3.5 w-2/3 bg-slate-800/40 rounded-md" />
                </div>
              ))
            ) : data.trendingRooms.length > 0 ? (
              data.trendingRooms.map((room: any, i: number) => (
                <div
                  key={room.id}
                  style={{ animationDelay: `${i * 100}ms` }}
                  className="animate-[fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0"
                >
                  <RoomCard room={room} />
                </div>
              ))
            ) : (
              <EmptyRoomsPlaceholder message="No trending rooms today." />
            )}
          </div>
        </section>

        {/* Section divider */}
        <div className="flex items-center gap-6 py-6 overflow-hidden">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-card-border to-transparent" />
          <span className="text-[10px] text-primary-custom font-black uppercase tracking-[0.5em] px-6 py-2.5 bg-primary-custom/5 rounded-full border border-primary-custom/10 backdrop-blur-xl shrink-0">
            Community Explorer
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-card-border to-transparent" />
        </div>

        {/* Categories Section */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Explore Categories
            </h2>
            <div className="flex bg-card-custom rounded-xl p-1 border border-card-border backdrop-blur-md">
              <button className="p-2 rounded-lg bg-primary-custom text-primary-foreground-custom shadow-lg shadow-primary-custom/20 transition-all">
                <LayoutGrid size={18} />
              </button>
              <button className="p-2 rounded-lg text-muted-custom hover:text-foreground transition-all">
                <List size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-card-custom border border-card-border rounded-2xl p-5 h-56 animate-pulse space-y-4 flex flex-col justify-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-slate-800 rounded-md" />
                    <div className="h-3.5 w-full bg-slate-800/50 rounded-md" />
                    <div className="h-3.5 w-5/6 bg-slate-800/50 rounded-md" />
                  </div>
                  <div className="h-4 w-16 bg-slate-800 rounded-full" />
                </div>
              ))
            ) : data.communityRooms.length > 0 ? (
              <>
                {data.communityRooms.map((room: any, i: number) => (
                  <div
                    key={room.id}
                    style={{ animationDelay: `${(i + data.trendingRooms.length) * 80}ms` }}
                    className="animate-[fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0"
                  >
                    <RoomCategoryCard room={room} />
                  </div>
                ))}
                <div
                  style={{ animationDelay: `${(data.communityRooms.length + data.trendingRooms.length) * 80}ms` }}
                  className="animate-[fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0"
                >
                  <CreateRoomCard onClick={() => setShowCreateModal(true)} />
                </div>
              </>
            ) : (
              <EmptyRoomsPlaceholder message="Wait for more communities to sprout!" />
            )}
          </div>
        </section>
      </div>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(roomName) => {
          socket?.emit("create-room", { roomName });
        }}
      />

      <RoomsRightSidebar
        masters={data.masters}
        liveActivity={data.liveActivity}
      />
    </main>
  );
}
