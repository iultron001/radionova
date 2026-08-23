import React, { useState } from 'react';
import { 
  PageId, 
  ModalityId, 
  ModalityMeta, 
  AnyAnalysisResult, 
  ReportRecord, 
  DoctorProfile 
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AnalysisResultView } from './components/AnalysisResultView';
import { NewStudyModal } from './components/NewStudyModal';
import { AuthPortal } from './components/AuthPortal';
import { DashboardPage } from './components/pages/DashboardPage';
import { MyStudiesPage } from './components/pages/MyStudiesPage';
import { ReportsArchivePage } from './components/pages/ReportsArchivePage';
import { AIConsultationPage } from './components/pages/AIConsultationPage';
import { ProtocolsPage } from './components/pages/ProtocolsPage';
import { PatientPortalPage } from './components/pages/PatientPortalPage';
import { LandingPage } from './components/pages/LandingPage';

const MODALITIES: Record<ModalityId, ModalityMeta> = {
  limb_fracture: {
    id: 'limb_fracture',
    name: 'Limb Radiograph (Bone Fracture)',
    category: 'CV_MODEL',
    badge: 'PRIORITY #1 • DENSENET-121',
    accepts: 'image/jpeg,image/png',
    description: 'Osseous disruption and cortical fracture detection with Grad-CAM focus mapping.'
  },
  chest_xray: {
    id: 'chest_xray',
    name: 'Chest Radiography (X-Ray)',
    category: 'CV_MODEL',
    badge: 'PRIORITY #2 • DENSENET-121',
    accepts: 'image/jpeg,image/png,image/dicom',
    description: 'Pneumonia and consolidation detection with localized Grad-CAM explainability maps.'
  },
  mri: {
    id: 'mri',
    name: 'Brain MRI Neuroimaging',
    category: 'CV_MODEL',
    badge: 'PRIORITY #3 • DENSENET-121 NEURO',
    accepts: 'image/jpeg,image/png,image/dicom,.pdf,.txt',
    description: 'Intracranial lesion, mass effect, and focal neuro parenchymal disruption detection.'
  },
  blood: {
    id: 'blood',
    name: 'Hematology & Blood Panel',
    category: 'LLM_PIPELINE',
    badge: 'LABORATORY PANEL',
    accepts: '.txt,.pdf,text/plain,application/pdf',
    description: 'Complete blood count (CBC) and metabolic panel interpretation with biomarker risk ranges.'
  },
  breast_cancer: {
    id: 'breast_cancer',
    name: 'Breast Cancer Screening',
    category: 'CV_MODEL',
    badge: 'MAMMOGRAPHY • DENSENET-121',
    accepts: 'image/jpeg,image/png,image/dicom',
    description: 'Mammographic mass detection and malignancy classification with Grad-CAM localization.'
  }
};

