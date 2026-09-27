import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const Submission = mongoose.model("Submission", submissionSchema);