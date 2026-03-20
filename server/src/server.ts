import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import { intelscoutExtractionFlow, contentEngineFlow, counselChatFlow } from './index';
import { socialEngine } from './social';

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

let liveCasesDb: any[] = []; // In-memory database storing verified federal cases

// Endpoint to fetch the current live database
app.get('/api/cases', (req, res) => {
  res.json({ success: true, cases: liveCasesDb });
});

// ADK GovWatch Pipeline trigger: Scrapes live feeds, parses via Genkit, stores in DB
app.post('/api/govwatch-trigger', async (req, res) => {
  try {
    const parser = new Parser({ customFields: { item: ['description'] }});
    console.log("📡 govwatch: Initiating live scrape of Tier-1 Federal & International feeds (Phase 3)...");

    const FEED_URLS = [
      { name: "US SEC/DOJ", url: "https://www.sec.gov/news/pressreleases.rss" },
      { name: "Treasury OFAC", url: "https://home.treasury.gov/news/press-releases/feed" },
      { name: "UK National Crime Agency", url: "https://www.nationalcrimeagency.gov.uk/news?format=feed&type=rss" }
    ];

    // Parallel fetching to avoid WAF timeouts blocking the whole pipeline
    const feedResults = await Promise.allSettled(
      FEED_URLS.map(source => parser.parseURL(source.url).then(feed => ({ source, feed })))
    );

    let allAlerts: any[] = [];

    for (const result of feedResults) {
       if (result.status === 'fulfilled') {
          console.log(`🌐 Connected to ${result.value.source.name} feeds.`);
          // Filter feeds for actionable enforcement/sanctions keywords
          const enforcementAlerts = result.value.feed.items.filter(i => 
             i.title?.toLowerCase().includes('charge') || 
             i.title?.toLowerCase().includes('fraud') || 
             i.title?.toLowerCase().includes('securit') ||
             i.title?.toLowerCase().includes('sanction') ||
             i.title?.toLowerCase().includes('seize') ||
             i.title?.toLowerCase().includes('laundering')
          ).map(i => ({ ...i, agencyName: result.value.source.name }));
          
          allAlerts = [...allAlerts, ...enforcementAlerts];
       } else {
          console.log(`⚠️ govwatch warning: WAF shield blocked access or timeout for feed ->`, result.reason?.message?.substring(0,60));
       }
    }

    // Process just the 3 most strictly filtered alerts to maintain response speeds (<20 seconds)
    const recentAlerts = allAlerts.slice(0, 3);
    const newlyVerified = [];
    
    for (const item of recentAlerts) {
       console.log(`🤖 intelscout: Auditing [${item.agencyName}] document: "${item.title}"`);
       const payload = `${item.title}\n${item.contentSnippet || item.description || ''}`;
       
       try {
         // Pass raw internet data into the zero-hallucination Genkit flow!
         const verified = await intelscoutExtractionFlow(payload);
         newlyVerified.push({
           ...verified,
           id: verified.docketNumber || `INTL-${Math.floor(Math.random()*9000)+1000}`,
           name: verified.caseName.substring(0, 60), 
           source: `${item.agencyName} (Live Pipeline)`,
           lastVerified: new Date().toLocaleTimeString()
         });
         console.log(`✅ intelscout Accepted: ${verified.caseName}`);

         console.log(`📝 contentengine: Generating outputs for ${verified.caseName}...`);
         const generatedContent = await contentEngineFlow(verified);
         
         // Phase 4: Autonomously tweet the interception via Faceless Profile!
         await socialEngine.publishAlert(generatedContent.socialMediaPost);

       } catch (err: any) {
         console.log(`⚠️ intelscout Rejected: Document failed strict factual audit. Stage Hallucinated.`);
       }
    }
    
    // Prefix the new cases to the live database
    liveCasesDb = [...newlyVerified, ...liveCasesDb];
    res.json({ success: true, addedCount: newlyVerified.length, sourcesParsed: feedResults.filter(r => r.status==='fulfilled').length });
    
  } catch (error: any) {
    console.error("❌ GovWatch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Main ADK Intake Endpoint
app.post('/api/intake', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
        res.status(400).json({ error: 'Text payload is required from govwatch' });
        return;
    }
    
    console.log("📥 Received new govwatch payload. Initiating IntelScout audit...");
    
    // 1. intelscout: Verify facts via Iterative Refinement
    const verifiedData = await intelscoutExtractionFlow(text);
    console.log("✅ IntelScout Verification Complete:", verifiedData);
    
    // 2. contentengine: Generate Publishing Hub outputs based on strict facts
    console.log("📝 Initiating Content Engine generation...");
    const content = await contentEngineFlow(verifiedData);
    console.log("✅ Content Generation Complete.");
    
    res.json({
      success: true,
      verifiedData,
      generatedContent: content
    });
  } catch (error: any) {
    console.error("❌ Pipeline Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Phase 5: Counsel Chat Endpoint — Interactive AI assistant for Victims' Counsel
app.post('/api/counsel-chat', async (req, res) => {
  try {
    const { question, cases } = req.body;
    if (!question) {
        res.status(400).json({ error: 'Question is required' });
        return;
    }
    
    console.log(`💬 Counsel Chat: "${question.substring(0, 80)}..."`);
    
    // Serialize the current case database as context for the AI
    const caseContext = (cases && cases.length > 0) 
      ? JSON.stringify(cases, null, 2)
      : (liveCasesDb.length > 0 ? JSON.stringify(liveCasesDb, null, 2) : undefined);
    
    const result = await counselChatFlow({ question, caseContext });
    console.log(`✅ Counsel Chat response generated.`);
    
    res.json({ success: true, response: result.response });
  } catch (error: any) {
    console.error("❌ Counsel Chat Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 USVSST ADK Genkit Backend listening on http://localhost:${PORT}`);
});
