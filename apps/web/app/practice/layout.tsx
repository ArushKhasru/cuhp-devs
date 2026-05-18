import { SidebarWrapper } from "../../components/SidebarWrapper";
import { serverApiFetch } from "../../lib/server-api";

interface LayoutProps {
    children: React.ReactNode;
}

const DEFAULT_SIDEBAR_USER = {
    name: "Guest User",
    role: "Student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest-user",
    handle: "guest",
};

export default async function PracticeLayout({ children }: LayoutProps) {
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
