import express from "express";
import {
  getStorageSummary,
  createFolder,
  getFolderContents,
  uploadMultipleFiles,
  getDocumentsByDate,
  getRootLevelItems,
  getDocumentsByType,
  renameItem,
  duplicateItem,
  deleteItem,
} from "../controllers/storageController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/multerConfig";

export default (router: express.Router) => {
  router.get("/files/type/:type", protect, getDocumentsByType);

  router.get("/getStorageSummary", protect, getStorageSummary);

  router.put("/item/rename/:type/:id", protect, renameItem);
  router.post("/item/duplicate/:type/:itemId", protect, duplicateItem);
  router.delete("/item/delete/:type/:itemId", protect, deleteItem);

  router.get("/getRootLevelItems", protect, getRootLevelItems);

  router.get("/getFolderContents", protect, getFolderContents);

  router.get("/getDocumentsByDate/:date", protect, getDocumentsByDate);

  router.post(
    "/:folderId/uploadMultipleFiles",
    protect,
    upload.array("files", 10),
    uploadMultipleFiles
  );

  router.post(
    "/uploadMultipleFiles",
    protect,
    upload.array("files", 10),
    uploadMultipleFiles
  );

  router.post("/folder/create", protect, createFolder);

  return router;
};
