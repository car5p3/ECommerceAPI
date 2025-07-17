import { Router } from "express";
import { authCallback, forgotPassword, login, logout, me, resetPassword, signup, verifyEmail } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/isLoggedIn.middleware.js";
import passport from "passport";

const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login)
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);
authRouter.post('/logout', protect, logout);

// Google Auth
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get("/google/callback", passport.authenticate("google", { session: true }), authCallback);

// GitHub Auth
authRouter.get("/github", passport.authenticate("github"));
authRouter.get("/github/callback", passport.authenticate("github", { session: true }), authCallback);

// Testing route
authRouter.get("/me", protect, me);

export default authRouter;