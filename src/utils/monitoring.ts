// Free monitoring and logging utilities
interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

class FreeLogger {
  private static instance: FreeLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep only last 100 logs
  
  static getInstance(): FreeLogger {
    if (!FreeLogger.instance) {
      FreeLogger.instance = new FreeLogger();
    }
    return FreeLogger.instance;
  }

  error(error: Error, context?: ErrorContext) {
    const errorData: LogEntry = {
      level: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };

    // Always log to console
    console.error('Error logged:', errorData);
    
    // Store in memory for debugging
    this.addToMemoryLog(errorData);
    
    // Store critical errors in localStorage for persistence
    if (this.isCriticalError(error)) {
      this.storeCriticalError(errorData);
    }
  }

  warn(message: string, context?: ErrorContext) {
    const logData: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    console.warn('Warning logged:', logData);
    this.addToMemoryLog(logData);
  }

  info(message: string, context?: ErrorContext) {
    const logData: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    console.info('Info logged:', logData);
    this.addToMemoryLog(logData);
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    return this.logs;
  }

  // Export logs for manual analysis
  exportLogs() {
    const logsBlob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(logsBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debateai-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private addToMemoryLog(logData: LogEntry) {
    this.logs.push(logData);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      'network',
      'auth',
      'database',
      'payment',
      'security'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  private storeCriticalError(errorData: LogEntry) {
    try {
      const criticalErrors: LogEntry[] = JSON.parse(
        localStorage.getItem('critical_errors') || '[]'
      );
      criticalErrors.push(errorData);
      
      // Keep only last 10 critical errors
      if (criticalErrors.length > 10) {
        criticalErrors.shift();
      }
      
      localStorage.setItem('critical_errors', JSON.stringify(criticalErrors));
    } catch (e) {
      console.error('Failed to store critical error:', e);
    }
  }
}

export const logger = FreeLogger.getInstance();

// Free performance monitoring using browser APIs
export const performanceMonitor = {
  startTiming: (label: string) => {
    if ('performance' in window) {
      performance.mark(`${label}-start`);
    }
  },

  endTiming: (label: string) => {
    if ('performance' in window) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        logger.info(`Performance: ${label} took ${measure.duration.toFixed(2)}ms`);
      }
    }
  },

  measureComponent: (componentName: string) => {
    return {
      onMount: () => performanceMonitor.startTiming(`${componentName}-mount`),
      onUnmount: () => performanceMonitor.endTiming(`${componentName}-mount`),
    };
  },

  // Get Core Web Vitals using free browser APIs
  getCoreWebVitals: () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        // Largest Contentful Paint (LCP)
        lcp: navigation.loadEventEnd - navigation.loadEventStart,
        // First Input Delay (FID) - approximation
        fid: navigation.domInteractive - navigation.domContentLoadedEventStart,
        // Cumulative Layout Shift (CLS) - basic approximation
        cls: 0, // Would need more complex measurement
        // Time to First Byte (TTFB)
        ttfb: navigation.responseStart - navigation.requestStart,
      };
    }
    return null;
  }
};

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
}

// Free analytics using localStorage and console
export const freeAnalytics = {
  track: (event: string, properties?: Record<string, any>) => {
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        sessionId: freeAnalytics.getSessionId(),
        ...properties
      }
    };

    // Store in localStorage for basic analytics
    freeAnalytics.storeEvent(eventData);
  },

  page: (pageName: string) => {
    freeAnalytics.track('page_view', { page: pageName });
  },

  user: (userId: string, traits?: Record<string, any>) => {
    localStorage.setItem('analytics_user', JSON.stringify({ userId, traits }));
  },

  getSessionId: (): string => {
    let sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session', sessionId);
    }
    return sessionId;
  },

  storeEvent: (eventData: AnalyticsEvent) => {
    try {
      const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(eventData);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (e) {
      console.error('Failed to store analytics event:', e);
    }
  },

  exportAnalytics: () => {
    const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const analyticsBlob = new Blob([JSON.stringify(events, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(analyticsBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debateai-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Health check for free monitoring
export const healthCheck = {
  checkBrowserSupport: () => {
    const features = {
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webRTC: 'RTCPeerConnection' in window,
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
      mediaRecorder: 'MediaRecorder' in window,
    };

    const unsupported = Object.entries(features)
      .filter(([, supported]) => !supported)
      .map(([feature]) => feature);

    if (unsupported.length > 0) {
      logger.warn(`Unsupported browser features: ${unsupported.join(', ')}`);
    }

    return features;
  },

  checkPerformance: () => {
    const memory = (performance as Performance & { memory?: any }).memory;
    if (memory) {
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };

      if (memoryInfo.used / memoryInfo.limit > 0.8) {
        logger.warn('High memory usage detected', { memoryInfo });
      }

      return memoryInfo;
    }
    return null;
  }
};