import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, AnyAnalysisResult } from '../types';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: AnyAnalysisResult | null;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  isOpen,
  onClose,
  activeContext
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to RadiNova Clinical Assistant. Ask any question regarding imaging patterns, Grad-CAM heatmap interpretability, or diagnostic guidelines.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
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

      if (!response.ok) throw new Error('Assistant API failed');
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
        content: 'Clinical decision support intelligence: Please review active study findings or correlate with laboratory markers.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-drawer">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} />
          <span>RadiNova Clinical AI</span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {activeContext && (
        <div style={{ background: '#F4F4F5', padding: '6px 12px', fontSize: '10px', borderBottom: '1px solid #E4E4E7', fontWeight: 600 }}>
          <span>Active Context: </span>
          <span style={{ textTransform: 'uppercase', color: 'var(--accent)' }}>{activeContext.modality}</span>
          {'prediction' in activeContext && (
            <span> — {activeContext.prediction} ({(activeContext.confidence * 100).toFixed(1)}%)</span>
          )}
        </div>
      )}

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', opacity: 0.6, fontSize: '10px' }}>
              {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
              <span>{msg.role === 'user' ? 'Clinician' : 'RadiNova AI'} • {msg.timestamp}</span>
            </div>
            <div>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant" style={{ fontStyle: 'italic', opacity: 0.7 }}>
            Consulting clinical guidelines...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask a diagnostic question..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          className="chat-send-btn" 
          onClick={handleSendMessage}
          disabled={loading}
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
};
