# Integration Notes - Person 3: DDoS & Protection

**Experiment:** Demonstrate the DoS and DDoS Attack (CSS Virtual Lab)  
**Author:** Person 3 (DDoS Simulation & Protection Lead)  
**Target Recipient:** Person 4 (Integration Lead) & Person 5 (QA & Demo Lead)  
**Branch:** `feature/ddos-protection-person3`  

---

## 1. Summary of Changes & Isolation Guarantee

All work performed by Person 3 is strictly **isolated** and **additive**.
- **Zero shared files were modified:**
  - `app.py` (untouched)
  - `dos_attack.py` (untouched)
  - `index.html` (untouched)
  - `monitoring.js` (untouched)
  - `styles.css` (untouched)
  - `requirements.txt` (untouched)
  - `DOS-DDOS-LAB-CONTEXT.md` (untouched)
  - `test_app.py` and `test_dos_attack.py` (untouched)
- All Person 3 files reside flat in the repository root beside teammates' files.
- All styles are strictly scoped under the `.ddv-` prefix and themed via CSS variables on `.ddv-root`.
- All JavaScript is wrapped in an IIFE, exporting only `window.DdosView`.

---

## 2. Person 3 Files Added

| File | Purpose |
|---|---|
| `protection.py` | Simulated per-source rate limiter (`allowed_attack_after_limit`) |
| `ddos_attack.py` | Multi-source DDoS simulation (`simulate_ddos`) and illustrative resource estimates (`estimate_resource_usage`) |
| `test_ddos_protection.py` | Unittest suite covering all 9 test criteria, invariants, and validation errors |
| `ddos_lab.html` | Full standalone virtual lab manual page matching the reference template |
| `ddos_view.css` | Scoped styling (`.ddv-`) and CSS variable tokens |
| `ddos_view.js` | UI logic, canvas packet flow simulator, quiz, speech synthesis, and `window.DdosView` API |
| `dev_ddos_server.py` | Isolated local Flask dev server for Person 3 testing on port `5001` |
| `INTEGRATION_NOTES_PERSON3.md` | This integration contract and hand-off specification |

---

## 3. Python Backend Specifications & Function Signatures

### 3.1 `protection.py`
```python
def allowed_attack_after_limit(
    attacker_count: int,
    rate_per_source: int,
    per_source_limit: int
) -> tuple[int, int]:
    """
    Returns:
        tuple[int, int]: (allowed_total, blocked_total)
    
    Guarantees:
        If rate_per_source <= per_source_limit, blocked == 0.
    """
```

### 3.2 `ddos_attack.py`
```python
def estimate_resource_usage(load_ratio: float) -> dict:
    """
    Pure monotonic estimator for illustrative server metrics.
    load_ratio = incoming / capacity
    
    Returns:
        {
            "cpu_percent": float,      # Bounded between 2.0% and 99.0%
            "ram_percent": float,      # Bounded between 20.0% and 95.0%
            "service_state": str,      # "Responsive" (< 0.9) | "Slow" (0.9..1.0) | "Unresponsive" (> 1.0)
            "is_illustrative": True
        }
    """

def simulate_ddos(
    legitimate_rate: int,
    attacker_count: int,
    attack_rate_per_source: int,
    capacity: int,
    protection_enabled: bool = False,
    per_source_limit: int | None = None
) -> dict:
    """
    Multi-source DDoS simulation evaluating offered rate, rate limiting,
    and server capacity drop math.
    """
```

---

## 4. Snippet for Person 4: Wiring `app.py` for `/api/simulate`

To expose the unified `/api/simulate` endpoint or wire DDoS support into `app.py`, Person 4 can add the following snippet to `app.py`:

```python
# =========================================================================
# PERSON 4 INTEGRATION: DDoS Simulation Wiring (Person 3 Module)
# =========================================================================
from ddos_attack import simulate_ddos

@app.route("/ddos")
@app.route("/ddos_lab.html")
def ddos_lab():
    """Serve Person 3's themed DDoS Lab Manual page."""
    return send_from_directory(BASE_DIR, "ddos_lab.html")

@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    """Unified simulation endpoint supporting both DoS and DDoS scenarios."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 400

    data = request.get_json(silent=True) or {}
    scenario = str(data.get("scenario", "ddos")).lower()

    try:
        legitimate_rate = int(data.get("legitimate_rate", 20))
        capacity = int(data.get("capacity", 100))
        protection_enabled = bool(data.get("protection_enabled", False))
        
        per_source_limit_raw = data.get("per_source_limit")
        per_source_limit = (
            int(per_source_limit_raw)
            if per_source_limit_raw is not None and str(per_source_limit_raw).strip() != ""
            else None
        )

        if scenario == "dos":
            attacker_count = 1
            attack_rate_per_source = int(data.get("attack_rate", data.get("attack_rate_per_source", 120)))
        elif scenario == "normal":
            attacker_count = 1
            attack_rate_per_source = 0
            protection_enabled = False
        else: # "ddos"
            attacker_count = int(data.get("attacker_count", 5))
            attack_rate_per_source = int(data.get("attack_rate_per_source", 40))

        result = simulate_ddos(
            legitimate_rate=legitimate_rate,
            attacker_count=attacker_count,
            attack_rate_per_source=attack_rate_per_source,
            capacity=capacity,
            protection_enabled=protection_enabled,
            per_source_limit=per_source_limit
        )
        return jsonify(result), 200

    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": f"Server processing error: {str(err)}"}), 500
```

---

## 5. Sample API Request & Response JSON

