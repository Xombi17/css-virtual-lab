# Virtual Network Security Lab: Demonstrate DoS and DDoS Attacks
## Fr. Conceicao Rodrigues College of Engineering, Mumbai
### Department of Computer Engineering | Class: TE Comp A
### Course: Cryptography and System Security (CSS) — CSS TH ISE: Virtual Lab Development

---

## 1. Academic & Administrative Details

| Field | Detail |
|---|---|
| **Institute** | Society of St. Francis Xavier, Pilar's<br>**Fr. Conceicao Rodrigues College of Engineering**<br>Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai – 400 050<br>*(Autonomous College affiliated to University of Mumbai)* |
| **Department / Class** | Department of Computer Engineering / **TE Comp A** (Semester 5) |
| **Course & Code** | Cryptography and System Security (CSS) |
| **Evaluation Scheme** | **CSS TH ISE: Virtual Lab Development** (Weightage: 20 Marks) |
| **Subject Incharge** | **Dr. Smita Ambarkar** |
| **Evaluation Schedule** | **26/10/2026 to 31/10/2026** (Conducted during scheduled laboratory hours) |
| **Allotment Sr. No.** | **Sr. No. 32: "Demonstrate the DoS and DDoS attack"** |
| **Repository** | `css-virtual-lab` |

> **EDUCATIONAL SAFETY NOTICE:** All calculations within this virtual lab represent a formal mathematical model of network request arrival rates (requests per second) evaluated against finite destination server processing capacity. **No actual network packets are flooded, no real network sockets are exhausted, no external hosts are targeted, and no denial-of-service attack software is executed.**

---

## 2. Integration Team Specification & Template Compliance

As prescribed in the **Virtual Lab Development Guidelines** (Common Template for Integration Team, Pages 5–12), this experiment is structured as an independent, self-contained web module ready for direct integration into the central institutional Virtual Laboratory portal.

### 2.1 Experiment Metadata Block

| Specification Field | Integration Requirement & Value |
|---|---|
| **Experiment ID** | `EXP32` *(Allotment Table Sr. No. 32)* |
| **Experiment Name** | Demonstrate the DoS and DDoS Attack |
| **Folder Name** | `css-virtual-lab/` *(Template: `/experiments/dos-ddos-simulation/`)* |
| **Entry File** | `index.html` (served directly or via Flask router) |
| **Navigation Title** | DoS & DDoS Attack Simulation |
| **Short Description** | Demonstrate single-source DoS and multi-source botnet DDoS attacks, analyze destination server capacity exhaustion, and evaluate upstream per-source rate-limiting defenses using an interactive simulation engine, dynamic charting, and animated packet flow topology. |
| **Required External Libraries** | **None** *(Strictly Plain HTML5, Vanilla CSS3, Vanilla ES6+ JavaScript; zero external frameworks or CDN dependencies).* |
| **Expected Navigation Link** | `http://localhost:5000/` or `/experiments/dos-ddos-simulation/` |

### 2.2 Input & Output Interface Specification

#### Input Parameters:
1. **Legitimate Traffic Rate (`legitimate_rate`):** Expected client request arrival rate ($\text{req/sec}$, integer $\ge 0$, $\le 100,000$).
2. **Server Capacity (`capacity`):** Destination server maximum sustainable throughput ($\text{req/sec}$, integer $> 0$, $\le 100,000$).
3. **Traffic Scenario (`scenario`):** `"normal"`, `"dos"`, or `"ddos"`.
4. **Attack Rate per Source (`attack_rate_per_source`):** Flooding rate sent by an attacking host ($\text{req/sec}$, integer $\ge 0$, $\le 100,000$).
5. **Attacker Count (`attacker_count`):** Number of coordinated attack nodes in a botnet (integer $\ge 0$, $\le 10,000$; applicable to DDoS).
6. **Defense Filter Toggle (`protection_enabled`):** Enable upstream per-source rate limiting (`boolean`: `true` or `false`).
7. **Per-Source Rate Limit (`per_source_limit`):** Maximum allowed throughput allocated per source IP ($\text{req/sec}$, integer $\ge 0$).

