import React from 'react';
import PayULoadingSpinner from '@/components/PayULoadingSpinner';

const SpinnerPreview = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">PayU Loading Spinner</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Default Size (60px)</h2>
          <div className="flex justify-center">
            <PayULoadingSpinner />
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Large (100px)</h2>
          <div className="flex justify-center">
            <PayULoadingSpinner size={100} />
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Small (40px)</h2>
          <div className="flex justify-center">
            <PayULoadingSpinner size={40} />
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Usage:</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
            {`import PayULoadingSpinner from '@/components/PayULoadingSpinner';

// Default size (60px)
<PayULoadingSpinner />

// Custom size
<PayULoadingSpinner size={80} />`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SpinnerPreview;
