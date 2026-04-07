import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function RegisterPage() {
  const { register, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'done'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e) {
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
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const result = await register(email, password);
    if (result.error) { setError(result.error); return; }
    if (result.needsConfirm) { setStep('confirm'); return; }
    setStep('done');
    setTimeout(() => navigate('/login'), 1500);
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    if (!code) { setError('Please enter the verification code.'); return; }
    const result = await confirmRegistration(email, code.trim());
    if (result.error) { setError(result.error); return; }
    setStep('done');
    setTimeout(() => navigate('/login', { state: { message: 'Account verified! Please sign in.' } }), 1500);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚓ PortSync</div>
        <h2 className="auth-title">
          {step === 'confirm' ? 'Verify Email' : 'Create Account'}
        </h2>
        <p className="auth-subtitle">Smart Ocean Shipping Tracker</p>

        {step === 'done' && (
          <div className="auth-success">Account verified! Redirecting to sign in…</div>
        )}

        {step === 'form' && (
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
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <span className="password-hint">
                Min. 8 characters · uppercase · lowercase · number · special character (!@#$%^&*)
              </span>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-btn">Create Account</button>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleConfirm} className="auth-form">
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              A verification code was sent to <strong>{email}</strong>. Check your inbox.
            </p>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={e => setCode(e.target.value)}
                autoFocus
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-btn">Verify Email</button>
            <button
              type="button"
              className="auth-btn"
              style={{ background: 'none', color: '#64748b', boxShadow: 'none', marginTop: '0.5rem' }}
              onClick={() => { setStep('form'); setError(''); }}
            >
              ← Back
            </button>
          </form>
        )}

        {step === 'form' && (
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
}
