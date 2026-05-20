import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnimalsPage from './pages/AnimalsPage';
import WeightsPage from './pages/WeightsPage';
import FeedPage from './pages/FeedPage';
import HealthPage from './pages/HealthPage';
import PerformancePage from './pages/PerformancePage';
import FinancialsPage from './pages/FinancialsPage';
import ForecastingPage from './pages/ForecastingPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Authentication Views */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Views */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/animals"
          element={
            <ProtectedRoute>
              <Layout>
                <AnimalsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/weights"
          element={
            <ProtectedRoute>
              <Layout>
                <WeightsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Layout>
                <FeedPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/health"
          element={
            <ProtectedRoute>
              <Layout>
                <HealthPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <Layout>
                <PerformancePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financials"
          element={
            <ProtectedRoute>
              <Layout>
                <FinancialsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forecasting"
          element={
            <ProtectedRoute>
              <Layout>
                <ForecastingPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback View */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
