import { useAuth } from '../context/AuthContext';
import './UpgradeModal.css';

const FEATURES = [
  { label: 'Real-time vessel tracking',                free: true,  premium: true  },
  { label: 'Live vessel search & status',              free: true,  premium: true  },
  { label: 'Historical data (last 3 months)',          free: true,  premium: true  },
  { label: 'Full historical data (1995–present)',      free: false, premium: true  },
  { label: 'Date range filter on all charts',          free: false, premium: true  },
  { label: 'CSV export for operational reporting',     free: false, premium: true  },
  { label: 'Vessel calls breakdown analytics',         free: false, premium: true  },
  { label: 'REST API access (metered, for integration)', free: false, premium: true },
  { label: 'Priority support',                         free: false, premium: true  },
];

export default function UpgradeModal({ onClose }) {
  const { upgrade } = useAuth();

  function handleUpgrade() {
    upgrade();
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div className="modal-icon">🚢</div>
          <h2>Upgrade to Gov / Commercial Plan</h2>
          <p>
            For logistics operators, shipping companies, and supply chain teams
            who need full operational data access.
          </p>
        </div>

        <div className="plan-compare">
          <div className="plan-col">
            <div className="plan-label free">Free / Public</div>
            <div className="plan-price">$0 <span>/month</span></div>
            <div className="plan-note">MPA, port authorities & government agencies</div>
          </div>
          <div className="plan-col highlight">
            <div className="plan-label premium">Gov / Commercial</div>
            <div className="plan-price">$99 <span>/month</span></div>
            <div className="plan-note">Logistics firms, shipping companies & SMEs</div>
          </div>
        </div>

        <table className="feature-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free / Public</th>
              <th>Gov / Commercial</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(f => (
              <tr key={f.label}>
                <td>{f.label}</td>
                <td>{f.free    ? <span className="tick">✓</span> : <span className="cross">✕</span>}</td>
                <td>{f.premium ? <span className="tick">✓</span> : <span className="cross">✕</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="upgrade-confirm-btn" onClick={handleUpgrade}>
          Upgrade to Gov / Commercial — $99/month
        </button>
        <p className="modal-note">
          Demo mode: upgrade is simulated locally. Real billing via Stripe + Cognito group assignment in production.
        </p>
      </div>
    </div>
  );
}
