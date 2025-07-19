import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  FileText, 
  Mic, 
  User, 
  Trophy, 
  Settings, 
  LogOut,
  X,
  BookOpen,
  Award,
  TreePine
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/app/dashboard' },
    { icon: TreePine, label: 'Skill Tree', path: '/app/skills' },
    { icon: FileText, label: 'Case Prep', path: '/app/case-prep' },
    { icon: Mic, label: 'Live Debate', path: '/app/live-debate' },
    { icon: Trophy, label: 'Leaderboard', path: '/app/leaderboard' },
    { icon: User, label: 'Profile', path: '/app/profile' },
  ];

  if (profile?.isAdmin) {
    navItems.push({ icon: Settings, label: 'Admin', path: '/app/admin' });
  }

  const NavItem = ({ item }: { item: { path: string; label: string; icon: React.ElementType } }) => (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) => `
        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
        ${isActive 
          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DebateAI</span>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name} 
                  className="w-10 h-10 rounded-full object-cover" 
                />
              ) : (
                <span className="text-white font-medium">
                  {profile?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{profile?.name}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Award className="w-3 h-3 flex-shrink-0" />
                <span>Level {profile?.level}</span>
                <span>•</span>
                <span className="truncate">{profile?.xp} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;