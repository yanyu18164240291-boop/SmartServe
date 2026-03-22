import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  let role = 'user';
  if (user) {
    try { role = JSON.parse(user).role; } catch (e) {}
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-logo">SmartServe AI</div>
      <div className="header-nav">
        {token && (
          <>
            {role === 'admin' && (
              <Link to="/admin/kb" className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                管理端
              </Link>
            )}
            <Link to="/chat" className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>
              用户端
            </Link>
            <div className="nav-link" onClick={handleLogout} style={{color: '#ef4444'}}>退出登录</div>
          </>
        )}
      </div>
    </header>
  );
}
