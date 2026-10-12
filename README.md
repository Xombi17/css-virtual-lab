# Traffic Simulation Project: Demonstrate DoS and DDoS Attacks
### Educational Web Simulation Virtual Lab

**Course:** Cryptography and System Security (CSS)  
**Experiment:** Demonstrate the DoS and DDoS Attack  
**Scope:** Educational Mathematical Simulation & Web Interface  

---

## 1. Project Title and Objective

**Title:** Traffic Simulation Project — Demonstrate DoS and DDoS Attacks: Educational Web Simulation  
**Objective:** Provide an interactive, browser-accessible virtual lab that models server capacity limits under ordinary user traffic, single-source Denial of Service (DoS) attacks, multi-source Distributed Denial of Service (DDoS) attacks, and the operational effect of per-source rate-limiting defenses.

> **EDUCATIONAL NOTICE:** All calculations represent a mathematical model of request arrival rates (requests per second) evaluated against server capacity. **No actual network packets are flooded, no external servers are targeted, and no real DoS/DDoS tools are executed.**

---

## 2. Educational Purpose and Scope

In computer network security, understanding how request floods overwhelm destination servers is critical:
- **Server Capacity Modeling:** Servers possess finite request handling capacity (CPU, memory, worker threads, network bandwidth).
- **Legitimate Traffic vs. Flooding:** Normal operations process legitimate user requests smoothly within available capacity limits.
- **Single-Source DoS:** One hostile host pumps excessive traffic, consuming shared server resources and leading to packet/request drops.
- **Multi-Source DDoS:** Multiple distributed nodes (such as botnet devices) concurrently transmit requests.
- **Upstream Rate Limiting:** Firewalls and reverse proxies can enforce per-client request thresholds to filter anomalous individual volumes before requests hit origin servers.
- **Limitations of Rate Limiting:** This educational tool demonstrates why per-source rate limits succeed against single high-rate sources but fail against large-scale distributed attacks where each bot stays under the threshold.

---

## 3. Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Mocha/terracotta academic lab theme), Vanilla JavaScript (ES6+).
- **Backend:** Python 3 (Flask RESTful micro-framework).
- **Testing:** pytest automated testing suite.
- **Containerization:** Docker (`python:3.11-slim` base image).

---

## 4. Project Folder Structure

```
virtual-lab/
├── frontend/
│   ├── index.html              # Virtual lab manual and interactive simulation UI
│   ├── style.css               # Responsive lab styling, topology styles, and tokens
│   └── script.js               # UI controls, API client, DOM update logic, quiz
├── backend/
│   ├── app.py                  # Flask server, static router, POST /api/simulate endpoint
│   ├── simulation.py           # Central dispatcher and contract normalizer
│   ├── normal_traffic.py       # Person 1 normal traffic simulation
│   ├── dos_attack.py           # Person 2 single-source DoS math module
│   ├── ddos_attack.py          # Person 3 multi-source DDoS math module
│   └── protection.py           # Person 3 per-source rate limiter module
├── tests/
│   ├── test_api.py             # Integration tests for Flask endpoints and HTTP validation
│   ├── test_simulation.py      # Unit tests for dispatcher and mathematical invariants
│   ├── test_dos_attack.py      # Unit tests for Person 2 DoS calculations
│   └── test_ddos_protection.py  # Unit tests for Person 3 DDoS & protection logic
├── Dockerfile                  # Container definition for containerized deployment
├── .dockerignore               # Artifacts and cache exclusions for clean builds
├── requirements.txt            # Minimal runtime and testing dependencies
└── README.md                   # Comprehensive project documentation
```

---

## 5. System Architecture and Data Flow

```
                      +-----------------------------+
                      |   Browser Client (UI)       |
                      |   index.html + script.js    |
                      +--------------+--------------+
                                     |
                                     | POST /api/simulate (JSON)
                                     v
                      +-----------------------------+
                      |      Flask API (app.py)     |
                      |  Strict Request Validation  |
                      +--------------+--------------+
                                     |
                                     | Validated Settings
                                     v
                      +-----------------------------+
                      |   Dispatcher: simulation.py |
                      +--------------+--------------+
                             /       |       \
               scenario="normal"     |        scenario="ddos"
                           /    scenario="dos" \
                          v          |          v
         +-------------------+       |   +---------------------+
         | normal_traffic.py |       |   |   ddos_attack.py    |
         +-------------------+       |   +----------+----------+
                                     v              |
                             +---------------+      | (if protection_enabled)
                             | dos_attack.py |      v
                             +---------------+ +---------------------+
                                               |    protection.py    |
                                               +---------------------+
                                     |
                                     v
                      +-----------------------------+
                      | Unified Result Dictionary   |
                      | (Normalized Contract)       |
                      +--------------+--------------+
                                     |
                                     | JSON Response (200 OK)
                                     v
                      +-----------------------------+
                      | Browser UI Dashboard Render |
                      | (Cards, Bars, Topology SVG) |
                      +-----------------------------+
```

