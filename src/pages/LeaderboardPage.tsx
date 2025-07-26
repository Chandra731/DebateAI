import React, { useState } from 'react';
import { Trophy, Medal, Award, Users, Crown, Star, Zap, Mic, TreePine, AlertCircle, icons } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLeaderboard, useProfile, useAchievements } from '../hooks/useDatabase';
import { Profile, Achievement } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // --- Local State for Filters ---
  const [activeTab, setActiveTab] = useState('global');
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [leaderboardType, setLeaderboardType] = useState<'debate' | 'skill'>('debate');
  
  // --- Data Fetching ---
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: leaderboard, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard(activeTab, timeFilter, leaderboardType);
  const { data: popularAchievements, isLoading: achievementsLoading, error: achievementsError } = useAchievements();

  // --- Consolidated State ---
  const isLoading = profileLoading || leaderboardLoading || achievementsLoading;
  const error = profileError || leaderboardError || achievementsError;

  const userRank = React.useMemo(() => 
    leaderboard?.findIndex(leader => leader.id === profile?.id) + 1
  , [leaderboard, profile]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</span>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800">Failed to Load Leaderboard</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
        <p className="text-primary-100">Compete with debaters and climb to the top!</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Leaderboard Filters</h2>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Active Tab Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'global' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'friends' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Friends (Coming Soon)
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeFilter('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeFilter === 'weekly' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeFilter('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeFilter === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeFilter('allTime')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeFilter === 'allTime' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Leaderboard Type Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setLeaderboardType('debate')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                leaderboardType === 'debate' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Debate Wins
            </button>
            <button
              onClick={() => setLeaderboardType('skill')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                leaderboardType === 'skill' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Skill XP
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {leaderboardType === 'debate' ? 'Wins' : 'XP'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard?.map((leader, index) => (
                <tr key={leader.id} className={leader.id === user?.uid ? 'bg-primary-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(index + 1)}
                      <span>{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leader.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {leaderboardType === 'debate' ? leader.wins : leader.xp}
                  </td>
                </tr>
              ))}
              {leaderboard?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No data available for this leaderboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Your Rank */}
      {profile && userRank && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Rank</h3>
            <p className="text-gray-600">See where you stand among other debaters.</p>
          </div>
          <div className="flex items-center space-x-2">
            {getRankIcon(userRank)}
            <span className="text-2xl font-bold text-primary-600">#{userRank}</span>
          </div>
        </div>
      )}

      {/* Popular Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Achievements</h3>
        {achievementsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularAchievements?.slice(0, 6).map((achievement: Achievement) => {
              const IconComponent = icons[achievement.icon as keyof typeof icons] || Star; // Fallback to Star
              return (
                <div key={achievement.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                  <IconComponent className="w-6 h-6 text-yellow-500" />
                  <div>
                    <div className="font-medium text-gray-900">{achievement.name}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                </div>
              );
            })}
            {popularAchievements?.length === 0 && (
              <p className="text-sm text-gray-500 text-center col-span-full">No achievements found.</p>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default LeaderboardPage;
