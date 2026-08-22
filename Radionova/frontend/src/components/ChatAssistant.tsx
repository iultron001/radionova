import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Copy, Check, Trash2, ArrowRight, Key, Settings2 } from 'lucide-react';
import { ChatMessage, AnyAnalysisResult } from '../types';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: AnyAnalysisResult | null;
}

const QUICK_PROMPTS = [
  "What are the immediate short-term risks for this scan?",
  "Explain the Grad-CAM heatmap focal area",
  "What is the step-by-step action plan ('What to do now')?",
  "What are the differential diagnostic considerations?",
  "Explain the clinical precautions and red flag warning signs"
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  isOpen,
  onClose,
  activeContext
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to RadiNova AI Clinical Assistant. I can assist with deep radiographic pattern recognition, Grad-CAM explainability maps, lab report statistics, and evidence-grounded decision support guidelines.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Custom API Provider & Key Settings
  const [apiProvider, setApiProvider] = useState<'auto' | 'gemini' | 'openai'>(() => {
    return (localStorage.getItem('radinova_api_provider') as any) || 'auto';
  });
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('radinova_custom_api_key') || '';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSaveSettings = () => {
    localStorage.setItem('radinova_api_provider', apiProvider);
    localStorage.setItem('radinova_custom_api_key', customApiKey);
    setShowSettings(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: activeContext || undefined,
          apiKey: customApiKey.trim() || undefined,
          apiProvider: apiProvider !== 'auto' ? apiProvider : undefined
        })
      });

      if (!response.ok) throw new Error('Assistant API request failed');
      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Clinical Decision Support Intelligence: Please review active study findings, correlate with baseline vitals, and verify with a qualified clinician.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Conversation cleared. Ask any diagnostic question regarding radiographs, lab panels, or clinical triage protocols.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-drawer">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <span>RadiNova Clinical AI Assistant</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            style={{ background: 'none', border: 'none', color: showSettings ? 'var(--accent)' : '#DDD', cursor: 'pointer' }}
            title="Configure AI API Engine (Gemini / OpenAI)"
            aria-label="API Settings"
          >
            <Settings2 size={15} />
          </button>
          <button 
            onClick={clearChat}
            style={{ background: 'none', border: 'none', color: '#DDD', cursor: 'pointer' }}
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={15} />
          </button>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
            aria-label="Close Assistant"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* API Key Configuration Dropdown Panel */}
      {showSettings && (
        <div style={{ background: 'var(--bg-card-warm)', borderBottom: '1px solid var(--border-medium)', padding: '12px 16px', fontSize: '13.5px' }}>
          <div style={{ fontWeight: 750, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
            <Key size={14} style={{ color: 'var(--accent)' }} />
            <span>AI Model & API Key Provider</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="provider" 
                checked={apiProvider === 'auto'} 
                onChange={() => setApiProvider('auto')} 
              />
              <span>Smart Medical Engine (Built-in)</span>
            </label>
            <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="provider" 
                checked={apiProvider === 'gemini'} 
                onChange={() => setApiProvider('gemini')} 
              />
              <span>Google Gemini</span>
            </label>
            <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="provider" 
                checked={apiProvider === 'openai'} 
                onChange={() => setApiProvider('openai')} 
              />
              <span>OpenAI</span>
            </label>
          </div>

          {apiProvider !== 'auto' && (
            <div style={{ marginBottom: '8px' }}>
              <input
                type="password"
                placeholder={apiProvider === 'gemini' ? 'Enter Google Gemini API Key (AIza...)' : 'Enter OpenAI API Key (sk-...)'}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid var(--border-medium)', borderRadius: '4px', background: '#FFF' }}
              />
            </div>
          )}

          <button 
            className="btn-swiss-outline" 
            onClick={handleSaveSettings}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            Apply & Save
          </button>
        </div>
      )}

      {/* Active Case Grounding Banner */}
      {activeContext && (
        <div style={{ background: 'var(--bg-subtle)', padding: '10px 16px', fontSize: '13px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 750 }}>Grounding: </span>
            <span style={{ textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 800 }}>{activeContext.modality}</span>
            {'prediction' in activeContext && (
              <span> — {activeContext.prediction} ({(activeContext.confidence * 100).toFixed(1)}%)</span>
            )}
          </div>
          <span className="tab-tag" style={{ margin: 0, fontSize: '10px' }}>ACTIVE CASE</span>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', opacity: 0.8, fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                <span style={{ fontWeight: 700 }}>{msg.role === 'user' ? 'Clinician' : 'RadiNova AI'} • {msg.timestamp}</span>
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant" style={{ fontStyle: 'italic', opacity: 0.75 }}>
            Synthesizing clinical evidence, differentials, and decision guidelines...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestion Chips */}
      <div className="chat-quick-chips">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            className="chip-btn"
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
          >
            <ArrowRight size={11} style={{ color: 'var(--accent)' }} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Row */}
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask a diagnostic question or clinical instruction..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          className="chat-send-btn" 
          onClick={() => handleSendMessage()}
          disabled={loading || !inputValue.trim()}
          aria-label="Send Message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
