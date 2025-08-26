import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const InitializeAuth = () => {
  const [email, setEmail] = useState('admin@buzzsalesmgr.com');
  const [password, setPassword] = useState('Admin@123456');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setMessage(`ユーザー作成成功: ${userCredential.user.email}`);
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage('このメールアドレスは既に使用されています');
      } else {
        setMessage(`エラー: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Firebase Authentication 初期設定</h1>
      <div style={{ marginBottom: '20px' }}>
        <p>テスト用ユーザーを作成します</p>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          メールアドレス:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px',
              fontSize: '14px'
            }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          パスワード:
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px',
              fontSize: '14px'
            }}
          />
        </label>
      </div>
      
      <button 
        onClick={handleCreateUser}
        disabled={loading}
        style={{ 
          padding: '10px 20px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? '作成中...' : 'ユーザー作成'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: message.includes('成功') ? '#e8f5e9' : '#ffebee',
          color: message.includes('成功') ? '#2e7d32' : '#c62828',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>使用方法:</h3>
        <ol>
          <li>上記のメールアドレスとパスワードでユーザーを作成</li>
          <li>作成後、/login ページでログイン可能</li>
          <li>Firebase Console でも確認可能</li>
        </ol>
      </div>
    </div>
  );
};

export default InitializeAuth;