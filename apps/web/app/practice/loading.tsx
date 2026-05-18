export default function PracticeLoading() {
    return (
        <div className="bg-background text-foreground h-screen flex font-sans overflow-hidden transition-colors duration-300 animate-pulse w-full">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full">
                {/* Header Skeleton */}
                <div className="h-14 shrink-0 border-b border-card-border px-8 flex items-center justify-between bg-card-custom/10">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-32 bg-slate-800 rounded-full" />
                        <div className="h-4 w-64 bg-slate-800/50 rounded-md hidden sm:block" />
                    </div>
                    <div className="h-6 w-48 bg-slate-800 rounded-lg" />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {/* Filters Wrapper Skeleton */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-card-border pb-6">
                            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-10 w-24 bg-slate-800 rounded-xl shrink-0" />
                                ))}
                            </div>
                            <div className="h-12 w-full md:w-72 bg-slate-800 rounded-2xl" />
                        </div>

                        {/* Problems Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-card-custom/50 border border-card-border rounded-2xl p-6 space-y-6 flex flex-col h-64">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                                        <div className="h-6 w-16 bg-slate-800 rounded" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-5 w-3/4 bg-slate-800 rounded-md" />
                                        <div className="h-3.5 w-full bg-slate-800/60 rounded-md" />
                                        <div className="h-3.5 w-2/3 bg-slate-800/60 rounded-md" />
                                    </div>
                                    <div className="space-y-4 pt-2 border-t border-card-border/50">
                                        <div className="flex justify-between items-center">
                                            <div className="h-3.5 w-20 bg-slate-800 rounded-md" />
                                            <div className="h-3.5 w-20 bg-slate-800 rounded-md" />
                                        </div>
                                        <div className="h-10 w-full bg-slate-800 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
