"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignUpForm } from "@repo/ui/sign-up/SignUpForm";
import { AuthToggle } from "@repo/ui/toogle/AuthToggle";
import { API_URL, apiFetch } from "../lib/api";
import { toast } from "../store/useToastStore";
import { useAuthStore } from "../store/useAuthStore";

interface SignUpFields {
    fullName: string;
    studentId: string;
    email: string;
    password: string;
    acceptTerms: boolean;
}

export function SignUpClient() {
    const router = useRouter();
    const { isAuthenticated, setUser, user } = useAuthStore();
    
    useEffect(() => {
        if (isAuthenticated) {
            if (user?.onboardingCompleted) {
                router.push("/dashboard");
            } else {
                router.push("/onboarding");
            }
        }
    }, [isAuthenticated, user, router]);

    const handleSignUp = async (fields: SignUpFields) => {
        try {
            const response = await apiFetch("/auth/signup", {
                method: "POST",
                body: JSON.stringify({
                    fullName: fields.fullName,
                    studentId: fields.studentId,
                    email: fields.email,
                    password: fields.password,
                }),
            });

            setUser(response.user, response.token || null);
            toast.success("Account created successfully.");
            router.push("/onboarding");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Registration failed.");
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
            <AuthToggle activeTab="signup" />
            <SignUpForm
                className="bg-[#101322]"
                onSubmit={handleSignUp}
                onOAuth={handleOAuth}
            />
        </div>
    );
}
