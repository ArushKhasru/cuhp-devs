"use client";

import { ReactNode } from "react";
import { FaTerminal, FaDatabase, FaCode } from "react-icons/fa";

interface Avatar {
  src: string;
  alt?: string;
}

interface LeftPanelProps {
  avatars?: Avatar[];
  className?: string;
  showAvatars?: boolean;
  studentCount?: number;
}

export function LeftPanel({ 
  avatars = [], 
  className,
  showAvatars = true,
  studentCount = 2000
}: LeftPanelProps): ReactNode {
 return (
    <div className={`hidden lg:flex w-1/2 relative overflow-hidden bg-[#0a1033] ${className}`}>
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(at 15% 15%, rgba(59,130,246,0.08), transparent 50%),
            radial-gradient(at 85% 85%, rgba(139,92,246,0.06), transparent 50%)
          `,
        }}
      />

      {/* Background decorative frame with code lines and icons */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full">
          {/* Floating blur elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-xl rotate-12 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          {/* Main bordered frame with content */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border border-blue-600/10 rounded-xl transform rotate-3 flex items-center justify-center">
            <div className="relative w-full h-full p-12">
              {/* Code block simulation */}
              <div className="space-y-4 opacity-40">
                <div className="h-2 w-3/4 bg-blue-600/40 rounded" />
                <div className="h-2 w-1/2 bg-purple-500/40 rounded" />
                <div className="h-2 w-5/6 bg-blue-600/40 rounded" />
                <div className="h-2 w-2/3 bg-cyan-400/40 rounded" />

                {/* Icon cards grid */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="h-24 bg-blue-600/10 border border-blue-600/20 rounded-lg flex items-center justify-center">
                    <FaTerminal className="text-blue-600 text-3xl" />
                  </div>
                  <div className="h-24 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaDatabase className="text-purple-500 text-3xl" />
                  </div>
                  <div className="h-24 bg-cyan-400/10 border border-cyan-400/20 rounded-lg flex items-center justify-center">
                    <FaCode className="text-cyan-400 text-3xl" />
                  </div>
                </div>

                <div className="h-2 w-1/3 bg-blue-600/40 rounded mt-8" />
                <div className="h-2 w-3/4 bg-purple-500/40 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 p-12 flex flex-col justify-between w-full h-full">
        {/* Logo at top */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              className="w-6 h-6 text-white"
              fill="currentColor"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10H7V9h5v3zm5 0h-5V9h5v3z"/>
            </svg>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight uppercase">CS Portal</span>
        </div>

        {/* Center content area - Hero text */}
        <div className="flex-1 flex flex-col justify-center max-w-lg">
          <div>
            <h1 className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              Master the
              <br />
              Machine.
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Code the Future.
              </span>
            </h1>

            <p className="text-slate-400 text-base xl:text-lg leading-relaxed max-w-md">
              Access the university&apos;s premier resource for computer science excellence, collaboration, and innovation.
            </p>
          </div>
        </div>

        {/* Social proof at bottom */}
        {showAvatars && (
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {avatars.slice(0, 3).map((avatar, i) => (
                <img
                  key={i}
                  src={avatar.src}
                  alt={avatar.alt || `Student ${i + 1}`}
                  className="w-11 h-11 rounded-full border-2 border-[#0a1033] object-cover"
                />
              ))}
            </div>
            <span className="text-slate-400 text-sm">
              Joined by {studentCount.toLocaleString()}+ CS students
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
