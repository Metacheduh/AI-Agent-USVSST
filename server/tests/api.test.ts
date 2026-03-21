import { describe, it, expect, beforeAll } from 'vitest';

// ──────────────────────────────────────────────────────
// API Integration Tests
// Tests the /api/sources, /api/cases, and /api/govwatch-trigger endpoints
// Requires the server to be running on port 3000
// ──────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000';

describe('API: /api/sources — 12 Tier-1 Data Source Registry', () => {
    
    it('returns all 12 registered Tier-1 sources', async () => {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        
        expect(data.success).toBe(true);
        expect(data.totalSources).toBe(12);
        expect(data.sources).toHaveLength(12);
    });
    
    it('includes correct source metadata for each source', async () => {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        
        const sourceIds = data.sources.map((s: any) => s.id);
        
        // Verify all 12 Tier-1 source IDs are present
        expect(sourceIds).toContain('doj-press');
        expect(sourceIds).toContain('treasury-ofac');
        expect(sourceIds).toContain('usvsst');
        expect(sourceIds).toContain('fbi-ic3');
        expect(sourceIds).toContain('fincen');
        expect(sourceIds).toContain('fed-register');
        expect(sourceIds).toContain('pacer');
        expect(sourceIds).toContain('courtlistener');
        expect(sourceIds).toContain('sec-edgar');
        expect(sourceIds).toContain('gao');
        expect(sourceIds).toContain('crs');
        expect(sourceIds).toContain('doj-afp');
    });
    
    it('each source has required fields (id, name, type, url, method, health)', async () => {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        
        for (const source of data.sources) {
            expect(source).toHaveProperty('id');
            expect(source).toHaveProperty('name');
            expect(source).toHaveProperty('type');
            expect(source).toHaveProperty('url');
            expect(source).toHaveProperty('method');
            expect(source).toHaveProperty('health');
            expect(source.health).toHaveProperty('status');
            expect(source.health).toHaveProperty('lastChecked');
            expect(source.health).toHaveProperty('itemsFound');
        }
    });
    
    it('sources have valid method types (rss, api, scrape)', async () => {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        
        for (const source of data.sources) {
            expect(['rss', 'api', 'scrape']).toContain(source.method);
        }
    });
    
    it('CourtListener is registered with correct metadata', async () => {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        
        const cl = data.sources.find((s: any) => s.id === 'courtlistener');
        expect(cl).toBeDefined();
        expect(cl.name).toBe('CourtListener RECAP');
        expect(cl.type).toBe('Court Records');
        expect(cl.method).toBe('api');
        expect(cl.url).toBe('courtlistener.com');
    });
});

describe('API: /api/cases — Live Cases Database', () => {
    
    it('returns a valid cases array', async () => {
        const res = await fetch(`${BASE_URL}/api/cases`);
        const data = await res.json();
        
        expect(data.success).toBe(true);
        expect(Array.isArray(data.cases)).toBe(true);
    });
    
    it('each case has required IntelScout fields', async () => {
        const res = await fetch(`${BASE_URL}/api/cases`);
        const data = await res.json();
        
        // Only test if there are cases in the DB
        if (data.cases.length > 0) {
            for (const c of data.cases) {
                expect(c).toHaveProperty('caseName');
                expect(c).toHaveProperty('seizedValue');
                expect(c).toHaveProperty('stage');
                expect(c).toHaveProperty('category');
                expect(c).toHaveProperty('docketNumber');
                expect(c).toHaveProperty('usvsst_eligibility');
                expect(c).toHaveProperty('eligibilityReason');
            }
        }
    });
    
    it('usvsst_eligibility values are one of the valid tiers', async () => {
        const res = await fetch(`${BASE_URL}/api/cases`);
        const data = await res.json();
        
        const validTiers = ['High', 'Medium', 'Low', 'Unlikely'];
        for (const c of data.cases) {
            expect(validTiers).toContain(c.usvsst_eligibility);
        }
    });
});

describe('API: /api/counsel-chat — Counsel Chat Endpoint', () => {
    
    it('rejects requests without a question', async () => {
        const res = await fetch(`${BASE_URL}/api/counsel-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeDefined();
    });
    
    it('returns a response for a valid question', async () => {
        const res = await fetch(`${BASE_URL}/api/counsel-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: 'What is the USVSST Fund?' })
        });
        
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.response).toBeDefined();
        expect(data.response.length).toBeGreaterThan(20);
    }, 30000);
});

describe('API: /api/intake — Direct Intake Endpoint', () => {
    
    it('rejects requests without text payload', async () => {
        const res = await fetch(`${BASE_URL}/api/intake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeDefined();
    });
});

// ──────────────────────────────────────────────────────
// GovWatch Trigger Test (longer timeout — runs full pipeline)
// ──────────────────────────────────────────────────────

describe('API: /api/govwatch-trigger — Full Pipeline Test', () => {
    
    it('triggers a full 12-source scrape and returns results', async () => {
        console.log("🧪 Triggering full GovWatch pipeline (12 sources)...");
        
        const res = await fetch(`${BASE_URL}/api/govwatch-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        console.log("Pipeline result:", data);
        
        expect(data.success).toBe(true);
        expect(data.totalSources).toBe(12);
        expect(data.sourcesParsed).toBeGreaterThanOrEqual(8); // At least 8 of 12 should be active
        expect(data.alertsProcessed).toBeGreaterThan(0);
    }, 180000); // 3 min timeout for full pipeline w/ IntelScout
    
    it('populates /api/cases after govwatch trigger', async () => {
        const res = await fetch(`${BASE_URL}/api/cases`);
        const data = await res.json();
        
        expect(data.cases.length).toBeGreaterThan(0);
        
        // Verify at least one terrorism case was found
        const terrorismCases = data.cases.filter((c: any) => 
            c.category?.toLowerCase().includes('terrorism') ||
            c.caseName?.toLowerCase().includes('terrorist')
        );
        expect(terrorismCases.length).toBeGreaterThan(0);
    });
    
    it('updates source health after govwatch trigger', async () => {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        
        expect(data.activeSources).toBeGreaterThanOrEqual(8);
        
        // CourtListener should be current after a scrape
        const cl = data.sources.find((s: any) => s.id === 'courtlistener');
        expect(cl.health.status).toBe('current');
        expect(cl.health.itemsFound).toBeGreaterThan(0);
    });
});
