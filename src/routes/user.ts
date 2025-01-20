import { protect } from "../middlewares/authMiddleware";

import express from "express";
import upload from "../middlewares/multerConfig";
import {
  getProfilePictureAndUserName,
  updateProfile,
} from "../controllers/userController";

export default (router: express.Router) => {
  router.put(
    "/profile",
    protect,
    upload.single("profilePicture"),
    updateProfile
  );

  router.get("/profile", protect, getProfilePictureAndUserName);

  return router;
};
