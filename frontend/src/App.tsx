import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Fuel from './pages/Fuel';
import Reports from './pages/Reports';
import Calculator from './pages/Calculator';
import JobCalculator from './pages/JobCalculator';
import SplashScreen from './components/SplashScreen';
import './App.css';

// Guard for protected pages (Owner panel)
// If not authenticated, redirect to "/" (triggers auto-login via splash screen)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authenticated = authService.isAuthenticated();
  return authenticated ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  const [isSplashActive, setIsSplashActive] = useState(true);

  if (isSplashActive) {
    return <SplashScreen onFinished={() => setIsSplashActive(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Owner Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/drivers" 
          element={
            <ProtectedRoute>
              <Drivers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fuel" 
          element={
            <ProtectedRoute>
              <Fuel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/calculator" 
          element={
            <ProtectedRoute>
              <Calculator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/job-calculator" 
          element={
            <ProtectedRoute>
              <JobCalculator />
            </ProtectedRoute>
          } 
        />

        {/* Redirect unknown routes to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
