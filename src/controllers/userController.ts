import User from "../models/user";
import fs from "fs";
import path from "path";

const getProfilePictureAndUserName = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("userName profilePicture");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        userName: user.userName,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user details",
    });
  }
};

// Update Profile Picture and userName
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userName) {
      user.userName = userName.trim();
    }

    // Handle profile picture if provided
    if (req.file) {
      if (user.profilePicture) {
        const oldPath = path.join(__dirname, "..", user.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // Delete old profile picture if it exists
        }
      }

      user.profilePicture = `uploads/profilePictures/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        userName: user.userName,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update profile",
    });
  }
};

export { updateProfile, getProfilePictureAndUserName };
