import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import './HistoricalPage.css';

const API_BASE = 'https://wa8v5iats6.execute-api.ap-southeast-1.amazonaws.com/prod';

function useFetch(url, idToken) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStatus(null);
    const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};
    fetch(url, { headers })
      .then(res => {
        setStatus(res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url, idToken]);

  return { data, loading, error, status };
}

function LoadingState() {
  return <div className="chart-loading">Loading data…</div>;
}

function ErrorState({ message, status, onUpgrade }) {
  if (status === 403) {
    return (
      <div className="chart-error chart-error-403">
        🔒 This data requires a Gov / Commercial plan.
        <button className="strip-upgrade-btn" onClick={onUpgrade}>Upgrade to unlock</button>
      </div>
    );
  }
  return (
    <div className="chart-error">
      ⚠️ Failed to load data: {message}
    </div>
  );
}

// Filter data by from/to month strings (YYYY-MM)
function filterByRange(data, from, to) {
  if (!data) return [];
  return data.filter(d => {
    if (from && d.month < from) return false;
    if (to && d.month > to) return false;
    return true;
  });
}

// Export any array of objects as a CSV file download
function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ChartCard({ title, children, isPremium, onExport, onUpgrade }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-title">{title}</h3>
        {isPremium && (
          <button className="export-btn" onClick={onExport} title="Export CSV">
            ⬇ Export CSV
          </button>
        )}
      </div>
      {children}
      {!isPremium && (
        <div className="chart-upgrade-strip">
          🔒 Free / Public view: last 3 months only.
          <button className="strip-upgrade-btn" onClick={onUpgrade}>Gov / Commercial plan for full history + CSV export</button>
        </div>
      )}
    </div>
  );
}

