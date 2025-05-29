// Enhanced tracking specifically for honeypot analysis
import { trackUserActivity, trackSuspiciousActivity } from './sessionTracker';

interface HoneypotEvent {
  type: 'vulnerability_probe' | 'admin_access' | 'credential_stuffing' | 'enumeration' | 'injection_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  attackVector?: string;
}

export class HoneypotTracker {
  private static sessionId = localStorage.getItem('sessionId') || 'anonymous';

  // Track admin panel discovery attempts
  static trackAdminPanelAccess(path: string, method: string = 'GET') {
    this.logHoneypotEvent({
      type: 'admin_access',
      severity: 'high',
      details: {
        path,
        method,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    });
  }

  // Track credential stuffing/brute force patterns
  static trackCredentialAttempt(email: string, success: boolean, attempt: number) {
    this.logHoneypotEvent({
      type: 'credential_stuffing',
      severity: attempt > 3 ? 'critical' : 'high',
      details: {
        email,
        success,
        attempt,
        timestamp: new Date(),
        potentialBruteForce: attempt > 5
      }
    });
  }

  // Track directory/file enumeration
  static trackEnumeration(path: string, statusCode: number) {
    this.logHoneypotEvent({
      type: 'enumeration',
      severity: 'medium',
      details: {
        path,
        statusCode,
        timestamp: new Date(),
        suspiciousPath: this.isSuspiciousPath(path)
      }
    });
  }

  // Track injection attempts
  static trackInjectionAttempt(inputField: string, payload: string, injectionType: string) {
    this.logHoneypotEvent({
      type: 'injection_attempt',
      severity: 'critical',
      details: {
        inputField,
        payload: payload.substring(0, 500), // Limit payload size
        injectionType,
        timestamp: new Date()
      },
      attackVector: injectionType
    });
  }

  // Track vulnerability probing
  static trackVulnerabilityProbe(target: string, probeType: string, payload?: string) {
    this.logHoneypotEvent({
      type: 'vulnerability_probe',
      severity: 'high',
      details: {
        target,
        probeType,
        payload: payload?.substring(0, 300),
        timestamp: new Date(),
        fingerprint: this.generateAttackFingerprint()
      }
    });
  }

  private static async logHoneypotEvent(event: HoneypotEvent) {
    // Log to main activity tracker
    await trackUserActivity({
      action: 'honeypot_event',
      sessionId: this.sessionId,
      timestamp: new Date(),
      data: event
    });

    // Log to suspicious activity tracker
    await trackSuspiciousActivity(`honeypot_${event.type}`, event.details);

    // Store in dedicated honeypot logs
    const honeypotLogs = JSON.parse(localStorage.getItem('honeypotLogs') || '[]');
    honeypotLogs.push({
      ...event,
      sessionId: this.sessionId,
      timestamp: new Date()
    });

    // Keep last 200 honeypot events
    if (honeypotLogs.length > 200) {
      honeypotLogs.splice(0, honeypotLogs.length - 200);
    }

    localStorage.setItem('honeypotLogs', JSON.stringify(honeypotLogs));

    // Console log for immediate visibility
    console.warn(`🍯 HONEYPOT EVENT: ${event.type}`, event);
  }

  private static isSuspiciousPath(path: string): boolean {
    const suspiciousPaths = [
      '/admin', '/wp-admin', '/administrator', '/phpmyadmin', '/mysql',
      '/backup', '/config', '/.env', '/database', '/secret', '/hidden',
      '/test', '/debug', '/api/admin', '/robots.txt', '/sitemap.xml'
    ];
    return suspiciousPaths.some(suspicious => path.toLowerCase().includes(suspicious));
  }

  private static generateAttackFingerprint(): string {
    const data = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform
    };
    return btoa(JSON.stringify(data)).substring(0, 16);
  }
}

// Auto-track page visits for enumeration detection
export const initializeHoneypotTracking = () => {
  // Track all page navigation
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    HoneypotTracker.trackEnumeration(args[2] as string, 200);
    return originalPushState.apply(history, args);
  };

  // Track admin panel access attempts
  const currentPath = window.location.pathname;
  if (currentPath.includes('admin') || currentPath.includes('Admin')) {
    HoneypotTracker.trackAdminPanelAccess(currentPath);
  }
};
