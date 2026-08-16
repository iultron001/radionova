import React, { useState } from 'react';
import { ModalityId, AnyAnalysisResult, ReportRecord } from './types';
import { Header } from './components/Header';
import { TabNavigation, MODALITIES } from './components/TabNavigation';
import { ModalitySection } from './components/ModalitySection';
import { ChatAssistant } from './components/ChatAssistant';
import { ReportHistory } from './components/ReportHistory';
import { MessageSquare } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModalityId>('chest_xray');
  const [resultsByTab, setResultsByTab] = useState<Record<string, AnyAnalysisResult>>({});
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const currentMeta = MODALITIES.find(m => m.id === activeTab) || MODALITIES[0];
  const activeResult = resultsByTab[activeTab] || null;

  const handleAnalysisComplete = (result: AnyAnalysisResult) => {
    setResultsByTab(prev => ({ ...prev, [activeTab]: result }));

    // Add to history records
    const newRecord: ReportRecord = {
      id: Date.now().toString(),
      modality: result.modality,
      title: 'prediction' in result ? `${result.prediction} Finding` : (result.explanation.title || 'Diagnostic Review'),
      prediction: 'prediction' in result ? result.prediction : undefined,
      confidence: 'confidence' in result ? result.confidence : undefined,
      timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      data: result
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  const handleDownloadPdf = async (resultData: AnyAnalysisResult | ReportRecord) => {
    const payload = 'data' in resultData ? resultData.data : resultData;
    try {
      const response = await fetch('/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('PDF generation request failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RadiNova_Report_${payload.modality.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to generate clinical PDF report. Please verify backend connection.');
    }
  };

  return (
    <div className="app-container">
      {/* Header & Global Disclaimer */}
      <Header
        onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
        historyCount={history.length}
      />

      {/* 6-Modality Swiss Tab Switcher */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Active Modality Workspace */}
      <main>
        <ModalitySection
          key={activeTab}
          meta={currentMeta}
          activeResult={activeResult}
          onAnalysisComplete={handleAnalysisComplete}
          onDownloadPdf={handleDownloadPdf}
        />
      </main>

      {/* Floating Chat Assistant Trigger */}
      {!isChatOpen && (
        <button
          className="chat-floating-trigger"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open Clinical AI Assistant"
        >
          <MessageSquare size={16} />
          <span>AI Clinical Assistant</span>
        </button>
      )}

      {/* Chat Assistant Panel */}
      <ChatAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeContext={activeResult}
      />

      {/* Report History Drawer */}
      <ReportHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDownloadPdf={(rec) => handleDownloadPdf(rec)}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
};
