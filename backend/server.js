
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Intentionally disabled for honeypot
}));

app.use(cors({
  origin: ['http://localhost:8080', 'https://your-honeypot-domain.com'],
  credentials: true
}));

// Rate limiting with intentional bypass
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Intentional vulnerability: Admin bypass
  skip: (req) => {
    return req.headers['x-admin-bypass'] === 'true' || 
           req.query.admin === 'true';
  }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/aiims_honeypot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  age: Number,
  gender: String,
  role: { type: String, default: 'patient' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
});

const SessionLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  action: { type: String, required: true, index: true },
  page: String,
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  data: mongoose.Schema.Types.Mixed,
  clientInfo: mongoose.Schema.Types.Mixed,
  fingerprint: String,
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' }
});

const SecurityIncidentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  incidentType: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: String,
  payload: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false }
});

const AppointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionId: String,
  department: String,
  doctor: String,
  preferredDate: Date,
  timeSlot: String,
  symptoms: String,
  urgency: String,
  consultationType: String,
  previousReports: String, // File path
  status: { type: String, default: 'pending' },
  bookingId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const SessionLog = mongoose.model('SessionLog', SessionLogSchema);
const SecurityIncident = mongoose.model('SecurityIncident', SecurityIncidentSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX allowed.'));
    }
  }
});

// Middleware to log all requests
app.use(async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    const clientInfo = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.method === 'POST' ? req.body : undefined,
      timestamp: new Date()
    };

    // Log the request
    await SessionLog.create({
      sessionId,
      action: 'api_request',
      page: req.url,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      data: clientInfo
    });

    // Check for potential attacks
    await detectPotentialAttacks(req, sessionId);
    
  } catch (error) {
    console.error('Logging middleware error:', error);
  }
  next();
});

