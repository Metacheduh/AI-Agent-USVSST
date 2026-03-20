import React from 'react';
import { Activity } from 'lucide-react';

function MetricCard({ title, value, subtitle, highlight }) {
  return (
    <div className="panel flex-col gap-2" style={{ borderTop: highlight ? '2px solid var(--accent-blue)' : undefined }}>
      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{title}</h4>
      <div className="data-value" style={{ fontSize: '2.5rem', color: highlight ? 'var(--status-success)' : 'var(--text-primary)' }}>{value}</div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  );
}

export default function ADKPipelines() {
  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>ADK Orchestration Server</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Live system health, API latencies, and multi-agent Genkit performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-highlight)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--status-success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14}/> ALL SYSTEMS NOMINAL
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <MetricCard title="Genkit Avg Latency" value="1.2s" subtitle="Gemini 2.5 Pro / Flash" />
        <MetricCard title="IntelScout Ejection Rate" value="94.2%" subtitle="Hallucinations blocked" highlight />
        <MetricCard title="Memory Layer Size" value="8,401" subtitle="Vector Embeddings" />
        <MetricCard title="GovWatch Bots" value="12" subtitle="Active PACER/SEC feeds" />
      </div>

      <div className="panel flex-col gap-2" style={{ backgroundColor: '#0a0e17', border: '1px solid var(--border-highlight)' }}>
        <div className="flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
          </div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontFamily: 'monospace', marginLeft: '0.5rem' }}>genkit-server-tty1</span>
        </div>
        <pre style={{ margin: 0, fontSize: '0.85rem', color: 'var(--status-success)', fontFamily: '"JetBrains Mono", monospace', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
{`[2026-03-20 12:44:01] 🚀 USVSST ADK Genkit Backend listening on port 3000
[2026-03-20 12:44:03] 📡 govwatch: Initiating live scrape of Tier-1 Federal feeds...
[2026-03-20 12:44:05] 🤖 intelscout: Auditing federal document: SEC Clarifies Application of Federal Securities Laws
[2026-03-20 12:44:08] ⚠️ intelscout Rejected: Document failed strict factual audit. Stage Hallucinated.
[2026-03-20 12:44:10] 🤖 intelscout: Auditing federal document: SEC Publishes Data on Public Offerings
[2026-03-20 12:44:14] ✅ intelscout Accepted: US vs $85,000,000 Crypto Seizure 
[2026-03-20 12:44:15] 🧠 [Memory Layer] Retrieving historical context for docket 1:24-cv-00123... 8 matches found.
[2026-03-20 12:44:18] 📝 ContentEngine generated 4 verified beneficiary updates.`}
        </pre>
      </div>
    </main>
  );
}
