import { useQuery, useMutation, useQueryClient } from 'react-query';
import { DatabaseService } from '../services/database';

export const useAdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery('adminStats', DatabaseService.getAdminDashboardStats);
  const { data: recentUsers, isLoading: recentUsersLoading } = useQuery('adminRecentUsers', () => DatabaseService.getAdminRecentUsers(5));
  const { data: recentDebates, isLoading: recentDebatesLoading } = useQuery('adminRecentDebates', () => DatabaseService.getAdminRecentDebates(5));
  const { data: topics, isLoading: topicsLoading } = useQuery('adminTopics', DatabaseService.getAdminTopics);

  const addTopic = useMutation(DatabaseService.addTopic, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminTopics');
    },
  });

  const updateTopic = useMutation(({ topicId, updates }) => DatabaseService.updateTopic(topicId, updates), {
    onSuccess: () => {
      queryClient.invalidateQueries('adminTopics');
    },
  });

  const deleteTopic = useMutation(DatabaseService.deleteTopic, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminTopics');
    },
  });

  return {
    loading: statsLoading || recentUsersLoading || recentDebatesLoading || topicsLoading,
    stats,
    recentUsers,
    recentDebates,
    topics,
    addTopic: addTopic.mutateAsync,
    updateTopic: updateTopic.mutateAsync,
    deleteTopic: deleteTopic.mutateAsync,
  };
};