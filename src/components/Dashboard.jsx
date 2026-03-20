import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Activity, Database, Gavel, ShieldCheck, ChevronDown, X, AlertTriangle } from 'lucide-react';
import { computePipelineStages, computeMetrics, PIPELINE_STAGES } from '../data/mockData';

function MetricCard({ title, value, subtitle, highlight }) {
  return (
    <div className="panel flex-col gap-2" style={{ borderTop: highlight ? '2px solid var(--accent-blue)' : undefined }}>
      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{title}</h4>
      <div className="data-value" style={{ fontSize: '2.5rem', color: highlight ? 'var(--status-success)' : 'var(--text-primary)' }}>{value}</div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  );
}

function EmptyState({ onGovWatchTrigger, isScraping }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', textAlign: 'center', gap: '1.5rem'
    }}>
      <div style={{ 
        width: '64px', height: '64px', borderRadius: '50%', 
        backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-highlight)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <AlertTriangle size={28} color="var(--text-tertiary)" />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          No Live Intelligence Data
        </h3>
        <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6 }}>
          The dashboard is connected to your backend pipeline. Run a live web scrape to pull verified federal
          forfeiture data from DOJ, PACER, Treasury OFAC, and other Tier-1 sources.
        </p>
      </div>
      <button 
        onClick={onGovWatchTrigger}
        disabled={isScraping}
        style={{ 
          background: isScraping ? 'var(--bg-surface-hover)' : 'var(--accent-blue)', 
          color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', 
          cursor: isScraping ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 600, 
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
        <Database size={16} /> {isScraping ? 'GovWatch Scanning...' : 'Run Live Web Scrape (ADK)'}
      </button>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        Requires backend server running on port 3000
      </p>
    </div>
  );
}

const ELIGIBILITY_COLORS = {
  High: '#22c55e',
  Medium: '#eab308',
  Low: '#f97316',
  Unlikely: '#6b7280'
};

