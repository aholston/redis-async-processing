const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const uploadRoutes = require("./routes/uploadRoutes");
const statusRoutes = require("./routes/statusRoutes");

const app = express();
const PORT = process.env.PORT || 8080; 

mongoose.connect("mongodb://localhost:27017/async-images")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("MongoDB Error:", err));

app.use(cors());
app.use(express.json());

// Routes
app.use("/upload", uploadRoutes);
app.use("/status", statusRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
