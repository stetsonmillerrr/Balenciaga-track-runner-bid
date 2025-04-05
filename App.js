import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm';

const stripePromise = loadStripe('your-publishable-stripe-key');

const App = () => {
  const [items, setItems] = useState([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [captchaResponse, setCaptchaResponse] = useState('');
  const [userId, setUserId] = useState(''); // Example User ID

  useEffect(() => {
    axios.get('http://localhost:3000/items')
      .then(res => setItems(res.data))
      .catch(err => console.log(err));
  }, []);

  const placeBid = (itemId, amount) => {
    axios.post('http://localhost:3000/placeBid', {
      userId,
      itemId,
      amount,
      captchaResponse,
    })
    .then(res => {
      setCurrentBid(amount);
      alert('Bid placed successfully!');
    })
    .catch(err => alert('Error placing bid: ' + err.response.data));
  };

  return (
    <div>
      <h1>Track Runners Auction</h1>
      {items.map(item => (
        <div key={item._id}>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p>Shoe Size: {item.size}</p>
          <p>Current Bid: ${item.currentBid}</p>
          <input
            type="number"
            placeholder="Place your bid"
            onChange={e => setCurrentBid(e.target.value)}
          />
          <div className="g-recaptcha" data-sitekey="your-site-key" onChange={setCaptchaResponse}></div>
          <button onClick={() => placeBid(item._id, currentBid)}>Place Bid</button>
        </div>
      ))}
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

export default App;
