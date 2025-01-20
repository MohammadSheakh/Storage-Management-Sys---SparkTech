import express from "express";
import {
  getStorageSummary,
  createFolder,
  getFolderContents,
  uploadMultipleFiles,
  getDocumentsByDate,
  getRootLevelItems,
  getDocumentsByType,
} from "../controllers/storageController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/multerConfig";

export default (router: express.Router) => {
  router.get("/files/type/:type", protect, getDocumentsByType);

  router.get("/getStorageSummary", protect, getStorageSummary); // working
  router.post("/folder/create", protect, createFolder); // working

  router.get("/getRootLevelItems", protect, getRootLevelItems); // working

  router.get("/getFolderContents", protect, getFolderContents); // working

  router.get("/getDocumentsByDate/:date", protect, getDocumentsByDate);

  router.post(
    "/:folderId/uploadMultipleFiles", // working
    protect,
    upload.array("files", 10),
    uploadMultipleFiles
  );

  router.post(
    "/uploadMultipleFiles", // working
    protect,
    upload.array("files", 10),
    uploadMultipleFiles
  );

  return router;
};
