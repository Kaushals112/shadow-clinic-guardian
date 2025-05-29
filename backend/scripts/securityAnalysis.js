
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/aiims_honeypot');

const SessionLogSchema = new mongoose.Schema({
  sessionId: String,
  userId: String,
  action: String,
  page: String,
  timestamp: Date,
  ipAddress: String,
  userAgent: String,
  referrer: String,
  data: mongoose.Schema.Types.Mixed,
  clientInfo: mongoose.Schema.Types.Mixed,
  fingerprint: String,
  severity: String
});

const SecurityIncidentSchema = new mongoose.Schema({
  sessionId: String,
  incidentType: String,
  severity: String,
  description: String,
  payload: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: Date,
  resolved: Boolean
});

const SessionLog = mongoose.model('SessionLog', SessionLogSchema);
const SecurityIncident = mongoose.model('SecurityIncident', SecurityIncidentSchema);

async function generateSecurityReport() {
  console.log('🔒 AIIMS Honeypot Security Analysis Report');
  console.log('==========================================\n');

  // Session Statistics
  const totalSessions = await SessionLog.distinct('sessionId');
  const uniqueIPs = await SessionLog.distinct('ipAddress');
  const totalActivities = await SessionLog.countDocuments();
  
  console.log('📊 Overall Statistics:');
  console.log(`   Total Unique Sessions: ${totalSessions.length}`);
  console.log(`   Unique IP Addresses: ${uniqueIPs.length}`);
  console.log(`   Total Activities Logged: ${totalActivities}`);
  console.log('');

  // Security Incidents
  const totalIncidents = await SecurityIncident.countDocuments();
  const criticalIncidents = await SecurityIncident.countDocuments({ severity: 'critical' });
  const highIncidents = await SecurityIncident.countDocuments({ severity: 'high' });
  
  console.log('🚨 Security Incidents:');
  console.log(`   Total Incidents: ${totalIncidents}`);
  console.log(`   Critical Severity: ${criticalIncidents}`);
  console.log(`   High Severity: ${highIncidents}`);
  console.log('');

  // Attack Types
  const xssAttempts = await SecurityIncident.countDocuments({ incidentType: 'xss' });
  const sqlInjectionAttempts = await SecurityIncident.countDocuments({ incidentType: 'sql_injection' });
  
  console.log('🎯 Attack Patterns:');
  console.log(`   XSS Attempts: ${xssAttempts}`);
  console.log(`   SQL Injection Attempts: ${sqlInjectionAttempts}`);
  console.log('');

  // Top Attacking IPs
  const attackingIPs = await SecurityIncident.aggregate([
    { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  console.log('🌐 Top Attacking IP Addresses:');
  attackingIPs.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip._id}: ${ip.count} incidents`);
  });
  console.log('');

  // Activity Patterns
  const topActions = await SessionLog.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  console.log('📈 Most Common Activities:');
  topActions.forEach((action, index) => {
    console.log(`   ${index + 1}. ${action._id}: ${action.count} times`);
  });
  console.log('');

  // Recent Critical Incidents
  const recentIncidents = await SecurityIncident.find({ severity: 'critical' })
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();

  console.log('🚨 Recent Critical Incidents:');
  recentIncidents.forEach((incident, index) => {
    console.log(`   ${index + 1}. ${incident.incidentType} from ${incident.ipAddress}`);
    console.log(`      Time: ${incident.timestamp}`);
    console.log(`      Description: ${incident.description}`);
    console.log('');
  });

  // Login Analysis
  const loginAttempts = await SessionLog.countDocuments({ action: { $regex: /login/ } });
  const successfulLogins = await SessionLog.countDocuments({ action: 'login_successful' });
  const failedLogins = await SessionLog.countDocuments({ action: 'login_failed' });

  console.log('🔐 Authentication Analysis:');
  console.log(`   Total Login Attempts: ${loginAttempts}`);
  console.log(`   Successful Logins: ${successfulLogins}`);
  console.log(`   Failed Logins: ${failedLogins}`);
  console.log(`   Success Rate: ${((successfulLogins / loginAttempts) * 100).toFixed(2)}%`);
  console.log('');

  // Time-based Analysis
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActivities = await SessionLog.countDocuments({ timestamp: { $gte: last24Hours } });
  const recentIncidents24h = await SecurityIncident.countDocuments({ timestamp: { $gte: last24Hours } });

  console.log('⏰ Recent Activity (Last 24 Hours):');
  console.log(`   Total Activities: ${recentActivities}`);
  console.log(`   Security Incidents: ${recentIncidents24h}`);
  console.log('');

  console.log('📝 Report generated at:', new Date().toISOString());
  
  process.exit(0);
}

generateSecurityReport().catch(console.error);
