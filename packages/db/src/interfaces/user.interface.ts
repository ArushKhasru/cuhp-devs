import { Document, Types } from "mongoose";

export interface INotification {
  _id?: Types.ObjectId | string;
  type: "follow" | "follow_back";
  fromUser: Types.ObjectId | any;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  studentId?: string;
  githubId?: string;
  googleId?: string;
  authProvider?: "credentials" | "github" | "google";
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
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  notifications: INotification[];
}
