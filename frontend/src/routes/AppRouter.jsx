import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import DeckListPage from '../pages/DeckListPage';
import DeckDetailPage from '../pages/DeckDetailPage';
import StudyPage from '../pages/StudyPage';
import StudyResultPage from '../pages/StudyResultPage';
import StatisticsPage from '../pages/StatisticsPage';
import SettingsPage from '../pages/SettingsPage';
import AdminPage from '../pages/AdminPage';
import AdminMemberPage from '../pages/AdminMemberPage';
import AdminMemberDecksPage from '../pages/AdminMemberDecksPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children ?? <AdminPage />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="decks" element={<DeckListPage />} />
          <Route path="decks/:id" element={<DeckDetailPage />} />
          <Route path="study/result" element={<StudyResultPage />} />
          <Route path="study/:deckId" element={<StudyPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminRoute />} />
          <Route path="admin/members/:userId" element={<AdminRoute><AdminMemberPage /></AdminRoute>} />
          <Route path="admin/members/:userId/decks" element={<AdminRoute><AdminMemberDecksPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
