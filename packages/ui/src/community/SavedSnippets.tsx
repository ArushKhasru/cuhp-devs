"use client";

import { LayoutGrid, List, Plus } from "../icons";
import { SnippetCard } from "./SnippetCard";
import { SnippetsSidebar } from "./SnippetsSidebar";

interface SavedSnippetsProps {
  data: {
    snippets: any[];
    collections: any[];
    recentTags: string[];
  };
  isLoading?: boolean;
}

export default function SavedSnippets({ data, isLoading }: SavedSnippetsProps) {
  return (
    <main className="flex-1 flex gap-8 p-4 md:p-8 overflow-y-auto w-full animate-fade-in">
      {/* Sidebar for collections */}
      <SnippetsSidebar
        collections={data.collections}
        recentTags={data.recentTags}
      />

      <div className="flex-1 space-y-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Your Snippets</h2>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              <button className="p-1.5 rounded-md bg-[#1337ec] text-white">
                <LayoutGrid size={14} />
              </button>
              <button className="p-1.5 rounded-md text-white/40 hover:text-white transition-all">
                <List size={14} />
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-[#1337ec] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#1337ec]/20 hover:scale-105 transition-transform">
            <Plus size={14} /> New Snippet
          </button>
        </div>

        {/* Snippets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-[#161618] rounded-xl border border-white/5 overflow-hidden flex flex-col h-72 animate-pulse">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800" />
                    <div className="h-4 w-28 bg-slate-800 rounded-md" />
                  </div>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  <div className="bg-black/60 rounded-lg p-3 h-28 border border-white/5 flex flex-col gap-2">
                    <div className="h-3 w-3/4 bg-slate-800/80 rounded-md" />
                    <div className="h-3 w-1/2 bg-slate-800/80 rounded-md" />
                    <div className="h-3 w-5/6 bg-slate-800/80 rounded-md" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-12 bg-slate-800 rounded-md" />
                    <div className="h-5 w-12 bg-slate-800 rounded-md" />
                  </div>
                </div>
                <div className="px-4 py-3 bg-white/[0.01] border-t border-white/5 flex items-center justify-between mt-auto">
                  <div className="h-3.5 w-16 bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-16 bg-slate-800 rounded-md" />
                </div>
              </div>
            ))
          ) : data.snippets.map((snippet: any) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      </div>
    </main>
  );
}