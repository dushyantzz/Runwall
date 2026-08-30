import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import HomePage from '@/pages/HomePage';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy-loaded routes — only fetched when navigated to
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const DocsPage = lazy(() => import('@/pages/DocsPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));

function FeaturesRedirect() {
  const { pageId } = useParams<{ pageId: string }>();
  return <Navigate to={`/docs/${pageId}`} replace />;
}

// Minimal fallback — keeps TBT at 0ms, no layout shift
function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#000' }} />
  );
}

export function AppRoutes() {
  return (
    <AppLayout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Public Home & Pricing */}
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Documentation Routes — Strictly Authenticated */}
          <Route
            path="/docs"
            element={
              <ProtectedRoute>
                <DocsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docs/:pageId"
            element={
              <ProtectedRoute>
                <DocsPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy Features Redirects (Protected) */}
          <Route
            path="/features/:pageId"
            element={
              <ProtectedRoute>
                <FeaturesRedirect />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
