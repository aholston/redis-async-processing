const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  jobId: String,
  imageUrl: String,
  status: String,
  errorMessage: String, // Store error details if processing fails
  createdAt: { type: Date, default: Date.now }
});

const Image = mongoose.model("Image", ImageSchema);
module.exports = Image;
