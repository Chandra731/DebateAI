import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import SetupGuide from './components/common/SetupGuide';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CasePrepPage from './pages/CasePrepPage';
import LiveDebatePage from './pages/LiveDebatePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';
import SkillTreePage from './pages/SkillTreePage';
import LessonPage from './pages/LessonPage';
import DebateResultsPage from './pages/DebateResultsPage';
import ExercisePage from './pages/ExercisePage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { isFirebaseConfigured } from './utils/firebaseConfig';

function App() {
  if (!isFirebaseConfigured()) {
    return <SetupGuide />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="skills" element={<SkillTreePage />} />
                  <Route path="skills/:skillId/lessons/:lessonId" element={<LessonPage />} />
                  <Route path="skills/:skillId/lessons/:lessonId/exercises/:exerciseId" element={<ExercisePage />} />
                  <Route path="case-prep" element={<CasePrepPage />} />
                  <Route path="live-debate" element={<LiveDebatePage />} />
                  <Route path="debate-results/:debateId" element={<DebateResultsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="admin" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;