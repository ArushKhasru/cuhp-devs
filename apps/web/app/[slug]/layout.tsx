import { SidebarWrapper } from "../../components/SidebarWrapper";
import { serverApiFetch } from "../../lib/server-api";
import { getProfileByHandle } from "../../lib/profile";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

const DEFAULT_SIDEBAR_USER = {
    name: "Guest User",
    role: "Student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest-user",
    handle: "guest",
};

export default async function UserProfileLayout({ children, params }: LayoutProps) {
    // Resolve before the page's loading boundary can commit a 200 response.
    const { slug } = await params;
    await getProfileByHandle(slug);
    let sidebarUser = DEFAULT_SIDEBAR_USER;
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
    } catch (error) {
        // Ignored
    }

    return (
        <div className="bg-background text-foreground h-screen flex font-sans overflow-hidden transition-colors duration-300">
            <SidebarWrapper user={sidebarUser} />
            <div className="flex-1 flex flex-col min-w-0">
                {children}
            </div>
        </div>
    );
}
