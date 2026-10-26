"use strict";

const $ = (id) => document.getElementById(id);

// ==========================================
// 1. RESOURCE NAVIGATION
// ==========================================

const resources = [
    { id: "aim", title: "Aim & Objectives", type: "all", icon: "▤" },
    { id: "theory", title: "Theory - DoS and DDoS", type: "all", icon: "▤" },
    { id: "procedure", title: "Procedure - Traffic Simulation", type: "all", icon: "▤" },
    { id: "simulation", title: "Interactive Traffic Simulation", type: "interactive", icon: "▣" },
    { id: "video-normal", title: "Video 1: Normal Traffic", type: "video", icon: "▶" },
    { id: "video-dos", title: "Video 2: DoS Attack", type: "video", icon: "▶" },
    { id: "video-ddos", title: "Video 3: DDoS & Mitigation", type: "video", icon: "▶" },
    { id: "assessment", title: "Assessment - Quiz", type: "interactive", icon: "✓" },
    { id: "feedback", title: "Feedback & References", type: "all", icon: "▤" }
];

let currentIndex = 0;
let selectedScenario = "normal";
let selectedTab = "all";

function showResource(id) {
    const index = resources.findIndex((resource) => resource.id === id);

    if (index < 0) return;

    currentIndex = index;

    // Pause any playing videos when switching lessons
    document.querySelectorAll("video").forEach((v) => {
        if (!v.paused) {
            v.pause();
        }
    });

    document.querySelectorAll(".lesson").forEach((lesson) => {
        lesson.classList.toggle("active", lesson.id === id);
    });

    document.querySelectorAll(".resource-item").forEach((button) => {
        const active = button.dataset.resource === id;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    const pageNumber = $("pageNumber");

    if (pageNumber) {
        pageNumber.textContent = `${currentIndex + 1} / ${resources.length}`;
    }

    if (window.innerWidth <= 850 && $("lessonContent")) {
        $("lessonContent").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    document.dispatchEvent(
        new CustomEvent("lessonShown", { detail: { id } })
    );

    if (typeof markSectionVisited === "function") {
        markSectionVisited(id);
    }
}
window.showResource = showResource;

function renderResources() {
    const list = $("resourceList");

    if (!list) return;

    list.replaceChildren();

    const visibleResources = resources.filter((resource) => {
        if (selectedTab === "all") return true;

        if (selectedTab === "interactive") {
            return (
                resource.type === "interactive" ||
                resource.id === "feedback"
            );
        }

        return resource.type === selectedTab;
    });

    if (visibleResources.length === 0) {
        const empty = document.createElement("p");
        empty.className = "resource-note";
        empty.textContent =
            "No video resources have been supplied for this experiment yet.";

        list.appendChild(empty);
        return;
    }

    visibleResources.forEach((resource) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "resource-item";
        button.dataset.resource = resource.id;

        const icon = document.createElement("span");
        icon.className = "resource-icon";
        icon.textContent = resource.icon;

        const title = document.createElement("span");
        title.textContent = resource.title;

        button.append(icon, title);

        button.addEventListener("click", () => {
            showResource(resource.id);
        });

        list.appendChild(button);
    });

    // Keep the currently selected lesson visible if possible.
    const stillVisible = visibleResources.some(
        (resource) => resource.id === resources[currentIndex].id
    );

    if (stillVisible) {
        showResource(resources[currentIndex].id);
    } else {
        showResource(visibleResources[0].id);
    }
}

// Resource tabs
document.querySelectorAll(".resource-tab").forEach((button) => {
    button.addEventListener("click", () => {
        selectedTab = button.dataset.tab;

        document.querySelectorAll(".resource-tab").forEach((tab) => {
            const active = tab === button;

            tab.classList.toggle("active", active);
            tab.setAttribute("aria-pressed", String(active));
        });

        renderResources();
    });

    button.setAttribute(
        "aria-pressed",
        String(button.dataset.tab === selectedTab)
    );
});

// Previous and next navigation
if ($("prevButton")) {
    $("prevButton").addEventListener("click", () => {
        const index =
            (currentIndex - 1 + resources.length) % resources.length;

        showResource(resources[index].id);
    });
}

if ($("nextButton")) {
    $("nextButton").addEventListener("click", () => {
        const index = (currentIndex + 1) % resources.length;

        showResource(resources[index].id);
    });
}

if ($("menuButton")) {
    $("menuButton").addEventListener("click", () => {
        document.body.classList.toggle("menu-collapsed");
    });
}

if ($("backButton")) {
    $("backButton").addEventListener("click", () => {
        showResource("aim");
    });
}

// Share button
if ($("shareButton")) {
    $("shareButton").addEventListener("click", async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: document.title,
                    text: "DoS and DDoS Virtual Lab"
                });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(
                    window.location.href
                );

                if ($("message")) {
                    $("message").textContent = "Page link copied.";
                }
            } else {
                if ($("message")) {
                    $("message").textContent =
                        "Copy the page address from your browser to share this experiment.";
                }
            }
        } catch (error) {
            if (error.name !== "AbortError" && $("message")) {
                $("message").textContent =
                    "Sharing was not available.";
            }
        }
    });
}

// ==========================================
// 2. LIVE TRAFFIC SIMULATION
//    One shared state object (`sim`) drives the animated scene, counters,
//    gauges, bars, chart, explanation and event log so they always agree.
//    Educational model only: no real network traffic is generated.
// ==========================================

const DEFAULT_INPUTS = {
    legitimateRate: 20,
    capacity: 100,
    dosRate: 120,
    attackerCount: 5,
    ratePerSource: 40,
    perSourceLimit: 10
};

const INPUT_RULES = {
    legitimateRate: { label: "Legitimate traffic", min: 0, max: 100000 },
    capacity: { label: "Server capacity", min: 1, max: 100000 },
    dosRate: { label: "DoS attack rate", min: 0, max: 100000 },
    attackerCount: { label: "DDoS attacker count", min: 0, max: 1000 },
    ratePerSource: { label: "Rate per attacker", min: 0, max: 100000 },
    perSourceLimit: { label: "Per-attacker limit", min: 0, max: 100000 }
};

const SCENARIO_NAMES = { normal: "Normal", dos: "DoS", ddos: "DDoS" };
const HEALTH_LABELS = {
    within: "Within capacity",
    near: "Near capacity",
    overloaded: "Overloaded"
};
const HEALTH_CLASS = { within: "normal", near: "near", overloaded: "overloaded" };

const HISTORY_SECONDS = 60;
const LOG_LIMIT = 40;
const SLOW_FACTOR = 0.35;
const DEBOUNCE_MS = 350;
const NEAR_THRESHOLD = 80; // percent of capacity

const COLORS = {
    legit: "#a67d69",
    attack: "#5a3d31",
    processed: "#6f8f72",
    processedSoft: "#e7efe8",
    dropped: "#c0705a",
    droppedSoft: "#f6e5e1",
    blocked: "#c99a3e",
    blockedSoft: "#f8eed9",
    capacity: "#5a3d31",
    text: "#302d2b",
    muted: "#81766f",
    line: "#e6d8ce",
    white: "#ffffff"
};
const HEALTH_COLORS = {
    within: COLORS.processed,
    near: COLORS.blocked,
    overloaded: COLORS.dropped
};
const FONT = "Arial, Helvetica, sans-serif";

const motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
const prefersReducedMotion = () => Boolean(motionQuery.matches);

function formatNumber(value, decimals = 0) {
    return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: decimals
    });
}

function plural(count, one, many) {
    return count === 1 ? one : many;
}

function niceCeil(value) {
    if (!(value > 0)) return 10;
    const power = Math.pow(10, Math.floor(Math.log10(value)));
    const n = value / power;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * power;
}

// ---------- Input validation ----------

function checkInteger(id) {
    const rule = INPUT_RULES[id];
    const input = $(id);
    const raw = input ? input.value.trim() : "";

    if (raw === "") {
        return { ok: false, error: `${rule.label} is empty. Waiting for a whole number.` };
    }

    const value = Number(raw);

    if (!Number.isInteger(value)) {
        return { ok: false, error: `${rule.label} must be a whole number.` };
    }

    if (value < rule.min || value > rule.max) {
        return {
            ok: false,
            error: `${rule.label} must be between ${formatNumber(rule.min)} and ${formatNumber(rule.max)}.`
        };
    }

    return { ok: true, value };
}

function readSettings(scenario) {
    const protection =
        scenario === "ddos" && Boolean($("protectionEnabled")?.checked);

    const needed = ["legitimateRate", "capacity"];
    if (scenario === "dos") needed.push("dosRate");
    if (scenario === "ddos") needed.push("attackerCount", "ratePerSource");
    if (protection) needed.push("perSourceLimit");

    const values = {};
    const errors = [];

    Object.keys(INPUT_RULES).forEach((id) => {
        const input = $(id);
        if (!input) return;

        const relevant = needed.includes(id);
        const result = checkInteger(id);

        input.setAttribute("aria-invalid", String(relevant && !result.ok));

        if (!relevant) return;
        if (result.ok) values[id] = result.value;
        else errors.push(result.error);
    });

    if (errors.length) return { ok: false, errors };

    return {
        ok: true,
        settings: {
            scenario,
            legitimate: values.legitimateRate,
            capacity: values.capacity,
            dosRate: scenario === "dos" ? values.dosRate : 0,
            sources:
                scenario === "dos" ? 1 :
                scenario === "ddos" ? values.attackerCount : 0,
            ratePerSource:
                scenario === "dos" ? values.dosRate :
                scenario === "ddos" ? values.ratePerSource : 0,
            protection,
            limit: protection ? values.perSourceLimit : null
        }
    };
}

function sameSettings(a, b) {
    return Boolean(a && b) && JSON.stringify(a) === JSON.stringify(b);
}

// ---------- Traffic model (mirrors backend/simulation.py + protection.py) ----------

