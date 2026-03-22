import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserChat from './pages/UserChat';
import AdminKB from './pages/AdminKB';
import AdminDoc from './pages/AdminDoc';
import Header from './components/Header';
import './App.css';

function App() {
  const ProtectedRoute = ({ children, requireAdmin }: { children: JSX.Element, requireAdmin?: boolean }) => {
    const token = localStorage.getItem('token');
    let currentRole = 'user';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { currentRole = JSON.parse(userStr).role; } catch (e) {}
    }
    if (!token) return <Navigate to="/login" />;
    if (requireAdmin && currentRole !== 'admin') return <Navigate to="/chat" />;
    return children;
  };

  const getFallbackRoute = () => {
    const token = localStorage.getItem('token');
    if (!token) return '/login';
    const userStr = localStorage.getItem('user');
    let role = 'user';
    if (userStr) {
      try { role = JSON.parse(userStr).role; } catch (e) {}
    }
    return role === 'admin' ? '/admin/kb' : '/chat';
  };

  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <UserChat />
              </ProtectedRoute>
            } />
            <Route path="/admin/kb" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminKB />
              </ProtectedRoute>
            } />
            <Route path="/admin/doc" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDoc />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to={getFallbackRoute()} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
