const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const router = express.Router();

// Configure AWS SDK
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Ensure these are set in your .env
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

// Configure multer to use multer-s3 for direct uploads to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read', // Adjust as needed
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: function (req, file, cb) {
    // Accept video files only
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Invalid file type, only videos are allowed!'), false);
    }
    cb(null, true);
  }
});

// POST /api/uploadvideo
router.post('/', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  return res.status(200).json({
    message: 'Video uploaded successfully',
    videoUrl: req.file.location
  });
});

// GET /api/uploadvideo
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Video upload endpoint is accessible' });
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({ message: err.message });
  }
  next();
});

module.exports = router;