export type PageId = 'dashboard' | 'studio' | 'archive' | 'assistant' | 'protocols' | 'patient';
export type ModalityId = 'chest_xray' | 'blood' | 'limb_fracture' | 'mri' | 'breast_cancer';

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  licenseNumber: string;
  avatar: string;
  token?: string;
}

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

export interface FocalMetrics {
  epicenter_y: number;
  epicenter_x: number;
  focal_zone: string;
  focal_compactness: string;
  peak_intensity: number;
}

export interface AnatomicalZoneItem {
  zone: string;
  status: string;
  involvement: string;
}

export interface RadiologicSignItem {
  sign: string;
  present: boolean;
  description: string;
}

export interface CVInfographicData {
  opacity_index?: number;
  consolidation_density?: string;
  cortical_disruption_index?: number;
  fracture_type?: string;
  lesion_density_index?: number;
  mass_effect_level?: string;
  triage_category: string;
  anatomical_zones: AnatomicalZoneItem[];
  radiologic_signs: RadiologicSignItem[];
}

export interface CVAnalysisResult {
  status?: 'success' | 'invalid_image' | 'low_confidence';
  reason?: string;
  model_name?: string;
  model_output?: string;
  gatekeeper_name?: string;
  gatekeeper_passed?: boolean;
  gatekeeper_confidence?: number;
  diagnostic_confidence?: number;
  modality: 'chest_xray' | 'limb_fracture' | 'mri';
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  original_image: string;
  gradcam_overlay: string;
  focal_metrics?: FocalMetrics;
  infographic?: CVInfographicData;
  guidance: GuidanceData;
  disclaimer: string;
  patient_name?: string;
  patient_id?: string;
}

export interface ReportParameterItem {
  name: string;
  value: string;
  unit: string;
  reference: string;
  status: string;
}

export interface InfoStatsData {
  total_markers: number;
  abnormal_markers: number;
  stability_ratio: string;
  parameter_breakdown: ReportParameterItem[];
}

export interface TriageLevelData {
  label: string;
  severity: 'LOW' | 'MODERATE' | 'ELEVATED' | 'ACUTE';
  color: string;
  summary: string;
}

export interface LLMExplanationContent {
  title: string;
  info_stats?: InfoStatsData;
  triage_level?: TriageLevelData;
  plain_language_summary: string;
  short_term_problems?: string[];
  long_term_problems?: string[];
  what_to_do_now?: string[];
  precautions_and_prevention?: string[];
  key_findings?: string[];
  hedging_statement: string;
  recommended_clinical_questions: string[];
}

export interface LLMAnalysisResult {
  modality: string;
  explanation: LLMExplanationContent;
  source: 'GEMINI_LLM' | 'TEMPLATE_FALLBACK';
  filename: string;
  raw_text?: string;
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
  timestamp: string;
  modality: string;
  predictionOrSummary: string;
  confidenceOrTriage: string;
  data: AnyAnalysisResult;
}
