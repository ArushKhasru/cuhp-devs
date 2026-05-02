import { Router } from "express";
import { githubAuth, githubCallback, logout, me, signin, signup, getSocketToken } from "../controller/auth.controller";

const router: Router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);
router.post("/logout", logout);
router.get("/me", me);
router.get("/socket-token", getSocketToken);

export default router;
