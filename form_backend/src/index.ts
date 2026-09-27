import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Submission } from "./models/Submission";
import { upload } from "./middleware/upload";
import { uploadToCloudinary } from "./utils/cloudinary";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/submit", upload.single("image"), async (req, res) => {
  try {
    const { name, department, mobile } = req.body;
    const file = req.file;

    if (!name || !department || !mobile) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: "Invalid mobile number" });
    }
    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }

      const imageUrl = await uploadToCloudinary(
     file.buffer,
     `${name}_${Date.now()}${path.extname(file.originalname)}`
   );

    const submission = await Submission.create({ name, department, mobile, imageUrl });
    res.status(201).json({ success: true, data: submission });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This mobile number has already been registered" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("Connected to DB:", mongoose.connection.name);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));