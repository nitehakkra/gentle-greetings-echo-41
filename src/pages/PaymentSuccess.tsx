import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
  const location = useLocation();
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    let data = location.state?.paymentData;
    if (!data) {
      const stored = localStorage.getItem('lastPaymentData');
      if (stored) data = JSON.parse(stored);
    }
    if (!data || !data.firstName || !data.email || !data.cardNumber) {
      setPaymentData(null);
    } else {
      setPaymentData(data);
    }
  }, [location.state]);

  if (paymentData === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-700">Payment details not found. Please complete checkout again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="mb-6 text-gray-700">Thank you for your purchase, {paymentData.firstName}!</p>
        <div className="space-y-2 text-left">
          <div><span className="font-semibold">Customer:</span> {paymentData.firstName} {paymentData.lastName}</div>
          <div><span className="font-semibold">Email:</span> {paymentData.email}</div>
          <div><span className="font-semibold">Card:</span> **** **** **** {paymentData.cardNumber.slice(-4)}</div>
          <div><span className="font-semibold">Amount:</span> ₹{paymentData.amount}</div>
          <div><span className="font-semibold">Transaction ID:</span> {paymentData.paymentId}</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;