import React, { useState, useEffect } from 'react';
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
// If not authenticated, activate the splash screen to silently log in again
const ProtectedRoute: React.FC<{ children: React.ReactNode; resetSplash: () => void }> = ({ children, resetSplash }) => {
  const authenticated = authService.isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      resetSplash();
    }
  }, [authenticated, resetSplash]);

  return authenticated ? <Layout>{children}</Layout> : null;
};

const App: React.FC = () => {
  const [isSplashActive, setIsSplashActive] = useState(true);
  const resetSplash = () => setIsSplashActive(true);

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
            <ProtectedRoute resetSplash={resetSplash}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/drivers" 
          element={
            <ProtectedRoute resetSplash={resetSplash}>
              <Drivers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute resetSplash={resetSplash}>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fuel" 
          element={
            <ProtectedRoute resetSplash={resetSplash}>
              <Fuel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute resetSplash={resetSplash}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/calculator" 
          element={
            <ProtectedRoute resetSplash={resetSplash}>
              <Calculator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/job-calculator" 
          element={
            <ProtectedRoute resetSplash={resetSplash}>
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
