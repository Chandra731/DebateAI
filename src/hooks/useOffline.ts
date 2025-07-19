import { useState, useEffect } from 'react';

// Free offline functionality hook
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineActions, setOfflineActions] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync offline actions when back online
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineAction = (action: any) => {
    const actionWithId = { ...action, id: Date.now().toString() };
    setOfflineActions(prev => [...prev, actionWithId]);
    
    // Store in IndexedDB for persistence
    storeOfflineAction(actionWithId);
  };

  const syncOfflineActions = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      } catch (error) {
        console.error('Background sync registration failed:', error);
        // Fallback: sync manually
        await manualSync();
      }
    } else {
      // Fallback for browsers without background sync
      await manualSync();
    }
  };

  const manualSync = async () => {
    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options);
        removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  };

  const removeOfflineAction = (id: string) => {
    setOfflineActions(prev => prev.filter(action => action.id !== id));
  };

  return {
    isOnline,
    offlineActions,
    addOfflineAction,
    syncOfflineActions
  };
};

// IndexedDB helper for offline storage
const storeOfflineAction = (action: OfflineAction) => {
  const request = indexedDB.open('DebateAI', 1);
  
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('offline_actions')) {
      db.createObjectStore('offline_actions', { keyPath: 'id' });
    }
  };
  
  request.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    const transaction = db.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    store.add(action);
  };
};