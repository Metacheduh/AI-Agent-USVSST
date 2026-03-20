export const pipelineStages = [
  { stage: 'Filed', count: 42, value: 1250000000 },
  { stage: 'Seized', count: 35, value: 980000000 },
  { stage: 'Litigation', count: 28, value: 810000000 },
  { stage: 'Forfeiture Ordered', count: 21, value: 650000000 },
  { stage: 'Liquidation', count: 18, value: 580000000 },
  { stage: 'Treasury Transfer', count: 14, value: 430000000 },
  { stage: 'USVSST Deposit', count: 11, value: 310000000 },
  { stage: 'Distributed', count: 5, value: 150000000 },
];

export const casesData = [
  { id: '1:24-cv-00123', name: 'US v. North Korean Crypto Assets', category: 'Crypto/Sanctions', stage: 'Litigation', seizedValue: 42500000, lastVerified: '2 hours ago', source: 'DOJ Press Release' },
  { id: '1:23-cr-00991', name: 'US v. Iranian Oil Tanker Fnd.', category: 'State Sponsor', stage: 'Liquidation', seizedValue: 112000000, lastVerified: '1 day ago', source: 'PACER' },
  { id: '1:25-cv-00044', name: 'US v. Al-Qaeda Linked Accounts', category: 'Terrorism', stage: 'Seized', seizedValue: 18300000, lastVerified: '4 hours ago', source: 'Treasury OFAC' },
  { id: '1:22-cr-00102', name: 'US v. Syrian Front Company', category: 'State Sponsor', stage: 'Forfeiture Ordered', seizedValue: 84100000, lastVerified: '3 days ago', source: 'DOJ AFP File' },
  { id: '1:24-cv-00551', name: 'US v. Hezbollah Shell Corps', category: 'Terrorism', stage: 'Filed', seizedValue: 27000000, lastVerified: '1 week ago', source: 'FBI IC3' },
  { id: '1:21-cv-00442', name: 'US v. Russian Cyber Network', category: 'Sanctions', stage: 'Treasury Transfer', seizedValue: 9800000, lastVerified: '12 hours ago', source: 'TFF Report' },
];

// Compute metrics from actual pipeline data so numbers always add up
const totalSeizedRaw = pipelineStages.reduce((sum, s) => sum + s.value, 0);
const activeCasesCount = pipelineStages.reduce((sum, s) => sum + s.count, 0);
const usvsStages = ['Treasury Transfer', 'USVSST Deposit', 'Distributed'];
const projectedUSVSSTRaw = pipelineStages
  .filter(s => usvsStages.includes(s.stage))
  .reduce((sum, s) => sum + s.value, 0);

const formatBillions = (val) => `$${(val / 1000000000).toFixed(1)}B`;

export const totalMetrics = {
  activeCases: activeCasesCount,
  totalSeized: formatBillions(totalSeizedRaw),
  projectedUSVSST: formatBillions(projectedUSVSSTRaw),
  lastUpdate: new Date().toLocaleDateString()
};
