import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const { hash } = useParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      console.log('🚀 SUCCESS PAGE - Fetching REAL data for hash:', hash);
      
      let realData = null;
      
      // Method 1: Try API first
      if (hash) {
        try {
          const response = await fetch(`/api/success-payment/${hash}`);
          if (response.ok) {
            realData = await response.json();
            console.log('✅ GOT REAL API DATA:', realData);
          }
        } catch (error) {
          console.log('⚠️ API failed, trying localStorage');
        }
      }
      
      // Method 2: Try localStorage
      if (!realData) {
        const savedData = localStorage.getItem('userCheckoutData') || localStorage.getItem('lastPaymentData');
        if (savedData) {
          try {
            realData = JSON.parse(savedData);
            console.log('✅ GOT REAL LOCALSTORAGE DATA:', realData);
          } catch (e) {
            console.log('❌ LocalStorage parse failed');
          }
        }
      }
      
      // Set the real data or fallback
      if (realData) {
        setPaymentData({
          firstName: realData.firstName || realData.cardName?.split(' ')[0] || 'Customer',
          lastName: realData.lastName || realData.cardName?.split(' ')[1] || 'User',
          email: realData.email || 'customer@example.com',
          amount: realData.amount || 299,
          currency: realData.currency || 'INR',
          cardNumber: realData.cardNumber || '****1234'
        });
        console.log('✅ USING REAL TRANSACTION DATA!');
      } else {
        // Only use fallback if no real data found
        setPaymentData({
          firstName: 'Customer',
          lastName: 'User',
          email: 'customer@example.com',
          amount: 299,
          currency: 'INR',
          cardNumber: '****1234'
        });
        console.log('🔄 Using fallback data - no real data found');
      }
      
      setLoading(false);
    };
    
    fetchRealData();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ', ' + currentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const currencySymbol = paymentData?.currency === 'USD' ? '$' : '₹';
  const amount = paymentData?.amount || 299;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-1">You are paying</p>
          <img 
            src="https://www.pluralsight.com/content/dam/pluralsight2/general/logo/PS_New_logo_F-01.png" 
            alt="Pluralsight" 
            className="h-8 object-contain"
          />
        </div>

        {/* Amount Section */}
        <div className="px-6 py-6 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Payment amount</p>
          <p className="text-3xl font-bold text-green-600">{currencySymbol} {amount}.00</p>
        </div>

        {/* Success Message */}
        <div className="px-6 py-6 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-green-600 mb-2">Card payment received!</h2>
          <p className="text-sm text-gray-600">An automated receipt will be sent to your email. You may now close this window.</p>
        </div>

        {/* Payment Details */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment date</span>
            <span className="text-gray-900">{formattedDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment method</span>
            <span className="text-gray-900">Card</span>
          </div>
        </div>

        {/* Payment For Section */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-2">Payment for</p>
          <p className="text-sm text-gray-600">Payment</p>
        </div>

        {/* Items Table */}
        <div className="px-6 py-4">
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600 font-medium">ITEM NAME</th>
                  <th className="text-center py-2 text-gray-600 font-medium">QTY</th>
                  <th className="text-right py-2 text-gray-600 font-medium">PRICE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 text-gray-900">Payment</td>
                  <td className="py-3 text-center text-gray-900">1</td>
                  <td className="py-3 text-right text-gray-900">{currencySymbol} {amount}.00</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1 text-xs text-gray-500">{currencySymbol} {amount}.00 / Unit</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
            <span className="text-base font-medium text-gray-900">Total:</span>
            <span className="text-lg font-bold text-gray-900">{currencySymbol} {amount}.00</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-medium">Checkout</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
