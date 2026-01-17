*,
*::before,
*::after {
  box-sizing: border-box;
}

:root {
  --bg: #0f172a;
  --bg-elevated: #020617;
  --bg-card: #020617;
  --border-subtle: #1e293b;
  --accent: #38bdf8;
  --accent-soft: rgba(56, 189, 248, 0.1);
  --text-main: #e5e7eb;
  --text-muted: #9ca3af;
  --text-soft: #6b7280;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #22c55e;
  --radius-lg: 18px;
  --radius-md: 12px;
  --shadow-soft: 0 18px 40px rgba(15, 23, 42, 0.8);
  --shadow-card: 0 16px 30px rgba(15, 23, 42, 0.9);
  --transition-fast: 0.15s ease-out;
  --font-main: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: radial-gradient(circle at top, #111827 0, #020617 45%, #020617 100%);
  color: var(--text-main);
  font-family: var(--font-main);
}

/* Layout */

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 30px 14px;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.7), transparent);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(30, 64, 175, 0.5);
}

.app-header-main h1 {
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-header-main h1::before {
  content: "";
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: radial-gradient(circle, var(--accent), #0ea5e9);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.9);
}

.subtitle {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: var(--text-soft);
}

.app-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 18px 18px 40px;
}

.app-footer {
  text-align: center;
  padding: 10px 18px 22px;
  color: var(--text-soft);
}

/* Cards */

.card {
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.95));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 18px 20px 18px;
  border: 1px solid rgba(30, 64, 175, 0.55);
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 55%);
  opacity: 0.75;
  pointer-events: none;
}

.card > * {
  position: relative;
  z-index: 1;
}

.card h2 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.muted {
  color: var(--text-soft);
}

.small {
  font-size: 0.85rem;
}

/* Columns */

.two-column {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 12px;
}

.column {
  min-width: 0;
}

/* Guided mode */

.guided-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.guided-option {
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(15, 23, 42, 0.9);
  color: var(--text-main);
  padding: 8px 14px;
  font-size: 0.86rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.guided-option:hover {
  background: rgba(15, 23, 42, 1);
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.5);
}

.guided-option.active {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.guided-description {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.85);
  border: 1px dashed rgba(148, 163, 184, 0.5);
}

/* Forms */

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

input[type="text"],
input[type="number"],
select,
textarea {
  border-radius: 10px;
  border: 1px solid rgba(51, 65, 85, 0.9);
  background: rgba(15, 23, 42, 0.9);
  color: var(--text-main);
  padding: 7px 9px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus,
textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.4);
  background: rgba(15, 23, 42, 1);
}

textarea {
  resize: vertical;
}

/* Buttons */

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

button {
  border-radius: 999px;
  border: none;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  background: rgba(30, 64, 175, 0.9);
  color: var(--text-main);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast);
}

button:hover {
  background: rgba(37, 99, 235, 0.95);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.5);
  transform: translateY(-0.5px);
}

button.primary {
  background: linear-gradient(to right, #0ea5e9, #22c55e);
}

button.primary:hover {
  background: linear-gradient(to right, #38bdf8, #4ade80);
}

button.ghost {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

button.ghost:hover {
  background: rgba(15, 23, 42, 0.95);
}

/* Toggle */

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-soft);
}

.toggle input[type="checkbox"] {
  width: 32px;
  height: 18px;
  accent-color: var(--accent);
}

/* Results */

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  margin-top: 10px;
}

.result-item {
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(30, 64, 175, 0.7);
}

.result-item .label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-soft);
  margin-bottom: 3px;
}

.result-item .value {
  font-size: 0.98rem;
  font-variant-numeric: tabular-nums;
}

.results-extra {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.85);
  border: 1px dashed rgba(148, 163, 184, 0.7);
}

.delta-text {
  border-color: rgba(56, 189, 248, 0.7);
}

/* AI prompt */

#aiPrompt {
  width: 100%;
  margin-top: 6px;
  border-radius: 12px;
  border: 1px solid rgba(30, 64, 175, 0.7);
  background: rgba(15, 23, 42, 0.95);
  color: var(--text-main);
  font-family: var(--font-main);
  font-size: 0.9rem;
  padding: 8px 10px;
}

/* Scenario dashboard */

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 14px;
  margin-top: 4px;
}

.dashboard-chart {
  min-height: 260px;
  padding: 10px;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(30, 64, 175, 0.7);
}

.dashboard-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Pinned scenario cards */

.pinned-card {
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(30, 64, 175, 0.7);
  padding: 10px 10px 8px;
  position: relative;
  overflow: hidden;
}

.pinned-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
}

.pinned-card-name {
  font-size: 0.95rem;
}

.pinned-card-country {
  font-size: 0.8rem;
  color: var(--text-soft);
}

.pinned-card-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  margin-top: 6px;
  font-size: 0.8rem;
}

.pinned-card-metrics span.label {
  color: var(--text-soft);
}

.traffic-bar {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  width: 100%;
  height: 4px;
}

.traffic-low {
  background: linear-gradient(to right, #ef4444, #f97316);
}

.traffic-medium {
  background: linear-gradient(to right, #f97316, #eab308);
}

.traffic-high {
  background: linear-gradient(to right, #22c55e, #4ade80);
}

/* Table */

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

thead {
  background: rgba(15, 23, 42, 0.95);
}

th,
td {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(30, 64, 175, 0.5);
  text-align: left;
  white-space: nowrap;
}

th {
  font-weight: 500;
  color: var(--text-soft);
}

td {
  font-variant-numeric: tabular-nums;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid rgba(148, 163, 184, 0.7);
  color: var(--text-soft);
}

.badge-ref {
  border-color: var(--accent);
  color: var(--accent);
}

.badge-equity {
  border-color: #f97316;
  color: #facc15;
}

.table-btn {
  padding: 4px 10px;
  font-size: 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.95);
}

.table-btn:hover {
  border-color: var(--accent);
}

/* Presentation mode */

body.presentation-mode {
  font-size: 1.05rem;
}

body.presentation-mode .app-main {
  max-width: 1400px;
}

body.presentation-mode .card {
  padding: 20px 22px 22px;
}

body.presentation-mode .two-column {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
}

body.presentation-mode input,
body.presentation-mode select,
body.presentation-mode textarea {
  font-size: 1rem;
}

body.presentation-mode .guided-description,
body.presentation-mode .form-grid,
body.presentation-mode #scenario-table,
body.presentation-mode #guided-mode .muted.small {
  /* Keep visible but already compact; no need to hide. */
}

body.presentation-mode .app-footer {
  font-size: 0.95rem;
}

/* Responsive */

@media (max-width: 960px) {
  .two-column,
  .dashboard-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-main {
    padding-inline: 12px;
  }

  .card {
    padding-inline: 14px;
  }
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .results-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .guided-options {
    flex-direction: column;
  }
}
