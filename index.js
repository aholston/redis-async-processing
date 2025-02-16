const express = require("express");
const Queue = require("bull");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const app = express();
const PORT = 5002;

mongoose.connect("mongodb://localhost:27017/async-images")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("MongoDB Error:", err));

const ImageSchema = new mongoose.Schema({
  jobId: String,
  imageUrl: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const Image = mongoose.model("Image", ImageSchema);

const upload = multer({ dest: "uploads/" });

const imageProcessingQueue = new Queue("image-processing", {
  redis: { host: "127.0.0.1", port: 6379 },
});


app.post("/upload", upload.single("image"), async (req, res) => {
  const job = await imageProcessingQueue.add({ filePath: req.file.path });

  await Image.create({ jobId: job.id, status: "processing", imageUrl: req.file.path });

  res.json({ message: "Image uploaded. Processing...", jobId: job.id });
});

// Check job status
app.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const job = await imageProcessingQueue.getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const status = await job.getState();
  res.json({ jobId, status });
});



imageProcessingQueue.process(async (job) => {
  console.log(`🖼️ Processing image: ${job.data.filePath}`);

  const outputFile = `processed/${path.basename(job.data.filePath)}.jpg`;
  await sharp(job.data.filePath)
    .resize(200) // Resize to 200px width
    .toFile(outputFile);

  await Image.findOneAndUpdate({ jobId: job.id }, { status: "completed", imageUrl: outputFile });

  console.log(`✅ Image processed & saved as ${outputFile}`);
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
