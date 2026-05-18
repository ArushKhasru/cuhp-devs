"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import {
    AlertCircle,
    Bell,
    Rocket,
    Layers,
    FileText,
    Megaphone,
    Flame,
    Calendar,
    MoreHorizontal
} from "../icons";
import { DynamicIcon } from "../components/Icon";
import { motion, AnimatePresence } from "framer-motion";


// ─── Types ─────────────────────────────────────────────────────────────────────

interface User {
    name: string;
    handle?: string;
    role: string;
    avatar: string;
    program?: string;
    semester?: string;
    interests?: string[];
    level: number;
    xp: number;
    xpTarget: number;
    streakDays: number;
}

interface Badge {
    id: string;
    icon: string;
    color: string;
    label: string;
}

type ActivityType = "post" | "solved" | "streak" | "achievement" | "announcement" | "share";

interface FeedItem {
    id: string;
    type: ActivityType;
    user?: {
        id?: string;
        name: string;
        avatar: string;
    };
    content: string;
    time: string; // Keep time for compatibility or update to timestamp
    highlight?: string;
    meta?: string;
    image?: string;
    
    // Type-specific fields
    postPreview?: string;
    postType?: "Snippet" | "Question" | "Win";
    problemName?: string;
    problemSlug?: string;
    difficulty?: "easy" | "medium" | "hard";
    streakCount?: number;
    isCurrentUser?: boolean;
}

interface Event {
    id: string;
    title: string;
    date: string;
    month: string;
    time: string;
    location: string;
    isHighlighted?: boolean;
}

