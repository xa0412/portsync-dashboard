import { useState } from 'react';

const MAP_URL = 'https://main.d1mqps47mrtxb5.amplifyapp.com/';

export default function LivePage() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 20px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Live Vessel Tracking</h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
            Real-time AIS vessel positions around Singapore
          </p>
        </div>
        <a
          href={MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: '#3b82f6',
            textDecoration: 'none',
            padding: '4px 10px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
          }}
        >
          Open in new tab ↗
        </a>
      </div>

      {iframeError ? (
        <div style={{ textAlign: 'center', paddingTop: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
          <p style={{ marginBottom: '12px' }}>Unable to embed the map directly.</p>
          <a
            href={MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Open Live Map ↗
          </a>
        </div>
      ) : (
        <iframe
          src={MAP_URL}
          title="Live Vessel Tracking Map"
          style={{ border: 'none', width: '100%', height: 'calc(100vh - 160px)' }}
          onError={() => setIframeError(true)}
          allow="geolocation"
        />
      )}
    </div>
  );
}
