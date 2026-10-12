/**
 * monitoring.js - DoS Simulation & Monitoring Client Logic
 *
 * Features:
 * - API integration with POST /api/simulate-dos
 * - Reusable renderDosResults(result, withoutAttackResult)
 * - Dual synchronized controls: Range Sliders + Number Inputs
 * - Real-time Network Topology & Packet Stream Canvas Simulation
 * - Rate Limiting Shield Defense toggle & mitigation modeling
 * - Extended metrics: Response Latency (ms) & Service Availability (%)
 * - Pure local SVG charts (Current breakdown & Scenario comparison)
 * - Scenario preset controls and client-side validation
 */

(function () {
  "use strict";

  // Cache DOM elements
  const inputLegitimate = document.getElementById("input-legitimate");
  const inputAttack = document.getElementById("input-attack");
  const inputCapacity = document.getElementById("input-capacity");

  const sliderLegitimate = document.getElementById("slider-legitimate");
  const sliderAttack = document.getElementById("slider-attack");
  const sliderCapacity = document.getElementById("slider-capacity");

  const btnRun = document.getElementById("btn-run-simulation");
  const btnReset = document.getElementById("btn-reset-simulation");
  const btnBack = document.getElementById("btn-back");

  const btnScenarioNormal = document.getElementById("scenario-normal");
  const btnScenarioAtCapacity = document.getElementById("scenario-capacity");
  const btnScenarioOverloaded = document.getElementById("scenario-overloaded");

  const toggleDefense = document.getElementById("toggle-defense");
  const btnToggleStream = document.getElementById("btn-toggle-stream");
  const streamIcon = document.getElementById("stream-icon");
  const streamText = document.getElementById("stream-text");

  const alertError = document.getElementById("alert-error");
  const statusBadge = document.getElementById("status-badge");
  const statusText = document.getElementById("status-text");

  const metricIncoming = document.getElementById("metric-incoming");
  const metricAccepted = document.getElementById("metric-accepted");
  const metricDropped = document.getElementById("metric-dropped");
  const metricCapacity = document.getElementById("metric-capacity");
  const metricUtilization = document.getElementById("metric-utilization");
  const metricDropPercent = document.getElementById("metric-drop-percent");
  const metricLatency = document.getElementById("metric-latency");
  const metricAvailability = document.getElementById("metric-availability");

  const explanationText = document.getElementById("explanation-text");
  const currentChartContainer = document.getElementById("current-chart-container");
  const comparisonChartContainer = document.getElementById("comparison-chart-container");

  // Topology elements
  const topologyStatusTag = document.getElementById("topology-status-tag");
  const topoLegitVal = document.getElementById("topo-legit-val");
  const topoAttackVal = document.getElementById("topo-attack-val");
  const topoShieldVal = document.getElementById("topo-shield-val");
  const topoBufferVal = document.getElementById("topo-buffer-val");
  const topoCanvas = document.getElementById("topology-canvas");

  /**
   * Show or hide error alert
   */
  function showError(msg) {
    if (!alertError) return;
    if (msg) {
      alertError.textContent = msg;
      alertError.classList.add("visible");
    } else {
      alertError.textContent = "";
      alertError.classList.remove("visible");
    }
  }

  /**
   * Set loading state on action buttons
   */
  function setLoading(isLoading) {
    if (btnRun) {
      btnRun.disabled = isLoading;
      btnRun.textContent = isLoading ? "Simulating..." : "Run Simulation";
    }
    if (btnReset) {
      btnReset.disabled = isLoading;
    }
  }

  /**
   * Highlight active scenario button
   */
  function setActiveScenario(activeBtn) {
    [btnScenarioNormal, btnScenarioAtCapacity, btnScenarioOverloaded].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  /**
   * Validate raw input strings and sync sliders
   */
  function parseAndValidateInputs() {
    const rawLegitimate = inputLegitimate.value.trim();
    const rawAttack = inputAttack.value.trim();
    const rawCapacity = inputCapacity.value.trim();

    if (!rawLegitimate || !rawAttack || !rawCapacity) {
      throw new Error("All traffic and capacity fields are required.");
    }

    const intRegex = /^-?\d+$/;
    if (!intRegex.test(rawLegitimate) || !intRegex.test(rawAttack) || !intRegex.test(rawCapacity)) {
      throw new Error("All inputs must be whole integers (no decimals or non-numeric characters).");
    }

    const legitimate = Number(rawLegitimate);
    const rawAttackNum = Number(rawAttack);
    const capacity = Number(rawCapacity);

    if (legitimate < 0) {
      throw new Error("Legitimate traffic rate must be a non-negative integer (>= 0).");
    }
    if (rawAttackNum < 0) {
      throw new Error("Attack traffic rate must be a non-negative integer (>= 0).");
    }
    if (capacity <= 0) {
      throw new Error("Server capacity must be a positive integer (> 0).");
    }

    // Apply Rate Limiting defense if enabled
    const defenseActive = toggleDefense && toggleDefense.checked;
    let effectiveAttack = rawAttackNum;
    if (defenseActive && rawAttackNum > 40) {
      effectiveAttack = Math.min(40, Math.floor(capacity * 0.4));
    }

    // Sync sliders
    if (sliderLegitimate) sliderLegitimate.value = Math.min(200, legitimate);
    if (sliderAttack) sliderAttack.value = Math.min(300, rawAttackNum);
    if (sliderCapacity) sliderCapacity.value = Math.min(250, capacity);

    return { legitimate, attack: effectiveAttack, rawAttack: rawAttackNum, capacity, defenseActive };
  }

  /**
   * Call backend simulation API with offline/file:// client-side fallback
   */
  async function callSimulateApi(legitimateRate, attackRate, capacity) {
    try {
      const response = await fetch("/api/simulate-dos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legitimate_rate: legitimateRate,
          attack_rate: attackRate,
          capacity: capacity,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error (${response.status})`);
    } catch (err) {
      // Fallback mathematical model calculation
      const incoming = legitimateRate + attackRate;
      const accepted = Math.min(incoming, capacity);
      const dropped = incoming - accepted;
      const utilization_percent = Number(((accepted / capacity) * 100).toFixed(2));
      const drop_percent = incoming > 0 ? Number(((dropped / incoming) * 100).toFixed(2)) : 0.0;
      return {
        incoming,
        accepted,
        dropped,
        capacity,
        utilization_percent,
        drop_percent,
        status: dropped > 0 ? "Overloaded" : "Normal",
        excess_requests: dropped,
        legitimate_rate: legitimateRate,
        attack_rate: attackRate,
      };
    }
  }

  /**
   * Current simulation state for Canvas & visualizers
   */
  const simState = {
    legitimate: 40,
    attack: 100,
    rawAttack: 100,
    capacity: 100,
    accepted: 100,
    dropped: 40,
    utilization: 100,
    dropPercent: 28.57,
    status: "Overloaded",
    defenseActive: false,
    latency: 1450,
    availability: 71.4,
  };

  /**
   * Generate SVG Bar Chart: Current Simulation Breakdown
   */
  function renderCurrentChart(result) {
    if (!currentChartContainer) return;
    currentChartContainer.innerHTML = "";

    const width = 500;
    const height = 260;
    const pad = { top: 30, right: 25, bottom: 50, left: 60 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const data = [
      { label: "Incoming", value: result.incoming, color: "#9e6b55" },
      { label: "Accepted", value: result.accepted, color: "#15803d" },
      { label: "Dropped", value: result.dropped, color: "#b91c1c" },
      { label: "Capacity", value: result.capacity, color: "#52657e" },
    ];

    let maxVal = Math.max(result.incoming, result.capacity, 10);
    const step = maxVal > 100 ? 50 : maxVal > 40 ? 20 : 10;
    maxVal = Math.ceil(maxVal / step) * step;

    const numTicks = 4;
    let gridLinesSvg = "";
    for (let i = 0; i <= numTicks; i++) {
      const tickVal = Math.round((maxVal / numTicks) * i);
      const y = pad.top + chartH - (tickVal / maxVal) * chartH;
      gridLinesSvg += `
        <line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" class="svg-grid-line" />
        <text x="${pad.left - 8}" y="${y + 4}" class="svg-axis-text" text-anchor="end">${tickVal} req/s</text>
      `;
    }

    const slotW = chartW / data.length;
    const barW = Math.min(54, slotW - 20);

    let barsSvg = "";
    data.forEach((item, idx) => {
      const barH = (item.value / maxVal) * chartH;
      const x = pad.left + idx * slotW + (slotW - barW) / 2;
      const y = pad.top + chartH - barH;

      barsSvg += `
        <g class="chart-bar-group">
          <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${item.color}">
            <title>${item.label}: ${item.value} req/s</title>
          </rect>
          <text x="${x + barW / 2}" y="${Math.max(y - 7, pad.top - 5)}" class="svg-bar-text">${item.value} req/s</text>
          <text x="${x + barW / 2}" y="${pad.top + chartH + 20}" class="svg-label-text">${item.label}</text>
        </g>
      `;
    });

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Current simulation traffic breakdown">
        ${gridLinesSvg}
        <line x1="${pad.left}" y1="${pad.top + chartH}" x2="${pad.left + chartW}" y2="${pad.top + chartH}" class="svg-axis-line" />
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + chartH}" class="svg-axis-line" />
        ${barsSvg}
      </svg>
    `;

    currentChartContainer.innerHTML = svg;
  }

  /**
   * Generate SVG Comparison Chart: Without Attack vs With Attack
   */
  function renderComparisonChart(withAttack, withoutAttack) {
    if (!comparisonChartContainer) return;
    comparisonChartContainer.innerHTML = "";

    const width = 540;
    const height = 260;
    const pad = { top: 30, right: 25, bottom: 55, left: 60 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    let maxVal = Math.max(
      withAttack.incoming,
      withAttack.capacity,
      withoutAttack.incoming,
      withoutAttack.capacity,
      10
    );
    const step = maxVal > 100 ? 50 : maxVal > 40 ? 20 : 10;
    maxVal = Math.ceil(maxVal / step) * step;

    const numTicks = 4;
    let gridLinesSvg = "";
    for (let i = 0; i <= numTicks; i++) {
      const tickVal = Math.round((maxVal / numTicks) * i);
      const y = pad.top + chartH - (tickVal / maxVal) * chartH;
      gridLinesSvg += `
        <line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" class="svg-grid-line" />
        <text x="${pad.left - 8}" y="${y + 4}" class="svg-axis-text" text-anchor="end">${tickVal} req/s</text>
      `;
    }

    const groups = [
      {
        title: "Without Attack",
        subtitle: `Attack: 0 req/s • ${withoutAttack.status}`,
        status: withoutAttack.status,
        bars: [
          { label: "Incoming", value: withoutAttack.incoming, color: "#9e6b55" },
          { label: "Accepted", value: withoutAttack.accepted, color: "#15803d" },
          { label: "Dropped", value: withoutAttack.dropped, color: "#b91c1c" },
        ],
      },
      {
        title: "With Attack",
        subtitle: `Attack: ${withAttack.attack_rate} req/s • ${withAttack.status}`,
        status: withAttack.status,
        bars: [
          { label: "Incoming", value: withAttack.incoming, color: "#9e6b55" },
          { label: "Accepted", value: withAttack.accepted, color: "#15803d" },
          { label: "Dropped", value: withAttack.dropped, color: "#b91c1c" },
        ],
      },
    ];

    const groupW = chartW / groups.length;
    const barW = 32;
    const barGap = 6;
    const totalBarsW = 3 * barW + 2 * barGap;

    let groupsSvg = "";
    groups.forEach((group, gIdx) => {
      const groupCenterX = pad.left + gIdx * groupW + groupW / 2;
      const groupStartX = groupCenterX - totalBarsW / 2;

      let groupBarsSvg = "";
      group.bars.forEach((bar, bIdx) => {
        const barH = (bar.value / maxVal) * chartH;
        const x = groupStartX + bIdx * (barW + barGap);
        const y = pad.top + chartH - barH;

        groupBarsSvg += `
          <g class="chart-comparison-bar">
            <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${bar.color}">
              <title>${group.title} - ${bar.label}: ${bar.value} req/s</title>
            </rect>
            <text x="${x + barW / 2}" y="${Math.max(y - 6, pad.top - 5)}" class="svg-bar-text" style="font-size: 10px;">${bar.value}</text>
          </g>
        `;
      });

      const statusColor = group.status === "Overloaded" ? "#b91c1c" : "#15803d";
      groupsSvg += `
        <g class="scenario-group">
          ${groupBarsSvg}
          <text x="${groupCenterX}" y="${pad.top + chartH + 20}" class="svg-label-text" style="font-weight: 600;">${group.title}</text>
          <text x="${groupCenterX}" y="${pad.top + chartH + 36}" class="svg-sub-text" style="fill: ${statusColor}; font-weight: 600;">${group.subtitle}</text>
        </g>
      `;
    });

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Scenario comparison chart">
        ${gridLinesSvg}
        <line x1="${pad.left}" y1="${pad.top + chartH}" x2="${pad.left + chartW}" y2="${pad.top + chartH}" class="svg-axis-line" />
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + chartH}" class="svg-axis-line" />
        ${groupsSvg}
      </svg>
    `;

    comparisonChartContainer.innerHTML = svg;
  }

  /**
   * Reusable function to render DoS simulation results into the DOM
   * Exposed globally as window.renderDosResults
   */
  function renderDosResults(result, withoutAttackResult) {
    if (!result) return;

    // Compute latency & availability models
    let latency = 18;
    let availability = 100.0;

    if (result.dropped === 0) {
      latency = Math.max(14, Math.round(15 + (result.utilization_percent / 100) * 35));
      availability = 100.0;
    } else {
      latency = Math.min(3800, Math.round(70 + (result.dropped / result.capacity) * 1150));
      availability = Number((100 - result.drop_percent).toFixed(1));
    }

    // Save into simState for topology renderer
    simState.legitimate = result.legitimate_rate !== undefined ? result.legitimate_rate : Number(inputLegitimate.value);
    simState.attack = result.attack_rate !== undefined ? result.attack_rate : Number(inputAttack.value);
    simState.rawAttack = Number(inputAttack.value);
    simState.capacity = result.capacity;
    simState.accepted = result.accepted;
    simState.dropped = result.dropped;
    simState.utilization = result.utilization_percent;
    simState.dropPercent = result.drop_percent;
    simState.status = result.status;
    simState.defenseActive = toggleDefense ? toggleDefense.checked : false;
    simState.latency = latency;
    simState.availability = availability;

    // Update Status Badge
    if (statusBadge && statusText) {
      statusBadge.classList.remove("status-normal", "status-overloaded");
      if (result.status === "Overloaded") {
        statusBadge.classList.add("status-overloaded");
        statusText.textContent = "Overloaded";
      } else {
        statusBadge.classList.add("status-normal");
        statusText.textContent = "Normal";
      }
    }

    // Update Metric Cards
    if (metricIncoming) metricIncoming.textContent = result.incoming;
    if (metricAccepted) metricAccepted.textContent = result.accepted;
    if (metricDropped) metricDropped.textContent = result.dropped;
    if (metricCapacity) metricCapacity.textContent = result.capacity;
    if (metricUtilization) metricUtilization.textContent = `${result.utilization_percent}%`;
    if (metricDropPercent) metricDropPercent.textContent = `${result.drop_percent}%`;

    if (metricLatency) {
      metricLatency.textContent = latency >= 1000 ? latency.toLocaleString() : latency;
    }
    if (metricAvailability) {
      metricAvailability.textContent = `${availability}%`;
    }

    // Dynamic educational explanation
    if (explanationText) {
      let exp = "";
      if (simState.defenseActive && simState.rawAttack > simState.attack) {
        exp = `Rate Limiter Defense Active: Attacker was throttled from ${simState.rawAttack} down to ${simState.attack} req/s. Total incoming traffic is now ${result.incoming} req/s. Server capacity holds stable!`;
      } else if (result.dropped > 0) {
        exp = `${result.incoming} requests arrive per second. The server can accept ${result.accepted}, so ${result.dropped} are dropped (${result.drop_percent}% packet loss).`;
      } else if (result.accepted === result.capacity) {
        exp = "The server is operating at exactly 100% capacity. Throughput is saturated but zero packets are dropped.";
      } else {
        exp = `${result.incoming} requests arrive per second. The server has headroom for ${result.capacity}, processing all ${result.accepted} requests without drops.`;
      }
      explanationText.textContent = exp;
    }

    // Update Topology Legend Tags
    if (topoLegitVal) topoLegitVal.textContent = simState.legitimate;
    if (topoAttackVal) topoAttackVal.textContent = simState.rawAttack;
    if (topoShieldVal) {
      topoShieldVal.textContent = simState.defenseActive
        ? `ACTIVE (${simState.attack} req/s limit)`
        : "DISABLED";
    }
    if (topoBufferVal) {
      topoBufferVal.textContent = `${result.utilization_percent}% (${result.dropped} dropped)`;
    }

    if (topologyStatusTag) {
      if (simState.defenseActive) {
        topologyStatusTag.className = "topology-tag tag-shielded";
        topologyStatusTag.textContent = "Rate Limiter Active";
      } else if (result.status === "Overloaded") {
        topologyStatusTag.className = "topology-tag tag-overloaded";
        topologyStatusTag.textContent = "System Overloaded";
      } else {
        topologyStatusTag.className = "topology-tag tag-normal";
        topologyStatusTag.textContent = "Traffic Stable";
      }
    }

    // Render SVG Charts
    renderCurrentChart(result);

    if (withoutAttackResult) {
      renderComparisonChart(result, withoutAttackResult);
    }
  }

  /**
   * Run simulation pipeline
   */
  async function runSimulation() {
    showError(null);
    let params;
    try {
      params = parseAndValidateInputs();
    } catch (err) {
      showError(err.message);
      return;
    }

    setLoading(true);
    try {
      const [currentResult, baselineResult] = await Promise.all([
        callSimulateApi(params.legitimate, params.attack, params.capacity),
        callSimulateApi(params.legitimate, 0, params.capacity),
      ]);

      renderDosResults(currentResult, baselineResult);
    } catch (err) {
      showError(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Reset simulation inputs
   */
  function resetSimulation() {
    showError(null);
    if (toggleDefense) toggleDefense.checked = false;
    inputLegitimate.value = 40;
    inputAttack.value = 100;
    inputCapacity.value = 100;
    if (sliderLegitimate) sliderLegitimate.value = 40;
    if (sliderAttack) sliderAttack.value = 100;
    if (sliderCapacity) sliderCapacity.value = 100;
    setActiveScenario(btnScenarioOverloaded);
    runSimulation();
  }

  /**
   * Setup preset scenario handlers
   */
  function setupPresets() {
    if (btnScenarioNormal) {
      btnScenarioNormal.addEventListener("click", () => {
        showError(null);
        if (toggleDefense) toggleDefense.checked = false;
        inputLegitimate.value = 40;
        inputAttack.value = 0;
        inputCapacity.value = 100;
        setActiveScenario(btnScenarioNormal);
        runSimulation();
      });
    }

    if (btnScenarioAtCapacity) {
      btnScenarioAtCapacity.addEventListener("click", () => {
        showError(null);
        if (toggleDefense) toggleDefense.checked = false;
        inputLegitimate.value = 40;
        inputAttack.value = 60;
        inputCapacity.value = 100;
        setActiveScenario(btnScenarioAtCapacity);
        runSimulation();
      });
    }

    if (btnScenarioOverloaded) {
      btnScenarioOverloaded.addEventListener("click", () => {
        showError(null);
        if (toggleDefense) toggleDefense.checked = false;
        inputLegitimate.value = 40;
        inputAttack.value = 100;
        inputCapacity.value = 100;
        setActiveScenario(btnScenarioOverloaded);
        runSimulation();
      });
    }
  }

  /* ==========================================================================
     INTERACTIVE CANVAS NETWORK TOPOLOGY & PACKET FLOW SIMULATOR
     ========================================================================== */
  let streamActive = true;
  let particles = [];
  let animFrameId = null;

  class Packet {
    constructor(type, startX, startY, targetX, targetY) {
      this.type = type; // "legit" or "attack"
      this.x = startX;
      this.y = startY;
      this.startX = startX;
      this.startY = startY;
      this.targetX = targetX;
      this.targetY = targetY;
      this.progress = 0;
      this.speed = 0.012 + Math.random() * 0.008;
      this.size = type === "attack" ? 4.5 : 4.0;
      this.color = type === "attack" ? "#b91c1c" : "#15803d";
      this.blocked = false;
      this.deflected = false;
      this.vy = 0;
      this.opacity = 1.0;
    }

    update(shieldX, shieldActive) {
      if (this.deflected) {
        this.x += 1.2;
        this.y += this.vy;
        this.vy += 0.15;
        this.opacity -= 0.025;
        return this.opacity > 0;
      }

      this.progress += this.speed;

      // Check Rate Limiting Shield intersection
      if (this.type === "attack" && shieldActive && !this.blocked) {
        const curX = this.startX + (this.targetX - this.startX) * this.progress;
        if (curX >= shieldX - 5 && curX <= shieldX + 15) {
          // Attacker packet blocked by firewall
          this.deflected = true;
          this.vy = (Math.random() - 0.5) * 4;
          this.color = "#d97706";
          return true;
        }
      }

      // Check server arrival
      if (this.progress >= 1) {
        if (simState.dropped > 0 && Math.random() < simState.dropPercent / 100) {
          // Packet dropped at server overflow
          this.deflected = true;
          this.vy = 2.5 + Math.random() * 2;
          this.color = "#b91c1c";
          return true;
        }
        return false; // Packet handled safely
      }

      this.x = this.startX + (this.targetX - this.startX) * this.progress;
      this.y = this.startY + (this.targetY - this.startY) * this.progress;
      return true;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initTopologyCanvas() {
    if (!topoCanvas) return;
    const ctx = topoCanvas.getContext("2d");
    if (!ctx) return;

    let lastSpawn = 0;

    function renderTopology(time) {
      if (!streamActive) {
        animFrameId = requestAnimationFrame(renderTopology);
        return;
      }

      const w = topoCanvas.width;
      const h = topoCanvas.height;

      ctx.clearRect(0, 0, w, h);

      // Node coordinates
      const legitNode = { x: 130, y: 65 };
      const attackNode = { x: 130, y: 165 };
      const shieldNode = { x: w * 0.48, y: 115 };
      const serverNode = { x: w - 170, y: 115 };

      // 1. Draw Network Connections
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e4d5ca";

      // Path from Legit node to Server
      ctx.beginPath();
      ctx.moveTo(legitNode.x, legitNode.y);
      ctx.lineTo(shieldNode.x, legitNode.y);
      ctx.lineTo(serverNode.x, serverNode.y - 12);
      ctx.stroke();

      // Path from Attack node to Server
      ctx.beginPath();
      ctx.moveTo(attackNode.x, attackNode.y);
      ctx.lineTo(shieldNode.x, attackNode.y);
      ctx.lineTo(serverNode.x, serverNode.y + 12);
      ctx.stroke();

      // 2. Spawn packet particles
      if (time - lastSpawn > 80) {
        lastSpawn = time;

        // Spawn legitimate packet proportional to rate
        if (simState.legitimate > 0 && Math.random() < Math.min(1, simState.legitimate / 40)) {
          particles.push(new Packet("legit", legitNode.x + 20, legitNode.y, serverNode.x - 20, serverNode.y - 12));
        }

        // Spawn attacker packets proportional to rate
        const attackRate = simState.defenseActive ? simState.attack : simState.rawAttack;
        if (attackRate > 0 && Math.random() < Math.min(1, attackRate / 30)) {
          particles.push(new Packet("attack", attackNode.x + 20, attackNode.y, serverNode.x - 20, serverNode.y + 12));
        }
      }

      // 3. Update & Draw Particles
      particles = particles.filter((p) => {
        const alive = p.update(shieldNode.x, simState.defenseActive);
        if (alive) p.draw(ctx);
        return alive;
      });

      // 4. Draw Legitimate Clients Node
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(21, 128, 61, 0.2)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(legitNode.x, legitNode.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#15803d";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CLIENTS", legitNode.x, legitNode.y - 32);
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillText(`${simState.legitimate} req/s`, legitNode.x, legitNode.y + 5);
      ctx.restore();

      // 5. Draw Attacker Node
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(185, 28, 28, 0.2)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(attackNode.x, attackNode.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#b91c1c";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ATTACKER", attackNode.x, attackNode.y + 42);
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillText(`${simState.rawAttack} req/s`, attackNode.x, attackNode.y + 5);
      ctx.restore();

      // 6. Draw Rate Limiter Shield Barrier
      ctx.save();
      const shieldActive = simState.defenseActive;
      ctx.strokeStyle = shieldActive ? "#d97706" : "#cbd5e1";
      ctx.lineWidth = shieldActive ? 4 : 2;
      ctx.setLineDash(shieldActive ? [] : [4, 4]);

      ctx.beginPath();
      ctx.moveTo(shieldNode.x, 30);
      ctx.lineTo(shieldNode.x, 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shield badge
      ctx.fillStyle = shieldActive ? "#fef3c7" : "#f1f5f9";
      ctx.strokeStyle = shieldActive ? "#d97706" : "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(shieldNode.x - 48, 98, 96, 32, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = shieldActive ? "#b45309" : "#64748b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(shieldActive ? "SHIELD: ON" : "SHIELD: OFF", shieldNode.x, 118);
      ctx.restore();

      // 7. Draw Target Server Core & Buffer
      ctx.save();
      const sW = 120;
      const sH = 95;
      const sX = serverNode.x - sW / 2;
      const sY = serverNode.y - sH / 2;

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = simState.status === "Overloaded" ? "#b91c1c" : "#9e6b55";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(158, 107, 85, 0.25)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(sX, sY, sW, sH, 12);
      ctx.fill();
      ctx.stroke();

      // Server Header text
      ctx.fillStyle = "#2d231e";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TARGET SERVER", serverNode.x, sY + 22);

      // Server buffer bar
      const barW = 90;
      const barH = 12;
      const barX = serverNode.x - barW / 2;
      const barY = sY + 36;

      ctx.fillStyle = "#eee4dc";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.fill();

      // Fill ratio
      const fillW = Math.min(barW, Math.round((simState.utilization / 100) * barW));
      ctx.fillStyle = simState.status === "Overloaded" ? "#b91c1c" : "#15803d";
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 4);
      ctx.fill();

      // Buffer percentage
      ctx.fillStyle = "#705f56";
      ctx.font = "600 10px Inter, sans-serif";
      ctx.fillText(`Buffer: ${simState.utilization}%`, serverNode.x, sY + 66);

      // Dropped traffic badge if overloaded
      if (simState.dropped > 0) {
        ctx.fillStyle = "#b91c1c";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText(`DROP: ${simState.dropped} req/s`, serverNode.x, sY + 82);
      } else {
        ctx.fillStyle = "#15803d";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("Zero Drops", serverNode.x, sY + 82);
      }

      ctx.restore();

      animFrameId = requestAnimationFrame(renderTopology);
    }

    animFrameId = requestAnimationFrame(renderTopology);
  }

  /**
   * Wire up event listeners
   */
  function init() {
    if (btnRun) {
      btnRun.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveScenario(null);
        runSimulation();
      });
    }

    if (btnReset) {
      btnReset.addEventListener("click", (e) => {
        e.preventDefault();
        resetSimulation();
      });
    }

    if (btnBack) {
      btnBack.addEventListener("click", () => {
        resetSimulation();
      });
    }

    // Rate Limiting Defense Switch
    if (toggleDefense) {
      toggleDefense.addEventListener("change", () => {
        runSimulation();
      });
    }

    // Stream play/pause toggle
    if (btnToggleStream) {
      btnToggleStream.addEventListener("click", () => {
        streamActive = !streamActive;
        btnToggleStream.classList.toggle("active", streamActive);
        if (streamIcon) streamIcon.textContent = streamActive ? "\u275A\u275A" : "\u25B6";
        if (streamText) streamText.textContent = streamActive ? "Live Flow" : "Paused";
      });
    }

    // Synchronize Dual Sliders & Number inputs
    const pairs = [
      { input: inputLegitimate, slider: sliderLegitimate },
      { input: inputAttack, slider: sliderAttack },
      { input: inputCapacity, slider: sliderCapacity },
    ];

    pairs.forEach(({ input, slider }) => {
      if (input && slider) {
        slider.addEventListener("input", () => {
          input.value = slider.value;
          setActiveScenario(null);
          showError(null);
          runSimulation();
        });

        input.addEventListener("input", () => {
          slider.value = input.value;
          setActiveScenario(null);
          showError(null);
        });

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            runSimulation();
          }
        });
      }
    });

    setupPresets();
    initTopologyCanvas();

    // Run initial simulation
    resetSimulation();
  }

  // Expose reusable renderDosResults for external tests
  window.renderDosResults = renderDosResults;
  window.simulateDos = callSimulateApi;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
