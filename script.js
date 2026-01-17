// eMANDEVAL-Future v2.0 core logic

const state = {
  currentScenario: null,
  savedScenarios: [],
  pinnedIds: [],
  referenceId: null,
  guidedMode: null,
  radarChart: null
};

document.addEventListener("DOMContentLoaded", () => {
  bindGuidedMode();
  bindPresentationToggle();
  bindConfigChange();
  bindScenarioButtons();
  initRadarChart();

  // Initial compute
  state.currentScenario = computeScenarioFromInputs();
  updateResultsDisplay(state.currentScenario);
  updateAiPrompt();
});

function byId(id) {
  return document.getElementById(id);
}

/* ------------------------ Guided policy question mode ---------------------- */

function bindGuidedMode() {
  const buttons = document.querySelectorAll(".guided-option");
  const desc = byId("guidedDescription");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.guidedMode = btn.dataset.mode || null;
      desc.textContent = guidedText(state.guidedMode);
      updateAiPrompt();
    });
  });
}

function guidedText(mode) {
  switch (mode) {
    case "strictVsLenient":
      return "Configure one strict mandate (broad scope, high coverage, narrow exemptions) and one lenient mandate (narrow scope, lower coverage, broader exemptions). Save both, pin them, and compare support, BCR, and lives saved.";
    case "maxSupportBCR1":
      return "Use the tool to search for combinations that reach at least BCR ≥ 1 while keeping predicted support as high as possible. Save promising options and pin the top candidates.";
    case "maxBCRSupportThreshold":
      return "Fix a minimum acceptable support level (e.g. 60–70%). Adjust scope, coverage and exemptions to maximise BCR, ensuring support stays above your threshold. Save the most efficient options and compare.";
    case "compareCountries":
      return "Set up matched scenarios across two or more countries (e.g. same scope and coverage but different costs or benefits). Save one scenario per country, pin them, and compare support, BCR, and lives saved.";
    default:
      return "Select a question above to see guidance and suggested workflow.";
  }
}

/* ----------------------------- Presentation mode --------------------------- */

function bindPresentationToggle() {
  const toggle = byId("presentationToggle");
  if (!toggle) return;
  toggle.addEventListener("change", (e) => {
    document.body.classList.toggle("presentation-mode", e.target.checked);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") {
      toggle.checked = !toggle.checked;
      document.body.classList.toggle("presentation-mode", toggle.checked);
    } else if (e.key === "ArrowRight") {
      cycleScenario(1);
    } else if (e.key === "ArrowLeft") {
      cycleScenario(-1);
    }
  });
}

function cycleScenario(direction) {
  const list = state.savedScenarios;
  if (!list.length) return;
  const current = state.currentScenario;
  let idx = list.findIndex(s => current && s.id === current.id);
  if (idx === -1) idx = 0;
  idx = (idx + direction + list.length) % list.length;
  const s = list[idx];
  loadScenarioToForm(s);
}

/* -------------------------- Config + computation --------------------------- */

function bindConfigChange() {
  const container = byId("config-and-results");
  const inputs = container.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    el.addEventListener("input", handleConfigChange);
    el.addEventListener("change", handleConfigChange);
  });

  const copyPromptBtn = byId("copyPromptBtn");
  copyPromptBtn.addEventListener("click", () => {
    const text = byId("aiPrompt").value;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // fall back
        window.alert("Copy failed; please select and copy manually.");
      });
    } else {
      window.alert("Clipboard access not available; please select and copy manually.");
    }
  });
}

function handleConfigChange() {
  state.currentScenario = computeScenarioFromInputs();
  updateResultsDisplay(state.currentScenario);
  updateAiPrompt();
}

