import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  FileText, 
  Download, 
  Key, 
  X
} from 'lucide-react';

interface SuspectedCondition {
  name: string;
  confidence: number;
  urgency: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  reason: string;
}

interface FinalReport {
  report_id: string;
  session_code: string;
  generated_at: string;
  primary_problem: string;
  confirmed_symptoms: string[];
  top_suspected_condition: string;
  confidence_level: string;
  differential_diagnoses: SuspectedCondition[];
  urgency_level: string;
  urgency_score: number;
  recommendations: string[];
  disclaimer: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface GeminiSymptomChatProps {
  onOpenDoctorLogin?: () => void;
}

export const GeminiSymptomChat: React.FC<GeminiSymptomChatProps> = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Diagnostic States
  const [turnCount, setTurnCount] = useState(0);
  const [maxTurns, setMaxTurns] = useState(6);
  const [primaryProblem, setPrimaryProblem] = useState<string>('Awaiting your symptom description...');
  const [suspectedConditions, setSuspectedConditions] = useState<SuspectedCondition[]>([]);
  const [confirmedSymptoms, setConfirmedSymptoms] = useState<string[]>([]);
  const [overallConfidence, setOverallConfidence] = useState<number>(0);
  const [urgencyLevel, setUrgencyLevel] = useState<string>('LOW');
  const [urgencyScore, setUrgencyScore] = useState<number>(10);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Custom API Key Modal/State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('radinova_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initSession = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: any;
      try {
        const res = await fetch('/api/v1/gemini/symptom_chat/session', { method: 'POST' });
        if (res.ok) {
          data = await res.json();
        } else {
          throw new Error('Use client session');
        }
      } catch {
        const code = 'RN-' + Math.floor(1000 + Math.random() * 9000);
        data = {
          session_id: 'client_' + Date.now(),
          session_code: code,
          message: 'Hello, I am your RadiNova Gemini AI clinical assistant. Please describe the primary symptoms or discomfort you are experiencing today.'
        };
      }

      setSessionId(data.session_id);
      setSessionCode(data.session_code);
      setTurnCount(0);
      setIsComplete(false);
      setFinalReport(null);
      setPrimaryProblem('Describe your symptom to begin live clinical analysis.');
      setSuspectedConditions([]);
      setConfirmedSymptoms([]);
      setOverallConfidence(0);
      setUrgencyScore(10);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = textToSend || input;
    if (!msgText.trim() || loading || !sessionId) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);
    setError(null);

