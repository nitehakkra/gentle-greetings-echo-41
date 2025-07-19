import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Use paymentData from location.state if available
  const paymentData = location.state?.paymentData || {};
  const paymentDetails = {
    amount: paymentData.amount || '28,750',
    planName: paymentData.planName || 'Complete Plan',
    transactionId: paymentData.transactionId || 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    customerName: paymentData.firstName ? `${paymentData.firstName} ${paymentData.lastName}` : 'Customer',
    email: paymentData.email || 'customer@example.com',
    date: paymentData.timestamp ? new Date(paymentData.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  const handleDownloadReceipt = () => {
    // Create a simple receipt text
    const receiptText = `
PAYMENT RECEIPT
===============

Transaction ID: ${paymentDetails.transactionId}
Date: ${paymentDetails.date}
Customer: ${paymentDetails.customerName}
Email: ${paymentDetails.email}
Plan: ${paymentDetails.planName}
Amount: ₹${paymentDetails.amount}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your transaction has been completed successfully</p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Transaction Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono font-semibold text-gray-800">{paymentDetails.transactionId}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Date</span>
              <span className="font-medium text-gray-800">{paymentDetails.date}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium text-gray-800">{paymentDetails.planName}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium text-gray-800">{paymentDetails.customerName}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-800">{paymentDetails.email}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
              <span className="text-gray-600 font-medium">Amount Paid</span>
              <span className="text-2xl font-bold text-green-600">₹{paymentDetails.amount}</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-100 border border-green-300 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Payment Completed</h3>
              <p className="text-green-700 text-sm">
                Your payment has been processed successfully. A confirmation email has been sent to {paymentDetails.email}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownloadReceipt}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;