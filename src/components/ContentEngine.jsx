import React from 'react';
import { ArrowRight, Mail } from 'lucide-react';

function ContentCard({ title, type, status, excerpt, onReview }) {
  return (
    <div className="panel flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}</span>
        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', color: status === 'Approved' || status === 'Generated' ? '#0a0e17' : 'var(--text-primary)', backgroundColor: status === 'Approved' || status === 'Generated' ? 'var(--status-success)' : 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>{status}</span>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{excerpt}</p>
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onReview} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Review Content <ArrowRight size={14} /></button>
      </div>
    </div>
  );
}

export default function ContentEngine({ generatedContent, isGenerating, onForceGeneration, onSelectContent }) {
  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Genkit Content Engine</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Auto-generated compliance and beneficiary updates powered by Genkit & ADK Pipelines.</p>
        </div>
        <button 
          onClick={onForceGeneration}
          disabled={isGenerating}
          style={{ background: isGenerating ? 'var(--text-tertiary)' : 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: isGenerating ? 'wait' : 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={16} /> {isGenerating ? 'Running IntelScout Audit...' : 'Force Generation Run'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {generatedContent ? (
          <>
            <ContentCard 
              title="Motley Rice Status Request" 
              type="Lawyer Accountability" 
              status="Generated"
              excerpt={generatedContent.generatedContent.lawyerEmail.substring(0, 160) + "..."}
              onReview={() => onSelectContent({ title: "Lawyer Accountability - Motley Rice", content: generatedContent.generatedContent.lawyerEmail })}
            />
            <ContentCard 
              title="USVSST Beneficiary Newsletter" 
              type="Email Blast" 
              status="Generated"
              excerpt={generatedContent.generatedContent.newsletter.substring(0, 160) + "..."}
              onReview={() => onSelectContent({ title: "USVSST Beneficiary Newsletter", content: generatedContent.generatedContent.newsletter })}
            />
            <ContentCard 
              title="USVSST Verified Blog Post" 
              type="Public Announcement" 
              status="Generated"
              excerpt={generatedContent.generatedContent.blogPost.substring(0, 160) + "..."}
              onReview={() => onSelectContent({ title: "Public Blog Post Announcement", content: generatedContent.generatedContent.blogPost })}
            />
            <ContentCard 
              title="X/LinkedIn Social Alert" 
              type="Social Media" 
              status="Generated"
              excerpt={generatedContent.generatedContent.socialMediaPost.substring(0, 160) + "..."}
              onReview={() => onSelectContent({ title: "Social Media Alert Thread", content: generatedContent.generatedContent.socialMediaPost })}
            />
            <div className="panel flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                <h4 style={{ color: 'var(--accent-blue)', margin: 0, fontSize: '0.9rem' }}>IntelScout Audit Facts (Zero-Hallucination)</h4>
                <pre style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflowX: 'auto', background: 'var(--bg-base)', padding: '1rem', border: '1px solid var(--border-highlight)' }}>
{JSON.stringify(generatedContent.verifiedData, null, 2)}
                </pre>
            </div>
          </>
        ) : (
          <>
            <ContentCard 
              title="Motley Rice Status Request" 
              type="Lawyer Accountability" 
              status="Pending Review"
              excerpt="Dear Legal Team: Based on today's intelscout verified data, Case 1:24-cv-00123 has entered the Litigation stage. Please confirm strategic alignment..."
              onReview={() => onSelectContent({ title: "Lawyer Accountability - Motley Rice", content: "Dear Legal Team,\n\nBased on today's IntelScout verified data, Case 1:24-cv-00123 (US v. North Korean Crypto Assets) has entered the Litigation stage with a seized value of $42.5M.\n\nPlease confirm strategic alignment and provide an updated timeline for potential forfeiture proceedings.\n\nThis automated notice was generated by the USVSST ADK Pipeline." })}
            />
            <ContentCard 
              title="USVSST Beneficiary Newsletter" 
              type="Beneficiary Update" 
              status="Approved"
              excerpt="Good morning. We are pleased to report that $112M has successfully transitioned to Liquidation status in the Iranian Oil Tanker case..."
              onReview={() => onSelectContent({ title: "USVSST Beneficiary Newsletter", content: "Good morning,\n\nWe are pleased to report that $112M has successfully transitioned to Liquidation status in the Iranian Oil Tanker case (1:23-cr-00991).\n\nThis means the seized assets are being converted to liquid funds and are on track for eventual deposit into the USVSST Fund. We will continue to provide updates as the case progresses through the Treasury Transfer stage.\n\nThank you for your patience and continued trust.\n\n— USVSST Intelligence Team" })}
            />
            <ContentCard 
              title="USVSST Verified Blog Post" 
              type="Public Announcement" 
              status="Drafting"
              excerpt="Federal asset forfeiture pipelines have seen a 12% increase in Crypto/Sanctions seizures this quarter..."
              onReview={() => onSelectContent({ title: "Public Blog Post Announcement", content: "Federal Asset Forfeiture Pipeline Update\n\nFederal asset forfeiture pipelines have seen a 12% increase in Crypto/Sanctions seizures this quarter, driven primarily by enforcement actions against North Korean and Iranian-linked financial networks.\n\nKey highlights:\n• US v. North Korean Crypto Assets (1:24-cv-00123): $42.5M in Litigation\n• US v. Iranian Oil Tanker Fnd. (1:23-cr-00991): $112M in Liquidation\n• US v. Al-Qaeda Linked Accounts (1:25-cv-00044): $18.3M Seized\n\nThe USVSST Fund continues to track these cases through our zero-hallucination AI pipeline to ensure maximum transparency for all beneficiaries." })}
            />
            <ContentCard 
              title="X/LinkedIn Social Alert" 
              type="Social Media Alert" 
              status="Ready for Broadcast"
              excerpt="🚨 BREAKING: The USVSST Fund tracks $5.2B in federal forfeitures. Latest seizure updates inside."
              onReview={() => onSelectContent({ title: "Social Media Alert Thread", content: "🚨 BREAKING: The USVSST Fund now tracks $5.2B in federal forfeitures across 174 active cases.\n\nLatest action: $42.5M in North Korean crypto assets now in active Litigation.\n\nOur AI-powered pipeline ensures zero-hallucination data extraction for full transparency. #USVSST #AssetForfeiture #DOJ" })}
            />
          </>
        )}
      </div>
    </main>
  );
}
