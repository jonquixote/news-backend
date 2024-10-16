const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const router = express.Router();

// Configure AWS SDK
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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
router.post('/', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  const file = req.file;
  const key = `${Date.now()}_${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    console.log('Attempting to upload file to S3 with params:', { ...params, Body: '[File Buffer]' });
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    console.log('File uploaded successfully. Bucket:', process.env.AWS_S3_BUCKET_NAME, 'Key:', key);
    return res.status(200).json({
      message: 'Video uploaded successfully',
      bucket: process.env.AWS_S3_BUCKET_NAME,
      key: key
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
});

// GET /api/uploadvideo
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Video upload endpoint is accessible' });
});

// POST /api/getVideoUrl
// router.post('/getVideoUrl', async (req, res) => {
//   const { bucket, key } = req.body;

//   if (!bucket || !key) {
//     return res.status(400).json({ message: 'Bucket and key are required' });
//   }

//   try {
//     const command = new GetObjectCommand({
//       Bucket: bucket,
//       Key: key,
//     });

//     const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

//     res.json({ url });
//   } catch (error) {
//     console.error('Error generating pre-signed URL:', error);
//     res.status(500).json({ message: 'Error generating video URL', error: error.message });
//   }
// });

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Error in uploadvideo route:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
});

module.exports = router;