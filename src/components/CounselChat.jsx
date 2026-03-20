import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function CounselChat({ liveCases }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Welcome, Counsel. I am the USVSST Intelligence Assistant powered by Genkit & Gemini AI.\n\nI can help you with:\n• Querying the status of any tracked federal forfeiture case\n• Drafting intelligent questions for lawyers (e.g., Motley Rice)\n• Providing verified pipeline updates for fund beneficiaries\n• Retrieving historical context from the Agentic Memory layer\n\nHow can I assist you today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/counsel-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, cases: liveCases })
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.error}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Unable to connect to the Genkit backend. Ensure the server is running on port 3000.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 65px)' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Counsel Intelligence Chat</h2>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
          Query pipeline data, draft lawyer questions, and get beneficiary updates — powered by Gemini AI & Agentic Memory.
        </p>
      </div>

      {/* Messages Container */}
      <div className="panel" style={{ 
        flex: 1, overflowY: 'auto', padding: '1.5rem', 
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-highlight)'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-surface-hover)',
              border: msg.role === 'assistant' ? '1px solid var(--border-highlight)' : 'none'
            }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--accent-blue)" />}
            </div>
            <div style={{ 
              maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-surface)',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
              lineHeight: 1.6, fontSize: '0.9rem', whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-highlight)'
            }}>
              <Bot size={16} color="var(--accent-blue)" />
            </div>
            <div style={{ 
              padding: '0.75rem 1rem', borderRadius: '12px',
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Querying Agentic Memory & Gemini AI...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="panel" style={{ 
        padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a case, draft a lawyer question, or request a beneficiary update..."
          rows={1}
          style={{ 
            flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '8px',
            resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
            lineHeight: 1.5
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{ 
            background: input.trim() && !isLoading ? 'var(--accent-blue)' : 'var(--bg-surface-hover)',
            color: 'white', border: 'none', width: '40px', height: '40px',
            borderRadius: '8px', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </main>
  );
}
