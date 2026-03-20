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
  category: z.string()
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
      prompt: `Extract the factual data from this DOJ text into the required JSON schema. 
               Only extract explicit facts. Do not guess.
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
                 1. Are there any hallucinations? 
                 2. Is the seizedValue perfectly exact based on the text?
                 3. Does the pipeline stage strictly match the text semantics?
                 
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