function computeScenarioFromInputs() {
  const scenario = {};

  scenario.id = state.currentScenario && state.currentScenario.id || null;
  scenario.name = (byId("scenarioName").value || "").trim() || "Scenario";

  scenario.country = byId("countrySelect").value || "Other";
  scenario.outbreak = byId("outbreakSelect").value || "";
  scenario.scope = byId("scopeSelect").value || "";
  scenario.exemptions = byId("exemptionsSelect").value || "";
  scenario.coverage = toNumber(byId("coverageInput").value);
  scenario.population = toNumber(byId("populationInput").value);
  scenario.horizonYears = toNumber(byId("horizonInput").value);
  scenario.currencyLabel = (byId("currencyLabel").value || "").trim() || "local currency units";

  // Central values
  const livesCentralPer100k = toNumber(byId("livesPer100kCentral").value);
  const vslCentral = toNumber(byId("vslCentralInput").value);
  const costCentral = toNumber(byId("totalCostCentralInput").value);

  // Uncertainty values
  const livesLowPer100k = toNumberOrDefault(byId("livesPer100kLow").value, livesCentralPer100k);
  const livesHighPer100k = toNumberOrDefault(byId("livesPer100kHigh").value, livesCentralPer100k);
  const vslLow = toNumberOrDefault(byId("vslLowInput").value, vslCentral);
  const vslHigh = toNumberOrDefault(byId("vslHighInput").value, vslCentral);
  const costLow = toNumberOrDefault(byId("totalCostLowInput").value, costCentral);
  const costHigh = toNumberOrDefault(byId("totalCostHighInput").value, costCentral);

  scenario.livesPer100k = {
    central: livesCentralPer100k,
    low: livesLowPer100k,
    high: livesHighPer100k
  };
  scenario.vsl = {
    central: vslCentral,
    low: vslLow,
    high: vslHigh
  };
  scenario.cost = {
    central: costCentral,
    low: costLow,
    high: costHigh
  };

  const supportCentral = clamp(toNumber(byId("predictedSupportInput").value), 0, 100);
  scenario.supportCentral = supportCentral;

  // Simple support range (illustrative ±5 percentage points if uncertainty used)
  const supportSpread = (livesLowPer100k !== livesHighPer100k ||
    vslLow !== vslHigh ||
    costLow !== costHigh) ? 5 : 0;
  scenario.supportLow = clamp(supportCentral - supportSpread, 0, 100);
  scenario.supportHigh = clamp(supportCentral + supportSpread, 0, 100);

  // Equity
  scenario.equityFlag = byId("equityFlagSelect").value || "no";
  scenario.equityNotes = (byId("equityNotesInput").value || "").trim();

  // Totals
  const popFactor = scenario.population / 100000;

  const livesCentral = livesCentralPer100k * popFactor;
  const livesLow = livesLowPer100k * popFactor;
  const livesHigh = livesHighPer100k * popFactor;

  const benefitCentral = livesCentral * vslCentral;
  const benefitLow = livesLow * vslLow;
  const benefitHigh = livesHigh * vslHigh;

  const netCentral = benefitCentral - costCentral;
  const netLow = benefitLow - costLow;
  const netHigh = benefitHigh - costHigh;

  const bcrCentral = costCentral > 0 ? (benefitCentral / costCentral) : null;
  const bcrLow = costLow > 0 ? (benefitLow / costLow) : null;
  const bcrHigh = costHigh > 0 ? (benefitHigh / costHigh) : null;

  scenario.totals = {
    livesCentral,
    livesLow,
    livesHigh,
    benefitCentral,
    benefitLow,
    benefitHigh,
    costCentral,
    costLow,
    costHigh,
    netCentral,
    netLow,
    netHigh,
    bcrCentral,
    bcrLow,
    bcrHigh
  };

  return scenario;
}

/* ------------------------------- Results UI -------------------------------- */

