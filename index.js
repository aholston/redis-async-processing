const express = require("express");
const Queue = require("bull");
const mongoose = require("mongoose");

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

const imageProcessingQueue = new Queue("image-processing", {
  redis: { host: "127.0.0.1", port: 6379 },
});


app.post("/upload", async (req, res) => {
  const job = await imageProcessingQueue.add({ imageId: Date.now() });

  await Image.create({ jobId: job.id, status: "processing" });

  res.json({ message: "Image upload received. Processing...", jobId: job.id });
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
  console.log(`🖼️ Processing image ${job.data.imageId}...`);
  await new Promise((resolve) => setTimeout(resolve, 5000)); 

  await Image.findOneAndUpdate({ jobId: job.id }, { status: "completed" });
  
  console.log(`✅ Image ${job.data.imageId} processed!`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
