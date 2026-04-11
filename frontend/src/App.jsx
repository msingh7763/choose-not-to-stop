import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MoodTracking = lazy(() => import('./pages/MoodTracking'));
const Journal = lazy(() => import('./pages/Journal'));
const Insights = lazy(() => import('./pages/Insights'));
const CrisisMode = lazy(() => import('./pages/CrisisMode'));
const AnonymousWall = lazy(() => import('./pages/AnonymousWall'));
const WellnessCoach = lazy(() => import('./pages/WellnessCoach'));
const MindCareStudio = lazy(() => import('./pages/MindCareStudio'));

const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-electric-500"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Layout>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mood"
                  element={
                    <ProtectedRoute>
                      <MoodTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/journal"
                  element={
                    <ProtectedRoute>
                      <Journal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <Insights />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach"
                  element={
                    <ProtectedRoute>
                      <WellnessCoach />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mind-care"
                  element={
                    <ProtectedRoute>
                      <MindCareStudio />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/crisis"
                  element={
                    <ProtectedRoute>
                      <CrisisMode />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wall"
                  element={
                    <ProtectedRoute>
                      <AnonymousWall />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;

