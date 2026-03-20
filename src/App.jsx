import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, Database, Activity, FileText, ShieldCheck, Mail, Bell, MessageCircle
} from 'lucide-react';
import { casesData } from './data/mockData';
import html2pdf from 'html2pdf.js';
import './index.css';

// Phase 6: Lazy-loaded view components for code-splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const CasesDatabase = lazy(() => import('./components/CasesDatabase'));
const ADKPipelines = lazy(() => import('./components/ADKPipelines'));
const ContentEngine = lazy(() => import('./components/ContentEngine'));
const CounselChat = lazy(() => import('./components/CounselChat'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading module...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [liveCases, setLiveCases] = useState(casesData);
  const [selectedContentInfo, setSelectedContentInfo] = useState(null);

  const handlePdfDownload = () => {
    const element = document.getElementById('pdf-content-wrapper');
    const opt = {
      margin:       1,
      filename:     `USVSST-${selectedContentInfo.title.replace(/\s+/g, '-')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const fetchLiveCases = async () => {
    try {
      const resp = await fetch('/api/cases');
      const data = await resp.json();
      if (data.success && data.cases && data.cases.length > 0) {
        setLiveCases(data.cases);
      }
    } catch (e) {
      console.error("Could not fetch live DB yet.");
    }
  };

  useEffect(() => {
    fetchLiveCases();
    const interval = setInterval(fetchLiveCases, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGovWatchTrigger = async () => {
    setIsScraping(true);
    try {
      await fetch('/api/govwatch-trigger', { method: 'POST' });
      await fetchLiveCases();
    } catch (e) {
      alert("GovWatch failed to connect to backend on port 3000.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleForceGeneration = async () => {
    setIsGenerating(true);
    setGeneratedContent(null);
    try {
      const MOCK_DOJ_ALERT = `
FOR IMMEDIATE RELEASE
Department of Justice, U.S. Attorney's Office
Today, the United States filed a civil forfeiture complaint against $85,000,000 in Iranian sanctioned oil funds. The action, docketed as 9:25-cv-00444, ensures these assets remain seized pending litigation.`;
      
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: MOCK_DOJ_ALERT })
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedContent(data);
      } else {
        alert("Genkit Error: " + data.error);
      }
    } catch (e) {
      alert("Failed to connect to Genkit Backend API on port 3000.");
    } finally {
      setIsGenerating(false);
    }
  };

  const TAB_TITLES = {
    dashboard: 'Pipeline Overview',
    content: 'ContentEngine (Generative Hub)',
    cases: 'Historical Case CRM',
    adk: 'ADK Orchestration Server',
    chat: 'Counsel Intelligence Chat'
  };
  
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* PDF Generation Modal */}
      {selectedContentInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="panel flex-col gap-4" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-base)' }}>
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Review Full Content</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePdfDownload}
                  style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} /> Export as PDF
                </button>
                <button 
                  onClick={() => setSelectedContentInfo(null)}
                  style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                  Close Modal
                </button>
              </div>
            </div>
            <div id="pdf-content-wrapper" style={{ padding: '2rem', backgroundColor: '#ffffff', color: '#1a1a1a', borderRadius: '4px', fontSize: '11pt', lineHeight: 1.6, fontFamily: 'Georgia, serif' }}>
              <div style={{ paddingBottom: '20px', marginBottom: '20px', borderBottom: '2px solid #222', textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '16pt', textTransform: 'uppercase', letterSpacing: '2px' }}>Department of Justice - USVSST Action</h1>
                <p style={{ margin: '5px 0 0 0', color: '#555', fontSize: '10pt' }}>{selectedContentInfo.title}</p>
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {selectedContentInfo.content}
              </div>
              <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc', fontSize: '9pt', color: '#777', textAlign: 'center' }}>
                Generated by Genkit AI Prototype • Verified USVSST Data Pipeline
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="panel flex-col gap-6" style={{ width: '280px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, display: 'flex' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
          <ShieldCheck color="var(--accent-blue)" size={28} />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>AI Agent USVSST</h2>
        </div>
        
        <nav className="flex-col gap-2" style={{ display: 'flex', flex: 1 }}>
          <NavItem icon={<LayoutDashboard />} label="Intelligence Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Database />} label="Cases Database" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
          <NavItem icon={<Activity />} label="ADK Pipelines" active={activeTab === 'adk'} onClick={() => setActiveTab('adk')} />
          <NavItem icon={<Mail />} label="Content Engine" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
          <NavItem icon={<MessageCircle />} label="Counsel Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        </nav>
        
        <div className="panel" style={{ padding: '1rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-highlight)' }}>
          <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-tertiary)' }}>DOJ Regulatory Analyst Mode</p>
          <div className="flex items-center justify-between" style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-col w-full h-full" style={{ overflowY: 'auto' }}>
        {/* Top Header */}
        <header className="flex items-center justify-between panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '1rem 2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.03em' }}>
            {TAB_TITLES[activeTab] || 'Pipeline Overview'}
          </h1>
          <div className="flex items-center gap-6">
            <Bell size={18} color="var(--text-secondary)" />
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>DOJ</div>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          {activeTab === 'dashboard' && (
            <Dashboard liveCases={liveCases} isScraping={isScraping} onGovWatchTrigger={handleGovWatchTrigger} />
          )}
          {activeTab === 'content' && (
            <ContentEngine generatedContent={generatedContent} isGenerating={isGenerating} onForceGeneration={handleForceGeneration} onSelectContent={setSelectedContentInfo} />
          )}
          {activeTab === 'cases' && (
            <CasesDatabase liveCases={liveCases} />
          )}
          {activeTab === 'adk' && (
            <ADKPipelines />
          )}
          {activeTab === 'chat' && (
            <CounselChat liveCases={liveCases} />
          )}
        </Suspense>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '0.75rem', 
        padding: '0.75rem 1rem', 
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
        borderLeft: active ? '3px solid var(--accent-blue)' : '3px solid transparent',
        transition: 'all 0.2s ease',
        fontWeight: active ? 500 : 400
      }}
    >
      <span style={{ color: active ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}>{icon}</span>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </div>
  );
}
