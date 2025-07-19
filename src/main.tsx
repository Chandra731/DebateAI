import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App.tsx';
import './index.css';

import { logger } from './utils/monitoring';

const queryClient = new QueryClient();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error(new Error(event.message), {
    component: 'global',
    action: 'unhandled_error',
    metadata: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error(new Error(event.reason), {
    component: 'global',
    action: 'unhandled_promise_rejection'
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);