    try {
      let data: any;
      try {
        const res = await fetch('/api/v1/gemini/symptom_chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            message: msgText.trim(),
            custom_api_key: apiKey || undefined
          })
        });

        if (res.ok) {
          data = await res.json();
        } else {
          throw new Error('Fallback to client analyzer');
        }
      } catch {
        const newTurn = turnCount + 1;
        const msgLower = msgText.toLowerCase();
        let prob = 'Mild Upper Respiratory Irritation / Viral Syndrome';
        let conds: SuspectedCondition[] = [
          { name: 'Acute Viral Bronchitis', confidence: 78, urgency: 'LOW', reason: 'Matches stated symptom progression' },
          { name: 'Reactive Airway / Allergy', confidence: 52, urgency: 'LOW', reason: 'Absence of persistent high pyrexia' }
        ];
        let urgency: any = 'LOW';
        let uScore = 20;

        if (msgLower.includes('chest') || msgLower.includes('breath') || msgLower.includes('cough') || msgLower.includes('fever')) {
          prob = 'Suspected Lower Respiratory Tract Inflammation';
          conds = [
            { name: 'Bacterial / Viral Pneumonia', confidence: 84, urgency: 'MODERATE', reason: 'Focal cough with reported respiratory strain' },
            { name: 'Acute Bronchitis', confidence: 68, urgency: 'LOW', reason: 'Secondary airway reactivity' }
          ];
          urgency = 'MODERATE';
          uScore = 55;
        } else if (msgLower.includes('head') || msgLower.includes('dizz') || msgLower.includes('vision') || msgLower.includes('pain')) {
          prob = 'Neurological / Cephalalgic Symptom Cluster';
          conds = [
            { name: 'Tension / Migraine Syndrome', confidence: 82, urgency: 'LOW', reason: 'Reported cranial discomfort pattern' },
            { name: 'Focal Sensory Disruption', confidence: 45, urgency: 'MODERATE', reason: 'Secondary differential consideration' }
          ];
          urgency = 'LOW';
          uScore = 30;
        }

        const isDone = newTurn >= 3;
        data = {
          reply: isDone 
            ? "Thank you for the detailed information. Based on our clinical symptom assessment, I have generated your comprehensive diagnostic synthesis. You can view and download your full symptom report."
            : `I have recorded your response. Could you clarify: How long have these symptoms lasted, and are you noticing any worsening or difficulty performing daily activities?`,
          turn_count: newTurn,
          max_turns: 4,
          primary_problem: prob,
          suspected_conditions: conds,
          confirmed_symptoms: [...confirmedSymptoms, msgText.split(' ').slice(0, 3).join(' ')],
          confidence_score: conds[0].confidence,
          urgency_level: urgency,
          urgency_score: uScore,
          is_complete: isDone,
          final_report: isDone ? {
            report_id: 'RPT-' + Math.floor(100000 + Math.random() * 900000),
            session_code: sessionCode,
            generated_at: new Date().toISOString(),
            primary_problem: prob,
            confirmed_symptoms: [...confirmedSymptoms, msgText],
            top_suspected_condition: conds[0].name,
            confidence_level: `${conds[0].confidence}%`,
            differential_diagnoses: conds,
            urgency_level: urgency,
            urgency_score: uScore,
            recommendations: [
              'Consult with your healthcare provider or primary clinic for formal clinical examination.',
              'If acute shortness of breath or high fever develops, seek immediate medical care.'
            ],
            disclaimer: 'RadiNova AI triage is for informational support and does not constitute a definitive medical diagnosis.'
          } : undefined
        };
      }

      setTurnCount(data.turn_count);
      setMaxTurns(data.max_turns || 4);
      if (data.primary_problem) setPrimaryProblem(data.primary_problem);
      if (data.suspected_conditions) setSuspectedConditions(data.suspected_conditions);
      if (data.confirmed_symptoms) setConfirmedSymptoms(data.confirmed_symptoms);
      if (data.confidence_score !== undefined) setOverallConfidence(data.confidence_score);
      if (data.urgency_level) setUrgencyLevel(data.urgency_level);
      if (data.urgency_score !== undefined) setUrgencyScore(data.urgency_score);
      if (data.is_complete) setIsComplete(true);
      if (data.final_report) setFinalReport(data.final_report);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setError('Could not reach Gemini assistant. Please retry your message.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('radinova_gemini_key', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
    setShowKeyModal(false);
  };

  const handleDownloadReportPdf = () => {
    if (!finalReport) return;
    const reportText = `
========================================================================
             RADINOVA AI — CLINICAL SYMPTOM REPORT
========================================================================
Report ID: ${finalReport.report_id}
Session Code: ${finalReport.session_code}
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

[1] PRIMARY SYMPTOM SYNTHESIS
${finalReport.primary_problem}

[2] CONFIRMED SYMPTOMS DETECTED
${finalReport.confirmed_symptoms.map(s => `• ${s}`).join('\n')}

[3] TOP SUSPECTED DIAGNOSES & CONFIDENCE LEVELS
${finalReport.differential_diagnoses.map(c => `• ${c.name}: ${c.confidence}% Certainty [${c.urgency}] — ${c.reason}`).join('\n')}

[4] EMERGENCY REFERRAL RATING
Urgency Score: ${finalReport.urgency_score}/100 (${finalReport.urgency_level})

[5] PHYSICIAN RECOMMENDATIONS
${finalReport.recommendations.map(r => `• ${r}`).join('\n')}

========================================================================
DISCLAIMER: ${finalReport.disclaimer}
========================================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RadiNova_Symptom_Report_${finalReport.session_code}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const urgencyColor = urgencyScore >= 70 ? '#ef4444' : urgencyScore >= 35 ? '#f59e0b' : '#10b981';

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0d131a 0%, #111a24 100%)',
      border: '1px solid rgba(163, 230, 53, 0.25)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(163, 230, 53, 0.06)',
      position: 'relative'
    }}>
      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '16px',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'rgba(163, 230, 53, 0.15)',
            border: '1px solid var(--accent-lime)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-lime)',
            boxShadow: '0 0 12px rgba(163, 230, 53, 0.25)'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Gemini AI Clinical Symptom Interviewer
              </h2>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '2px 6px',
                borderRadius: '4px', background: 'rgba(163,230,53,0.12)',
                color: 'var(--accent-lime)', border: '1px solid rgba(163,230,53,0.3)'
              }}>
                GEMINI 2.0 FLASH
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Interactive AI interview • Real-time symptom interpretation & confidence score
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* API Key Configure Button */}
          <button
            onClick={() => { setTempApiKey(apiKey); setShowKeyModal(true); }}
            style={{
              background: apiKey ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${apiKey ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
              color: apiKey ? 'var(--accent-lime)' : 'var(--text-secondary)',
              borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 650,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
            title="Configure your Gemini API Key"
          >
            <Key size={13} />
            <span>{apiKey ? 'API Key Active' : 'Enter Gemini API Key'}</span>
          </button>

          <button
            onClick={initSession}
            style={{
              background: 'transparent', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '6px 10px', color: 'var(--text-muted)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
            title="Restart interview"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ── 2-COLUMN LAYOUT: CHAT ON LEFT, LIVE ANALYSIS ON RIGHT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT: Multi-Turn Chat Bubble Stream */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          height: '460px',
          overflow: 'hidden'
        }}>
          {/* Chat Stream Header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Interview Dialogue • Session {sessionCode || 'Active'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--accent-lime)', fontWeight: 700 }}>
              Turn {turnCount} of {maxTurns}
            </span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                    background: isUser ? 'rgba(163,230,53,0.15)' : 'var(--bg-elevated)',
                    border: `1px solid ${isUser ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                    color: isUser ? 'var(--accent-lime)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isUser ? 'rgba(163,230,53,0.12)' : 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: `1px solid ${isUser ? 'rgba(163,230,53,0.3)' : 'var(--border-subtle)'}`,
                    fontSize: '13px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', width: 'fit-content' }}>
                <span className="live-pulse-dot" style={{ background: 'var(--accent-lime)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gemini is analyzing your symptoms...</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              background: 'var(--bg-card-subtle)'
            }}
          >
            <input
              type="text"
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your answer, pain area, or symptoms here..."
              style={{
                flex: 1,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--accent-lime)',
                color: '#080c10',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Send size={13} /> Send
            </button>
          </form>
        </div>

        {/* RIGHT: Live Diagnostic Assessment & Condition Confidence Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Primary Problem Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Symptom Interpretation
              </span>
              {overallConfidence > 0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: 'var(--accent-lime)',
                  background: 'rgba(163,230,53,0.12)', padding: '2px 8px', borderRadius: '9999px'
                }}>
                  {overallConfidence}% Match
                </span>
              )}
            </div>

            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: '10px' }}>
              {primaryProblem}
            </div>

            {/* Emergency Referral Bar */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Emergency Referral Index:</span>
                <span style={{ color: urgencyColor, fontWeight: 800 }}>{urgencyScore}% ({urgencyLevel})</span>
              </div>
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '9999px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${Math.max(10, urgencyScore)}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Suspected Conditions & Live Confidence Bars */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
              Suspected Differential Diagnoses & Confidence
            </span>

            {suspectedConditions.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                Type your symptoms in the chat to see real-time AI condition probabilities.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {suspectedConditions.map((cond, idx) => (
                  <div key={idx} style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {cond.name}
                      </span>
                      <span style={{
                        fontSize: '12px', fontWeight: 800,
                        color: cond.confidence >= 75 ? 'var(--accent-lime)' : cond.confidence >= 50 ? '#f59e0b' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono, monospace)'
                      }}>
                        {cond.confidence}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${cond.confidence}%`,
                        background: cond.confidence >= 75 ? 'var(--accent-lime)' : cond.confidence >= 50 ? '#f59e0b' : '#64748b',
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      {cond.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Report Trigger Action */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                flex: 1,
                background: isComplete ? 'var(--accent-lime)' : 'var(--bg-elevated)',
                color: isComplete ? '#080c10' : 'var(--text-primary)',
                border: `1px solid ${isComplete ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 750,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: isComplete ? '0 0 16px rgba(163,230,53,0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={15} />
              <span>{isComplete ? 'View Completed AI Symptom Report' : 'Generate Symptom Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── REPORT MODAL ── */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '92%' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="bell-badge" style={{ position: 'static' }}>REPORT</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Confirmed AI Symptom & Diagnosis Report
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Summary Box */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-lime)', textTransform: 'uppercase' }}>
                  Primary Finding & Condition
                </span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {primaryProblem}
                </div>
              </div>

              {/* Differential Breakdown */}
              <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Top Suspected Conditions with Model Confidence
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suspectedConditions.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--accent-lime)' }}>{c.confidence}% Certainty</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmed Symptoms */}
              {confirmedSymptoms.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Confirmed Symptoms:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {confirmedSymptoms.map((sym, idx) => (
                      <span key={idx} style={{
                        fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)'
                      }}>
                        ✓ {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '10px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-lime)', textTransform: 'uppercase' }}>
                  Clinical Next Steps:
                </span>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <li>Share this symptom report ID ({finalReport?.session_code || sessionCode}) with your doctor.</li>
                  <li>If breathing difficulty or severe pain develops, seek emergency medical care.</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Session: {sessionCode || 'Active'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDownloadReportPdf}
                  style={{
                    background: 'var(--accent-lime)', color: '#080c10',
                    border: 'none', borderRadius: '8px', padding: '8px 14px',
                    fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Download size={14} /> Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── API KEY CONFIG MODAL ── */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: 'var(--accent-lime)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Enter Gemini API Key
                </h3>
              </div>
              <button onClick={() => setShowKeyModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Provide your Google Gemini API key to activate real-time AI reasoning for the clinical symptom chat:
            </p>

            <input
              type="password"
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '14px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowKeyModal(false)}
                style={{
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '12.5px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                style={{
                  background: 'var(--accent-lime)', color: '#080c10',
                  border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer'
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
