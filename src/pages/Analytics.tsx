import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center text-gray-400 hover:text-white mb-2 transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Admin Panel
            </button>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Analytics functionality temporarily disabled for maintenance</p>
          </div>
        </header>
        
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Analytics Under Maintenance</h2>
          <p className="text-gray-400 mb-4">
            The analytics dashboard is currently being updated. Please check back later.
          </p>
          <button 
            onClick={() => navigate('/admin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Return to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