function finalizeModel(s, parts) {
    const incoming = parts.incoming;
    const blocked = parts.blocked;
    const remaining = incoming - blocked;

    let accepted = parts.accepted;
    let dropped = parts.dropped;

    if (accepted === undefined) {
        accepted = Math.min(remaining, s.capacity);
        dropped = remaining - accepted;
    }

    let legitAccepted = parts.legitAccepted;
    if (legitAccepted === undefined || Number.isNaN(legitAccepted)) {
        // Proportional sharing, exactly as in the backend model.
        legitAccepted = remaining > 0 ? (s.legitimate * accepted) / remaining : 0;
    }

    const offeredPct = (remaining / s.capacity) * 100;
    const processedPct = (accepted / s.capacity) * 100;

    const health =
        dropped > 0 ? "overloaded" :
        offeredPct >= NEAR_THRESHOLD ? "near" : "within";

    return {
        incoming,
        attackTotal: parts.attackTotal,
        blocked,
        remaining,
        accepted,
        dropped,
        legitAccepted,
        attackAccepted: Math.max(0, accepted - legitAccepted),
        offeredPct,
        processedPct,
        health
    };
}

/** Browser copy of the backend formulas, used only if the Flask API is unreachable. */
function computeModel(s) {
    const attackTotal =
        s.scenario === "dos" ? s.dosRate :
        s.scenario === "ddos" ? s.sources * s.ratePerSource : 0;

    // protection.allowed_attack_after_limit(): per-source cap on attack sources.
    const blocked =
        s.protection && s.sources > 0
            ? s.sources * Math.max(0, s.ratePerSource - s.limit)
            : 0;

    return finalizeModel(s, {
        incoming: s.legitimate + attackTotal,
        attackTotal,
        blocked
    });
}

function buildPayload(s) {
    const payload = {
        scenario: s.scenario,
        legitimate_rate: s.legitimate,
        capacity: s.capacity
    };

    if (s.scenario === "dos") {
        payload.attack_rate_per_source = s.dosRate;
        payload.attacker_count = 1;
    } else if (s.scenario === "ddos") {
        payload.attacker_count = s.sources;
        payload.attack_rate_per_source = s.ratePerSource;
        payload.protection_enabled = s.protection;
        if (s.protection) payload.per_source_limit = s.limit;
    }

    return payload;
}

/**
 * Map the API response onto the lab's vocabulary:
 * incoming = every request that arrives (before protection),
 * remaining = incoming - blocked (what reaches the server).
 * The backend's DDoS "incoming" is already post-filter, so we use offered_total.
 */
function modelFromApi(data, s) {
    const blocked = Number(data.blocked) || 0;
    const attackTotal = Number(data.attack_incoming) || 0;
    const incoming =
        s.scenario === "ddos" ? Number(data.offered_total) : Number(data.incoming);

    const model = finalizeModel(s, {
        incoming,
        attackTotal,
        blocked,
        accepted: Number(data.accepted),
        dropped: Number(data.dropped),
        legitAccepted: Number(data.legitimate_accepted)
    });

    const consistent =
        model.incoming === model.accepted + model.dropped + model.blocked &&
        model.incoming === s.legitimate + model.attackTotal;

    if (!consistent) {
        throw new Error("API response failed the consistency check.");
    }

    return model;
}

async function requestModel(s) {
    let response;

    try {
        response = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(s))
        });
    } catch (networkError) {
        return { model: computeModel(s), source: "local" };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || `Simulation server returned HTTP ${response.status}.`);
    }

    try {
        return { model: modelFromApi(data, s), source: "api" };
    } catch (mappingError) {
        console.warn(mappingError.message, "Falling back to the browser model.");
        return { model: computeModel(s), source: "local" };
    }
}

// ---------- Shared simulation state ----------

const sim = {
    running: false,
    paused: false,
    slow: false,
    time: 0,          // whole simulated seconds
    subSecond: 0,     // fraction of the current simulated second
    settings: null,
    model: null,
    history: [],
    log: [],
    rafId: 0,
    lastFrame: 0,
    requestSeq: 0,
    debounceId: 0,
    notedLocal: false
};

// ---------- Canvas helpers ----------

function setupCanvas(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}

function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function drawText(ctx, text, x, y, options = {}) {
    const {
        size = 11,
        weight = "normal",
        color = COLORS.text,
        align = "center",
        baseline = "middle"
    } = options;

    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
}

// ---------- Animated traffic scene ----------

