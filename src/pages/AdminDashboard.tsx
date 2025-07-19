import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Settings,
  PlusCircle,
  Edit,
  Trash2,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminDashboard } from '../hooks/useAdmin';
import { Topic, Profile, Debate } from '../types';

// Placeholder for a modal component
const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      {children}
      <button onClick={onClose} className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Close</button>
    </div>
  </div>
);

const TopicForm = ({ topic, onSave, onCancel }: { topic?: Topic, onSave: (data: Partial<Topic>) => void, onCancel: () => void }) => {
  const [title, setTitle] = useState(topic?.title || '');
  const [description, setDescription] = useState(topic?.description || '');
  const [category, setCategory] = useState(topic?.category || 'General');
  const [difficulty, setDifficulty] = useState(topic?.difficulty_level || 1);
  const [isActive, setIsActive] = useState(topic?.is_active === undefined ? true : topic.is_active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, category, difficulty_level: difficulty, is_active: isActive });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">{topic ? 'Edit Topic' : 'Add New Topic'}</h2>
      <div className="space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded" />
        <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full p-2 border rounded">
          <option value={1}>Beginner</option>
          <option value={2}>Intermediate</option>
          <option value={3}>Advanced</option>
        </select>
        <label className="flex items-center">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="mr-2" />
          Active
        </label>
      </div>
      <div className="mt-6 flex justify-end space-x-4">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg">{topic ? 'Save Changes' : 'Add Topic'}</button>
      </div>
    </form>
  );
};


const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('overview');
  const {
    loading,
    stats,
    recentUsers,
    recentDebates,
    topics,
    addTopic,
    updateTopic,
    deleteTopic,
  } = useAdminDashboard();
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const handleAddTopicClick = () => {
    setEditingTopic(null);
    setIsTopicModalOpen(true);
  };

  const handleEditTopicClick = (topic: Topic) => {
    setEditingTopic(topic);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (data: Partial<Topic>) => {
    try {
      if (editingTopic) {
        await updateTopic({ topicId: editingTopic.id, updates: data });
        showNotification({ type: 'success', title: 'Topic Updated', message: 'Topic has been successfully updated.' });
      } else {
        await addTopic(data as Omit<Topic, 'id' | 'created_at'>);
        showNotification({ type: 'success', title: 'Topic Added', message: 'New topic has been successfully added.' });
      }
      setIsTopicModalOpen(false);
    } catch (error) {
      showNotification({ type: 'error', title: 'Save Failed', message: 'Failed to save topic.' });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      await deleteTopic(topicId);
      showNotification({
        type: 'success',
        title: 'Topic Deleted',
        message: 'Topic has been successfully deleted'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete topic'
      });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'debates', label: 'Debates', icon: MessageSquare },
    { id: 'content', label: 'Content', icon: Edit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user && !user.isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {isTopicModalOpen && (
        <Modal onClose={() => setIsTopicModalOpen(false)}>
          <TopicForm topic={editingTopic} onSave={handleSaveTopic} onCancel={() => setIsTopicModalOpen(false)} />
        </Modal>
      )}
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your DebateAI platform</p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-6 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalUsers}</div>
                  <div className="text-sm text-gray-600 mb-2">Total Users</div>
                  <div className="text-xs text-green-600 font-medium">+12% this month</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.activeDebates}</div>
                  <div className="text-sm text-gray-600 mb-2">Active Debates</div>
                  <div className="text-xs text-green-600 font-medium">+8% this month</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalSessions}</div>
                  <div className="text-sm text-gray-600 mb-2">Total Sessions</div>
                  <div className="text-xs text-green-600 font-medium">+23% this month</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.avgSessionTime}</div>
                  <div className="text-sm text-gray-600 mb-2">Avg. Session Time</div>
                  <div className="text-xs text-green-600 font-medium">+5% this month</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {recentUsers?.slice(0, 5).map((user: Profile) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.school || 'No school'}</div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Level {user.level}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.created_at ? new Date(user.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Debates</h3>
                  <div className="space-y-3">
                    {recentDebates?.slice(0, 5).map((debate: Debate) => (
                      <div key={debate.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {debate.topic_title || 'Unknown Topic'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {debate.transcript?.length || 0} participants
                          </div>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          debate.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : debate.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {debate.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">School</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Debates</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentUsers?.map((user: Profile) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.id}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{user.school || 'Not specified'}</td>
                        <td className="py-3 px-4 text-gray-700">Level {user.level}</td>
                        <td className="py-3 px-4 text-gray-700">{user.total_debates}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {user.created_at ? new Date(user.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-primary-600 hover:text-primary-700">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Content Management</h3>
                <button onClick={handleAddTopicClick} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Topic</span>
                </button>
              </div>

              <div className="grid gap-4">
                {topics?.map((topic: Topic) => (
                  <div key={topic.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{topic.title}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Category: {topic.category || 'General'}</span>
                          <span>Level: {topic.difficulty_level}</span>
                          <span>Created: {topic.created_at ? new Date(topic.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {topic.description && (
                          <p className="text-gray-600 mt-2">{topic.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          topic.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {topic.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => handleEditTopicClick(topic)} className="text-primary-600 hover:text-primary-700">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Settings</h3>
              
              <div className="grid gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">AI Configuration</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">AI Response Delay</label>
                      <select className="border border-gray-300 rounded-lg px-3 py-2">
                        <option>2 seconds</option>
                        <option>3 seconds</option>
                        <option>5 seconds</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Max Debate Duration</label>
                      <select className="border border-gray-300 rounded-lg px-3 py-2">
                        <option>15 minutes</option>
                        <option>20 minutes</option>
                        <option>30 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">User Permissions</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                      <span className="ml-2 text-gray-700">Allow user profile editing</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                      <span className="ml-2 text-gray-700">Enable public leaderboards</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-gray-700">Allow topic suggestions</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;