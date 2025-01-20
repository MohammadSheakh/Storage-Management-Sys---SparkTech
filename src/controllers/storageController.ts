import User from "../models/user";
import Folder from "../models/folder";
import File from "../models/file";
import favourits from "../models/favourits";
import fs from "fs";

// getStorageSummary - working
const getStorageSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    const files = await File.find({ user: userId });

    const noteCount = files.filter((file) => file.type === "note").length;
    const imageCount = files.filter((file) => file.type === "image").length;
    const pdfCount = files.filter((file) => file.type === "pdf").length;

    const noteStorage = files
      .filter((file) => file.type === "note")
      .reduce((acc, file) => acc + file.size, 0);
    const imageStorage = files
      .filter((file) => file.type === "image")
      .reduce((acc, file) => acc + file.size, 0);
    const pdfStorage = files
      .filter((file) => file.type === "pdf")
      .reduce((acc, file) => acc + file.size, 0);

    res.status(200).json({
      totalStorage: user?.totalStorage,
      usedStorage: user?.usedStorage,
      availableStorage: user ? user.totalStorage - user.usedStorage : 15, // 🔴 15 ke update korte hobe ..
      categories: {
        note: { total: noteCount, storage: noteStorage },
        image: { total: imageCount, storage: imageStorage },
        pdf: { total: pdfCount, storage: pdfStorage },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get storage summary", err });
  }
};

// create folder
const createFolder = async (req, res) => {
  try {
    const { parentFolder } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    const folder = new Folder({
      name,
      user: userId,
      parentFolder: parentFolder || null,
    });

    await folder.save();

    res.status(201).json({ success: true, folder });
  } catch (err) {
    res.status(500).json({ error: "Failed to create folder" });
  }
};

// getRootLevelItems - working
const getRootLevelItems = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch files and folders where `folder` is null
    const files = await File.find({ folder: null, user: userId });
    const folders = await Folder.find({ parentFolder: null, user: userId });

    res.status(200).json({
      success: true,
      message: "Root-level items fetched successfully",
      data: {
        files,
        folders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch root-level items",
    });
  }
};

// get folder contents by folder id
const getFolderContents = async (req, res) => {
  try {
    const { folderId } = req.query;
    const userId = req.user._id;

    // Fetch all subfolders
    const folders = await Folder.find({ parentFolder: folderId, user: userId });

    // Fetch all files in the current folder
    const files = await File.find({ folder: folderId, user: userId });

    res.status(200).json({
      success: true,
      folders,
      files,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get folder contents" });
  }
};

// upload multiple filles

const uploadMultipleFiles = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles: any = [];
    let totalSize = 0;

    // Process each file
    for (const file of req.files) {
      const { originalname, size, mimetype, path: filePath } = file;

      // Determine file type based on MIME type
      let fileType = "";
      if (mimetype.startsWith("image/")) {
        fileType = "image";
      } else if (mimetype === "application/pdf") {
        fileType = "pdf";
      } else {
        fileType = "note";
      }

      totalSize += size;

      uploadedFiles.push({
        name: originalname,
        type: fileType,
        size,
        user: userId,
        folder: req?.params?.folderId || null,
      });
    }

    // Check user storage limits
    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded files if user is not found
      req.files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(404).json({ error: "User not found" });
    }

    if (user.usedStorage + totalSize > user.totalStorage) {
      // Clean up uploaded files if storage limit is exceeded
      req.files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({ error: "Not enough storage available" });
    }

    const savedFiles = await File.insertMany(uploadedFiles);

    // Update the user's used storage
    user.usedStorage += totalSize;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      files: savedFiles,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload contents", err });
  }
};

const getDocumentsByDate = async (req, res) => {
  const { date } = req.params;
  const userId = req.user._id;

  try {
    const files = await File.find({
      user: userId,
      createdAt: { $gte: new Date(date), $lt: new Date(date + "T23:59:59") },
    });

    const folders = await Folder.find({
      user: userId,
      createdAt: { $gte: new Date(date), $lt: new Date(date + "T23:59:59") },
    });

    res.status(200).json({ success: true, files, folders });
  } catch (err) {
    res.status(500).json({ error: "Failed to get documents by date" });
  }
};

const getDocumentsByType = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!["note", "image", "pdf"].includes(req.params.type)) {
      return res.status(400).json({
        error: "Invalid type provided. Use 'note', 'image', or 'pdf'.",
      });
    }

    // Fetch files matching the type and user
    const files = await File.find({ type: req.params.type, user: userId });

    res.status(200).json({
      success: true,
      message: `Files of type '${req.params.type}' fetched successfully`,
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch files by type",
    });
  }
};

export {
  getStorageSummary,
  createFolder,
  getRootLevelItems,
  getFolderContents,
  uploadMultipleFiles,
  getDocumentsByDate,
  getDocumentsByType,
};
