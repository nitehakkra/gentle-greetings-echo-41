import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Home, Copy, Clock, CreditCard, User, Mail, Calendar, DollarSign, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showFeedbackConfirmation, setShowFeedbackConfirmation] = useState(false);

  // Use paymentData from location.state if available
  const paymentData = location.state?.paymentData || {};
  
  // Function to detect card type
  const getCardType = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.match(/^5[1-5]/)) return 'Mastercard';
    if (cleaned.match(/^6(?:011|5)/)) return 'Discover';
    if (cleaned.match(/^6/)) return 'RuPay';
    return 'Visa';
  };

  // Get actual last 4 digits from card number
  const getLast4Digits = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.slice(-4);
  };

  const paymentDetails = {
    amount: paymentData.amount || '28,750',
    planName: paymentData.planName || 'Complete Plan',
    transactionId: paymentData.paymentId || 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    customerName: paymentData.firstName && paymentData.lastName ? `${paymentData.firstName} ${paymentData.lastName}` : 
                  paymentData.firstName ? paymentData.firstName : 
                  paymentData.lastName ? paymentData.lastName : 'Customer',
    email: paymentData.email || 'customer@example.com',
    cardNumber: paymentData.cardNumber || '1234 5678 9012 3456',
    cardType: getCardType(paymentData.cardNumber || '1234 5678 9012 3456'),
    last4Digits: getLast4Digits(paymentData.cardNumber || '1234 5678 9012 3456'),
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    time: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };

  // Loading animation effect
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setShowLoading(false);
            setTimeout(() => setShowContent(true), 500);
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const handleDownloadReceipt = () => {
    const receiptText = `
PAYMENT RECEIPT
===============

Transaction ID: ${paymentDetails.transactionId}
Date: ${paymentDetails.date} at ${paymentDetails.time}
Customer: ${paymentDetails.customerName}
Email: ${paymentDetails.email}
Plan: ${paymentDetails.planName}
Amount: ₹${paymentDetails.amount}
Payment Method: ${paymentDetails.cardType} ending in ${paymentDetails.last4Digits}
Status: SUCCESS

Thank you for your purchase!
    `;
    
    const element = document.createElement('a');
    const file = new Blob([receiptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${paymentDetails.transactionId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleShareFeedback = () => {
    if (rating > 0) {
      setShowFeedbackConfirmation(true);
      setTimeout(() => setShowFeedbackConfirmation(false), 3000);
    }
  };

  if (showLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          {/* Animated Success Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(34, 197, 94, 0.2)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - loadingProgress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
            </svg>
          </div>
          
          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4 animate-pulse">
            Processing Your Payment...
          </h2>
          <p className="text-gray-600 mb-6">
            Securing your transaction with bank-grade encryption
          </p>
          
          {/* Progress Bar */}
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mb-4">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-500">
            {loadingProgress}% Complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Loading Overlay with Blur */}
      {!showContent && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-800">Payment Successful!</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header with Brand */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
                          <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://www.pluralsight.com/content/dam/pluralsight2/general/logo/PS_New_logo_F-01.png" 
                    alt="PluralSight" 
                    className="h-8 w-auto"
                  />
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">SSL Secured</span>
                </div>
              </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Thank you for your purchase, {paymentDetails.customerName.split(' ')[0]}!
            </p>
            <p className="text-gray-500">
              Your payment has been securely processed and your order is confirmed.
            </p>
          </div>

          {/* Transaction Confirmation Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Transaction Complete!</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-600">Amount Paid</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">₹{paymentDetails.amount}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-gray-600">Payment Method</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {paymentDetails.cardType} ending in {paymentDetails.last4Digits}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-gray-600">Date & Time</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">{paymentDetails.date}</div>
                    <div className="text-sm text-gray-500">{paymentDetails.time} (UTC)</div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-600">Customer</span>
                  </div>
                  <span className="font-medium text-gray-800">{paymentDetails.customerName}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-600">Email</span>
                  </div>
                  <span className="font-medium text-gray-800">{paymentDetails.email}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-gray-600">Transaction ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-800">#{paymentDetails.transactionId}</span>
                    <button
                      onClick={() => copyToClipboard(paymentDetails.transactionId)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Order Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AI</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{paymentDetails.planName}</h4>
                    <p className="text-sm text-gray-500">Advanced Technology Package</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">₹{paymentDetails.amount}</div>
                  <div className="text-sm text-gray-500">One-time payment</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">₹{paymentDetails.amount}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-800">₹0.00</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-green-600">₹{paymentDetails.amount}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">What's Next?</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <Home className="h-4 w-4" />
                Continue Shopping
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
                onClick={() => window.open('https://www.pluralsight.com/contact', '_blank')}
              >
                <MessageCircle className="h-4 w-4" />
                Get Support
              </Button>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">How was your experience?</h3>
              <p className="text-gray-600 mb-6">We'd love to hear your feedback!</p>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              
              <Button
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={handleShareFeedback}
                disabled={rating === 0}
              >
                Share Your Feedback
              </Button>

              {/* Feedback Confirmation */}
              {showFeedbackConfirmation && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Thank you for your {rating}-star feedback! Your response has been recorded.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>support@pluralcheckout.com</p>
                  <p>+1-801-784-9007</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Legal</h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <button 
                    onClick={() => window.open('https://legal.pluralsight.com/policies?name=privacy-notice', '_blank')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <br />
                  <button 
                    onClick={() => window.open('https://legal.pluralsight.com/policies', '_blank')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Support</h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <button 
                    onClick={() => window.open('https://www.pluralsight.com/contact', '_blank')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Help Center
                  </button>
                  <br />
                  <button 
                    onClick={() => window.open('https://www.pluralsight.com/contact', '_blank')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Trust</h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Over 10,000+ happy customers</p>
                  <p>99.9% uptime guarantee</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                © 2025 PluralSight. All rights reserved. | Secured by industry-leading encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;