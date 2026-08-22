import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Plus
} from 'lucide-react';
import { AnyAnalysisResult } from '../../types';

interface StudyItem {
  id: string;
  patient_name: string;
  patient_id: string;
  modality: string;
  study_date: string;
  status: string;
  latest_prediction?: string;
  latest_confidence?: number;
}

interface MyStudiesPageProps {
  onOpenAnalysis: (result: AnyAnalysisResult) => void;
  onNewStudyClick: () => void;
}

export const MyStudiesPage: React.FC<MyStudiesPageProps> = ({
  onOpenAnalysis,
  onNewStudyClick
}) => {
  const [studies, setStudies] = useState<StudyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/v1/studies', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('radinova_token') || ''}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.studies) setStudies(data.studies);
      })
      .catch(() => {});
  }, []);

  const filteredStudies = studies.filter(s => {
    const matchSearch = s.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.patient_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModality = modalityFilter === 'ALL' || s.modality === modalityFilter;
    return matchSearch && matchModality;
  });

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-app)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Clinical Imaging Studies Archive
          </h1>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Review, inspect, and open diagnostic records across thoracic, limb, and neuro modalities.
          </span>
        </div>

        <button className="btn-new-study" style={{ width: 'auto' }} onClick={onNewStudyClick}>
          <Plus size={16} />
          <span>New Study</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '8px 14px'
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search patient name, ID, or accession number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={modalityFilter}
          onChange={e => setModalityFilter(e.target.value)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Modalities</option>
          <option value="limb_fracture">Limb (Fracture)</option>
          <option value="chest_xray">Chest (X-Ray)</option>
          <option value="mri">Brain MRI</option>
        </select>
      </div>

      {/* Studies Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Study ID</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Patient Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Modality</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date & Time</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>AI Finding</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudies.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  No studies found matching query. Click <strong>+ New Study</strong> to initiate a scan.
                </td>
              </tr>
            ) : (
              filteredStudies.map(st => (
                <tr 
                  key={st.id} 
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 650, color: 'var(--accent-lime)' }}>
                    {st.patient_id || 'RN-2026-00142'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {st.patient_name}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                    {st.modality.replace('_', ' ').toUpperCase()}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                    {st.study_date}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 650, color: st.latest_prediction?.includes('FRACTURE') || st.latest_prediction?.includes('PNEUMONIA') ? 'var(--accent-lime)' : 'var(--text-primary)' }}>
                    {st.latest_prediction || 'Analysis Completed'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="status-badge-completed">
                      {st.status || 'Completed'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        // Launch sample/active result
                        onOpenAnalysis({
                          modality: st.modality as any || 'limb_fracture',
                          prediction: st.latest_prediction || 'FRACTURED',
                          confidence: st.latest_confidence || 0.92,
                          probabilities: { FRACTURED: 0.92, NOT_FRACTURED: 0.08 },
                          original_image: '/samples/limb_fracture_1.jpg',
                          gradcam_overlay: '/samples/limb_fracture_1.jpg',
                          guidance: {
                            severity: 'MODERATE',
                            clinical_summary: 'Osseous cortical disruption detected.',
                            differential_considerations: ['Colles fracture', 'Radial styloid fracture'],
                            recommended_followup: ['Orthopedic consult', 'Splinting in neutral position'],
                            disclaimer: 'AI-assisted decision support.'
                          },
                          disclaimer: 'AI-assisted prediction — requires clinical review.'
                        });
                      }}
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={13} />
                      <span>Open Console</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
