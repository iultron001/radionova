import json

with open(r'd:\anti gravity\claude work\projects_data.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print(f"Loaded {len(projects)} projects.")

html_template = """<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Catalog: 200 Industrial Engineering & Deep-Tech Projects</title>
  <meta name="description" content="List-wise directory of 200 production-grade, real-world projects across Cybersecurity, AI/ML, Quantum Computing, and Processor Architecture.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* ==========================================================================
       MILD & HARMONIOUS COLOR SYSTEM (Soft Slate & Warm Neutrals)
       ========================================================================== */
    :root {
      --font-heading: 'Plus Jakarta Sans', -apple-system, sans-serif;
      --font-body: 'Inter', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      /* Mild Light Theme (Default) */
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f1f5f9;
      --bg-surface-subtle: #f8fafc;
      --border-color: #e2e8f0;
      --border-hover: #cbd5e1;
      
      --text-main: #1e293b;
      --text-muted: #64748b;
      --text-subtle: #94a3b8;
      
      /* Mild Domain Palette */
      --cyber-color: #904661;
      --cyber-bg: #fdf2f5;
      --cyber-border: #f5ccd7;
      
      --aiml-color: #276749;
      --aiml-bg: #f0fdf4;
      --aiml-border: #c6f6d5;
      
      --quantum-color: #2b6cb0;
      --quantum-bg: #f0f9ff;
      --quantum-border: #bee3f8;
      
      --proc-color: #9c4221;
      --proc-bg: #fffaf0;
      --proc-border: #feebc8;

      /* Mild Difficulty Indicators */
      --diff-simple-text: #22543d;
      --diff-simple-bg: #e6fffa;
      --diff-simple-border: #b2f5ea;

      --diff-inter-text: #744210;
      --diff-inter-bg: #fefcbf;
      --diff-inter-border: #faf089;

      --diff-hard-text: #7b341e;
      --diff-hard-bg: #feebc8;
      --diff-hard-border: #fbd38d;

      --card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
      --card-shadow-hover: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-full: 9999px;
    }

    [data-theme="dark"] {
      --bg-canvas: #0f172a;
      --bg-surface: #1e293b;
      --bg-surface-elevated: #283548;
      --bg-surface-subtle: #172033;
      --border-color: #334155;
      --border-hover: #475569;
      
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-subtle: #64748b;
      
      /* Mild Dark Domain Palette */
      --cyber-color: #f472b6;
      --cyber-bg: rgba(244, 114, 182, 0.12);
      --cyber-border: rgba(244, 114, 182, 0.25);
      
      --aiml-color: #4ade80;
      --aiml-bg: rgba(74, 222, 128, 0.12);
      --aiml-border: rgba(74, 222, 128, 0.25);
      
      --quantum-color: #38bdf8;
      --quantum-bg: rgba(56, 189, 248, 0.12);
      --quantum-border: rgba(56, 189, 248, 0.25);
      
      --proc-color: #fb923c;
      --proc-bg: rgba(251, 146, 60, 0.12);
      --proc-border: rgba(251, 146, 60, 0.25);

      --diff-simple-text: #6ee7b7;
      --diff-simple-bg: rgba(110, 231, 183, 0.15);
      --diff-simple-border: rgba(110, 231, 183, 0.3);

      --diff-inter-text: #fde047;
      --diff-inter-bg: rgba(253, 224, 71, 0.15);
      --diff-inter-border: rgba(253, 224, 71, 0.3);

      --diff-hard-text: #fca5a5;
      --diff-hard-bg: rgba(252, 165, 165, 0.15);
      --diff-hard-border: rgba(252, 165, 165, 0.3);

      --card-shadow: 0 2px 4px rgba(0,0,0,0.25);
      --card-shadow-hover: 0 6px 16px rgba(0,0,0,0.4);
    }

    /* Reset & Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }

    body {
      background-color: var(--bg-canvas);
      color: var(--text-main);
      font-family: var(--font-body);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px 80px 20px;
    }

    /* Header Section */
    .catalog-header {
      margin-bottom: 28px;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .brand-tag {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-surface-elevated);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .brand-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #10b981;
    }

    .theme-toggle-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .theme-toggle-btn:hover {
      border-color: var(--border-hover);
      background: var(--bg-surface-elevated);
    }

    .title-group h1 {
      font-family: var(--font-heading);
      font-size: 2.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .title-group p {
      font-size: 0.96rem;
      color: var(--text-muted);
      max-width: 800px;
    }

    /* Summary Metric Bar */
    .metrics-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0 28px 0;
    }

    .metric-chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: var(--card-shadow);
    }

    .metric-chip .chip-label {
      font-size: 0.76rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .metric-chip .chip-value {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .metric-chip .chip-sub {
      font-size: 0.75rem;
      color: var(--text-subtle);
    }

    /* Filter & Controls Panel */
    .controls-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 24px;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-row {
      display: flex;
      gap: 10px;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-subtle);
      font-size: 0.95rem;
    }

    .search-input {
      width: 100%;
      padding: 10px 14px 10px 38px;
      font-size: 0.92rem;
      font-family: var(--font-body);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-canvas);
      color: var(--text-main);
      outline: none;
    }

    .search-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
    }

    .search-clear-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-subtle);
      cursor: pointer;
      font-size: 0.85rem;
      display: none;
    }

    /* Filter Tabs & Pills */
    .filter-groups {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid var(--border-color);
      padding-top: 14px;
    }

    .domain-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .filter-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .filter-btn:hover {
      background: var(--bg-surface);
      color: var(--text-main);
      border-color: var(--border-hover);
    }

    .filter-btn.active {
      background: var(--text-main);
      color: var(--bg-surface);
      border-color: var(--text-main);
      font-weight: 600;
    }

    .filter-count {
      font-size: 0.72rem;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      background: rgba(128, 128, 128, 0.18);
    }

    .filter-btn.active .filter-count {
      background: rgba(255, 255, 255, 0.25);
    }

    .secondary-filters {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .select-dropdown {
      padding: 6px 12px;
      font-size: 0.82rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      color: var(--text-main);
      cursor: pointer;
      outline: none;
    }

    .view-toggle-btn {
      padding: 6px 12px;
      font-size: 0.82rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      color: var(--text-main);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    /* List Results Info */
    .results-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding: 0 4px;
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    /* ==========================================================================
       LIST-WISE PROJECT CARD DESIGN (Clean, Vertical Flow)
       ========================================================================== */
    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .project-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      overflow: hidden;
    }

    .project-card:hover {
      box-shadow: var(--card-shadow-hover);
      border-color: var(--border-hover);
    }

    /* Card Domain Stripe */
    .project-card.domain-cyber { border-left: 4px solid var(--cyber-color); }
    .project-card.domain-aiml { border-left: 4px solid var(--aiml-color); }
    .project-card.domain-quantum { border-left: 4px solid var(--quantum-color); }
    .project-card.domain-proc { border-left: 4px solid var(--proc-color); }

    /* Card Header */
    .card-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
    }

    .card-title-area {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .badges-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge-id {
      font-family: var(--font-mono);
      font-size: 0.76rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.03em;
    }

    .badge-id.domain-cyber { background: var(--cyber-bg); color: var(--cyber-color); border: 1px solid var(--cyber-border); }
    .badge-id.domain-aiml { background: var(--aiml-bg); color: var(--aiml-color); border: 1px solid var(--aiml-border); }
    .badge-id.domain-quantum { background: var(--quantum-bg); color: var(--quantum-color); border: 1px solid var(--quantum-border); }
    .badge-id.domain-proc { background: var(--proc-bg); color: var(--proc-color); border: 1px solid var(--proc-border); }

    .badge-domain {
      font-size: 0.74rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .badge-diff {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      text-transform: capitalize;
    }

    .badge-diff.simple { background: var(--diff-simple-bg); color: var(--diff-simple-text); border: 1px solid var(--diff-simple-border); }
    .badge-diff.intermediate { background: var(--diff-inter-bg); color: var(--diff-inter-text); border: 1px solid var(--diff-inter-border); }
    .badge-diff.hard { background: var(--diff-hard-bg); color: var(--diff-hard-text); border: 1px solid var(--diff-hard-border); }

    .card-title {
      font-family: var(--font-heading);
      font-size: 1.08rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.35;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-icon {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .btn-icon:hover {
      background: var(--bg-surface);
      color: var(--text-main);
      border-color: var(--border-hover);
    }

    .btn-icon.bookmarked {
      color: #eab308;
      border-color: #fde047;
      background: #fefce8;
    }

    /* Card Body Description */
    .card-scope {
      font-size: 0.90rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    /* Tech Stack & Industry Row */
    .card-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: var(--bg-surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      font-size: 0.82rem;
    }

    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .meta-label {
      font-size: 0.70rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-subtle);
    }

    .meta-value {
      color: var(--text-main);
      font-weight: 500;
      line-height: 1.4;
    }

    .meta-value code {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      background: rgba(128, 128, 128, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
    }

    /* Card Footer Action Bar */
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
    }

    .btn-copy-prompt {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 5px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-copy-prompt:hover {
      background: var(--text-main);
      color: var(--bg-surface);
      border-color: var(--text-main);
    }

    .btn-details {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn-details:hover {
      color: var(--text-main);
      text-decoration: underline;
    }

    /* Compact View Variant */
    .compact-view .project-card {
      padding: 12px 16px;
      gap: 6px;
    }

    .compact-view .card-meta-grid {
      display: none;
    }

    .compact-view .card-footer {
      display: none;
    }

    .compact-view .card-title {
      font-size: 0.98rem;
    }

    .compact-view .card-scope {
      font-size: 0.85rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: var(--bg-surface);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
    }

    .empty-state h3 {
      font-size: 1.1rem;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .empty-state p {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e293b;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 0.84rem;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s ease;
      z-index: 9999;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* Modal for Detailed Blueprint */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 1000;
    }

    .modal-overlay.open {
      display: flex;
    }

    .modal-content {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      max-width: 680px;
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-close-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .metrics-bar {
        grid-template-columns: repeat(2, 1fr);
      }
      .filter-groups {
        flex-direction: column;
        align-items: stretch;
      }
      .card-meta-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Header Section -->
    <header class="catalog-header">
      <div class="top-bar">
        <div class="brand-tag">
          <span class="brand-dot"></span>
          <span>Industrial Deep-Tech Directory (2025–2026)</span>
        </div>
        <button id="themeToggle" class="theme-toggle-btn" title="Toggle Light/Dark Theme">
          <span id="themeIcon">🌙</span>
          <span id="themeLabel">Dark Mode</span>
        </button>
      </div>

      <div class="title-group">
        <h1>Master Project Catalog 2.0</h1>
        <p>200 production-ready, industrial-grade engineering projects across Cybersecurity, Machine Learning, Quantum Computing, and Processor Architecture. Designed with zero toy tutorials and high enterprise relevance.</p>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="metrics-bar">
        <div class="metric-chip">
          <span class="chip-label">Total Projects</span>
          <span class="chip-value" id="statTotal">200</span>
          <span class="chip-sub">Across 4 Engineering Fields</span>
        </div>
        <div class="metric-chip">
          <span class="chip-label">Simple Tier</span>
          <span class="chip-value" style="color: #10b981;">20</span>
          <span class="chip-sub">5 per domain (Foundational)</span>
        </div>
        <div class="metric-chip">
          <span class="chip-label">Intermediate Tier</span>
          <span class="chip-value" style="color: #f59e0b;">40</span>
          <span class="chip-sub">10 per domain (Microservices)</span>
        </div>
        <div class="metric-chip">
          <span class="chip-label">Hard / Research Tier</span>
          <span class="chip-value" style="color: #ef4444;">140</span>
          <span class="chip-sub">35 per domain (Enterprise)</span>
        </div>
      </div>
    </header>

    <!-- Controls & Search Panel -->
    <section class="controls-panel">
      <div class="search-row">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="Search by Project ID (e.g., CYB-016), title, tech stack (e.g., eBPF, RISC-V), or industrial use case...">
          <button id="searchClearBtn" class="search-clear-btn">✕</button>
        </div>
      </div>

      <div class="filter-groups">
        <!-- Domain Tabs -->
        <div class="domain-tabs" id="domainFilterTabs">
          <button class="filter-btn active" data-domain="all">
            <span>All Domains</span>
            <span class="filter-count" id="countAll">200</span>
          </button>
          <button class="filter-btn" data-domain="Cybersecurity">
            <span>🛡️ Cybersecurity</span>
            <span class="filter-count">50</span>
          </button>
          <button class="filter-btn" data-domain="Data Science, AI & ML">
            <span>🧠 AI & Data Science</span>
            <span class="filter-count">50</span>
          </button>
          <button class="filter-btn" data-domain="Quantum Computing">
            <span>⚛️ Quantum Computing</span>
            <span class="filter-count">50</span>
          </button>
          <button class="filter-btn" data-domain="Processor Architecture">
            <span>⚡ Processor & VLSI</span>
            <span class="filter-count">50</span>
          </button>
        </div>

        <!-- Secondary Controls -->
        <div class="secondary-filters">
          <select id="difficultySelect" class="select-dropdown" title="Filter by Difficulty">
            <option value="all">All Difficulties</option>
            <option value="Simple">Simple (5 per domain)</option>
            <option value="Intermediate">Intermediate (10 per domain)</option>
            <option value="Hard">Hard / Deep-Tech (35 per domain)</option>
          </select>

          <button id="btnToggleCompact" class="view-toggle-btn" title="Toggle Compact / Detailed List">
            <span>📄</span>
            <span id="compactBtnLabel">Compact</span>
          </button>

          <button id="btnOnlyBookmarks" class="view-toggle-btn" title="Show Bookmarked Projects">
            <span>⭐</span>
            <span id="bookmarkBtnLabel">Saved (<span id="bookmarkCount">0</span>)</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Results Status -->
    <div class="results-meta">
      <div>Showing <strong id="resultsCount">200</strong> of 200 projects</div>
      <div id="activeFilterDesc" style="font-size: 0.78rem; color: var(--text-subtle);">All engineering domains</div>
    </div>

    <!-- Projects List View -->
    <main id="projectsListContainer" class="projects-list">
      <!-- Dynamic list items will be injected here -->
    </main>

    <!-- Empty State Container -->
    <div id="emptyState" class="empty-state" style="display: none;">
      <h3>No matching projects found</h3>
      <p>Try adjusting your search keywords or switching domain filters.</p>
      <button class="filter-btn" onclick="resetFilters()">Reset All Filters</button>
    </div>
  </div>

  <!-- Detail Modal -->
  <div id="modalOverlay" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <div id="modalBadges" class="badges-line" style="margin-bottom: 8px;"></div>
          <h2 id="modalTitle" style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--text-main);"></h2>
        </div>
        <button id="modalCloseBtn" class="modal-close-btn">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <div class="meta-label" style="margin-bottom: 4px;">Technical Scope & Problem Statement</div>
          <p id="modalScope" style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.6;"></p>
        </div>

        <div class="card-meta-grid">
          <div class="meta-block">
            <span class="meta-label">Recommended Tech Stack</span>
            <span id="modalStack" class="meta-value"></span>
          </div>
          <div class="meta-block">
            <span class="meta-label">Industrial Application</span>
            <span id="modalApplication" class="meta-value"></span>
          </div>
        </div>

        <div>
          <div class="meta-label" style="margin-bottom: 6px;">AI System Architecture Prompt</div>
          <textarea id="modalPromptText" readonly style="width: 100%; height: 110px; padding: 10px; font-family: var(--font-mono); font-size: 0.78rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); resize: none;"></textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
        <button id="btnModalCopyPrompt" class="btn-copy-prompt">📋 Copy Full Blueprint Prompt</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast">
    <span id="toastIcon">✓</span>
    <span id="toastMessage">Copied to clipboard</span>
  </div>

  <!-- Embedded JSON Data -->
  <script>
    const ALL_PROJECTS = """ + json.dumps(projects, indent=2) + """;

    // State Management
    let currentDomain = 'all';
    let currentDifficulty = 'all';
    let searchQuery = '';
    let isCompact = false;
    let onlyBookmarks = false;
    let bookmarks = new Set(JSON.parse(localStorage.getItem('saved_projects_v2') || '[]'));
    let currentModalProject = null;

    // DOM Elements
    const listContainer = document.getElementById('projectsListContainer');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const domainTabs = document.getElementById('domainFilterTabs');
    const difficultySelect = document.getElementById('difficultySelect');
    const btnToggleCompact = document.getElementById('btnToggleCompact');
    const compactBtnLabel = document.getElementById('compactBtnLabel');
    const btnOnlyBookmarks = document.getElementById('btnOnlyBookmarks');
    const bookmarkCount = document.getElementById('bookmarkCount');
    const resultsCount = document.getElementById('resultsCount');
    const activeFilterDesc = document.getElementById('activeFilterDesc');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const toast = document.getElementById('toast');

    // Domain Class Mapping
    function getDomainClass(domain) {
      if (domain.includes('Cyber')) return 'domain-cyber';
      if (domain.includes('AI') || domain.includes('Data')) return 'domain-aiml';
      if (domain.includes('Quantum')) return 'domain-quantum';
      if (domain.includes('Processor')) return 'domain-proc';
      return '';
    }

    // Helper: Toast
    function showToast(msg, icon = '✓') {
      document.getElementById('toastMessage').textContent = msg;
      document.getElementById('toastIcon').textContent = icon;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2400);
    }

    // Bookmarking
    function toggleBookmark(id) {
      if (bookmarks.has(id)) {
        bookmarks.delete(id);
        showToast(`Removed ${id} from saved list`, '⭐');
      } else {
        bookmarks.add(id);
        showToast(`Saved ${id} to your list!`, '⭐');
      }
      localStorage.setItem('saved_projects_v2', JSON.stringify([...bookmarks]));
      updateBookmarkCounter();
      renderProjects();
    }

    function updateBookmarkCounter() {
      bookmarkCount.textContent = bookmarks.size;
    }

    // Filter Logic
    function getFilteredProjects() {
      return ALL_PROJECTS.filter(p => {
        // Domain filter
        if (currentDomain !== 'all' && p.domain !== currentDomain) {
          return false;
        }

        // Difficulty filter
        if (currentDifficulty !== 'all' && p.difficulty.toLowerCase() !== currentDifficulty.toLowerCase()) {
          return false;
        }

        // Bookmarks only
        if (onlyBookmarks && !bookmarks.has(p.id)) {
          return false;
        }

        // Search Query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const matchId = p.id.toLowerCase().includes(q);
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchScope = p.scope.toLowerCase().includes(q);
          const matchStack = p.stack.toLowerCase().includes(q);
          const matchApp = p.application.toLowerCase().includes(q);
          return matchId || matchTitle || matchScope || matchStack || matchApp;
        }

        return true;
      });
    }

    // Render Projects List
    function renderProjects() {
      const filtered = getFilteredProjects();
      resultsCount.textContent = filtered.length;

      // Update filter description
      let desc = currentDomain === 'all' ? 'All engineering domains' : currentDomain;
      if (currentDifficulty !== 'all') desc += ` • ${currentDifficulty} Tier`;
      if (onlyBookmarks) desc += ' • Bookmarks Only';
      activeFilterDesc.textContent = desc;

      if (filtered.length === 0) {
        listContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';

      const html = filtered.map(p => {
        const domClass = getDomainClass(p.domain);
        const isSaved = bookmarks.has(p.id);

        return `
          <article class="project-card ${domClass}">
            <div class="card-header-row">
              <div class="card-title-area">
                <div class="badges-line">
                  <span class="badge-id ${domClass}">${p.id}</span>
                  <span class="badge-domain">${p.domain}</span>
                  <span class="badge-diff ${p.difficulty.toLowerCase()}">${p.difficulty}</span>
                </div>
                <h2 class="card-title">${p.title}</h2>
              </div>
              <div class="card-actions">
                <button class="btn-icon ${isSaved ? 'bookmarked' : ''}" title="${isSaved ? 'Remove Bookmark' : 'Save Project'}" onclick="toggleBookmark('${p.id}')">
                  ${isSaved ? '★' : '☆'}
                </button>
              </div>
            </div>

            <p class="card-scope">${p.scope}</p>

            <div class="card-meta-grid">
              <div class="meta-block">
                <span class="meta-label">Tech Stack</span>
                <span class="meta-value">${p.stack}</span>
              </div>
              <div class="meta-block">
                <span class="meta-label">Target Industrial Application</span>
                <span class="meta-value">${p.application}</span>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-copy-prompt" onclick="copyProjectPrompt('${p.id}')">
                📋 Copy AI Prompt
              </button>
              <button class="btn-details" onclick="openDetailsModal('${p.id}')">
                View Blueprint Specs →
              </button>
            </div>
          </article>
        `;
      }).join('');

      listContainer.innerHTML = html;
    }

    // Copy Prompt Logic
    function copyProjectPrompt(id) {
      const p = ALL_PROJECTS.find(x => x.id === id);
      if (!p) return;

      const promptText = `I want to build an industrial-grade implementation of "${p.title}" (ID: ${p.id}).

Domain: ${p.domain}
Difficulty: ${p.difficulty}
Target Industrial Application: ${p.application}

Technical Scope & Problem Statement:
${p.scope}

Recommended Tech Stack:
${p.stack}

Please provide:
1. Complete system architecture diagram and component breakdown.
2. Step-by-step modular implementation plan with directory structure.
3. Production-ready starter codebase with error handling, test harness, and build scripts.
4. Validation and benchmarking methodology to verify industrial-grade reliability.`;

      navigator.clipboard.writeText(promptText).then(() => {
        showToast(`📋 Copied AI Blueprint for ${p.id}!`);
      }).catch(() => {
        showToast('Failed to copy');
      });
    }

    // Open Modal
    function openDetailsModal(id) {
      const p = ALL_PROJECTS.find(x => x.id === id);
      if (!p) return;
      currentModalProject = p;

      const domClass = getDomainClass(p.domain);
      document.getElementById('modalBadges').innerHTML = `
        <span class="badge-id ${domClass}">${p.id}</span>
        <span class="badge-domain">${p.domain}</span>
        <span class="badge-diff ${p.difficulty.toLowerCase()}">${p.difficulty}</span>
      `;
      document.getElementById('modalTitle').textContent = p.title;
      document.getElementById('modalScope').textContent = p.scope;
      document.getElementById('modalStack').innerHTML = p.stack;
      document.getElementById('modalApplication').textContent = p.application;

      const promptText = `I want to build an industrial-grade implementation of "${p.title}" (ID: ${p.id}).

Domain: ${p.domain}
Difficulty: ${p.difficulty}
Target Industrial Application: ${p.application}

Technical Scope & Problem Statement:
${p.scope}

Recommended Tech Stack:
${p.stack}`;

      document.getElementById('modalPromptText').value = promptText;
      modalOverlay.classList.add('open');
    }

    // Modal Close
    modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('open'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('open');
    });

    document.getElementById('btnModalCopyPrompt').addEventListener('click', () => {
      if (currentModalProject) copyProjectPrompt(currentModalProject.id);
    });

    // Reset Filters
    function resetFilters() {
      currentDomain = 'all';
      currentDifficulty = 'all';
      searchQuery = '';
      onlyBookmarks = false;
      searchInput.value = '';
      difficultySelect.value = 'all';
      searchClearBtn.style.display = 'none';

      document.querySelectorAll('#domainFilterTabs .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.domain === 'all');
      });
      btnOnlyBookmarks.classList.remove('active');

      renderProjects();
    }

    // Event Listeners: Search
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      searchClearBtn.style.display = searchQuery ? 'block' : 'none';
      renderProjects();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      renderProjects();
    });

    // Domain Tabs
    domainTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      document.querySelectorAll('#domainFilterTabs .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDomain = btn.dataset.domain;
      renderProjects();
    });

    // Difficulty Select
    difficultySelect.addEventListener('change', (e) => {
      currentDifficulty = e.target.value;
      renderProjects();
    });

    // Compact Toggle
    btnToggleCompact.addEventListener('click', () => {
      isCompact = !isCompact;
      listContainer.classList.toggle('compact-view', isCompact);
      compactBtnLabel.textContent = isCompact ? 'Expanded' : 'Compact';
      showToast(isCompact ? 'Switched to Compact View' : 'Switched to Detailed View', '📄');
    });

    // Bookmarks Filter
    btnOnlyBookmarks.addEventListener('click', () => {
      onlyBookmarks = !onlyBookmarks;
      btnOnlyBookmarks.classList.toggle('active', onlyBookmarks);
      renderProjects();
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      themeLabel.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });

    // Initialize
    updateBookmarkCounter();
    renderProjects();
  </script>
</body>
</html>
"""

# Write to both project_list_2.html and index.html
with open(r'd:\anti gravity\claude work\project_list_2.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

with open(r'd:\anti gravity\claude work\index.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Successfully created project_list_2.html and updated index.html with list-wise mild color theme.")
