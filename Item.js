const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  size: { type: String, required: true },
  images: [String],
  currentBid: { type: Number, default: 0 },
  endTime: { type: Date, required: true },
});

module.exports = mongoose.model('Item', ItemSchema);
