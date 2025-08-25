import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>営業管理システム</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="btn login-btn"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
        }
        
        .login-card {
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }
        
        .login-card h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #1976d2;
        }
        
        .login-btn {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          margin-top: 10px;
        }
        
        .error-message {
          color: #d32f2f;
          margin: 10px 0;
          padding: 10px;
          background-color: #ffebee;
          border-radius: 4px;
          border-left: 4px solid #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default Login;