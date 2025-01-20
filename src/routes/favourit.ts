import { protect } from "../middlewares/authMiddleware";
import {
  deleteFavoriteItem,
  duplicateItem,
  getFavoriteItems,
  markAsFavorite,
  renameFavoriteItem,
} from "../controllers/favouritController";
import express from "express";

export default (router: express.Router) => {
  router.post("/markAsFavorite", markAsFavorite);
  router.post("/renameFavoriteItem/:itemId", protect, renameFavoriteItem);
  router.post("/favorites/:itemId/duplicate", protect, duplicateItem);
  router.get("/getFavoriteItems", protect, getFavoriteItems);
  router.delete("/favorites/:itemId", protect, deleteFavoriteItem);

  return router;
};
