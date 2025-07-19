// Free performance optimization utilities
import { useCallback, useRef, useEffect, useState } from 'react';

// Debounce hook for performance (free)
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Throttle hook for performance (free)
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;

  return throttledCallback;
};

// Intersection Observer hook for lazy loading (free)
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !('IntersectionObserver' in window)) {
      setIsIntersecting(true); // Fallback for unsupported browsers
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return { targetRef, isIntersecting };
};

// Virtual scrolling for large lists (free)
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    item,
    index: startIndex + index
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

// Image optimization utilities (free)
export const freeImageUtils = {
  // Lazy load images using Intersection Observer
  useLazyImage: (src: string, placeholder = '/placeholder.jpg') => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const { targetRef, isIntersecting } = useIntersectionObserver({
      threshold: 0.1,
      rootMargin: '50px'
    });

    useEffect(() => {
      if (isIntersecting && !isLoaded && !hasError) {
        const img = new Image();
        
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
        };
        
        img.onerror = () => {
          setHasError(true);
          console.warn(`Failed to load image: ${src}`);
        };
        
        img.src = src;
      }
    }, [isIntersecting, isLoaded, hasError, src]);

    return { targetRef, imageSrc, isLoaded, hasError };
  },

  // Compress images on client side (free)
  compressImage: (file: File, quality = 0.8, maxWidth = 1920): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  // Generate responsive image sizes (free)
  generateSrcSet: (baseUrl: string, sizes: number[]): string => {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  }
};

// Memory management utilities (free)
export const freeMemoryUtils = {
  // Clean up event listeners
  useEventListener: (
    eventName: string,
    handler: (event: Event) => void,
    element: HTMLElement | Window = window
  ) => {
    const savedHandler = useRef(handler);

    useEffect(() => {
      savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
      const eventListener = (event: Event) => savedHandler.current(event);
      element.addEventListener(eventName, eventListener);
      
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    }, [eventName, element]);
  },

  // Cleanup timeouts and intervals
  useTimeout: (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);

    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
      if (delay === null) return;

      const id = setTimeout(() => savedCallback.current(), delay);
      return () => clearTimeout(id);
    }, [delay]);
  },

  // Memory usage monitoring (free)
  useMemoryMonitor: () => {
    const [memoryInfo, setMemoryInfo] = useState<any>(null);

    useEffect(() => {
      const checkMemory = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          setMemoryInfo({
            used: Math.round(memory.usedJSHeapSize / 1048576), // MB
            total: Math.round(memory.totalJSHeapSize / 1048576), // MB
            limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
          });
        }
      };

      checkMemory();
      const interval = setInterval(checkMemory, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }, []);

    return memoryInfo;
  },

  // Cleanup unused cache entries
  cleanupCache: () => {
    // Clean up expired localStorage items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.expiry && Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Remove corrupted items
        localStorage.removeItem(key);
      }
    });

    // Clean up old session storage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('temp_') || key.startsWith('cache_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

// Network optimization (free)
export const networkUtils = {
  // Check connection quality
  useNetworkStatus: () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionType, setConnectionType] = useState<string>('unknown');

    useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check connection type if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || 'unknown');
        
        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };
        
        connection.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection.removeEventListener('change', handleConnectionChange);
        };
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    return { isOnline, connectionType };
  },

  // Retry failed requests
  retryRequest: async <T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) break;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    throw lastError!;
  }
};