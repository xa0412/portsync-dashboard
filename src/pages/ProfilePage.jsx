import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import './ProfilePage.css';

const SUBSCRIPTION_DAYS = 30;

const FEATURES = [
  { label: 'Real-time vessel tracking',                  free: true,  premium: true  },
  { label: 'Live vessel search & status',                free: true,  premium: true  },
  { label: 'Historical data (last 3 months)',            free: true,  premium: true  },
  { label: 'Full historical data (1995–present)',        free: false, premium: true  },
  { label: 'Date range filter on all charts',            free: false, premium: true  },
  { label: 'CSV export for operational reporting',       free: false, premium: true  },
  { label: 'Vessel calls breakdown analytics',           free: false, premium: true  },
  { label: 'REST API access (metered, for integration)', free: false, premium: true  },
  { label: 'Priority support',                           free: false, premium: true  },
];

function daysRemaining(upgradeDate) {
  if (!upgradeDate) return 0;
  const expiry = new Date(upgradeDate);
  expiry.setDate(expiry.getDate() + SUBSCRIPTION_DAYS);
  const diff = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

function expiryDate(upgradeDate) {
  if (!upgradeDate) return '—';
  const expiry = new Date(upgradeDate);
  expiry.setDate(expiry.getDate() + SUBSCRIPTION_DAYS);
  return expiry.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfilePage() {
  const { user, renew, updateUsername } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');

  function handleEditUsername() {
    setUsernameInput(user?.username || user?.email?.split('@')[0] || '');
    setUsernameError('');
    setEditingUsername(true);
  }

  function handleSaveUsername() {
    const err = updateUsername(usernameInput);
    if (err) { setUsernameError(err); return; }
    setEditingUsername(false);
  }
  const isPremium = user?.role === 'Premium';
  const daysLeft = daysRemaining(user?.upgradeDate);
  const expiry = expiryDate(user?.upgradeDate);

  return (
    <div className="profile-page">
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}

      <h1 className="page-title">Profile</h1>

      {/* User card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {(user?.username || user?.email)?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="profile-info">
          <div className="profile-username">{user?.username || user?.email?.split('@')[0]}</div>
          <div className="profile-email">{user?.email}</div>
          <div className={`profile-role ${isPremium ? 'premium' : 'free'}`}>
            {isPremium ? 'Gov / Commercial' : 'Free / Public'}
          </div>
        </div>

        {/* Premium: days remaining badge */}
        {isPremium && (
          <div className={`days-badge ${daysLeft <= 5 ? 'expiring' : ''}`}>
            <div className="days-number">{daysLeft}</div>
            <div className="days-label">days left</div>
          </div>
        )}

        {/* Free: upgrade button */}
        {!isPremium && (
          <button className="profile-upgrade-btn" onClick={() => setShowModal(true)}>
            🚢 Upgrade to Commercial
          </button>
        )}
      </div>

      {/* Account details */}
      <div className="profile-section">
        <h3>Account Details</h3>
        <div className="profile-row">
          <span>Username</span>
          {editingUsername ? (
            <span className="username-edit-group">
              <input
                className="username-input"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                maxLength={30}
                autoFocus
              />
              <button className="username-save-btn" onClick={handleSaveUsername}>Save</button>
              <button className="username-cancel-btn" onClick={() => setEditingUsername(false)}>Cancel</button>
              {usernameError && <span className="username-error">{usernameError}</span>}
            </span>
          ) : (
            <span className="username-display">
              {user?.username || user?.email?.split('@')[0]}
              <button className="username-edit-btn" onClick={handleEditUsername}>Edit</button>
            </span>
          )}
        </div>
        <div className="profile-row">
          <span>Email</span>
          <span>{user?.email}</span>
        </div>
        <div className="profile-row">
          <span>Plan</span>
          <span>{isPremium ? 'Gov / Commercial' : 'Free / Public'}</span>
        </div>
        {isPremium && (
          <div className="profile-row">
            <span>Subscription expires</span>
            <span className={daysLeft <= 5 ? 'expiring-text' : ''}>{expiry}</span>
          </div>
        )}
        <div className="profile-row">
          <span>Auth Provider</span>
          <span>AWS Cognito (mock during development)</span>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="profile-section">
        <h3>Plan Features</h3>
        <table className="profile-feature-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free / Public</th>
              <th>Gov / Commercial</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(f => (
              <tr key={f.label} className={
                !f.free && isPremium ? 'row-unlocked' :
                !f.free && !isPremium ? 'row-locked' : ''
              }>
                <td>{f.label}</td>
                <td className="center">{f.free  ? <span className="tick">✓</span> : <span className="cross">✕</span>}</td>
                <td className="center">{f.premium ? <span className="tick">✓</span> : <span className="cross">✕</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Free tier upgrade banner */}
      {!isPremium && (
        <div className="upgrade-banner">
          <div className="upgrade-banner-text">
            <strong>Gov / Commercial Plan — $99/month</strong>
            <p>For logistics operators, shipping companies, and supply chain teams. Unlock full historical data (1995–present), CSV exports, date range filters, vessel call analytics, and REST API access for system integration.</p>
          </div>
          <button className="upgrade-btn" onClick={() => setShowModal(true)}>
            Upgrade Now
          </button>
        </div>
      )}

      {/* Premium expiry warning */}
      {isPremium && daysLeft <= 5 && (
        <div className="expiry-warning">
          <div>
            ⚠️ Your Premium subscription {daysLeft === 0 ? 'has expired' : `expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`} on {expiry}.
          </div>
          <button className="renew-btn" onClick={renew}>
            🔄 Renew for $10/month
          </button>
        </div>
      )}
    </div>
  );
}