### Case A: Unmitigated DDoS Overload
**Request (`POST /api/simulate`):**
```json
{
  "scenario": "ddos",
  "legitimate_rate": 20,
  "attacker_count": 5,
  "attack_rate_per_source": 40,
  "capacity": 100,
  "protection_enabled": false,
  "per_source_limit": null
}
```
**Response (`200 OK`):**
```json
{
  "accepted": 100,
  "attack_incoming": 200,
  "attack_rate_per_source": 40,
  "attacker_count": 5,
  "blocked": 0,
  "capacity": 100,
  "cpu_percent": 98.0,
  "drop_percent": 54.55,
  "dropped": 120,
  "excess_requests": 120,
  "incoming": 220,
  "legitimate_accepted": 9.09,
  "legitimate_incoming": 20,
  "message": "Server capacity (100 req/s) is exceeded by 120 req/s. Unmitigated multi-source traffic (220 req/s) is causing severe denial of service.",
  "offered_total": 220,
  "packets_per_sec": 220,
  "per_source_limit": null,
  "protection_enabled": false,
  "ram_percent": 85.0,
  "scenario": "ddos",
  "service_state": "Unresponsive",
  "status": "Overloaded",
  "utilization_percent": 100.0
}
```

### Case B: DDoS with Per-Source Rate Limiting (10 req/s / source)
**Request (`POST /api/simulate`):**
```json
{
  "scenario": "ddos",
  "legitimate_rate": 20,
  "attacker_count": 5,
  "attack_rate_per_source": 40,
  "capacity": 100,
  "protection_enabled": true,
  "per_source_limit": 10
}
```
**Response (`200 OK`):**
```json
{
  "accepted": 70,
  "attack_incoming": 200,
  "attack_rate_per_source": 40,
  "attacker_count": 5,
  "blocked": 150,
  "capacity": 100,
  "cpu_percent": 69.2,
  "drop_percent": 0.0,
  "dropped": 0,
  "excess_requests": 0,
  "incoming": 70,
  "legitimate_accepted": 20.0,
  "legitimate_incoming": 20,
  "message": "Rate limiting blocked 150 req/s from high-rate sources. Server traffic (70 req/s) is within safe capacity (100 req/s).",
  "offered_total": 220,
  "packets_per_sec": 70,
  "per_source_limit": 10,
  "protection_enabled": true,
  "ram_percent": 65.5,
  "scenario": "ddos",
  "service_state": "Responsive",
  "status": "Normal",
  "utilization_percent": 70.0
}
```

---

## 6. How to Run Tests and Local Servers

### Run Tests:
```bash
python -m pytest -q
```
*Expected:* All 28 tests (18 teammate tests + 10 Person 3 tests + 10 subtests) pass with 100% success.

### Run Person 3 Dev Server (Local Isolated Testing):
```bash
python dev_ddos_server.py
```
*Port:* `http://127.0.0.1:5001/ddos_lab.html`  
(Leaves `app.py` free on port `5050`).

---

## 7. Frontend Integration & CSS Tokens

### Embedding or Linking `ddos_lab.html`:
- To link from `index.html`:
  `<a href="ddos_lab.html" class="nav-link">DDoS & Protection Lab</a>`
- Or include an iframe if tabbed into a single-page app shell.

### JavaScript Public API (`window.DdosView`):
```javascript
// Render a simulation result object into any target container:
window.DdosView.render(document.getElementById("results-wrap"), resultData);

// Reset view, counters, and stop the canvas animation loop:
window.DdosView.reset(document.getElementById("results-wrap"));
```

### CSS Variables for Instant Retheming (on `.ddv-root`):
```css
.ddv-root {
  --ddv-header: #A47764;          /* Brown/terracotta banner */
  --ddv-bg: #FDF3EF;              /* Very light peach page background */
  --ddv-card: #FFFFFF;            /* White container cards */
  --ddv-accent-soft: #EBD9D2;     /* Light terracotta fill */
  --ddv-active-outline: #E5707A;  /* Pink-red active resource card border */
  --ddv-primary: #0B5CAB;         /* Blue pill buttons (Read Aloud, Run) */
  --ddv-next: #A47764;            /* Brown circular Next button */
  --ddv-ok: #15803d;              /* Green Normal status */
  --ddv-warn: #b45309;            /* Amber At Capacity status */
  --ddv-bad: #b91c1c;             /* Red Overloaded status */
}
```

---

## 8. Content Blocks for Person 5 (Viva & Documentation Reuse)

### Theory Block:
> In a Denial of Service (DoS) attack, an adversary generates a massive flood from a single host IP. Because the transmission volume of this IP is disproportionately high, upstream firewalls can easily detect and rate-limit or block it.  
> In contrast, a Distributed Denial of Service (DDoS) attack coordinates thousands of distributed bots (compromised IoT devices or zombie PCs). Each bot transmits at a seemingly normal, low rate (e.g., 5 req/s) that falls below per-source rate limits. However, the aggregate sum across all bots easily overwhelms server capacity. Therefore, per-source rate limiting fails against true DDoS attacks, necessitating Anycast CDNs, cloud scrubbing centers, and behavioral application-layer WAFs.

### Procedure Steps:
1. **Normal Baseline:** 20 req/s legitimate, 0 attack, 100 capacity. Verify 0 drops and Responsive state.
2. **Single-Source DoS:** 20 legit, 1x120 attack, 100 capacity. Observe 40 dropped req/s and Overloaded state.
3. **Unmitigated DDoS:** 20 legit, 5x40 attack (200 attack total), 100 capacity. Observe 120 dropped req/s.
4. **DDoS with Rate Limiting:** Apply 10 req/s limit per source. 150 req/s are blocked, server input drops to 70 req/s, recovering to Normal status.
5. **DDoS Scale Collapse:** Increase bots to 50 with 10 req/s limit. Aggregate allowed traffic reaches 500 req/s, dropping 420 req/s and demonstrating the limits of per-source rate limiting.
