import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useUserDebates, useAchievements, useUserAchievements } from '../hooks/useDatabase';
import { useLearningAnalytics } from '../hooks/useSkillTree';

import { useNotification } from '../contexts/NotificationContext';
import { 
  User, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Edit,
  Camera,
  Mail,
  School,
  GraduationCap,
  Save,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Profile, Debate, Achievement, UserAchievement, LearningAnalytics } from '../types';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { debates, loading: debatesLoading } = useUserDebates();
  const { showNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({
    name: '',
    school: '',
    grade: ''
  });
  const { analytics, loading: analyticsLoading } = useLearningAnalytics();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const { userAchievements, loading: userAchievementsLoading } = useUserAchievements();

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        school: profile.school || '',
        grade: profile.grade || ''
      });
    }
  }, [profile]);

  

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      if (updateUser) {
        await updateUser({ displayName: editForm.name });
      }
      setIsEditing(false);
      showNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.'
      });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'debates', label: 'Debate History', icon: Trophy },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const recentDebates = debates?.map((debate: Debate) => ({
    id: debate.id,
    topic: debate.topic_title || 'Unknown Topic',
    result: debate.winner_side === debate.side ? 'Won' : 'Lost',
    score: debate.score || 0,
    date: debate.created_at ? new Date(debate.created_at.seconds * 1000).toLocaleDateString() : 'N/A',
    opponent: debate.is_ai ? `AI Coach Level ${debate.ai_level || 3}` : 'Human Opponent',
    duration: '15 minutes'
  }));

  const stats = [
    { 
      label: 'Total Debates', 
      value: profile?.total_debates || 0, 
      icon: Trophy, 
      color: 'text-primary-600' 
    },
    { 
      label: 'Win Rate', 
      value: profile?.total_debates && profile.total_debates > 0 
        ? `${Math.round((profile.wins / profile.total_debates) * 100)}%` 
        : '0%', 
      icon: Target, 
      color: 'text-accent-600' 
    },
    { 
      label: 'Average Score', 
      value: analytics?.averageScore || 0, 
      icon: TrendingUp, 
      color: 'text-secondary-600' 
    },
    { 
      label: 'Total XP', 
      value: profile?.xp || 0, 
      icon: Award, 
      color: 'text-orange-600' 
    }
  ];

  const skillBreakdown = analytics?.skillProgress?.map((skill) => ({
    skill: skill.skill?.name || 'Unknown Skill',
    score: skill.mastery_level,
    color: 'bg-primary-500',
  })) || [];

  const winRateData = debates?.reduce((acc, debate) => {
    const month = new Date(debate.created_at.seconds * 1000).toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { name: month, wins: 0, total: 0 };
    }
    acc[month].total++;
    if (debate.winner_side === debate.side) {
      acc[month].wins++;
    }
    return acc;
  }, {} as { [key: string]: { name: string; wins: number; total: number } });

  const winRateChartData = Object.values(winRateData || {}).map((month) => ({
    name: month.name,
    winRate: Math.round((month.wins / month.total) * 100),
  }));

  const topicPerformance = debates?.reduce((acc, debate) => {
    const topic = debate.topic_title || 'Unknown Topic';
    if (!acc[topic]) {
      acc[topic] = { name: topic, wins: 0, total: 0 };
    }
    acc[topic].total++;
    if (debate.winner_side === debate.side) {
      acc[topic].wins++;
    }
    return acc;
  }, {} as { [key: string]: { name: string; wins: number; total: number } });

  const topicPerformanceData = Object.values(topicPerformance || {}).map((topic) => ({
    name: topic.name,
    winRate: Math.round((topic.wins / topic.total) * 100),
  }));

  if (profileLoading || debatesLoading || analyticsLoading || achievementsLoading || userAchievementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) => setEditForm(prev => ({ ...prev, school: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="School/College"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={editForm.grade}
                    onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    {['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Undergraduate', 'Postgraduate'].map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center space-x-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'Unknown User'}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  {profile?.grade && (
                    <div className="flex items-center space-x-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{profile.grade}</span>
                    </div>
                  )}
                  {profile?.school && (
                    <div className="flex items-center space-x-1">
                      <School className="w-4 h-4" />
                      <span>{profile.school}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">Level {profile?.level || 1}</div>
                    <div className="text-sm text-gray-500">Current Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary-600">{profile?.xp || 0}</div>
                    <div className="text-sm text-gray-500">Total XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-600">{profile?.total_debates || 0}</div>
                    <div className="text-sm text-gray-500">Debates</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-white`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skill Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Breakdown</h3>
                <div className="space-y-4">
                  {skillBreakdown.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium w-24">{skill.skill}</span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${skill.color}`}
                            style={{ width: `${skill.score}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{skill.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'debates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Debates</h3>
              {recentDebates && recentDebates.length > 0 ? (
                <div className="space-y-3">
                  {recentDebates.map((debate) => (
                    <div key={debate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{debate.topic}</div>
                        <div className="text-sm text-gray-500">
                          vs {debate.opponent} • {debate.duration} • {debate.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          debate.result === 'Won' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {debate.result}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">Score: {debate.score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No debates yet.</p>
                  <p className="text-sm">Start your first debate to see your history here!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              {achievementsLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements && achievements.length > 0 && achievements.map((achievement) => {
                    const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
                    const isUnlocked = userAchievement?.unlocked_at;
                    
                    return (
                      <div 
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isUnlocked 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className={`font-semibold ${
                              isUnlocked ? 'text-green-800' : 'text-gray-700'
                            }`}>
                              {achievement.name}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {achievement.description}
                            </div>
                            {isUnlocked ? (
                              <div className="text-xs text-green-600">
                                Unlocked on {new Date(userAchievement.unlocked_at as string).toLocaleDateString()}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500">
                                  Progress: {userAchievement?.progress || 0}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary-500 h-2 rounded-full"
                                    style={{ width: `${userAchievement?.progress || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Reward: {achievement.xp_reward} XP
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
              
              {/* Win Rate Over Time */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Win Rate Trend</h4>
                <div className="h-48 bg-white rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={winRateChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="winRate" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Topic Performance */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Performance by Topic</h4>
                <div className="space-y-3">
                  {topicPerformanceData.map((topic, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{topic.name}</span>
                      <span className="text-green-600 font-medium">{topic.winRate}% Win Rate</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage