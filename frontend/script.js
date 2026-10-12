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
}

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
// 2. TRAFFIC CALCULATIONS
// ==========================================

function calculateTraffic(incoming, capacity) {
    const accepted = Math.min(incoming, capacity);
    const dropped = incoming - accepted;

    return {
        incoming,
        accepted,
        dropped,
        status: dropped > 0 ? "Overloaded" : "Normal"
    };
}

function simulateNormal(legitimateRate, capacity) {
    return calculateTraffic(legitimateRate, capacity);
}

function simulateDos(legitimateRate, attackRate, capacity) {
    return calculateTraffic(
        legitimateRate + attackRate,
        capacity
    );
}

function simulateDdos(
    legitimateRate,
    attackerCount,
    ratePerSource,
    capacity
) {
    return calculateTraffic(
        legitimateRate + attackerCount * ratePerSource,
        capacity
    );
}

function readInteger(id, min, max) {
    const input = $(id);

    if (!input) {
        throw new Error(`Input field "${id}" was not found.`);
    }

    const raw = input.value.trim();
    const value = Number(raw);

    if (
        raw === "" ||
        !Number.isSafeInteger(value) ||
        value < min ||
        value > max
    ) {
        throw new Error(
            `Enter a whole number from ${min} to ${max} for ${id}.`
        );
    }

    return value;
}

function updateBar(id, value, scale) {
    const bar = $(id);

    if (!bar) return;

    bar.style.width =
        `${scale > 0 ? (value / scale) * 100 : 0}%`;
}

function displayResults(result) {
    ["incoming", "accepted", "dropped", "blocked"].forEach((key) => {
        if ($(key)) {
            $(key).textContent = Number(result[key] || 0).toLocaleString();
        }

        if ($(key + "Label")) {
            $(key + "Label").textContent = Number(result[key] || 0).toLocaleString();
        }
    });

    if ($("status")) {
        $("status").textContent = result.status;

        $("status").className =
            "status " +
            (result.status === "Normal" ? "normal" : "overloaded");
    }

    const scale = Math.max(result.offered_total || 0, result.incoming || 0, result.capacity || 0, 1);

    updateBar("incomingBar", result.incoming, scale);
    updateBar("acceptedBar", result.accepted, scale);
    updateBar("droppedBar", result.dropped, scale);
    if ($("blockedBar")) {
        updateBar("blockedBar", result.blocked || 0, scale);
    }

    if ($("explanation")) {
        $("explanation").textContent =
            result.message || (
                result.dropped === 0
                    ? "All incoming requests fit within the configured server capacity."
                    : `${result.dropped} requests/sec exceed the available capacity in this model.`
            );
    }
}

// ==========================================
// 3. MAIN SIMULATION (API-CONNECTED)
// ==========================================

async function runSimulation() {
    const runBtn = $("runSimulation");
    const messageEl = $("message");

    try {
        const legitimate = readInteger("legitimateRate", 0, 100000);
        const capacity = readInteger("capacity", 1, 100000);
        const dosRate = readInteger("dosRate", 0, 100000);
        const count = readInteger("attackerCount", 0, 1000);
        const rate = readInteger("ratePerSource", 0, 100000);
        const protectionEnabled = $("protectionEnabled") ? $("protectionEnabled").checked : false;
        const perSourceLimit = (protectionEnabled && selectedScenario === "ddos")
            ? readInteger("perSourceLimit", 0, 100000)
            : null;

        const payload = {
            scenario: selectedScenario,
            legitimate_rate: legitimate,
            capacity: capacity
        };

        if (selectedScenario === "dos") {
            payload.attack_rate_per_source = dosRate;
            payload.attacker_count = 1;
        } else if (selectedScenario === "ddos") {
            payload.attacker_count = count;
            payload.attack_rate_per_source = rate;
            payload.protection_enabled = protectionEnabled;
            if (protectionEnabled) {
                payload.per_source_limit = perSourceLimit;
            }
        }

        if (runBtn) {
            runBtn.disabled = true;
            runBtn.textContent = "Simulating...";
        }
        if (messageEl) {
            messageEl.textContent = "Simulating traffic on Flask server...";
        }

        const response = await fetch("/api/simulate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Simulation failed with HTTP status ${response.status}`);
        }

        displayResults(data);

        if (messageEl) {
            messageEl.textContent = data.message || `${selectedScenario.toUpperCase()} simulation completed successfully.`;
        }

        // Notify visualization
        document.dispatchEvent(new CustomEvent("simulationCompleted", {
            detail: { result: data, payload }
        }));

    } catch (error) {
        if (messageEl) {
            messageEl.textContent = error.message;
        }
    } finally {
        if (runBtn) {
            runBtn.disabled = false;
            runBtn.textContent = "Run Simulation";
        }
    }
}

