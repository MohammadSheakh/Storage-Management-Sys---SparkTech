import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    profilePicture: { type: String, default: null },
    password: {
      type: String,
      required: true,
    },

    verificationCode: {
      type: String,
    },

    verificationCodeExpires: {
      type: Date,
    },

    totalStorage: { type: Number, default: 15 * 1024 * 1024 * 1024 }, // 15GB in bytes
    usedStorage: { type: Number, default: 0 }, // Used storage in bytes
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
