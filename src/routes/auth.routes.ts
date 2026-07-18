import { Router } from "express";
import passport from "passport";
import { register, login, demoLogin, getMe } from "../controllers/auth.controller";
import { signToken } from "../utils/jwt";
import { IUser } from "../models/User";
import { requireAuth } from "../middleware/auth.middleware";
import { updateProfile, changePassword } from "../controllers/auth.controller";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/demo-login", demoLogin);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateProfile);
router.patch("/me/password", requireAuth, changePassword);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const user = req.user as IUser;
    const token = signToken(user._id.toString());
    // redirect to frontend with token as query param — frontend will grab and store it
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

export default router;