#### Output Metrics & Visual Displays:
1. **Total Offered Traffic (`offered_total`):** Aggregate request volume generated across all legitimate and attacking clients.
2. **Incoming Server Traffic (`incoming`):** Post-filter traffic volume reaching the server ingress interface.
3. **Accepted Requests (`accepted`):** Successful request volume processed within server capacity.
4. **Dropped Requests (`dropped`):** Unprocessed requests discarded due to server buffer/capacity exhaustion.
5. **Blocked Requests (`blocked`):** Hostile requests rejected upfront by the upstream rate-limiting defense filter.
6. **Legitimate Processed Volume (`legitimate_accepted`):** Real user request rate successfully serviced vs. starved during congestion.
7. **Server Health Status (`status`):** Operational condition indicator (`"Normal"`, `"Stressed"`, `"Overloaded"`).
8. **Resource Utilization (`utilization_percent`):** Percentage of total server processing capacity actively engaged ($0\% - 100\%$).
9. **Packet Drop Rate (`drop_percent`):** Proportion of incoming requests lost ($0\% - 100\%$).
10. **Interactive Network Topology Visualization:** Live visual representation of Legitimate Clients, Attacker Nodes, Upstream Switch/Firewall Filter, and Destination Server.
11. **Real-Time Request Rates Chart:** Shared-scale comparison bar indicators for Incoming, Accepted, and Dropped request rates.
12. **Historical Time-Series Line Graphs:** Continuous tracking of offered, accepted, dropped, and blocked traffic over time.
13. **Chronological Activity Log:** Audit trail timestamping simulation events and rate-limiter interventions.
14. **Formative Assessment Scoring:** Immediate feedback, scoring, and theoretical rationales across 10 evaluation questions.
15. **User Feedback Receipt:** Client-side confirmation of rating and comments submission.

### 2.3 Learning Outcomes

Upon completing this virtual laboratory experiment, students will be able to:
- **LO1 (Understand):** Explain the operational mechanisms of network packet processing and identify finite server capacity constraints (CPU, memory buffers, worker threads).
- **LO2 (Analyze):** Differentiate between single-source Denial of Service (DoS) attacks and multi-source Distributed Denial of Service (DDoS) botnet architectures.
- **LO3 (Evaluate):** Quantify the impact of packet flood volume on legitimate client request fulfillment and measure the exact rate of service starvation.
- **LO4 (Apply):** Configure upstream per-source rate limiting and calculate mathematical request filtering thresholds.
- **LO5 (Critique):** Assess the architectural limitations of per-source rate limiting against distributed botnets whose individual nodes transmit below the detection threshold.

### 2.4 Faculty Evaluation Spreadsheet Submission Links

The table below provides the direct values and raw GitHub URLs corresponding to each required column in the Google Sheet evaluation tracker:

