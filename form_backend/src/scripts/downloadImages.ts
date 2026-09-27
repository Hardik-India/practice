import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Submission } from "../models/Submission";

dotenv.config();

const OUTPUT_DIR = path.join(__dirname, "../../downloaded-images");

async function downloadImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to DB:", mongoose.connection.name);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const submissions = await Submission.find();
    console.log(`Found ${submissions.length} submissions. Starting download...`);

    let successCount = 0;
    let failCount = 0;

    for (const sub of submissions) {
      try {
        const response = await fetch(sub.imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());

        // Extract extension from the URL, default to .jpg if unclear
        const ext = path.extname(new URL(sub.imageUrl).pathname) || ".jpg";
        const safeName = sub.name.replace(/[^a-zA-Z0-9_-]/g, "_"); // sanitize filename
        const filePath = path.join(OUTPUT_DIR, `${safeName}${ext}`);

        fs.writeFileSync(filePath, buffer);
        console.log(`✔ Downloaded: ${safeName}${ext}`);
        successCount++;
      } catch (err) {
        console.error(`✘ Failed for ${sub.name} (${sub.mobile}):`, err);
        failCount++;
      }
    }

    console.log(`\nDone. ${successCount} succeeded, ${failCount} failed.`);
    console.log(`Images saved to: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

downloadImages();