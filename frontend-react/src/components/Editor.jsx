import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `/api`;

function Editor({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState('js');
  const [output, setOutput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const templates = {
    js: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\n\n// Write your solution here using 'input' array\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your solution here. Read from cin, write to cout.\n  \n  return 0;\n}`,
    java: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    \n    // Write your solution here\n    \n  }\n}`
  };

  const [code, setCode] = useState(templates.js);

  useEffect(() => {
    setCode(templates[language] || '// Write your solution here\\n');
  }, [language]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    axios.get(`${API_URL}/questions`).then(res => {
      const q = res.data.find(q => q.id === id);
      if (q) {
        setQuestion(q);
        setTimeLeft(q.timeLimit);
      }
    });
  }, [id, user, navigate]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && !isSubmitting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setTimeTaken(timeTaken + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && question && !isFinished && !isSubmitting) {
      handleSubmit(); // Auto submit when time is up
    }
  }, [timeLeft, question, isFinished, isSubmitting]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsFinished(true);
    try {
      const res = await axios.post(`${API_URL}/submit`, {
        userId: user.id,
        questionId: question.id,
        code,
        language,
        timeTaken
      });
      if (setUser) {
        // Use the actual total score returned from the database for perfect sync
        const newScore = res.data.newTotalScore !== undefined ? res.data.newTotalScore : (user.score || 0) + res.data.scoreGained;
        setUser({ ...user, score: newScore });
      }
      setOutput(`Score Awarded: ${res.data.scoreGained}\nEvaluation: ${res.data.passed ? 'PASSED ✅' : 'NEEDS IMPROVEMENT ❌'}\n\nFeedback:\n${res.data.output}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setOutput(`Error submitting code: ${errorMsg}`);
      setIsFinished(false);
    }
    setIsSubmitting(false);
  };

  if (!question) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>
      <h2 style={{ color: '#64748b' }}>Loading Workspace...</h2>
    </div>
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top action bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem', marginBottom: '0' }}>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>{question.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#475569' }}>
            Difficulty: <span className={`difficulty-${question.difficulty}`} style={{ marginLeft: '0.5rem', fontSize: '1.15rem' }}>{question.difficulty}</span>
          </span>
          <div style={{ background: '#ffffff', border: '2px solid rgba(0, 198, 255, 0.3)', padding: '0.6rem 1.75rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 10px rgba(0,198,255,0.1)' }}>
            <span style={{ fontSize: '1.3rem' }}>⏳</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0072ff', fontFamily: "'Fira Code', monospace" }}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="editor-layout" style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
        {/* Left Panel: Problem Description */}
        <div className="glass-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', margin: 0, overflowY: 'auto', maxHeight: '75vh', padding: '2rem' }}>
          <h3 style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '1rem', color: '#1e293b', fontSize: '1.4rem' }}>Problem Description</h3>
          <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#475569', fontSize: '1.1rem', margin: '1.5rem 0' }}>{question.description}</p>
          
          {question.testCases && question.testCases.length > 0 && (
            <div className="test-cases">
              <h3 style={{ color: '#1e293b', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.3rem' }}>Example Test Cases</h3>
              {question.testCases.map((tc, idx) => (
                <div key={idx} style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Input:</p>
                  <pre style={{ margin: '0 0 1.25rem 0', color: '#0f172a', fontFamily: "'Fira Code', monospace", fontSize: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>{tc.input}</pre>
                  
                  <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Output:</p>
                  <pre style={{ margin: '0', color: '#059669', fontFamily: "'Fira Code', monospace", fontSize: '1rem', background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #d1fae5' }}>{tc.expectedOutput}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right Panel: Editor & Output */}
        <div className="glass-panel" style={{ flex: '1.5', display: 'flex', flexDirection: 'column', margin: 0, padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="colorful-label">Language</span>
              <select 
                value={language} 
                onChange={e => setLanguage(e.target.value)} 
                disabled={isSubmitting || isFinished || timeLeft === 0}
                style={{ margin: 0, width: 'auto', minWidth: '200px', cursor: 'pointer', fontWeight: '600' }}
              >
                <option value="js">JavaScript (Node.js)</option>
                <option value="cpp">C++ (g++)</option>
                <option value="java">Java (javac)</option>
              </select>
            </div>
            
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isFinished || timeLeft === 0}
              style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}
            >
              <span>{isSubmitting ? 'Evaluating...' : '🚀 Submit Code'}</span>
            </button>
          </div>

          <textarea 
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isSubmitting || isFinished || timeLeft === 0}
            style={{ flexGrow: 1, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
          ></textarea>

          {output && (
            <div className="fade-in" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '1.3rem' }}>Console Output</h3>
              <div className="output-window">
                {output}
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button style={{ background: '#ffffff', color: '#334155', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onClick={() => navigate('/')}>Return Home</button>
                {isFinished && timeLeft > 0 && (
                  <button 
                    onClick={() => { setIsFinished(false); setOutput(''); }}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                  >
                    ✏️ Edit Code & Retry
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Editor;