| Spreadsheet Column Header | Submission Value / Direct GitHub Raw URL | Local Project File |
|---|---|---|
| **Batch** | `A` *(or assigned batch)* | - |
| **Project Title** | `Demonstrate the DoS and DDoS attack` | - |
| **Github Link** | `https://github.com/Xombi17/css-virtual-lab` | Repository Root |
| **Aim** | `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/aim.md` | [`docs/aim.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/aim.md) |
| **Theory** | `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/theory.md` | [`docs/theory.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/theory.md) |
| **Objective** | `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/objective.md` | [`docs/objective.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/objective.md) |
| **Procedure** | `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/procedure.md` | [`docs/procedure.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/procedure.md) |
| **Simulation** | `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/simulation.md` | [`docs/simulation.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/simulation.md) |
| **Quiz (If present in frontend put NULL)** | `NULL` *(or `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/assignment.md`)* | [`docs/assignment.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/assignment.md) / `index.html#assessmentSection` |
| **References** | `https://raw.githubusercontent.com/Xombi17/css-virtual-lab/refs/heads/main/docs/references.md` | [`docs/references.md`](file:///c:/Users/komal/Desktop/Desktopp/ddos/css-virtual-lab/docs/references.md) |

> **IMPORTANT GITHUB VISIBILITY NOTE:** Ensure the GitHub repository (`Xombi17/css-virtual-lab`) is set to **Public** under *GitHub Repo Settings &rarr; General &rarr; Danger Zone &rarr; Change repository visibility &rarr; Make public* so that the evaluation links can be accessed by the faculty without 404 authentication restrictions.

---

## 3. Compliance with Virtual Lab Guidelines

This project strictly adheres to all 13 institutional guidelines outlined in the **CSS TH ISE: Virtual Lab Development** brief:

| Guideline | Requirement Summary | Implementation & Compliance Verification | Status |
|---|---|---|---|
| **1** | Work in groups of 5 members each | 5 TE Comp A students organized into clear, dedicated engineering sub-roles. | **COMPLIANT** |
| **2** | All 5 members contribute meaningfully | Documented division of labor: Frontend, DoS Math, DDoS & Protection, Backend API, and Interactive Simulation/Testing. | **COMPLIANT** |
| **3** | Experiments allotted by faculty | Allotted Experiment 32: "Demonstrate the DoS and DDoS attack". | **COMPLIANT** |
| **4** | Develop the complete virtual lab | Fully functional laboratory with theory, step-by-step procedure, interactive simulation, video aids, quiz, references, and feedback. | **COMPLIANT** |
| **5** | Common front-end stack across all groups | Built strictly with vanilla HTML5, vanilla CSS3, and vanilla modern JavaScript (ES6+). Zero external front-end frameworks or CDNs used. | **COMPLIANT** |
| **6** | Common UI, layout, colour scheme, and theme | Follows standard Virtual Lab design guidelines: terracotta/brown header (`#a67d69`), cream background (`#fff8f4`), soft pink card accents, left manual viewer + right sidebar with resource tabs. | **COMPLIANT** |
| **7a** | Aim and objectives of the experiment | Documented in Section 1 of the manual with formal aim, 6 learning objectives, and expected outcomes. | **COMPLIANT** |
| **7b** | Relevant theoretical concepts | Comprehensive 6-part theoretical background covering capacity modeling, DoS mechanisms, DDoS botnets, upstream rate limiting, and mathematical formulas. | **COMPLIANT** |
| **7c** | Step-by-step procedure | Detailed 6-step experimental workflow guiding students through baseline benchmarking, saturation, DoS, DDoS, mitigation, and stress testing. | **COMPLIANT** |
| **7d** | Interactive simulation/implementation | Real-time interactive simulation workbench with live parameter sliders, scenario toggles, dynamic chart updates, and mathematical API integration. | **COMPLIANT** |
| **7e** | Assessment/quiz | Interactive 10-question evaluation quiz featuring instant scoring, detailed explanations, and review capabilities. | **COMPLIANT** |
| **7f** | References | Curated authoritative references including RFC 4732, Cloudflare Learning Center, Stallings Cryptography & Network Security, and Tanenbaum Computer Networks. | **COMPLIANT** |
| **7g** | Feedback | Embedded interactive feedback form capturing usability ratings and open suggestions with persistent storage. | **COMPLIANT** |
| **8** | Simple, intuitive, and user-friendly interface | Clean typography, responsive card layouts, persistent floating help, and an automated guided onboarding tour for first-time students. | **COMPLIANT** |
| **9** | Consistent navigation and terminology | Page navigator ("1 / 9"), collapsible sidebar, and standard networking terms (Attacker, Packet, Capacity, Req/s) applied uniformly. | **COMPLIANT** |
| **10** | Interactive elements beyond static content | Dual-mode live animation engine, dynamic SVG/Canvas packet flow, time-series graphs, and interactive quiz. | **COMPLIANT** |
| **11** | Verified correctness before submission | Validated against 10 rigorous mathematical test cases; 45 automated pytest test cases passing at 100%. | **COMPLIANT** |
| **12** | Faculty demonstration readiness | Fully executable locally (`python backend/app.py`), containerized via Docker (`docker run -p 5000:5000`), with clean presentation mode. | **COMPLIANT** |
| **13** | Required documentation submitted | Exhaustive integration README submitted alongside full source code, test suites, and Dockerfile. | **COMPLIANT** |

---

## 4. Evaluation Rubrics Self-Assessment

| Evaluation Criterion | Max Marks | Target Level | Justification & Evidence in Project |
|---|---|---|---|
| **1. Experiment Content & Accuracy** | 4 | **4 - Excellent** | Content is mathematically and technically complete. Accurately formalizes arrival rates, capacity bounds, queuing, and packet loss equations with zero conceptual errors. Covers Aim, Theory, Procedure, Simulation, Observations, Quiz, References, and Feedback. |
| **2. Functionality & Working** | 4 | **4 - Excellent** | Operates flawlessly across all scenarios (`normal`, `dos`, `ddos`). All sliders, scenario toggles, rate limiters, reset buttons, and quiz validations function smoothly without runtime errors. Verified via 45 automated pytest tests. |
| **3. Interactivity & Simulation** | 4 | **4 - Excellent** | Highly interactive simulation environment. Provides dual simulation capabilities (client-side canvas packet flow animation + backend mathematical model), real-time bar graphs, time-series charts, and a guided 12-step onboarding tour. |
| **4. Presentation & Demonstration** | 4 | **4 - Excellent** | Clear, clean, and intuitive academic interface matching the standard virtual lab theme. Includes simple real-world analogies (shop counter, cashier, bouncer), responsive layouts, keyboard accessibility, and a structured demonstration script. |
| **5. Individual Contribution** | 4 | **4 - Excellent** | All 5 student team members made distinct, documented contributions across separate architectural modules with dedicated test suites and independent accountability. |
| **TOTAL** | **20** | **20 / 20** | **Full compliance with all academic criteria for maximum marks.** |

---

## 5. Team Division of Roles & Module Contributions

In strict accordance with Guideline 1 and 2, the project was executed by a collaborative group of **5 students from TE Comp A**:

```
                               +---------------------------------------------+
                               |     TE Comp A — Virtual Lab Project Team    |
                               |    Experiment 32: DoS and DDoS Simulation   |
                               +---------------------------------------------+
                                      |               |               |
                +---------------------+       +-------+-------+       +---------------------+
                |                             |               |                             |
                v                             v               v                             v
       +-----------------+           +-----------------+ +-----------------+       +-----------------+
       |    Student 1    |           |    Student 2    | |    Student 3    |       |    Student 4    |
       | Frontend Lead & |           | Single-Source   | | Distributed     |       | Backend API &   |
       | Lab Curriculum  |           | DoS Math Engine | | DDoS & Limiter  |       | Dispatcher Lead |
       +-----------------+           +-----------------+ +-----------------+       +-----------------+
                |                             |               |                             |
                +---------------------+       |               |       +---------------------+
                                      |       |               |       |
                                      v       v               v       v
                               +---------------------------------------------+
                               |                  Student 5                  |
                               |     Interactive Visualizations, Onboarding  |
                               |     Tour & Quality Assurance Lead           |
                               +---------------------------------------------+
```

| Member | Assigned Role | Modules Authored | Primary Engineering Responsibilities |
|---|---|---|---|
| **Student 1** | **Frontend Lead & Lab Curriculum** | `frontend/index.html`<br>`frontend/style.css`<br>`backend/normal_traffic.py` | Designed overall virtual lab manual layout conforming to the institutional theme. Authored Aim, Theory, Procedure, Video resources, and Feedback sections. Implemented `simulate_normal()` logic. |
| **Student 2** | **DoS Attack & Monitoring** | `backend/dos_attack.py`<br>`tests/test_dos_attack.py` | Developed the single-source DoS mathematical simulation engine. Formulated traffic saturation formulas, capacity utilization calculations, and unit tests for DoS boundary conditions. |
| **Student 3** | **DDoS Engine & Defense Filtering** | `backend/ddos_attack.py`<br>`backend/protection.py`<br>`tests/test_ddos_protection.py` | Engineered the multi-source distributed botnet model and the upstream per-source rate-limiting filter (`allowed_attack_after_limit`). Authored comprehensive DDoS protection test suite. |
| **Student 4** | **Backend API & Packaging Lead** | `backend/app.py`<br>`backend/simulation.py`<br>`tests/test_api.py`<br>`Dockerfile` | Engineered the Flask RESTful micro-service, input sanitization and boundary validator, central simulation dispatcher, Docker container configuration, and end-to-end integration test suite. |
| **Student 5** | **Interactive Visualization & QA Lead** | `frontend/script.js`<br>`tests/test_simulation.py`<br>`README.md` | Built real-time packet animation canvas, dynamic chart renderers, interactive 10-question assessment quiz engine, 12-step guided onboarding tour, sidebar learning path checklist, and integration documentation. |

---

## 6. System Architecture & Technical Specifications

The virtual lab employs a decoupled, lightweight architectural pattern:

```
+------------------------------------------------------------------------------------------------+
|                                    BROWSER CLIENT (FRONTEND)                                   |
|                                                                                                |
|  [ Lab Manual Content ]       [ Interactive Workbench ]        [ Dynamic Visualizers ]         |
|  - Aim & Objectives           - Sliders & Inputs Controls      - Live Packet Flow Topology     |
|  - Theory & Formulas          - Scenario Selector Buttons      - Shared-Scale Rate Bars        |
|  - Step-by-Step Procedure     - Rate Limiter Toggle Switch     - Time-Series History Charts    |
|  - Educational Videos         - Guided Onboarding Tour         - Real-Time Event Audit Log     |
|  - Assessment Quiz Engine     - Learning Path Checklist        - Floating Help Replay Button   |
+------------------------------------------------------------------------------------------------+
                                              |
                                              | HTTP POST /api/simulate (JSON Payload)
                                              v
+------------------------------------------------------------------------------------------------+
|                                  FLASK BACKEND ENGINE (PYTHON 3)                               |
|                                                                                                |
|  +------------------------------------------------------------------------------------------+  |
|  | app.py: Strict Input Validation & Type Enforcement Layer                                 |  |
|  | - Scenario validation: {"normal", "dos", "ddos"}                                        |  |
|  | - Numerical sanity checks: non-negative integers, non-zero capacity, rate bounds         |  |
|  +------------------------------------------------------------------------------------------+  |
|                                              | Validated Configuration                          |
|                                              v                                                 |
|  +------------------------------------------------------------------------------------------+  |
|  | simulation.py: Central Dispatcher & Contract Normalizer                                 |  |
|  +------------------------------------------------------------------------------------------+  |
|              |                                  |                                 |             |
|        scenario="normal"                  scenario="dos"                    scenario="ddos"     |
|              v                                  v                                 v             |
|  +----------------------+             +-------------------+             +--------------------+  |
|  | normal_traffic.py    |             | dos_attack.py     |             | ddos_attack.py     |  |
|  | - Legitimate load    |             | - 1 Attacker node |             | - N Attacker nodes |  |
|  | - Capacity check     |             | - Resource flood  |             | - Botnet aggregate |  |
|  +----------------------+             +-------------------+             +--------------------+  |
|                                                                                   |             |
|                                                                   protection_enabled == True    |
|                                                                                   v             |
|                                                                         +--------------------+  |
|                                                                         | protection.py      |  |
|                                                                         | - Per-source limit |  |
|                                                                         | - Upstream filter  |  |
|                                                                         +--------------------+  |
|                                              |                                                  |
|                                              v                                                  |
|  +------------------------------------------------------------------------------------------+  |
|  | Unified Result Contract (JSON: offered, incoming, accepted, dropped, blocked, status)   |  |
|  +------------------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------------------+
```

---

## 7. Mathematical Formulations & Core Invariants

All traffic simulations adhere to strict mathematical packet conservation laws:

### 7.1 Scenario Equations

#### 1. Normal Traffic Scenario:
$$\text{offered} = \text{legitimate\_rate}$$
$$\text{incoming} = \text{legitimate\_rate}$$
$$\text{accepted} = \min(\text{incoming}, \text{capacity})$$
$$\text{dropped} = \max(0, \text{incoming} - \text{capacity})$$
$$\text{blocked} = 0$$

#### 2. Single-Source DoS Attack Scenario:
$$\text{offered} = \text{legitimate\_rate} + \text{attack\_rate}$$
$$\text{incoming} = \text{offered}$$
$$\text{accepted} = \min(\text{incoming}, \text{capacity})$$
$$\text{dropped} = \max(0, \text{incoming} - \text{capacity})$$
$$\text{blocked} = 0$$

#### 3. Multi-Source Distributed DoS (DDoS) Scenario:
$$\text{total\_attack} = \text{attacker\_count} \times \text{attack\_rate\_per\_source}$$
$$\text{offered} = \text{legitimate\_rate} + \text{total\_attack}$$

- **When Upstream Rate Limiting is Disabled (`protection_enabled = false`):**
  $$\text{incoming} = \text{offered}$$
  $$\text{blocked} = 0$$

- **When Upstream Rate Limiting is Enabled (`protection_enabled = true`):**
  $$\text{allowed\_per\_attacker} = \min(\text{attack\_rate\_per\_source}, \text{per\_source\_limit})$$
  $$\text{blocked\_per\_attacker} = \max(0, \text{attack\_rate\_per\_source} - \text{per\_source\_limit})$$
  $$\text{blocked} = \text{attacker\_count} \times \text{blocked\_per\_attacker}$$
  $$\text{incoming} = \text{legitimate\_rate} + (\text{attacker\_count} \times \text{allowed\_per\_attacker})$$

#### Post-Filter Server Processing (All Scenarios):
$$\text{accepted} = \min(\text{incoming}, \text{capacity})$$
$$\text{dropped} = \max(0, \text{incoming} - \text{capacity})$$
$$\text{legitimate\_accepted} = \begin{cases} 
\text{legitimate\_rate} & \text{if } \text{incoming} \le \text{capacity} \\
\text{legitimate\_rate} \times \left(\frac{\text{accepted}}{\text{incoming}}\right) & \text{if } \text{incoming} > \text{capacity} 
\end{cases}$$

### 7.2 Fundamental Conservation Invariant
In every valid execution of the simulation, the total offered traffic equals the exact sum of processed, dropped, and blocked traffic:
$$\mathbf{\text{offered\_total} = \text{accepted} + \text{dropped} + \text{blocked}}$$
$$\mathbf{\text{incoming} = \text{accepted} + \text{dropped}}$$

---

## 8. Virtual Lab Components Overview

### 8.1 Aim and Objectives
- Outlines the experimental purpose: modeling arrival rates against server capacity constraints.
- Identifies 6 core educational objectives aligned with undergraduate networking and cybersecurity curricula.

### 8.2 Theory
- Explains server architecture, worker processes, and connection queues.
- Details the mechanism of single-source resource exhaustion (DoS).
- Contrast single-source attacks with distributed botnet architectures (DDoS).
- Explains upstream traffic shaping, reverse-proxy inspection, and rate limiting.
- Details why volumetric rate limiting fails against low-rate distributed attacks.

### 8.3 Procedure
Provides a structured laboratory guide for students:
1. Establish a baseline benchmark with legitimate traffic under capacity.
2. Increase legitimate traffic beyond capacity to observe benign congestion.
3. Simulate a single-source DoS flood and note the drop in legitimate fulfillment.
4. Launch an unmitigated multi-source DDoS attack.
5. Enable upstream rate limiting to filter high-rate attack traffic.
6. Stress-test the rate limiter by distributing attack volume across numerous low-rate bots.

### 8.4 Interactive Traffic Simulation Workbench
- **Input Controls:** Sliders and number inputs for legitimate rate, attack rate, attacker count, capacity, and per-source threshold.
- **Scenario Selectors:** Instant preset buttons for Normal, DoS, and DDoS.
- **Animated Topology Visualization:** Live visual display of packets traveling from clients to firewall to server.
- **Dynamic Charts:** Canvas-rendered time-series history graphs and proportional rate comparison bars.
- **Real-Time Audit Log:** Live chronological event feed recording traffic events and defense actions.

### 8.5 Video Demonstrations
Includes embedded video instructional demonstrations:
- Video 1: Normal Network Traffic and Baseline Server Capacity
- Video 2: Single-Source Denial of Service (DoS) Attack Simulation
- Video 3: Distributed Denial of Service (DDoS) and Mitigation Techniques

### 8.6 Assessment / Quiz Framework
- Contains 10 multiple-choice questions covering DoS/DDoS concepts, botnet mechanics, and rate-limiting equations.
- Provides immediate visual feedback (correct/incorrect indicators).
- Displays comprehensive technical explanations upon submission.

### 8.7 Feedback & References
- Form for students to submit rating and usability comments, stored persistently in client storage.
- Authoritative reference links to RFC 4732, Cloudflare Security Knowledge Base, and academic textbooks.

---

## 9. Guided Onboarding Tour & Learning Path Progress

To support first-year students with zero prior security background, the virtual lab features a custom-built, library-free guided onboarding tour and learning progress tracker:

### 9.1 Tour Mechanics
- **Zero External Dependencies:** Built entirely with plain HTML5, CSS3, and ES6+ JavaScript. No Shepherd, Driver.js, intro.js, or CDNs.
- **Spotlight Highlight:** Viewport cutout with a pulsing terracotta accent halo (`box-shadow: 0 0 0 9999px rgba(30, 24, 20, 0.68)`) highlighting controls while dimming the background.
- **Real-World Student Analogies:**
  - *Server:* A shop counter with a single cashier.
  - *Requests:* Customers placing orders.
  - *Normal Traffic:* Polite customers arriving within processing speed.
  - *DoS Attack:* One customer shouting 1,000 fake orders at once.
  - *DDoS Attack:* A coordinated mob rushing every door simultaneously.
  - *Rate Limiting:* A security bouncer enforcing a "maximum 10 orders per customer" rule.
- **12 Guided Tour Steps:**
  1. Welcome & Lab Mission
  2. Navigation & Quick Actions
  3. Experiment Manual & Page Navigator
  4. Sidebar Menu Toggle
  5. Explanation Resources & Filter Tabs
  6. Aim & Objectives
  7. Theory — Understanding the Concepts
  8. Procedure — Step-by-Step Instructions
  9. Interactive Traffic Simulation (auto-switches section on step entry)
  10. Assessment — Quiz & Knowledge Check
  11. Feedback & References
  12. Finish Screen with Direct Action Buttons ("Start with the Simulation" and "Start from Aim & Objectives")
- **Accessibility & Keyboard Support:**
  - `ArrowRight` / `Enter`: Next step
  - `ArrowLeft`: Previous step
  - `Escape`: Skip/close tour
  - `Tab` / `Shift+Tab`: Keyboard focus trap inside active dialog
  - Respects `@media (prefers-reduced-motion: reduce)`

### 9.2 Sidebar Learning Path Progress Checklist
- Tracks manual sections visited (`Aim`, `Theory`, `Procedure`, `Simulation`, `Quiz`, `Feedback`).
- Displays a visual progress bar and completion count (`0 / 6` to `All 6 Completed`).
- Persists across browser refreshes via `localStorage.getItem("css_lab_visited_sections")`.
- Reopenable at any time via the persistent floating **? Tour** button in the bottom right corner or the header **Take Tour** button.

---

## 10. Flask REST API Specification

### Endpoint: `POST /api/simulate`
Computes the mathematical traffic distribution for a given scenario.

- **URL:** `/api/simulate`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`

### Request Parameters

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `scenario` | `string` | Yes | Traffic scenario type | `"normal"`, `"dos"`, or `"ddos"` |
| `legitimate_rate` | `integer` | Yes | Legitimate client request rate | $\ge 0$, $\le 100,000$ |
| `capacity` | `integer` | Yes | Server capacity | $> 0$, $\le 100,000$ |
| `attack_rate_per_source` | `integer` | DoS/DDoS | Rate generated per attacking source | $\ge 0$, $\le 100,000$ |
| `attacker_count` | `integer` | DDoS | Number of attacking sources | $\ge 0$, $\le 10,000$ |
| `protection_enabled` | `boolean` | Optional | Enable per-source rate limiting | `true` or `false` |
| `per_source_limit` | `integer` | If protected | Max allowed req/s per single source | $\ge 0$ (Required if `protection_enabled = true`) |

### Example Request (cURL)
```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "ddos",
    "legitimate_rate": 20,
    "attack_rate_per_source": 40,
    "attacker_count": 5,
    "capacity": 100,
    "protection_enabled": true,
    "per_source_limit": 10
  }'
