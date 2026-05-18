"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
    Trophy, 
    Flame, 
    Activity, 
    Calendar, 
    Code2, 
    Medal, 
    GraduationCap,
    Clock,
    CheckCircle2,
    Award,
    Braces,
    Star,
    Zap,
    Search,
    X,
    User as UserIcon,
    ArrowRight
} from "../icons";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

interface ActivityItem {
    id: string;
    type: string;
    content: string;
    time: Date | string;
    status?: string;
}

interface ProfileOverviewProps {
    user: {
        _id?: string;
        fullName: string;
        handle: string;
        avatar?: string;
        bio?: string;
        program?: string;
        semester?: string;
        points: number;
        solvedCount: number;
        rank: number;
        currentStreak: number;
        totalXp: number;
        badgesCount: number;
        heatmapData: { date: string; count: number }[];
        submissionsToday: { id: string; title: string; difficulty: string; time: Date | string; status: string }[];
        recentActivity: ActivityItem[];
        followersCount?: number;
        followingCount?: number;
        followers?: any[];
        following?: any[];
        isFollowing?: boolean;
    };
    isOwnProfile?: boolean;
    onSearch?: (query: string) => Promise<{ users: any[] }>;
    onFollowToggle?: () => void;
}

const StatCard = ({ icon: Icon, label, value, subValue, color, isStreak, streakCount }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subValue?: string;
    color: string;
    isStreak?: boolean;
    streakCount?: number;
}) => {
    const hasGlow = isStreak && (streakCount ?? 0) > 1;
    const iconClass = hasGlow ? 'streak-gradient shadow-lg shadow-amber-500/30' : color;
    
    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-card-custom border border-card-border p-5 rounded-2xl flex flex-col gap-3 transition-all duration-300"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-muted-custom text-sm font-medium">{label}</p>
                <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
                {subValue && <p className="text-xs text-muted-custom mt-1">{subValue}</p>}
            </div>
        </motion.div>
    );
};

