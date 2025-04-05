import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const PaymentForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      setIsProcessing(false);
      alert(error.message);
      return;
    }

    const paymentIntentResponse = await axios.post('http://localhost:3000/pay', {
      paymentMethodId: paymentMethod.id,
      bidId: 'the-winning-bid-id', // Placeholder
    });

    if (paymentIntentResponse.status === 200) {
      alert('Payment successful');
    } else {
      alert('Payment failed');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={isProcessing}>Submit Payment</button>
    </form>
  );
};

export default PaymentForm;