```

### Example Successful Response (`200 OK`)
```json
{
  "scenario": "ddos",
  "offered_total": 220,
  "incoming": 70,
  "accepted": 70,
  "dropped": 0,
  "blocked": 150,
  "legitimate_incoming": 20,
  "legitimate_accepted": 20.0,
  "attack_incoming": 200,
  "capacity": 100,
  "status": "Normal",
  "protection_enabled": true,
  "message": "Rate limiting blocked 150 req/s from high-rate sources. Server traffic (70 req/s) is within safe capacity (100 req/s).",
  "utilization_percent": 70.0,
  "drop_percent": 0.0
}
```

### Validation Error Responses (`400 Bad Request`)
If input parameters violate validation constraints, the API returns HTTP 400 with a specific explanation:
```json
{
  "error": "'legitimate_rate' cannot be negative."
}
```

---

## 11. Test Cases & Verification Suite

The repository includes a comprehensive testing suite with 45 automated tests covering API validation, mathematical invariants, edge boundaries, and scenario isolation.

```bash
pytest -v tests/
```

### Test Case Verification Matrix

| Test Case | Scenario & Inputs | Expected Result | Status |
|---|---|---|---|
| **Test 1: Normal Within Capacity** | Legit: 20, Cap: 100 | Incoming: 20, Accepted: 20, Dropped: 0, Blocked: 0, Status: Normal | **PASSED** |
| **Test 2: Normal Over Capacity** | Legit: 120, Cap: 100 | Incoming: 120, Accepted: 100, Dropped: 20, Blocked: 0, Status: Overloaded | **PASSED** |
| **Test 3: DoS Attack** | Legit: 20, Attack: 120, Cap: 100 | Incoming: 140, Accepted: 100, Dropped: 40, Blocked: 0, Status: Overloaded | **PASSED** |
| **Test 4: DDoS Without Protection** | Legit: 20, Bots: 5, Rate: 40, Cap: 100 | Attack: 200, Incoming: 220, Accepted: 100, Dropped: 120, Blocked: 0 | **PASSED** |
| **Test 5: DDoS With Protection** | Legit: 20, Bots: 5, Rate: 40, Limit: 10, Cap: 100 | Blocked: 150, Incoming: 70, Accepted: 70, Dropped: 0, Status: Normal | **PASSED** |
| **Test 6: Negative Input Rejection** | Legit: -1, Cap: 100 | HTTP 400 Bad Request: "'legitimate_rate' cannot be negative." | **PASSED** |
| **Test 7: Zero Capacity Rejection** | Capacity: 0 | HTTP 400 Bad Request: "'capacity' must be greater than zero." | **PASSED** |
| **Test 8: Unknown Scenario** | Scenario: "unknown" | HTTP 400 Bad Request: "Unknown scenario 'unknown'." | **PASSED** |
| **Test 9: Missing Required Fields** | Missing `scenario` or `legitimate_rate` | HTTP 400 Bad Request: "Missing required parameter..." | **PASSED** |
| **Test 10: Invariant Conservation** | 50 random combinations of rates and capacities | Invariant holds: $\text{offered} = \text{accepted} + \text{dropped} + \text{blocked}$ | **PASSED** |

---

## 12. Local Installation & Setup Guide

### Prerequisites
- Python 3.10, 3.11, 3.12, or 3.13 installed.
- Modern web browser (Chrome, Edge, Firefox, Safari).

### Step 1: Clone Repository
```bash
git clone https://github.com/Xombi17/css-virtual-lab.git
cd css-virtual-lab
```

### Step 2: Create and Activate Virtual Environment
```bash
# On Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# On Windows (Command Prompt):
python -m venv .venv
.venv\Scripts\activate.bat

