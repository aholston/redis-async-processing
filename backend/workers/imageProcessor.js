const mongoose = require("mongoose");  // <-- Add this
const { imageProcessingQueue } = require("../services/redisQueue");
const Image = require("../models/imageModel");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const processedDir = "processed"; 

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

// ✅ Ensure MongoDB is connected
mongoose.connect("mongodb://localhost:27017/async-images", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Worker connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

imageProcessingQueue.process(async (job) => {
  try {
    console.log(`🖼️ Processing image: ${job.data.filePath}`);

    if (!job.data.filePath) {
      throw new Error("File path is missing!");
    }

    const outputFile = `${processedDir}/${path.basename(job.data.filePath)}.jpg`;
    
    await sharp(job.data.filePath)
      .resize(200)
      .toFile(outputFile);

    await Image.findOneAndUpdate({ jobId: job.id }, { status: "completed", imageUrl: outputFile });

    console.log(`✅ Image processed & saved as ${outputFile}`);
  } catch (error) {
    console.error(`❌ Image processing failed: ${error.message}`);

    await Image.findOneAndUpdate({ jobId: job.id }, { 
      status: "failed", 
      errorMessage: error.message 
    });
  }
});
