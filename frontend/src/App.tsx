import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Fuel from './pages/Fuel';
import Reports from './pages/Reports';
import Calculator from './pages/Calculator';
import JobCalculator from './pages/JobCalculator';
import './App.css';

// Guard for protected pages (Owner panel)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authenticated = authService.isAuthenticated();
  return authenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

// Guard for login page (prevent visiting login if already authenticated)
const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authenticated = authService.isAuthenticated();
  return authenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={
            <LoginRoute>
              <Login />
            </LoginRoute>
          } 
        />

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
