import { MdSchool, MdSend, MdFolderZip } from "react-icons/md";

export default function ResourcesLoading() {
    return (
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-background transition-colors duration-300">
            <div className="max-w-5xl mx-auto p-6 lg:p-10 animate-pulse space-y-10">
                {/* Header Skeleton */}
                <div className="text-center space-y-3">
                    <div className="h-10 w-48 bg-slate-800 rounded-xl mx-auto" />
                    <div className="h-4 w-72 bg-slate-800/60 rounded-md mx-auto" />
                </div>

                {/* Tabs Row Skeleton */}
                <div className="flex justify-center gap-2 p-1 bg-background border border-primary-custom/5 rounded-2xl max-w-md mx-auto">
                    <div className="h-11 w-28 bg-slate-800 rounded-xl" />
                    <div className="h-11 w-28 bg-slate-800 rounded-xl" />
                    <div className="h-11 w-28 bg-slate-800 rounded-xl" />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card-custom border border-card-border rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-800 rounded-2xl" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 w-24 bg-slate-800 rounded-lg" />
                                    <div className="h-3 w-16 bg-slate-800/60 rounded-md" />
                                </div>
                            </div>
                            <div className="h-3 w-full bg-slate-800/40 rounded-md" />
                            <div className="h-3 w-3/4 bg-slate-800/40 rounded-md" />
                            <div className="flex gap-2 pt-2">
                                <div className="h-8 w-20 bg-slate-800 rounded-xl" />
                                <div className="h-8 w-20 bg-slate-800 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
