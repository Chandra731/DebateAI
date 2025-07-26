/**
 * @file useDatabase.ts
 * @description This file contains all the React Query hooks for interacting with the Firestore database.
 * It provides a clean, consistent, and robust API for components to fetch and mutate data.
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult } from 'react-query';
import { DatabaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Topic, Debate, Case, Achievement, UserAchievement } from '../types';

// --- Profile Hooks ---
export const useProfile = () => {
  const { user } = useAuth();
  const queryKey = ['profile', user?.uid];

  const { data, isLoading, error } = useQuery<Profile | null, Error>(
    queryKey,
    () => {
      if (!user?.uid) return null;
      return DatabaseService.getProfile(user.uid);
    },
    {
      enabled: !!user?.uid, // Query will not run until the user's UID is available
    }
  );

  const cases = data || []; 

  return { data: cases, isLoading, error };
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isLoading, error } = useMutation<Profile, Error, Partial<Profile>>(
    (updates) => {
      if (!user?.uid) throw new Error('User not authenticated for profile update.');
      return DatabaseService.updateProfile(user.uid, updates);
    },
    {
      onSuccess: () => {
        // When the mutation is successful, invalidate the profile query to trigger a refetch
        queryClient.invalidateQueries(['profile', user?.uid]);
      },
    }
  );

  return { updateProfile: mutateAsync, isUpdating: isLoading, error };
};


// --- Topic Hooks ---
export const useTopics = (activeOnly = true): UseQueryResult<Topic[], Error> => {
  return useQuery<Topic[], Error>(
    ['topics', activeOnly],
    () => DatabaseService.getTopics(activeOnly),
    {
      initialData: [],
    }
  );
};


// --- Debate Hooks ---
export const useUserDebates = (): UseQueryResult<Debate[], Error> => {
  const { user } = useAuth();
  const queryKey = ['userDebates', user?.uid];

  return useQuery<Debate[], Error>(
    queryKey,
    () => {
      if (!user?.uid) return []; // Return empty array if no user
      return DatabaseService.getUserDebates(user.uid);
    },
    {
      enabled: !!user?.uid,
      initialData: [],
    }
  );
};


// --- Case Hooks ---
export const useUserCases = (): UseQueryResult<Case[], Error> => {
  const { user } = useAuth();
  const queryKey = ['userCases', user?.uid];

  return useQuery<Case[], Error>(
    queryKey,
    () => {
      if (!user?.uid) return [];
      return DatabaseService.getUserCases(user.uid);
    },
    {
      enabled: !!user?.uid,
      initialData: [],
    }
  );
};


// --- Leaderboard Hooks ---
export const useLeaderboard = (type = 'global', timeFilter = 'allTime', leaderboardType: 'debate' | 'skill' = 'debate'): UseQueryResult<Profile[], Error> => {
  const { user } = useAuth();
  const queryKey = ['leaderboard', type, timeFilter, leaderboardType, user?.uid]; // Add user to key to refetch on login
  
  return useQuery<Profile[], Error>(
    queryKey,
    () => DatabaseService.getLeaderboard(type, timeFilter, leaderboardType),
    {
      initialData: [],
    }
  );
};


// --- Achievement Hooks ---
export const useAchievements = (): UseQueryResult<Achievement[], Error> => {
  return useQuery<Achievement[], Error>(
    'achievements',
    () => DatabaseService.getAchievements(),
    {
      initialData: [],
    }
  );
};

export const useUserAchievements = (): UseQueryResult<UserAchievement[], Error> => {
  const { user } = useAuth();
  const queryKey = ['userAchievements', user?.uid];

  return useQuery<UserAchievement[], Error>(
    queryKey,
    () => {
      if (!user?.uid) return [];
      return DatabaseService.getUserAchievements(user.uid);
    },
    {
      enabled: !!user?.uid,
      initialData: [],
    }
  );
};