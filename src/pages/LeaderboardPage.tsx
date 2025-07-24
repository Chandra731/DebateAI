import React, { useState } from 'react';
import { Trophy, Medal, Award, Users, Crown, Star, Zap, Mic, TreePine, icons } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLeaderboard, useProfile, useAchievements } from '../hooks/useDatabase';
import { Profile, Achievement } from '../types';

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('global');
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [leaderboardType, setLeaderboardType] = useState('debate'); // 'debate' or 'skill'
  
  const { data: leaderboard, isLoading: loading } = useLeaderboard(activeTab, timeFilter, leaderboardType);
  const { data: popularAchievements } = useAchievements();

  const tabs = [
    { id: 'global', label: 'Global', icon: Trophy },
    { id: 'school', label: 'My School', icon: Users },
    { id: 'friends', label: 'Friends', icon: Star },
  ];

  const timeFilters = [
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'allTime', label: 'All Time' },
  ];

  const contentTabs = [
    { id: 'debate', label: 'Debate Leaderboard', icon: Mic },
    { id: 'skill', label: 'Skill Leaderboard', icon: TreePine },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getBadgeColor = (level: number) => {
    if (level >= 8) return 'bg-purple-100 text-purple-800';
    if (level >= 6) return 'bg-blue-100 text-blue-800';
    if (level >= 4) return 'bg-green-100 text-green-800';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getBadgeText = (level: number) => {
    if (level >= 8) return 'Master';
    if (level >= 6) return 'Expert';
    if (level >= 4) return 'Advanced';
    if (level >= 2) return 'Intermediate';
    return 'Beginner';
  };

  const userRank = leaderboard?.findIndex(leader => leader.id === profile?.id) + 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🏆 Leaderboard</h1>
            <p className="text-primary-100">
              Compete with debaters across India and climb to the top!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Time Filter */}
          <div className="flex space-x-2">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === filter.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* New: Leaderboard Type Tabs (Debate vs. Skill) */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {contentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeaderboardType(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                leaderboardType === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {leaderboardType === 'debate' ? 'Debate Rankings' : 'Skill Rankings'} ({activeTab === 'global' ? 'Global' : activeTab === 'school' ? 'My School' : 'Friends'})
              </h2>
            </div>

            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      {leaderboardType === 'debate' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard?.map((leader: Profile, index: number) => {
                      const rank = index + 1;
                      const winRate = leader.total_debates > 0 
                        ? Math.round((leader.wins / leader.total_debates) * 100) 
                        : 0;

                      return (
                        <tr key={leader.id} className={`${leader.id === user?.uid ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getRankIcon(rank)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                                {leader.name?.charAt(0) || 'U'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {leader.name} {leader.id === user?.uid && (<span className="text-primary-600">(You)</span>)}
                                </div>
                                <div className="text-sm text-gray-500">{leader.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {leader.school || 'N/A'}
                          </td>
                          {leaderboardType === 'debate' ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leader.xp}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leader.level}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{winRate}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leader.streak || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leader.xp}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leader.level}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {leaderboard?.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No rankings available yet.</p>
                    <p className="text-sm">Start {leaderboardType === 'debate' ? 'debating' : 'learning'} to appear on the leaderboard!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Rank */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Ranking</h3>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl font-bold">
                  #{userRank || '--'}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{profile?.xp || 0} XP</div>
              <div className="text-sm text-gray-500 mb-3">
                Level {profile?.level || 1} • {profile?.total_debates && profile.total_debates > 0 
                  ? `${Math.round((profile.wins / profile.total_debates) * 100)}%` 
                  : '0%'} Win Rate • {profile?.streak || 0} Day Streak
              </div>
              {userRank && userRank > 10 && (
                <div className="text-xs text-gray-500">
                  You&apos;re {((userRank - 10) * 50)} XP away from the top 10!
                </div>
              )}
            </div>
          </div>

          {/* Weekly Challenge */}
          <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-6 border border-accent-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Challenge</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-accent-600" />
                <span className="text-gray-700">Win 5 debates this week</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-accent-500 h-2 rounded-full" style={{width: `${Math.min(100, (profile?.wins || 0) * 20)}%`}}></div>
              </div>
              <div className="text-sm text-gray-600">{Math.min(5, profile?.wins || 0)}/5 completed</div>
              <div className="text-xs text-accent-600 font-medium">Reward: 100 XP + Champion Badge</div>
            </div>
          </div>

          {/* Top Achievements */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Achievements</h3>
            <div className="space-y-3">
              {popularAchievements?.slice(0, 5).map((achievement: Achievement, index: number) => {
                const IconComponent = icons[achievement.icon as keyof typeof icons] || Trophy; // Default to Trophy
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-6 h-6 text-primary-500" />
                      <span className="text-gray-700 font-medium">{achievement.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{achievement.xp_reward} XP</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-xl p-6 border border-secondary-200">
            <div className="text-center">
              <div className="text-3xl mb-3">💪</div>
              <blockquote className="text-gray-700 italic mb-2">
                "The best debaters aren't born, they're made through practice and perseverance."
              </blockquote>
              <div className="text-sm text-gray-500">- DebateAI Team</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;