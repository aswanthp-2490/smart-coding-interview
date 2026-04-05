import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://smart-coding-interview-backend.onrender.com/api" : "http://localhost:8080/api");

function Questions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/questions`).then(res => {
      setQuestions(res.data);
    }).catch(err => {
      const msg = err.response?.data?.message || 'Error fetching questions';
      const detail = err.response?.data?.error || err.response?.data?.details?.message || '';
      setError(detail ? `${msg}: ${detail}` : msg);
      console.error('Fetch questions error:', err);
    });
  }, []);

  return (
    <div className="container fade-in">
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '900px', margin: '2rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="gradient-text" style={{ fontSize: '2.8rem', marginBottom: '1rem' }}>Available Challenges</h2>
          {error ? (
            <div style={{ color: 'red', background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid red', marginTop: '1rem' }}>
              {error}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Select a programming challenge below to begin your smart interview. The timer will start immediately.</p>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map(q => (
            <div key={q.id} className="question-item">
              <div>
                <h3 style={{ color: '#1e293b', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>{q.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="colorful-label">Difficulty</span>
                  <span className={`difficulty-${q.difficulty}`} style={{ fontSize: '1.1rem' }}>{q.difficulty}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right', marginRight: '1rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
                  ⏱️ {Math.floor(q.timeLimit / 60)} mins
                </div>
                <button 
                  onClick={() => navigate(`/editor/${q.id}`)}
                  style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Attempt Challenge <span style={{ fontSize: '1.2rem' }}>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Questions;