const scene = (() => {
    const canvas = $("trafficCanvas");
    const wrap = $("sceneWrap");
    let ctx = null;
    let W = 0;
    let H = 0;
    let L = null;
    let s = null;
    let m = null;
    let dots = [];
    let rates = { legit: 0, attack: 0, perDot: 0 };
    let spawnAcc = { legit: 0, attack: 0 };
    let blockAcc = 0;
    let dropAcc = { legit: 0, attack: 0 };
    let dotSeq = 0;
    let attackSeq = 0;
    let lightPhase = 0;

    function computeRates() {
        if (!m || m.incoming <= 0) {
            rates = { legit: 0, attack: 0, perDot: 0 };
            return;
        }

        // Representative dots: density grows with traffic but stays bounded.
        const total = Math.min(80, 9 * Math.log2(1 + m.incoming / 4));
        let legit = (total * s.legitimate) / m.incoming;
        let attack = (total * m.attackTotal) / m.incoming;

        if (s.legitimate > 0) legit = Math.max(legit, 0.8);
        if (m.attackTotal > 0) attack = Math.max(attack, 0.8);

        rates = { legit, attack, perDot: m.incoming / (legit + attack) };
    }

    function layout() {
        if (!W || !H || !s) {
            L = null;
            return;
        }

        const narrow = W < 560;
        const srcX = narrow ? 42 : Math.max(56, W * 0.09);
        const serverW = narrow ? 46 : 62;
        const serverH = narrow ? 92 : 112;
        const serverX = W * 0.68;
        const serverY = H * 0.47;
        const hasAttack = s.scenario !== "normal";
        const legitY = hasAttack ? H * 0.2 : serverY;

        const attackIcons = [];
        let extra = 0;

        if (s.scenario === "dos") {
            attackIcons.push({ x: srcX, y: H * 0.68, big: true });
        } else if (s.scenario === "ddos" && s.sources > 0) {
            const maxVisible = narrow ? 4 : 6;
            const visible = Math.min(s.sources, maxVisible);
            extra = s.sources - visible;

            const cols = visible > 3 ? 2 : 1;
            const rows = Math.ceil(visible / cols);
            const top = H * 0.5;
            const bottom = H * (extra > 0 ? 0.76 : 0.84);

            for (let i = 0; i < visible; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = cols === 2 ? srcX + (col === 0 ? -15 : 15) : srcX;
                const y = rows === 1 ? (top + bottom) / 2 : top + ((bottom - top) * row) / (rows - 1);
                attackIcons.push({ x, y, big: false });
            }
        }

        L = {
            narrow,
            srcX,
            legitY,
            attackIcons,
            extra,
            extraPos: { x: srcX, y: H * 0.9 },
            mergeX: W * 0.4,
            mergeY: serverY,
            serverX,
            serverY,
            serverW,
            serverH,
            procX: W - (narrow ? 34 : 52),
            procW: narrow ? 60 : 84,
            blockedBin: { x: W * 0.4, y: H * 0.09 },
            droppedBin: { x: serverX - serverW * 0.6, y: H * 0.91 },
            speed: Math.max(140, W * 0.42)
        };
    }

    function resize() {
        if (!canvas || !wrap) return;
        const width = wrap.clientWidth;
        if (!width) return;

        W = width;
        H = W < 560 ? 330 : 370;
        ctx = setupCanvas(canvas, W, H);
        dots = []; // old positions are no longer valid
        layout();
        render();
    }

    function configure(settings, model) {
        s = settings;
        m = model;
        computeRates();
        layout();
    }

    function clear() {
        dots = [];
        spawnAcc = { legit: 0, attack: 0 };
        blockAcc = 0;
        dropAcc = { legit: 0, attack: 0 };
        dotSeq = 0;
        attackSeq = 0;
    }

    function jitter() {
        return ((dotSeq * 0.6180339887) % 1) - 0.5;
    }

    function decideFate(kind) {
        // Deterministic error diffusion: the share of dots taking each path
        // matches the model's blocked / dropped proportions exactly.
        if (kind === "attack" && m.blocked > 0 && m.attackTotal > 0) {
            blockAcc += m.blocked / m.attackTotal;
            if (blockAcc >= 1 - 1e-9) {
                blockAcc -= 1;
                return "blocked";
            }
        }

        if (m.dropped > 0 && m.remaining > 0) {
            dropAcc[kind] += m.dropped / m.remaining;
            if (dropAcc[kind] >= 1 - 1e-9) {
                dropAcc[kind] -= 1;
                return "dropped";
            }
        }

        return "processed";
    }

    function attackOrigin() {
        if (s.scenario === "dos") return L.attackIcons[0];

        const index = attackSeq % Math.max(1, s.sources);
        attackSeq++;

        return index < L.attackIcons.length ? L.attackIcons[index] : L.extraPos;
    }

    function spawn(kind) {
        dotSeq++;
        const j = jitter();
        const origin = kind === "legit" ? { x: L.srcX, y: L.legitY } : attackOrigin();
        if (!origin) return;

        const fate = decideFate(kind);
        const start = { x: origin.x + 16, y: origin.y };
        const merge = { x: L.mergeX, y: L.mergeY + j * 22 };
        const entry = {
            x: L.serverX - L.serverW / 2 - 3,
            y: L.serverY + j * L.serverH * 0.6
        };

        let points;

        if (fate === "blocked") {
            points = [start, merge, { x: L.blockedBin.x + j * 60, y: L.blockedBin.y + 4 }];
        } else if (fate === "dropped") {
            points = [
                start,
                merge,
                entry,
                { x: entry.x - 16, y: entry.y + 4 },
                { x: L.droppedBin.x + j * 60, y: L.droppedBin.y + 2 }
            ];
        } else {
            points = [
                start,
                merge,
                entry,
                { x: L.serverX, y: entry.y },
                { x: L.procX - 14 + j * 16, y: L.serverY + j * 18 }
            ];
        }

        dots.push({ kind, fate, points, seg: 0, along: 0, fade: 1, arrived: false });
    }

    function moveDot(dot, distance) {
        while (distance > 0 && dot.seg < dot.points.length - 1) {
            const a = dot.points[dot.seg];
            const b = dot.points[dot.seg + 1];
            const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const left = length - dot.along;

            if (distance < left) {
                dot.along += distance;
                return;
            }

            distance -= left;
            dot.seg++;
            dot.along = 0;
        }

        dot.arrived = true;
    }

    function dotPosition(dot) {
        if (dot.seg >= dot.points.length - 1) return dot.points[dot.points.length - 1];

        const a = dot.points[dot.seg];
        const b = dot.points[dot.seg + 1];
        const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const k = dot.along / length;

        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }

    /** Advance the scene by dt simulated seconds. */
    function update(dt) {
        if (!L || !m) return;

        const load = Math.min(1, m.processedPct / 100);
        lightPhase += dt * (2 + 9 * load);

        if (prefersReducedMotion()) {
            dots = [];
            return;
        }

        spawnAcc.legit += rates.legit * dt;
        spawnAcc.attack += rates.attack * dt;

        while (spawnAcc.legit >= 1) {
            spawnAcc.legit -= 1;
            spawn("legit");
        }

        while (spawnAcc.attack >= 1) {
            spawnAcc.attack -= 1;
            spawn("attack");
        }

        const distance = L.speed * dt;

        dots.forEach((dot) => {
            if (dot.arrived) {
                dot.fade -= dt * 1.6;
            } else {
                moveDot(dot, distance);
                if (dot.arrived && dot.fate === "processed") dot.fade = 0;
            }
        });

        dots = dots.filter((dot) => dot.fade > 0);
        if (dots.length > 400) dots.splice(0, dots.length - 400);
    }

    // ----- drawing -----

    function flowWidth(rate) {
        if (!(rate > 0) || !m || m.incoming <= 0) return 0;
        return 1.5 + 7 * Math.sqrt(Math.min(1, rate / m.incoming));
    }

    function drawFlow(points, rate, color) {
        const width = flowWidth(rate);

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (width === 0) {
            ctx.strokeStyle = COLORS.line;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
        } else {
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.32;
            ctx.lineWidth = width;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
    }

    function drawUser(x, y, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - 6, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + 7, 8, Math.PI, 0);
        ctx.fill();
    }

    function drawAttacker(x, y, big) {
        const w = big ? 30 : 20;
        const h = big ? 22 : 15;

        roundRectPath(ctx, x - w / 2, y - h / 2, w, h, 4);
        ctx.fillStyle = COLORS.attack;
        ctx.fill();
        ctx.fillRect(x - 3, y + h / 2, 6, 3);
        drawText(ctx, "!", x, y + 0.5, { size: big ? 15 : 11, weight: "bold", color: COLORS.white });
    }

    function drawBox(cx, cy, w, h, stroke, fill, title, detail, dashed) {
        ctx.save();
        roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, 9);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = stroke;
        if (dashed) ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.restore();

        const size = L.narrow ? 10 : 11;
        drawText(ctx, title, cx, cy - (detail ? 7 : 0), { size: size + 1, weight: "bold", color: stroke });
        if (detail) drawText(ctx, detail, cx, cy + 8, { size, color: COLORS.text });
    }

    function drawSources() {
        const small = L.narrow ? 10 : 11;
        const legitColor = s.legitimate > 0 ? COLORS.legit : COLORS.line;

        drawUser(L.srcX - 14, L.legitY + 2, legitColor);
        drawUser(L.srcX + 14, L.legitY + 2, legitColor);
        drawUser(L.srcX, L.legitY - 3, legitColor);
        drawText(ctx, "Legitimate users", L.srcX, L.legitY + 26, { size: small, weight: "bold" });
        drawText(ctx, `${formatNumber(s.legitimate)} req/s`, L.srcX, L.legitY + 40, { size: small, color: COLORS.muted });

        if (s.scenario === "dos") {
            const icon = L.attackIcons[0];
            drawAttacker(icon.x, icon.y, true);
            drawText(ctx, "1 attacker", L.srcX, icon.y + 28, { size: small, weight: "bold" });
            drawText(ctx, `${formatNumber(s.dosRate)} req/s`, L.srcX, icon.y + 42, { size: small, color: COLORS.muted });
        }

        if (s.scenario === "ddos") {
            const titleY = H * 0.43;
            drawText(
                ctx,
                `${formatNumber(s.sources)} ${plural(s.sources, "attacker", "attackers")}`,
                L.srcX,
                titleY - 8,
                { size: small, weight: "bold" }
            );
            drawText(ctx, `× ${formatNumber(s.ratePerSource)} req/s each`, L.srcX, titleY + 6, { size: small, color: COLORS.muted });

            L.attackIcons.forEach((icon) => drawAttacker(icon.x, icon.y, false));

            if (L.extra > 0) {
                const label = `+${formatNumber(L.extra)} attackers`;
                ctx.font = `bold ${small}px ${FONT}`;
                const w = ctx.measureText(label).width + 16;
                roundRectPath(ctx, L.extraPos.x - w / 2, L.extraPos.y - 10, w, 20, 10);
                ctx.fillStyle = COLORS.attack;
                ctx.fill();
                drawText(ctx, label, L.extraPos.x, L.extraPos.y, { size: small, weight: "bold", color: COLORS.white });
            }
        }
    }

    function drawMerge() {
        if (s.protection) {
            const w = L.narrow ? 74 : 104;
            const h = 44;
            drawBox(
                L.mergeX,
                L.mergeY,
                w,
                h,
                COLORS.blocked,
                COLORS.blockedSoft,
                "Rate limit",
                `≤ ${formatNumber(s.limit)} req/s per attacker`
            );
        } else {
            ctx.fillStyle = COLORS.white;
            ctx.strokeStyle = COLORS.legit;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(L.mergeX, L.mergeY, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            drawText(ctx, "Network", L.mergeX, L.mergeY + 22, { size: L.narrow ? 10 : 11, color: COLORS.muted });
        }
    }

    function drawServer() {
        const health = m.health;
        const color = HEALTH_COLORS[health];
        const x0 = L.serverX - L.serverW / 2;
        const y0 = L.serverY - L.serverH / 2;
        const reduce = prefersReducedMotion();

        ctx.save();
        if (health === "overloaded") {
            ctx.shadowColor = "rgba(192, 112, 90, 0.55)";
            ctx.shadowBlur = 16;
        }
        roundRectPath(ctx, x0, y0, L.serverW, L.serverH, 9);
        ctx.fillStyle = COLORS.white;
        ctx.fill();
        ctx.restore();

        roundRectPath(ctx, x0, y0, L.serverW, L.serverH, 9);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.stroke();

        const slots = 3;
        const slotH = (L.serverH - 24) / slots;

        for (let i = 0; i < slots; i++) {
            const sy = y0 + 10 + i * (slotH + 2);
            roundRectPath(ctx, x0 + 7, sy, L.serverW - 14, slotH - 2, 4);
            ctx.fillStyle = "#f6efe9";
            ctx.fill();

            // Activity light: blink speed follows processed load.
            const on = reduce || !sim.running || Math.sin(lightPhase + i * 2.1) > -0.2;
            ctx.beginPath();
            ctx.arc(x0 + L.serverW - 15, sy + (slotH - 2) / 2, 3.6, 0, Math.PI * 2);
            ctx.fillStyle = on ? color : "#ddd2ca";
            ctx.fill();

            // Load bar inside the slot (processed share of capacity).
            const barW = (L.serverW - 34) * Math.min(1, m.processedPct / 100);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.45;
            ctx.fillRect(x0 + 11, sy + (slotH - 2) / 2 - 2, barW, 4);
            ctx.globalAlpha = 1;
        }

        const small = L.narrow ? 10 : 11;
        drawText(ctx, "Server", L.serverX, y0 - 30, { size: small + 1, weight: "bold" });
        drawText(
            ctx,
            `${formatNumber(m.accepted)} / ${formatNumber(s.capacity)} req/s`,
            L.serverX,
            y0 - 15,
            { size: small, color: COLORS.muted }
        );
    }

    function drawDots() {
        dots.forEach((dot) => {
            const p = dotPosition(dot);
            ctx.globalAlpha = Math.max(0, Math.min(1, dot.fade));
            ctx.fillStyle = dot.kind === "legit" ? COLORS.legit : COLORS.attack;
            ctx.beginPath();

            if (dot.kind === "legit") {
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            } else {
                ctx.moveTo(p.x, p.y - 5);
                ctx.lineTo(p.x + 5, p.y);
                ctx.lineTo(p.x, p.y + 5);
                ctx.lineTo(p.x - 5, p.y);
                ctx.closePath();
            }

            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function render() {
        if (!ctx || !W) return;
        ctx.clearRect(0, 0, W, H);
        if (!L || !m) return;

        const merge = { x: L.mergeX, y: L.mergeY };
        const entry = { x: L.serverX - L.serverW / 2, y: L.serverY };

        // Flow paths (width grows with the rate on that path).
        drawFlow([{ x: L.srcX + 16, y: L.legitY }, merge], s.legitimate, COLORS.legit);
        L.attackIcons.forEach((icon) => {
            drawFlow([{ x: icon.x + 16, y: icon.y }, merge], s.ratePerSource, COLORS.attack);
        });
        if (L.extra > 0) {
            drawFlow([{ x: L.extraPos.x + 40, y: L.extraPos.y }, merge], L.extra * s.ratePerSource, COLORS.attack);
        }
        if (s.protection) {
            drawFlow([merge, { x: L.blockedBin.x, y: L.blockedBin.y + 18 }], m.blocked, COLORS.blocked);
        }
        drawFlow([merge, entry], m.remaining, COLORS.legit);
        drawFlow(
            [{ x: entry.x, y: L.serverY + L.serverH * 0.3 }, { x: L.droppedBin.x, y: L.droppedBin.y - 17 }],
            m.dropped,
            COLORS.dropped
        );
        drawFlow(
            [{ x: L.serverX + L.serverW / 2, y: L.serverY }, { x: L.procX - L.procW / 2, y: L.serverY }],
            m.accepted,
            COLORS.processed
        );

        // Destination areas.
        const binW = L.narrow ? 112 : 150;
        drawBox(
            L.droppedBin.x,
            L.droppedBin.y,
            binW,
            34,
            COLORS.dropped,
            COLORS.droppedSoft,
            "Dropped",
            `${formatNumber(m.dropped)} req/s · over capacity`,
            true
        );

        if (s.protection) {
            drawBox(
                L.blockedBin.x,
                L.blockedBin.y,
                binW,
                34,
                COLORS.blocked,
                COLORS.blockedSoft,
                "Blocked",
                `${formatNumber(m.blocked)} req/s · by rule`,
                true
            );

            drawText(
                ctx,
                `${formatNumber(m.remaining)} req/s reach server`,
                (L.mergeX + entry.x) / 2,
                L.serverY - 16,
                { size: L.narrow ? 9 : 10, color: COLORS.muted }
            );
        }

        drawBox(
            L.procX,
            L.serverY,
            L.procW,
            54,
            COLORS.processed,
            COLORS.processedSoft,
            "Processed",
            `${formatNumber(m.accepted)} req/s`
        );

        drawSources();
        drawMerge();
        drawServer();
        drawDots();
    }

    return {
        resize,
        configure,
        clear,
        update,
        render,
        getRepresentation: () => rates.perDot
    };
})();

// ---------- Live line chart ----------

const chart = (() => {
    const canvas = $("trafficChart");
    const wrap = $("chartWrap");
    let ctx = null;
    let W = 0;
    let H = 0;

    const SERIES = [
        { key: "blocked", color: COLORS.blocked, width: 2 },
        { key: "dropped", color: COLORS.dropped, width: 2 },
        { key: "accepted", color: COLORS.processed, width: 4 },
        { key: "incoming", color: COLORS.legit, width: 2 }
    ];

    function resize() {
        if (!canvas || !wrap) return;
        const width = wrap.clientWidth;
        if (!width) return;

        W = width;
        H = W < 520 ? 220 : 260;
        ctx = setupCanvas(canvas, W, H);
        draw();
    }

    function draw() {
        if (!ctx || !W) return;

        const padL = 58;
        const padR = 14;
        const padT = 14;
        const padB = 42;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;
        const history = sim.history;

        ctx.clearRect(0, 0, W, H);

        const tEnd = Math.max(HISTORY_SECONDS, sim.time);
        const tStart = tEnd - HISTORY_SECONDS;

        let maxValue = 10;
        history.forEach((h) => {
            maxValue = Math.max(maxValue, h.incoming, h.capacity);
        });
        if (sim.model && sim.settings) {
            maxValue = Math.max(maxValue, sim.model.incoming, sim.settings.capacity);
        }
        const yMax = niceCeil(maxValue * 1.1);

        const xOf = (t) => padL + ((t - tStart) / HISTORY_SECONDS) * plotW;
        const yOf = (v) => padT + plotH - (v / yMax) * plotH;

        // Grid + y-axis labels.
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const value = (yMax / 4) * i;
            const y = yOf(value);
            ctx.strokeStyle = i === 0 ? "#d8c3b7" : "#f0e7e1";
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            drawText(ctx, formatNumber(value), padL - 6, y, { size: 10, color: COLORS.muted, align: "right" });
        }

        // x-axis ticks every 10 s.
        for (let t = Math.ceil(tStart / 10) * 10; t <= tEnd; t += 10) {
            const x = xOf(t);
            ctx.strokeStyle = "#f0e7e1";
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, padT + plotH);
            ctx.stroke();
            drawText(ctx, `${t}`, x, padT + plotH + 12, { size: 10, color: COLORS.muted });
        }

        // Axis titles.
        drawText(ctx, "Simulation time (seconds)", padL + plotW / 2, H - 9, { size: 11, color: COLORS.text });
        ctx.save();
        ctx.translate(13, padT + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        drawText(ctx, "Requests / sec", 0, 0, { size: 11, color: COLORS.text });
        ctx.restore();

        if (!history.length) {
            drawText(ctx, "Press Run Simulation to start recording traffic.", padL + plotW / 2, padT + plotH / 2, {
                size: 12,
                color: COLORS.muted
            });
            return;
        }

        const visible = history.filter((h) => h.t >= tStart);

        ctx.save();
        ctx.beginPath();
        ctx.rect(padL, padT - 4, plotW, plotH + 8);
        ctx.clip();

        // Capacity reference line (dashed).
        ctx.strokeStyle = COLORS.capacity;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        visible.forEach((h, i) => {
            const x = xOf(h.t);
            const y = yOf(h.capacity);
            if (i === 0) ctx.moveTo(x, y);
            else {
                ctx.lineTo(x, yOf(visible[i - 1].capacity));
                ctx.lineTo(x, y);
            }
        });
        if (visible.length === 1) ctx.lineTo(xOf(visible[0].t) + 6, yOf(visible[0].capacity));
        ctx.stroke();
        ctx.setLineDash([]);

        SERIES.forEach((series) => {
            ctx.strokeStyle = series.color;
            ctx.fillStyle = series.color;
            ctx.lineWidth = series.width;
            ctx.lineJoin = "round";
            ctx.beginPath();
            visible.forEach((h, i) => {
                const x = xOf(h.t);
                const y = yOf(h[series.key]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            const last = visible[visible.length - 1];
            ctx.beginPath();
            ctx.arc(xOf(last.t), yOf(last[series.key]), series.width + 1, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    return { resize, draw };
})();

// ---------- Smooth number counters ----------

const counterFrames = new Map();

function setNumber(id, value, decimals = 0) {
    const el = $(id);
    if (!el) return;

    const from = el.dataset.value !== undefined ? Number(el.dataset.value) : value;
    el.dataset.value = String(value);

    if (counterFrames.has(id)) {
        cancelAnimationFrame(counterFrames.get(id));
        counterFrames.delete(id);
    }

    if (prefersReducedMotion() || from === value) {
        el.textContent = formatNumber(value, decimals);
        return;
    }

    const start = performance.now();
    const duration = 450;

    const step = (now) => {
        const k = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = formatNumber(from + (value - from) * eased, decimals);

        if (k < 1) {
            counterFrames.set(id, requestAnimationFrame(step));
        } else {
            el.textContent = formatNumber(value, decimals);
            counterFrames.delete(id);
        }
    };

    counterFrames.set(id, requestAnimationFrame(step));
}

// ---------- Text builders ----------

function summarySentence(s, m) {
    const arrive = `${formatNumber(m.incoming)} ${plural(m.incoming, "request arrives", "requests arrive")} each second`;
    const first = m.blocked > 0
        ? `${arrive}; protection blocks ${formatNumber(m.blocked)}, leaving ${formatNumber(m.remaining)}.`
        : `${arrive}.`;

    const second = m.dropped > 0
        ? `The server can process ${formatNumber(s.capacity)}, so ${formatNumber(m.dropped)} ${plural(m.dropped, "is", "are")} dropped.`
        : `The server can process ${formatNumber(s.capacity)}, so all ${formatNumber(m.remaining)} ${plural(m.remaining, "is", "are")} processed.`;

    return `${first} ${second}`;
}

function explanationText(s, m) {
    const L = formatNumber(s.legitimate);
    const parts = [];

    if (s.scenario === "normal") {
        parts.push(`Legitimate users send ${L} requests each second. There is no attacker in this scenario.`);
    } else if (s.scenario === "dos") {
        parts.push(
            `Legitimate users send ${L} req/sec and one attacker sends ${formatNumber(s.dosRate)} req/sec, ` +
            `so ${formatNumber(m.incoming)} requests arrive each second.`
        );
    } else if (s.sources === 0) {
        parts.push(`Legitimate users send ${L} req/sec. The DDoS attacker count is 0, so no attack traffic is added.`);
    } else {
        parts.push(
            `Legitimate users send ${L} req/sec and ${formatNumber(s.sources)} ${plural(s.sources, "attacker sends", "attackers each send")} ` +
            `${formatNumber(s.ratePerSource)} req/sec (${formatNumber(s.sources)} × ${formatNumber(s.ratePerSource)} = ${formatNumber(m.attackTotal)}), ` +
            `so ${formatNumber(m.incoming)} requests arrive each second.`
        );
    }

    if (s.scenario === "ddos" && s.protection) {
        if (s.sources === 0) {
            parts.push(`The rate-limit rule (at most ${formatNumber(s.limit)} req/sec per attacker) has nothing to block.`);
        } else if (m.blocked > 0) {
            parts.push(
                `The rate-limit rule lets each attacker send at most ${formatNumber(s.limit)} req/sec. Each attacker sends ` +
                `${formatNumber(s.ratePerSource)}, so ${formatNumber(s.ratePerSource - s.limit)} per attacker × ${formatNumber(s.sources)} = ` +
                `${formatNumber(m.blocked)} req/sec are blocked before reaching the server, leaving ${formatNumber(m.remaining)} req/sec. ` +
                `The rule only counts requests per attacker/client; it does not know which requests are malicious.`
            );
        } else {
            parts.push(
                `The rate-limit rule allows up to ${formatNumber(s.limit)} req/sec per attacker. Each attacker sends only ` +
                `${formatNumber(s.ratePerSource)}, which is within the limit, so nothing is blocked. Low-rate attackers look like ordinary users to this rule.`
            );
        }
    } else if (s.scenario === "ddos" && s.sources > 0) {
        parts.push("Rate-limit protection is off, so every request travels to the server.");
    }

    const pct = formatNumber(m.offeredPct, 1);

    if (m.dropped > 0) {
        parts.push(
            `The server can process ${formatNumber(s.capacity)} req/sec, so ${formatNumber(m.dropped)} req/sec ${plural(m.dropped, "is", "are")} dropped ` +
            `(offered load ${pct}% of capacity).`
        );
    } else if (m.health === "near") {
        parts.push(
            `The server can process ${formatNumber(s.capacity)} req/sec, so all ${formatNumber(m.remaining)} are processed, ` +
            `but it is at ${pct}% of capacity with little spare room.`
        );
    } else {
        parts.push(
            `The server can process ${formatNumber(s.capacity)} req/sec, so all ${formatNumber(m.remaining)} are processed (${pct}% of capacity used).`
        );
    }

    const hasAttack = m.attackTotal > 0;

    if (m.dropped > 0 && !hasAttack) {
        parts.push("Legitimate traffic alone is more than the server can handle, so some real users' requests fail. This is overload, not an attack.");
    } else if (m.dropped > 0) {
        const share = s.legitimate > 0 ? formatNumber((m.legitAccepted / s.legitimate) * 100, 0) : "0";
        parts.push(
            `The server cannot tell legitimate and attack requests apart, so real users lose requests too: only about ` +
            `${formatNumber(m.legitAccepted, 1)} of their ${L} req/sec (${share}%) are processed.`
        );
    } else if (hasAttack && m.attackAccepted > 0) {
        parts.push(
            `Unblocked attack requests still use capacity: ${formatNumber(m.attackAccepted, 1)} of the ${formatNumber(m.accepted)} processed req/sec ` +
            `are attack requests. Legitimate users are still served because capacity is not exceeded.`
        );
    } else {
        parts.push("All legitimate requests are served.");
    }

    return parts.join(" ");
}

// ---------- Rendering ----------

function renderMetrics() {
    const s = sim.settings;
    const m = sim.model;
    if (!s || !m) return;

    ["incoming", "accepted", "dropped", "blocked"].forEach((key) => {
        setNumber(key, m[key]);
        setNumber(`${key}Label`, m[key]);
    });
    setNumber("legitServed", m.legitAccepted, 1);

    if ($("legitServedNote")) {
        $("legitServedNote").textContent = `of ${formatNumber(s.legitimate)} legitimate req/sec`;
    }

    if ($("equationLine")) {
        $("equationLine").textContent =
            `${formatNumber(m.incoming)} incoming = ${formatNumber(m.accepted)} accepted + ` +
            `${formatNumber(m.dropped)} dropped + ${formatNumber(m.blocked)} blocked`;
    }

    // Shared, labelled scale for every bar.
    const scale = niceCeil(Math.max(m.incoming, s.capacity, 1));
    const pct = (v) => `${Math.min(100, (v / scale) * 100)}%`;

    $("incomingBar").style.width = pct(m.incoming);
    $("acceptedBar").style.width = pct(m.accepted);
    $("droppedBar").style.width = pct(m.dropped);
    $("blockedBar").style.width = pct(m.blocked);
    document.querySelectorAll(".cap-marker").forEach((marker) => {
        marker.style.left = pct(s.capacity);
    });
    $("barScaleLabel").textContent = `Scale: 0 – ${formatNumber(scale)} req/sec`;
    $("barAxisMid").textContent = formatNumber(scale / 2);
    $("barAxisMax").textContent = formatNumber(scale);
    $("barCapacityText").textContent = formatNumber(s.capacity);

    // Scenario vs. server health are shown separately on purpose.
    $("scenarioChip").textContent = `Scenario: ${SCENARIO_NAMES[s.scenario]}`;
    $("scenarioChip").dataset.scenario = s.scenario;
    $("status").textContent = HEALTH_LABELS[m.health];
    $("status").className = `status ${HEALTH_CLASS[m.health]}`;

    const healthClass = HEALTH_CLASS[m.health];
    $("processedText").textContent = `${formatNumber(m.accepted)} / ${formatNumber(s.capacity)} req/sec`;
    $("processedFill").style.width = `${Math.min(100, m.processedPct)}%`;
    $("processedFill").className = `gauge-fill ${healthClass}`;
    $("processedPct").textContent = `${formatNumber(m.processedPct, 1)}% of capacity in use (scale 0–100%)`;

    $("offeredText").textContent = `${formatNumber(m.remaining)} req/sec · ${formatNumber(m.offeredPct, 1)}%`;
    $("offeredFill").style.width = `${Math.min(200, m.offeredPct) / 2}%`;
    $("offeredFill").className = `gauge-fill ${healthClass}`;
    $("offeredNote").textContent =
        (m.blocked > 0
            ? `${formatNumber(m.incoming)} arriving − ${formatNumber(m.blocked)} blocked = ${formatNumber(m.remaining)} reaching the server. `
            : "") +
        (m.offeredPct > 200 ? "Bar capped at 200%; " : "") +
        "Scale 0–200% of capacity; the marker shows capacity.";

    $("statusSummary").textContent = summarySentence(s, m);
    $("statusSummary").className = `status-summary ${healthClass}`;

    const perDot = scene.getRepresentation();
    $("sceneScale").textContent = perDot > 0
        ? `Moving dots are representative requests: each dot ≈ ${formatNumber(perDot, 1)} requests. Path width grows with the rate on that path.`
        : "No requests are being sent right now.";

    $("trafficCanvas").setAttribute(
        "aria-label",
        `Live traffic diagram. Scenario ${SCENARIO_NAMES[s.scenario]}. Server ${HEALTH_LABELS[m.health]}. ${summarySentence(s, m)}`
    );
}

function renderExplanation() {
    if (sim.settings && sim.model && $("explanation")) {
        $("explanation").textContent = explanationText(sim.settings, sim.model);
    }
}

function renderLog() {
    const list = $("eventLog");
    if (!list) return;
    list.replaceChildren();

    if (!sim.log.length) {
        const li = document.createElement("li");
        li.className = "log-empty";
        li.textContent = "No events yet. Press Run Simulation to begin.";
        list.appendChild(li);
        return;
    }

    sim.log.forEach((entry) => {
        const li = document.createElement("li");
        const time = document.createElement("span");
        time.className = "log-time";
        time.textContent = `t = ${entry.t} s`;
        const text = document.createElement("span");
        text.textContent = entry.text;
        li.append(time, text);
        list.appendChild(li);
    });
}

function updateControls() {
    const pause = $("pauseButton");
    const step = $("stepButton");
    const run = $("runSimulation");

    if (pause) {
        pause.disabled = !sim.running;
        pause.textContent = sim.paused ? "▶ Resume" : "⏸ Pause";
        pause.setAttribute("aria-pressed", String(sim.paused));
    }
    if (step) step.disabled = !(sim.running && sim.paused);
    if (run) run.textContent = sim.running ? "Restart Simulation" : "Run Simulation";

    if ($("simClock")) {
        $("simClock").textContent =
            `Simulation time: ${sim.time} s` + (sim.slow ? " · slow" : "");
    }
    if ($("sceneOverlay")) $("sceneOverlay").hidden = sim.running;
    if ($("pausedBadge")) $("pausedBadge").hidden = !(sim.running && sim.paused);
}

function renderAll() {
    renderMetrics();
    renderExplanation();
    chart.draw();
    scene.render();
    updateControls();
}

function setMessage(text) {
    if ($("message")) $("message").textContent = text;
}

// ---------- Event log ----------

function addLog(text) {
    sim.log.unshift({ t: sim.time, text });
    if (sim.log.length > LOG_LIMIT) sim.log.length = LOG_LIMIT;
    renderLog();
}

function logSettingChanges(prev, next) {
    if (prev.scenario !== next.scenario) {
        addLog(`Scenario changed from ${SCENARIO_NAMES[prev.scenario]} to ${SCENARIO_NAMES[next.scenario]}.`);
        return;
    }

    const changed = (label, a, b, unit = " req/sec") => {
        if (a !== b) addLog(`${label} changed from ${formatNumber(a)} to ${formatNumber(b)}${unit}.`);
    };

    changed("Legitimate traffic", prev.legitimate, next.legitimate);
    changed("Server capacity", prev.capacity, next.capacity);

    if (next.scenario === "dos") changed("DoS attack rate", prev.dosRate, next.dosRate);

    if (next.scenario === "ddos") {
        changed("Attackers", prev.sources, next.sources, "");
        changed("Rate per attacker", prev.ratePerSource, next.ratePerSource);

        if (prev.protection !== next.protection) {
            addLog(next.protection
                ? `Protection enabled (limit ${formatNumber(next.limit)} req/sec per attacker).`
                : "Protection disabled.");
        } else if (next.protection) {
            changed("Per-attacker limit", prev.limit, next.limit);
        }
    }
}

function logHealthChange(prev, next) {
    const before = prev ? prev.health : "within";
    if (before === next.health) return;

    const pct = formatNumber(next.offeredPct, 1);

    if (next.health === "overloaded") {
        addLog(
            `Incoming traffic exceeded server capacity (${formatNumber(next.remaining)} req/sec reaching a ` +
            `${formatNumber(sim.settings.capacity)} req/sec server).`
        );
    } else if (before === "overloaded") {
        addLog(next.health === "near"
            ? `Server returned within capacity, but is near its limit (${pct}%).`
            : "Server returned within capacity.");
    } else if (next.health === "near") {
        addLog(`Server is near capacity (${pct}% in use).`);
    } else {
        addLog("Server has comfortable spare capacity again.");
    }
}

// ---------- Applying a new model ----------

function applyModel(settings, model, { log = true } = {}) {
    const prevSettings = sim.settings;
    const prevModel = sim.model;

    if (log && prevSettings) logSettingChanges(prevSettings, settings);

    sim.settings = settings;
    sim.model = model;

    if (log) logHealthChange(prevModel, model);

    scene.configure(settings, model);
    renderAll();
}

function noteSource(source) {
    if (source === "local" && !sim.notedLocal) {
        sim.notedLocal = true;
        addLog("Simulation server not reachable; using the same formulas in the browser.");
    }
}

function pushHistory() {
    const m = sim.model;
    if (!m) return;

    sim.history.push({
        t: sim.time,
        incoming: m.incoming,
        accepted: m.accepted,
        dropped: m.dropped,
        blocked: m.blocked,
        capacity: sim.settings.capacity
    });

    while (sim.history.length > HISTORY_SECONDS + 1) sim.history.shift();
}

// ---------- Timeline / animation loop (single rAF, no duplicate timers) ----------

function tick() {
    sim.time += 1;
    pushHistory();
    chart.draw();
    updateControls();
}

function frame(now) {
    sim.rafId = 0;
    if (!sim.running || sim.paused) return;

    const realDt = sim.lastFrame ? Math.min(0.1, (now - sim.lastFrame) / 1000) : 0;
    sim.lastFrame = now;

    const dt = realDt * (sim.slow ? SLOW_FACTOR : 1);
    scene.update(dt);

    sim.subSecond += dt;
    while (sim.subSecond >= 1) {
        sim.subSecond -= 1;
        tick();
    }

    scene.render();
    sim.rafId = requestAnimationFrame(frame);
}

function startLoop() {
    if (sim.rafId) return;
    sim.lastFrame = 0;
    sim.rafId = requestAnimationFrame(frame);
}

function stopLoop() {
    if (sim.rafId) cancelAnimationFrame(sim.rafId);
    sim.rafId = 0;
}

// ---------- Controls ----------

async function runSimulation() {
    const read = readSettings(selectedScenario);

    if (!read.ok) {
        setMessage(read.errors[0]);
        return;
    }

    clearTimeout(sim.debounceId);
    const seq = ++sim.requestSeq;
    const runBtn = $("runSimulation");

    if (runBtn) runBtn.disabled = true;
    setMessage("Calculating with the simulation server…");

    let result;

    try {
        result = await requestModel(read.settings);
    } catch (error) {
        setMessage(error.message);
        if (runBtn) runBtn.disabled = false;
        return;
    }

    if (runBtn) runBtn.disabled = false;
    if (seq !== sim.requestSeq) return;

    stopLoop();
    scene.clear();

    sim.running = true;
    sim.paused = false;
    sim.time = 0;
    sim.subSecond = 0;
    sim.history = [];
    sim.log = [];
    sim.settings = null;
    sim.model = null;

    addLog(`Simulation started. Scenario: ${SCENARIO_NAMES[read.settings.scenario]}.`);
    applyModel(read.settings, result.model);
    noteSource(result.source);
    pushHistory();
    chart.draw();

    setMessage(
        `${SCENARIO_NAMES[read.settings.scenario]} simulation running. ` +
        "Change any input to update it live."
    );

    updateControls();
    startLoop();
}

async function applyLiveChanges() {
    if (!sim.running) return;

    const read = readSettings(selectedScenario);

    if (!read.ok) {
        setMessage(`${read.errors[0]} The demo keeps using the last valid values.`);
        return;
    }

    if (sameSettings(read.settings, sim.settings)) return;

    const seq = ++sim.requestSeq;
    let result;

    try {
        result = await requestModel(read.settings);
    } catch (error) {
        if (seq === sim.requestSeq) setMessage(error.message);
        return;
    }

    if (seq !== sim.requestSeq || !sim.running) return;

    applyModel(read.settings, result.model);
    noteSource(result.source);

    setMessage(sim.paused
        ? "Paused: new values applied. Press Step or Resume to watch them flow."
        : "Live update applied.");
}

function scheduleLiveUpdate(delay = DEBOUNCE_MS) {
    const read = readSettings(selectedScenario); // also marks invalid fields

    if (!sim.running) {
        setMessage(read.ok
            ? "Settings ready. Press Run Simulation to start the live demonstration."
            : read.errors[0]);
        return;
    }

    clearTimeout(sim.debounceId);
    sim.debounceId = setTimeout(applyLiveChanges, delay);
}

function pauseSimulation(reason = "Simulation paused.") {
    if (!sim.running || sim.paused) return;
    sim.paused = true;
    stopLoop();
    addLog(reason);
    setMessage("Paused. Use Step to advance one simulated second, or Resume.");
    scene.render();
    updateControls();
}

function resumeSimulation() {
    if (!sim.running || !sim.paused) return;
    sim.paused = false;
    addLog("Simulation resumed.");
    setMessage("Simulation running.");
    updateControls();
    startLoop();
}

function stepSimulation() {
    if (!sim.running || !sim.paused) return;

    const substeps = 30;
    for (let i = 0; i < substeps; i++) scene.update(1 / substeps);
    tick();
    scene.render();
    setMessage(`Stepped to t = ${sim.time} s.`);
}

function updateInputRelevance() {
    document.querySelectorAll("[data-used-in]").forEach((label) => {
        const used = label.dataset.usedIn.split(" ").includes(selectedScenario);
        label.classList.toggle("is-unused", !used);
    });
}

function updateScenarioControls() {
    const protLabel = $("protectionLabel");
    const protGroup = $("perSourceLimitGroup");
    const protBox = $("protectionEnabled");

    if (protLabel) {
        protLabel.style.display = selectedScenario === "ddos" ? "flex" : "none";
    }
    if (protGroup) {
        protGroup.style.display =
            selectedScenario === "ddos" && protBox && protBox.checked ? "flex" : "none";
    }

    updateInputRelevance();
}

function setScenario(scenario, { apply = true } = {}) {
    selectedScenario = scenario;

    document.querySelectorAll(".scenario").forEach((item) => {
        const active = item.dataset.scenario === scenario;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
    });

    updateScenarioControls();

    if (!apply) return;

    if (sim.running) {
        scheduleLiveUpdate(0);
    } else {
        setMessage(`${SCENARIO_NAMES[scenario]} selected. Press Run Simulation.`);
    }
}

function resetSimulation({ announce = true } = {}) {
    clearTimeout(sim.debounceId);
    sim.requestSeq++; // ignore any request still in flight
    stopLoop();

    Object.entries(DEFAULT_INPUTS).forEach(([id, value]) => {
        if ($(id)) $(id).value = value;
    });
    if ($("protectionEnabled")) $("protectionEnabled").checked = false;

    setScenario("normal", { apply: false });

    sim.running = false;
    sim.paused = false;
    sim.time = 0;
    sim.subSecond = 0;
    sim.history = [];
    sim.log = [];

    const read = readSettings("normal");
    sim.settings = read.settings;
    sim.model = computeModel(read.settings);

    scene.clear();
    scene.configure(sim.settings, sim.model);
    renderAll();
    renderLog();

    setMessage(announce
        ? "Simulation reset to the default values. Press Run Simulation to start again."
        : "Ready. Press Run Simulation to start the live demonstration.");
}

// ---------- Wiring ----------

document.querySelectorAll(".scenario").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.scenario === selectedScenario));
    button.addEventListener("click", () => setScenario(button.dataset.scenario));
});

Object.keys(INPUT_RULES).forEach((id) => {
    const input = $(id);
    if (input) input.addEventListener("input", () => scheduleLiveUpdate());
});

if ($("protectionEnabled")) {
    $("protectionEnabled").addEventListener("change", () => {
        updateScenarioControls();
        scheduleLiveUpdate(0);
    });
}

if ($("runSimulation")) $("runSimulation").addEventListener("click", runSimulation);

if ($("pauseButton")) {
    $("pauseButton").addEventListener("click", () => {
        if (sim.paused) resumeSimulation();
        else pauseSimulation();
    });
}

if ($("stepButton")) $("stepButton").addEventListener("click", stepSimulation);
if ($("resetButton")) $("resetButton").addEventListener("click", () => resetSimulation());

if ($("slowMotion")) {
    $("slowMotion").addEventListener("change", (event) => {
        sim.slow = event.target.checked;
        if (sim.running) {
            addLog(sim.slow
                ? `Slow animation on (${Math.round(SLOW_FACTOR * 100)}% speed).`
                : "Slow animation off.");
        }
        updateControls();
    });
}

// Pause and release the animation loop when leaving the simulation section.
document.addEventListener("lessonShown", (event) => {
    if (event.detail.id !== "simulation") {
        pauseSimulation("Simulation paused (left the Interactive Simulation section).");
    } else {
        requestAnimationFrame(() => {
            scene.resize();
            chart.resize();
        });
    }
});

if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
        scene.resize();
        chart.resize();
    });
    if ($("sceneWrap")) observer.observe($("sceneWrap"));
    if ($("chartWrap")) observer.observe($("chartWrap"));
} else {
    window.addEventListener("resize", () => {
        scene.resize();
        chart.resize();
    });
}

if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", () => {
        scene.clear();
        scene.render();
    });
}
// ==========================================
// 5. TEN-QUESTION ASSESSMENT
// ==========================================