const Heatmap = ({ data }: { data: { date: string; count: number }[] }) => {
    // Start from March 1, 2026
    const startDate = new Date(2026, 2, 1);
    const today = new Date();
    const diffTime = Math.max(0, today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Calculate weeks including the padding for the first week's start day
    const weeks = Math.max(4, Math.ceil((diffDays + startDate.getDay()) / 7));
    const days = 7;
    
    // Map data to a quick-lookup object
    const dataMap = data.reduce((acc, curr) => {
        acc[curr.date] = curr.count;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-card-custom border border-card-border p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-custom" />
                    Activity Heatmap <span className="text-xs font-normal text-muted-custom ml-1" suppressHydrationWarning>({new Date().getFullYear()})</span>
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-custom">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div 
                                key={i} 
                                className={`w-3 h-3 rounded-sm ${
                                    i === 0 ? 'bg-muted-custom/10' : 
                                    i === 1 ? 'bg-primary-custom/30' : 
                                    i === 2 ? 'bg-primary-custom/50' : 
                                    i === 3 ? 'bg-primary-custom/70' : 
                                    'bg-primary-custom'
                                }`} 
                            />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
            
            <div className="relative">
                {/* Month labels */}
                <div className="flex gap-1 ml-10 mb-2 h-4 relative">
                    {Array.from({ length: weeks }).map((_, w) => {
                        const date = new Date();
                        date.setDate(date.getDate() - ((weeks - w - 1) * 7 + 6));
                        
                        // Show month if it's the first week of the month
                        const isFirstWeekOfMonth = date.getDate() <= 7;
                        
                        if (isFirstWeekOfMonth) {
                            return (
                                <span 
                                    key={w} 
                                    className="text-[10px] text-muted-custom absolute whitespace-nowrap" 
                                    style={{ left: `${w * 16}px` }}
                                    suppressHydrationWarning
                                >
                                    {date.toLocaleString('en-US', { month: 'short' })}
                                </span>
                            );
                        }
                        return null;
                    })}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <div className="grid grid-rows-7 gap-1 text-[10px] text-muted-custom pr-2 pt-1">
                        <span>Mon</span>
                        <span></span>
                        <span>Wed</span>
                        <span></span>
                        <span>Fri</span>
                        <span></span>
                        <span>Sun</span>
                    </div>
                <div className="flex gap-1" style={{ minWidth: 'fit-content' }}>
                    {Array.from({ length: weeks }).map((_, w) => (
                        <div key={w} className="grid grid-rows-7 gap-1">
                            {Array.from({ length: days }).map((_, d) => {
                                const date = new Date();
                                date.setDate(date.getDate() - ((weeks - w - 1) * 7 + (6 - d)));
                                const dateStr = date.toISOString().split('T')[0] ?? "";
                                const count = dataMap[dateStr] || 0;
                                const intensity = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
                                
                                return (
                                    <div 
                                        key={d} 
                                        className={`w-3 h-3 rounded-sm cursor-pointer transition-colors ${
                                            intensity === 0 ? 'bg-muted-custom/10 hover:bg-muted-custom/20' : 
                                            intensity === 1 ? 'bg-primary-custom/30 hover:bg-primary-custom/40' : 
                                            intensity === 2 ? 'bg-primary-custom/50 hover:bg-primary-custom/60' : 
                                            intensity === 3 ? 'bg-primary-custom/70 hover:bg-primary-custom/80' : 
                                            'bg-primary-custom hover:opacity-80'
                                        }`}
                                        title={`${dateStr}: ${count} activities`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
    );
};

export default function ProfileOverview({ user, isOwnProfile, onSearch, onFollowToggle }: ProfileOverviewProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPendingFollow, setIsPendingFollow] = useState(false);
    const [connectionModalType, setConnectionModalType] = useState<"followers" | "following" | null>(null);

    // Filter out submissions that are already shown in "Submissions Today" to avoid duplicates
    const submissionTodayIds = new Set(user.submissionsToday.map(sub => sub.id));
    const filteredRecentActivity = user.recentActivity.filter(activity => 
        activity.type !== 'submission' || !submissionTodayIds.has(activity.id)
    );

    useEffect(() => {
        const fetchResults = async () => {
             if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                try {
                    if (onSearch) {
                        const data = await onSearch(searchQuery.trim());
                        setSearchResults(data.users || []);
                    } else {
                        // Fallback fallback relative call if onSearch is missing
                        const response = await fetch(`/api/user/search?q=${searchQuery.trim()}`);
                        if (response.headers.get("content-type")?.includes("application/json")) {
                            const data = await response.json();
                            setSearchResults(data.users || []);
                        }
                    }
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, onSearch]);

    const formatDate = (dateInput: Date | string) => {
        const date = new Date(dateInput);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const timeAgo = (dateInput: Date | string) => {
        const now = new Date();
        const past = new Date(dateInput);
        const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex gap-6 items-center">
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-card-border shadow-xl bg-background">
                            <img 
                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((user.fullName || 'user').trim().toLowerCase())}`} 
                                alt={user.fullName} 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-primary-custom text-white p-2 rounded-xl shadow-lg border-2 border-background">
                            <Trophy className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">{user.fullName}</h1>
                        <p className="text-primary-custom font-medium mt-1">@{user.handle}</p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-custom mt-2">
                            <span 
                                onClick={() => setConnectionModalType("followers")}
                                className="hover:text-primary-custom cursor-pointer transition-colors hover:underline"
                            >
                                <span className="text-foreground font-extrabold mr-1">{user.followersCount ?? 0}</span> followers
                            </span>
                            <span className="text-muted-custom/40">•</span>
                            <span 
                                onClick={() => setConnectionModalType("following")}
                                className="hover:text-primary-custom cursor-pointer transition-colors hover:underline"
                            >
                                <span className="text-foreground font-extrabold mr-1">{user.followingCount ?? 0}</span> following
                            </span>
                        </div>
                        {user.bio && <p className="text-muted-custom mt-3 max-w-md text-sm">{user.bio}</p>}
                        <div className="flex flex-wrap gap-3 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted-custom/5 border border-muted-custom/10 text-xs font-medium text-muted-custom">
                                <GraduationCap className="w-3.5 h-3.5" />
                                {user.program || "Unknown Department"}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted-custom/5 border border-muted-custom/10 text-xs font-medium text-muted-custom">
                                <Award className="w-3.5 h-3.5" />
                                {user.semester || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {!isOwnProfile && (
                        <button
                            disabled={isPendingFollow}
                            onClick={async () => {
                                if (onFollowToggle) {
                                    setIsPendingFollow(true);
                                    await onFollowToggle();
                                    setIsPendingFollow(false);
                                }
                            }}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 duration-300 disabled:opacity-50 flex items-center gap-2 ${
                                user.isFollowing
                                    ? "bg-slate-800 border border-card-border hover:bg-slate-700/80 text-foreground"
                                    : "bg-primary-custom text-white hover:brightness-110 shadow-primary-custom/20"
                            }`}
                        >
                            {user.isFollowing ? "Unfollow" : "Follow"}
                        </button>
                    )}
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2.5 rounded-xl border border-card-border bg-card-custom hover:bg-muted-custom/5 transition-all text-muted-custom hover:text-primary-custom"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Followers / Following Modal */}
            <AnimatePresence>
                {connectionModalType && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConnectionModalType(null)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
                        />
                        
                        {/* Centered Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card-custom border border-card-border z-[101] shadow-2xl rounded-3xl p-6 flex flex-col max-h-[500px]"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border">
                                <h3 className="text-xl font-black capitalize flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-primary-custom" />
                                    {connectionModalType === "followers" ? "Followers" : "Following"}
                                </h3>
                                <button 
                                    onClick={() => setConnectionModalType(null)}
                                    className="p-2 rounded-xl hover:bg-muted-custom/10 transition-colors text-muted-custom hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                {(() => {
                                    const list = connectionModalType === "followers" ? user.followers : user.following;
                                    if (!list || list.length === 0) {
                                        return (
                                            <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
                                                <UserIcon className="w-12 h-12 mb-3 text-primary-custom" />
                                                <p className="text-sm font-semibold">No {connectionModalType} yet</p>
                                            </div>
                                        );
                                    }

                                    return list.map((item: any) => (
                                        <button 
                                            key={item._id}
                                            onClick={() => {
                                                setConnectionModalType(null);
                                                window.location.href = `/${item.handle}`;
                                            }}
                                            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-card-border bg-muted-custom/5 hover:border-primary-custom/30 hover:bg-primary-custom/5 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl overflow-hidden border border-card-border bg-background">
                                                    <img 
                                                        src={item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((item.fullName || 'user').trim().toLowerCase())}`} 
                                                        alt={item.fullName} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-extrabold text-foreground group-hover:text-primary-custom transition-colors text-sm">{item.fullName}</p>
                                                    <p className="text-xs text-muted-custom">@{item.handle}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-custom group-hover:text-primary-custom group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Search Sidebar Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSearchOpen(false)}
                            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100]"
                        />
                        
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card-custom border-l border-card-border z-[101] shadow-2xl p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Search className="w-5 h-5 text-primary-custom" />
                                    Search Developers
                                </h3>
                                <button 
                                    onClick={() => setIsSearchOpen(false)}
                                    className="p-2 rounded-lg hover:bg-muted-custom/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative group">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Search by handle or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            window.location.href = `/${searchQuery.trim()}`;
                                        }
                                    }}
                                    className="w-full bg-muted-custom/5 border border-card-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary-custom transition-all"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-custom group-focus-within:text-primary-custom transition-colors" />
                            </div>

                            <div className="mt-8 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                                {isSearching ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                                        <div className="w-8 h-8 border-2 border-primary-custom border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm">Searching for developers...</p>
                                    </div>
                                ) : searchQuery.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-muted-custom uppercase tracking-wider">
                                            {searchResults.length > 0 ? `${searchResults.length} Results Found` : "No Results Found"}
                                        </p>
                                        
                                        <div className="space-y-2">
                                            {searchResults.map((result) => (
                                                <button 
                                                    key={result._id}
                                                    onClick={() => window.location.href = `/${result.handle}`}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-card-border bg-muted-custom/5 hover:border-primary-custom/30 hover:bg-primary-custom/5 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-card-border">
                                                            <img 
                                                                src={result.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((result.fullName || 'user').trim().toLowerCase())}`} 
                                                                alt={result.fullName} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-foreground group-hover:text-primary-custom transition-colors">{result.fullName}</p>
                                                            <p className="text-xs text-muted-custom">@{result.handle}</p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-muted-custom group-hover:text-primary-custom group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))}

                                            {/* Fallback Quick Action if no results or just as a "Go to Handle" option */}
                                            {searchResults.length === 0 && (
                                                <button 
                                                    onClick={() => window.location.href = `/${searchQuery.trim()}`}
                                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-card-border hover:border-primary-custom/40 hover:bg-muted-custom/5 transition-all group mt-4"
                                                >
                                                    <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-10 h-10 rounded-lg bg-muted-custom/10 flex items-center justify-center text-muted-custom">
                                                            <UserIcon className="w-5 h-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-foreground italic">Go to @{searchQuery}</p>
                                                            <p className="text-xs text-muted-custom font-medium mt-0.5">Direct jump to handle</p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-muted-custom group-hover:text-primary-custom group-hover:translate-x-1 transition-all" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                        <Search className="w-12 h-12 mb-4 text-primary-custom" />
                                        <p className="text-sm font-medium">Type a handle or name to start searching</p>
                                        <p className="text-xs mt-2">Find other developers in the community</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    icon={Medal} 
                    label="Department Rank" 
                    value={`#${user.rank}`} 
                    subValue="Based on problems solved"
                    color="bg-blue-500" 
                />
                <StatCard 
                    icon={Flame} 
                    label="Current Streak" 
                    value={`${user.currentStreak} Days`} 
                    subValue="Keep it up!"
                    color="bg-orange-500" 
                    isStreak={true}
                    streakCount={user.currentStreak}
                />
                <StatCard 
                    icon={Code2} 
                    label="Problems Solved" 
                    value={user.solvedCount} 
                    color="bg-purple-500" 
                />
                <StatCard 
                    icon={Activity} 
                    label="Total Points" 
                    value={user.points} 
                    color="bg-green-500" 
                />
                <StatCard 
                    icon={Star} 
                    label="Badges Earned" 
                    value={user.badgesCount} 
                    subValue="Milestones achieved"
                    color="bg-yellow-500" 
                />
                <StatCard 
                    icon={Zap} 
                    label="Total XP" 
                    value={user.totalXp} 
                    subValue="Overall experience"
                    color="bg-indigo-500" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Heatmap & Submissions) */}
                <div className="lg:col-span-2 space-y-8">
                    <Heatmap data={user.heatmapData} />
                    
                    <div className="bg-card-custom border border-card-border p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <Code2 className="w-5 h-5 text-primary-custom" />
                                Submissions Today
                            </h3>
                            <span className="text-xs bg-primary-custom/10 text-primary-custom px-3 py-1 rounded-full font-bold">
                                {user.submissionsToday.length} New
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {user.submissionsToday.length > 0 ? (
                                user.submissionsToday.map((sub) => (
                                    <div key={sub.id} className="group flex items-center justify-between p-4 rounded-xl border border-card-border bg-muted-custom/5 hover:border-primary-custom/30 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-card-custom flex items-center justify-center border border-card-border group-hover:bg-primary-custom/5 transition-all">
                                                <Braces className="w-5 h-5 text-muted-custom group-hover:text-primary-custom" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground group-hover:text-primary-custom transition-all">{sub.title}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-mono text-muted-custom capitalize">{sub.difficulty}</span>
                                                    <span className="text-[10px] text-muted-custom/50 px-2 py-0.5 rounded bg-muted-custom/10">{formatDate(sub.time)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                                            sub.status === 'Accepted' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {sub.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-custom flex flex-col items-center gap-2">
                                    <Clock className="w-8 h-8 opacity-20" />
                                    <p>No code submitted today yet. Ready to start?</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Recent Activity) */}
                <div className="space-y-8">
                    <div className="bg-card-custom border border-card-border p-6 rounded-2xl h-full">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                            <Activity className="w-5 h-5 text-primary-custom" />
                            Recent Activity
                        </h3>
                        
                        <div className="space-y-6 relative ml-4 border-l-2 border-muted-custom/10 pl-6">
                            {filteredRecentActivity.length > 0 ? (
                                filteredRecentActivity.map((activity) => (
                                    <div key={activity.id} className="relative">
                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-card-custom border-2 border-primary-custom z-10" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-custom">{timeAgo(activity.time)}</span>
                                            <h4 className="text-sm font-bold text-foreground leading-tight">{activity.content}</h4>
                                            <p className="text-xs text-muted-custom mt-1 flex items-center gap-1">
                                                {activity.type === 'submission' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                {activity.type === 'post' && <Activity className="w-3 h-3 text-blue-500" />}
                                                {activity.type.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-custom italic text-xs">
                                    No recent activity found.
                                </div>
                            )}
                        </div>
                        
                        <button className="w-full mt-8 py-3 rounded-xl border border-card-border text-sm font-bold text-muted-custom hover:bg-muted-custom/5 transition-all">
                            View Full Timeline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
