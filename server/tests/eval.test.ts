import { describe, it, expect } from 'vitest';
import { intelscoutExtractionFlow } from '../src/index';

// ──────────────────────────────────────────────────────
// 1. CORE IntelScout Extraction Tests
// ──────────────────────────────────────────────────────

const MOCK_DOJ_ALERT = `
FOR IMMEDIATE RELEASE
Department of Justice, U.S. Attorney's Office
Today, the United States filed a civil forfeiture complaint against $42,500,000 in cryptocurrency 
linked to North Korean cyber-attacks. The action, docketed as 1:24-cv-00123, ensures these assets 
remain seized pending litigation.
`;

describe('IntelScout Genkit Evaluation Suite', () => {
    it('accurately extracts entities from a DOJ press release without hallucinations', async () => {
        console.log("🧪 Test 1: Mock DOJ cryptocurrency forfeiture press release");
        
        const result = await intelscoutExtractionFlow(MOCK_DOJ_ALERT);
        console.log("Verified Output:", result);
        
        expect(result.seizedValue).toBe(42500000);
        expect(['Seized', 'Litigation', 'Filed']).toContain(result.stage); 
        expect(result.docketNumber).toBe('1:24-cv-00123');
        expect(result.category.toLowerCase()).toMatch(/crypto|north|cyber|sanctions|terrorism/);
    }, 45000);
});

// ──────────────────────────────────────────────────────
// 2. USVSST ELIGIBILITY SCORING Tests
//    Based on real cases from OCR'd PDFs
// ──────────────────────────────────────────────────────

// MDL 1570 — THE core 9/11 case. Must always score HIGH.
const MDL_1570_DOCKET = `
Case: In Re: Terrorist Attacks on September 11, 2001. 
Docket: 03-md-01570. Court: Southern District of New York. 
Filed: 2003-09-01. 
Parties include: Thomas Burnett Sr., Al Baraka Investment & Development Corp., Kingdom of Saudi Arabia.
Attorneys from firms: Motley Rice LLC, Kreindler & Kreindler LLP.
`;

// Bitcoin forfeiture — 127,271 BTC (case 1:25-cv-05745)
const BITCOIN_FORFEITURE_CASE = `
United States v. Approximately 127,271 Bitcoin
Case No. 1:25-cv-05745 (RPK)
U.S. District Court for the Eastern District of New York
The government's verified complaint pleads forfeiture under 18 U.S.C. § 981 based on alleged 
wire-fraud and money-laundering conduct, with contemporaneous OFAC blocking actions against 
the alleged network. Multiple 9/11 victim claimants have filed verified claims under TRIA including 
Breitweiser et al. who hold compensatory damages judgments against Iran under 28 U.S.C. §§1605A and 1605B.
`;

// Billy Asemani — lawsuit AGAINST the fund, should score UNLIKELY
const ASEMANI_V_USVSST = `
Case: Billy Asemani v. United States Victims of State Sponsored Terrorism 
Docket: 23-3271. Court: Court of Appeals for the Sixth Circuit.
This is a civil lawsuit filed by Billy Asemani against the USVSST Fund challenging 
the Fund's distribution methodology.
`;

// Iran sanctions evasion — should score HIGH
const IRAN_SANCTIONS_CASE = `
FOR IMMEDIATE RELEASE — Department of Justice
The United States has seized $250,000,000 from accounts used by Iranian entities to evade 
IEEPA sanctions. The forfeiture action (docket 1:26-cv-00789) was filed in the Southern District 
of New York. The funds were traced to the Islamic Revolutionary Guard Corps (IRGC) and were 
used to procure weapons components in violation of the International Emergency Economic Powers Act.
`;

// General drug forfeiture — should score UNLIKELY
const DRUG_FORFEITURE = `
FOR IMMEDIATE RELEASE — U.S. Attorney's Office, Southern District of Florida
Federal agents seized $5,000,000 in cash and a luxury yacht from convicted drug trafficker 
Juan Martinez. The assets were forfeited under 21 U.S.C. § 881 in connection with a multi-year 
cocaine distribution conspiracy. Docket: 1:25-cr-00456.
`;

