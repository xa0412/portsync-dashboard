import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const err = register(email, password);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/login'), 1500);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚓ PortSync</div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Smart Ocean Shipping Tracker</p>

        {success ? (
          <div className="auth-success">
            Account created! Redirecting to login…
          </div>
        ) : (
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
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-btn">Create Account</button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>

        <div className="auth-hint">
          <strong>Dev tip:</strong> Include "premium" in email for Gov / Commercial tier.<br />
          Accounts stored locally until Cognito is connected.
        </div>
      </div>
    </div>
  );
}