export const App: React.FC = () => {
  const [currentDoctor, setCurrentDoctor] = useState<DoctorProfile | null>(() => {
    try {
      const saved = localStorage.getItem('radinova_doctor_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Top-level active view for guest / doctor routing
  const [currentView, setCurrentView] = useState<'landing' | 'patient_triage' | 'doctor_login' | 'doctor_portal'>(() => {
    try {
      const saved = localStorage.getItem('radinova_doctor_session');
      return saved ? 'doctor_portal' : 'landing';
    } catch {
      return 'landing';
    }
  });

  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [, setActiveTab] = useState<ModalityId>('limb_fracture');
  const [activeResult, setActiveResult] = useState<AnyAnalysisResult | null>(null);
  const [activeModalityForModal, setActiveModalityForModal] = useState<ModalityId>('limb_fracture');

  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [isNewStudyOpen, setIsNewStudyOpen] = useState(false);

  const handleLogin = (doctor: DoctorProfile) => {
    setCurrentDoctor(doctor);
    localStorage.setItem('radinova_doctor_session', JSON.stringify(doctor));
    setCurrentView('doctor_portal');
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setCurrentDoctor(null);
    localStorage.removeItem('radinova_doctor_session');
    localStorage.removeItem('radinova_token');
    setCurrentView('landing');
    setActiveResult(null);
  };

  const handleAnalysisSuccess = (result: AnyAnalysisResult, modality: ModalityId) => {
    setActiveTab(modality);
    setActiveResult(result);
    setActivePage('studio');

    const record: ReportRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modality: MODALITIES[modality]?.name || modality,
      predictionOrSummary: 'prediction' in result ? result.prediction : (result.explanation?.title || 'Clinical Analysis'),
      confidenceOrTriage: 'confidence' in result ? `${(result.confidence * 100).toFixed(1)}%` : (result.explanation?.triage_level?.label || 'REVIEWED'),
      data: result
    };
    setHistory(prev => [record, ...prev]);
  };

  const handleDownloadPdf = async (resultData: AnyAnalysisResult) => {
    try {
      const isCV = 'prediction' in resultData;
      const mod = isCV ? (resultData.modality || 'chest_xray') : 'clinical_study';
      const pred = isCV ? resultData.prediction : 'COMPLETED';
      const conf = isCV ? (resultData.confidence || 0.92) : 0.90;
      const patientName = (resultData as any).patient_name || 'Eleanor Vance';
      const patientId = (resultData as any).patient_id || 'RN-2026-00142';

      let findings = 'Deep neural classification and explainability heatmap generated.';
      let impression = 'AI-assisted clinical decision support completed.';
      let clinicalNotes = 'Correlate with patient physical examination and laboratory workup.';

      if (mod === 'chest_xray') {
        if (pred === 'PNEUMONIA') {
          findings = 'Focal alveolar consolidation and parenchymal opacification identified in the right lower and perihilar zones.';
          impression = 'Radiographic appearance consistent with active pulmonary pneumonia.';
          clinicalNotes = 'Recommend complete blood count, inflammatory markers, and correlation with auscultatory crackles.';
        } else {
          findings = 'Clear bilateral pulmonary parenchyma. Normal broncho-vascular markings and sharp costophrenic angles.';
          impression = 'No acute pulmonary consolidation, effusion, or pneumothorax identified.';
          clinicalNotes = 'Routine clinical respiratory monitoring.';
        }
      } else if (mod === 'limb_fracture') {
        if (pred === 'FRACTURED') {
          findings = 'Cortical discontinuity and radiolucent fracture line observed along the distal osseous margin.';
          impression = 'Acute cortical fracture with localized soft tissue swelling.';
          clinicalNotes = 'Immobilize in supportive splint and refer for orthopedic consultation.';
        } else {
          findings = 'Intact cortical bone margins. Congruent joint alignment and normal trabecular architecture.';
          impression = 'No acute fracture or dislocation identified.';
          clinicalNotes = 'Symptomatic supportive care.';
        }
      } else if (mod === 'mri') {
        if (pred === 'TUMOR') {
          findings = 'Focal parenchymal signal abnormality with perilesional vasogenic edema and sulcal effacement.';
          impression = 'Intracranial space-occupying lesion / mass effect detected.';
          clinicalNotes = 'Urgent contrast-enhanced neuro-oncology MRI and specialist review.';
        } else {
          findings = 'Homogeneous brain parenchyma, symmetric lateral and third ventricles, intact midline.';
          impression = 'Normal brain MRI scan without focal parenchymal lesion.';
          clinicalNotes = 'Outpatient neurological assessment.';
        }
      }

      let responseOk = false;
      try {
        const response = await fetch('/api/v1/reports/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('radinova_token') || ''}`
          },
          body: JSON.stringify({
            modality: mod,
            patient_name: patientName,
            patient_id: patientId,
            prediction: pred,
            confidence: conf,
            findings: findings,
            impression: impression,
            clinical_notes: clinicalNotes,
            full_data: resultData
          })
        });
        if (response.ok) {
          responseOk = true;
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `RadiNova_Report_${mod.toUpperCase()}_${patientId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch {
        // Fallback to client print window
      }

      if (!responseOk) {
        // Standalone Client-Side Institutional Print & PDF Report Generator
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>RadiNova Clinical Report - ${patientId}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
                .logo { font-size: 24px; font-weight: 800; color: #059669; }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .meta-item strong { color: #475569; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.04em; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 12px; }
                .badge-alert { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
                .badge-normal { background: #d1fae5; color: #047857; border: 1px solid #6ee7b7; }
                .disclaimer { margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="logo">RadiNova AI</div>
                  <div style="font-size: 13px; color: #64748b;">Clinical Decision Support System (CDSS)</div>
                </div>
                <div style="text-align: right; font-size: 12px; color: #64748b;">
                  <div><strong>Report ID:</strong> RN-RPT-${Date.now().toString().slice(-6)}</div>
                  <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div class="meta-grid">
                <div class="meta-item"><strong>Patient Full Name</strong> ${patientName}</div>
                <div class="meta-item"><strong>Medical Record Number</strong> ${patientId}</div>
                <div class="meta-item"><strong>Target Modality</strong> ${mod.replace('_', ' ').toUpperCase()}</div>
                <div class="meta-item"><strong>AI Certainty / Confidence</strong> ${(conf * 100).toFixed(1)}%</div>
              </div>

              <div class="section">
                <div class="section-title">Primary Diagnostic Finding</div>
                <div style="margin-bottom: 8px;">
                  <span class="badge ${pred.includes('PNEUMONIA') || pred.includes('FRACTUR') || pred.includes('TUMOR') || pred.includes('MALIGNANT') ? 'badge-alert' : 'badge-normal'}">
                    ${pred}
                  </span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Objective Radiographic / Laboratory Findings</div>
                <p style="margin: 0;">${findings}</p>
              </div>

              <div class="section">
                <div class="section-title">Clinical Impression & Synthesis</div>
                <p style="margin: 0;">${impression}</p>
              </div>

              <div class="section">
                <div class="section-title">Recommended Clinical Action Plan</div>
                <p style="margin: 0;">${clinicalNotes}</p>
              </div>

              <div class="disclaimer">
                CONFIDENTIAL MEDICAL RECORD: This institutional clinical report was synthesized with AI assistance (RadiNova CDSS). Final diagnosis and management require direct verification by an attending medical doctor.
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  // ── VIEW ROUTING ──
  if (!currentDoctor || currentView !== 'doctor_portal') {
    // 1. Patient Triage Mode (Guest)
    if (currentView === 'patient_triage') {
      return (
        <div className="radinova-app-shell">
          <PatientPortalPage
            onBackToHome={() => setCurrentView('landing')}
            onSwitchToDoctorPortal={() => setCurrentView('doctor_login')}
          />
        </div>
      );
    }

    // 2. Doctor Login Screen
    if (currentView === 'doctor_login') {
      return (
        <AuthPortal
          onLogin={handleLogin}
          onOpenPatientPortal={() => setCurrentView('patient_triage')}
          onBack={() => setCurrentView('landing')}
        />
      );
    }

    // 3. Default: Clean, Spacious Home / Landing Page
    return (
      <LandingPage
        onStartPatientTriage={() => setCurrentView('patient_triage')}
        onOpenDoctorLogin={() => setCurrentView('doctor_login')}
      />
    );
  }

  return (
    <div className="radinova-app-shell">
      {/* 1. TOP NAVIGATION BAR */}
      <Navbar
        activePage={activePage}
        onSelectPage={(page) => setActivePage(page)}
        reportCount={history.length}
        doctor={currentDoctor}
        onLogout={handleLogout}
        hasActiveResult={!!activeResult}
      />

      {/* 2. BODY: LEFT SIDEBAR + CONTEXT-SENSITIVE MAIN CONTENT */}
      <div className="radinova-body-wrapper">
        {/* Left Sidebar */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => setActivePage(page)}
          onNewStudyClick={() => setIsNewStudyOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Context Page View */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* DASHBOARD */}
          {activePage === 'dashboard' && (
            <DashboardPage
              doctor={currentDoctor}
              modalities={MODALITIES}
              recentReports={history}
              onLaunchModality={(mod) => {
                setActiveTab(mod);
                setActiveModalityForModal(mod);
                setIsNewStudyOpen(true);
              }}
              onOpenReportArchive={() => setActivePage('archive')}
              onOpenAssistant={() => setActivePage('assistant')}
              onOpenProtocols={() => setActivePage('protocols')}
              onDownloadPdf={handleDownloadPdf}
              onNewStudyClick={() => setIsNewStudyOpen(true)}
            />
          )}

          {/* DEEP 3-COLUMN ANALYSIS WORKSPACE */}
          {activePage === 'studio' && activeResult && (
            <AnalysisResultView
              result={activeResult}
              onDownloadPdf={handleDownloadPdf}
              onClose={() => setActiveResult(null)}
            />
          )}

          {/* MY STUDIES LIST (When no deep result active) */}
          {activePage === 'studio' && !activeResult && (
            <MyStudiesPage
              onOpenAnalysis={(res) => setActiveResult(res)}
              onNewStudyClick={() => setIsNewStudyOpen(true)}
            />
          )}

          {/* REPORTS ARCHIVE */}
          {activePage === 'archive' && (
            <ReportsArchivePage
              history={history}
              onDownloadPdf={handleDownloadPdf}
              onClearHistory={() => setHistory([])}
              onOpenInStudio={(mod, data) => {
                setActiveTab(mod);
                setActiveResult(data);
                setActivePage('studio');
              }}
            />
          )}

          {/* PATIENT TRIAGE PORTAL */}
          {activePage === 'patient' && (
            <PatientPortalPage
              onSwitchToDoctorPortal={() => setActivePage('dashboard')}
            />
          )}

          {/* AI CONSULTATION / ANALYTICS */}
          {activePage === 'assistant' && (
            <AIConsultationPage
              doctor={currentDoctor}
              activeContext={activeResult}
              onNavigateToStudio={() => setActivePage('studio')}
            />
          )}

          {/* PROTOCOLS & SETTINGS */}
          {activePage === 'protocols' && (
            <ProtocolsPage />
          )}
        </main>
      </div>

      {/* 3. NEW STUDY MODAL */}
      <NewStudyModal
        isOpen={isNewStudyOpen}
        onClose={() => setIsNewStudyOpen(false)}
        onAnalysisSuccess={handleAnalysisSuccess}
        defaultModality={activeModalityForModal}
      />
    </div>
  );
};
