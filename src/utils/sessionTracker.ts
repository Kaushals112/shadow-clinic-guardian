import { apiClient } from './apiClient';

interface ActivityData {
  action: string;
  page?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
  email?: string;
  reason?: string;
  error?: string;
  data?: any;
}

export const trackUserActivity = async (activityData: ActivityData) => {
  try {
    // Get additional client information
    const clientInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      url: window.location.href
    };

    // Get session ID from localStorage
    const sessionId = localStorage.getItem('sessionId') || 'anonymous';

    const enrichedData = {
      ...activityData,
      sessionId: activityData.sessionId || sessionId,
      clientInfo,
      timestamp: new Date(),
      fingerprint: await generateFingerprint()
    };

    // Send to backend for logging (don't await to avoid blocking UI)
    apiClient.post('/logging/activity', enrichedData).catch(error => {
      console.error('Activity tracking error:', error);
    });

    // Store locally as backup
    const localLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localLogs.push(enrichedData);
    
    // Keep only last 100 entries
    if (localLogs.length > 100) {
      localLogs.splice(0, localLogs.length - 100);
    }
    
    localStorage.setItem('activityLogs', JSON.stringify(localLogs));

  } catch (error) {
    console.error('Session tracking error:', error);
  }
};

// Generate device fingerprint for tracking
const generateFingerprint = async (): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Fingerprint test', 2, 2);
  }
  
  const fingerprint = btoa(JSON.stringify({
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL()
  }));

  return fingerprint.substring(0, 32);
};

// Track suspicious activities
export const trackSuspiciousActivity = async (type: string, details: any) => {
  await trackUserActivity({
    action: 'suspicious_activity',
    timestamp: new Date(),
    data: {
      type,
      details,
      severity: 'high'
    }
  });
};

// Track potential attacks
export const trackPotentialAttack = async (attackType: string, payload: any) => {
  await trackUserActivity({
    action: 'potential_attack',
    timestamp: new Date(),
    data: {
      attackType,
      payload,
      severity: 'critical'
    }
  });
};
