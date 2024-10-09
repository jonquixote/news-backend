const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware (apply before other middlewares)
app.use(cors({
  origin: 'https://apmnews.vercel.app',
  credentials: true,
}));

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Configure multer for S3 uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, 'videos/' + Date.now().toString() + '-' + file.originalname);
    }
  })
});

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// Routes
const articlesRouter = require('./routes/articles');
app.use('/api/articles', articlesRouter);

// Add a new route for video uploads
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  if (req.file) {
    res.json({ videoUrl: req.file.location });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add this after your routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});