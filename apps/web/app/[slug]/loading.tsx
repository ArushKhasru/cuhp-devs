export default function UserProfileLoading() {
    return (
        <div className="bg-background text-foreground h-screen flex font-sans overflow-hidden transition-colors duration-300 animate-pulse w-full">
            {/* Profile Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
                    {/* Header Card Skeleton */}
                    <div className="bg-card-custom border border-card-border rounded-3xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 shrink-0" />
                            <div className="flex-1 space-y-3 text-center md:text-left">
                                <div className="h-8 w-48 bg-slate-800 rounded-xl mx-auto md:mx-0" />
                                <div className="h-4 w-32 bg-slate-800/60 rounded-md mx-auto md:mx-0" />
                                <div className="flex items-center gap-4 justify-center md:justify-start pt-2">
                                    <div className="h-4 w-20 bg-slate-800 rounded-md" />
                                    <div className="h-4 w-20 bg-slate-800 rounded-md" />
                                </div>
                            </div>
                            <div className="h-10 w-28 bg-slate-800 rounded-xl" />
                        </div>
                    </div>

                    {/* Bento Grid Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-card-custom border border-card-border rounded-3xl p-6 text-center space-y-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 mx-auto" />
                                <div className="h-4 w-16 bg-slate-800/50 rounded-md mx-auto" />
                                <div className="h-7 w-20 bg-slate-800 rounded-lg mx-auto" />
                            </div>
                        ))}
                    </div>

                    {/* Details / Activity Grid Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Heatmap/Badges Column (2 Cols) */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-card-custom border border-card-border rounded-3xl p-6 space-y-4">
                                <div className="h-5 w-40 bg-slate-800 rounded-lg" />
                                <div className="h-32 bg-slate-800/20 border border-dashed border-card-border rounded-2xl" />
                            </div>
                            <div className="bg-card-custom border border-card-border rounded-3xl p-6 space-y-4">
                                <div className="h-5 w-32 bg-slate-800 rounded-lg" />
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-14 h-14 bg-slate-800 rounded-2xl" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Column (1 Col) */}
                        <div className="bg-card-custom border border-card-border rounded-3xl p-6 space-y-6">
                            <div className="h-5 w-36 bg-slate-800 rounded-lg" />
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 bg-slate-800 rounded-full shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-full bg-slate-800 rounded-md" />
                                            <div className="h-3 w-16 bg-slate-800/50 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
