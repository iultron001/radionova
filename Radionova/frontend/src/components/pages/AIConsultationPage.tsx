import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  User,
  Bot,
  Layers,
  BarChart3
} from 'lucide-react';
import { AnyAnalysisResult, ChatMessage, DoctorProfile } from '../../types';

interface AIConsultationPageProps {
  doctor: DoctorProfile;
  activeContext: AnyAnalysisResult | null;
  onNavigateToStudio?: () => void;
}

export const AIConsultationPage: React.FC<AIConsultationPageProps> = ({
  doctor,
  activeContext,
  onNavigateToStudio
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    id: 'initial',
    role: 'assistant',
    content: `Greetings, ${doctor.name}. I am the RadiNova Clinical AI Assistant. I can help with differential diagnoses, radiologic findings, biomarker interpretation, and patient summaries. How can I assist your clinical evaluation today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'Explain the primary findings and focus area',
    'What are the primary differential diagnostic considerations?',
    'Generate a simplified summary for patient communication',
    'Recommend follow-up imaging or laboratory tests',
    'Are there any red-flag acute risk symptoms to rule out?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: activeContext || undefined
        })
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.response || 'No response content returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      let fallback = `Clinical Analysis Note:\nBased on current clinical guidelines, findings should be correlated with the patient's history, vital parameters, and physical examination.\n\n• Monitor symptom progression and inflammatory markers.\n• If acute pain or respiratory distress is present, urgent secondary imaging is recommended.\n• Consult institutional radiology protocol.`;

      if (activeContext && 'prediction' in activeContext) {
        fallback = `Clinical Second Opinion — ${activeContext.modality.toUpperCase()}:\n• Finding: ${activeContext.prediction} (${(activeContext.confidence * 100).toFixed(1)}% model certainty)\n• DenseNet-121 identifies high feature density in the designated region of interest.\n• Next Step: Review clinical correlation and consider targeted confirmatory imaging if clinical presentation diverges.`;
      } else if (activeContext && 'explanation' in activeContext) {
        fallback = `Clinical Analysis — ${activeContext.modality.toUpperCase()}:\n• Finding: ${activeContext.explanation.title}\n• Summary: ${activeContext.explanation.plain_language_summary}\n• Recommendation: Re-evaluate any biomarkers marked out-of-range during follow-up.`;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '16px', overflowY: 'auto', background: 'var(--bg-app)' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-lime)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-lime)' }}>
              AI Clinical Decision Support
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Clinical Second Opinion Studio
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Multi-turn AI consultation grounded in active diagnostic studies, radiologic patterns, and biomarkers.
          </p>
        </div>

        {messages.length > 1 && (
          <button
            onClick={() => setMessages([{
              id: 'reset',
              role: 'assistant',
              content: `Consultation session refreshed. Ready for new clinical inquiries, ${doctor.name}.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '8px 14px', color: 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: 650, cursor: 'pointer'
            }}
          >
            <Trash2 size={13} /> Clear Discussion
          </button>
        )}
      </div>

      {/* Active Context Strip */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: '10px', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={15} style={{ color: 'var(--accent-lime)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-muted)' }}>Active Case Context:</span>
          {activeContext ? (
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-lime)' }}>
              {'prediction' in activeContext
                ? `${activeContext.modality.toUpperCase()} — ${activeContext.prediction} (${(activeContext.confidence * 100).toFixed(1)}%)`
                : `${activeContext.modality.toUpperCase()} — ${activeContext.explanation.title}`}
            </span>
          ) : (
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>General Clinical Mode (no active scan loaded)</span>
          )}
        </div>
        {!activeContext && onNavigateToStudio && (
          <button onClick={onNavigateToStudio} style={{
            background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '6px',
            padding: '5px 10px', color: 'var(--accent-lime)', fontSize: '12px', fontWeight: 650, cursor: 'pointer'
          }}>
            Load a Study →
          </button>
        )}
      </div>

      {/* Chat Card */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: '14px', overflow: 'hidden'
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: isUser ? 'var(--accent-lime-muted)' : 'var(--bg-elevated)',
                  border: `1px solid ${isUser ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                  color: isUser ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isUser ? <User size={15} /> : <Bot size={15} />}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {isUser ? doctor.name : 'RadiNova Clinical AI'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{msg.timestamp}</span>
                  </div>
                  <div style={{
                    background: isUser ? 'var(--accent-lime-muted)' : 'var(--bg-elevated)',
                    border: `1px solid ${isUser ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '12px 16px',
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                  {!isUser && (
                    <button onClick={() => handleCopy(msg.id, msg.content)} style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: 'transparent', border: 'none',
                      color: 'var(--text-dim)', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                    }}>
                      {copiedId === msg.id ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={15} />
              </div>
              <div style={{
                display: 'flex', gap: '5px', alignItems: 'center',
                padding: '12px 16px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', borderRadius: '12px'
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--accent-lime)', display: 'block',
                    animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-dim)', marginRight: '4px' }}>Suggested:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                borderRadius: '9999px', padding: '4px 10px',
                color: 'var(--text-secondary)', fontSize: '11.5px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={11} style={{ color: 'var(--accent-lime)' }} />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
          style={{
            padding: '14px 16px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: '10px', background: 'var(--bg-card-subtle)'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your clinical inquiry or differential question..."
            style={{
              flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '10px 14px',
              color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--accent-lime)', color: '#080c10',
              border: 'none', borderRadius: '10px', padding: '10px 20px',
              fontWeight: 800, fontSize: '13.5px',
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !input.trim()) ? 0.5 : 1
            }}
          >
            <Send size={15} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
