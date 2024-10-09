const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// Get all articles
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new article
router.post('/', async (req, res) => {
  console.log('Received article data:', JSON.stringify(req.body, null, 2));
  const article = new Article(req.body);
  try {
    const newArticle = await article.save();
    console.log('Article saved successfully:', JSON.stringify(newArticle, null, 2));
    res.status(201).json(newArticle);
  } catch (err) {
    console.error('Error saving article:', err);
    res.status(400).json({ message: err.message, details: err });
  }
});

// Get a specific article
router.get('/:id', getArticle, (req, res) => {
  res.json(res.article);
});

// Update an article
router.patch('/:id', getArticle, async (req, res) => {
  if (req.body.title != null) {
    res.article.title = req.body.title;
  }
  if (req.body.tagline != null) {
    res.article.tagline = req.body.tagline;
  }
  if (req.body.mainImage != null) {
    res.article.mainImage = req.body.mainImage;
  }
  if (req.body.author != null) {
    res.article.author = req.body.author;
  }
  if (req.body.date != null) {
    res.article.date = req.body.date;
  }
  if (req.body.content != null) {
    res.article.content = req.body.content;
  }
  if (req.body.status != null) {
    res.article.status = req.body.status;
  }
  if (req.body.isMainFeatured != null) {
    res.article.isMainFeatured = req.body.isMainFeatured;
  }
  try {
    const updatedArticle = await res.article.save();
    res.json(updatedArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an article
router.delete('/:id', getArticle, async (req, res) => {
  try {
    await res.article.remove();
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get article by ID
async function getArticle(req, res, next) {
  let article;
  try {
    article = await Article.findById(req.params.id);
    if (article == null) {
      return res.status(404).json({ message: 'Cannot find article' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.article = article;
  next();
}

// Get the most recent main featured article
router.get('/main-featured', async (req, res) => {
  try {
    const mainFeaturedArticle = await Article.findOne({ isMainFeatured: true, status: 'published' })
      .sort({ date: -1 })
      .limit(1);
    
    console.log('Main featured article:', mainFeaturedArticle); // Add this log

    if (!mainFeaturedArticle) {
      console.log('No main featured article found'); // Add this log
      return res.status(404).json({ message: 'No main featured article found' });
    }
    
    res.json(mainFeaturedArticle);
  } catch (err) {
    console.error('Error fetching main featured article:', err); // Add this log
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;