import { useState, useEffect, useCallback, DependencyList } from 'react';
import { DatabaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase'; // Import db
import { doc, onSnapshot } from 'firebase/firestore'; // Import onSnapshot
import { Profile, Topic, Debate, Case, Achievement, UserAchievement } from '../types';

// Generic hook for data fetching with loading states
function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  initialData?: T
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useProfile() {
  const { user } = useAuth();
  
  const { data: profile, loading, error, refetch } = useAsyncData<Profile | null>(
    async () => {
      if (!user?.uid) return null;
      return await DatabaseService.getProfile(user.uid);
    },
    [user?.uid]
  );

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      const updatedProfile = await DatabaseService.updateProfile(user.uid, updates);
      await refetch(); // Refresh the data
      return updatedProfile;
    } catch (err) {
      throw err;
    }
  }, [user?.uid, refetch]);

  return { 
    profile, 
    loading, 
    error, 
    updateProfile, 
    refetch 
  };
}

export function useTopics(activeOnly = true) {
  const { data: topics, loading, error, refetch } = useAsyncData<Topic[]>(
    () => DatabaseService.getTopics(activeOnly),
    [activeOnly],
    []
  );

  return { topics, loading, error, refetch };
}

export function useUserDebates() {
  const { user } = useAuth();
  
  const { data: debates, loading, error, refetch } = useAsyncData<Debate[]>(
    async () => {
      if (!user?.uid) return [];
      return await DatabaseService.getUserDebates(user.uid);
    },
    [user?.uid],
    []
  );

  return { debates, loading, error, refetch };
}

export function useUserCases() {
  const { user } = useAuth();
  
  const { data: cases, loading, error, refetch } = useAsyncData<Case[]>(
    async () => {
      if (!user?.uid) return [];
      return await DatabaseService.getUserCases(user.uid);
    },
    [user?.uid],
    []
  );

  return { cases, loading, error, refetch };
}

export function useLeaderboard(type = 'global', timeFilter = 'allTime') {
  const { user } = useAuth();
  const { data: leaderboard, loading, error, refetch } = useAsyncData<Profile[]>(
    () => DatabaseService.getLeaderboard(user, type, timeFilter),
    [user, type, timeFilter],
    []
  );

  return { leaderboard, loading, error, refetch };
}

export function useAchievements() {
  const { data: achievements, loading, error, refetch } = useAsyncData<Achievement[]>(
    () => DatabaseService.getAchievements(),
    [],
    []
  );

  return { achievements, loading, error, refetch };
}

export function useUserAchievements() {
  const { user } = useAuth();
  
  const { data: userAchievements, loading, error, refetch } = useAsyncData<UserAchievement[]>(
    async () => {
      if (!user?.uid) return [];
      return await DatabaseService.getUserAchievements(user.uid);
    },
    [user?.uid],
    []
  );

  return { userAchievements, loading, error, refetch };
}

// Custom hook for real-time subscriptions (Firestore equivalent)
export function useRealtimeSubscription<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  dependencies: DependencyList = []
) {
  useEffect(() => {
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        callback(null);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [collectionName, docId, ...dependencies]);
}

// Debounced hook for search functionality
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook with type safety
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}