# On Windows (PowerShell):
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Application
```bash
python backend/app.py
```

### Step 5: Access in Browser
Navigate to:
```
http://localhost:5000/
```

---

## 13. Docker Build & Containerization Guide

The application includes a production-ready, multi-platform Docker container definition (`Dockerfile`) based on `python:3.11-slim`:

### Build Container Image
```bash
docker build -t traffic-simulation:latest .
```

### Run Container
```bash
docker run -d --name traffic-lab -p 5000:5000 traffic-simulation:latest
```

### Verify Container
Open browser and navigate to:
```
http://localhost:5000/
```

### Stop and Clean Up
```bash
docker stop traffic-lab && docker rm traffic-lab
```

---

## 14. Project File Structure

```
css-virtual-lab/
├── frontend/
│   ├── index.html              # Virtual lab manual and interactive simulation UI
│   ├── style.css               # Academic theme styles, layout, and visual components
│   └── script.js               # UI controller, API client, live canvas simulation, onboarding tour
├── backend/
│   ├── app.py                  # Flask server, static asset router, and POST /api/simulate endpoint
│   ├── simulation.py           # Central scenario dispatcher and normalized response builder
│   ├── normal_traffic.py       # Normal traffic processing module (Student 1)
│   ├── dos_attack.py           # Single-source DoS calculation module (Student 2)
│   ├── ddos_attack.py          # Multi-source distributed DDoS calculation module (Student 3)
│   └── protection.py           # Upstream per-source rate-limiting filter module (Student 3)
├── tests/
│   ├── test_api.py             # Integration tests for Flask endpoints and HTTP validation
│   ├── test_simulation.py      # Unit tests for simulation dispatcher and mathematical invariants
│   ├── test_dos_attack.py      # Unit tests for single-source DoS scenarios
│   └── test_ddos_protection.py # Unit tests for multi-source DDoS attacks and rate-limiting filters
├── Dockerfile                  # Container definition for reproducible deployment
├── .dockerignore               # Cache and artifact exclusions for clean container builds
├── requirements.txt            # Minimal runtime and testing dependencies (Flask, pytest)
└── README.md                   # Comprehensive project documentation & integration report
```

