const express = require("express");
const multer = require("multer");
const Image = require("../models/imageModel");
const { imageProcessingQueue } = require("../services/redisQueue");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded!" });
  }

  const job = await imageProcessingQueue.add({ filePath: req.file.path });

  await Image.create({ jobId: job.id, status: "processing", imageUrl: req.file.path });

  res.json({ message: "Image uploaded. Processing...", jobId: job.id });
});

module.exports = router;
