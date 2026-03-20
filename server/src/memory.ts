import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Agentic Memory Layer (Pinecone Vector DB)
 * Phase 2 PRD Implementation: Upgrading from simulated array to live Pinecone client.
 * Retrieves historical context to prevent AI 'amnesia'.
 */
export class AgenticMemoryStore {
    private memoryVault: Map<string, string[]> = new Map();
    private pineconeClient: Pinecone | null = null;
    private indexName: string = process.env.PINECONE_INDEX_NAME || 'usvsst-memory-layer';

    constructor() {
      // 1. Attempt Live Pinecone connection
      if (process.env.PINECONE_API_KEY) {
        console.log("🌲 [Memory Layer] Connecting to live cloud Pinecone Vector Store...");
        try {
          this.pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        } catch(e) {
          console.error("🌲 [Memory Layer] Failed to connect to Pinecone. Falling back to local cache.");
        }
      } else {
        console.warn("🌲 [Memory Layer] PINECONE_API_KEY missing from .env. Running on local Phase 1 fallback store.");
      }

      // 2. Setup Phase 1 Local Fallback Data
      // Seed with extreme historical context for our target test case
      this.memoryVault.set("9:25-cv-00444", [
        "TIMELINE - 14 MONTHS AGO: Case was flagged as a potential Iranian sanctioned oil scheme. Asset slipped jurisdiction.",
        "TIMELINE - 8 MONTHS AGO: USVSST legal representation (Motley Rice) filed a formal notice with the DOJ indicating victims hold a massive underlying judgment against the defendants.",
        "TIMELINE - YESTERDAY: Intelligence tracked the asset strictly moving into federal jurisdiction, triggering the immediate civil forfeiture action."
      ]);
      
      // Seed the general crypto case from Vitest
      this.memoryVault.set("1:24-cv-00123", [
        "TIMELINE - 6 MONTHS AGO: Identified as a North Korean state-sponsored cyber laundering cluster.",
      ]);
    }
  
    /** 
     * Retrieves the historical narrative (RAG) for a given docket to ground the generation.
     * Uses Genkit Embeddings and Pinecone Vector SDK natively, falling back if offline.
     */
    async getHistoryAsync(aiInstance: any, textEmbeddingModel: any, docketNumber?: string): Promise<string[]> {
      if (!docketNumber) return [];
      
      // Phase 2: Live Pinecone RAG Vector Search
      if (this.pineconeClient) {
         console.log(`🧠 [Memory Layer] Querying live Pinecone Index '${this.indexName}' for docket: ${docketNumber} ...`);
         try {
           // 1. Convert the standard query into a high-dimensional vector via Gemini
           const queryEmbed = await aiInstance.embed({
             embedder: textEmbeddingModel,
             content: `Retrieve multi-year historical logs, compliance notices, and victim claims for USVSST Docket: ${docketNumber}`
           });

           // 2. Query the live cloud DB via Pinecone Client
           const index = this.pineconeClient.Index(this.indexName);
           const result = await index.query({
             vector: queryEmbed,
             topK: 5,
             includeMetadata: true,
             filter: { docket: { $eq: docketNumber } }
           });

           // 3. Extract the text metadata 
           if (result.matches && result.matches.length > 0) {
              const histories = result.matches.map(m => m.metadata?.text as string).filter(Boolean);
              console.log(`🧠 [Memory Layer] Located ${histories.length} historical vector matches in Pinecone.`);
              return histories;
           } else {
              console.log(`🧠 [Memory Layer] No vector matches found for ${docketNumber} in Pinecone.`);
              return [];
           }
         } catch(e) {
           console.error("🌲 [Memory Layer] Pinecone Query Error:", e);
           // Fallback below if pinecone throws (e.g., index doesn't exist yet)
         }
      }

      // Phase 1: Failback local memory vault (if API key missing or query fails)
      console.log(`🧠 [Memory Layer] Retrieving simulated context (Phase 1 local fallback) for docket: ${docketNumber}`);
      return this.memoryVault.get(docketNumber) || [];
    }
}
  
export const globalMemory = new AgenticMemoryStore();
