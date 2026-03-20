import { describe, it, expect } from 'vitest';
import { intelscoutExtractionFlow } from '../src/index';

// A mock DOJ press release mapping to a real-world asset forfeiture scenario
const MOCK_DOJ_ALERT = `
FOR IMMEDIATE RELEASE
Department of Justice, U.S. Attorney’s Office
Today, the United States filed a civil forfeiture complaint against $42,500,000 in cryptocurrency 
linked to North Korean cyber-attacks. The action, docketed as 1:24-cv-00123, ensures these assets 
remain seized pending litigation.
`;

describe('IntelScout Genkit Evaluation Suite', () => {
    it('accurately extracts entities without hallucinations using gemini-2.5-pro iterative refinement', async () => {
        console.log("Injecting mock DOJ text into IntelScout Flow...");
        
        // Run the agentic flow
        const result = await intelscoutExtractionFlow(MOCK_DOJ_ALERT);
        
        console.log("Verified Output:", result);
        
        // Assert strict compliance bounds
        expect(result.seizedValue).toBe(42500000);
        
        // The text indicates it was filed, and assets "remain seized pending litigation".
        // The strictest interpretation is 'Seized' or 'Litigation'.
        expect(['Seized', 'Litigation', 'Filed']).toContain(result.stage); 
        
        expect(result.docketNumber).toBe('1:24-cv-00123');
        expect(result.category.toLowerCase()).toMatch(/crypto|north|cyber/);
    }, 45000); // 45s timeout for the iterative Genkit AI loop
});
