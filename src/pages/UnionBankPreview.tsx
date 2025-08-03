import React, { useState } from 'react';
import UnionBankOTPPage from '@/components/UnionBankOTPPage';

const UnionBankPreview = () => {
  // Mock data for preview
  const [otpValue, setOtpValue] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');

  const mockCardData = {
    cardNumber: '6083 3212 3456 6539',
    cardName: 'JOHN DOE',
    expiryMonth: '12',
    expiryYear: '27',
    cvv: '123'
  };

  const mockBillingDetails = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India'
  };

  const handleOtpSubmit = (otp: string) => {
    console.log('OTP Submitted:', otp);
    setOtpSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setOtpSubmitting(false);
      // Simulate validation
      if (otp === '123456') {
        alert('OTP Verified Successfully!');
        setOtpError('');
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    }, 2000);
  };

  const handleCancel = () => {
    console.log('OTP verification cancelled');
    alert('OTP verification cancelled');
  };

  const handleResendOtp = () => {
    console.log('Resending OTP...');
    setOtpError('');
    alert('New OTP sent successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Union Bank OTP Preview</h1>
          <p className="text-gray-600 text-sm">
            Test the Union Bank OTP page interface
          </p>
          <div className="text-xs text-gray-500 mt-2">
            <p>Try OTP: 123456 (will succeed)</p>
            <p>Any other OTP will show error</p>
          </div>
        </div>
        
        <UnionBankOTPPage
          cardData={mockCardData}
          billingDetails={mockBillingDetails}
          amount={30000.00}
          onOtpSubmit={handleOtpSubmit}
          onCancel={handleCancel}
          onResendOtp={handleResendOtp}
          otpSubmitting={otpSubmitting}
          otpError={otpError}
        />
      </div>
    </div>
  );
};

export default UnionBankPreview;