const quizForm = $("quizForm");

if (quizForm) {
    const correctAnswers = {
        q1: "b",
        q2: "b",
        q3: "b",
        q4: "a",
        q5: "c",
        q6: "b",
        q7: "b",
        q8: "b",
        q9: "a",
        q10: "c"
    };

    quizForm.addEventListener("submit", (event) => {
        event.preventDefault();

        let score = 0;
        let unanswered = 0;

        quizForm.querySelectorAll("label").forEach((label) => {
            label.classList.remove(
                "answer-correct",
                "answer-wrong"
            );

            label.querySelector(".answer-feedback")?.remove();
        });

        Object.entries(correctAnswers).forEach(
            ([question, correctAnswer]) => {
                const selected = quizForm.querySelector(
                    `input[name="${question}"]:checked`
                );

                const correctInput = quizForm.querySelector(
                    `input[name="${question}"][value="${correctAnswer}"]`
                );

                if (!selected) {
                    unanswered++;
                } else if (selected.value === correctAnswer) {
                    score++;
                }

                if (correctInput) {
                    const label = correctInput.closest("label");

                    if (label) {
                        label.classList.add("answer-correct");

                        const feedback =
                            document.createElement("span");

                        feedback.className = "answer-feedback";
                        feedback.textContent = " ✓ Correct answer";

                        label.appendChild(feedback);
                    }
                }

                if (
                    selected &&
                    selected.value !== correctAnswer
                ) {
                    const label = selected.closest("label");

                    if (label) {
                        label.classList.add("answer-wrong");

                        const feedback =
                            document.createElement("span");

                        feedback.className = "answer-feedback";
                        feedback.textContent = " ✗ Your answer";

                        label.appendChild(feedback);
                    }
                }
            }
        );

        if ($("quizResult")) {
            $("quizResult").textContent =
                `Your score: ${score}/10 (${score * 10}%). ` +
                (
                    unanswered > 0
                        ? `${unanswered} question(s) unanswered. Correct answers are shown below.`
                        : score === 10
                            ? "Excellent! All answers are correct."
                            : "Review the highlighted answers and try again."
                );

            $("quizResult").scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    });
}

// ==========================================
// 6. FEEDBACK FORM
// ==========================================

const feedbackForm = $("feedbackForm");

if (feedbackForm) {
    feedbackForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const rating = $("rating")?.value;
        const category =
            $("feedbackCategory")?.value || "overall";

        const comments =
            $("comments")?.value.trim() || "";

        const result = $("feedbackResult");

        if (!rating) {
            if (result) {
                result.textContent =
                    "Please select a rating before submitting.";
            }

            return;
        }

        const ratingLabels = {
            "5": "Very useful",
            "4": "Useful",
            "3": "Average",
            "2": "Needs improvement",
            "1": "Not useful"
        };

        if (result) {
            result.textContent =
                `Thank you for your feedback! ` +
                `Rating: ${rating}/5 (${ratingLabels[rating]}). ` +
                `Feedback category: ${category}. ` +
                (
                    comments
                        ? "Your comments have been received for this session."
                        : "No additional comments provided."
                );
        }

        feedbackForm.reset();
    });
}

