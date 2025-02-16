const mongoose = require("mongoose");
const { imageProcessingQueue } = require("../services/redisQueue");
const Image = require("../models/imageModel");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { uploadToS3 } = require("../services/s3Uploader");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/async-images", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Worker connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

imageProcessingQueue.process(async (job) => {
  try {
    console.log(`🖼️ Processing image: ${job.data.filePath}`);

    if (!job.data.filePath) {
      throw new Error("File path is missing!");
    }

    const fileName = `${path.basename(job.data.filePath)}.jpg`;
    const processedPath = `processed/${fileName}`;

    // Resize image using Sharp
    await sharp(job.data.filePath)
      .resize(200)
      .toFile(processedPath);

    // Upload to S3
    const s3Url = await uploadToS3(processedPath, fileName);

    // Update MongoDB with S3 URL
    await Image.findOneAndUpdate({ jobId: job.id }, { status: "completed", imageUrl: s3Url });

    console.log(`✅ Image processed & uploaded to S3: ${s3Url}`);

    // Cleanup local file after upload
    fs.unlinkSync(processedPath);
  } catch (error) {
    console.error(`❌ Image processing failed: ${error.message}`);

    await Image.findOneAndUpdate({ jobId: job.id }, { 
      status: "failed", 
      errorMessage: error.message 
    });
  }
});
