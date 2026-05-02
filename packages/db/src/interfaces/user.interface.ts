import { Document, Types } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  studentId?: string;
  githubId?: string;
  authProvider?: "credentials" | "github";
  handle?: string;
  avatar?: string;
  bio?: string;
  theme?: "light" | "dark" | "cyber-orange" | "rose-pine-dawn" | "nord-light" | "solarized-light" | "vaporwave" | "gruvbox-light" | "vesper-light" | "github-dark";
  password: string;
  program?: string;
  semester?: string;
  interests: string[];
  onboardingCompleted: boolean;
  savedPosts: string[];
  streak: number;
  lastStreakUpdate: Date | null;
  solvedProblems: Types.ObjectId[];
}

