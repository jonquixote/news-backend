const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const CarouselImage = require('../models/CarouselImage');
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
    if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Invalid file type, only videos are allowed for video upload!'), false);
    }
    if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid file type, only images are allowed for carousel!'), false);
    }
    cb(null, true);
  }
});

// Upload video to S3
router.post('/homepagevideo', upload.single('video'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
  
    const file = req.file;
    const useTimestamp = req.body.useTimestamp === 'true'; // Check if we should use a timestamp
    const key = 'homePageVideo';
  
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    };
  
    try {
      console.log('Attempting to upload video to S3 with params:', { ...params, Body: '[File Buffer]' });
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
  
      console.log('Video uploaded successfully. Bucket:', process.env.AWS_S3_BUCKET_NAME, 'Key:', key);
      return res.status(200).json({
        message: 'Video uploaded successfully',
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: key
      });
    } catch (error) {
      console.error('Error uploading video to S3:', error);
      return res.status(500).json({ message: 'Error uploading video', error: error.message });
    }
  });

// Get all carousel images
router.get('/carousel-images', async (req, res) => {
  try {
    const images = await CarouselImage.find();
    res.json(images);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    res.status(500).json({ message: 'Error fetching carousel images', error: error.message });
  }
});

// Upload a new carousel image
router.post('/carousel-images', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    const newImage = new CarouselImage({
      data: req.file.buffer,
      contentType: req.file.mimetype
    });
    await newImage.save();
    res.status(201).json({ message: 'Image uploaded successfully', id: newImage._id });
  } catch (error) {
    console.error('Error uploading carousel image:', error);
    res.status(500).json({ message: 'Error uploading carousel image', error: error.message });
  }
});

// Delete a specific carousel image
router.delete('/carousel-images/:id', async (req, res) => {
  try {
    const result = await CarouselImage.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    res.status(500).json({ message: 'Error deleting carousel image', error: error.message });
  }
});

// Delete all carousel images
router.delete('/carousel-images', async (req, res) => {
  try {
    await CarouselImage.deleteMany({});
    res.status(200).json({ message: 'All images deleted successfully' });
  } catch (error) {
    console.error('Error deleting all carousel images:', error);
    res.status(500).json({ message: 'Error deleting all carousel images', error: error.message });
  }
});

// Get video URL
router.post('/getVideoUrl', async (req, res) => {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const key = req.body.key || 'homePageVideo'; // Use provided key or default to 'homePageVideo'
  
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
  
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  
      res.json({ url });
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      res.status(500).json({ message: 'Error generating video URL', error: error.message });
    }
  });

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Error in homePageRoutes:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
});

module.exports = router;