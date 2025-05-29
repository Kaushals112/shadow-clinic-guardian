
# AIIMS Hospital Honeypot System

A sophisticated honeypot designed to mimic the All India Institute of Medical Sciences (AIIMS) hospital website with comprehensive security monitoring and intentional vulnerabilities for cybersecurity research.

## 🎯 Project Overview

This honeypot system creates a legitimate-looking hospital website that attracts and monitors potential cyber attacks. It includes:

- **Frontend**: Professional React-based hospital website
- **Backend**: Express.js server with MongoDB logging
- **Security Features**: Comprehensive session tracking and attack detection
- **Intentional Vulnerabilities**: Carefully placed security flaws for research
- **Admin Panel**: Real-time monitoring and analysis dashboard

## 🚀 Features

### Core Functionality
- ✅ User authentication (login/register/logout)
- ✅ Google OAuth integration
- ✅ JWT token-based sessions
- ✅ Medical appointment booking system
- ✅ File upload for medical reports
- ✅ Admin panel for user and booking management

### Security Monitoring
- 📊 **Session Tracking**: Every user interaction is logged with session IDs
- 🌐 **IP Address Logging**: Track user locations and patterns
- 🔍 **Activity Monitoring**: Page visits, form submissions, API calls
- 🚨 **Attack Detection**: Automatic detection of XSS, SQL injection, etc.
- 📈 **Real-time Analytics**: Live dashboard for security monitoring

### Intentional Vulnerabilities (For Research)
- 🔓 **XSS Vulnerability**: Admin search functionality
- 💉 **SQL Injection**: User lookup functionality
- 🔐 **Weak Rate Limiting**: Admin bypass mechanisms
- 📝 **Information Disclosure**: Detailed error messages
- 🔍 **Session Management**: Insecure session handling

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install

# Start MongoDB
mongod

# Start the backend server
npm run dev
```

### Frontend Setup
```bash
# Install dependencies (already done in Lovable)
npm install

# Start the development server
npm run dev
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb://localhost:27017/aiims_honeypot
PORT=3001
NODE_ENV=development
```

## 📊 Monitoring & Analysis

### Real-time Monitoring
Access the admin dashboard at `/admin` with admin credentials to view:
- Live session tracking
- Security incident alerts
- User activity patterns
- Attack attempt logs

### Security Analysis Script
Run comprehensive security analysis:
```bash
cd backend
npm run analysis
```

### Export Security Logs
```bash
cd backend
npm run logs
```

## 🔒 Security Features

### Session Tracking
Every user interaction is logged with:
- Unique session ID
- IP address and geolocation
- User agent and browser fingerprinting
- Page visits and time spent
- Form interactions and API calls
- File uploads and downloads

### Attack Detection
Automatic detection of:
- Cross-Site Scripting (XSS) attempts
- SQL Injection patterns
- Path traversal attacks
- Command injection attempts
- Brute force login attempts
- Suspicious user behavior

### Data Collection
Comprehensive logging includes:
- Authentication attempts and patterns
- Page navigation flows
- API endpoint usage
- Error patterns and exploit attempts
- File upload activities
- Admin panel access attempts

## 🎯 Intentional Vulnerabilities

**⚠️ WARNING: These vulnerabilities are intentionally placed for research purposes only.**

### 1. XSS in Admin Search
- **Location**: `/api/admin/search?vulnerable=true`
- **Type**: Reflected XSS
- **Payload**: `<script>alert('XSS')</script>`

### 2. SQL Injection Simulation
- **Location**: `/api/admin/users/:userId?direct_sql=true`
- **Type**: SQL Injection
- **Payload**: `1' OR '1'='1'; --`

### 3. Rate Limiting Bypass
- **Location**: All endpoints
- **Type**: Authentication bypass
- **Method**: Add `X-Admin-Bypass: true` header

### 4. Information Disclosure
- **Location**: Error responses
- **Type**: Sensitive data exposure
- **Info**: Database errors, file paths, SQL queries

## 📈 Analytics Dashboard

The admin panel provides real-time analytics:
- **User Statistics**: Registration, login patterns
- **Geographic Data**: IP-based location tracking
- **Attack Patterns**: Type, frequency, and sources
- **Session Analysis**: Duration, page flows, behaviors
- **Export Capabilities**: CSV logs for further analysis

## 🔬 Research Applications

This honeypot is designed for:
- **Cybersecurity Research**: Understanding attack patterns
- **Threat Intelligence**: Gathering attacker methodologies
- **Security Training**: Demonstrating vulnerabilities
- **Incident Response**: Practicing attack detection
- **Academic Studies**: Publishing security research

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Booking System
- `GET /api/doctors` - Get doctors list
- `GET /api/appointments/slots` - Get time slots
- `POST /api/appointments/book` - Book appointment

### Admin Panel
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/logs` - Security logs
- `GET /api/admin/search` - Search functionality (vulnerable)
- `GET /api/admin/users/:id` - User lookup (vulnerable)
- `GET /api/admin/export-logs` - Export CSV logs

### Monitoring
- `POST /api/logging/activity` - Log user activity

## 🚨 Ethical Considerations

**IMPORTANT DISCLAIMERS:**

1. **Research Only**: This system is for authorized security research only
2. **No Real Data**: Never use real patient or medical information
3. **Isolated Environment**: Deploy only in controlled environments
4. **Legal Compliance**: Ensure compliance with local cybersecurity laws
5. **Responsible Disclosure**: Report findings through proper channels

## 📊 Sample Data Analysis

After collecting data, you can analyze:
- Attack vectors and their success rates
- Geographic distribution of threats
- Time-based attack patterns
- User behavior before and after attacks
- Effectiveness of security measures

## 🔧 Customization

### Adding New Vulnerabilities
1. Create new vulnerable endpoints in `backend/server.js`
2. Add corresponding frontend interactions
3. Update logging mechanisms
4. Document the vulnerability type and payload

### Modifying Detection Rules
Edit the `detectPotentialAttacks` function in `backend/server.js`:
```javascript
const suspiciousPatterns = {
  xss: /<script[^>]*>.*?<\/script>/gi,
  sqlInjection: /union\s+select|drop\s+table/gi,
  // Add your patterns here
};
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Honeypot Security Research](https://www.sans.org/white-papers/)
- [Web Application Security Testing](https://owasp.org/www-project-web-security-testing-guide/)

## 🤝 Contributing

This is a research project. Contributions should focus on:
- Adding new vulnerability types
- Improving detection mechanisms
- Enhancing logging capabilities
- Better analysis tools

## 📄 License

This project is for educational and research purposes only. Use responsibly and in compliance with applicable laws and regulations.

---

**⚠️ SECURITY WARNING**: This system contains intentional vulnerabilities. Never deploy in production environments or with real user data. Use only for authorized security research and testing.