// ==========================================
// 7. GUIDED ONBOARDING TOUR & LEARNING PATH
// ==========================================

const LEARNING_PATH_ITEMS = [
    { id: "aim", name: "Aim & Objectives" },
    { id: "theory", name: "Theory - DoS & DDoS" },
    { id: "procedure", name: "Procedure - Steps" },
    { id: "simulation", name: "Interactive Simulation" },
    { id: "assessment", name: "Assessment Quiz" },
    { id: "feedback", name: "Feedback & References" }
];

function getVisitedSections() {
    try {
        const stored = localStorage.getItem("css_lab_visited_sections");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        // ignore
    }
    return ["aim"];
}

function markSectionVisited(id) {
    if (!LEARNING_PATH_ITEMS.some((item) => item.id === id)) return;
    try {
        const visited = getVisitedSections();
        if (!visited.includes(id)) {
            visited.push(id);
            localStorage.setItem("css_lab_visited_sections", JSON.stringify(visited));
        }
        updateLearningPathUI(visited);
    } catch (e) {
        // storage fallback
    }
}

function updateLearningPathUI(visitedList) {
    const listEl = $("learningPathList");
    const countEl = $("learningPathCount");
    const fillEl = $("learningProgressFill");
    const barWrap = $("learningProgressBar");
    if (!listEl) return;

    const visited = visitedList || getVisitedSections();
    const total = LEARNING_PATH_ITEMS.length;
    const completed = LEARNING_PATH_ITEMS.filter((item) => visited.includes(item.id)).length;
    const pct = Math.round((completed / total) * 100);

    if (countEl) {
        countEl.textContent = completed === total ? "All 6 Completed" : `${completed} / ${total}`;
    }
    if (fillEl) {
        fillEl.style.width = `${pct}%`;
    }
    if (barWrap) {
        barWrap.setAttribute("aria-valuenow", String(pct));
    }

    listEl.replaceChildren();
    LEARNING_PATH_ITEMS.forEach((item) => {
        const isDone = visited.includes(item.id);
        const li = document.createElement("li");
        li.className = `learning-item ${isDone ? "completed" : ""}`;
        li.setAttribute("role", "button");
        li.tabIndex = 0;
        li.title = `Jump to ${item.name}`;

        const check = document.createElement("span");
        check.className = "learning-check";
        check.textContent = isDone ? "✓" : "";
        check.setAttribute("aria-hidden", "true");

        const name = document.createElement("span");
        name.className = "learning-name";
        name.textContent = item.name;

        li.append(check, name);

        const navigate = () => {
            showResource(item.id);
        };

        li.addEventListener("click", navigate);
        li.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate();
            }
        });

        listEl.appendChild(li);
    });
}

