const express = require("express");
const Image = require("../models/imageModel");

const router = express.Router();

router.get("/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const job = await Image.findOne({ jobId });

  if (!job) return res.status(404).json({ error: "Job not found" });

  res.json({ 
    jobId, 
    status: job.status, 
    error: job.status === "failed" ? job.errorMessage : null 
  });
});

module.exports = router;
