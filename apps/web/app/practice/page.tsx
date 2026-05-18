import { serverApiFetch } from "../../lib/server-api";
import { SidebarWrapper } from "../../components/SidebarWrapper";
import { ProblemCard } from "@repo/ui/practice/ProblemCard";
import { PracticeFiltersWrapper } from "../../components/practice/PracticeFiltersWrapper";
import { Metadata } from "next";
import { Flame, SearchX, ChevronDown } from "../../lib/icons";
import { PracticeHeader } from "../../components/practice/PracticeHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Practice: Coding Challenges",
    description: "Master algorithms and data structures with curated problems.",
};

interface Problem {
    _id: string;
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    description: string;
    solved?: number;
    tags?: string[];
    isSolved?: boolean;
}

const DEFAULT_SIDEBAR_USER = {
    name: "Guest User",
    role: "Student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest-user",
    handle: "guest",
};

export default async function PracticePage({
    searchParams,
}: {
    searchParams: { q?: string; category?: string };
}) {
    let sidebarUser = DEFAULT_SIDEBAR_USER;
    let problems: Problem[] = [];
    let currentStreak = 0;
    let hasSolvedToday = false;

    try {
        const profile = await serverApiFetch("/user/profile").catch(() => null) as any;
        if (profile) {
            const resolvedName = profile.fullName || profile.name || DEFAULT_SIDEBAR_USER.name;
            sidebarUser = {
                name: resolvedName,
                role: "Student",
                avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((resolvedName || 'user').trim().toLowerCase())}`,
                handle: profile.handle || DEFAULT_SIDEBAR_USER.handle,
            };
        }

        // Identify current streak (with server-side validation)
        currentStreak = profile?.streak || 0;
        if (profile?.lastStreakUpdate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastDate = new Date(profile.lastStreakUpdate);
            lastDate.setHours(0, 0, 0, 0);
            const diffInDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
            if (diffInDays > 1) currentStreak = 0;
        }

        // Fetch problems
        problems = await serverApiFetch("/problems") as Problem[];
        
        // Check if user solved any problem today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const submissionsToday = await serverApiFetch(`/user/submissions?since=${startOfToday.getTime()}`).catch(() => []) as any[];
        hasSolvedToday = submissionsToday.some(s => s.status === "Accepted");

        console.log(`[PracticePage] Fetched ${problems.length} problems`);
    } catch (error) {
        console.error("Failed to fetch initial data for Practice page:", error);
    }

    const { q, category } = await searchParams;

    // Server-side filtering (simple for now)
    let filteredProblems = problems;
    if (q) {
        const query = q.toLowerCase();
        filteredProblems = filteredProblems.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
    }

    if (category && category !== "All Topics") {
        // Simple string matching for categories/tags
        filteredProblems = filteredProblems.filter(p => 
            p.tags?.some(tag => tag.toLowerCase() === category.toLowerCase())
        );
    }

    // Identify a "daily" problem (random or first one)
    const dailyProblem = filteredProblems.length > 0 ? { ...filteredProblems[0], isDaily: true } : null;
    const otherProblems = filteredProblems.slice(1);

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Section */}
        <PracticeHeader />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Search & Tabs (Client-Side Wrapper) */}
                <PracticeFiltersWrapper
                    activeCategory={category || "All Topics"}
                />

                {/* Problems Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {dailyProblem && (
                        <ProblemCard
                            key={dailyProblem._id}
                            problem={{
                                ...(dailyProblem as Problem),
                                isDaily: true,
                                successRate: "72.4%"
                            }}
                            href={`/problem/${dailyProblem.slug}`}
                        />
                    )}
                    {otherProblems.map(p => (
                        <ProblemCard
                            key={p._id}
                            problem={{
                                ...(p as Problem),
                                successRate: "85.2%"
                            }}
                            href={`/problem/${p.slug}`}
                        />
                    ))}
                    {filteredProblems.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <SearchX className="mx-auto mb-4 text-slate-700" size={64} />
                            <h2 className="text-xl font-bold text-slate-400">No challenges found matching your search.</h2>
                            <p className="text-slate-500">Try a different keyword or category.</p>
                        </div>
                    )}
                </div>

                {/* Load More */}
                <div className="flex items-center justify-center py-10">
                    <button className="px-8 py-3 border border-primary-custom/20 bg-primary-custom/5 text-primary-custom rounded-xl font-bold hover:bg-primary-custom/10 transition-all flex items-center gap-2 shadow-lg shadow-primary-custom/5">
                        <span>Load More Challenges</span>
                        <ChevronDown size={20} />
                    </button>
                </div>
            </div>
        </div>
    </main>
  );
}
