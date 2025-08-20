import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'ダッシュボード' },
    { path: '/projects', label: '案件管理' },
    { path: '/action-log/record', label: 'ログ記録' },
    { path: '/action-log/list', label: 'アクションログ' },
    { path: '/orders', label: '受注管理' },
    { path: '/users', label: '担当者マスタ' },
    { path: '/kpi', label: 'KPI管理' },
    { path: '/performance', label: '実績入力' },
    { path: '/proposal-menu', label: '提案メニューマスタ' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">営業管理システム</h1>
          <nav className="nav">
            <button 
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              ☰
            </button>
            <ul className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className="nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button onClick={handleLogout} className="btn btn-secondary">
            ログアウト
          </button>
        </div>
      </header>
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .header {
          background-color: #1976d2;
          color: white;
          padding: 0 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }
        
        .nav {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        
        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .nav-menu {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 20px;
        }
        
        .nav-link {
          color: white;
          text-decoration: none;
          padding: 10px 15px;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .main-content {
          flex: 1;
          padding: 20px 0;
        }
        
        @media (max-width: 768px) {
          .menu-toggle {
            display: block;
          }
          
          .nav-menu {
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            background-color: #1976d2;
            flex-direction: column;
            display: none;
            padding: 20px;
          }
          
          .nav-menu.open {
            display: flex;
          }
          
          .nav-link {
            display: block;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;