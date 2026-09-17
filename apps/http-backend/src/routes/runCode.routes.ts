import { Router } from "express";
import { runCode } from "../controller/runCode.controller";
import { protect } from "../middleware/auth.middleware";
import { executionGuard } from "../middleware/execution.middleware";
const router: Router = Router();
router.post("/", protect, executionGuard, runCode);
export default router;
