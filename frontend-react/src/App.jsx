import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `/api`;
import Auth from './components/Auth';
import Questions from './components/Questions';
import Editor from './components/Editor';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    // Initial heartbeat
    axios.post(`${API_URL}/heartbeat`, { username: user.username }).catch(console.error);
    
    // Set up interval for heartbeat every 10 seconds
    const interval = setInterval(() => {
      axios.post(`${API_URL}/heartbeat`, { username: user.username }).catch(console.error);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    if (user) {
      try {
        await axios.post(`${API_URL}/logout`, { username: user.username });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <nav className="topnav">
          <h2>Smart Interview</h2>
          <div className="nav-links">
            {user ? (
              <>
                <span style={{marginRight: '1rem', fontWeight: '500'}}>
                  Welcome, {user.username} <span style={{color: '#10b981', marginLeft: '0.5rem'}}>(Score: {user.score || 0})</span>
                </span>
                <Link to="/">Questions</Link>
                <button onClick={handleLogout} style={{marginLeft: '1rem'}}>Logout</button>
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/login" element={<Auth setUser={setUser} />} />
            <Route 
              path="/" 
              element={user ? <Questions /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/editor/:id" 
              element={<Editor user={user} setUser={setUser} />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