function updateResultsDisplay(scenario) {
  if (!scenario) return;

  const currency = scenario.currencyLabel;

  byId("resLivesCentral").textContent = formatNumber(scenario.totals.livesCentral, 1);
  byId("resBenefitCentral").textContent = formatMoneyWithCurrency(scenario.totals.benefitCentral, currency);
  byId("resCostCentral").textContent = formatMoneyWithCurrency(scenario.totals.costCentral, currency);
  byId("resNetBenefitCentral").textContent = formatMoneyWithCurrency(scenario.totals.netCentral, currency);
  byId("resBcrCentral").textContent = scenario.totals.bcrCentral != null
    ? formatNumber(scenario.totals.bcrCentral, 2)
    : "–";
  byId("resSupportCentral").textContent = scenario.supportCentral ? formatNumber(scenario.supportCentral, 1) + " %" : "–";

  // Uncertainty text
  const hasRange =
    scenario.totals.livesLow !== scenario.totals.livesHigh ||
    scenario.totals.costLow !== scenario.totals.costHigh ||
    scenario.totals.bcrLow !== scenario.totals.bcrHigh;

  if (hasRange) {
    const livesStr = `${formatNumber(scenario.totals.livesLow, 1)} – ${formatNumber(scenario.totals.livesHigh, 1)}`;
    const bcrStr = (scenario.totals.bcrLow != null && scenario.totals.bcrHigh != null)
      ? `${formatNumber(scenario.totals.bcrLow, 2)} – ${formatNumber(scenario.totals.bcrHigh, 2)}`
      : "not defined (cost = 0)";
    const supportRangeStr = `${formatNumber(scenario.supportLow, 1)} – ${formatNumber(scenario.supportHigh, 1)} %`;

    byId("resultsUncertainty").textContent =
      `Under the specified low and high assumptions, total lives saved range from ${livesStr}. ` +
      `The benefit–cost ratio ranges from ${bcrStr}. ` +
      `Predicted public support is approximately ${supportRangeStr}.`;
  } else {
    byId("resultsUncertainty").textContent = "";
  }

  // Reference scenario delta
  const ref = state.savedScenarios.find(s => s.id === state.referenceId);
  if (ref) {
    const dLives = scenario.totals.livesCentral - ref.totals.livesCentral;
    const dSupport = scenario.supportCentral - ref.supportCentral;
    const dBcr = (scenario.totals.bcrCentral || 0) - (ref.totals.bcrCentral || 0);
    const dNet = scenario.totals.netCentral - ref.totals.netCentral;

    const direction = (x) => x > 0 ? "higher" : x < 0 ? "lower" : "the same as";

    const parts = [];
    if (Math.abs(dLives) > 0.01) {
      parts.push(`about ${formatNumber(Math.abs(dLives), 1)} ${dLives > 0 ? "more" : "fewer"} lives saved`);
    }
    if (Math.abs(dSupport) > 0.1) {
      parts.push(`${formatNumber(Math.abs(dSupport), 1)} percentage points ${direction(dSupport)} public support`);
    }
    if (Math.abs(dBcr) > 0.01) {
      parts.push(`a BCR that is ${formatNumber(Math.abs(dBcr), 2)} ${direction(dBcr)}`);
    }
    if (Math.abs(dNet) > 1) {
      parts.push(`${formatMoneyWithCurrency(Math.abs(dNet), currency)} ${dNet > 0 ? "higher" : "lower"} net benefit`);
    }

    if (parts.length) {
      byId("resultsReferenceDelta").textContent =
        `Compared with the reference scenario (“${ref.name}”), this configuration implies ${parts.join(", ")}.`;
    } else {
      byId("resultsReferenceDelta").textContent =
        `This configuration is very similar to the current reference scenario (“${ref.name}”).`;
    }
  } else {
    byId("resultsReferenceDelta").textContent = "";
  }

  // Update radar and pinned cards if current scenario is saved and pinned
  refreshRadarChart();
  renderPinnedCards();
}

/* ------------------------------ Scenario list ------------------------------ */

function bindScenarioButtons() {
  byId("saveScenarioBtn").addEventListener("click", onSaveScenario);
  byId("clearFormBtn").addEventListener("click", clearForm);

  const tbody = byId("scenarioTableBody");
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const scenario = state.savedScenarios.find(s => String(s.id) === String(id));
    if (!scenario) return;

    if (action === "load") {
      loadScenarioToForm(scenario);
    } else if (action === "delete") {
      deleteScenario(id);
    } else if (action === "pin") {
      togglePinned(id);
    } else if (action === "reference") {
      setReferenceScenario(id);
    }
  });
}

