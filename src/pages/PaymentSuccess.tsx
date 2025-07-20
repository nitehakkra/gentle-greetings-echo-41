
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Home, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get actual payment details from location state
  const paymentDetails = location.state?.paymentDetails;
  
  // If no payment details, redirect to home
  if (!paymentDetails) {
    navigate('/');
    return null;
  }

  const handleDownloadReceipt = () => {
    // Create a detailed receipt with actual transaction data
    const receiptText = `
PAYMENT RECEIPT
===============

Transaction ID: ${paymentDetails.transactionId}
Date: ${paymentDetails.date}
Customer: ${paymentDetails.customerName}
Email: ${paymentDetails.email}
Plan: ${paymentDetails.planName}
Payment Method: ${paymentDetails.paymentMethod || 'Credit Card ending in 3456'}
Amount: ₹${paymentDetails.amount}
Status: SUCCESS

Thank you for your purchase!

XAI LLC
${new Date().toISOString()}
    `;
    
    const element = document.createElement('a');
    const file = new Blob([receiptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${paymentDetails.transactionId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Receipt Downloaded",
      description: "Your payment receipt has been downloaded successfully",
    });
  };

  const copyTransactionId = () => {
    navigator.clipboard.writeText(paymentDetails.transactionId);
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Thank you for your purchase, {paymentDetails.customerName}!</h1>
          <p className="text-gray-600">Your payment has been securely processed and your order is confirmed.</p>
        </div>

        {/* Transaction Complete Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800">Transaction Complete!</h2>
          </div>
          
          {/* Payment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Amount Paid */}
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Amount Paid</div>
              <div className="text-3xl font-bold text-green-600">₹{paymentDetails.amount}</div>
            </div>
            
            {/* Customer Info */}
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Customer</div>
              <div className="text-xl font-semibold text-gray-800">{paymentDetails.customerName}</div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium text-gray-800">{paymentDetails.planName}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-800">{paymentDetails.email}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-800">Credit Card ending in 3456</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium text-gray-800">{paymentDetails.date}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
              <span className="text-gray-600">Transaction ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-gray-800">{paymentDetails.transactionId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyTransactionId}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="bg-green-100 border border-green-300 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Payment Confirmed</h3>
              <p className="text-green-700 text-sm mb-2">
                Your payment has been processed successfully. A confirmation email has been sent to <strong>{paymentDetails.email}</strong>
              </p>
              <p className="text-green-700 text-sm">
                Please save your transaction ID <strong>{paymentDetails.transactionId}</strong> for your records.
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