// Attack detection function
async function detectPotentialAttacks(req, sessionId) {
  const suspiciousPatterns = {
    xss: /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/gi,
    sqlInjection: /(\bor\b|\band\b).*?=.*?['"]|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+.*?\s+set/gi,
    pathTraversal: /\.\.[\/\\]|\.\.%2f|\.\.%5c/gi,
    commandInjection: /[;&|`$(){}[\]]/g
  };

  const dataToCheck = JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;

  for (const [attackType, pattern] of Object.entries(suspiciousPatterns)) {
    if (pattern.test(dataToCheck)) {
      await SecurityIncident.create({
        sessionId,
        incidentType: attackType,
        severity: 'high',
        description: `Potential ${attackType} attack detected`,
        payload: { url: req.url, method: req.method, data: dataToCheck.substring(0, 1000) },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Log the attack attempt
      await SessionLog.create({
        sessionId,
        action: 'security_incident',
        data: {
          type: attackType,
          payload: dataToCheck.substring(0, 500),
          severity: 'high'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'critical'
      });
    }
  }
}

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, sessionId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await SessionLog.create({
        sessionId,
        action: 'registration_failed',
        data: { email, reason: 'User already exists' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.json({ success: false, message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      role: email.includes('admin') ? 'admin' : 'patient' // Intentional admin detection
    });

    await SessionLog.create({
      sessionId,
      action: 'user_registered',
      userId: user._id.toString(),
      data: { email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'User registered successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, sessionId } = req.body;

    // INTENTIONAL VULNERABILITY: Log password attempts for honeypot analysis
    await SessionLog.create({
      sessionId,
      action: 'login_attempt_detailed',
      data: { 
        email, 
        passwordLength: password.length,
        passwordPattern: password.replace(/./g, '*'),
        // Store first 3 chars for pattern analysis (INTENTIONALLY INSECURE)
        passwordHint: password.substring(0, 3) + '*'.repeat(password.length - 3)
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Track failed login attempts for brute force detection
      await SessionLog.create({
        sessionId,
        action: 'login_failed',
        userId: user._id.toString(),
        data: { email, reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'medium'
      });

      return res.json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        role: user.role,
        name: user.name,
        sessionId 
      },
      process.env.JWT_SECRET || 'honeypot-secret-key',
      { expiresIn: '24h' }
    );

    await SessionLog.create({
      sessionId,
      action: 'login_successful',
      userId: user._id.toString(),
      data: { email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Activity Logging Route
app.post('/api/logging/activity', async (req, res) => {
  try {
    const activityData = req.body;
    
    await SessionLog.create({
      sessionId: activityData.sessionId,
      userId: activityData.userId,
      action: activityData.action,
      page: activityData.page,
      timestamp: new Date(activityData.timestamp),
      ipAddress: req.ip,
      userAgent: activityData.clientInfo?.userAgent || req.headers['user-agent'],
      referrer: activityData.clientInfo?.referrer,
      data: activityData,
      fingerprint: activityData.fingerprint,
      severity: activityData.data?.severity || 'low'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Activity logging error:', error);
    res.status(500).json({ success: false });
  }
});

// VULNERABLE ADMIN ROUTES (Intentional honeypot vulnerabilities)

// Admin Stats Route - VULNERABLE TO SQL INJECTION
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Basic auth check
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'honeypot-secret-key');
    
    const stats = {
      totalUsers: await User.countDocuments(),
      totalBookings: await Appointment.countDocuments(),
      activeSessions: await SessionLog.distinct('sessionId', { 
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }).then(sessions => sessions.length),
      suspiciousActivities: await SecurityIncident.countDocuments({ resolved: false })
    };

    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// VULNERABLE SEARCH ENDPOINT - XSS VULNERABILITY
app.get('/api/admin/search', async (req, res) => {
  try {
    const { q, vulnerable } = req.query;
    
    // Track search query
    await SessionLog.create({
      sessionId: req.headers['x-session-id'],
      action: 'admin_search_query',
      data: { query: q, vulnerable: vulnerable === 'true' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      severity: q.includes('<script>') || q.includes('javascript:') ? 'critical' : 'low'
    });

    // INTENTIONAL XSS VULNERABILITY
    if (vulnerable === 'true') {
      const unsafeHTML = `
        <div class="search-results">
          <h3>Search Results for: ${q}</h3>
          <p>Query executed: ${q}</p>
          <div class="results">
            ${q.includes('<script>') ? q : `<p>No results found for "${q}"</p>`}
          </div>
        </div>
      `;
      
      return res.json({ html: unsafeHTML });
    }

    // Safe search (normal case)
    const sanitizedQuery = q.replace(/[<>]/g, '');
    res.json({ 
      html: `<div>Safe search results for: ${sanitizedQuery}</div>`,
      query: sanitizedQuery 
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// VULNERABLE USER LOOKUP - SQL INJECTION SIMULATION
app.get('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { direct_sql } = req.query;

    // Track user lookup
    await SessionLog.create({
      sessionId: req.headers['x-session-id'],
      action: 'admin_user_lookup',
      data: { 
        userId, 
        directSql: direct_sql === 'true',
        potentialSqlInjection: userId.includes("'") || userId.includes(';') || userId.includes('--')
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      severity: userId.includes("'") || userId.includes(';') ? 'critical' : 'low'
    });

    // INTENTIONAL SQL INJECTION VULNERABILITY SIMULATION
    if (direct_sql === 'true') {
      // Log potential SQL injection attempt
      if (userId.includes("'") || userId.includes(';') || userId.includes('--')) {
        await SecurityIncident.create({
          sessionId: req.headers['x-session-id'],
          incidentType: 'sql_injection',
          severity: 'critical',
          description: 'SQL injection attempt in user lookup',
          payload: { userId, query: `SELECT * FROM users WHERE id = '${userId}'` },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        // Simulate SQL error response
        return res.status(500).json({ 
          error: 'Database error', 
          sqlError: `You have an error in your SQL syntax near '${userId}'`,
          query: `SELECT * FROM users WHERE id = '${userId}'`
        });
      }
    }

    // Normal user lookup
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('User lookup error:', error);
    res.status(500).json({ error: 'User lookup failed' });
  }
});

// Get logs for admin dashboard
app.get('/api/admin/logs', async (req, res) => {
  try {
    const { limit = 50, severity, action } = req.query;
    
    const filter = {};
    if (severity) filter.severity = severity;
    if (action) filter.action = new RegExp(action, 'i');

    const logs = await SessionLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json(logs);
  } catch (error) {
    console.error('Logs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Export logs functionality
app.get('/api/admin/export-logs', async (req, res) => {
  try {
    const logs = await SessionLog.find()
      .sort({ timestamp: -1 })
      .limit(10000) // Limit for performance
      .lean();

    // Convert to CSV
    const csvHeader = 'Timestamp,Session ID,User ID,Action,Page,IP Address,User Agent,Severity,Data\n';
    const csvData = logs.map(log => {
      return [
        log.timestamp,
        log.sessionId,
        log.userId || '',
        log.action,
        log.page || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.severity,
        JSON.stringify(log.data || {}).replace(/"/g, '""')
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=security_logs.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Appointment booking route
app.post('/api/appointments/book', upload.single('previousReports'), async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      department,
      doctor,
      preferredDate,
      timeSlot,
      symptoms,
      urgency,
      consultationType
    } = req.body;

    const bookingId = `AIIMS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const appointment = await Appointment.create({
      userId,
      sessionId,
      department,
      doctor,
      preferredDate: new Date(preferredDate),
      timeSlot,
      symptoms,
      urgency,
      consultationType,
      previousReports: req.file ? req.file.path : null,
      bookingId,
      status: 'confirmed'
    });

    // Log appointment booking
    await SessionLog.create({
      sessionId,
      action: 'appointment_booked',
      userId,
      data: {
        bookingId,
        department,
        doctor,
        urgency,
        hasReports: !!req.file
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      bookingId,
      message: 'Appointment booked successfully',
      appointment: {
        bookingId,
        department,
        preferredDate,
        timeSlot,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// Doctors route
app.get('/api/doctors', async (req, res) => {
  try {
    // Mock doctors data
    const doctors = [
      { id: '1', name: 'Rajesh Kumar', specialization: 'Cardiology', experience: '15 years' },
      { id: '2', name: 'Priya Sharma', specialization: 'Neurology', experience: '12 years' },
      { id: '3', name: 'Amit Singh', specialization: 'Orthopedics', experience: '18 years' },
      { id: '4', name: 'Sunita Gupta', specialization: 'Pediatrics', experience: '10 years' }
    ];

    res.json(doctors);
  } catch (error) {
    console.error('Doctors fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Time slots route
app.get('/api/appointments/slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    // Mock time slots
    const timeSlots = [
      { time: '09:00 AM', available: true },
      { time: '10:00 AM', available: true },
      { time: '11:00 AM', available: false },
      { time: '02:00 PM', available: true },
      { time: '03:00 PM', available: true },
      { time: '04:00 PM', available: true }
    ];

    res.json(timeSlots);
  } catch (error) {
    console.error('Time slots fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Log the error
  SessionLog.create({
    sessionId: req.headers['x-session-id'] || 'unknown',
    action: 'server_error',
    data: {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    severity: 'high'
  }).catch(console.error);

  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', async (req, res) => {
  await SessionLog.create({
    sessionId: req.headers['x-session-id'] || 'unknown',
    action: '404_not_found',
    page: req.originalUrl,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    severity: 'low'
  }).catch(console.error);

  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AIIMS Honeypot Server running on port ${PORT}`);
  console.log(`📊 MongoDB connected to aiims_honeypot database`);
  console.log(`🔒 Security monitoring active`);
  console.log(`🕵️  All activities are being logged for analysis`);
});

module.exports = app;
