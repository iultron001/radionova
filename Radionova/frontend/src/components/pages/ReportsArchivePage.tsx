import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ExternalLink, 
  Eye, 
  X
} from 'lucide-react';
import { ReportRecord, ModalityId } from '../../types';

interface ReportsArchivePageProps {
  history: ReportRecord[];
  onDownloadPdf: (data: any) => void;
  onClearHistory: () => void;
  onOpenInStudio: (modality: ModalityId, data: any) => void;
}

export const ReportsArchivePage: React.FC<ReportsArchivePageProps> = ({
  history,
  onDownloadPdf,
  onClearHistory,
  onOpenInStudio
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedTriage, setSelectedTriage] = useState<string>('all');
  const [inspectRecord, setInspectRecord] = useState<ReportRecord | null>(null);

  const modalityOptions = [
    { id: 'all', label: 'All Modalities' },
    { id: 'Chest Radiography (X-Ray)', label: 'Chest X-Ray' },
    { id: 'Limb (Bone Fracture)', label: 'Limb & Fracture' },
    { id: 'Brain MRI Neuroimaging', label: 'Brain MRI' },
    { id: 'Hematology & Blood Test', label: 'Hematology' },
    { id: 'Breast Cancer Screening', label: 'Breast Cancer' },
  ];

  const filteredHistory = history.filter((rec) => {
    // Search query filter
    const matchesSearch = 
      searchTerm === '' ||
      rec.modality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.predictionOrSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.confidenceOrTriage.toLowerCase().includes(searchTerm.toLowerCase());

    // Modality filter
    const matchesModality = 
      selectedModality === 'all' || rec.modality === selectedModality;

    // Triage filter
    const textToCheck = (rec.confidenceOrTriage + ' ' + rec.predictionOrSummary).toUpperCase();
    const isAlert = 
      !textToCheck.includes('NOT_FRACTURED') &&
      !textToCheck.includes('NO FRACTURE') &&
      !textToCheck.includes('NORMAL') &&
      !textToCheck.includes('BENIGN') &&
      (
        textToCheck.includes('ACUTE') || 
        textToCheck.includes('PNEUMONIA') || 
        textToCheck.includes('FRACTUR') || 
        textToCheck.includes('TUMOR') ||
        textToCheck.includes('MALIGNANT') ||
        textToCheck.includes('ELEVATED')
      );

    const matchesTriage = 
      selectedTriage === 'all' ||
      (selectedTriage === 'alert' && isAlert) ||
      (selectedTriage === 'normal' && !isAlert);

    return matchesSearch && matchesModality && matchesTriage;
  });

  const getModalityIdFromRecord = (modalityName: string): ModalityId => {
    if (modalityName.includes('Chest')) return 'chest_xray';
    if (modalityName.includes('Limb') || modalityName.includes('Fracture')) return 'limb_fracture';
    if (modalityName.includes('MRI') || modalityName.includes('Brain')) return 'mri';
    if (modalityName.includes('Blood') || modalityName.includes('Hematology')) return 'blood';
    return 'breast_cancer';
  };

  return (
    <div className="page-container archive-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <span className="tab-tag" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', borderColor: 'var(--accent-subtle)' }}>
            HISTORICAL RECORD
          </span>
          <h1 className="page-title">Diagnostic Reports Archive</h1>
          <p className="page-description">
            Complete institutional repository of generated AI assessments, Grad-CAM heatmaps, biomarker matrices, and clinical decision support records.
          </p>
        </div>

        {history.length > 0 && (
          <button
            className="btn-swiss-outline-sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all session report archives?')) {
                onClearHistory();
              }
            }}
            style={{ color: 'var(--status-alert-text)', borderColor: 'var(--status-alert-border)' }}
          >
            <Trash2 size={14} style={{ marginRight: '6px' }} />
            Clear Archive
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="archive-controls-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by diagnosis, modality, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="select-wrap">
            <Filter size={14} className="select-icon" />
            <select 
              value={selectedModality} 
              onChange={(e) => setSelectedModality(e.target.value)}
              className="filter-select"
            >
              {modalityOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="select-wrap">
            <select 
              value={selectedTriage} 
              onChange={(e) => setSelectedTriage(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Triage Categories</option>
              <option value="alert">Pathological / Elevated Only</option>
              <option value="normal">Normal / Baseline Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {history.length === 0 ? (
        <div className="archive-empty-state">
          <Archive size={48} className="archive-empty-icon" />
          <h2 className="archive-empty-title">Archive is Currently Empty</h2>
          <p className="archive-empty-desc">
            No diagnostic reports have been generated in this session yet. Run an analysis in the Diagnostic Studio to automatically create verifiable clinical records.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="archive-empty-state">
          <Search size={40} className="archive-empty-icon" />
          <h2 className="archive-empty-title">No Matching Records Found</h2>
          <p className="archive-empty-desc">
            Adjust your search terms or filters to find archived reports.
          </p>
          <button 
            className="btn-swiss-outline-sm" 
            onClick={() => { setSearchTerm(''); setSelectedModality('all'); setSelectedTriage('all'); }}
            style={{ marginTop: '12px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="archive-table-container">
          <table className="archive-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Timestamp</th>
                <th style={{ width: '220px' }}>Diagnostic Suite</th>
                <th>Primary Finding / Impression</th>
                <th style={{ width: '160px' }}>Confidence / Triage</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((rec) => {
                const textToCheck = (rec.confidenceOrTriage + ' ' + rec.predictionOrSummary).toUpperCase();
                const isAlert = 
                  !textToCheck.includes('NOT_FRACTURED') &&
                  !textToCheck.includes('NO FRACTURE') &&
                  !textToCheck.includes('NORMAL') &&
                  !textToCheck.includes('BENIGN') &&
                  (
                    textToCheck.includes('ACUTE') || 
                    textToCheck.includes('PNEUMONIA') || 
                    textToCheck.includes('FRACTUR') || 
                    textToCheck.includes('TUMOR') ||
                    textToCheck.includes('MALIGNANT') ||
                    textToCheck.includes('ELEVATED')
                  );

                return (
                  <tr key={rec.id} className="archive-row">
                    <td className="archive-cell-time">
                      {rec.timestamp}
                    </td>
                    <td className="archive-cell-modality">
                      <span className="modality-chip">
                        {rec.modality}
                      </span>
                    </td>
                    <td className="archive-cell-summary">
                      <strong>{rec.predictionOrSummary}</strong>
                    </td>
                    <td className="archive-cell-triage">
                      <span className={`status-pill ${isAlert ? 'alert' : 'positive'}`}>
                        {rec.confidenceOrTriage}
                      </span>
                    </td>
                    <td className="archive-cell-actions">
                      <div className="action-buttons-group">
                        <button
                          className="btn-action-icon"
                          onClick={() => setInspectRecord(rec)}
                          title="Quick Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-action-icon"
                          onClick={() => {
                            const modId = getModalityIdFromRecord(rec.modality);
                            onOpenInStudio(modId, rec.data);
                          }}
                          title="Open in Diagnostic Studio"
                        >
                          <ExternalLink size={15} />
                        </button>
                        <button
                          className="btn-action-icon primary"
                          onClick={() => onDownloadPdf(rec.data)}
                          title="Export PDF Report"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Inspection Modal */}
      {inspectRecord && (
        <div className="modal-backdrop" onClick={() => setInspectRecord(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="tab-tag" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', borderColor: 'var(--accent-subtle)' }}>
                  {inspectRecord.modality}
                </span>
                <h3 className="modal-title">{inspectRecord.predictionOrSummary}</h3>
                <span className="modal-time">Logged at {inspectRecord.timestamp}</span>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setInspectRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="inspect-status-banner">
                <div className="inspect-status-label">Clinical Triage / Score</div>
                <div className="inspect-status-val">{inspectRecord.confidenceOrTriage}</div>
              </div>

              {'gradcam_overlay' in inspectRecord.data && (
                <div className="inspect-images-grid">
                  <div>
                    <div className="inspect-img-title">Original Radiograph</div>
                    <img 
                      src={`data:image/jpeg;base64,${inspectRecord.data.original_image}`} 
                      alt="Original Scan"
                      className="inspect-img" 
                    />
                  </div>
                  <div>
                    <div className="inspect-img-title">Grad-CAM Neural Heatmap</div>
                    <img 
                      src={`data:image/jpeg;base64,${inspectRecord.data.gradcam_overlay}`} 
                      alt="Heatmap Overlay" 
                      className="inspect-img"
                    />
                  </div>
                </div>
              )}

              {'explanation' in inspectRecord.data && (
                <div className="inspect-text-summary">
                  <h4>Clinical Summary</h4>
                  <p>{inspectRecord.data.explanation.plain_language_summary}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-swiss-outline"
                onClick={() => {
                  const modId = getModalityIdFromRecord(inspectRecord.modality);
                  onOpenInStudio(modId, inspectRecord.data);
                  setInspectRecord(null);
                }}
              >
                <ExternalLink size={14} style={{ marginRight: '6px' }} />
                Open in Full Studio
              </button>
              <button 
                className="btn-swiss"
                onClick={() => onDownloadPdf(inspectRecord.data)}
              >
                <Download size={14} style={{ marginRight: '6px' }} />
                Download Formal PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
