const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
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

// Get video URL
router.post('/', async (req, res) => {
    const bucket = req.body.bucket || process.env.AWS_S3_BUCKET_NAME;
    const key = req.body.key;

    if (!key) {
        return res.status(400).json({ message: 'Video key is required' });
    }

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

module.exports = router;