export default function Dashboard({ liveCases, isScraping, onGovWatchTrigger }) {
  const [selectedStage, setSelectedStage] = useState(null);

  // Compute pipeline stages and metrics from live data
  const pipelineStages = useMemo(() => computePipelineStages(liveCases), [liveCases]);
  const metrics = useMemo(() => computeMetrics(liveCases), [liveCases]);

  // Group cases by pipeline stage for the drill-down
  const casesByStage = useMemo(() => {
    const grouped = {};
    for (const c of liveCases) {
      if (!grouped[c.stage]) grouped[c.stage] = [];
      grouped[c.stage].push(c);
    }
    return grouped;
  }, [liveCases]);

  // Handle bar click — toggle the breakdown panel
  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const stage = data.activePayload[0].payload.stage;
      setSelectedStage(prev => prev === stage ? null : stage);
    }
  };

  const selectedCases = selectedStage ? (casesByStage[selectedStage] || []) : [];
  const stageIndex = PIPELINE_STAGES.indexOf(selectedStage);
  const isGreenStage = stageIndex > 4;

  // Show empty state when no live cases exist
  if (liveCases.length === 0) {
    return (
      <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Metrics Row — show zeros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <MetricCard title="Total Monitored Assets" value="$0" subtitle="0 Active Cases" />
          <MetricCard title="Projected USVSST Impact" value="$0" subtitle="No pipeline data yet" highlight />
          <MetricCard title="Data Freshness" value="—" subtitle="Awaiting first scrape" />
        </div>
        <div className="panel">
          <EmptyState onGovWatchTrigger={onGovWatchTrigger} isScraping={isScraping} />
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <MetricCard title="Total Monitored Assets" value={metrics.totalSeized} subtitle={`${metrics.activeCases} Active Cases`} />
        <MetricCard title="Projected USVSST Impact" value={metrics.projectedUSVSST} subtitle="Based on late-stage pipeline" highlight />
        <MetricCard title="Data Freshness" value={metrics.lastUpdate} subtitle="15 Tier-1 Sources Parsed" />
      </div>

      {/* Pipeline Chart */}
      <div className="panel flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--accent-blue)" /> Asset Forfeiture Pipeline
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Click any bar to see individual cases ↓
          </span>
        </div>
        <div style={{ width: '100%', height: '300px', cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineStages} margin={{ top: 20, right: 30, left: 40, bottom: 5 }} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="stage" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis 
                stroke="var(--text-secondary)" 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                cursor={{ fill: 'var(--bg-surface-hover)' }}
                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-highlight)', borderRadius: '8px' }}
                formatter={(value, name, props) => {
                  const stage = props.payload.stage;
                  const cases = casesByStage[stage] || [];
                  return [`$${(value / 1000000).toFixed(1)}M (${cases.length} case${cases.length !== 1 ? 's' : ''})`, 'Asset Value'];
                }}
              />
              <Bar dataKey="value" fill="var(--accent-blue)" radius={[4, 4, 0, 0]}>
                {pipelineStages.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index > 4 ? 'var(--status-success)' : 'var(--accent-blue)'}
                    stroke={entry.stage === selectedStage ? '#fff' : 'none'}
                    strokeWidth={entry.stage === selectedStage ? 2 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Drill-down breakdown panel */}
        {selectedStage && (
          <div style={{ 
            borderTop: `2px solid ${isGreenStage ? 'var(--status-success)' : 'var(--accent-blue)'}`,
            padding: '1.25rem', backgroundColor: 'var(--bg-base)', borderRadius: '0 0 8px 8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <div className="flex items-center gap-2">
                <ChevronDown size={16} color={isGreenStage ? 'var(--status-success)' : 'var(--accent-blue)'} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                  <span style={{ color: isGreenStage ? 'var(--status-success)' : 'var(--accent-blue)' }}>{selectedStage}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '0.5rem' }}>
                    — {selectedCases.length} case{selectedCases.length !== 1 ? 's' : ''}
                  </span>
                </h4>
              </div>
              <button 
                onClick={() => setSelectedStage(null)}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            {selectedCases.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {selectedCases.map((c, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.75rem 1rem', borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', gap: '0.25rem',
                    transition: 'border-color 0.2s ease'
                  }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isGreenStage ? 'var(--status-success)' : 'var(--accent-blue)' }}>{c.id}</span>
                      <span className="data-value" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {typeof c.seizedValue === 'number' ? `$${(c.seizedValue / 1000000).toFixed(1)}M` : c.seizedValue}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <div className="flex items-center justify-between" style={{ marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', padding: '0.1rem 0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>{c.category}</span>
                      {c.usvsst_eligibility && (
                        <span title={c.eligibilityReason || ''} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '10px', color: '#fff', backgroundColor: ELIGIBILITY_COLORS[c.usvsst_eligibility] || '#6b7280' }}>
                          {c.usvsst_eligibility}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <p style={{ margin: 0 }}>No cases in the <strong>{selectedStage}</strong> stage.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database Table */}
      <div className="panel flex-col gap-4">
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gavel size={18} color="var(--accent-blue)" /> Active Verified Cases
            </h3>
            <button 
              onClick={onGovWatchTrigger}
              disabled={isScraping}
              style={{ background: isScraping ? 'var(--bg-surface-hover)' : 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: isScraping ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={14} /> {isScraping ? 'GovWatch Scanning...' : 'Force Live Web Scrape (ADK)'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)' }}>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Docket / Name</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Stage</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Seized Value</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>USVSST Eligibility</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Data Source (Verified)</th>
              </tr>
            </thead>
            <tbody>
              {liveCases.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s ease' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <div style={{ fontWeight: 500 }}>{c.id}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.name}</div>
                  </td>
                  <td style={{ padding: '1rem 0' }}>{c.category}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span 
                      onClick={() => setSelectedStage(c.stage)}
                      style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="data-value" style={{ padding: '1rem 0' }}>
                     {typeof c.seizedValue === 'number' ? `$${(c.seizedValue / 1000000).toFixed(1)}M` : c.seizedValue}
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    {c.usvsst_eligibility ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#fff', backgroundColor: ELIGIBILITY_COLORS[c.usvsst_eligibility] || '#6b7280' }}>
                          {c.usvsst_eligibility}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', maxWidth: '200px' }}>{c.eligibilityReason}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--status-success)', display: 'flex', alignItems: 'center' }}><ShieldCheck size={14} /></span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{c.source}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{c.lastVerified}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
