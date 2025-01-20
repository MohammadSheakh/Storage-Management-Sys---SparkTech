import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["note", "image", "pdf"], required: true },
  size: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("File", fileSchema);