// Scenario selection & controls setup
const protectionCheckbox = $("protectionEnabled");
if (protectionCheckbox) {
    protectionCheckbox.addEventListener("change", () => {
        const limitGroup = $("perSourceLimitGroup");
        if (limitGroup) {
            limitGroup.style.display = protectionCheckbox.checked ? "block" : "none";
        }
    });
}

function updateScenarioControls() {
    const protLabel = $("protectionLabel");
    const protGroup = $("perSourceLimitGroup");
    const protBox = $("protectionEnabled");

    if (protLabel) {
        protLabel.style.display = selectedScenario === "ddos" ? "block" : "none";
    }
    if (protGroup) {
        protGroup.style.display = (selectedScenario === "ddos" && protBox && protBox.checked) ? "block" : "none";
    }
}

document.querySelectorAll(".scenario").forEach((button) => {
    button.setAttribute(
        "aria-pressed",
        String(button.dataset.scenario === selectedScenario)
    );

    button.addEventListener("click", () => {
        selectedScenario = button.dataset.scenario;

        document.querySelectorAll(".scenario").forEach((item) => {
            const active = item === button;

            item.classList.toggle("active", active);
            item.setAttribute("aria-pressed", String(active));
        });

        updateScenarioControls();

        if ($("message")) {
            $("message").textContent =
                `${button.textContent} selected. Run the simulation.`;
        }
    });
});

updateScenarioControls();

if ($("runSimulation")) {
    $("runSimulation").addEventListener(
        "click",
        runSimulation
    );
}

// ==========================================
// 4. VISUAL TRAFFIC SIMULATION
// ==========================================