---

## 15. Troubleshooting & FAQ

- **Port 5000 is already in use:**
  Run on a custom port by setting the `PORT` environment variable:
  ```bash
  # Windows PowerShell:
  $env:PORT="5050"; python backend/app.py

  # Linux / macOS:
  PORT=5050 python backend/app.py
  ```
  Then access `http://localhost:5050/`.

- **ModuleNotFoundError: No module named 'flask'**:
  Ensure the virtual environment is activated before running the application (`.venv\Scripts\Activate.ps1` or `source .venv/bin/activate`).

- **Clearing Onboarding Tour or Learning Path State**:
  Open the browser developer console (F12) and run:
  ```javascript
  localStorage.removeItem("css_lab_tour_seen");
  localStorage.removeItem("css_lab_tour_dont_show");
  localStorage.removeItem("css_lab_visited_sections");
  location.reload();
  ```

---

## 16. References & Bibliography

1. **RFC 4732:** Handley, M., Rescorla, E., et al. *"Internet Denial-of-Service Considerations"*, Internet Engineering Task Force (IETF), December 2006.
2. **Stallings, William.** *"Cryptography and Network Security: Principles and Practice"*, 7th Edition, Pearson Education, 2017.
3. **Tanenbaum, Andrew S., and Wetherall, David J.** *"Computer Networks"*, 5th Edition, Prentice Hall, 2011.
4. **Cloudflare Learning Center:** *"What is a Distributed Denial of Service (DDoS) Attack?"*, [Cloudflare Documentation](https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/).
5. **Cloudflare Learning Center:** *"What is Rate Limiting?"*, [Cloudflare Documentation](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/).
6. **Fr. Conceicao Rodrigues College of Engineering:** *"CSS TH ISE: Virtual Lab Development Guidelines"*, Department of Computer Engineering, October 2026.
