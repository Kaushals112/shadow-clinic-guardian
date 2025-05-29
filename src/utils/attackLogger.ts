import { trackUserActivity, trackPotentialAttack } from './sessionTracker';

interface AttackVector {
  type: string;
  payload: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export class AttackLogger {
  private static instance: AttackLogger;
  private sessionId: string;

  constructor() {
    this.sessionId = localStorage.getItem('sessionId') || 'anonymous';
  }

  static getInstance(): AttackLogger {
    if (!AttackLogger.instance) {
      AttackLogger.instance = new AttackLogger();
    }
    return AttackLogger.instance;
  }

  // XSS Detection
  detectXSS(input: string, location: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<svg[^>]*onload[^>]*>/gi,
      /eval\s*\(/gi,
      /alert\s*\(/gi,
      /prompt\s*\(/gi,
      /confirm\s*\(/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logAttack({
          type: 'xss_attempt',
          payload: input,
          location,
          severity: 'high',
          metadata: {
            pattern: pattern.source,
            userAgent: navigator.userAgent
          }
        });
        return true;
      }
    }
    return false;
  }

  // SQL Injection Detection
  detectSQLInjection(input: string, location: string): boolean {
    const sqlPatterns = [
      /(\bor\b|\band\b).*?=.*?['"`]/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+.*?\s+set/gi,
      /exec\s*\(/gi,
      /sp_executesql/gi,
      /--/g,
      /\/\*.*?\*\//g,
      /'\s*(or|and)\s*'.*?'=/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.logAttack({
          type: 'sql_injection_attempt',
          payload: input,
          location,
          severity: 'critical',
          metadata: {
            pattern: pattern.source
          }
        });
        return true;
      }
    }
    return false;
  }

  // Path Traversal Detection
  detectPathTraversal(input: string, location: string): boolean {
    const pathTraversalPatterns = [
      /\.\.[\/\\]/g,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.\\.\\/g
    ];

    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(input)) {
        this.logAttack({
          type: 'path_traversal_attempt',
          payload: input,
          location,
          severity: 'high'
        });
        return true;
      }
    }
    return false;
  }

  // Command Injection Detection
  detectCommandInjection(input: string, location: string): boolean {
    const commandPatterns = [
      /[;&|`$(){}[\]]/g,
      /\bcat\b/gi,
      /\bls\b/gi,
      /\bps\b/gi,
      /\bnetstat\b/gi,
      /\bwhoami\b/gi,
      /\bpwd\b/gi,
      /\bcd\b/gi,
      /\brm\b/gi,
      /\bmv\b/gi,
      /\bcp\b/gi
    ];

    for (const pattern of commandPatterns) {
      if (pattern.test(input)) {
        this.logAttack({
          type: 'command_injection_attempt',
          payload: input,
          location,
          severity: 'critical'
        });
        return true;
      }
    }
    return false;
  }

  // LDAP Injection Detection
  detectLDAPInjection(input: string, location: string): boolean {
    const ldapPatterns = [
      /\*\)/g,
      /\(\|/g,
      /\(&/g,
      /\(!/g,
      /\)\(/g
    ];

    for (const pattern of ldapPatterns) {
      if (pattern.test(input)) {
        this.logAttack({
          type: 'ldap_injection_attempt',
          payload: input,
          location,
          severity: 'high'
        });
        return true;
      }
    }
    return false;
  }

  // Detect unusual behavior patterns
  detectAnomalousActivity(activity: any): void {
    // Multiple rapid requests
    const recentLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const recentActivity = recentLogs.filter((log: any) => 
      Date.now() - new Date(log.timestamp).getTime() < 60000 // Last minute
    );

    if (recentActivity.length > 20) {
      this.logAttack({
        type: 'rapid_requests',
        payload: JSON.stringify({ requestCount: recentActivity.length }),
        location: 'global',
        severity: 'medium',
        metadata: {
          timeWindow: '1 minute',
          requestCount: recentActivity.length
        }
      });
    }

    // Automated bot detection
    if (this.detectBot()) {
      this.logAttack({
        type: 'bot_detection',
        payload: navigator.userAgent,
        location: 'global',
        severity: 'medium',
        metadata: {
          userAgent: navigator.userAgent,
          features: this.getBrowserFeatures()
        }
      });
    }
  }

  private detectBot(): boolean {
    // Check for headless browser characteristics
    return (
      !navigator.webdriver === undefined ||
      navigator.languages.length === 0 ||
      /HeadlessChrome|PhantomJS|Selenium|WebDriver/i.test(navigator.userAgent)
    );
  }

  private getBrowserFeatures(): any {
    return {
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      platform: navigator.platform,
      languages: navigator.languages,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      webdriver: (navigator as any).webdriver
    };
  }

  // Log attack to multiple systems
  private async logAttack(attack: AttackVector): Promise<void> {
    // Log to session tracker
    await trackPotentialAttack(attack.type, {
      payload: attack.payload,
      location: attack.location,
      severity: attack.severity,
      metadata: attack.metadata,
      timestamp: new Date(),
      sessionId: this.sessionId
    });

    // Log to console for debugging
    console.warn(`🚨 ATTACK DETECTED: ${attack.type}`, attack);

    // Store in local storage for persistent tracking
    const attackLogs = JSON.parse(localStorage.getItem('attackLogs') || '[]');
    attackLogs.push({
      ...attack,
      timestamp: new Date(),
      sessionId: this.sessionId
    });
    
    // Keep only last 100 attack logs
    if (attackLogs.length > 100) {
      attackLogs.splice(0, attackLogs.length - 100);
    }
    
    localStorage.setItem('attackLogs', JSON.stringify(attackLogs));
  }

  // Enhanced input monitoring
  monitorInput(element: HTMLInputElement | HTMLTextAreaElement): void {
    const originalValue = element.value;
    
    element.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const value = target.value;
      const location = `${target.tagName.toLowerCase()}_${target.name || target.id || 'unknown'}`;

      // Run all detection methods
      this.detectXSS(value, location);
      this.detectSQLInjection(value, location);
      this.detectPathTraversal(value, location);
      this.detectCommandInjection(value, location);
      this.detectLDAPInjection(value, location);
    });
  }

  // Monitor all form inputs automatically
  enableGlobalMonitoring(): void {
    // Monitor existing inputs
    document.querySelectorAll('input, textarea').forEach((element) => {
      this.monitorInput(element as HTMLInputElement | HTMLTextAreaElement);
    });

    // Monitor dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              this.monitorInput(element as HTMLInputElement | HTMLTextAreaElement);
            }
            // Check child elements
            element.querySelectorAll('input, textarea').forEach((child) => {
              this.monitorInput(child as HTMLInputElement | HTMLTextAreaElement);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize global monitoring
export const initializeAttackMonitoring = () => {
  const logger = AttackLogger.getInstance();
  logger.enableGlobalMonitoring();
  
  // Monitor unusual activity patterns
  setInterval(() => {
    logger.detectAnomalousActivity({});
  }, 30000); // Check every 30 seconds
};
