import React from "react";


interface RightPanelProps {
  className?: string;
  showAvatars?: boolean;
  avatars?: Array<{ src: string; alt?: string }>;
  studentCount?: number;
}



const ACTION_CARDS = [
  { icon: "terminal", label: "Compile", color: "#1337ec" },
  { icon: "hub", label: "Connect", color: "#8b5cf6" },
  { icon: "bolt", label: "Deploy", color: "#22d3ee" },
] as const;

export function RightPanel({
  avatars = [],
  className = "",
  showAvatars = true,
  studentCount = 2000,
}: RightPanelProps) {
  return (
    <div className={`hidden lg:flex w-1/2 relative overflow-hidden bg-[#101322] ${className}`}>
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(19, 55, 236, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Background decorative frame with glass panel effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <div className="relative w-full h-full">
          {/* Floating blur elements (mirrored position from sign-in) */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/20 rounded-xl -rotate-12 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          {/* Main glass panel frame */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-2xl transform -rotate-3 flex items-center justify-center backdrop-blur-sm"
            style={{
              background: "rgba(16, 19, 34, 0.7)",
              border: "1px solid rgba(19, 55, 236, 0.2)",
            }}
          >
            <div className="relative w-full h-full p-12">
              {/* Terminal window dots */}
              <div className="flex gap-2 mb-8 opacity-60">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>

              {/* Code simulation */}
              <div className="space-y-4 opacity-60">
                <div className="h-2 w-3/4 bg-blue-600/40 rounded" />
                <div className="h-2 w-1/2 bg-purple-500/40 rounded" />
                <div className="h-2 w-5/6 bg-blue-600/40 rounded" />

                {/* Action cards grid */}
                <div className="grid grid-cols-3 gap-6 my-10">
                  {ACTION_CARDS.map(({ icon, label, color }) => (
                    <div
                      key={icon}
                      className="h-32 rounded-xl flex flex-col items-center justify-center gap-2"
                      style={{
                        backgroundColor: `${color}1a`,
                        border: `1px solid ${color}33`,
                      }}
                    >
                      <span className="material-icons text-3xl" style={{ color }}>
                        {icon}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: `${color}99` }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-2 w-1/3 bg-blue-600/40 rounded mt-8" />
                <div className="h-2 w-3/4 bg-purple-500/40 rounded" />
                <div className="h-2 w-2/3 bg-cyan-400/40 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content overlay */}
      <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/40">
            <span className="material-icons text-white text-xl">lan</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white uppercase">
            CS Portal
          </span>
        </div>

        {/* Hero text */}
        <div className="max-w-md">
          <h1 className="text-6xl font-extrabold leading-[1.1] text-white mb-8">
            Join the Community.
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #1337ec, #8b5cf6, #22d3ee)",
              }}
            >
              Build the Future.
            </span>
          </h1>
          <p className="text-slate-400 text-xl font-light">
            Your gateway to research labs, coding competitions, and a lifelong
            network of computer science pioneers.
          </p>
        </div>

        {/* Social proof */}
        {showAvatars && (
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3" role="group" aria-label="Student avatars">
              {avatars.slice(0, 3).map((avatar, i) => (
                <img
                  key={avatar.alt || i}
                  src={avatar.src}
                  alt={avatar.alt || `Student ${i + 1}`}
                  className="w-12 h-12 rounded-full border-2 border-[#101322] shadow-xl object-cover"
                />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg">
                {studentCount.toLocaleString()}+ Students
              </span>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
                Active contributors
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}