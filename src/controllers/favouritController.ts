import User from "../models/user";
import Folder from "../models/folder";
import File from "../models/file";
import favourits from "../models/favourits";

// vice-versa
const markAsFavorite = async (req, res) => {
  try {
    const { type, id } = req.body; // type can be "file" or "folder"
    const userId = req.user._id;

    const existingFavorite = await favourits.findOne({
      user: userId,
      itemType: type,
      itemId: id,
    });

    if (existingFavorite) {
      // Unmark as favorite
      await existingFavorite.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Removed from favorites",
      });
    }

    // Mark as favorite
    const newFavorite = new favourits({
      user: userId,
      itemType: type,
      itemId: id,
    });

    await newFavorite.save();
    res.status(200).json({
      success: true,
      message: "Added to favorites",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update favorite status" });
  }
};

const getFavoriteItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const favoriteItems = await favourits.find({ user: userId });

    // Separate items by type and fetch their details
    const fileIds = favoriteItems
      .filter((item) => item.itemType === "file")
      .map((item) => item.itemId);
    const folderIds = favoriteItems
      .filter((item) => item.itemType === "folder")
      .map((item) => item.itemId);

    const files = await File.find({ _id: { $in: fileIds }, user: userId });
    const folders = await Folder.find({
      _id: { $in: folderIds },
      user: userId,
    });

    res.status(200).json({
      success: true,
      data: {
        files,
        folders,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch favorite items",
    });
  }
};

const renameFavoriteItem = async (req, res) => {
  try {
    const { itemId, newName } = req.body;
    const userId = req.user._id;

    if (!itemId || !newName) {
      return res
        .status(400)
        .json({ error: "Item ID and new name are required" });
    }

    const favoriteItem = await favourits.findOne({ user: userId, itemId });
    if (!favoriteItem) {
      return res.status(404).json({ error: "Favorite item not found" });
    }

    let updatedItem;

    // Check if the item is a file or folder and rename it
    if (favoriteItem.itemType === "file") {
      updatedItem = await File.findOneAndUpdate(
        { _id: itemId, user: userId },
        { name: newName.trim() },
        { new: true }
      );
    } else if (favoriteItem.itemType === "folder") {
      updatedItem = await Folder.findOneAndUpdate(
        { _id: itemId, user: userId },
        { name: newName.trim() },
        { new: true }
      );
    }

    if (!updatedItem) {
      return res
        .status(404)
        .json({ error: `${favoriteItem.itemType} not found` });
    }

    res.status(200).json({
      success: true,
      message: `${favoriteItem.itemType} renamed successfully`,
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to rename item",
    });
  }
};

const duplicateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const favoriteItem = await favourits.findOne({ user: userId, itemId });
    if (!favoriteItem) {
      return res.status(404).json({ error: "Item not found in favorites" });
    }

    let duplicatedItem;

    // Check if the item is a file or folder and duplicate it
    if (favoriteItem.itemType === "file") {
      const originalFile = await File.findOne({ _id: itemId, user: userId });
      if (!originalFile) {
        return res.status(404).json({ error: "File not found" });
      }

      // Create a duplicate file
      duplicatedItem = new File({
        ...originalFile.toObject(),
        _id: undefined, // Remove the original ID to create a new document
        name: `${originalFile.name} (Copy)`,
        createdAt: Date.now(),
      });

      await duplicatedItem.save();
    } else if (favoriteItem.itemType === "folder") {
      const originalFolder = await Folder.findOne({
        _id: itemId,
        user: userId,
      });
      if (!originalFolder) {
        return res.status(404).json({ error: "Folder not found" });
      }

      duplicatedItem = new Folder({
        ...originalFolder.toObject(),
        _id: undefined,
        name: `${originalFolder.name} (Copy)`,
        createdAt: Date.now(),
      });

      await duplicatedItem.save();
    } else {
      return res.status(400).json({ error: "Invalid item type" });
    }

    // Add the duplicated item to favorites
    const newFavorite = new favourits({
      user: userId,
      itemType: favoriteItem.itemType,
      itemId: duplicatedItem._id,
    });

    await newFavorite.save();

    res.status(201).json({
      success: true,
      message: `${favoriteItem.itemType} duplicated successfully`,
      data: duplicatedItem,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to duplicate item",
    });
  }
};

const deleteFavoriteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const favoriteItem = await favourits.findOneAndDelete({
      user: userId,
      itemId,
    });

    if (!favoriteItem) {
      return res.status(404).json({ error: "Favorite item not found" });
    }

    // Delete the main file or folder based on the item type
    if (favoriteItem.itemType === "file") {
      const deletedFile = await File.findOneAndDelete({
        _id: itemId,
        user: userId,
      });
      if (!deletedFile) {
        return res.status(404).json({ error: "File not found" });
      }
    } else if (favoriteItem.itemType === "folder") {
      const deletedFolder = await Folder.findOneAndDelete({
        _id: itemId,
        user: userId,
      });
      if (!deletedFolder) {
        return res.status(404).json({ error: "Folder not found" });
      }
    } else {
      return res.status(400).json({ error: "Invalid item type" });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from favorites and main resource deleted",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete favorite item",
    });
  }
};

export {
  markAsFavorite,
  getFavoriteItems,
  renameFavoriteItem,
  duplicateItem,
  deleteFavoriteItem,
};
