import { PostCard } from "./PostCard";
import { FeedCompose } from "./FeedCompose";
import { FeedTabs, FeedTab } from "./FeedTabs";
import { CommunityRightSidebar } from "./CommunityRightSidebar";

interface FeedProps {
  data: {
    trendingTags: string[];
    posts: any[];
    leaderboard: any[];
    events: any[];
  };
  isLoading?: boolean;
  onPost?: (data: { content: string; type: string }) => Promise<void>;
  onLike?: (postId: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  userAvatar?: string;
  userName?: string;
  currentUserId?: string;
  savedPosts?: string[];
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export default function Feed({
  data,
  isLoading,
  onPost,
  onLike,
  onBookmark,
  userAvatar,
  userName,
  currentUserId,
  savedPosts,
  activeTab,
  onTabChange
}: FeedProps) {
  // Filter posts based on tab
  // Note: "Snippet" tab maps to "Snippet" type, "Questions" tab maps to "Question" type
  const filteredPosts = data.posts.filter(post => {
    if (activeTab === "Recent" || activeTab === "debugging") return true;
    const targetType = activeTab === "Questions" ? "Question" : "Snippet";
    return post.type === targetType;
  });

  return (
    <main className="flex-1 flex flex-col md:flex-row gap-8 p-4 md:p-8 overflow-y-auto w-full animate-fade-in">
      {/* Feed Area */}
      <section className="flex-1 space-y-6 max-w-3xl">
        <FeedCompose onPost={onPost} userAvatar={userAvatar} userName={userName} />
        <FeedTabs activeTab={activeTab} onTabChange={onTabChange} />

        {/* Posts */}
        <div className="space-y-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-card-custom border border-card-border rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-28 bg-slate-800 rounded-md" />
                    <div className="h-3 w-16 bg-slate-800/60 rounded-md" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 w-full bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-5/6 bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-2/3 bg-slate-800 rounded-md" />
                </div>
                <div className="flex gap-4 pt-4 border-t border-card-border/50">
                  <div className="h-4 w-12 bg-slate-800 rounded-md" />
                  <div className="h-4 w-12 bg-slate-800 rounded-md" />
                </div>
              </div>
            ))
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id || post._id}
                post={post}
                onLike={onLike}
                onBookmark={onBookmark}
                currentUserId={currentUserId}
                userAvatar={userAvatar}
                isSaved={savedPosts?.includes(post.id || post._id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-background/40 backdrop-blur-md rounded-2xl border border-dashed border-primary-custom/10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-16 h-16 rounded-full bg-primary-custom/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary-custom text-3xl">inbox</span>
              </div>
              <h3 className="text-foreground font-bold text-lg mb-1">Silence is golden</h3>
              <p className="text-muted-custom text-sm max-w-[250px]">
                No {activeTab.toLowerCase()} posts here yet. Be the first to start the conversation!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Right Sidebar */}
      <CommunityRightSidebar
        leaderboard={data.leaderboard}
        tags={data.trendingTags}
        events={data.events}
      />
    </main>
  );
}
