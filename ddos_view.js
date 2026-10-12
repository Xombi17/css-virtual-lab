/**
 * ddos_view.js - Core client-side logic, visualization, and interaction for Person 3 DDoS Lab.
 *
 * Exposes:
 *   window.DdosView = {
 *     render: function(containerEl, result) { ... },
 *     reset: function(containerEl) { ... }
 *   };
 *
 * Constraints:
 * - Scoped within an IIFE, zero leaked globals except window.DdosView
 * - No frameworks, libraries, or CDNs
 * - Build dynamic DOM with textContent (no innerHTML with dynamic user/API data)
 * - Single requestAnimationFrame loop, cleanly cancelled on reset/re-run
 * - Web Speech API synthesis for Read Aloud with graceful fallback
 */

(function () {
  "use strict";

  // State
  let currentSectionIndex = 0; // 0..7 (Sections 1..8)
  const totalSections = 8;
  let activeCategoryFilter = "all";
  let contentFontSize = 15;
  let animFrameId = null;
  let runCount = 0;
  let lastSimulationResult = null;

  // Cached DOM elements
  let btnTogglePanel;
  let btnReadAloud;
  let readIcon;
  let readText;
  let selectSpeed;
  let selectVoice;
  let btnFontDec;
  let btnFontInc;
  let pageCurrentEl;
  let pageTotalEl;
  let btnPrev;
  let btnNext;
  let contentArea;
  let sections = [];
  let resourceCards = [];
  let tabButtons = [];
  let accordionHeader;
  let accordionChevron;
  let accordionPanel;
  let shareBtn;
  let shareText;

  // Simulation controls
  let scenarioSelect;
  let inputLegit;
  let inputAttackerCount;
  let inputAttackRate;
  let inputCapacity;
  let toggleProtection;
  let inputSourceLimit;
  let protectionLabelText;
  let btnRun;
  let btnReset;
  let alertError;

  // Preset buttons
  let presetNormal;
  let presetDos;
  let presetDdos;
  let presetDdosProtect;

  // Result elements
  let resultsContainer;
  let statusBadge;
  let statusIcon;
  let statusText;
  let resultMessage;
  let metricOffered;
  let metricIncoming;
  let metricAccepted;
  let metricDropped;
  let metricBlocked;
  let metricCpu;
  let metricRam;
  let gaugeCpu;
  let gaugeRam;
  let metricPackets;
  let metricState;

  // Topology Canvas & Chart
  let topoCanvas;
  let topoCtx;
  let chartContainer;
  let chartExplanation;
  let logBody;
  let btnClearLog;

  // Observation Table
  let obsRowBaseline;
  let obsRowDdos;
  let obsRowProtected;
  let btnClearObs;

  // Quiz elements
  let quizContainer;
  let quizScoreBanner;
  let quizScoreEl;
  let btnRetryQuiz;

  // Feedback elements
  let feedbackForm;
  let feedbackSubmit;
  let feedbackComments;
  let feedbackThankYou;

  // Web Speech API state
  let synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let isSpeaking = false;
  let availableVoices = [];

  // Quiz Data (5 MCQs on DDoS and Protection)
  const QUIZ_DATA = [
    {
      id: 1,
      question: "What is the primary architectural difference between a DoS attack and a DDoS attack?",
      options: [
        "DoS uses encryption while DDoS always operates unencrypted.",
        "DoS originates from a single source; DDoS harnesses many distributed sources (a botnet).",
        "DoS targets hardware switches while DDoS only targets operating systems.",
        "DoS results in zero server packet drops compared to DDoS."
      ],
      correctIndex: 1,
      explanation: "A DoS attack originates from a single host, whereas a DDoS attack coordinates hundreds or thousands of distributed endpoints (often a botnet), making simple IP blocklisting ineffective."
    },
    {
      id: 2,
      question: "Why does standard per-source IP rate limiting often fail to protect a server against high-scale DDoS attacks?",
      options: [
        "Botnet nodes completely bypass IP routing rules.",
        "Each distributed bot sends at a low rate below the per-source threshold, but aggregate volume exceeds server capacity.",
        "Rate limiters only process UDP traffic and ignore HTTP/TCP requests.",
        "Rate limiters consume more bandwidth than the attacking botnet."
      ],
      correctIndex: 1,
      explanation: "In distributed botnets, each bot can send at an ordinary rate (e.g., 5 req/s), staying comfortably below per-IP thresholds while their cumulative arrival rate overwhelms server capacity."
    },
    {
      id: 3,
      question: "In this virtual lab's model, if offered aggregate traffic is 220 req/s and server capacity is 100 req/s with no protection, what is the outcome?",
      options: [
        "All 220 req/s are queued indefinitely with zero loss.",
        "100 req/s are accepted, 120 req/s are dropped, and status is Overloaded.",
        "The server instantly scales capacity up to 220 req/s.",
        "120 req/s are accepted and 100 req/s are dropped."
      ],
      correctIndex: 1,
      explanation: "Server capacity is the upper bound on processing. The server services 100 req/s; the excess 120 req/s overflow buffers and are dropped, resulting in an Overloaded state."
    },
    {
      id: 4,
      question: "What primary function does a cloud DDoS Scrubbing Center provide?",
      options: [
        "It forces an immediate hard reboot of the victim server.",
        "It reroutes incoming traffic via BGP to inspect and filter malicious traffic, forwarding only clean traffic to origin.",
        "It converts DDoS attacks into internal single-source DoS attacks.",
        "It replaces all application code with static HTML."
      ],
      correctIndex: 1,
      explanation: "Scrubbing centers divert traffic away from the victim network, use deep inspection to strip volumetric and malicious floods, and return clean traffic to the origin infrastructure."
    },
    {
      id: 5,
      question: "Which layer of the OSI model does an HTTP GET/POST Flood DDoS attack target?",
      options: [
        "Layer 2 (Data Link Layer)",
        "Layer 3 (Network Layer)",
        "Layer 4 (Transport Layer)",
        "Layer 7 (Application Layer)"
      ],
      correctIndex: 3,
      explanation: "HTTP floods target Layer 7 (Application Layer) by generating syntactically valid HTTP requests that exhaust web server processes, memory, and database connections."
    }
  ];

  /**
   * Safe helper to create DOM text node elements without innerHTML
   */
  function createElementWithText(tag, text, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    return el;
  }

  /**
   * Initialize DOM references
   */
  function initDom() {
    btnTogglePanel = document.getElementById("ddv-btn-toggle-panel");
    btnReadAloud = document.getElementById("ddv-btn-read-aloud");
    readIcon = document.getElementById("ddv-read-icon");
    readText = document.getElementById("ddv-read-text");
    selectSpeed = document.getElementById("ddv-select-speed");
    selectVoice = document.getElementById("ddv-select-voice");
    btnFontDec = document.getElementById("ddv-font-dec");
    btnFontInc = document.getElementById("ddv-font-inc");
    pageCurrentEl = document.getElementById("ddv-page-current");
    pageTotalEl = document.getElementById("ddv-page-total");
    btnPrev = document.getElementById("ddv-btn-prev");
    btnNext = document.getElementById("ddv-btn-next");
    contentArea = document.getElementById("ddv-content-area");
    shareBtn = document.getElementById("ddv-share-btn");
    shareText = document.getElementById("ddv-share-text");

    accordionHeader = document.getElementById("ddv-accordion-toggle");
    accordionChevron = document.getElementById("ddv-accordion-chevron");
    accordionPanel = document.getElementById("ddv-accordion");

    sections = Array.from(document.querySelectorAll(".ddv-section"));
    resourceCards = Array.from(document.querySelectorAll(".ddv-resource-card"));
    tabButtons = Array.from(document.querySelectorAll(".ddv-tab-btn"));

    // Simulation controls
    scenarioSelect = document.getElementById("ddv-scenario-select");
    inputLegit = document.getElementById("ddv-input-legitimate");
    inputAttackerCount = document.getElementById("ddv-input-attacker-count");
    inputAttackRate = document.getElementById("ddv-input-attack-rate");
    inputCapacity = document.getElementById("ddv-input-capacity");
    toggleProtection = document.getElementById("ddv-toggle-protection");
    inputSourceLimit = document.getElementById("ddv-input-source-limit");
    protectionLabelText = document.getElementById("ddv-protection-label-text");
    btnRun = document.getElementById("ddv-btn-run");
    btnReset = document.getElementById("ddv-btn-reset");
    alertError = document.getElementById("ddv-alert-error");

    presetNormal = document.getElementById("ddv-preset-normal");
    presetDos = document.getElementById("ddv-preset-dos");
    presetDdos = document.getElementById("ddv-preset-ddos");
    presetDdosProtect = document.getElementById("ddv-preset-ddos-protect");

    // Results
    resultsContainer = document.getElementById("ddv-results-container");
    statusBadge = document.getElementById("ddv-status-badge");
    statusIcon = document.getElementById("ddv-status-icon");
    statusText = document.getElementById("ddv-status-text");
    resultMessage = document.getElementById("ddv-result-message");
    metricOffered = document.getElementById("ddv-metric-offered");
    metricIncoming = document.getElementById("ddv-metric-incoming");
    metricAccepted = document.getElementById("ddv-metric-accepted");
    metricDropped = document.getElementById("ddv-metric-dropped");
    metricBlocked = document.getElementById("ddv-metric-blocked");
    metricCpu = document.getElementById("ddv-metric-cpu");
    metricRam = document.getElementById("ddv-metric-ram");
    gaugeCpu = document.getElementById("ddv-gauge-cpu");
    gaugeRam = document.getElementById("ddv-gauge-ram");
    metricPackets = document.getElementById("ddv-metric-packets");
    metricState = document.getElementById("ddv-metric-state");

    topoCanvas = document.getElementById("ddv-topo-canvas");
    if (topoCanvas) {
      topoCtx = topoCanvas.getContext("2d");
    }
    chartContainer = document.getElementById("ddv-chart-container");
    chartExplanation = document.getElementById("ddv-chart-explanation");
    logBody = document.getElementById("ddv-log-body");
    btnClearLog = document.getElementById("ddv-btn-clear-log");

    // Observation Table
    obsRowBaseline = document.getElementById("ddv-obs-row-baseline");
    obsRowDdos = document.getElementById("ddv-obs-row-ddos");
    obsRowProtected = document.getElementById("ddv-obs-row-protected");
    btnClearObs = document.getElementById("ddv-btn-clear-observations");

    // Quiz
    quizContainer = document.getElementById("ddv-quiz-container");
    quizScoreBanner = document.getElementById("ddv-quiz-score-banner");
    quizScoreEl = document.getElementById("ddv-quiz-score");
    btnRetryQuiz = document.getElementById("ddv-btn-retry-quiz");

    // Feedback
    feedbackForm = document.getElementById("ddv-feedback-form");
    feedbackSubmit = document.getElementById("ddv-feedback-submit");
    feedbackComments = document.getElementById("ddv-feedback-comments");
    feedbackThankYou = document.getElementById("ddv-feedback-thank-you");
  }

  /**
   * Navigation and Section switching
   */
  function showSection(index) {
    if (index < 0 || index >= sections.length) return;
    currentSectionIndex = index;

    // Stop ongoing speech
    stopSpeech();

    // Toggle active section
    sections.forEach((sec, idx) => {
      if (idx === index) {
        sec.classList.add("ddv-active");
      } else {
        sec.classList.remove("ddv-active");
      }
    });

    // Update resource card active styling (pink-red outline and soft fill)
    resourceCards.forEach((card, idx) => {
      if (idx === index) {
        card.classList.add("ddv-card-active");
        card.setAttribute("aria-selected", "true");
      } else {
        card.classList.remove("ddv-card-active");
        card.setAttribute("aria-selected", "false");
      }
    });

    // Update page counter
    if (pageCurrentEl) {
      pageCurrentEl.textContent = String(index + 1);
    }

    // Scroll content area back to top
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }

  function handleFilterTabs(category) {
    activeCategoryFilter = category;
    tabButtons.forEach((btn) => {
      const match = btn.getAttribute("data-filter") === category;
      btn.classList.toggle("ddv-tab-active", match);
      btn.setAttribute("aria-selected", match ? "true" : "false");
    });

    resourceCards.forEach((card) => {
      const cardCat = card.getAttribute("data-category");
      if (category === "all" || cardCat === category || cardCat === "all") {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  /**
   * Web Speech API Read Aloud
   */
  function initSpeechSynthesis() {
    if (!synth) {
      if (btnReadAloud) btnReadAloud.style.display = "none";
      if (selectSpeed) selectSpeed.style.display = "none";
      if (selectVoice) selectVoice.style.display = "none";
      return;
    }

    function populateVoices() {
      try {
        availableVoices = synth.getVoices() || [];
        if (selectVoice) {
          while (selectVoice.firstChild) {
            selectVoice.removeChild(selectVoice.firstChild);
          }
          const defaultOpt = document.createElement("option");
          defaultOpt.value = "";
          defaultOpt.textContent = "Default Voice";
          selectVoice.appendChild(defaultOpt);

          availableVoices.forEach((voice, i) => {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = `${voice.name} (${voice.lang})`;
            selectVoice.appendChild(opt);
          });
        }
      } catch (e) {
        // Voice loading exception fallback
      }
    }

    populateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoices;
    }
  }

  function stopSpeech() {
    if (synth && isSpeaking) {
      synth.cancel();
      isSpeaking = false;
      if (btnReadAloud) {
        btnReadAloud.classList.remove("ddv-btn-speaking");
        btnReadAloud.classList.add("ddv-btn-primary");
      }
      if (readText) readText.textContent = "Read Aloud";
      if (readIcon) readIcon.textContent = "\uD83D\uDD0A";
    }
  }

  function toggleSpeech() {
    if (!synth) return;
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const activeSec = sections[currentSectionIndex];
    if (!activeSec) return;

    const textToRead = activeSec.innerText || activeSec.textContent || "";
    if (!textToRead.trim()) return;

    currentUtterance = new SpeechSynthesisUtterance(textToRead);

    // Apply speed
    if (selectSpeed) {
      currentUtterance.rate = parseFloat(selectSpeed.value) || 1.0;
    }

    // Apply voice
    if (selectVoice && selectVoice.value !== "") {
      const voiceIdx = parseInt(selectVoice.value, 10);
      if (availableVoices[voiceIdx]) {
        currentUtterance.voice = availableVoices[voiceIdx];
      }
    }

    currentUtterance.onend = function () {
      stopSpeech();
    };

    currentUtterance.onerror = function () {
      stopSpeech();
    };

    synth.speak(currentUtterance);
    isSpeaking = true;

    if (btnReadAloud) {
      btnReadAloud.classList.add("ddv-btn-speaking");
      btnReadAloud.classList.remove("ddv-btn-primary");
    }
    if (readText) readText.textContent = "Stop";
    if (readIcon) readIcon.textContent = "\u23F9";
  }

  /**
   * Font size adjustments
   */
  function adjustFontSize(delta) {
    contentFontSize = Math.min(22, Math.max(13, contentFontSize + delta));
    if (contentArea) {
      contentArea.style.fontSize = contentFontSize + "px";
    }
  }

  /**
   * Share Button (Copy Page URL)
   */
  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => showShareCopied(),
        () => fallbackCopy(url)
      );
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const tempInput = document.createElement("input");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand("copy");
      showShareCopied();
    } catch (e) {
      alert("Page URL: " + text);
    }
    document.body.removeChild(tempInput);
  }

  function showShareCopied() {
    if (shareText) {
      shareText.textContent = "Copied!";
      setTimeout(() => {
        if (shareText) shareText.textContent = "Share";
      }, 2000);
    }
  }

  /**
   * Simulation Form Logic and Presets
   */
  function applyPreset(presetType) {
    [presetNormal, presetDos, presetDdos, presetDdosProtect].forEach((p) => {
      if (p) p.classList.remove("ddv-preset-active");
    });

    if (presetType === "normal") {
      if (presetNormal) presetNormal.classList.add("ddv-preset-active");
      if (scenarioSelect) scenarioSelect.value = "normal";
      if (inputLegit) inputLegit.value = "20";
      if (inputAttackerCount) inputAttackerCount.value = "1";
      if (inputAttackRate) inputAttackRate.value = "0";
      if (inputCapacity) inputCapacity.value = "100";
      if (toggleProtection) toggleProtection.checked = false;
      if (inputSourceLimit) inputSourceLimit.value = "10";
    } else if (presetType === "dos") {
      if (presetDos) presetDos.classList.add("ddv-preset-active");
      if (scenarioSelect) scenarioSelect.value = "dos";
      if (inputLegit) inputLegit.value = "20";
      if (inputAttackerCount) inputAttackerCount.value = "1";
      if (inputAttackRate) inputAttackRate.value = "120";
      if (inputCapacity) inputCapacity.value = "100";
      if (toggleProtection) toggleProtection.checked = false;
      if (inputSourceLimit) inputSourceLimit.value = "10";
    } else if (presetType === "ddos") {
      if (presetDdos) presetDdos.classList.add("ddv-preset-active");
      if (scenarioSelect) scenarioSelect.value = "ddos";
      if (inputLegit) inputLegit.value = "20";
      if (inputAttackerCount) inputAttackerCount.value = "5";
      if (inputAttackRate) inputAttackRate.value = "40";
      if (inputCapacity) inputCapacity.value = "100";
      if (toggleProtection) toggleProtection.checked = false;
      if (inputSourceLimit) inputSourceLimit.value = "10";
    } else if (presetType === "ddos-protect") {
      if (presetDdosProtect) presetDdosProtect.classList.add("ddv-preset-active");
      if (scenarioSelect) scenarioSelect.value = "ddos";
      if (inputLegit) inputLegit.value = "20";
      if (inputAttackerCount) inputAttackerCount.value = "5";
      if (inputAttackRate) inputAttackRate.value = "40";
      if (inputCapacity) inputCapacity.value = "100";
      if (toggleProtection) toggleProtection.checked = true;
      if (inputSourceLimit) inputSourceLimit.value = "10";
    }

    updateFormState();
  }

  function updateFormState() {
    const isProt = toggleProtection ? toggleProtection.checked : false;
    const scen = scenarioSelect ? scenarioSelect.value : "ddos";

    if (protectionLabelText) {
      protectionLabelText.textContent = isProt ? "Enabled" : "Disabled";
    }

    if (inputSourceLimit) {
      inputSourceLimit.disabled = !isProt;
    }

    if (inputAttackerCount) {
      if (scen === "dos") {
        inputAttackerCount.value = "1";
        inputAttackerCount.disabled = true;
      } else if (scen === "normal") {
        inputAttackerCount.value = "1";
        inputAttackerCount.disabled = true;
      } else {
        inputAttackerCount.disabled = false;
      }
    }

    if (inputAttackRate && scen === "normal") {
      inputAttackRate.value = "0";
      inputAttackRate.disabled = true;
    } else if (inputAttackRate) {
      inputAttackRate.disabled = false;
    }

    clearErrors();
  }

  function clearErrors() {
    if (alertError) {
      alertError.textContent = "";
      alertError.classList.remove("ddv-visible");
    }
    const errEls = document.querySelectorAll(".ddv-error-msg");
    errEls.forEach((el) => (el.textContent = ""));
    const inputEls = document.querySelectorAll(".ddv-input");
    inputEls.forEach((el) => el.classList.remove("ddv-input-error"));
  }

  function showInlineError(fieldId, errorId, msg) {
    const field = document.getElementById(fieldId);
    const errSpan = document.getElementById(errorId);
    if (field) field.classList.add("ddv-input-error");
    if (errSpan) errSpan.textContent = msg;
  }

  function validateInputs() {
    clearErrors();
    let isValid = true;

    const legitVal = parseInt(inputLegit.value, 10);
    if (isNaN(legitVal) || legitVal < 0) {
      showInlineError("ddv-input-legitimate", "ddv-err-legitimate", "Must be non-negative integer (>= 0).");
      isValid = false;
    }

    const countVal = parseInt(inputAttackerCount.value, 10);
    if (isNaN(countVal) || countVal < 1) {
      showInlineError("ddv-input-attacker-count", "ddv-err-attacker-count", "Must be at least 1 node.");
      isValid = false;
    }

    const rateVal = parseInt(inputAttackRate.value, 10);
    if (isNaN(rateVal) || rateVal < 0) {
      showInlineError("ddv-input-attack-rate", "ddv-err-attack-rate", "Must be non-negative integer (>= 0).");
      isValid = false;
    }

    const capVal = parseInt(inputCapacity.value, 10);
    if (isNaN(capVal) || capVal <= 0) {
      showInlineError("ddv-input-capacity", "ddv-err-capacity", "Must be a positive integer (> 0).");
      isValid = false;
    }

    if (toggleProtection && toggleProtection.checked) {
      const limitVal = parseInt(inputSourceLimit.value, 10);
      if (isNaN(limitVal) || limitVal < 0) {
        showInlineError("ddv-input-source-limit", "ddv-err-source-limit", "Must be non-negative integer (>= 0).");
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Run Simulation (POST to /api/simulate)
   */
  function runSimulation() {
    if (!validateInputs()) return;

    const payload = {
      scenario: scenarioSelect.value,
      legitimate_rate: parseInt(inputLegit.value, 10),
      attacker_count: parseInt(inputAttackerCount.value, 10),
      attack_rate_per_source: parseInt(inputAttackRate.value, 10),
      capacity: parseInt(inputCapacity.value, 10),
      protection_enabled: toggleProtection.checked,
      per_source_limit: toggleProtection.checked ? parseInt(inputSourceLimit.value, 10) : null
    };

    if (btnRun) {
      btnRun.disabled = true;
      btnRun.textContent = "Simulating...";
    }

    fetch("/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(
            (errData) => {
              throw new Error(errData.error || `HTTP Error ${res.status}`);
            },
            () => {
              throw new Error(`HTTP Error ${res.status}`);
            }
          );
        }
        return res.json();
      })
      .then((data) => {
        lastSimulationResult = data;
        window.DdosView.render(resultsContainer, data);
        updateObservationTable(data);
        appendActivityLog(payload, data);
        startTopologyAnimation(data);
        renderBarChart(data);
      })
      .catch((err) => {
        if (alertError) {
          alertError.textContent =
            "Backend not reachable: " + err.message + ". Please verify dev_ddos_server.py or app.py is running.";
          alertError.classList.add("ddv-visible");
        }
      })
      .finally(() => {
        if (btnRun) {
          btnRun.disabled = false;
          btnRun.textContent = "Run Simulation";
        }
      });
  }

  /**
   * Update Observation Table
   */
  function updateObservationTable(res) {
    let targetRow = null;
    if (res.attack_incoming === 0 || res.scenario === "normal") {
      targetRow = obsRowBaseline;
    } else if (res.protection_enabled) {
      targetRow = obsRowProtected;
    } else {
      targetRow = obsRowDdos;
    }

    if (!targetRow) return;

    const setCol = (cls, text) => {
      const el = targetRow.querySelector("." + cls);
      if (el) el.textContent = String(text);
    };

    setCol("obs-in", res.incoming);
    setCol("obs-acc", res.accepted);
    setCol("obs-drop", res.dropped);
    setCol("obs-block", res.blocked);
    setCol("obs-cpu", res.cpu_percent + "%");
    setCol("obs-ram", res.ram_percent + "%");
    setCol("obs-pps", res.packets_per_sec);
    setCol("obs-state", res.service_state);
  }

  function clearObservationTable() {
    [obsRowBaseline, obsRowDdos, obsRowProtected].forEach((row) => {
      if (row) {
        row.querySelectorAll("td:not(:first-child)").forEach((td) => {
          td.textContent = "-";
        });
      }
    });
  }

  /**
   * Append Activity Log
   */
  function appendActivityLog(req, res) {
    if (!logBody) return;

    runCount++;
    const firstRow = logBody.querySelector("tr");
    if (firstRow && firstRow.querySelector("td[colspan]")) {
      logBody.removeChild(firstRow);
    }

    const tr = document.createElement("tr");

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const tdTime = createElementWithText("td", `#${runCount} (${timeStr})`);
    const tdScenario = createElementWithText(
      "td",
      res.protection_enabled ? `${req.scenario} (Protected)` : req.scenario
    );
    const tdOffered = createElementWithText("td", String(res.offered_total));
    const tdIncoming = createElementWithText("td", String(res.incoming));
    const tdAccepted = createElementWithText("td", String(res.accepted));
    const tdDropped = createElementWithText("td", String(res.dropped));
    const tdBlocked = createElementWithText("td", String(res.blocked));

    const tdStatus = document.createElement("td");
    const statusSpan = createElementWithText("span", res.status, "ddv-status-badge");
    if (res.status === "Overloaded") {
      statusSpan.classList.add("ddv-status-overloaded");
    } else if (res.status === "At Capacity") {
      statusSpan.classList.add("ddv-status-capacity");
    } else {
      statusSpan.classList.add("ddv-status-normal");
    }
    tdStatus.appendChild(statusSpan);

    tr.appendChild(tdTime);
    tr.appendChild(tdScenario);
    tr.appendChild(tdOffered);
    tr.appendChild(tdIncoming);
    tr.appendChild(tdAccepted);
    tr.appendChild(tdDropped);
    tr.appendChild(tdBlocked);
    tr.appendChild(tdStatus);

    logBody.insertBefore(tr, logBody.firstChild);
  }

  function clearActivityLog() {
    if (!logBody) return;
    while (logBody.firstChild) {
      logBody.removeChild(logBody.firstChild);
    }
    const tr = document.createElement("tr");
    const td = createElementWithText("td", "No simulation runs yet.");
    td.setAttribute("colspan", "8");
    td.style.textAlign = "center";
    td.style.color = "var(--ddv-text-muted)";
    tr.appendChild(td);
    logBody.appendChild(tr);
    runCount = 0;
  }

  /**
   * Bar Chart Breakdown (Pure DOM / SVG)
   */
  function renderBarChart(data) {
    if (!chartContainer) return;
    while (chartContainer.firstChild) {
      chartContainer.removeChild(chartContainer.firstChild);
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "150");
    svg.setAttribute("viewBox", "0 0 600 150");

    const maxVal = Math.max(data.offered_total, data.capacity, 1);
    const chartHeight = 100;
    const barWidth = 70;
    const startX = 60;
    const gap = 110;

    const bars = [
      { label: "Offered", val: data.offered_total, color: "#9e6b55" },
      { label: "Accepted", val: data.accepted, color: "#15803d" },
      { label: "Dropped", val: data.dropped, color: "#b91c1c" },
      { label: "Blocked", val: data.blocked, color: "#b45309" }
    ];

    // Background horizontal baseline
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "30");
    line.setAttribute("y1", "110");
    line.setAttribute("x2", "560");
    line.setAttribute("y2", "110");
    line.setAttribute("stroke", "#e2e8f0");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);

    bars.forEach((b, i) => {
      const h = Math.round((b.val / maxVal) * chartHeight);
      const x = startX + i * gap;
      const y = 110 - h;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(Math.max(2, h)));
      rect.setAttribute("fill", b.color);
      rect.setAttribute("rx", "4");
      svg.appendChild(rect);

      // Value label on top
      const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valText.setAttribute("x", String(x + barWidth / 2));
      valText.setAttribute("y", String(y - 5));
      valText.setAttribute("text-anchor", "middle");
      valText.setAttribute("font-size", "12");
      valText.setAttribute("font-weight", "bold");
      valText.setAttribute("fill", "#2d231e");
      valText.textContent = `${b.val} req/s`;
      svg.appendChild(valText);

      // Category label below baseline
      const catText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      catText.setAttribute("x", String(x + barWidth / 2));
      catText.setAttribute("y", "130");
      catText.setAttribute("text-anchor", "middle");
      catText.setAttribute("font-size", "12");
      catText.setAttribute("fill", "#705f56");
      catText.textContent = b.label;
      svg.appendChild(catText);
    });

    chartContainer.appendChild(svg);

    if (chartExplanation) {
      if (data.dropped > 0) {
        chartExplanation.textContent = `Server capacity (${data.capacity} req/s) exceeded! ${data.dropped} req/s dropped at the server buffer.`;
      } else if (data.status === "At Capacity") {
        chartExplanation.textContent = `Server operating exactly at 100% capacity (${data.capacity} req/s) with 0 drops.`;
      } else {
        chartExplanation.textContent = `Traffic within server processing limits (${data.incoming} of ${data.capacity} req/s utilized).`;
      }
    }
  }

  /**
   * Topology & Live Packet Flow Canvas Simulation
   */
  let particles = [];

  function stopTopologyAnimation() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function startTopologyAnimation(simData) {
    stopTopologyAnimation();
    if (!topoCanvas || !topoCtx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Canvas geometry
    const W = topoCanvas.width;
    const H = topoCanvas.height;

    // Topology node positions
    const legitNode = { x: 80, y: 50, label: "Legit Client (192.0.2.10)" };
    const botCount = Math.min(12, simData.attacker_count || 5);
    const firewallBox = { x: 420, y: 70, w: 100, h: 100 };
    const serverBox = { x: 720, y: 70, w: 120, h: 100 };

    particles = [];

    if (prefersReducedMotion) {
      // Draw static frame and return
      drawTopologyFrame(W, H, legitNode, botCount, firewallBox, serverBox, simData, []);
      return;
    }

    let lastSpawn = performance.now();

    function loop(now) {
      // Spawn packet particles periodically
      if (now - lastSpawn > 80) {
        lastSpawn = now;

        // Spawn legitimate packet
        if (simData.legitimate_incoming > 0) {
          particles.push({
            x: legitNode.x,
            y: legitNode.y,
            type: "legit",
            speed: 3.5,
            state: "in_flight_to_fw",
            targetY: firewallBox.y + firewallBox.h / 2 + (Math.random() * 40 - 20)
          });
        }

        // Spawn bot attack packets
        if (simData.attack_incoming > 0) {
          const spawnCount = Math.min(4, Math.max(1, Math.round(botCount / 3)));
          for (let i = 0; i < spawnCount; i++) {
            const botY = 110 + (i % botCount) * (90 / Math.max(1, botCount));
            particles.push({
              x: legitNode.x,
              y: botY,
              type: "attack",
              speed: 3.8 + Math.random() * 0.8,
              state: "in_flight_to_fw",
              targetY: firewallBox.y + firewallBox.h / 2 + (Math.random() * 40 - 20),
              willBeBlocked: simData.blocked > 0 && Math.random() < simData.blocked / simData.offered_total,
              willBeDropped: simData.dropped > 0 && Math.random() < simData.dropped / Math.max(1, simData.incoming)
            });
          }
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speed;

        // Approaching firewall
        if (p.state === "in_flight_to_fw" && p.x >= firewallBox.x) {
          if (p.willBeBlocked) {
            p.state = "blocked";
            p.fade = 1.0;
          } else {
            p.state = "in_flight_to_server";
            p.targetY = serverBox.y + serverBox.h / 2 + (Math.random() * 40 - 20);
          }
        }

        // Approaching server
        if (p.state === "in_flight_to_server" && p.x >= serverBox.x) {
          if (p.willBeDropped) {
            p.state = "dropped";
            p.vy = 2.5;
            p.fade = 1.0;
          } else {
            p.state = "accepted";
            p.fade = 1.0;
          }
        }

        // Fading blocked or dropped particles
        if (p.state === "blocked" || p.state === "accepted") {
          p.fade = (p.fade || 1.0) - 0.08;
          if (p.fade <= 0) particles.splice(i, 1);
        } else if (p.state === "dropped") {
          p.y += p.vy || 2;
          p.fade = (p.fade || 1.0) - 0.05;
          if (p.fade <= 0) particles.splice(i, 1);
        } else if (p.x > W + 20) {
          particles.splice(i, 1);
        }
      }

      // Render frame
      drawTopologyFrame(W, H, legitNode, botCount, firewallBox, serverBox, simData, particles);
      animFrameId = requestAnimationFrame(loop);
    }

    animFrameId = requestAnimationFrame(loop);
  }

  function drawTopologyFrame(W, H, legitNode, botCount, fwBox, srvBox, simData, pList) {
    topoCtx.clearRect(0, 0, W, H);

    // Subtle background grid
    topoCtx.strokeStyle = "#f8f1ec";
    topoCtx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      topoCtx.beginPath();
      topoCtx.moveTo(x, 0);
      topoCtx.lineTo(x, H);
      topoCtx.stroke();
    }

    // 1. Draw Network Links
    topoCtx.strokeStyle = "#e8d5cc";
    topoCtx.lineWidth = 1.5;

    // Link: Legit -> Firewall
    topoCtx.beginPath();
    topoCtx.moveTo(legitNode.x + 12, legitNode.y);
    topoCtx.lineTo(fwBox.x, fwBox.y + fwBox.h / 2);
    topoCtx.stroke();

    // Link: Bots -> Firewall
    for (let b = 0; b < botCount; b++) {
      const by = 110 + b * (90 / Math.max(1, botCount));
      topoCtx.beginPath();
      topoCtx.moveTo(legitNode.x + 12, by);
      topoCtx.lineTo(fwBox.x, fwBox.y + fwBox.h / 2);
      topoCtx.stroke();
    }

    // Link: Firewall -> Server
    topoCtx.beginPath();
    topoCtx.moveTo(fwBox.x + fwBox.w, fwBox.y + fwBox.h / 2);
    topoCtx.lineTo(srvBox.x, srvBox.y + srvBox.h / 2);
    topoCtx.stroke();

    // 2. Draw Legitimate Node
    topoCtx.fillStyle = "#15803d";
    topoCtx.beginPath();
    topoCtx.arc(legitNode.x, legitNode.y, 10, 0, Math.PI * 2);
    topoCtx.fill();
    topoCtx.fillStyle = "#2d231e";
    topoCtx.font = "bold 11px sans-serif";
    topoCtx.fillText("Legitimate Client", legitNode.x - 40, legitNode.y - 14);
    topoCtx.font = "10px sans-serif";
    topoCtx.fillStyle = "#705f56";
    topoCtx.fillText("192.0.2.10 (" + simData.legitimate_incoming + " req/s)", legitNode.x - 40, legitNode.y + 24);

    // 3. Draw Attacker Botnet Cluster
    topoCtx.fillStyle = "#b91c1c";
    for (let b = 0; b < botCount; b++) {
      const by = 110 + b * (90 / Math.max(1, botCount));
      topoCtx.beginPath();
      topoCtx.arc(legitNode.x, by, 7, 0, Math.PI * 2);
      topoCtx.fill();
    }
    topoCtx.fillStyle = "#b91c1c";
    topoCtx.font = "bold 11px sans-serif";
    topoCtx.fillText(
      `Attacker Botnet (${simData.attacker_count} nodes)`,
      legitNode.x - 45,
      215
    );
    topoCtx.font = "10px sans-serif";
    topoCtx.fillStyle = "#705f56";
    topoCtx.fillText(
      `Rate: ${simData.attack_incoming} req/s`,
      legitNode.x - 45,
      228
    );

    // 4. Draw Firewall / Rate Limiter Box
    topoCtx.fillStyle = simData.protection_enabled ? "#fffbeb" : "#f1f5f9";
    topoCtx.strokeStyle = simData.protection_enabled ? "#d97706" : "#cbd5e1";
    topoCtx.lineWidth = 2;
    topoCtx.beginPath();
    topoCtx.roundRect(fwBox.x, fwBox.y, fwBox.w, fwBox.h, 8);
    topoCtx.fill();
    topoCtx.stroke();

    topoCtx.fillStyle = "#1e293b";
    topoCtx.font = "bold 12px sans-serif";
    topoCtx.fillText("Rate Limiter", fwBox.x + 14, fwBox.y + 25);

    topoCtx.font = "10px sans-serif";
    if (simData.protection_enabled) {
      topoCtx.fillStyle = "#b45309";
      topoCtx.fillText("SHIELD ACTIVE", fwBox.x + 12, fwBox.y + 44);
      topoCtx.fillText(`Limit: ${simData.per_source_limit}/src`, fwBox.x + 12, fwBox.y + 60);
      topoCtx.fillStyle = "#b91c1c";
      topoCtx.fillText(`Blocked: ${simData.blocked} req/s`, fwBox.x + 12, fwBox.y + 80);
    } else {
      topoCtx.fillStyle = "#64748b";
      topoCtx.fillText("DISABLED", fwBox.x + 18, fwBox.y + 48);
      topoCtx.fillText("(Bypassed)", fwBox.x + 18, fwBox.y + 68);
    }

    // 5. Draw Victim Server Box
    const isOverloaded = simData.status === "Overloaded";
    topoCtx.fillStyle = isOverloaded ? "#fef2f2" : "#f0fdf4";
    topoCtx.strokeStyle = isOverloaded ? "#b91c1c" : "#15803d";
    topoCtx.lineWidth = 2;
    topoCtx.beginPath();
    topoCtx.roundRect(srvBox.x, srvBox.y, srvBox.w, srvBox.h, 8);
    topoCtx.fill();
    topoCtx.stroke();

    topoCtx.fillStyle = "#1e293b";
    topoCtx.font = "bold 12px sans-serif";
    topoCtx.fillText("Victim Server", srvBox.x + 20, srvBox.y + 24);

    // Capacity Gauge Bar inside Server
    const gaugeW = 90;
    const gaugeH = 10;
    const gaugeX = srvBox.x + 15;
    const gaugeY = srvBox.y + 36;
    const utilRatio = Math.min(1.0, simData.incoming / simData.capacity);

    topoCtx.fillStyle = "#e2e8f0";
    topoCtx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

    topoCtx.fillStyle = isOverloaded ? "#b91c1c" : utilRatio >= 1.0 ? "#d97706" : "#15803d";
    topoCtx.fillRect(gaugeX, gaugeY, gaugeW * utilRatio, gaugeH);

    topoCtx.font = "10px sans-serif";
    topoCtx.fillStyle = "#334155";
    topoCtx.fillText(`Cap: ${simData.capacity} req/s`, srvBox.x + 15, srvBox.y + 62);
    topoCtx.fillText(`Accepted: ${simData.accepted} req/s`, srvBox.x + 15, srvBox.y + 76);

    if (simData.dropped > 0) {
      topoCtx.fillStyle = "#b91c1c";
      topoCtx.font = "bold 10px sans-serif";
      topoCtx.fillText(`Drops: ${simData.dropped} req/s!`, srvBox.x + 15, srvBox.y + 90);
    }

    // 6. Draw Animated Particles
    pList.forEach((p) => {
      topoCtx.save();
      topoCtx.globalAlpha = p.fade !== undefined ? p.fade : 1.0;
      topoCtx.fillStyle = p.type === "legit" ? "#15803d" : "#b91c1c";
      topoCtx.beginPath();
      topoCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      topoCtx.fill();

      if (p.state === "blocked") {
        topoCtx.fillStyle = "#b45309";
        topoCtx.font = "bold 9px sans-serif";
        topoCtx.fillText("BLOCKED", p.x - 15, p.y - 6);
      } else if (p.state === "dropped") {
        topoCtx.fillStyle = "#b91c1c";
        topoCtx.font = "bold 9px sans-serif";
        topoCtx.fillText("DROPPED", p.x - 15, p.y - 6);
      }
      topoCtx.restore();
    });
  }

  /**
   * Quiz Initialization & Interaction
   */
  let userAnswers = {};

  function initQuiz() {
    if (!quizContainer) return;
    while (quizContainer.firstChild) {
      quizContainer.removeChild(quizContainer.firstChild);
    }
    userAnswers = {};
    if (quizScoreBanner) quizScoreBanner.style.display = "none";

    QUIZ_DATA.forEach((q, qIndex) => {
      const qWrap = document.createElement("div");
      qWrap.className = "ddv-quiz-question";

      const title = createElementWithText(
        "div",
        `Question ${qIndex + 1}: ${q.question}`,
        "ddv-quiz-title"
      );
      qWrap.appendChild(title);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "ddv-quiz-options";

      const explanationBox = createElementWithText("div", q.explanation, "ddv-quiz-explanation");
      explanationBox.id = `ddv-quiz-exp-${q.id}`;

      q.options.forEach((optText, optIndex) => {
        const optBtn = createElementWithText(
          "div",
          `${String.fromCharCode(65 + optIndex)}) ${optText}`,
          "ddv-quiz-option"
        );
        optBtn.setAttribute("role", "button");
        optBtn.setAttribute("tabindex", "0");

        optBtn.addEventListener("click", () => {
          if (userAnswers[q.id] !== undefined) return; // Answered already
          userAnswers[q.id] = optIndex;

          const isCorrect = optIndex === q.correctIndex;
          if (isCorrect) {
            optBtn.classList.add("ddv-correct");
          } else {
            optBtn.classList.add("ddv-incorrect");
            // Highlight correct one
            const correctOpt = optionsWrap.children[q.correctIndex];
            if (correctOpt) correctOpt.classList.add("ddv-correct");
          }

          explanationBox.style.display = "block";
          explanationBox.style.backgroundColor = isCorrect ? "var(--ddv-ok-bg)" : "var(--ddv-warn-bg)";
          explanationBox.style.color = isCorrect ? "var(--ddv-ok)" : "var(--ddv-warn)";

          checkQuizCompletion();
        });

        optionsWrap.appendChild(optBtn);
      });

      qWrap.appendChild(optionsWrap);
      qWrap.appendChild(explanationBox);
      quizContainer.appendChild(qWrap);
    });
  }

  function checkQuizCompletion() {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === QUIZ_DATA.length) {
      let score = 0;
      QUIZ_DATA.forEach((q) => {
        if (userAnswers[q.id] === q.correctIndex) score++;
      });
      if (quizScoreBanner && quizScoreEl) {
        quizScoreEl.textContent = String(score);
        quizScoreBanner.style.display = "block";
      }
    }
  }

  /**
   * Feedback form submission
   */
  function initFeedback() {
    if (!feedbackSubmit) return;
    feedbackSubmit.addEventListener("click", (e) => {
      e.preventDefault();
      if (feedbackThankYou) {
        feedbackThankYou.style.display = "block";
      }
      if (feedbackSubmit) {
        feedbackSubmit.disabled = true;
      }
      if (feedbackComments) {
        feedbackComments.disabled = true;
      }
    });
  }

  /**
   * Wire up event listeners
   */
  function wireEvents() {
    // Top back button
    const backBtn = document.getElementById("ddv-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", (e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      });
    }

    // Share button
    if (shareBtn) {
      shareBtn.addEventListener("click", handleShare);
    }

    // Toggle resource panel on small screens
    if (btnTogglePanel) {
      btnTogglePanel.addEventListener("click", () => {
        const aside = document.getElementById("ddv-resource-panel");
        if (aside) {
          if (aside.style.display === "none" || aside.style.display === "") {
            aside.style.display = "flex";
          } else {
            aside.style.display = "none";
          }
        }
      });
    }

    // Speech controls
    if (btnReadAloud) {
      btnReadAloud.addEventListener("click", toggleSpeech);
    }
    if (selectSpeed) {
      selectSpeed.addEventListener("change", () => {
        if (isSpeaking) {
          stopSpeech();
          toggleSpeech();
        }
      });
    }

    // Font scaling
    if (btnFontDec) {
      btnFontDec.addEventListener("click", () => adjustFontSize(-1));
    }
    if (btnFontInc) {
      btnFontInc.addEventListener("click", () => adjustFontSize(1));
    }

    // Next / Prev buttons
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        if (currentSectionIndex > 0) showSection(currentSectionIndex - 1);
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (currentSectionIndex < totalSections - 1) showSection(currentSectionIndex + 1);
      });
    }

    // Resource Cards click & enter key
    resourceCards.forEach((card, index) => {
      card.addEventListener("click", () => showSection(index));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showSection(index);
        }
      });
    });

    // Filter tab buttons
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-filter");
        handleFilterTabs(cat);
      });
    });

    // Accordion toggle
    if (accordionHeader && accordionPanel) {
      accordionHeader.addEventListener("click", () => {
        accordionPanel.classList.toggle("ddv-collapsed");
      });
    }

    // Preset buttons
    if (presetNormal) presetNormal.addEventListener("click", () => applyPreset("normal"));
    if (presetDos) presetDos.addEventListener("click", () => applyPreset("dos"));
    if (presetDdos) presetDdos.addEventListener("click", () => applyPreset("ddos"));
    if (presetDdosProtect) presetDdosProtect.addEventListener("click", () => applyPreset("ddos-protect"));

    // Scenario select change
    if (scenarioSelect) {
      scenarioSelect.addEventListener("change", updateFormState);
    }

    // Protection toggle change
    if (toggleProtection) {
      toggleProtection.addEventListener("change", updateFormState);
    }

    // Action buttons
    if (btnRun) {
      btnRun.addEventListener("click", runSimulation);
    }
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        window.DdosView.reset(resultsContainer);
      });
    }

    // Table & Log clear buttons
    if (btnClearObs) {
      btnClearObs.addEventListener("click", clearObservationTable);
    }
    if (btnClearLog) {
      btnClearLog.addEventListener("click", clearActivityLog);
    }
    if (btnRetryQuiz) {
      btnRetryQuiz.addEventListener("click", initQuiz);
    }

    // Form inputs change/input: clear inline errors
    [inputLegit, inputAttackerCount, inputAttackRate, inputCapacity, inputSourceLimit].forEach((inp) => {
      if (inp) {
        inp.addEventListener("input", clearErrors);
      }
    });
  }

  // =========================================================================
  // PUBLIC API: window.DdosView
  // =========================================================================

  window.DdosView = {
    /**
     * Render returned simulation result dict into the given container
     */
    render: function (containerEl, res) {
      if (!res) return;

      // Status Badge
      if (statusBadge && statusText) {
        statusBadge.className = "ddv-status-badge";
        if (res.status === "Overloaded") {
          statusBadge.classList.add("ddv-status-overloaded");
          statusText.textContent = "Overloaded";
          if (statusIcon) statusIcon.textContent = "\u26A0";
        } else if (res.status === "At Capacity") {
          statusBadge.classList.add("ddv-status-capacity");
          statusText.textContent = "At Capacity";
          if (statusIcon) statusIcon.textContent = "\u25CF";
        } else {
          statusBadge.classList.add("ddv-status-normal");
          statusText.textContent = "Normal";
          if (statusIcon) statusIcon.textContent = "\u2714";
        }
      }

      // Educational Message
      if (resultMessage) {
        resultMessage.textContent = res.message || "";
      }

      // Quantitative Metrics
      if (metricOffered) metricOffered.textContent = String(res.offered_total);
      if (metricIncoming) metricIncoming.textContent = String(res.incoming);
      if (metricAccepted) metricAccepted.textContent = String(res.accepted);
      if (metricDropped) metricDropped.textContent = String(res.dropped);
      if (metricBlocked) metricBlocked.textContent = String(res.blocked);

      // Illustrative Monitor Strip
      if (metricCpu) metricCpu.textContent = res.cpu_percent + "%";
      if (metricRam) metricRam.textContent = res.ram_percent + "%";
      if (gaugeCpu) gaugeCpu.style.width = Math.min(100, res.cpu_percent) + "%";
      if (gaugeRam) gaugeRam.style.width = Math.min(100, res.ram_percent) + "%";
      if (metricPackets) metricPackets.textContent = String(res.packets_per_sec);
      if (metricState) {
        metricState.textContent = res.service_state;
        if (res.service_state === "Unresponsive") {
          metricState.style.color = "var(--ddv-bad)";
        } else if (res.service_state === "Slow") {
          metricState.style.color = "var(--ddv-warn)";
        } else {
          metricState.style.color = "var(--ddv-ok)";
        }
      }
    },

    /**
     * Reset simulation results, controls, and stop canvas animation
     */
    reset: function (containerEl) {
      stopTopologyAnimation();
      stopSpeech();
      clearErrors();

      // Reset to DDoS default
      applyPreset("ddos");

      // Reset results display
      if (statusBadge && statusText) {
        statusBadge.className = "ddv-status-badge ddv-status-normal";
        statusText.textContent = "Normal";
        if (statusIcon) statusIcon.textContent = "\u25CF";
      }

      if (resultMessage) {
        resultMessage.textContent = 'Click "Run Simulation" to model traffic arrival rates against server capacity.';
      }

      if (metricOffered) metricOffered.textContent = "0";
      if (metricIncoming) metricIncoming.textContent = "0";
      if (metricAccepted) metricAccepted.textContent = "0";
      if (metricDropped) metricDropped.textContent = "0";
      if (metricBlocked) metricBlocked.textContent = "0";

      if (metricCpu) metricCpu.textContent = "2.0%";
      if (metricRam) metricRam.textContent = "20.0%";
      if (gaugeCpu) gaugeCpu.style.width = "2%";
      if (gaugeRam) gaugeRam.style.width = "20%";
      if (metricPackets) metricPackets.textContent = "0";
      if (metricState) {
        metricState.textContent = "Responsive";
        metricState.style.color = "var(--ddv-ok)";
      }

      if (topoCtx && topoCanvas) {
        topoCtx.clearRect(0, 0, topoCanvas.width, topoCanvas.height);
      }

      if (chartContainer) {
        while (chartContainer.firstChild) {
          chartContainer.removeChild(chartContainer.firstChild);
        }
      }
      if (chartExplanation) {
        chartExplanation.textContent = "";
      }
    }
  };

  // Auto-init when document ready
  document.addEventListener("DOMContentLoaded", () => {
    initDom();
    wireEvents();
    initSpeechSynthesis();
    initQuiz();
    initFeedback();
    applyPreset("ddos");
    showSection(0);
  });
})();
