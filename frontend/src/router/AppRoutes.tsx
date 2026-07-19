import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DocsPage from '@/pages/DocsPage';
import PricingPage from '@/pages/PricingPage';

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

        {/* Pricing */}
        <Route path="/pricing" element={<PricingPage />} />

        {/* Unified Documentation Routes (Public) */}
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:pageId" element={<DocsPage />} />

        {/* Legacy Features Redirects */}
        <Route path="/features/:pageId" element={<FeaturesRedirect />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
