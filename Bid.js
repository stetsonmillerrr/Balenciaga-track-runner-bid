const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  userId: String,
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  amount: Number,
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
});

module.exports = mongoose.model('Bid', BidSchema);