---

## 6. Team Division of Roles

| Member | Focus Area | Contributed Modules | Responsibilities |
|---|---|---|---|
| **Person 1** | Frontend UI & Normal Traffic | `frontend/`, `normal_traffic.py` | Built lab manual sections (Aim, Theory, Procedure, Assessment, Feedback), core page styles, interactive inputs, and `simulate_normal()`. |
| **Person 2** | DoS Attack & Monitoring | `dos_attack.py`, `test_dos_attack.py` | Authored `simulate_dos()`, single-source attack calculations, and metrics. |
| **Person 3** | DDoS & Protection | `ddos_attack.py`, `protection.py`, `test_ddos_protection.py` | Implemented multi-source DDoS attack calculations, per-source rate limiting filter `allowed_attack_after_limit()`, and test cases. |
| **Person 4** | Flask API, Integration & Packaging | `app.py`, `simulation.py`, `test_api.py`, `test_simulation.py`, `Dockerfile`, `README.md` | Built `POST /api/simulate` API, input validation, dispatcher normalization, integrated frontend with API, Dockerization, and full test suite. |

---

## 7. Flask API Documentation

### Endpoint: `POST /api/simulate`
Executes a simulation scenario and evaluates server load.

- **Headers:** `Content-Type: application/json`
- **Supported Scenarios:** `"normal"`, `"dos"`, `"ddos"`

### Request Parameters:

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `scenario` | string | Yes | Target traffic scenario | `"normal"`, `"dos"`, or `"ddos"` |
| `legitimate_rate` | integer | Yes | Legitimate client request rate | $\ge 0$, $\le 100,000$ |
| `capacity` | integer | Yes | Destination server capacity | $> 0$, $\le 100,000$ |
| `attack_rate_per_source` | integer | For DoS/DDoS | Attack rate generated per attacking node | $\ge 0$, $\le 100,000$ |
| `attacker_count` | integer | For DDoS | Number of attacking sources | $\ge 0$, $\le 10,000$ |
| `protection_enabled` | boolean | Optional | Enable per-source rate limiting | `true` or `false` |
| `per_source_limit` | integer | If protected | Max allowed req/s per single source | $\ge 0$ (Required if `protection_enabled` is true) |

### Validation & Error Responses:
Invalid requests return **HTTP 400 Bad Request** with a readable explanation:
```json
{
  "error": "'legitimate_rate' cannot be negative."
}
```

---

## 8. Example Request & Response

### Example Request (`POST /api/simulate`):
```json
{
  "scenario": "ddos",
  "legitimate_rate": 20,
  "attack_rate_per_source": 40,
  "attacker_count": 5,
  "capacity": 100,
  "protection_enabled": true,
  "per_source_limit": 10
}
```

### Example Successful Response (`200 OK`):
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

---

## 9. Local Installation and Setup

### Prerequisites:
- Python 3.10+ installed on your system.

### Step 1: Create and Activate a Virtual Environment
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

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the Local Application
```bash
python backend/app.py
```

### Step 4: Access in Browser
Open your browser and navigate to:
```
http://localhost:5000/
```

---

## 10. Running Automated Tests

Run the full pytest suite (including API, dispatcher, and unit test suites):
```bash
pytest -v tests/
```
All 45 automated tests will execute and verify scenario calculations, invariants, and error boundaries.

---

## 11. Docker Build and Run Instructions

### Build Docker Image:
```bash
docker build -t traffic-simulation:latest .
```

### Run Container:
```bash
docker run -d --name traffic-lab -p 5000:5000 traffic-simulation:latest
```

### Test in Browser:
Navigate to `http://localhost:5000/`.

### Stop and Remove Container:
```bash
docker stop traffic-lab && docker rm traffic-lab
```

*(Note: On Linux, ensure your user has Docker permissions via `sudo usermod -aG docker $USER` or execute Docker commands with `sudo` if the Docker daemon socket restricts access).*

---

## 12. Explanation of Scenarios