export default function HistoricalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.role === 'Premium';
  const [showModal, setShowModal] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function buildUrl(path) {
    const url = new URL(API_BASE + path);
    if (isPremium && from) url.searchParams.set('from', from);
    if (isPremium && to) url.searchParams.set('to', to);
    return url.toString();
  }

  const idToken = user?.idToken;
  const cargoTotal     = useFetch(buildUrl('/api/historical/cargo/total'), idToken);
  const cargoBreakdown = useFetch(buildUrl('/api/historical/cargo/breakdown'), idToken);
  const container      = useFetch(buildUrl('/api/historical/container'), idToken);
  const vesselCalls    = useFetch(buildUrl('/api/historical/vessel-calls'), idToken);

  // 401 → session expired, redirect to login
  useEffect(() => {
    const statuses = [cargoTotal.status, cargoBreakdown.status, container.status, vesselCalls.status];
    if (statuses.some(s => s === 401)) {
      logout();
      navigate('/login', { state: { message: 'Session expired. Please sign in again.' } });
    }
  }, [cargoTotal.status, cargoBreakdown.status, container.status, vesselCalls.status]);

  function flattenBreakdown(raw) {
    if (!raw?.data) return [];
    return raw.data.map(entry => {
      const row = { month: entry.month };
      entry.breakdown.forEach(b => { row[b.secondary] = b.throughput; });
      return row;
    });
  }

  function flattenVesselCalls(raw) {
    if (!raw?.data) return [];
    return raw.data.map(entry => {
      const row = { month: entry.month };
      entry.by_purpose.forEach(b => { row[b.purpose] = b.vessel_calls; });
      return row;
    });
  }

  // Free: last 3 months only (client-side). Premium: server already filtered via ?from=&to=
  function applyFilter(data) {
    if (!data || !Array.isArray(data)) return [];
    if (!isPremium) return data.slice(-3);
    return data;
  }

  const cargoTotalData  = applyFilter(cargoTotal.data?.data);
  const containerData   = applyFilter(container.data?.data);
  const breakdownData   = applyFilter(flattenBreakdown(cargoBreakdown.data));
  const vesselCallsData = applyFilter(flattenVesselCalls(vesselCalls.data));

  const CARGO_COLORS = {
    Containerised: '#3b82f6', Conventional: '#60a5fa',
    Oil: '#f97316', 'Non-Oil Bulk': '#fb923c',
  };
  const VESSEL_COLORS = {
    Cargo: '#3b82f6', Bunkers: '#f97316',
    Supplies: '#22c55e', Repairs: '#a855f7', Others: '#94a3b8',
  };

  return (
    <div className="historical-page">
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}

      <div className="page-header">
        <h1 className="page-title">Historical Analytics</h1>
        {!isPremium && (
          <button className="header-upgrade-btn" onClick={() => setShowModal(true)}>
            🚢 Upgrade to Gov / Commercial
          </button>
        )}
        {isPremium && (
          <div className="premium-badge">🚢 Gov / Commercial</div>
        )}
      </div>

      {/* Date range filter — Premium only */}
      {isPremium && (
        <div className="filter-bar">
          <span className="filter-label">Date Range:</span>
          <input
            type="month"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="filter-input"
          />
          <span>to</span>
          <input
            type="month"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="filter-input"
          />
          <button className="filter-clear" onClick={() => { setFrom(''); setTo(''); }}>
            Clear
          </button>
        </div>
      )}

      {/* Chart 1 — Cargo Total (Line Chart) */}
      <ChartCard
        title="📦 Monthly Cargo Throughput (thousand tonnes)"
        isPremium={isPremium}
        onExport={() => exportCSV(cargoTotalData, 'cargo_total.csv')}
        onUpgrade={() => setShowModal(true)}
      >
        {cargoTotal.loading && <LoadingState />}
        {cargoTotal.error && <ErrorState message={cargoTotal.error} status={cargoTotal.status} onUpgrade={() => setShowModal(true)} />}
        {!cargoTotal.loading && !cargoTotal.error && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cargoTotalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v.toLocaleString()} k tonnes`]} />
              <Line type="monotone" dataKey="cargo_throughput" stroke="#3b82f6"
                strokeWidth={2} dot={false} name="Cargo Throughput" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Chart 2 — Cargo Breakdown (Stacked Bar) */}
      <ChartCard
        title="🏗️ Cargo Breakdown by Type (thousand tonnes)"
        isPremium={isPremium}
        onExport={() => exportCSV(breakdownData, 'cargo_breakdown.csv')}
        onUpgrade={() => setShowModal(true)}
      >
        {cargoBreakdown.loading && <LoadingState />}
        {cargoBreakdown.error && <ErrorState message={cargoBreakdown.error} status={cargoBreakdown.status} onUpgrade={() => setShowModal(true)} />}
        {!cargoBreakdown.loading && !cargoBreakdown.error && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v.toLocaleString()} k tonnes`]} />
              <Legend />
              {Object.entries(CARGO_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key} stackId="cargo" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Chart 3 — Container TEU (Bar Chart) */}
      <ChartCard
        title="🚢 Monthly Container Throughput (thousand TEUs)"
        isPremium={isPremium}
        onExport={() => exportCSV(containerData, 'container_throughput.csv')}
        onUpgrade={() => setShowModal(true)}
      >
        {container.loading && <LoadingState />}
        {container.error && <ErrorState message={container.error} status={container.status} onUpgrade={() => setShowModal(true)} />}
        {!container.loading && !container.error && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={containerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v.toLocaleString()} k TEUs`]} />
              <Bar dataKey="container_throughput" fill="#22c55e" name="Container Throughput" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Chart 4 — Vessel Calls (Grouped Bar) */}
      <ChartCard
        title="⚓ Vessel Calls by Purpose"
        isPremium={isPremium}
        onExport={() => exportCSV(vesselCallsData, 'vessel_calls.csv')}
        onUpgrade={() => setShowModal(true)}
      >
        {vesselCalls.loading && <LoadingState />}
        {vesselCalls.error && <ErrorState message={vesselCalls.error} status={vesselCalls.status} onUpgrade={() => setShowModal(true)} />}
        {!vesselCalls.loading && !vesselCalls.error && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={vesselCallsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v.toLocaleString()} calls`]} />
              <Legend />
              {Object.entries(VESSEL_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key} fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
