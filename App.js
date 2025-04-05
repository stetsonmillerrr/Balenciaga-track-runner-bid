import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [items, setItems] = useState([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [userId, setUserId] = useState('user123'); // Example User ID

  useEffect(() => {
    axios.get('http://localhost:3000/items')
      .then(res => setItems(res.data))
      .catch(err => console.log(err));
  }, []);

  const handleCaptchaClick = () => {
    setCaptchaVerified(true);
    alert("You have successfully verified!");
  };

  const placeBid = (itemId, amount) => {
    if (!captchaVerified) {
      alert('Please verify you are not a bot first.');
      return;
    }

    axios.post('http://localhost:3000/placeBid', {
      userId,
      itemId,
      amount,
    })
    .then(res => alert('Bid placed successfully!'))
    .catch(err => alert('Error placing bid: ' + err.response.data));
  };

  return (
    <div className="App">
      <h1>Track Runners Auction</h1>
      {items.map(item => (
        <div key={item._id} className="item-card">
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p>Shoe Size: {item.size}</p>
          <p>Current Bid: ${item.currentBid}</p>
          <input
            type="number"
            placeholder="Place your bid"
            onChange={(e) => setCurrentBid(e.target.value)}
          />
          <button onClick={handleCaptchaClick}>
            Verify You Are Not a Bot
          </button>
          <button onClick={() => placeBid(item._id, currentBid)} disabled={!captchaVerified}>
            Place Bid
          </button>
        </div>
      ))}
    </div>
  );
};

export default App;
