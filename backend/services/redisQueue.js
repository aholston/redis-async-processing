const Queue = require("bull");

const imageProcessingQueue = new Queue("image-processing", {
  redis: { host: "127.0.0.1", port: 6379 },
});

module.exports = { imageProcessingQueue };