// ------------------------------------------
// Tour Steps Definition (Modular Array)
// ------------------------------------------
const tourSteps = [
    {
        id: "welcome",
        selector: null,
        title: "Welcome to the DoS & DDoS Virtual Lab",
        text: "A Denial of Service (DoS) attack floods a server with requests so real users can't get through. In Distributed DoS (DDoS), the attack is launched by hundreds or thousands of devices at once! By the end of this lab, you will be able to spot an attack, tell DoS from DDoS, and defend your server.",
        analogy: "Think of a server as a shop counter with 1 cashier. Requests are customers waiting to order. Normal traffic is polite customers arriving within the cashier's processing capacity."
    },
    {
        id: "header",
        selector: ".topbar",
        title: "Navigation & Quick Actions",
        text: "The header shows your subject and course. Use the back arrow (←) to return to the laboratory list, or the Share button (↗) to copy a direct link to this experiment for your lab partner."
    },
    {
        id: "navigator",
        selector: ".toolbar",
        title: "Experiment Manual & Page Navigator",
        text: "This workbook guides you step-by-step through the lab curriculum. Use the '‹' and '›' buttons or check the page counter (e.g. 1 / 9) to advance sequentially through the chapters."
    },
    {
        id: "menu",
        selector: "#menuButton",
        title: "Sidebar Menu Toggle",
        text: "Click this hamburger menu button anytime to collapse the sidebar for a distraction-free, full-width simulation view. Click it again to bring the sidebar back."
    },
    {
        id: "sidebar",
        selector: "#resourcesPanel",
        title: "Explanation Resources & Filter Tabs",
        text: "Your complete curriculum directory! Filter resources with the All, Video, and Interactive tabs at the top to quickly jump between study texts, multimedia videos, and interactive simulations."
    },
    {
        id: "aim",
        selector: '[data-resource="aim"]',
        fallbackSelector: "#aim",
        title: "Aim & Objectives — What You'll Achieve",
        text: "Start here to understand the core mission of this experiment: learn how data packets travel across networks, why servers have finite request capacities, and how excess volume affects service availability.",
        onEnter: () => showResource("aim")
    },
    {
        id: "theory",
        selector: '[data-resource="theory"]',
        fallbackSelector: "#theory",
        title: "Theory — Understand Concepts First",
        text: "Explore network capacity, packet flow models, request queuing, and the key architectural differences between single-source DoS and distributed DDoS attacks.",
        analogy: "DoS is like one aggressive person shouting 1,000 fake orders at the counter. DDoS is a huge hired mob shouting orders from every door at once, completely blocking legitimate customers!",
        onEnter: () => showResource("theory")
    },
    {
        id: "procedure",
        selector: '[data-resource="procedure"]',
        fallbackSelector: "#procedure",
        title: "Procedure — Step-by-Step Instructions",
        text: "Follow these clear steps: set your legitimate traffic rate, choose an attack scenario, and observe packet arrivals, drops, and server capacity utilization.",
        onEnter: () => showResource("procedure")
    },
    {
        id: "simulation",
        selector: "#simulation",
        title: "Interactive Traffic Simulation — Hands-On Testing",
        text: "This is your hands-on laboratory! Adjust customer request rates, test single vs. multi-attacker floods, toggle upstream rate limiting, and watch animated packets flow in real time.",
        analogy: "Rate limiting is like placing a bouncer at the shop entrance: 'Maximum 10 orders per customer!' Greedy attackers get blocked outside while honest shoppers enter freely!",
        onEnter: () => showResource("simulation")
    },
    {
        id: "assessment",
        selector: '[data-resource="assessment"]',
        fallbackSelector: "#assessment",
        title: "Assessment — Quiz & Knowledge Check",
        text: "Test your understanding with 10 interactive questions! Instant feedback highlights correct answers and explains the underlying cybersecurity principles.",
        onEnter: () => showResource("assessment")
    },
    {
        id: "feedback",
        selector: '[data-resource="feedback"]',
        fallbackSelector: "#feedback",
        title: "Feedback & References",
        text: "Review trusted cybersecurity references from Cloudflare and textbooks, and submit your local feedback on this virtual lab experiment.",
        onEnter: () => showResource("feedback")
    },
    {
        id: "finish",
        selector: null,
        title: "You are Ready to Explore!",
        text: "You know where everything is. You can jump straight into the live interactive simulation to launch an attack scenario, or start reading sequentially from Aim & Objectives.",
        isFinish: true
    }
];

