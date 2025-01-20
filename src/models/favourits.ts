import mongoose from "mongoose";

const favouritsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemType: { type: String, enum: ["file", "folder"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  addedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Favourits", favouritsSchema);
