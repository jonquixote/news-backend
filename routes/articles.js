const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// Debugging route
router.get('/test', (req, res) => {
  res.json({ message: 'Articles router is working' });
});

// Get all articles
router.get('/', async (req, res) => {
  try {
    console.log('Fetching articles');
    const limit = parseInt(req.query.limit) || 10;
    const articles = await Article.find({ status: 'published' })
      .sort({ date: -1 })
      .limit(limit);
    console.log(`Found ${articles.length} articles`);
    res.json(articles);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Get the most recent main featured article
router.get('/featured/main', async (req, res) => {
  try {
    console.log('Fetching main featured article');
    const mainFeaturedArticle = await Article.findOne({ isMainFeatured: true, status: 'published' })
      .sort({ date: -1 })
      .limit(1);
    
    console.log('Main featured article query result:', mainFeaturedArticle);

    if (!mainFeaturedArticle) {
      console.log('No main featured article found');
      return res.status(404).json({ message: 'No main featured article found' });
    }
    
    res.json(mainFeaturedArticle);
  } catch (err) {
    console.error('Error fetching main featured article:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Get a specific article
router.get('/:id', getArticle, (req, res) => {
  res.json(res.article);
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

module.exports = router;