import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, User, Mail, CreditCard, DollarSign, Hash } from 'lucide-react';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let data = location.state?.paymentData;
    if (!data) {
      const stored = localStorage.getItem('lastPaymentData');
      if (stored) data = JSON.parse(stored);
    }
    if (!data || (!data.firstName && !data.billingDetails?.firstName) || (!data.email && !data.billingDetails?.email) || !data.cardNumber) {
      setPaymentData(null);
    } else {
      // Normalize data structure for display
      const normalizedData = {
        ...data,
        firstName: data.firstName || data.billingDetails?.firstName,
        lastName: data.lastName || data.billingDetails?.lastName,
        email: data.email || data.billingDetails?.email
      };
      setPaymentData(normalizedData);
    }
    setTimeout(() => setShow(true), 200); // fade-in
  }, [location.state]);

  const handleDownloadReceipt = () => {
    if (!paymentData) return;
    const receipt = `Payment Receipt\n====================\nCustomer: ${paymentData.firstName} ${paymentData.lastName}\nEmail: ${paymentData.email}\nCard: **** **** **** ${paymentData.cardNumber.slice(-4)}\nAmount: ₹${paymentData.amount}\nTransaction ID: ${paymentData.paymentId}\n`;
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentData.paymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} max-w-md w-full mx-auto p-6 bg-white rounded-2xl shadow-2xl border border-green-100`}>  
        <div className="flex flex-col items-center">
          {/* Animated Success Icon */}
          <div className="mb-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-60"></div>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-2 text-center">Payment Successful!</h1>
          <p className="text-lg text-gray-700 mb-6 text-center">Thank you for your purchase, <span className="font-semibold">{paymentData.firstName}!</span></p>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="py-4 flex items-center gap-3">
            <User className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-700">Customer:</span>
            <span className="ml-auto text-gray-900">{paymentData.firstName} {paymentData.lastName}</span>
          </div>
          <div className="py-4 flex items-center gap-3">
            <Mail className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-gray-700">Email:</span>
            <span className="ml-auto text-gray-900">{paymentData.email}</span>
          </div>
          <div className="py-4 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-gray-700">Card:</span>
            <span className="ml-auto text-gray-900">**** **** **** {paymentData.cardNumber.slice(-4)}</span>
          </div>
          <div className="py-4 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-700">Amount:</span>
            <span className="ml-auto text-green-700 font-bold">₹{paymentData.amount}</span>
          </div>
          <div className="py-4 flex items-center gap-3">
            <Hash className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-gray-700">Transaction ID:</span>
            <span className="ml-auto font-mono text-gray-800">{paymentData.paymentId}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 mt-8">
          <button
            onClick={handleDownloadReceipt}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Download Receipt
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;