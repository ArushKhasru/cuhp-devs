"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@repo/ui/sign-in/SignInForm";
import { AuthToggle } from "@repo/ui/toogle/AuthToggle";
import { API_URL, apiFetch } from "../lib/api";
import { toast } from "../store/useToastStore";
import { useAuthStore } from "../store/useAuthStore";

interface SignInFields {
    identifier: string;
    password: string;
    remember: boolean;
}

export function SignInClient() {
    const router = useRouter();
    const { setUser, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    const handleSignIn = async (fields: SignInFields) => {
        try {
            const response = await apiFetch("/auth/signin", {
                method: "POST",
                body: JSON.stringify({
                    identifier: fields.identifier,
                    password: fields.password,
                }),
            });

            setUser(response.user, response.token || null);
            toast.success("Signed in successfully.");
            router.push("/dashboard");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Sign in failed.");
            throw error;
        }
    };

    const handleOAuth = (provider: "google" | "github") => {
        if (provider === "github") {
            window.location.href = `${API_URL}/auth/github`;
            return;
        }

        if (provider === "google") {
            window.location.href = `${API_URL}/auth/google`;
            return;
        }

        toast.info(`${provider} OAuth is not configured.`);
    };

    return (
        <div className="">
            <AuthToggle activeTab="signin" />
            <SignInForm className="bg-[#101322]" onSubmit={handleSignIn} onOAuth={handleOAuth} />
        </div>
    );
}
