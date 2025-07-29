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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Globe, 
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';

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

interface AnalyticsProps {
  socket: any;
  globalCurrency: string;
  exchangeRate: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ socket, globalCurrency, exchangeRate }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch initial analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Listen for real-time analytics updates
  useEffect(() => {
    if (!socket) return;

    const handleAnalyticsInitial = (data: AnalyticsData) => {
      setAnalyticsData(data);
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    const handleAnalyticsUpdate = (data: AnalyticsData) => {
      setAnalyticsData(data);
      setLastUpdated(new Date());
    };

    socket.on('analytics-initial', handleAnalyticsInitial);
    socket.on('analytics-update', handleAnalyticsUpdate);

    return () => {
      socket.off('analytics-initial', handleAnalyticsInitial);
      socket.off('analytics-update', handleAnalyticsUpdate);
    };
  }, [socket]);

  // Format currency value
  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || globalCurrency;
    if (curr === 'USD') {
      return `$${(amount / exchangeRate).toFixed(2)}`;
    }
    return `₹${amount.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Refresh analytics manually
  const refreshAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics');
      const result = await response.json();
      if (result.success) {
        setAnalyticsData(result.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export analytics data
  const exportData = () => {
    if (!analyticsData) return;
    
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">📊 Payment Analytics</h2>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">📊 Payment Analytics</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No analytics data available</p>
            <Button onClick={refreshAnalytics} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const dailyRevenueData = {
    labels: analyticsData.trends.daily.map(d => 
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData.trends.daily.map(d => d.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const hourlyPaymentsData = {
    labels: analyticsData.trends.hourly.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Payments',
        data: analyticsData.trends.hourly.map(h => h.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const currencyData = {
    labels: Object.keys(analyticsData.breakdown.currency),
    datasets: [
      {
        data: Object.values(analyticsData.breakdown.currency).map(c => c.revenue),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const countryData = {
    labels: Object.keys(analyticsData.breakdown.country).slice(0, 5),
    datasets: [
      {
        data: Object.values(analyticsData.breakdown.country).slice(0, 5).map(c => c.count),
        backgroundColor: [
          '#06B6D4',
          '#84CC16',
          '#F97316',
          '#EC4899',
          '#6366F1',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📊 Payment Analytics</h2>
        <div className="flex gap-2">
          <Button onClick={refreshAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.overview.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.totalPayments} payments
            </p>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.overview.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.todayPayments} payments
            </p>
          </CardContent>
        </Card>

        {/* Month Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Growth</CardTitle>
            {analyticsData.overview.monthGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              analyticsData.overview.monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(analyticsData.overview.monthGrowth)}
            </div>
            <p className="text-xs text-muted-foreground">
              vs last month
            </p>
          </CardContent>
        </Card>

        {/* Average Payment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.overview.avgPaymentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Daily Revenue Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={dailyRevenueData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Hourly Payment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>⏰ Hourly Payment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={hourlyPaymentsData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>💱 Revenue by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={currencyData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Country Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>🌍 Payments by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={countryData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">Peak Hour</p>
              <p className="text-lg font-bold">{analyticsData.insights.peakHour}:00</p>
              <p className="text-sm text-gray-600">
                {formatCurrency(analyticsData.insights.peakHourRevenue)} revenue
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Globe className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">Top Country</p>
              <p className="text-lg font-bold">{analyticsData.insights.topCountry}</p>
              <p className="text-sm text-gray-600">highest revenue</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold">Top Currency</p>
              <p className="text-lg font-bold">{analyticsData.insights.topCurrency}</p>
              <p className="text-sm text-gray-600">most used</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="font-semibold">This Week</p>
              <p className="text-lg font-bold">{analyticsData.overview.weekPayments}</p>
              <p className="text-sm text-gray-600">
                {formatCurrency(analyticsData.overview.weekRevenue)} revenue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
