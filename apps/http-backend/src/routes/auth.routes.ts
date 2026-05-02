import { Router } from "express";
import { githubAuth, githubCallback, googleAuth, googleCallback, logout, me, signin, signup, getSocketToken } from "../controller/auth.controller";

const router: Router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/logout", logout);
router.get("/me", me);
router.get("/socket-token", getSocketToken);

export default router;