let currentTourStep = 0;
let isTourActive = false;
let lastFocusedElement = null;

function getTargetElement(step) {
    if (!step || !step.selector) return null;
    let el = document.querySelector(step.selector);
    if (!el && step.fallbackSelector) {
        el = document.querySelector(step.fallbackSelector);
    }
    if (el && el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) {
        if (step.fallbackSelector) {
            const fallback = document.querySelector(step.fallbackSelector);
            if (fallback && fallback.offsetParent !== null) {
                return fallback;
            }
        }
    }
    return el;
}

function positionTourStep(step) {
    const overlay = $("tourOverlay");
    const spotlight = $("tourSpotlight");
    const tooltip = $("tourTooltip");
    const arrow = $("tourArrow");
    if (!overlay || !spotlight || !tooltip) return;

    const target = getTargetElement(step);

    if (!target) {
        spotlight.classList.add("centered");
        tooltip.classList.add("centered");
        tooltip.removeAttribute("data-placement");
        tooltip.style.top = "";
        tooltip.style.left = "";
        tooltip.style.right = "";
        tooltip.style.bottom = "";
        if (arrow) arrow.style.display = "none";
        return;
    }

    spotlight.classList.remove("centered");
    tooltip.classList.remove("centered");
    if (arrow) arrow.style.display = "";

    try {
        target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {
        // fallback
    }

    const rect = target.getBoundingClientRect();
    const pad = 6;
    const sTop = Math.max(0, rect.top - pad);
    const sLeft = Math.max(0, rect.left - pad);
    const sWidth = rect.width + pad * 2;
    const sHeight = rect.height + pad * 2;

    spotlight.style.top = `${sTop}px`;
    spotlight.style.left = `${sLeft}px`;
    spotlight.style.width = `${sWidth}px`;
    spotlight.style.height = `${sHeight}px`;

    const tipWidth = Math.min(440, window.innerWidth - 24);
    const tipHeight = tooltip.offsetHeight || 280;
    const margin = 14;

    const spaceBelow = window.innerHeight - (sTop + sHeight);
    const spaceAbove = sTop;
    const spaceRight = window.innerWidth - (sLeft + sWidth);
    const spaceLeft = sLeft;

    let placement = "bottom";
    let top = 0;
    let left = 0;

    if (window.innerWidth > 960 && spaceRight >= tipWidth + margin) {
        placement = "right";
        top = Math.max(margin, Math.min(window.innerHeight - tipHeight - margin, sTop));
        left = sLeft + sWidth + margin;
    } else if (window.innerWidth > 960 && spaceLeft >= tipWidth + margin) {
        placement = "left";
        top = Math.max(margin, Math.min(window.innerHeight - tipHeight - margin, sTop));
        left = sLeft - tipWidth - margin;
    } else if (spaceBelow >= tipHeight + margin || spaceBelow >= spaceAbove) {
        placement = "bottom";
        top = Math.min(window.innerHeight - tipHeight - margin, sTop + sHeight + margin);
        left = Math.max(margin, Math.min(window.innerWidth - tipWidth - margin, sLeft + sWidth / 2 - tipWidth / 2));
    } else {
        placement = "top";
        top = Math.max(margin, sTop - tipHeight - margin);
        left = Math.max(margin, Math.min(window.innerWidth - tipWidth - margin, sLeft + sWidth / 2 - tipWidth / 2));
    }

    tooltip.setAttribute("data-placement", placement);
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.right = "auto";
    tooltip.style.bottom = "auto";

    if (arrow) {
        if (placement === "bottom" || placement === "top") {
            const arrowLeft = Math.max(24, Math.min(tipWidth - 24, sLeft + sWidth / 2 - left - 7));
            arrow.style.left = `${arrowLeft}px`;
            arrow.style.top = "";
        } else {
            const arrowTop = Math.max(24, Math.min(tipHeight - 24, sTop + sHeight / 2 - top - 7));
            arrow.style.top = `${arrowTop}px`;
            arrow.style.left = "";
        }
    }
}

function renderTourStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) return;
    currentTourStep = stepIndex;
    const step = tourSteps[stepIndex];

    if (typeof step.onEnter === "function") {
        try {
            step.onEnter();
        } catch (e) {
            console.error("Tour onEnter error", e);
        }
    }

    const titleEl = $("tourTitle");
    const textEl = $("tourText");
    const badgeEl = $("tourBadge");
    const analogyBox = $("tourAnalogyBox");
    const analogyText = $("tourAnalogyText");
    const finishActions = $("tourFinishActions");
    const standardFooter = $("tourStandardFooter");
    const backBtn = $("tourBackBtn");
    const nextBtn = $("tourNextBtn");
    const dotsContainer = $("tourDots");

    if (titleEl) titleEl.textContent = step.title;
    if (textEl) textEl.textContent = step.text;
    if (badgeEl) badgeEl.textContent = `Step ${stepIndex + 1} of ${tourSteps.length}`;

    if (analogyBox && analogyText) {
        if (step.analogy) {
            analogyText.textContent = step.analogy;
            analogyBox.hidden = false;
        } else {
            analogyBox.hidden = true;
        }
    }

    if (step.isFinish) {
        if (finishActions) finishActions.hidden = false;
        if (standardFooter) standardFooter.hidden = true;
    } else {
        if (finishActions) finishActions.hidden = true;
        if (standardFooter) standardFooter.hidden = false;

        if (backBtn) {
            backBtn.disabled = stepIndex === 0;
        }
        if (nextBtn) {
            nextBtn.textContent = stepIndex === tourSteps.length - 2 ? "Finish" : "Next ›";
        }
    }

    if (dotsContainer) {
        dotsContainer.replaceChildren();
        tourSteps.forEach((s, idx) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = `tour-dot ${idx === stepIndex ? "active" : ""}`;
            dot.setAttribute("aria-label", `Step ${idx + 1}: ${s.title}`);
            dot.addEventListener("click", () => {
                goToTourStep(idx);
            });
            dotsContainer.appendChild(dot);
        });
    }

    setTimeout(() => {
        positionTourStep(step);
    }, 60);
}

