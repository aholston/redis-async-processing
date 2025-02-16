const express = require("express");
const Queue = require("bull");

const app = express();
const PORT = 5002;

const imageProcessingQueue = new Queue("image-processing", {
  redis: { host: "127.0.0.1", port: 6379 },
});


app.post("/upload", async (req, res) => {
  const job = await imageProcessingQueue.add({ imageId: Date.now() });
  res.json({ message: "Image upload received. Processing...", jobId: job.id });
});


imageProcessingQueue.process(async (job) => {
  console.log(`🖼️ Processing image ${job.data.imageId}...`);
  await new Promise((resolve) => setTimeout(resolve, 5000)); 
  console.log(`✅ Image ${job.data.imageId} processed!`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
