const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { checkRecaptcha } = require('./utils/recaptcha');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/biddingWebsite', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// MongoDB Schema Definitions
const Item = mongoose.model('Item', new mongoose.Schema({
  name: String,
  description: String,
  images: [String],
  currentBid: { type: Number, default: 0 },
  endTime: Date,
}));

const Bid = mongoose.model('Bid', new mongoose.Schema({
  userId: String,
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  amount: Number,
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}));

// Routes

// Place a Bid (with reCAPTCHA validation)
app.post('/placeBid', async (req, res) => {
  const { userId, itemId, amount, captchaResponse } = req.body;

  // Validate CAPTCHA
  const isCaptchaValid = await checkRecaptcha(captchaResponse);
  if (!isCaptchaValid) return res.status(400).send("Invalid CAPTCHA");

  const item = await Item.findById(itemId);
  if (!item) return res.status(404).send("Item not found");

  if (amount <= item.currentBid) {
    return res.status(400).send("Bid is too low");
  }

  // Place the bid
  const bid = new Bid({
    userId,
    itemId,
    amount,
    status: 'pending',
  });

  await bid.save();

  // Update the current highest bid
  item.currentBid = amount;
  await item.save();

  res.send("Bid placed successfully");
});

// Admin Approve/Decline Bid
app.put('/admin/bid/:bidId', async (req, res) => {
  const { action } = req.body;  // 'accept' or 'decline'
  const bid = await Bid.findById(req.params.bidId);

  if (!bid) return res.status(404).send("Bid not found");

  if (action === 'accept') {
    bid.status = 'accepted';
    // Handle payment and notify the user
    await stripe.paymentIntents.create({
      amount: bid.amount * 100, // Convert to cents
      currency: 'usd',
      description: `Payment for item ${bid.itemId}`,
      // Add payment method details from the user later
    });
  } else if (action === 'decline') {
    bid.status = 'declined';
  }

  await bid.save();
  res.send("Bid status updated");
});

// Payment API (to complete payment after a successful bid)
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
    // Notify you, the admin, to send the product
  } else {
    res.status(400).send("Payment failed");
  }
});

// Admin Dashboard (View and manage bids)
app.get('/admin/dashboard', async (req, res) => {
  const items = await Item.find();
  const bids = await Bid.find().populate('itemId');
  res.json({ items, bids });
});

// Start the Server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
