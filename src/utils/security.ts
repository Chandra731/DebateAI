// Free security utilities and helpers
export const freeSecurity = {
  // Client-side rate limiting (free)
  rateLimiter: (() => {
    const limits = new Map<string, { count: number; resetTime: number }>();
    
    return {
      check: (key: string, maxAttempts: number, windowMs: number): boolean => {
        const now = Date.now();
        const limit = limits.get(key);
        
        if (!limit || now > limit.resetTime) {
          limits.set(key, { count: 1, resetTime: now + windowMs });
          return true;
        }
        
        if (limit.count >= maxAttempts) {
          return false;
        }
        
        limit.count++;
        return true;
      },
      
      reset: (key: string) => {
        limits.delete(key);
      },

      getRemainingAttempts: (key: string, maxAttempts: number): number => {
        const limit = limits.get(key);
        if (!limit || Date.now() > limit.resetTime) {
          return maxAttempts;
        }
        return Math.max(0, maxAttempts - limit.count);
      }
    };
  })(),

  // Input sanitization (free)
  sanitize: {
    text: (input: string): string => {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
    },
    
    filename: (filename: string): string => {
      return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.{2,}/g, '.') // Remove multiple dots
        .substring(0, 255); // Limit filename length
    },
    
    url: (url: string): string => {
      try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Invalid protocol');
        }
        return parsed.toString();
      } catch {
        return '';
      }
    },

    email: (email: string): string => {
      return email
        .trim()
        .toLowerCase()
        .replace(/[^\w@.-]/g, '') // Only allow valid email characters
        .substring(0, 254); // RFC 5321 limit
    }
  },

  // Content Security Policy helpers (free)
  csp: {
    generateNonce: (): string => {
      if (crypto && crypto.getRandomValues) {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      }
      // Fallback for older browsers
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    },

    validateOrigin: (origin: string, allowedOrigins: string[]): boolean => {
      return allowedOrigins.includes(origin) || 
             allowedOrigins.includes('*') ||
             (origin === window.location.origin);
    }
  },

  // Session management (free)
  session: {
    isExpired: (timestamp: number, maxAge: number): boolean => {
      return Date.now() - timestamp > maxAge;
    },
    
    generateSessionId: (): string => {
      if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for older browsers
      return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    createFingerprint: (): string => {
      // Create a simple browser fingerprint for security
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx!.textBaseline = 'top';
      ctx!.font = '14px Arial';
      ctx!.fillText('Browser fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      return btoa(fingerprint).substring(0, 32);
    }
  },

  // Password strength checker (free)
  password: {
    checkStrength: (password: string): {
      score: number;
      feedback: string[];
      isStrong: boolean;
    } => {
      const feedback: string[] = [];
      let score = 0;

      if (password.length >= 8) score += 1;
      else feedback.push('Use at least 8 characters');

      if (/[a-z]/.test(password)) score += 1;
      else feedback.push('Include lowercase letters');

      if (/[A-Z]/.test(password)) score += 1;
      else feedback.push('Include uppercase letters');

      if (/\d/.test(password)) score += 1;
      else feedback.push('Include numbers');

      if (/[^a-zA-Z\d]/.test(password)) score += 1;
      else feedback.push('Include special characters');

      if (password.length >= 12) score += 1;

      // Check for common patterns
      if (/(.)\1{2,}/.test(password)) {
        score -= 1;
        feedback.push('Avoid repeated characters');
      }

      if (/123|abc|qwe/i.test(password)) {
        score -= 1;
        feedback.push('Avoid common sequences');
      }

      return {
        score: Math.max(0, score),
        feedback,
        isStrong: score >= 4
      };
    }
  }
};

// Free secure storage wrapper
export const freeSecureStorage = {
  set: (key: string, value: any, options: { encrypt?: boolean; expiry?: number } = {}): void => {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiry: options.expiry ? Date.now() + options.expiry : null
      };
      
      const serialized = JSON.stringify(data);
      const stored = options.encrypt ? btoa(serialized) : serialized;
      
      localStorage.setItem(`secure_${key}`, stored);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },

  get: <T>(key: string, options: { decrypt?: boolean } = {}): T | null => {
    try {
      const stored = localStorage.getItem(`secure_${key}`);
      if (!stored) return null;
      
      const serialized = options.decrypt ? atob(stored) : stored;
      const data = JSON.parse(serialized);
      
      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(`secure_${key}`);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(`secure_${key}`);
  },

  clear: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Clean expired items
  cleanup: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            if (data.expiry && Date.now() > data.expiry) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    });
  }
};

// CSRF protection for forms (free)
export const useCSRFToken = () => {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Generate a CSRF token for this session
    const csrfToken = freeSecurity.csp.generateNonce();
    setToken(csrfToken);
    
    // Store in session storage
    sessionStorage.setItem('csrf_token', csrfToken);
  }, []);

  const validateToken = (submittedToken: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === submittedToken;
  };

  return { token, validateToken };
};