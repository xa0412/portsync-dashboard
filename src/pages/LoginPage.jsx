import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const sessionMessage = location.state?.message || null;

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    // Mock login — swap with Cognito Auth.signIn() once Member 2 provides IDs
    const err = login(email, password);
    if (err) { setError(err); return; }
    navigate('/dashboard/historical');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚓ PortSync</div>
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle">Smart Ocean Shipping Tracker</p>
        {sessionMessage && <div className="auth-error">{sessionMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn">Sign In</button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <div className="auth-hint">
          <strong>Dev tip:</strong> Use any email/password to log in.<br />
          Include "premium" in email for Gov / Commercial plan. Else defaults to Free / Public. (Mock auth — Cognito coming soon)
        </div>
      </div>
    </div>
  );
}
