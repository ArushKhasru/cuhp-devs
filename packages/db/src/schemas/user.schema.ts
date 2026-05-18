import { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";

export const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    studentId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["credentials", "github", "google"],
      default: "credentials",
    },
    password: {
      type: String,
      required: true
    },
    program: {
      type: String,
      required: false,
      trim: true,
    },
    semester: {
      type: String,
      required: false,
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    handle: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    theme: {
      type: String,
      enum: ["light", "dark", "cyber-orange", "rose-pine-dawn", "nord-light", "solarized-light", "vaporwave", "gruvbox-light", "vesper-light", "github-dark"],
      default: "dark",
    },
    savedPosts: [{
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: []
    }],
    streak: {
      type: Number,
      default: 0
    },
    lastStreakUpdate: {
      type: Date,
      default: null
    },
    solvedProblems: [{
      type: Schema.Types.ObjectId,
      ref: "Problem",
      default: []
    }],
    followers: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      default: []
    }],
    following: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      default: []
    }],
    notifications: [{
      type: {
        type: String,
        enum: ["follow", "follow_back"],
        required: true
      },
      fromUser: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      message: {
        type: String,
        required: true
      },
      read: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Add indexes for faster lookups
UserSchema.index({ solvedProblems: 1 });
UserSchema.index({ followers: 1 });
UserSchema.index({ following: 1 });