function trapTourFocus(e) {
    if (!isTourActive) return;
    const tooltip = $("tourTooltip");
    if (!tooltip) return;

    if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
        return;
    }

    if (e.key === "ArrowRight") {
        if (document.activeElement?.tagName !== "INPUT") {
            e.preventDefault();
            nextTourStep();
            return;
        }
    }

    if (e.key === "ArrowLeft") {
        if (document.activeElement?.tagName !== "INPUT") {
            e.preventDefault();
            prevTourStep();
            return;
        }
    }

    if (e.key === "Tab") {
        const focusables = tooltip.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
}

function startTour(initialStep = 0) {
    lastFocusedElement = document.activeElement;
    isTourActive = true;
    currentTourStep = initialStep;

    const overlay = $("tourOverlay");
    if (overlay) {
        overlay.hidden = false;
        overlay.removeAttribute("hidden");
    }

    const dontShowCheck = $("tourDontShowCheck");
    if (dontShowCheck) {
        dontShowCheck.checked = localStorage.getItem("css_lab_tour_dont_show") === "true";
    }

    renderTourStep(currentTourStep);

    try {
        localStorage.setItem("css_lab_tour_seen", "true");
    } catch (e) {
        // ignore
    }

    setTimeout(() => {
        const nextBtn = $("tourNextBtn");
        if (nextBtn && !nextBtn.hidden && !nextBtn.disabled) {
            nextBtn.focus();
        } else {
            const firstBtn = $("tourTooltip")?.querySelector("button");
            firstBtn?.focus();
        }
    }, 120);
}

function nextTourStep() {
    if (currentTourStep < tourSteps.length - 1) {
        goToTourStep(currentTourStep + 1);
    } else {
        closeTour();
    }
}

function prevTourStep() {
    if (currentTourStep > 0) {
        goToTourStep(currentTourStep - 1);
    }
}

function goToTourStep(index) {
    renderTourStep(index);
}

function closeTour() {
    isTourActive = false;
    const overlay = $("tourOverlay");
    if (overlay) {
        overlay.hidden = true;
        overlay.setAttribute("hidden", "");
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        try {
            lastFocusedElement.focus();
        } catch (e) {
            // ignore
        }
    }
}

function skipTour() {
    closeTour();
}

window.startTour = startTour;
window.closeTour = closeTour;

// Event Listeners for Tour Controls
if ($("startTourButton")) {
    $("startTourButton").addEventListener("click", () => startTour(0));
}
if ($("floatingHelpBtn")) {
    $("floatingHelpBtn").addEventListener("click", () => startTour(0));
}
if ($("tourCloseBtn")) {
    $("tourCloseBtn").addEventListener("click", skipTour);
}
if ($("tourSkipBtn")) {
    $("tourSkipBtn").addEventListener("click", skipTour);
}
if ($("tourBackBtn")) {
    $("tourBackBtn").addEventListener("click", prevTourStep);
}
if ($("tourNextBtn")) {
    $("tourNextBtn").addEventListener("click", nextTourStep);
}
if ($("tourStartSimBtn")) {
    $("tourStartSimBtn").addEventListener("click", () => {
        closeTour();
        showResource("simulation");
    });
}
if ($("tourStartAimBtn")) {
    $("tourStartAimBtn").addEventListener("click", () => {
        closeTour();
        showResource("aim");
    });
}
if ($("tourDontShowCheck")) {
    $("tourDontShowCheck").addEventListener("change", (e) => {
        try {
            if (e.target.checked) {
                localStorage.setItem("css_lab_tour_dont_show", "true");
            } else {
                localStorage.removeItem("css_lab_tour_dont_show");
            }
        } catch (err) {
            // ignore
        }
    });
}

window.addEventListener("resize", () => {
    if (isTourActive && tourSteps[currentTourStep]) {
        positionTourStep(tourSteps[currentTourStep]);
    }
});

window.addEventListener("scroll", () => {
    if (isTourActive && tourSteps[currentTourStep]) {
        positionTourStep(tourSteps[currentTourStep]);
    }
}, { passive: true });

document.addEventListener("keydown", trapTourFocus);

// ==========================================
// 8. INITIAL PAGE SETUP
// ==========================================

renderResources();

if (typeof resetSimulation === "function") {
    resetSimulation({ announce: false });
}

// Initialize Learning Path on load
updateLearningPathUI();

// Auto-start tour on first visit
try {
    const tourSeen = localStorage.getItem("css_lab_tour_seen");
    const dontShow = localStorage.getItem("css_lab_tour_dont_show");
    if (!tourSeen && dontShow !== "true") {
        setTimeout(() => {
            startTour(0);
        }, 700);
    }
} catch (e) {
    // ignore
}