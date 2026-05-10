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
    <main className="flex-1 flex flex-col md:flex-row gap-8 p-4 md:p-8 overflow-y-auto w-full">
      {/* Feed Area */}
      <section className="flex-1 space-y-6 max-w-3xl">
        <FeedCompose onPost={onPost} userAvatar={userAvatar} userName={userName} />
        <FeedTabs activeTab={activeTab} onTabChange={onTabChange} />

        {/* Posts */}
        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
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
