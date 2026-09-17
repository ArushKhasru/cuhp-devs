import { Schema } from "mongoose";
import { SubmissionResult } from "../enums";
export const SubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  runtime: { type: String, required: true },
  version: { type: String, required: true },
  executableCode: { type: String, required: true, select: false },
  status: { type: String, enum: Object.values(SubmissionResult), default: SubmissionResult.PENDING },
  totalTestcases: { type: Number, default: 0 },
  testcasesPassed: { type: Number, default: 0 },
  expectedOutputs: { type: [String], default: [], select: false },
  testcaseInputs: { type: [String], default: [], select: false },
  attempts: { type: Number, default: 0, select: false },
  leaseToken: { type: String, select: false },
  leaseExpiresAt: { type: Date, select: false },
  stdout: String, stderr: String, compileOutput: String,
  memory: Number, time: Number, failedTestcase: Number,
}, { timestamps: true });
SubmissionSchema.index({ status: 1, createdAt: 1 });
SubmissionSchema.index({ status: 1, leaseExpiresAt: 1 });
