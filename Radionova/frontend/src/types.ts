export type ModalityId = 'chest_xray' | 'blood' | 'limb_fracture' | 'mri' | 'ecg' | 'ct';

export interface ModalityMeta {
  id: ModalityId;
  name: string;
  category: 'CV_MODEL' | 'LLM_PIPELINE';
  badge: string;
  accepts: string;
  description: string;
}

export interface GuidanceData {
  severity: string;
  clinical_summary: string;
  differential_considerations: string[];
  recommended_followup: string[];
  disclaimer: string;
}

export interface CVAnalysisResult {
  modality: 'chest_xray' | 'limb_fracture';
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  original_image: string;
  gradcam_overlay: string;
  guidance: GuidanceData;
  disclaimer: string;
}

export interface LLMExplanationContent {
  title: string;
  key_findings: string[];
  plain_language_summary: string;
  hedging_statement: string;
  recommended_clinical_questions: string[];
}

export interface LLMAnalysisResult {
  modality: string;
  filename: string;
  source: 'LLM_LIVE_API' | 'TEMPLATE_FALLBACK';
  explanation: LLMExplanationContent;
  disclaimer: string;
  previewUrl?: string;
}

export type AnyAnalysisResult = CVAnalysisResult | LLMAnalysisResult;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ReportRecord {
  id: string;
  modality: string;
  title: string;
  prediction?: string;
  confidence?: number;
  timestamp: string;
  data: AnyAnalysisResult;
}
