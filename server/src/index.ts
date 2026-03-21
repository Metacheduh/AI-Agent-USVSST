import { genkit, z } from 'genkit';
import { googleAI, textEmbedding004 } from '@genkit-ai/googleai';
import * as dotenv from 'dotenv';
import { globalMemory } from './memory';

dotenv.config();

// Initialize the Genkit instance
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-pro', // Using the Pro model for deep reasoning and evaluation
});

// JSON Schema for factual data extraction required by the DOJ Analysts
export const ForfeitureExtractionSchema = z.object({
  caseName: z.string(),
  docketNumber: z.string().optional(),
  seizedValue: z.number().describe('The strict dollar value of the seized asset. No commas.'),
  stage: z.enum(['Filed', 'Seized', 'Litigation', 'Forfeiture Ordered', 'Liquidation', 'Treasury Transfer', 'USVSST Deposit', 'Distributed']),
  category: z.string(),
  usvsst_eligibility: z.enum(['High', 'Medium', 'Low', 'Unlikely']).describe('Likelihood this case\'s forfeited assets will reach the USVSST Fund'),
  eligibilityReason: z.string().describe('One-sentence legal justification for the eligibility score')
});

/**
 * IntelScout Extraction Flow
 * Implements the Genkit Iterative Refinement pattern to guarantee zero-hallucination data extraction
 * from dense legal texts and press releases.
 */
