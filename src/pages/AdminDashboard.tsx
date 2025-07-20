/**
 * @file AdminDashboard.tsx
 * @description This component provides a comprehensive dashboard for administrators to manage the DebateAI platform.
 * It includes features for managing users, debate topics, and platform settings.
 *
 * @component
 * - Manages and displays platform statistics (total users, debates, etc.).
 * - Allows admins to view, search, and manage all users.
 * - Provides functionality to grant or revoke admin privileges for users.
 * - Allows admins to add, edit, and delete debate topics.
 * - Displays a tab-based interface for easy navigation between different admin sections.
 * - Handles all user interactions through modals for editing and confirming actions.
 */
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Settings,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminDashboard } from '../hooks/useAdmin';
import { Topic, Profile, Debate } from '../types';

/**
 * A generic modal component for displaying forms and confirmation dialogs.
 */
const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
      {children}
    </div>
  </div>
);

/**
 * A form for creating and editing debate topics.
 */
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

/**
 * A form for editing a user's properties, specifically their admin status.
 */
const UserForm = ({ user, onSave, onCancel }: { user: Profile, onSave: (userId: string, data: Partial<Profile>) => void, onCancel: () => void }) => {
  const [isAdmin, setIsAdmin] = useState(user.isAdmin || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, { isAdmin });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Edit User: {user.name}</h2>
      <p className="text-sm text-gray-500 mb-4">ID: {user.id}</p>
      <div className="space-y-4">
        <label className="flex items-center cursor-pointer">
          <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="sr-only peer" />
          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-900">Is Admin</span>
        </label>
      </div>
      <div className="mt-6 flex justify-end space-x-4">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg">Save Changes</button>
      </div>
    </form>
  );
};

const AdminDashboard: React.FC = () => {
  // --- CONTEXTS & HOOKS ---
  const { user: currentUser, profile } = useAuth();
  const { showNotification } = useNotification();
  const {
    loading,
    stats,
    users,
    recentDebates,
    topics,
    addTopic,
    updateTopic,
    deleteTopic,
    updateUser,
    deleteUser,
  } = useAdminDashboard();
  
  // --- STATE MANAGEMENT ---
  // Controls the currently visible tab in the dashboard.
  const [activeTab, setActiveTab] = useState('overview');
  // State for managing the topic creation/editing modal.
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  // State for managing the user editing modal.
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  // State for the user search input.
  const [searchTerm, setSearchTerm] = useState('');

  // --- EVENT HANDLERS ---
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
      showNotification({ type: 'success', title: 'Topic Deleted', message: 'Topic has been successfully deleted' });
    } catch (error) {
      showNotification({ type: 'error', title: 'Delete Failed', message: 'Failed to delete topic' });
    }
  };

  const handleEditUserClick = (user: Profile) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (userId: string, data: Partial<Profile>) => {
    try {
      await updateUser({ userId, updates: data });
      showNotification({ type: 'success', title: 'User Updated', message: 'User has been successfully updated.' });
      setIsUserModalOpen(false);
    } catch (error) {
      showNotification({ type: 'error', title: 'Update Failed', message: 'Failed to update user.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;

    try {
      await deleteUser(userId);
      showNotification({ type: 'success', title: 'User Deleted', message: 'User has been successfully deleted.' });
    } catch (error) {
      showNotification({ type: 'error', title: 'Delete Failed', message: 'Failed to delete user.' });
    }
  };

  // --- MEMOIZED VALUES ---
  // Filters the list of users based on the search term.
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // --- UI CONFIGURATION ---
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'debates', label: 'Debates', icon: MessageSquare },
    { id: 'content', label: 'Content', icon: Edit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Security check: Ensure the user is an admin before rendering the dashboard.
  if (!profile?.isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don&apos;t have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Modals for editing content */}
      {isTopicModalOpen && (
        <Modal onClose={() => setIsTopicModalOpen(false)}>
          <TopicForm topic={editingTopic} onSave={handleSaveTopic} onCancel={() => setIsTopicModalOpen(false)} />
        </Modal>
      )}
      {isUserModalOpen && editingUser && (
        <Modal onClose={() => setIsUserModalOpen(false)}>
          <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => setIsUserModalOpen(false)} />
        </Modal>
      )}

      {/* Dashboard Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {currentUser?.displayName || 'Admin'}. Manage your DebateAI platform.</p>
          </div>
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

        {/* Tab Content */}
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
                    {users?.slice(0, 5).map((user: Profile) => (
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
                          <div className="font-medium text-gray-900">{debate.topic_title || 'Unknown Topic'}</div>
                          <div className="text-sm text-gray-500">{debate.participants?.length || 0} participants</div>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          debate.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          debate.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
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
              {/* User Management Section */}
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers?.map((user: Profile) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <ShieldOff className="w-3 h-3 mr-1" />
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{user.level || 1}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {user.created_at ? new Date(user.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleEditUserClick(user)} className="text-primary-600 hover:text-primary-700 p-1">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-700 p-1">
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