function onSaveScenario() {
  const scenarioFromForm = computeScenarioFromInputs();

  if (!scenarioFromForm.name || scenarioFromForm.name === "Scenario") {
    // Auto-name if nothing is provided
    const idx = state.savedScenarios.length + 1;
    scenarioFromForm.name = `Scenario ${idx}`;
    byId("scenarioName").value = scenarioFromForm.name;
  }

  // If currentScenario has an id that exists, update; otherwise add new.
  let existing = null;
  if (state.currentScenario && state.currentScenario.id != null) {
    existing = state.savedScenarios.find(s => s.id === state.currentScenario.id);
  }

  if (existing) {
    scenarioFromForm.id = existing.id;
    const idx = state.savedScenarios.findIndex(s => s.id === existing.id);
    state.savedScenarios[idx] = scenarioFromForm;
  } else {
    scenarioFromForm.id = Date.now();
    state.savedScenarios.push(scenarioFromForm);
  }

  state.currentScenario = scenarioFromForm;
  renderScenarioTable();
  refreshRadarChart();
  renderPinnedCards();
  updateResultsDisplay(scenarioFromForm);
  updateAiPrompt();
}

function clearForm() {
  // Reset inputs to simple defaults rather than reload page.
  byId("scenarioName").value = "";
  byId("countrySelect").value = "Australia";
  byId("outbreakSelect").value = "Mild";
  byId("scopeSelect").value = "High-risk occupations only";
  byId("exemptionsSelect").value = "Medical only";
  byId("coverageInput").value = 70;
  byId("populationInput").value = 1000000;
  byId("horizonInput").value = 1;
  byId("currencyLabel").value = "local currency units";

  byId("livesPer100kCentral").value = 10;
  byId("predictedSupportInput").value = 60;
  byId("vslCentralInput").value = 5000000;
  byId("totalCostCentralInput").value = 10000000;

  ["livesPer100kLow", "livesPer100kHigh",
   "vslLowInput", "vslHighInput",
   "totalCostLowInput", "totalCostHighInput"].forEach(id => {
    byId(id).value = "";
  });

  byId("equityFlagSelect").value = "no";
  byId("equityNotesInput").value = "";

  state.currentScenario = computeScenarioFromInputs();
  updateResultsDisplay(state.currentScenario);
  updateAiPrompt();
}

function loadScenarioToForm(s) {
  byId("scenarioName").value = s.name;
  byId("countrySelect").value = s.country;
  byId("outbreakSelect").value = s.outbreak;
  byId("scopeSelect").value = s.scope;
  byId("exemptionsSelect").value = s.exemptions;
  byId("coverageInput").value = s.coverage;
  byId("populationInput").value = s.population;
  byId("horizonInput").value = s.horizonYears;
  byId("currencyLabel").value = s.currencyLabel;

  byId("livesPer100kCentral").value = s.livesPer100k.central;
  byId("livesPer100kLow").value = s.livesPer100k.low;
  byId("livesPer100kHigh").value = s.livesPer100k.high;

  byId("vslCentralInput").value = s.vsl.central;
  byId("vslLowInput").value = s.vsl.low;
  byId("vslHighInput").value = s.vsl.high;

  byId("totalCostCentralInput").value = s.cost.central;
  byId("totalCostLowInput").value = s.cost.low;
  byId("totalCostHighInput").value = s.cost.high;

  byId("predictedSupportInput").value = s.supportCentral;

  byId("equityFlagSelect").value = s.equityFlag || "no";
  byId("equityNotesInput").value = s.equityNotes || "";

  state.currentScenario = { ...s };
  updateResultsDisplay(state.currentScenario);
  updateAiPrompt();
}

function deleteScenario(id) {
  const numericId = Number(id);
  state.savedScenarios = state.savedScenarios.filter(s => s.id !== numericId);
  state.pinnedIds = state.pinnedIds.filter(x => Number(x) !== numericId);
  if (state.referenceId === numericId) {
    state.referenceId = null;
  }
  renderScenarioTable();
  refreshRadarChart();
  renderPinnedCards();
  updateResultsDisplay(state.currentScenario);
  updateAiPrompt();
}

