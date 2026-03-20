import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function CasesDatabase({ liveCases }) {
  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Historical Case CRM</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Searchable repository of all monitored federal actions and historical intelligence.</p>
        </div>
      </div>
      <div className="panel" style={{ overflowX: 'auto', minHeight: '500px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)' }}>
              <th style={{ padding: '1rem 0', fontWeight: 500 }}>Docket / Name</th>
              <th style={{ padding: '1rem 0', fontWeight: 500 }}>Category</th>
              <th style={{ padding: '1rem 0', fontWeight: 500 }}>Current Stage</th>
              <th style={{ padding: '1rem 0', fontWeight: 500 }}>Identified Value</th>
              <th style={{ padding: '1rem 0', fontWeight: 500 }}>ADK Assignment</th>
            </tr>
          </thead>
          <tbody>
            {liveCases.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s ease' }}>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>{c.id}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                </td>
                <td style={{ padding: '1rem 0' }}>{c.category}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>
                    {c.stage}
                  </span>
                </td>
                <td className="data-value" style={{ padding: '1rem 0' }}>
                    {typeof c.seizedValue === 'number' ? `$${(c.seizedValue / 1000000).toFixed(1)}M` : c.seizedValue}
                </td>
                <td style={{ padding: '1rem 0' }}>
                   <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border-highlight)' }}>Agent IntelScout</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
