import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, 
  Send, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Clock, 
  RotateCcw, 
  FileText, 
  UserCheck,
  ArrowLeft
} from 'lucide-react';

interface StructuredSymptoms {
  main_complaint?: string;
  symptoms?: string[];
  body_location?: string;
  duration?: string;
  severity?: string;
  onset?: string;
  injury?: boolean;
  red_flag?: boolean;
  relevant_history?: string[];
  missing_information?: string[];
  next_question?: string;
  conversation_complete?: boolean;
}

interface ChatMsg {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

interface PatientPortalPageProps {
  onBackToHome?: () => void;
  onSwitchToDoctorPortal?: () => void;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ onBackToHome, onSwitchToDoctorPortal }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [turnCount, setTurnCount] = useState<number>(0);
  const [maxTurns, setMaxTurns] = useState<number>(8);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [concernLevel, setConcernLevel] = useState<string>('LOW');
  const [structured, setStructured] = useState<StructuredSymptoms>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/v1/patient/session', { method: 'POST' });
      if (!res.ok) throw new Error('Could not start patient session');
      const data = await res.json();
      setSessionId(data.session_id);
      setSessionCode(data.session_code);
      setMaxTurns(data.max_turns || 8);
      setTurnCount(0);
      setIsCompleted(false);
      setConcernLevel('LOW');
      setStructured({});
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setError(err.message || 'Connection error. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || !sessionId || isLoading || isCompleted) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/patient/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: trimmed
        })
      });

      if (!res.ok) {
        throw new Error('Could not receive assistant response');
      }

      const data = await res.json();
      setTurnCount(data.turn_count);
      setConcernLevel(data.concern_level || 'LOW');
      if (data.structured_symptoms) {
        setStructured(data.structured_symptoms);
      }
      if (data.is_completed || data.turn_count >= maxTurns) {
        setIsCompleted(true);
      }

      const botMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err: any) {
      setError('Network blip. The triage session was preserved; you can try sending your message again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getConcernBadge = () => {
    if (concernLevel === 'URGENT_EVALUATION' || structured.red_flag) {
      return {
        label: 'URGENT MEDICAL EVALUATION ADVISED',
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fca5a5',
        desc: 'Symptoms may require immediate in-person clinical assessment at an emergency department or acute clinic.'
      };
    }
    if (concernLevel === 'MODERATE' || structured.injury) {
      return {
        label: 'MODERATE CONCERN — CLINICAL REVIEW RECOMMENDED',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        desc: 'Schedule a visit with a doctor or primary care provider for examination.'
      };
    }
    return {
      label: 'STANDARD NON-EMERGENCY TRIAGE',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      desc: 'Continue monitoring. Consult a qualified clinician if symptoms worsen or persist.'
    };
  };

  const badge = getConcernBadge();

  return (
    <div className="page-container patient-portal-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Top Nav Bar with Back to Home & Doctor Login */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.borderColor = '#a3e635'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'rgba(163,230,53,0.15)',
              border: '1px solid #a3e635',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#a3e635'
            }}>
              <Activity size={16} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>RadiNova AI</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
              color: '#a3e635', background: 'rgba(163,230,53,0.12)',
              border: '1px solid rgba(163,230,53,0.3)', borderRadius: '4px', padding: '2px 6px'
            }}>PATIENT TRIAGE</span>
          </div>
        </div>

        {onSwitchToDoctorPortal && (
          <button
            onClick={onSwitchToDoctorPortal}
            style={{
              background: '#121820',
              border: '1px solid rgba(255,255,255,0.14)',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 650,
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a3e635'; e.currentTarget.style.color = '#a3e635'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#f8fafc'; }}
          >
            <UserCheck size={14} />
            <span>Doctor / Clinician Login</span>
          </button>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div style={{
        background: 'rgba(217,119,6,0.08)',
        border: '1px solid rgba(217,119,6,0.3)',
        borderRadius: '8px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
        <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 500 }}>
          AI-assisted prediction / decision support — requires review by a qualified healthcare professional.
        </span>
      </div>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HeartHandshake size={20} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
              RadiNova Patient Health Companion
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>
            Symptom Assessment & Clinical Triage
          </h1>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
            Describe your symptoms in your own words. Our AI assistant gathers structured clinical context to help you and your physician understand your condition.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Session Identifier</span>
          <span style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '14px',
            color: '#38bdf8'
          }}>
            {sessionCode || 'INITIALIZING...'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
            <Clock size={13} />
            <span>Progress: Turn {turnCount} of {maxTurns}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chat Assistant on Left, Structured Clinical Context on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
        
        {/* Chat Area */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          height: '620px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Chat Header Strip */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafbfc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                AI Triage Conversation
              </span>
            </div>
            <button
              onClick={initSession}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}
              title="Reset Conversation"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {/* Messages list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: '#ffffff'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? '#0284c7' : '#f8fafc',
                    color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', width: 'fit-content' }}>
                <span className="live-pulse-dot" style={{ background: '#0284c7' }} />
                <span style={{ fontSize: '13px', color: '#64748b' }}>Assistant is assessing symptoms...</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '14px 18px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '10px',
              background: '#fafbfc'
            }}
          >
            <input
              type="text"
              value={inputVal}
              disabled={isLoading || isCompleted}
              onChange={e => setInputVal(e.target.value)}
              placeholder={isCompleted ? "Triage completed. You can print the summary." : "Describe pain, duration, fever, or prior injuries..."}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || isCompleted || !inputVal.trim()}
              style={{
                background: isCompleted ? '#94a3b8' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 650,
                fontSize: '13.5px',
                cursor: (isLoading || isCompleted || !inputVal.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={15} /> Send
            </button>
          </form>
        </div>

        {/* Structured Symptoms & Decision Support Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* ── EMERGENCY REFERRAL BAR (TASK 2) ── */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} style={{ color: badge.color }} />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', letterSpacing: '0.04em' }}>
                  Emergency Referral Gauge
                </span>
              </div>
              <span style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {concernLevel === 'URGENT_EVALUATION' ? '88%' : concernLevel === 'MODERATE' ? '52%' : '18%'} Urgency Score
              </span>
            </div>

            {/* Gauge Progress Bar */}
            <div style={{
              position: 'relative',
              height: '12px',
              background: '#f1f5f9',
              borderRadius: '9999px',
              overflow: 'hidden',
              margin: '10px 0 6px 0',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: concernLevel === 'URGENT_EVALUATION' ? '88%' : concernLevel === 'MODERATE' ? '52%' : '18%',
                background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>

            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
              <span style={{ color: '#059669' }}>● Routine Care</span>
              <span style={{ color: '#d97706' }}>● Consult Doctor</span>
              <span style={{ color: '#dc2626' }}>● Urgent ER Visit</span>
            </div>
          </div>

          {/* Concern Level Card */}
          <div style={{
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} style={{ color: badge.color }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: badge.color, letterSpacing: '0.04em' }}>
                {badge.label}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#334155', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {badge.desc}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '8px' }}>
              <span>Progress: Turn {turnCount} of {maxTurns}</span>
              <span style={{ fontWeight: 600, color: badge.color }}>Triage: {concernLevel}</span>
            </div>
          </div>

          {/* Extracted Structured Clinical Schema */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} style={{ color: '#0284c7' }} />
              Structured Symptom Extraction
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Main Complaint</span>
                <span style={{ fontWeight: 650, color: '#0f172a' }}>{structured.main_complaint || '—'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Anatomical Region</span>
                <span style={{ fontWeight: 650, color: '#0f172a' }}>{structured.body_location || '—'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Reported Duration</span>
                <span style={{ fontWeight: 650, color: '#0f172a' }}>{structured.duration || '—'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Severity Rating</span>
                <span style={{
                  fontWeight: 700,
                  color: structured.severity === 'Severe' ? '#dc2626' : '#0284c7'
                }}>
                  {structured.severity || 'Moderate'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Recent Trauma / Injury</span>
                <span style={{ fontWeight: 650, color: structured.injury ? '#d97706' : '#059669' }}>
                  {structured.injury ? 'Yes' : 'No'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Red Flag Signs</span>
                <span style={{
                  fontWeight: 800,
                  color: structured.red_flag ? '#dc2626' : '#059669'
                }}>
                  {structured.red_flag ? '⚠️ DETECTED' : 'None Detected'}
                </span>
              </div>
            </div>

            {/* Symptoms Tag Pills */}
            {structured.symptoms && structured.symptoms.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Identified Key Indicators:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {structured.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action guidance card */}
          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            color: '#475569',
            lineHeight: 1.45
          }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              What to do with this assessment:
            </strong>
            Take or show this summary to your attending healthcare professional during your in-person visit.
          </div>

        </div>

      </div>

    </div>
  );
};