export const intelscoutExtractionFlow = ai.defineFlow(
  {
    name: 'intelscoutExtractionFlow',
    inputSchema: z.string(),
    outputSchema: ForfeitureExtractionSchema,
  },
  async (rawText) => {
    let attempts = 0;
    let extractedData;
    let feedback = "";
    
    console.log("Starting initial extraction pass...");
    
    // Step 1: Initial extraction
    const initialResponse = await ai.generate({
      prompt: `Extract the factual data from this legal text into the required JSON schema. 
               Only extract explicit facts. Do not guess.
               
               IMPORTANT RULES FOR DOCKET METADATA:
               - If no dollar value is mentioned, set seizedValue to 0 (this is correct, not a hallucination).
               - The 'category' should be inferred from the case context (e.g., terrorism, sanctions, fraud).
               - The 'stage' should reflect the most recent procedural status mentioned. If only a filing date is given, use 'Filed'. If the case is described as ongoing litigation, use 'Litigation'.
               
                USVSST ELIGIBILITY SCORING RULES (based on 34 U.S.C. § 20144, as amended by the 
                Fairness for 9/11 Families Act):
                
                The USVSST Fund receives deposits from cases involving violations of IEEPA (International Emergency 
                Economic Powers Act) or TWEA (Trading with the Enemy Act) with a nexus to a state sponsor of terrorism.
                State sponsors of terrorism: Iran, North Korea, Syria, Cuba (Sudan was previously designated).
                
                DEPOSIT RATES (per statute §20144(e)):
                - Criminal forfeitures: 100% of proceeds
                - Civil penalties (post-Nov 2019): 75% of proceeds
                - Civil penalties (pre-Nov 2019): 50% of proceeds
                
                FUND STATUS: 6th distribution ongoing ($2.825B total, payments began Jan 5, 2026). 
                Pool split: 50% 9/11-related ($1.4125B), 50% non-9/11-related ($1.4125B).
                7th distribution under evaluation for Jan 2027 (new app deadline: Jun 1, 2026).
                Fund sunsets: January 2, 2039.
                
                KEY ACTIVE CASES TO RECOGNIZE:
                - MDL 1570 (03-md-01570): In re Terrorist Attacks on September 11, 2001 — core 9/11 litigation
                  (Saudi appeal pending in 2nd Circuit, charity defendants SJ briefing, Sudan discovery,
                  CIA subpoena motion to compel). ALWAYS HIGH eligibility.
                - 1:25-cv-05745 (E.D.N.Y.): US v. ~127,271 Bitcoin — massive forfeiture under 18 USC §981.
                  TRIA claimants (Breitweiser et al) have filed claims. HIGH eligibility.
                - Billy Asemani v. USVSST (23-3271, 6th Cir.): Lawsuit AGAINST the Fund — UNLIKELY eligibility.
                - Burnett v. Al Baraka (03-cv-9849): Part of MDL 1570. HIGH eligibility.
                
                You MUST assign a usvsst_eligibility score and eligibilityReason:
                
                HIGH: Case involves IEEPA/TWEA violations or sanctions enforcement connected to a state sponsor
                      of terrorism. Includes: sanctions evasion, terrorist financing through designated entities,
                      ATA civil actions (like MDL 1570), and crypto/asset forfeitures with terrorism nexus.
                
                MEDIUM: Terrorism-related litigation in early stages (Filed, Seized, Litigation) where final
                        forfeiture hasn't been ordered. Includes JASTA cases against foreign sovereigns and
                        cases where terrorism connection exists but proceeds aren't yet determined.
                
                LOW: Financial crimes, export control violations, money laundering touching sanctioned countries
                     without clear direct nexus to state-sponsored terrorism.
                
                UNLIKELY: General forfeiture (drugs, fraud, tax evasion) with no terrorism/state-sponsor
                          connection, OR lawsuits filed AGAINST the USVSST Fund itself..
               
               Text: "${rawText}"`,
      output: { schema: ForfeitureExtractionSchema }
    });
    
    extractedData = initialResponse.output;
    if (!extractedData) throw new Error("Failed initial extraction.");

    // Step 2: IntelScout Evaluator Loop (Iterative Refinement)
    // PRD: "max 3 strikes" — 3 evaluation passes, each followed by refinement if needed.
    while (attempts < 3) {
      attempts++;
      console.log(`Running IntelScout Audit Pass ${attempts}/3...`);
      
      const evaluationResponse = await ai.generate({
        prompt: `You are the strict IntelScout DOJ auditor. Evaluate this extracted JSON against the source text.
                 Critique criteria:
                 1. Are there any hallucinations (invented facts not in the text)?
                 2. Is the seizedValue correct? A value of 0 is VALID if no dollar amount is mentioned in the text.
                 3. Does the pipeline stage reasonably match the text? For docket filings, 'Filed' or 'Litigation' are valid if a case date is provided.
                 4. Is the category a reasonable inference from the case context? Inferring 'Terrorism' from a case titled 'Terrorist Attacks' is NOT a hallucination.
                 5. The usvsst_eligibility and eligibilityReason are AI assessments — they are ALWAYS valid as long as the reasoning is sound.
                 
                 JSON: ${JSON.stringify(extractedData)}
                 Source Text: "${rawText}"`,
        output: {
          schema: z.object({
            isValid: z.boolean(),
            critique: z.string()
          })
        }
      });
      
      const evaluation = evaluationResponse.output;
      if (!evaluation) throw new Error("Evaluation failed.");
      
      if (evaluation.isValid) {
        console.log("Audit passed. Returning verified data.");
        break; // Passed strict audit
      }
      
      // Final attempt exhausted — reject the document
      if (attempts >= 3) {
        throw new Error("Document rejected: Failed strict factual audit after maximum AI refinement attempts.");
      }
      
      feedback = evaluation.critique;
      console.log(`Audit failed. Refining based on critique: ${feedback}`);
      
      // Step 3: Refine based on critique (The Optimizer)
      const refinementResponse = await ai.generate({
        prompt: `Refine this JSON extraction based on the auditor's strict critique.
                 Current JSON: ${JSON.stringify(extractedData)}
                 Critique: "${feedback}"
                 Source Text: "${rawText}"`,
        output: { schema: ForfeitureExtractionSchema }
      });
      
      extractedData = refinementResponse.output;
      if (!extractedData) throw new Error("Refinement failed.");
    }

    return extractedData;
  }
);

/**
 * Counsel Chat Flow (Phase 5)
 * Interactive chatbot for Victims' Counsel to query pipeline data,
 * draft intelligent questions for lawyers, and get beneficiary updates.
 */