### 1. Normal Traffic
- Only legitimate requests are transmitted.
- If incoming rate $\le$ capacity, all requests are **accepted** and zero are dropped.
- If legitimate requests exceed server capacity, excess requests are **dropped** due to resource exhaustion.

### 2. Single-Source DoS Attack
- A single attacking client floods requests in addition to legitimate requests.
- Offered traffic: $\text{offered} = \text{legitimate\_rate} + \text{attack\_rate}$.
- Because both traffic streams compete for capacity, the server becomes overloaded and drops excess requests.

### 3. Distributed Denial of Service (DDoS)
- Multiple attack sources (bots) contribute attack traffic simultaneously.
- Offered attack volume: $\text{attack\_incoming} = \text{attacker\_count} \times \text{attack\_rate\_per\_source}$.
- Combined incoming traffic rapidly exceeds server capacity.

### 4. Per-Source Rate Limiting Defense
- An upstream filter enforces a maximum allowed threshold per source IP ($\text{per\_source\_limit}$).
- Any traffic from a source exceeding the threshold is rejected upfront as **blocked**:
  $$\text{blocked} = \text{attacker\_count} \times \max(0, \text{attack\_rate\_per\_source} - \text{per\_source\_limit})$$
- Post-protection traffic reaching the server:
  $$\text{incoming} = \text{legitimate\_rate} + (\text{attack\_incoming} - \text{blocked})$$
- Requests within server capacity are **accepted**; any remaining volume above capacity is **dropped**.

---

## 13. Required Simulation Test Cases & Verification

| Test Case | Scenario & Inputs | Expected Result | Status |
|---|---|---|---|
| **Test 1: Normal Traffic** | Legit: 20, Capacity: 100 | Incoming: 20, Accepted: 20, Dropped: 0, Blocked: 0, Status: Normal | **PASSED** |
| **Test 2: Normal Over Capacity** | Legit: 120, Capacity: 100 | Incoming: 120, Accepted: 100, Dropped: 20, Blocked: 0, Status: Overloaded | **PASSED** |
| **Test 3: DoS Attack** | Legit: 20, Attack: 120, Cap: 100 | Incoming: 140, Accepted: 100, Dropped: 40, Attack Incoming: 120, Status: Overloaded | **PASSED** |
| **Test 4: DDoS (No Protection)** | Legit: 20, Bots: 5, Rate: 40, Cap: 100 | Attack: 200, Incoming: 220, Accepted: 100, Dropped: 120, Blocked: 0, Status: Overloaded | **PASSED** |
| **Test 5: DDoS (With Protection)** | Legit: 20, Bots: 5, Rate: 40, Limit: 10, Cap: 100 | Blocked: 150, Incoming: 70, Accepted: 70, Dropped: 0, Status: Normal | **PASSED** |
| **Test 6: Negative Input** | Legit: -1, Capacity: 100 | HTTP 400 Bad Request, clear message | **PASSED** |
| **Test 7: Zero Capacity** | Capacity: 0 | HTTP 400 Bad Request, clear message | **PASSED** |
| **Test 8: Unknown Scenario** | Scenario: "unknown" | HTTP 400 Bad Request, clear message | **PASSED** |
| **Test 9: Missing Fields** | Payload missing required fields | HTTP 400 Bad Request, clear message | **PASSED** |
| **Test 10: Sequential Isolation** | Multiple alternating scenario runs | No state leakage across sequential calls | **PASSED** |

---

## 14. Assumptions and Limitations

1. **Simplified Mathematical Model:** Arrival rates and capacity are measured in discrete requests per second (req/s). It does not emulate low-level TCP handshakes (SYN/ACK), IP header checksums, raw socket buffers, or latency distributions.
2. **Ideal Classification Assumption:** In the rate-limiting model, the upstream filter cleanly separates attack sources from legitimate requests. In real-world networks, attackers spoof IP addresses or use botnets where individual rates mimic legitimate browsing, making rate limiting alone insufficient.
3. **Classroom Scope:** Built strictly for educational demonstrations within computer engineering virtual laboratory curricula.

---

## 15. Troubleshooting

- **ModuleNotFoundError: No module named 'flask'**  
  Ensure your virtual environment is active (`source .venv/bin/activate` or `.venv\Scripts\activate`) before running `python backend/app.py`.
- **Port 5000 already in use:**  
  Set a custom port before starting:
  ```bash
  PORT=5050 python backend/app.py
  ```
  and access `http://localhost:5050/`.
- **Frontend changes not appearing:**  
  Hard refresh your browser (`Ctrl + Shift + R` or `Cmd + Shift + R`) to clear cached CSS/JavaScript.
