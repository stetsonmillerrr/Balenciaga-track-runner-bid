const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/biddingWebsite', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const app = express();

app.use(bodyParser.json());
app.use(require('cors')());

// MongoDB Models
const Item = mongoose.model('Item', new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  size: { type: String, required: true },
  images: [String],
  currentBid: { type: Number, default: 0 },
  endTime: { type: Date, required: true },
}));

const Bid = mongoose.model('Bid', new mongoose.Schema({
  userId: String,
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  amount: Number,
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}));

app.post('/admin/createItem', async (req, res) => {
  const { name, description, size, images, endTime } = req.body;
  const newItem = new Item({ name, description, size, images, endTime: new Date(endTime) });
  try {
    await newItem.save();
    res.status(200).send('Item created successfully');
  } catch (err) {
    res.status(500).send('Error creating item');
  }
});

app.post('/placeBid', async (req, res) => {
  const { userId, itemId, amount } = req.body;
  const item = await Item.findById(itemId);
  if (!item) return res.status(404).send("Item not found");

  if (amount <= item.currentBid) return res.status(400).send("Bid is too low");

  const bid = new Bid({ userId, itemId, amount, status: 'pending' });
  await bid.save();

  item.currentBid = amount;
  await item.save();
  
  res.send("Bid placed successfully");
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
