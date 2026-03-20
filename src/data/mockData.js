// Pipeline stage definitions — order matters for the funnel chart
export const PIPELINE_STAGES = [
  'Filed', 'Seized', 'Litigation', 'Forfeiture Ordered', 
  'Liquidation', 'Treasury Transfer', 'USVSST Deposit', 'Distributed'
];

// Late-stage thresholds for the USVSST impact calculation
export const USVSST_STAGES = ['Treasury Transfer', 'USVSST Deposit', 'Distributed'];

/**
 * Compute pipeline chart data from live cases.
 * Groups cases by stage, aggregates value and count.
 */
export function computePipelineStages(cases) {
  const grouped = {};
  for (const stage of PIPELINE_STAGES) {
    grouped[stage] = { stage, count: 0, value: 0 };
  }
  for (const c of cases) {
    if (grouped[c.stage]) {
      grouped[c.stage].count += 1;
      grouped[c.stage].value += (typeof c.seizedValue === 'number' ? c.seizedValue : 0);
    }
  }
  return PIPELINE_STAGES.map(s => grouped[s]);
}

/**
 * Compute dashboard metrics from live cases.
 */
export function computeMetrics(cases) {
  const totalSeized = cases.reduce((sum, c) => sum + (typeof c.seizedValue === 'number' ? c.seizedValue : 0), 0);
  const projected = cases
    .filter(c => USVSST_STAGES.includes(c.stage))
    .reduce((sum, c) => sum + (typeof c.seizedValue === 'number' ? c.seizedValue : 0), 0);

  const fmt = (val) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
    if (val > 0) return `$${val.toLocaleString()}`;
    return '$0';
  };

  return {
    activeCases: cases.length,
    totalSeized: fmt(totalSeized),
    projectedUSVSST: fmt(projected),
    lastUpdate: new Date().toLocaleDateString()
  };
}
