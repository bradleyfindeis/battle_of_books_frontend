import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EntryPage } from './pages/EntryPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TeamRegisterPage } from './pages/team/TeamRegisterPage';
import { TeamLoginPage } from './pages/team/TeamLoginPage';
import { TeamDashboard } from './pages/team/TeamDashboard';
import { ChooseBookListPage } from './pages/team/ChooseBookListPage';
import { MatchingGamePage } from './pages/team/MatchingGamePage';
import { FlashcardDeckPage } from './pages/team/FlashcardDeckPage';
import { QuizPage } from './pages/team/QuizPage';
import { QuizMatchPage } from './pages/team/QuizMatchPage';
import { TeamManagementPage } from './pages/team/TeamManagementPage';
import { BooksAssignmentsPage } from './pages/team/BooksAssignmentsPage';
import { LeaderboardPage } from './pages/team/LeaderboardPage';
import { MatchHistoryPage } from './pages/team/MatchHistoryPage';
import { MyProgressPage } from './pages/team/MyProgressPage';
import { TeamActivityPage } from './pages/team/TeamActivityPage';
import { TeamLayout } from './components/TeamLayout';
import { api } from './api/client';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" />;
}

function TeamRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={isAdmin ? '/admin' : '/team/login'} replace />;
  }

  return <TeamLayout>{children}</TeamLayout>;
}

function TeamHome() {
  const { user } = useAuth();
  const [books, setBooks] = useState<{ length: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getBooks().then((data) => { if (!cancelled) setBooks(data); }).catch(() => { if (!cancelled) setBooks([]); });
    return () => { cancelled = true; };
  }, []);

  if (books === null) {
    return <LoadingSpinner />;
  }

  if (user?.role === 'team_lead' && books.length === 0) {
    return <Navigate to="/team/choose-list" replace />;
  }

  return <TeamDashboard />;
}

function ChooseListGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<{ length: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getBooks().then((data) => { if (!cancelled) setBooks(data); }).catch(() => { if (!cancelled) setBooks([]); });
    return () => { cancelled = true; };
  }, []);

  if (books === null) {
    return <LoadingSpinner />;
  }

  if (user?.role !== 'team_lead') {
    return <Navigate to="/team" replace />;
  }

  if (books.length > 0) {
    return <Navigate to="/team/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/team/register" element={<TeamRegisterPage />} />
          <Route path="/team/login" element={<TeamLoginPage />} />
          <Route path="/team" element={<TeamRoute><TeamHome /></TeamRoute>} />
          <Route path="/team/choose-list" element={<TeamRoute><ChooseListGuard><ChooseBookListPage /></ChooseListGuard></TeamRoute>} />
          <Route path="/team/dashboard" element={<TeamRoute><TeamDashboard /></TeamRoute>} />
          <Route path="/team/activity" element={<TeamRoute><TeamActivityPage /></TeamRoute>} />
          <Route path="/team/management" element={<TeamRoute><TeamManagementPage /></TeamRoute>} />
          <Route path="/team/books" element={<TeamRoute><BooksAssignmentsPage /></TeamRoute>} />
          <Route path="/team/matching-game" element={<TeamRoute><MatchingGamePage /></TeamRoute>} />
          <Route path="/team/flashcards" element={<TeamRoute><FlashcardDeckPage /></TeamRoute>} />
          <Route path="/team/quiz" element={<TeamRoute><QuizPage /></TeamRoute>} />
          <Route path="/team/leaderboard" element={<TeamRoute><LeaderboardPage /></TeamRoute>} />
          <Route path="/team/match-history" element={<TeamRoute><MatchHistoryPage /></TeamRoute>} />
          <Route path="/team/my-progress" element={<TeamRoute><MyProgressPage /></TeamRoute>} />
          <Route path="/team/quiz-match/:id" element={<TeamRoute><QuizMatchPage /></TeamRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
