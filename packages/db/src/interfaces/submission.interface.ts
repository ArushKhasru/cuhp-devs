import { Document, Types } from "mongoose";
import { SubmissionResult } from "../enums";
export interface ISubmission extends Document {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  code: string;
  language: string;
  runtime: string;
  version: string;
  executableCode: string;
  status: SubmissionResult;
  totalTestcases: number;
  testcasesPassed: number;
  expectedOutputs: string[];
  testcaseInputs: string[];
  attempts: number;
  leaseToken?: string;
  leaseExpiresAt?: Date;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  memory?: number;
  time?: number;
  failedTestcase?: number;
  createdAt: Date;
  updatedAt: Date;
}
