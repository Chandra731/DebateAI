/**
 * @file useAdmin.ts
 * @description This hook provides all the necessary data and mutation functions for the admin dashboard.
 * It uses react-query to fetch and cache data from the DatabaseService, ensuring the UI is always up-to-date.
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { DatabaseService } from '../services/database';
import { Profile, Topic } from '../types';

export const useAdminDashboard = () => {
  const queryClient = useQueryClient();

  // --- QUERIES ---
  // Fetches general statistics for the admin overview.
  const { data: stats, isLoading: statsLoading } = useQuery('adminStats', DatabaseService.getAdminDashboardStats);
  // Fetches a list of all users for the user management table.
  const { data: users, isLoading: usersLoading } = useQuery('adminAllUsers', DatabaseService.getAllUsers);
  // Fetches the 5 most recent debates for the overview.
  const { data: recentDebates, isLoading: recentDebatesLoading } = useQuery('adminRecentDebates', () => DatabaseService.getAdminRecentDebates(5));
  // Fetches all debate topics for the content management section.
  const { data: topics, isLoading: topicsLoading } = useQuery('adminTopics', DatabaseService.getAdminTopics);

  // --- MUTATIONS ---
  // Mutation for adding a new topic.
  const addTopic = useMutation(DatabaseService.addTopic, {
    onSuccess: () => {
      // When a topic is added, invalidate the topics query to refetch the list.
      queryClient.invalidateQueries('adminTopics');
    },
  });

  // Mutation for updating an existing topic.
  const updateTopic = useMutation(({ topicId, updates }: { topicId: string, updates: Partial<Topic> }) => 
    DatabaseService.updateTopic(topicId, updates), {
    onSuccess: () => {
      queryClient.invalidateQueries('adminTopics');
    },
  });

  // Mutation for deleting a topic.
  const deleteTopic = useMutation(DatabaseService.deleteTopic, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminTopics');
    },
  });

  // Mutation for updating a user's profile (e.g., granting admin rights).
  const updateUser = useMutation(({ userId, updates }: { userId: string, updates: Partial<Profile> }) => 
    DatabaseService.updateProfile(userId, updates), {
    onSuccess: () => {
      // When a user is updated, invalidate the users query to refetch the list.
      queryClient.invalidateQueries('adminAllUsers');
    },
  });

  // Mutation for deleting a user.
  const deleteUser = useMutation(DatabaseService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminAllUsers');
    },
  });

  // --- RETURN VALUE ---
  // The hook returns all the data and mutation functions needed by the AdminDashboard component.
  return {
    loading: statsLoading || usersLoading || recentDebatesLoading || topicsLoading,
    stats,
    users,
    recentDebates,
    topics,
    addTopic: addTopic.mutateAsync,
    updateTopic: updateTopic.mutateAsync,
    deleteTopic: deleteTopic.mutateAsync,
    updateUser: updateUser.mutateAsync,
    deleteUser: deleteUser.mutateAsync,
  };
};