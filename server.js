const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  credentials: true,
};

app.use(cors(corsOptions));

// Increase payload size limit
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
const articlesRouter = require('./routes/articles');
app.use('/api/articles', articlesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});