// SEC fraud — should score LOW or UNLIKELY
const SEC_FRAUD = `
SEC Press Release: The Securities and Exchange Commission today charged XYZ Corp and its CEO 
for a $100 million securities fraud scheme. The SEC has obtained an asset freeze and is seeking 
disgorgement of ill-gotten gains. Case filed in S.D.N.Y. as 1:26-cv-02345.
`;

describe('USVSST Eligibility Scoring — Primary Source Validation', () => {
    
    it('scores MDL 1570 (9/11 terrorism case) as HIGH eligibility', async () => {
        console.log("🧪 Test 2: MDL 1570 — In Re: Terrorist Attacks on September 11, 2001");
        
        const result = await intelscoutExtractionFlow(MDL_1570_DOCKET);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(result.caseName).toContain('Terrorist Attacks');
        expect(result.usvsst_eligibility).toBe('High');
        expect(result.docketNumber).toContain('03-md-01570');
    }, 60000);
    
    it('scores Bitcoin forfeiture case (127,271 BTC) as HIGH eligibility', async () => {
        console.log("🧪 Test 3: US v. ~127,271 Bitcoin (1:25-cv-05745)");
        
        const result = await intelscoutExtractionFlow(BITCOIN_FORFEITURE_CASE);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(result.caseName.toLowerCase()).toContain('bitcoin');
        expect(result.docketNumber).toContain('1:25-cv-05745');
        expect(['High', 'Medium']).toContain(result.usvsst_eligibility);
    }, 60000);
    
    it('scores Asemani v. USVSST (lawsuit against Fund) as UNLIKELY', async () => {
        console.log("🧪 Test 4: Billy Asemani v. USVSST (23-3271)");
        
        const result = await intelscoutExtractionFlow(ASEMANI_V_USVSST);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(result.caseName).toContain('Asemani');
        expect(result.usvsst_eligibility).toBe('Unlikely');
    }, 60000);
    
    it('scores IEEPA/Iran sanctions case as HIGH eligibility', async () => {
        console.log("🧪 Test 5: Iran IEEPA sanctions evasion ($250M)");
        
        const result = await intelscoutExtractionFlow(IRAN_SANCTIONS_CASE);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(result.seizedValue).toBe(250000000);
        expect(result.usvsst_eligibility).toBe('High');
        expect(result.eligibilityReason.toLowerCase()).toMatch(/ieepa|iran|sanction|terrorism/);
    }, 60000);
    
    it('scores drug forfeiture as UNLIKELY for USVSST', async () => {
        console.log("🧪 Test 6: Drug trafficking forfeiture — no terrorism nexus");
        
        const result = await intelscoutExtractionFlow(DRUG_FORFEITURE);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(result.seizedValue).toBe(5000000);
        expect(result.usvsst_eligibility).toBe('Unlikely');
    }, 60000);
    
    it('scores SEC securities fraud as LOW or UNLIKELY', async () => {
        console.log("🧪 Test 7: SEC fraud — no terrorism connection");
        
        const result = await intelscoutExtractionFlow(SEC_FRAUD);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(['Low', 'Unlikely']).toContain(result.usvsst_eligibility);
    }, 60000);
});

// ──────────────────────────────────────────────────────
// 3. DEPOSIT RATE KNOWLEDGE Tests
//    Verifies the AI knows the real statutory rates
// ──────────────────────────────────────────────────────

const CRIMINAL_FORFEITURE_CASE = `
The Department of Justice announced today that a federal court has issued a final order of criminal 
forfeiture against $15,000,000 in assets tied to Hezbollah's financial network. The criminal 
forfeiture was entered under 18 U.S.C. § 981 following the defendant's conviction for providing 
material support for terrorism in violation of IEEPA. Docket: 1:25-cr-00999 (S.D.N.Y.).
`;

describe('Statutory Knowledge Validation', () => {
    
    it('correctly identifies criminal forfeiture with terrorism nexus as HIGH', async () => {
        console.log("🧪 Test 8: Criminal forfeiture — Hezbollah / IEEPA (100% deposit rate)");
        
        const result = await intelscoutExtractionFlow(CRIMINAL_FORFEITURE_CASE);
        console.log("Eligibility:", result.usvsst_eligibility, "—", result.eligibilityReason);
        
        expect(result.seizedValue).toBe(15000000);
        expect(result.usvsst_eligibility).toBe('High');
        expect(result.category.toLowerCase()).toMatch(/terrorism|sanctions/);
    }, 60000);
});
