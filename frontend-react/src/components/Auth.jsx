import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || `/api`;

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
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh' }}>
      <div className="glass-panel fade-in auth-form" style={{ width: '100%', maxWidth: '440px', padding: '3.5rem 3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✨</div>
          <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0' }}>
            {isLogin ? 'Welcome Back' : 'Join the Challenge'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            {isLogin ? 'Enter your details to proceed.' : 'Sign up to start coding.'}
          </p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#b91c1c', fontWeight: '500' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontSize: '0.95rem', fontWeight: '600' }}>Username</label>
            <input 
              type="text" 
              placeholder="e.g. smart_coder"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontSize: '0.95rem', fontWeight: '600' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" style={{ marginTop: '1.5rem', width: '100%', padding: '1.1rem', fontSize: '1.15rem' }}>
            {isLogin ? 'Log In Securely' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#64748b', fontSize: '1rem' }}>
          {isLogin ? "Don't have an account yet? " : "Already part of the network? "}
          <button 
            style={{ 
              background: 'none', 
              color: '#0072ff', 
              padding: 0, 
              boxShadow: 'none', 
              fontWeight: '700',
              textDecoration: 'underline',
              textUnderlineOffset: '4px'
            }} 
            onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