interface DashboardData {
    user: User;
    badges: Badge[];
    feedItems: FeedItem[];
    events: Event[];
    stats: {
        topPercentile: number;
        activeStudents: number;
        registeredCount: number;
    };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateInput: string | Date): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (Number.isNaN(date.getTime())) return "recently";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(date);
}

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function ActivityItem({ item, router }: { item: FeedItem; router: any }) {
    const relativeTime = formatRelativeTime(item.time);
    
    const renderContent = () => {
        switch (item.type) {
            case "post":
                const postTypeColors = {
                    Snippet: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    Question: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    Win: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                };
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-foreground/90">
                            <span className="font-bold hover:underline cursor-pointer">{item.user?.name}</span>
                            {" "}
                            {item.content.replace(item.user?.name || "User", "").trim()}
                        </p>
                        <div className="flex items-center gap-3">
                            {item.postType && (
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${postTypeColors[item.postType] || postTypeColors.Snippet}`}>
                                    {item.postType}
                                </span>
                            )}
                        </div>
                        {item.postPreview && (
                            <div className="p-3 bg-background/50 rounded-lg border border-primary-custom/5 text-xs text-slate-500 line-clamp-2 italic">
                                "{item.postPreview}"
                            </div>
                        )}
                    </div>
                );
            case "solved":
                const difficultyColors = {
                    easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    hard: "bg-rose-500/10 text-rose-500 border-rose-500/20"
                };
                return (
                    <div className="space-y-3">
                        <div className="flex-1">
                            <p className="text-sm text-foreground/90">
                                <span className="font-bold hover:underline cursor-pointer">{item.user?.name}</span>
                                {" solved "}
                                <span className="font-semibold text-primary-custom hover:underline cursor-pointer">{item.problemName}</span>
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${difficultyColors[item.difficulty || "easy"]}`}>
                                    {item.difficulty || "Easy"}
                                </span>
                                {item.meta && (
                                    <span className="text-xs text-muted-custom">{item.meta}</span>
                                )}
                                <button 
                                    onClick={() => router.push(`/problem/${item.problemSlug}`)}
                                    className="px-4 py-1.5 text-xs bg-background/60 border border-primary-custom/20 text-primary-custom rounded-full hover:bg-primary-custom/5 transition-all font-medium"
                                >
                                    View Problem
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case "streak":
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-foreground/90">
                            <span className="font-bold hover:underline cursor-pointer">{item.user?.name}</span>
                            {" is on a "}
                            <span className="font-bold text-orange-500">{item.streakCount}-day</span>
                            {" streak 🔥"}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Flame size={14} className="text-orange-500 animate-pulse" />
                            <span>Keep it up!</span>
                        </div>
                    </div>
                );
            default:
                // Fallback for achievement, announcement, share
                return (
                    <div className="space-y-2">
                        <p className="text-sm">
                            {item.user && <span className="font-bold hover:underline cursor-pointer">{item.user.name} </span>}
                            {item.content}{" "}
                            {item.highlight && (
                                <span className="text-primary-custom font-medium">{item.highlight}</span>
                            )}
                        </p>
                        {item.type === "achievement" && (
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs bg-primary-custom/10 text-primary-custom rounded-full hover:bg-primary-custom/20 transition-colors">
                                    Congratulate
                                </button>
                            </div>
                        )}
                        {item.image && (
                            <div className="mt-2 rounded-xl overflow-hidden h-24 w-full bg-background/60 border border-primary-custom/5 relative">
                                <img src={item.image} alt="Meta" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`p-4 bg-background/40 group hover:bg-background/60 rounded-2xl border transition-all duration-300 flex gap-4 items-start backdrop-blur-sm ${
                item.isCurrentUser ? "border-primary-custom/30 shadow-sm shadow-primary-custom/5" : "border-primary-custom/5"
            }`}
        >
            <div className="relative">
                <img
                    src={item.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((item.user?.name || 'user').trim().toLowerCase())}`}
                    alt={item.user?.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-custom/5"
                />
                {item.type === "streak" && (
                    <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5 border-2 border-background">
                        <Flame size={8} className="text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1">
                {renderContent()}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span>{relativeTime}</span>
                    {item.meta && (
                        <>
                            <span>•</span>
                            <span>{item.meta}</span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function ActivityFeed({ items, router }: { items: FeedItem[]; router: any }) {
    const [filter, setFilter] = useState<ActivityType | "all">("all");

    const filteredItems = items.filter(item => {
        if (filter === "all") return true;
        return item.type === filter;
    });

    const tabs: { id: ActivityType | "all"; label: string }[] = [
        { id: "all", label: "All" },
        { id: "post", label: "Posts" },
        { id: "solved", label: "Solved" },
        { id: "streak", label: "Streaks" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Activity Feed</h3>
                <div className="flex bg-background/50 p-1 rounded-xl border border-primary-custom/10 backdrop-blur-md relative">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative z-10 ${
                                filter === tab.id
                                    ? "text-white"
                                    : "text-slate-500 hover:text-primary-custom"
                            }`}
                        >
                            {filter === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary-custom rounded-lg shadow-lg shadow-primary-custom/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-20">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 min-h-[400px]">
                <AnimatePresence mode="popLayout">
                    {filteredItems.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 text-center bg-background/20 rounded-2xl border border-dashed border-primary-custom/10"
                        >
                            <FileText className="mx-auto mb-3 opacity-20 text-primary-custom" size={40} />
                            <p className="text-slate-500 font-medium">No activity in this category yet</p>
                        </motion.div>
                    ) : (
                        filteredItems.map(item => (
                            <ActivityItem key={item.id} item={item} router={router} />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── API Functions ─────────────────────────────────────────────────────────────

import { apiFetch } from "../lib/api";

async function fetchDashboardData(): Promise<DashboardData> {
    return apiFetch("/user/dashboard");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
    user?: Partial<User>;
    activeNav: string;
    setActiveNav: (nav: string) => void;
}

export default function Dashboard({ isCollapsed, onToggle, user: userOverride, activeNav, setActiveNav }: DashboardProps) {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const loadNotifications = async () => {
        try {
            const data = await apiFetch("/user/notifications");
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.read).length);
            }
        } catch (err) {
            console.error("Failed to load notifications:", err);
        }
    };

    const markAllRead = async () => {
        try {
            await apiFetch("/user/notifications/read", { method: "PUT" });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error("Failed to mark notifications read:", err);
        }
    };

    // Fetch dashboard data and notifications on mount and poll every 30 seconds
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await fetchDashboardData();
                setDashboardData(data);
                await loadNotifications();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard");
                console.error("Dashboard data fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();

        // Poll for updates every 30 seconds
        const interval = setInterval(async () => {
            try {
                const data = await fetchDashboardData();
                setDashboardData(data);
                await loadNotifications();
            } catch (err) {
                console.error("Dashboard refresh error:", err);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-custom border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium tracking-wide">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    const user = userOverride ? { ...dashboardData.user, ...userOverride } : dashboardData.user;
    const { badges, feedItems, events, stats } = dashboardData;
    const xp = user.xp ?? 0;
    const xpTarget = user.xpTarget ?? 1000;
    const xpPercentage = (xp / xpTarget) * 100;

    return (
        <>
            <div className="bg-background text-foreground min-h-screen flex transition-colors duration-300">
                {/* Sidebar */}
                <Sidebar
                    user={user}
                    activeNav={activeNav}
                    setActiveNav={setActiveNav}
                    isCollapsed={isCollapsed}
                    onToggle={onToggle}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col lg:flex-row h-screen overflow-y-auto scrollbar-hide">
                    {/* Center Feed */}
                    <section className="flex-1 p-6 space-y-8 max-w-4xl mx-auto w-full">
                        {/* Welcome Header */}
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
                                <p className="text-slate-500">
                                    You&apos;re in the top {stats.topPercentile}% of this week&apos;s coding sprint.
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    {user.program || "Program not set"} | {user.semester || "Semester not set"}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(user.interests ?? []).slice(0, 4).map((interest) => (
                                        <span
                                            key={interest}
                                            className="px-2 py-1 rounded-full text-xs bg-[#1337ec]/10 text-[#1337ec]"
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <button 
                                        onClick={() => {
                                            setIsNotificationsOpen(!isNotificationsOpen);
                                            if (!isNotificationsOpen) {
                                                markAllRead();
                                            }
                                        }}
                                        className="p-2 bg-background/50 rounded-xl border border-primary-custom/10 hover:border-primary-custom transition-colors relative"
                                    >
                                        <Bell className={unreadCount > 0 ? "text-primary-custom animate-pulse" : "text-slate-400"} size={20} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-custom text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isNotificationsOpen && (
                                            <>
                                                {/* Popover backdrop overlay to close when clicking outside */}
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setIsNotificationsOpen(false)} 
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute right-0 mt-2 w-80 bg-card-custom border border-card-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                                                >
                                                    <div className="p-4 border-b border-card-border flex items-center justify-between">
                                                        <h4 className="font-bold text-sm text-foreground">Notifications</h4>
                                                        {unreadCount > 0 && (
                                                            <button 
                                                                onClick={markAllRead}
                                                                className="text-xs text-primary-custom font-semibold hover:underline"
                                                            >
                                                                Mark all read
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="max-h-64 overflow-y-auto divide-y divide-card-border/50 scrollbar-hide">
                                                        {notifications.length === 0 ? (
                                                            <div className="p-8 text-center text-xs text-slate-500 font-medium">
                                                                No notifications yet
                                                            </div>
                                                        ) : (
                                                            notifications.map((notif: any) => (
                                                                <div 
                                                                    key={notif._id}
                                                                    onClick={() => {
                                                                        if (notif.fromUser?.handle) {
                                                                            window.location.href = `/${notif.fromUser.handle}`;
                                                                        }
                                                                    }}
                                                                    className={`p-3 flex items-start gap-3 hover:bg-primary-custom/5 transition-colors cursor-pointer ${
                                                                        !notif.read ? "bg-primary-custom/5" : ""
                                                                    }`}
                                                                >
                                                                    <img 
                                                                        src={notif.fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((notif.fromUser?.fullName || 'user').trim().toLowerCase())}`}
                                                                        alt="Sender avatar"
                                                                        className="w-8 h-8 rounded-full border border-card-border"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs text-foreground/90 font-medium">
                                                                            {notif.message}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                                                {notif.type === "follow_back" ? "Connection 🤝" : "New Follower ✨"}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-500">
                                                                                {formatRelativeTime(notif.createdAt)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button className="bg-primary-custom hover:brightness-110 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary-custom/20">
                                    <Rocket size={16} />
                                    Daily Challenge
                                </button>
                            </div>
                        </header>

                        {/* Tech Stack Featured Card */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-linear-to-r from-primary-custom to-blue-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                            <div className="relative bg-background/40 rounded-xl p-6 flex flex-col md:flex-row items-center gap-8 backdrop-blur-sm">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 bg-primary-custom/20 text-primary-custom text-xs font-bold rounded-full uppercase tracking-wider">
                                            Tech Stack of the Month
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold mb-4">Mastering Modern Web Architecture</h2>
                                    <p className="text-slate-400 mb-6 font-medium">
                                        Explore Next.js, GraphQL, and Tailwind CSS. Complete the learning path to earn the &apos;Architech&apos; badge.
                                    </p>
                                    <div className="flex flex-wrap gap-4 mb-6">
                                        {[
                                            { icon: "auto_awesome", label: "Next.js 14" },
                                            { icon: "api", label: "GraphQL" },
                                            { icon: "palette", label: "Tailwind" },
                                        ].map((tech) => (
                                            <div
                                                key={tech.label}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-background/60 border border-primary-custom/5 rounded-lg"
                                            >
                                                <DynamicIcon name={tech.icon} className="text-primary-custom" size={16} />
                                                <span className="text-sm font-medium">{tech.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full md:w-auto px-6 py-2 bg-primary-custom text-white rounded-lg font-medium hover:brightness-110 transition-all shadow-md shadow-primary-custom/10">
                                        Start Path
                                    </button>
                                </div>
                                <div className="w-full md:w-48 aspect-square relative flex items-center justify-center">
                                    <div className="w-32 h-32 bg-primary-custom/10 rounded-full flex items-center justify-center animate-pulse">
                                        <Layers className="text-primary-custom" size={64} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <ActivityFeed items={feedItems} router={router} />
                    </section>

                    {/* Right Sidebar */}
                    <section className="w-full lg:w-80 bg-background/20 p-6 border-l border-primary-custom/10 overflow-y-auto space-y-8 scrollbar-hide backdrop-blur-md">
                        {/* Stats Widget */}
                        <div className="bg-background/60 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Your Progress</h3>
                                <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${(user.streakDays ?? 0) > 1 ? 'streak-gradient shadow-lg shadow-amber-500/30' : 'bg-slate-600/50'}`}>
                                    <Flame className="text-white" size={18} />
                                    <span className="text-white font-bold text-sm">{user.streakDays ?? 0} Days</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-muted-custom font-medium uppercase tracking-wider">
                                            Level {user.level ?? 1} Developer
                                        </span>
                                        <span className="text-primary-custom font-bold">
                                            {(user.xp ?? 0).toLocaleString()} / {(user.xpTarget ?? 1000).toLocaleString()} XP
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-custom rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                                            style={{ width: `${xpPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className="text-xs font-bold text-muted-custom uppercase tracking-widest mb-4">
                                    Recent Badges
                                </p>
                                <div className="grid grid-cols-4 gap-3">
                                    {badges.slice(0, 3).map((badge) => (
                                        <div
                                            key={badge.id}
                                            className={`aspect-square rounded-lg flex items-center justify-center group relative cursor-help`}
                                            style={{
                                                backgroundColor: `${badge.color}1a`,
                                                color: badge.color,
                                            }}
                                        >
                                            <DynamicIcon name={badge.icon} size={20} />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 p-2 bg-slate-800 text-[10px] rounded hidden group-hover:block text-center text-white z-10">
                                                {badge.label}
                                            </div>
                                        </div>
                                    ))}
                                    {badges.length > 3 && (
                                        <div className="aspect-square rounded-lg bg-background/50 border border-primary-custom/10 flex items-center justify-center text-muted-custom">
                                            <MoreHorizontal size={14} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">Upcoming</h3>
                                <Calendar className="text-muted-custom cursor-pointer" size={20} />
                            </div>

                            <div className="space-y-3">
                                {events.length === 0 ? (
                                    <div className="p-4 text-center text-muted-custom text-sm">
                                        No upcoming events
                                    </div>
                                ) : (
                                    events.map((event, index) => (
                                        <div
                                            key={event.id}
                                            className={`p-3 bg-background/30 border-l-4 rounded-r-xl flex items-center gap-4 ${event.isHighlighted
                                                ? "border-primary-custom shadow-md shadow-primary-custom/5"
                                                : "border-slate-300 dark:border-slate-700"
                                                } ${index >= 2 ? "opacity-75" : ""}`}
                                        >
                                            <div className="flex flex-col items-center justify-center w-12 border-r border-slate-700/20 pr-3">
                                                <span className={`text-xs font-bold ${event.isHighlighted ? "text-primary-custom" : "text-muted-custom"}`}>
                                                    {event.month}
                                                </span>
                                                <span className="text-xl font-black">{event.date}</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-bold truncate">{event.title}</p>
                                                <p className="text-xs text-muted-custom">
                                                    {event.time} • {event.location}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Upgrade Promo */}
                        {/* <div className="p-4 bg-primary-custom rounded-2xl text-white relative overflow-hidden group shadow-lg shadow-primary-custom/20">
                            <div className="relative z-10">
                                <h4 className="font-bold mb-1">Upgrade to Nexus+</h4>
                                <p className="text-xs text-blue-100 mb-4">
                                    Get access to premium courses and mentorship.
                                </p>
                                <button className="w-full py-2 bg-white text-primary-custom rounded-lg text-xs font-bold transition-transform active:scale-95 hover:bg-blue-50">
                                    Upgrade Now
                                </button>
                            </div>
                            <DynamicIcon name="workspace_premium" className="absolute -bottom-4 -right-4 text-white/10 group-hover:rotate-12 transition-transform duration-500" size={72} />
                        </div> */}


                    </section>
                </main>
            </div>
        </>
    );
}
