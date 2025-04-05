const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { checkRecaptcha } = require('./recaptcha');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/biddingWebsite', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const app = express();

app.use(bodyParser.json());
app.use(require('cors')());

// Models
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
  const { userId, itemId, amount, captchaResponse } = req.body;
  const isCaptchaValid = await checkRecaptcha(captchaResponse);
  if (!isCaptchaValid) return res.status(400).send("Invalid CAPTCHA");

  const item = await Item.findById(itemId);
  if (!item) return res.status(404).send("Item not found");

  if (amount <= item.currentBid) return res.status(400).send("Bid is too low");

  const bid = new Bid({ userId, itemId, amount, status: 'pending' });
  await bid.save();

  item.currentBid = amount;
  await item.save();
  
  res.send("Bid placed successfully");
});

app.put('/admin/bid/:bidId', async (req, res) => {
  const { action } = req.body;
  const bid = await Bid.findById(req.params.bidId);
  if (!bid) return res.status(404).send("Bid not found");

  if (action === 'accept') {
    bid.status = 'accepted';
    await stripe.paymentIntents.create({
      amount: bid.amount * 100, // Convert to cents
      currency: 'usd',
      description: `Payment for item ${bid.itemId}`,
    });
  } else if (action === 'decline') {
    bid.status = 'declined';
  }

  await bid.save();
  res.send("Bid status updated");
});

app.post('/pay', async (req, res) => {
  const { paymentMethodId, bidId } = req.body;
  const bid = await Bid.findById(bidId);

  if (!bid || bid.status !== 'accepted') return res.status(400).send("Bid not accepted");

  const paymentIntent = await stripe.paymentIntents.create({
    amount: bid.amount * 100, // Convert to cents
    currency: 'usd',
    payment_method: paymentMethodId,
    confirm: true,
  });

  if (paymentIntent.status === 'succeeded') {
    res.send("Payment successful");
  } else {
    res.status(400).send("Payment failed");
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
