"use client";

import avatars from "../assets/page";
import { SignInForm } from "@repo/ui/SignInForm";
import { LeftPanel } from "@repo/ui/LeftPanel";
import { AuthToggle } from "@repo/ui/AuthToggle";

export default function SignInPage() {
  const handleSignIn = (e: any) => {
    e.preventDefault();
    //TODO: Implement your sign-in logic here
    console.log("Sign in submitted");
  };
  const handleOAuth = (provider: "google" | "github") => {
     // TODO: Implement your OAuth logic here
    // Example: await signIn(provider);
    console.log("OAuth sign-up with:", provider);
  };

  return (
    <div className="flex min-h-screen">
      <LeftPanel avatars={avatars.map((src: string) => ({ src }))} />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16  bg-[#101322]">
        <div className="">
                    <AuthToggle activeTab="signin" />
          <SignInForm className="bg-[#101322]" />
        </div>
      </div>
    </div>
  );
}
