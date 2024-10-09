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

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://apmnews.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, 'videos/' + Date.now().toString() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Increase payload size limit
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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

// Add this before your other routes
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  if (req.file) {
    console.log('File uploaded successfully:', req.file);
    res.json({ videoUrl: req.file.location });
  } else {
    console.error('No file received');
    res.status(400).json({ error: 'No file uploaded' });
  }
});

// Add a GET route for testing
app.get('/api/upload-video', (req, res) => {
  res.status(200).json({ message: 'Video upload endpoint is accessible' });
});

// Routes
const articlesRouter = require('./routes/articles');
app.use('/api/articles', articlesRouter);

// Add the route for video uploads
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  if (req.file) {
    console.log('File uploaded successfully:', req.file);
    res.json({ videoUrl: req.file.location });
  } else {
    console.error('No file received');
    res.status(400).json({ error: 'No file uploaded' });
  }
});

// Add this GET route for testing purposes
app.get('/api/upload-video', (req, res) => {
  res.status(200).json({ message: 'Video upload endpoint is working' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add this after your routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Add this near the top of your server.js file
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log('Request headers:', req.headers);
  next();
});