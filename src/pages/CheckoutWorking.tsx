import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';

const CheckoutWorking = () => {
  const [searchParams] = useSearchParams();
  const planName = searchParams.get('plan') || 'Complete';
  const billing = searchParams.get('billing') || 'yearly';
  const customAmount = searchParams.get('amount');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    country: '',
    companyName: ''
  });

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const [currentStep, setCurrentStep] = useState<'account' | 'payment' | 'otp' | 'success'>('account');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field: string, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.country || !agreeTerms) {
      alert('Please fill all required fields and agree to terms');
      return;
    }
    setCurrentStep('payment');
  };

  const handlePayment = () => {
    if (!cardData.cardNumber || !cardData.cardName || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv) {
      alert('Please fill all card details');
      return;
    }
    setCurrentStep('otp');
  };

  const handleOtpSubmit = () => {
    setCurrentStep('success');
  };

  const displayPrice = customAmount ? `$${customAmount}` : billing === 'yearly' ? '$299/year' : '$29/month';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white mb-4 text-sm">
              <ArrowLeft size={16} />
              Back to pricing
            </Link>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-slate-400">Plan: {planName} • {billing} • {displayPrice}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${currentStep === 'account' ? 'text-blue-400' : 'text-green-400'}`}>
              <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-slate-900 font-bold">1</div>
              <span className="ml-2">Account</span>
            </div>
            <div className="w-16 h-px bg-slate-600 mx-4"></div>
            <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-400' : currentStep === 'otp' || currentStep === 'success' ? 'text-green-400' : 'text-slate-500'}`}>
              <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-slate-900 font-bold">2</div>
              <span className="ml-2">Payment</span>
            </div>
            <div className="w-16 h-px bg-slate-600 mx-4"></div>
            <div className={`flex items-center ${currentStep === 'otp' ? 'text-blue-400' : currentStep === 'success' ? 'text-green-400' : 'text-slate-500'}`}>
              <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-slate-900 font-bold">3</div>
              <span className="ml-2">Verify</span>
            </div>
          </div>

          {/* Account Details Step */}
          {currentStep === 'account' && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Account Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Country *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">I agree to the Terms of Service and Privacy Policy *</span>
                </label>
              </div>
              
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Card Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardData.cardNumber}
                      onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                      className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 pl-12"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                    <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Cardholder Name *</label>
                  <input
                    type="text"
                    value={cardData.cardName}
                    onChange={(e) => handleCardChange('cardName', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Month *</label>
                  <select
                    value={cardData.expiryMonth}
                    onChange={(e) => handleCardChange('expiryMonth', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                  >
                    <option value="">Month</option>
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={String(i+1).padStart(2, '0')}>
                        {String(i+1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Year *</label>
                  <select
                    value={cardData.expiryYear}
                    onChange={(e) => handleCardChange('expiryYear', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                  >
                    <option value="">Year</option>
                    {Array.from({length: 10}, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">CVV *</label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => handleCardChange('cvv', e.target.value)}
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('account')}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Proceed to Verification
                </button>
              </div>
            </div>
          )}

          {/* OTP Step */}
          {currentStep === 'otp' && (
            <div className="bg-slate-800 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-6">OTP Verification</h2>
              <p className="text-slate-400 mb-6">Enter the OTP sent to your mobile number</p>
              
              <div className="flex justify-center gap-2 mb-6">
                {Array.from({length: 6}).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-bold bg-slate-700 border border-slate-600 rounded focus:border-blue-500"
                  />
                ))}
              </div>
              
              <button
                onClick={handleOtpSubmit}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors mb-4"
              >
                Verify & Complete Purchase
              </button>
              
              <button
                onClick={() => setCurrentStep('payment')}
                className="text-slate-400 hover:text-white"
              >
                Back to Payment
              </button>
            </div>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <div className="bg-slate-800 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">Payment Successful!</h2>
              <p className="text-slate-400 mb-6">Your subscription to {planName} has been activated.</p>
              <Link
                to="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutWorking;
