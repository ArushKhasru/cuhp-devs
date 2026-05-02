"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../lib/api";
import { toast } from "../store/useToastStore";
import { useAuthStore } from "../store/useAuthStore";

const oauthErrorMessages: Record<string, string> = {
    github_email_unavailable: "GitHub did not return a verified email address.",
    github_not_configured: "GitHub OAuth is not configured on the backend.",
    github_oauth_failed: "GitHub sign in failed. Please try again.",
    github_token_exchange_failed: "GitHub sign in failed while exchanging the authorization code.",
    google_email_unverified: "Google did not return a verified email address.",
    google_not_configured: "Google OAuth is not configured on the backend.",
    google_oauth_failed: "Google sign in failed. Please try again.",
    google_profile_unavailable: "Google did not return the required profile details.",
    google_token_exchange_failed: "Google sign in failed while exchanging the authorization code.",
    invalid_oauth_state: "OAuth sign in expired. Please try again.",
};

export function AuthCallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((state) => state.setUser);
    const hasSynced = useRef(false);

    useEffect(() => {
        const error = searchParams.get("error");

        if (error) {
            toast.error(oauthErrorMessages[error] || "OAuth sign in failed.");
            router.replace("/signin");
            return;
        }

        if (hasSynced.current) {
            return;
        }

        hasSynced.current = true;

        const syncSession = async () => {
            try {
                const response = await apiFetch("/auth/me");
                setUser(response.user, response.token || null);

                if (response.user?.onboardingCompleted) {
                    router.replace("/dashboard");
                } else {
                    router.replace("/onboarding");
                }
            } catch (sessionError) {
                toast.error(
                    sessionError instanceof Error
                        ? sessionError.message
                        : "Could not finish OAuth sign in."
                );
                router.replace("/signin");
            }
        };

        void syncSession();
    }, [router, searchParams, setUser]);

    return (
        <main className="min-h-screen bg-[#050816] text-slate-100 flex items-center justify-center px-6">
            <div className="max-w-md w-full rounded-2xl border border-blue-800/30 bg-[#101322] p-8 text-center shadow-2xl shadow-blue-950/30">
                <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Authentication</p>
                <h1 className="mt-4 text-2xl font-semibold">Finishing sign in</h1>
                <p className="mt-3 text-sm text-slate-400">
                    Verifying your session and redirecting you to the right page.
                </p>
            </div>
        </main>
    );
}
