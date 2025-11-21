import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { theme } from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/routing';
import ErrorBoundary from './components/common/ErrorBoundary';
import Dashboard from './pages/Dashboard/Dashboard';
import AllComplaints from './pages/AllComplaints';
import UserManagement from './pages/UserManagement';
import AdminChatPage from './pages/AdminChatPage';
import CategoryAnalytics from './pages/CategoryAnalytics';
import CityCorporationManagement from './pages/CityCorporationManagement';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '8px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
        <AuthProvider>
          <LanguageProvider>
            <Router>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complaints"
                  element={
                    <ProtectedRoute>
                      <AllComplaints />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chats"
                  element={
                    <ProtectedRoute>
                      <AdminChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chats/:complaintId"
                  element={
                    <ProtectedRoute>
                      <AdminChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/categories"
                  element={
                    <ProtectedRoute>
                      <CategoryAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/city-corporations"
                  element={
                    <ProtectedRoute>
                      <CityCorporationManagement />
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
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
