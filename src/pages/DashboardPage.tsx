import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useUserDebates, useAchievements } from '../hooks/useDatabase';
import { useLearningAnalytics } from '../hooks/useSkillTree';
import { 
  Trophy, 
  FileText,
  Mic,
  Award,
  ArrowRight,
  BookOpen,
  Zap,
  TreePine,
  Star,
  icons
} from 'lucide-react';
import { Achievement, Debate } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { debates, loading: debatesLoading } = useUserDebates();
  const { analytics, loading: analyticsLoading } = useLearningAnalytics();
  const { achievements, loading: achievementsLoading } = useAchievements();

  const stats = [
    {
      label: 'Skills Unlocked',
      value: analytics?.totalSkillsUnlocked || 0,
      icon: TreePine,
      color: 'bg-primary-500',
      change: `${analytics?.totalSkillsMastered || 0} mastered`
    },
    {
      label: 'Total Debates',
      value: profile?.total_debates || 0,
      icon: Mic,
      color: 'bg-secondary-500',
      change: ''
    },
    {
      label: 'Win Rate',
      value: profile?.total_debates && profile.total_debates > 0 
        ? `${Math.round((profile.wins / profile.total_debates) * 100)}%` 
        : '0%',
      icon: Trophy,
      color: 'bg-accent-500',
      change: ''
    },
    {
      label: 'Current Level',
      value: profile?.level || 1,
      icon: Award,
      color: 'bg-orange-500',
      change: `${profile?.xp || 0} XP`
    }
  ];

  const quickActions = [
    {
      title: 'Continue Learning',
      description: 'Resume your skill tree progress',
      icon: TreePine,
      color: 'bg-primary-500',
      link: '/app/skills',
      highlight: true
    },
    {
      title: 'Start Quick Debate',
      description: 'Jump into a practice session with AI',
      icon: Mic,
      color: 'bg-secondary-500',
      link: '/app/live-debate'
    },
    {
      title: 'Prepare New Case',
      description: 'Get AI help for your next topic',
      icon: FileText,
      color: 'bg-accent-500',
      link: '/app/case-prep'
    }
  ];

  const recentDebates = debates?.slice(0, 3).map((debate: Debate) => ({
    id: debate.id,
    topic: debate.topic_title || 'Unknown Topic',
    result: debate.winner_side === debate.side ? 'Won' : 'Lost',
    score: debate.score || 0,
    date: debate.created_at ? new Date(debate.created_at.seconds * 1000).toLocaleDateString() : 'N/A',
    opponent: debate.is_ai ? `AI Coach Level ${debate.ai_level || 3}` : 'Human Opponent'
  }));

  if (profileLoading || debatesLoading || analyticsLoading || achievementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.displayName?.split(' ')[0]}! 👋
            </h1>
            <p className="text-primary-100 mb-4">
              {analytics?.totalSkillsUnlocked && analytics?.totalSkillsUnlocked > 0 
                ? `You've unlocked ${analytics.totalSkillsUnlocked} skills! Keep learning to unlock more.`
                : 'Start your learning journey with our interactive skill tree!'
              }
            </p>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">Level {profile?.level || 1}</span>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">{profile?.xp || 0} XP</span>
              </div>
              {analytics?.totalSkillsMastered && analytics?.totalSkillsMastered > 0 && (
                <div className="bg-white/20 rounded-lg px-3 py-1">
                  <span className="text-sm font-medium">{analytics.totalSkillsMastered} Skills Mastered</span>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
            <div className="text-xs text-green-600 font-medium">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className={`flex items-center p-3 rounded-lg transition-colors group ${
                    action.highlight 
                      ? 'bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 hover:from-primary-100 hover:to-secondary-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Link 
                to="/app/profile" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Learning Progress</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-primary-50 rounded-lg p-3">
                      <div className="text-primary-600 font-semibold">{analytics.totalLessonsCompleted}</div>
                      <div className="text-gray-600">Lessons Completed</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <div className="text-secondary-600 font-semibold">{analytics.averageScore}%</div>
                      <div className="text-gray-600">Average Score</div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Debates */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Debates</h4>
                  {recentDebates && recentDebates.length > 0 ? (
                    <div className="space-y-3">
                      {recentDebates.map((debate) => (
                        <div key={debate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">{debate.topic}</div>
                            <div className="text-sm text-gray-500">
                              vs {debate.opponent} • {debate.date}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                    <div className="text-center py-6 text-gray-500">
                      <Mic className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No debates yet. Start your first debate!</p>
                      <Link 
                        to="/app/live-debate"
                        className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Start Debate <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Start learning to see your activity here!</p>
                <Link 
                  to="/app/skills"
                  className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700"
                >
                  Explore Skill Tree <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          {achievementsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {achievements?.map((achievement: Achievement) => (
                <div 
                  key={achievement.id} 
                  className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  {React.createElement(icons[achievement.icon as keyof typeof icons], { className: "text-2xl mb-2" })}
                  <div className="font-medium text-gray-700 text-sm">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {achievement.xp_reward} XP
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Progress Preview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Skill Progress</h3>
            <Link 
              to="/app/skills"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Skill Tree
            </Link>
          </div>
          
          {analytics?.skillProgress && analytics.skillProgress.length > 0 ? (
            <div className="space-y-4">
              {analytics.skillProgress.slice(0, 3).map((skill) => (
                <div key={skill.skill_id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{skill.skill?.name || 'Unknown Skill'}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          skill.is_mastered ? 'bg-yellow-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${skill.mastery_level}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium text-gray-900">{skill.mastery_level}%</div>
                    {skill.is_mastered && (
                      <Star className="w-4 h-4 text-yellow-500 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TreePine className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Start learning to track your progress!</p>
              <Link 
                to="/app/skills"
                className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700"
              >
                Begin Learning <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;