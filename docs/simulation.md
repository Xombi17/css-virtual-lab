# SIMULATION

## 1. Simulation Environment Overview

The **DoS and DDoS Attack Simulation** virtual lab features a dual-engine architecture designed for interactive education and mathematical rigor:

1. **Client-Side Real-Time Animation Engine (`frontend/script.js`):**
   * Renders continuous, animated packet streams traversing from client nodes through network routing middleboxes to the destination server.
   * Dynamically tracks traffic dynamics on shared-scale comparison bars and historical time-series line graphs.
   * Simulates immediate local response changes for interactive learning.

2. **Server-Side RESTful Mathematical Dispatcher (`backend/app.py` & `backend/simulation.py`):**
   * Exposes a high-performance REST endpoint (`POST /api/simulate`).
   * Validates input parameters against strict boundary and type constraints.
   * Executes deterministic scenario modules (`normal_traffic.py`, `dos_attack.py`, `ddos_attack.py`, `protection.py`).
   * Returns a normalized JSON contract detailing traffic breakdown, capacity utilization, packet drops, and server health status.

---

## 2. Simulation Parameters & Controls

| Control | Type | Default | Range / Values | Description |
|---|---|---|---|---|
| **Legitimate Traffic Rate** | Number / Slider | `20` req/s | $0 - 100,000$ | Expected benign client request rate. |
| **Destination Server Capacity** | Number / Slider | `100` req/s | $1 - 100,000$ | Maximum request processing rate sustainable by server hardware. |
| **Scenario Selector** | Radio / Buttons | `normal` | `normal`, `dos`, `ddos` | Selects the active operational traffic scenario. |
| **DoS Attack Rate** | Number / Slider | `120` req/s | $0 - 100,000$ | Flooding rate transmitted by a single hostile attacking host. |
| **Rate per Attacker (DDoS)** | Number / Slider | `40` req/s | $0 - 100,000$ | Volume generated per compromised botnet node. |
| **Attacker Count (DDoS)** | Number / Slider | `5` bots | $1 - 10,000$ | Number of concurrent distributed attacking hosts. |
| **Enable Upstream Rate Limiting** | Checkbox / Toggle | `false` | `true`, `false` | Activates upstream firewall / reverse proxy per-source threshold filtering. |
| **Max Rate per Source** | Number / Slider | `10` req/s | $0 - 100,000$ | Maximum allowed request rate permitted from any individual IP before filtering. |

---

## 3. Interactive Visualization Components

1. **Network Topology Map:**
   * **Legitimate Clients:** Illustrated as desktop workstations sending green request packets.
   * **Attacker Hosts / Botnet Nodes:** Illustrated as red compromised laptop/terminal nodes transmitting hostile packet bursts.
   * **Upstream Switch / Firewall:** Middlebox inspecting packets. When rate limiting is active, excess attack packets are visibly blocked with gold indicator shields.
   * **Destination Server:** Core datacenter rack icon with dynamic health status badges:
     * **Normal (Green):** Utilization $\le 80\%$.
     * **Stressed (Amber):** Utilization between $80\%$ and $100\%$.
     * **Overloaded (Red):** Incoming traffic exceeds capacity; active packet dropping.

2. **Metrics Display Grid:**
   * **Offered Total:** Aggregate volume requested across all sources.
   * **Incoming:** Post-filter traffic arriving at server network interface.
   * **Accepted:** Total requests successfully processed within capacity.
   * **Dropped:** Requests discarded due to capacity exhaustion.
   * **Blocked:** Malicious packets rejected upstream by rate-limiting rules.
   * **Legitimate Processed:** Proportion of honest user requests fulfilled vs. starved.

3. **Dynamic Charts:**
   * **Shared-Scale Comparison Bars:** Visualizes Incoming, Accepted, and Dropped rates side-by-side on an identical scale.
   * **Time-Series History Line Chart:** Continuously plots incoming, accepted, dropped, and blocked traffic trends over time.

4. **Real-Time Audit Log:**
   * Timestamped event feed recording scenario shifts, threshold triggers, and server health status updates.

---

## 4. Required Simulation Test Cases & Verification

The mathematical simulation engine is verified against 10 canonical test cases:

| Test Case | Scenario & Configuration | Expected Outputs | Verification Status |
|---|---|---|---|
| **Test 1: Normal Traffic Within Capacity** | Legit: 20, Cap: 100 | Incoming: 20, Accepted: 20, Dropped: 0, Blocked: 0, Status: Normal | **PASSED** |
| **Test 2: Normal Traffic Over Capacity** | Legit: 120, Cap: 100 | Incoming: 120, Accepted: 100, Dropped: 20, Blocked: 0, Status: Overloaded | **PASSED** |
| **Test 3: Single-Source DoS Attack** | Legit: 20, Attack: 120, Cap: 100 | Offered: 140, Accepted: 100, Dropped: 40, Legit Processed: 14.3, Status: Overloaded | **PASSED** |
| **Test 4: DDoS (No Protection)** | Legit: 20, Bots: 5, Rate: 40, Cap: 100 | Attack: 200, Incoming: 220, Accepted: 100, Dropped: 120, Blocked: 0, Status: Overloaded | **PASSED** |
| **Test 5: DDoS (With Rate Limiting)** | Legit: 20, Bots: 5, Rate: 40, Limit: 10, Cap: 100 | Blocked: 150, Incoming: 70, Accepted: 70, Dropped: 0, Legit Processed: 20, Status: Normal | **PASSED** |
| **Test 6: Negative Input Rejection** | Legit: -10, Cap: 100 | HTTP 400 Bad Request, clear error message | **PASSED** |
| **Test 7: Zero Capacity Rejection** | Capacity: 0 | HTTP 400 Bad Request, clear error message | **PASSED** |
| **Test 8: Unknown Scenario** | Scenario: "random" | HTTP 400 Bad Request, clear error message | **PASSED** |
| **Test 9: Missing Parameters** | Payload missing required keys | HTTP 400 Bad Request, clear error message | **PASSED** |
| **Test 10: Invariant Conservation** | 50 random combinations | $\text{offered} = \text{accepted} + \text{dropped} + \text{blocked}$ strictly holds | **PASSED** |

---

## 5. Execution Instructions

### Local Execution:
```bash
# Activate virtual environment
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows

# Start Flask application server
python backend/app.py

# Access in browser
http://localhost:5000/
```

### Docker Container Execution:
```bash
docker build -t traffic-simulation:latest .
docker run -d -p 5000:5000 --name traffic-lab traffic-simulation:latest
```
