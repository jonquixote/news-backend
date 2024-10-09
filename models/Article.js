const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tagline: { type: String },
  mainImage: { type: String },
  author: { type: String },
  date: { type: Date, default: Date.now },
  content: [
    {
      type: { type: String, required: true },
      content: { type: String, required: true },
      caption: { type: String },
      title: { type: String }
    }
  ],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  isMainFeatured: { type: Boolean, default: false },
  videoUrl: { type: String }
});

module.exports = mongoose.model('Article', ArticleSchema);