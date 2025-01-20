import { protect } from "../middlewares/authMiddleware";
import {
  registration,
  login,
  getVerificationCode,
  verifyVerificationCode,
  resetPassword,
  changePassword,
  deleteAccount,
  googleAuth,
  googleCallback,
} from "../controllers/authController";
import express from "express";
import passport from "../config/passportConfig";

export default (router: express.Router) => {
  // Google authentication route
  router.get("/google", googleAuth);

  // Google callback route
  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }), // Disable sessions if not required
    googleCallback
  );

  router.post("/registration", registration);
  router.post("/login", login);

  router.post("/getVerificationCode", getVerificationCode);
  router.post("/verifyVerificationCode", verifyVerificationCode);
  router.post("/resetPassword", protect, resetPassword);
  router.post("/changePassword", protect, changePassword);
  router.post("/deleteAccount", protect, deleteAccount);

  return router;
};