export const counselChatFlow = ai.defineFlow(
  {
    name: 'counselChatFlow',
    inputSchema: z.object({
      question: z.string(),
      caseContext: z.string().optional()
    }),
    outputSchema: z.object({
      response: z.string()
    }),
  },
  async (input) => {
    // Enrich with agentic memory if available
    let memoryContext = "";
    try {
      const historyLogs = await globalMemory.getHistoryAsync(ai, textEmbedding004, input.question);
      if (historyLogs.length > 0) {
        memoryContext = `\nHISTORICAL CONTEXT FROM AGENTIC MEMORY:\n- ${historyLogs.join('\n- ')}`;
      }
    } catch (e) {
      // Memory layer may not be connected; continue without it
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are the USVSST Intelligence Assistant — an AI counsel tool for victims of state-sponsored terrorism.
               Your expertise covers federal asset forfeiture pipelines, DOJ seizure cases, fund beneficiary rights, and compliance law.
               
               RULES:
               1. Only reference facts from the provided case database or agentic memory. Do NOT hallucinate case data.
               2. If the user asks about a specific case, search the provided database first.
               3. If the user wants to draft a question for lawyers (e.g., Motley Rice), write a professional, actionable question grounded in the data.
               4. If the user asks for a beneficiary update, write a warm, empathetic, factual summary.
               5. If you don't know, say so honestly.
               
               ACTIVE CASE DATABASE:
               ${input.caseContext || 'No cases loaded yet.'}
               ${memoryContext}
               
               USER QUESTION: ${input.question}`,
    });

    return { response: response.text };
  }
);

/**
 * Content Engine Flow
 * Generates external outputs (Lawyer Emails, Beneficiary Updates, etc.) from verified IntelScout JSON.
 */
export const contentEngineFlow = ai.defineFlow(
  {
    name: 'contentEngineFlow',
    inputSchema: ForfeitureExtractionSchema,
    outputSchema: z.object({
      lawyerEmail: z.string(),
      newsletter: z.string(),
      blogPost: z.string(),
      socialMediaPost: z.string()
    }),
  },
  async (verifiedData) => {
    // 1. RAG Retrieve: Fetch Agentic Memory using Pinecone Vector DB (Phase 2)
    const historyLogs = await globalMemory.getHistoryAsync(ai, textEmbedding004, verifiedData.docketNumber);
    const memoryContext = historyLogs.length > 0 
      ? `\nCRITICAL HISTORICAL CONTEXT (AGENTIC MEMORY):\n- ${historyLogs.join('\n- ')}` 
      : "";

    // We use the faster, cost-effective gemini-2.5-flash for raw content generation
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are the ADK Content Engine. 
               Take this verified DOJ/Federal forfeiture data and generate 4 pieces of content:
               1. lawyerEmail: A highly professional compliance email to the user's lawyers (Motley Rice) requesting status updates based on the pipeline stage.
               2. newsletter: A friendly, empathetic newsletter update for the USVSST Fund beneficiaries explaining the action.
               3. blogPost: A professional, structured article (with a title) suitable for the USVSST public website summarizing the latest asset seizure.
               4. socialMediaPost: A catchy, concise LinkedIn/X thread (max 3 sentences) summarizing the latest federal action and projecting strength.
               
               Verified Data: ${JSON.stringify(verifiedData)}
               ${memoryContext}
               
               IMPORTANT INSTRUCTION: You MUST incorporate the "Critical Historical Context" (if it exists) into ALL generated outputs. This proves you are an Agent with long-term memory.
               
               Return exactly those four strings in JSON format. Do not use markdown blocks around the JSON.`,
      output: {
        schema: z.object({
          lawyerEmail: z.string(),
          newsletter: z.string(),
          blogPost: z.string(),
          socialMediaPost: z.string()
        })
      }
    });
    
    if (!response.output) throw new Error("Content generation failed.");
    return response.output;
  }
);
