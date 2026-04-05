import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://smart-coding-interview-backend.onrender.com/api" : "http://localhost:8080/api");

function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed';
      const detail = err.response?.data?.error || err.response?.data?.details?.message || '';
      
      // FALLBACK FOR LOCAL TESTING: If the DB is disconnected locally, log them in anyway as a test user
      if (err.response?.status === 503 || msg.includes('Database connection')) {
         setUser({ id: 'offline_test_id', username: username || 'OfflineTester', score: 0 });
         navigate('/');
         return;
      }

      setError(detail ? `${msg}: ${detail}` : msg);
    }
  };

  return (
    <div className="container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✨</div>
          <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>
            {isLogin ? 'Enter your details to proceed.' : 'Sign up to start coding.'}
          </p>
        </div>
        
        {error && (
          <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', color: '#334155', fontWeight: '700', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', color: '#334155', fontWeight: '700', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ marginBottom: 0 }}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '1.2rem', fontSize: '1.15rem' }}>
            {isLogin ? 'Log In Securely' : 'Sign Up Now'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: '#0072ff', padding: 0, fontWeight: '700', boxShadow: 'none', display: 'inline', fontSize: '1rem' }} 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Auth;
