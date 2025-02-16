const express = require("express");
const Queue = require("bull");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");


const app = express();
app.use(cors()); // Enable CORS for development
const PORT = 5002;

const server = http.createServer(app);
const io = new Server(server);

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
  try {
    console.log(`🖼️ Processing image: ${job.data.filePath}`);

    if (!job.data.filePath) {
      throw new Error("File path is missing!");
    }

    // Simulate image processing (Replace this with actual logic)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await Image.findOneAndUpdate({ jobId: job.id }, { 
      status: "completed", 
      imageUrl: job.data.filePath 
    });

    console.log(`✅ Image processed successfully: ${job.data.filePath}`);
  } catch (error) {
    console.error(`❌ Image processing failed: ${error.message}`);

    await Image.findOneAndUpdate({ jobId: job.id }, { 
      status: "failed", 
      errorMessage: error.message 
    });
  }
});


imageProcessingQueue.on("completed", async (job) => {
  const image = await Image.findOne({ jobId: job.id });

  io.emit("jobCompleted", { jobId: job.id, imageUrl: image.imageUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
