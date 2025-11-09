import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { theme } from './styles/theme';
import Dashboard from './pages/Dashboard/Dashboard';
import AllComplaints from './pages/AllComplaints';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/complaints" element={<AllComplaints />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          {/* Other routes will be added here */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
