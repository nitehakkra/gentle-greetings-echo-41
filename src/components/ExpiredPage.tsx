import React from 'react';
import { AlertTriangle, Clock, Shield } from 'lucide-react';

const ExpiredPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Main Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Link Expired
        </h1>
        
        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
          Sorry, this payment link has expired. Please contact the merchant to obtain a new payment link.
        </p>

        {/* Features for Trust */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Payment links expire after 24 hours for security</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Your data is protected and secure</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Need help? Contact the merchant for assistance
          </p>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Footer Trust Elements */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>🔒 SSL Secured</span>
            <span>•</span>
            <span>🛡️ Data Protected</span>
            <span>•</span>
            <span>⚡ 24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiredPage;