(() => {
    const runButton = $("runSimulation");
    const panel = $("trafficVisualization");
    const topology = $("trafficTopology");

    if (!runButton || !panel || !topology) {
        console.warn(
            "Traffic visualization elements were not found. Check the HTML IDs."
        );
        return;
    }

    function numberFromInput(id) {
        const element = $(id);
        return element ? Number(element.value) || 0 : 0;
    }

    function numberFromOutput(id) {
        const element = $(id);
        return element
            ? Number(element.textContent.replace(/,/g, "")) || 0
            : 0;
    }

    function makeNode(icon, name, detail, extraClass = "") {
        return `
            <div class="topology-node ${extraClass}">
                <span class="node-icon">${icon}</span>
                <strong>${name}</strong>
                <small>${detail}</small>
            </div>
        `;
    }

    function makeArrow(label) {
        return `
            <div class="topology-arrow">
                <span class="arrow-line">
                    <i class="moving-packet"></i>
                </span>
                <span>${label}</span>
            </div>
        `;
    }

    function drawNetwork(
        scenario,
        legitimate,
        attackRate,
        sourceCount,
        ratePerSource,
        capacity,
        incoming,
        accepted,
        dropped
    ) {
        if (scenario === "normal") {
            topology.innerHTML = `
                <div class="topology-row">
                    ${makeNode(
                        "💻",
                        "Client PC",
                        `${legitimate} req/sec · Sender`
                    )}

                    ${makeArrow(`${legitimate} req/sec`)}

                    ${makeNode(
                        "🔀",
                        "Network Switch",
                        "Forwards packets"
                    )}

                    ${makeArrow("To server")}

                    ${makeNode(
                        "🖥️",
                        "Destination Server",
                        `Capacity: ${capacity} req/sec`,
                        "server-node"
                    )}
                </div>
            `;
        } else if (scenario === "dos") {
            topology.innerHTML = `
                <div class="topology-row">
                    ${makeNode(
                        "💻",
                        "Legitimate PC",
                        `${legitimate} req/sec`
                    )}

                    ${makeArrow("Legitimate traffic")}

                    ${makeNode(
                        "🖥️",
                        "Target Server",
                        `Accepted: ${accepted} req/sec`,
                        "server-node"
                    )}
                </div>

                <div class="topology-row">
                    ${makeNode(
                        "⚠️",
                        "Single Attack Source",
                        `${attackRate} attack req/sec`,
                        "dropped-node"
                    )}

                    ${makeArrow("Additional requests")}

                    ${makeNode(
                        "🖥️",
                        "Target Server",
                        `Dropped: ${dropped} req/sec`,
                        "server-node"
                    )}
                </div>
            `;
        } else {
            const visibleCount = Math.min(
                Math.max(sourceCount, 1),
                6
            );

            const sources = Array.from(
                { length: visibleCount },
                (_, index) => makeNode(
                    "⚠️",
                    `Source ${index + 1}`,
                    `${ratePerSource} req/sec`,
                    "dropped-node"
                )
            ).join("");

            const extraMessage =
                sourceCount > visibleCount
                    ? `<p class="visual-status">
                        Showing ${visibleCount} of ${sourceCount} simulated sources.
                        Combined attack traffic: ${attackRate} req/sec.
                       </p>`
                    : "";

            topology.innerHTML = `
                <div class="topology-row">
                    ${makeNode(
                        "💻",
                        "Legitimate PC",
                        `${legitimate} req/sec`
                    )}

                    ${sources}
                </div>

                <div class="topology-row">
                    ${makeArrow(`${incoming} req/sec combined`)}

                    ${makeNode(
                        "🖥️",
                        "Target Server",
                        `Accepted: ${accepted} · Dropped: ${dropped}`,
                        "server-node"
                    )}
                </div>

                ${extraMessage}
            `;
        }
    }

    function handleSimulationResult(result, payload) {
        const scenario = result.scenario || selectedScenario;
        const legitimate = result.legitimate_incoming;
        const capacity = result.capacity;
        const attackRate = result.attack_incoming || 0;
        const sourceCount = (payload && payload.attacker_count !== undefined) ? payload.attacker_count : (scenario === "dos" ? 1 : 5);
        const ratePerSource = (payload && payload.attack_rate_per_source !== undefined) ? payload.attack_rate_per_source : (scenario === "dos" ? attackRate : 40);
        const incoming = result.incoming;
        const accepted = result.accepted;
        const dropped = result.dropped;
        const blocked = result.blocked || 0;

        if ($("visualTitle")) {
            $("visualTitle").textContent =
                scenario === "normal"
                    ? "Normal Traffic: Client-to-Server Transfer"
                    : scenario === "dos"
                        ? "DoS: Single Attack Source"
                        : (blocked > 0 ? "DDoS: Multi-Source Traffic with Rate Limiting" : "DDoS: Multiple Attack Sources");
        }

        if ($("visualDescription")) {
            $("visualDescription").textContent =
                scenario === "normal"
                    ? "Legitimate packets travel through the switch to the destination server."
                    : scenario === "dos"
                        ? "One simulated attack source adds traffic alongside legitimate requests."
                        : (blocked > 0
                            ? `Rate limiting filtered ${blocked} req/s before reaching server. Server received ${incoming} req/s.`
                            : "Multiple simulated sources send traffic towards the same target server.");
        }

        if ($("visualIncoming")) $("visualIncoming").textContent = incoming;
        if ($("visualAccepted")) $("visualAccepted").textContent = accepted;
        if ($("visualDropped")) $("visualDropped").textContent = dropped;
        if ($("visualBlocked")) $("visualBlocked").textContent = blocked;
        if ($("visualCapacity")) $("visualCapacity").textContent = capacity;

        if ($("visualStatus")) {
            $("visualStatus").textContent =
                result.message || (
                    dropped > 0
                        ? `${dropped} requests/sec exceed the available capacity in this model.`
                        : "All incoming requests fit within the configured capacity."
                );
        }

        drawNetwork(
            scenario,
            legitimate,
            attackRate,
            sourceCount,
            ratePerSource,
            capacity,
            incoming,
            accepted,
            dropped
        );

        panel.hidden = false;
        panel.classList.remove("is-running");

        void panel.offsetWidth;

        panel.classList.add("is-running");

        panel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    document.addEventListener("simulationCompleted", (event) => {
        if (event.detail && event.detail.result) {
            handleSimulationResult(event.detail.result, event.detail.payload);
        }
    });
})();

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
// 7. INITIAL PAGE SETUP
// ==========================================

renderResources();

// Show the default Normal Traffic results on page load.
displayResults(simulateNormal(20, 100));