
import Link from "next/link";

interface AuthToggleProps {
  activeTab: "signin" | "signup";
  className?: string;
}

export function AuthToggle({ activeTab, className = "" }: AuthToggleProps) {
  return (
    <div className={`mb-10 ${className}`}>
      <div className="inline-flex justify-between p-1 ml-15 rounded-xl bg-[#121a3f] border border-blue-700/20">
        <Link
          href="/signin"
          className={`px-10 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "signin"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className={`px-10 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "signup"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}