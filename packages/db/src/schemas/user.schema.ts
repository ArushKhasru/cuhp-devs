import { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";


// import { UserRole } from "../enums";

// export const UserSchema = new Schema(
//   {
//     email: { type: String, required: true, unique: true },
//     name: String,
//     token: String,
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: Object.values(UserRole),
//       default: UserRole.USER,
//     },
//   },
//   { timestamps: true }
// );

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
    authProvider: {
      type: String,
      enum: ["credentials", "github"],
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
    }]
  },
  {
    timestamps: true
  }
);

// Add index for faster lookups when checking if a problem is solved
UserSchema.index({ solvedProblems: 1 });