function renderScenarioTable() {
  const tbody = byId("scenarioTableBody");
  tbody.innerHTML = "";
  const currency = (state.currentScenario && state.currentScenario.currencyLabel) || "local currency units";

  state.savedScenarios.forEach(s => {
    const tr = document.createElement("tr");

    const isRef = state.referenceId === s.id;
    const isPinned = state.pinnedIds.includes(String(s.id));

    tr.innerHTML = `
      <td>
        ${escapeHtml(s.name)}
        ${s.equityFlag === "yes" || s.equityFlag === "unsure" ? '<span class="badge badge-equity" style="margin-left:6px;">Equity</span>' : ""}
      </td>
      <td>${escapeHtml(s.country)}</td>
      <td>${formatNumber(s.supportCentral, 1)}</td>
      <td>${s.totals.bcrCentral != null ? formatNumber(s.totals.bcrCentral, 2) : "–"}</td>
      <td>${formatNumber(s.totals.livesCentral, 1)}</td>
      <td>${formatMoneyWithCurrency(s.totals.costCentral, currency)}</td>
      <td>
        ${isRef ? '<span class="badge badge-ref">Reference</span>' : `<button class="table-btn" data-action="reference" data-id="${s.id}">Set ref</button>`}
      </td>
      <td>
        <button class="table-btn" data-action="pin" data-id="${s.id}">
          ${isPinned ? "Unpin" : "Pin"}
        </button>
      </td>
      <td>
        <button class="table-btn" data-action="load" data-id="${s.id}">Load</button>
      </td>
      <td>
        <button class="table-btn" data-action="delete" data-id="${s.id}">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function togglePinned(id) {
  const strId = String(id);
  const idx = state.pinnedIds.indexOf(strId);
  if (idx === -1) {
    if (state.pinnedIds.length >= 3) {
      window.alert("You can pin at most three scenarios at a time.");
      return;
    }
    state.pinnedIds.push(strId);
  } else {
    state.pinnedIds.splice(idx, 1);
  }
  renderScenarioTable();
  refreshRadarChart();
  renderPinnedCards();
}

function setReferenceScenario(id) {
  state.referenceId = Number(id);
  renderScenarioTable();
  updateResultsDisplay(state.currentScenario);
  updateAiPrompt();
}

/* ------------------------------- Radar chart ------------------------------- */

function initRadarChart() {
  const ctx = document.getElementById("scenarioRadar");
  if (!ctx) return;

  state.radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Support", "BCR", "Lives saved", "Cost (lower is better)"],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 1,
          angleLines: { color: "rgba(148, 163, 184, 0.3)" },
          grid: { color: "rgba(30, 64, 175, 0.4)" },
          pointLabels: { color: "#e5e7eb", font: { size: 11 } }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#e5e7eb", font: { size: 11 } }
        }
      }
    }
  });
}

function refreshRadarChart() {
  const chart = state.radarChart;
  if (!chart) return;

  const pinned = state.savedScenarios.filter(s => state.pinnedIds.includes(String(s.id)));
  if (!pinned.length) {
    chart.data.datasets = [];
    chart.update();
    return;
  }

  // Find maxima for normalisation
  let maxSupport = 0;
  let maxBcr = 0;
  let maxLives = 0;
  let maxCost = 0;

  pinned.forEach(s => {
    maxSupport = Math.max(maxSupport, s.supportCentral);
    maxBcr = Math.max(maxBcr, s.totals.bcrCentral || 0);
    maxLives = Math.max(maxLives, s.totals.livesCentral);
    maxCost = Math.max(maxCost, s.totals.costCentral);
  });

  chart.data.datasets = pinned.map((s, idx) => {
    const supportNorm = maxSupport > 0 ? s.supportCentral / maxSupport : 0;
    const bcrNorm = maxBcr > 0 ? (s.totals.bcrCentral || 0) / maxBcr : 0;
    const livesNorm = maxLives > 0 ? s.totals.livesCentral / maxLives : 0;
    const costNorm = maxCost > 0 ? 1 - (s.totals.costCentral / maxCost) : 0; // lower cost is better

    return {
      label: s.name,
      data: [supportNorm, bcrNorm, livesNorm, costNorm],
      fill: true,
      tension: 0.3
      // Chart.js will auto-assign colours
    };
  });

  chart.update();
}

function renderPinnedCards() {
  const container = byId("pinnedCardsContainer");
  container.innerHTML = "";
  const pinned = state.savedScenarios.filter(s => state.pinnedIds.includes(String(s.id)));
  if (!pinned.length) return;

  pinned.forEach(s => {
    const card = document.createElement("div");
    card.className = "pinned-card";

    const trafficClass = supportTrafficClass(s.supportCentral);
    const traffic = document.createElement("div");
    traffic.className = `traffic-bar ${trafficClass}`;

    const header = document.createElement("div");
    header.className = "pinned-card-header";
    header.innerHTML = `
      <div>
        <div class="pinned-card-name">${escapeHtml(s.name)}</div>
        <div class="pinned-card-country">${escapeHtml(s.country)} • ${escapeHtml(s.outbreak || "")}</div>
      </div>
      <div style="font-size:0.8rem;color:#9ca3af;">
        ${formatNumber(s.supportCentral, 1)} % support
      </div>
    `;

    const metrics = document.createElement("div");
    metrics.className = "pinned-card-metrics";
    const currency = s.currencyLabel || "local currency units";

    metrics.innerHTML = `
      <div>
        <span class="label">BCR</span><br>
        <span>${s.totals.bcrCentral != null ? formatNumber(s.totals.bcrCentral, 2) : "–"}</span>
      </div>
      <div>
        <span class="label">Lives saved</span><br>
        <span>${formatNumber(s.totals.livesCentral, 1)}</span>
      </div>
      <div>
        <span class="label">Cost</span><br>
        <span>${formatMoneyWithCurrency(s.totals.costCentral, currency)}</span>
      </div>
      <div>
        <span class="label">Net benefit</span><br>
        <span>${formatMoneyWithCurrency(s.totals.netCentral, currency)}</span>
      </div>
    `;

    card.appendChild(traffic);
    card.appendChild(header);
    card.appendChild(metrics);
    container.appendChild(card);
  });
}

function supportTrafficClass(support) {
  if (support == null) return "traffic-medium";
  if (support < 50) return "traffic-low";
  if (support < 70) return "traffic-medium";
  return "traffic-high";
}

/* -------------------------- AI briefing prompt ----------------------------- */

function updateAiPrompt() {
  const s = state.currentScenario;
  const promptBox = byId("aiPrompt");
  if (!s) {
    promptBox.value = "";
    return;
  }

  const gMode = state.guidedMode ? guidedText(state.guidedMode) : "";

  const ref = state.savedScenarios.find(x => x.id === state.referenceId) || null;
  const pinned = state.savedScenarios.filter(x => state.pinnedIds.includes(String(x.id)));

  const lines = [];

  lines.push("You are advising a public health policy team on potential future COVID-19 vaccine mandates.");
  if (gMode) {
    lines.push("");
    lines.push("POLICY QUESTION / DECISION FOCUS");
    lines.push(gMode);
  }

  lines.push("");
  lines.push("CURRENT CONFIGURATION (PRIMARY SCENARIO)");
  lines.push(`- Scenario name: ${s.name}`);
  lines.push(`- Country: ${s.country}`);
  lines.push(`- Outbreak scenario: ${s.outbreak}`);
  lines.push(`- Mandate scope: ${s.scope}`);
  lines.push(`- Exemption policy: ${s.exemptions}`);
  lines.push(`- Coverage threshold to lift mandate: ${formatNumber(s.coverage, 1)} %`);
  lines.push(`- Population covered: ${formatNumber(s.population, 0)} people`);
  lines.push(`- Analysis horizon: ${formatNumber(s.horizonYears, 1)} year(s)`);
  lines.push("");
  lines.push(`COST–BENEFIT (central estimates; currency: ${s.currencyLabel})`);
  lines.push(`- Expected lives saved (central): ${formatNumber(s.totals.livesCentral, 1)}`);
  lines.push(`- Monetary benefit of lives saved (central): ${formatMoneyWithCurrency(s.totals.benefitCentral, s.currencyLabel)}`);
  lines.push(`- Total implementation cost (central): ${formatMoneyWithCurrency(s.totals.costCentral, s.currencyLabel)}`);
  lines.push(`- Net benefit (central): ${formatMoneyWithCurrency(s.totals.netCentral, s.currencyLabel)}`);
  lines.push(`- Benefit–cost ratio (central): ${s.totals.bcrCentral != null ? formatNumber(s.totals.bcrCentral, 2) : "not defined (cost = 0)"}`);
  lines.push(`- Predicted public support (central): ${formatNumber(s.supportCentral, 1)} %`);

  const hasRange =
    s.totals.livesLow !== s.totals.livesHigh ||
    s.totals.costLow !== s.totals.costHigh ||
    s.totals.bcrLow !== s.totals.bcrHigh;

  if (hasRange) {
    lines.push("");
    lines.push("UNCERTAINTY RANGES (low / high assumptions)");
    lines.push(`- Lives saved: ${formatNumber(s.totals.livesLow, 1)} – ${formatNumber(s.totals.livesHigh, 1)}`);
    if (s.totals.bcrLow != null && s.totals.bcrHigh != null) {
      lines.push(`- BCR: ${formatNumber(s.totals.bcrLow, 2)} – ${formatNumber(s.totals.bcrHigh, 2)}`);
    } else {
      lines.push("- BCR: not defined (cost = 0 under some assumptions)");
    }
    lines.push(`- Predicted public support (approximate band): ${formatNumber(s.supportLow, 1)} – ${formatNumber(s.supportHigh, 1)} %`);
  }

  lines.push("");
  lines.push("EQUITY AND DISTRIBUTIONAL NOTES");
  lines.push(`- Equity concern flag: ${s.equityFlag}`);
  lines.push(`- Groups / sectors most affected (free-text notes): ${s.equityNotes || "not specified"}`);

  if (ref) {
    lines.push("");
    lines.push("REFERENCE SCENARIO (“CURRENT POLICY”)");
    lines.push(`- Name: ${ref.name}`);
    lines.push(`- Country: ${ref.country}`);
    lines.push(`- Support (central): ${formatNumber(ref.supportCentral, 1)} %`);
    lines.push(`- Lives saved (central): ${formatNumber(ref.totals.livesCentral, 1)}`);
    lines.push(`- BCR (central): ${ref.totals.bcrCentral != null ? formatNumber(ref.totals.bcrCentral, 2) : "not defined"}`);
    lines.push(`- Net benefit (central): ${formatMoneyWithCurrency(ref.totals.netCentral, ref.currencyLabel || s.currencyLabel)}`);
  }

  if (pinned.length > 1) {
    lines.push("");
    lines.push("PINNED SCENARIOS FOR COMPARISON");
    pinned.forEach(p => {
      lines.push(
        `- ${p.name}: country=${p.country}, support=${formatNumber(p.supportCentral, 1)} %, ` +
        `lives=${formatNumber(p.totals.livesCentral, 1)}, BCR=${p.totals.bcrCentral != null ? formatNumber(p.totals.bcrCentral, 2) : "–"}, ` +
        `net benefit=${formatMoneyWithCurrency(p.totals.netCentral, p.currencyLabel || s.currencyLabel)}`
      );
    });
  }

  lines.push("");
  lines.push("YOUR TASK");
  lines.push("1. Provide a short, neutral and clear policy briefing that summarises the main scenario above (and any pinned alternatives).");
  lines.push("2. Highlight trade-offs between public health impact (lives saved), predicted public support and net economic benefits.");
  lines.push("3. Explicitly describe how conclusions might change under the low and high assumptions.");
  lines.push("4. Comment on equity and distributional issues in plain language.");
  lines.push("5. If there is a reference (“current policy”) scenario, explain how the main scenario compares to it.");

  promptBox.value = lines.join("\n");
}

/* ------------------------------- Utilities --------------------------------- */

function toNumber(value) {
  const x = Number(value);
  return Number.isFinite(x) ? x : 0;
}

function toNumberOrDefault(value, fallback) {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
}

function clamp(x, min, max) {
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function formatNumber(value, decimals) {
  if (value == null || !Number.isFinite(value)) return "–";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatMoneyWithCurrency(amount, currencyLabel) {
  const base = formatMoney(amount);
  return `${currencyLabel} ${base}`;
}

function formatMoney(amount) {
  if (amount == null || !Number.isFinite(amount)) return "–";
  const abs = Math.abs(amount);
  if (abs >= 1e9) {
    return (amount / 1e9).toFixed(2) + " B";
  }
  if (abs >= 1e6) {
    return (amount / 1e6).toFixed(2) + " M";
  }
  if (abs >= 1e3) {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
