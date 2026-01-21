import { lazy, Suspense } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { theme } from './styles/theme';
import { queryClient } from './config/reactQuery';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute, RoleBasedRoute } from './components/routing';
import ErrorBoundary from './components/common/ErrorBoundary';
import PageLoadingBar from './components/common/PageLoadingBar';

// Eager load critical pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';

// Lazy load management pages for code splitting
const AllComplaints = lazy(() => import('./pages/AllComplaints'));
const ComplaintDetails = lazy(() => import('./pages/ComplaintDetails/ComplaintDetails'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AdminManagement = lazy(() => import('./pages/AdminManagement/AdminManagement'));
const SuperAdminManagement = lazy(() => import('./pages/SuperAdminManagement'));
const AdminChatPage = lazy(() => import('./pages/AdminChatPage'));
const ComplaintChatsPage = lazy(() => import('./pages/ComplaintChats'));
const LiveChatPage = lazy(() => import('./pages/LiveChat'));
const CategoryAnalytics = lazy(() => import('./pages/CategoryAnalytics'));
const CityCorporationManagement = lazy(() => import('./pages/CityCorporationManagement'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs/ActivityLogs'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const SystemControl = lazy(() => import('./pages/Settings/SystemControl'));

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
              <ProfileProvider>
                <NotificationProvider>
                  <Router
                    basename={import.meta.env.BASE_URL}
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true
                    }}
                  >
                    <Suspense fallback={<PageLoadingBar loading={true} />}>
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
                          path="/complaints/:id"
                          element={
                            <ProtectedRoute>
                              <ComplaintDetails />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admins"
                          element={
                            <ProtectedRoute>
                              <RoleBasedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
                                <AdminManagement />
                              </RoleBasedRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/super-admins"
                          element={
                            <ProtectedRoute>
                              <RoleBasedRoute allowedRoles={['MASTER_ADMIN']}>
                                <SuperAdminManagement />
                              </RoleBasedRoute>
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
                          path="/complaint-chats"
                          element={
                            <ProtectedRoute>
                              <ComplaintChatsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/live-chat"
                          element={
                            <ProtectedRoute>
                              <LiveChatPage />
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
                              <RoleBasedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
                                <CityCorporationManagement />
                              </RoleBasedRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/activity-logs"
                          element={
                            <ProtectedRoute>
                              <RoleBasedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
                                <ActivityLogs />
                              </RoleBasedRoute>
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
                        <Route
                          path="/settings/system-control"
                          element={
                            <ProtectedRoute>
                              <RoleBasedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN']}>
                                <SystemControl />
                              </RoleBasedRoute>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Suspense>
                  </Router>
                </NotificationProvider>
              </ProfileProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
