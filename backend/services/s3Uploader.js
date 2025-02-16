const AWS = require("aws-sdk");
require("dotenv").config();

// AWS will automatically use the IAM Role attached to the instance
const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

const uploadToS3 = async (filePath, fileName) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `processed/${fileName}`,
      Body: fileContent,
      ContentType: "image/jpeg",
      ACL: "public-read"
    };

    const { Location } = await s3.upload(params).promise();
    console.log(`✅ Uploaded to S3: ${Location}`);
    return Location;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    throw error;
  }
};

module.exports = { uploadToS3 };
