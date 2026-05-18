import { ProfileOverviewClient } from "../../components/ProfileOverviewClient";
import { SidebarWrapper } from "../../components/SidebarWrapper";
import { serverApiFetch } from "../../lib/server-api";
import { notFound } from "next/navigation";

export default async function UserProfilePage({ 
    params 
}: { 
    params: Promise<{ slug: string }> 
}) {
    const { slug } = await params;
    
    let profileResponse;
    let currentUser;

    try {
        // Fetch target profile by handle
        profileResponse = await serverApiFetch(`/user/profile/handle/${slug}`);
        
        // Try to fetch current user to determine if it's their own profile
        try {
            currentUser = await serverApiFetch("/user/profile");
        } catch (e) {
            // Not logged in is okay
        }
    } catch (error: any) {
        // If apiFetch throws an error object with status
        if ((error as any).status === 404) {
            notFound();
        }
        throw error;
    }

    if (!profileResponse || !profileResponse.user) {
        notFound();
    }

    const targetUser = profileResponse.user;
    const isOwnProfile = currentUser?._id === targetUser._id;

    // Construct user object for sidebar
    const sidebarUser = currentUser ? {
        name: currentUser.fullName || currentUser.name || "User",
        role: "Student",
        avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((currentUser.fullName || "user").trim().toLowerCase())}`,
        handle: currentUser.handle
    } : {
        name: "Guest User",
        role: "Student",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest-user",
        handle: "guest"
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide py-4 md:py-8">
                <ProfileOverviewClient 
                    user={targetUser} 
                    isOwnProfile={isOwnProfile} 
                />
            </div>
        </main>
    );
}
