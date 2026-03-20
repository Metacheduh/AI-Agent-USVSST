# Product Requirements Document: AI Agent USVSST

## 1. Product Vision & Overview
**AI Agent USVSST** is a highly specialized, autonomous federal intelligence dashboard designed for DOJ Regulatory Analysts and Fund Administrators. The system leverages state-of-the-art multimodal AI, Multi-Agent Orchestration, and retrieval-augmented generation (RAG) to actively monitor federal asset seizures. The overarching objective is to rapidly identify, verify, and catalog forfeited funds (e.g., from sanctioned nations or state-sponsored cybercrime) that are legally eligible for integration into the United States Victims of State Sponsored Terrorism (USVSST) Fund.

## 2. Target User Personas
*   **DOJ Regulatory Analyst:** Requires high-density, strictly factual data on federal asset movement with zero tolerance for hallucinations.
*   **Fund Administrators / Compliance Officers:** Need automated tracking of the grueling 8-stage federal pipeline (from Initial Seizure to Treasury Deposit).
*   **Victims' Counsel (e.g., Motley Rice):** Require precisely formatted compliance and status request emails.
*   **USVSST Beneficiaries:** Require empathetic, plain-language updates on asset seizures and fund status delivered via Blog Posts, Newsletters, LinkedIn, and X (Twitter) posts.

## 3. Technology Stack & Architecture
*   **Frontend Interface:** React.js via Vite, featuring a premium dark-mode enterprise UI (utilizing `recharts` for pipeline visualization and `html2pdf.js` for content distribution).
*   **Backend Server:** Node.js / Express written in strict TypeScript.
*   **AI Orchestration Framework:** **Firebase Genkit**, providing structured outputs equipped with tracing, evaluation, and strict generative bounding.
*   **Large Language Models (LLMs):**
    *   `googleai/gemini-2.5-pro`: Utilized exclusively for complex reasoning, extracting structured schemas, and zero-hallucination evaluation loops (`intelscout`).
    *   `googleai/gemini-2.5-flash`: Utilized for speed and efficiency in generating user-facing conversational text (`contentengine`).
*   **Data Aggregation:** Parallel REST APIs bridging live global external feeds (SEC, DOJ, OFAC, UK NCA).
*   **Memory Layer:** Agentic Vector DB (Powered natively by `@pinecone-database/pinecone` and Google's `textEmbedding004`) tracking historic constraints across massive timelines. Features an autonomous mock-array fallback.

## 4. Core Capabilities (ADK Pipelines)

### 4.1 GovWatch (Global Ingestion Bot)
*   **Function:** Actively scrapes open-source multi-national feeds (US SEC, Treasury OFAC, UK National Crime Agency) via `Promise.allSettled`.
*   **Behavior:** Filters mass PR unstructured text for enforcement actions (Sanctions, Seizures, Laundering claims) across the WAF, passing viable endpoints to IntelScout.

### 4.2 IntelScout (Iterative Refinement Auditor)
*   **Function:** Enforces a "Zero-Hallucination" bounding box on unstructured text to generate rigid JSON payloads (`caseName`, `seizedValue`, `stage`, `category`, `docketNumber`).
*   **Behavior:** Employs an iterative refinement loop (max 3 strikes). If `gemini-2.5-pro` attempts to parse a regular press release, the evaluation flow detects the error, "critiques itself," and formally rejects the document.

### 4.3 Agentic Memory (Live Pinecone RAG Sequence)
*   **Function:** Prevents "AI Amnesia." Federal forfeiture battles can span years. The Memory layer tracks long-term constraints over vector dimensions.
*   **Behavior:** Embeds the new active Case Docket into a semantic vector and queries a live Pinecone vector store. Injects the top-5 semantic historical text logs straight into the analyst baseline matrix.

### 4.4 ContentEngine (Generative Hub)
*   **Function:** Autonomously generates four strictly formatted, contextually aware updates based on the exact status of verified data.
*   **Outputs:** 
    1.  **Lawyer Accountability:** Highly professional compliance status inquiry emails (e.g. for Motley Rice).
    2.  **Beneficiary Update:** Empathetic newsletter blast communicating seized asset victories.
    3.  **Public Announcement:** A structurally sound, SEO-ready blog post for the primary USVSST website.
    4.  **Social Media Alert:** Catchy, 3-sentence updates optimized for an X (Twitter) or LinkedIn feed.
*   **Export:** Direct translation to locally rendered PDF files.

## 5. Security & Limitations
*   **Strict Bounding:** Predictive modeling or speculative dates of asset distribution are absolutely forbidden. The AI relies *only* on the exact stage reflected in the ingested text.
*   **WAF Resiliency:** Uses robust concurrent API requests so that Akamai/Cloudflare drops on OFAC won't cause the UK NCA fallback node to crash.

## 6. Future Implementations (Roadmap)
*   ~~**Phase 1:** Direct integration with live Cloud Run backend servers.~~ *(COMPLETED)*
*   ~~**Phase 2:** Upgrading the simulated RAG memory to a live cloud Pinecone Vector Store.~~ *(COMPLETED)*
*   ~~**Phase 3:** Expanding `govwatch` to handle international seizure endpoints (e.g., OFAC lists, EU Sanctions data).~~ *(COMPLETED)*
*   ~~**Phase 4:** Autonomous Faceless X/Twitter Profile for broadcasting IntelScout seizures.~~ *(COMPLETED)*
*   ~~**Phase 5:** Interactive Chatbot Module for Victims Counsel to query historical pipeline data directly.~~ *(COMPLETED)*
*   ~~**Phase 6:** Code-splitting and performance optimization for the production frontend bundle.~~ *(COMPLETED)*
*   **Phase 7:** Role-based access control (RBAC) for DOJ Analysts vs. Victims' Counsel vs. Fund Administrators.

## 7. Setup & Installation

### Prerequisites
*   **Node.js** v18+ and **npm**
*   A **Google AI Studio** API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))
*   *(Optional)* A **Pinecone** API key for live RAG memory
*   *(Optional)* **X/Twitter API v2** credentials for autonomous social broadcasting

### Environment Configuration
Create or update `server/.env` with your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=usvsst-memory-layer
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```
> **Note:** The system gracefully degrades without Pinecone or Twitter keys — it will fall back to a local memory store and simulated broadcasting.

### Running the Application
```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Start the Genkit backend (port 3000)
cd server && npm start

# 3. In a new terminal, start the Vite frontend (port 5173)
npm run dev
```

The frontend proxies `/api` requests to the backend automatically via `vite.config.js`.
