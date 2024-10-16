const mongoose = require('mongoose');

const CarouselImageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String
}, { timestamps: true });

module.exports = mongoose.model('CarouselImage', CarouselImageSchema);