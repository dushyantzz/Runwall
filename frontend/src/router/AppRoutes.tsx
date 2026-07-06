import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import DocsPage from '@/pages/DocsPage';

function FeaturesRedirect() {
  const { pageId } = useParams<{ pageId: string }>();
  return <Navigate to={`/docs/${pageId}`} replace />;
}

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Unified Documentation Routes (Protected) */}
        <Route path="/docs" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
        <Route path="/docs/:pageId" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />

        {/* Legacy Features Redirects */}
        <Route path="/features/:pageId" element={<FeaturesRedirect />} />

        {/* Placeholder routes */}
        <Route path="/pricing" element={<HomePage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
