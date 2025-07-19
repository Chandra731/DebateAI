// Application constants and configuration - FREE VERSION
export const APP_CONFIG = {
  name: 'DebateAI',
  version: '1.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // API Configuration
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  // Feature flags (all free features)
  features: {
    realTimeDebates: import.meta.env.VITE_ENABLE_REAL_TIME !== 'false',
    aiJudging: import.meta.env.VITE_ENABLE_AI_JUDGING !== 'false',
    achievements: import.meta.env.VITE_ENABLE_ACHIEVEMENTS !== 'false',
    leaderboards: true,
    offlineMode: true, // PWA support
    darkMode: true,
  },
  
  // Limits and constraints
  limits: {
    maxDebateDuration: 30 * 60, // 30 minutes in seconds
    maxSpeechDuration: 5 * 60, // 5 minutes in seconds
    maxDailyDebates: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB (free tier friendly)
    maxCacheSize: 50 * 1024 * 1024, // 50MB cache
  },
  
  // UI Configuration
  ui: {
    toastDuration: 5000,
    loadingTimeout: 30000,
    animationDuration: 300,
    theme: 'light', // default theme
  },
  
  // External services (free only)
  services: {
    // Free alternatives only
    analytics: {
      enabled: false, // Use browser console for now
    },
    monitoring: {
      enabled: false, // Use browser console for now
    }
  },
  
  // Performance settings
  performance: {
    enableServiceWorker: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    enableGzip: true,
  }
} as const;

// Validation
export const validateConfig = () => {
  // No specific validation needed for Firebase config as it's handled by Firebase SDK initialization
  // and will throw errors if misconfigured.
};

// Environment checks
export const isProduction = () => APP_CONFIG.environment === 'production';
export const isDevelopment = () => APP_CONFIG.environment === 'development';
export const isStaging = () => APP_CONFIG.environment === 'staging';

// Free tier optimizations
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  TOPICS: 'topics_cache',
  LEADERBOARD: 'leaderboard_cache',
  ACHIEVEMENTS: 'achievements_cache',
} as const;

export const STORAGE_KEYS = {
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  SETTINGS: 'user_settings',
  OFFLINE_DATA: 'offline_data',
} as const;