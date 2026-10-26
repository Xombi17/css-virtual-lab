# PROCEDURE

Follow these step-by-step instructions to execute the laboratory experiment:

---

### Step 1: Start the Virtual Lab Application
1. Open a terminal in the project directory.
2. Ensure Python 3.10+ is available and start the local lab server:
   ```bash
   python backend/app.py
   ```
   *(Or launch via Docker container: `docker run -p 5000:5000 traffic-simulation:latest`)*
3. Open your web browser and navigate to:
   ```
   http://localhost:5000/
   ```
4. If this is your first visit, the **Guided Onboarding Tour** will automatically launch to explain the controls. You may step through the 12 tour steps or click **Skip tour**.

---

### Step 2: Baseline Benchmark (Normal Traffic within Capacity)
1. In the right-hand **Explanation Resources** sidebar, click on **Interactive Traffic Simulation** (or use the page navigator to reach Section 4).
2. Set the input parameters to default baseline values:
   * **Legitimate traffic:** `20` req/sec
   * **Server capacity:** `100` req/sec
   * **Scenario:** Click **Normal**
3. Click the **Run Simulation** button (or observe live traffic updates).
4. **Observations:**
   * Total Offered = $20 \text{ req/sec}$
   * Incoming = $20 \text{ req/sec}$
   * Accepted = $20 \text{ req/sec}$
   * Dropped = $0 \text{ req/sec}$
   * Server status indicates **Normal** (Utilization: $20\%$).
   * Green packet flow indicators travel continuously from Legitimate Users through the switch to the Server.

---

### Step 3: Benign Demand Congestion (Legitimate Traffic Over Capacity)
1. Keep the scenario as **Normal**.
2. Increase **Legitimate traffic** to `120` req/sec while keeping **Server capacity** at `100` req/sec.
3. **Observations:**
   * Incoming = $120 \text{ req/sec}$
   * Accepted = $100 \text{ req/sec}$ (capped at capacity)
   * Dropped = $20 \text{ req/sec}$ (overflow rejected due to queue saturation)
   * Server status transitions to **Overloaded** (Utilization: $100\%$, Drop Rate: $16.7\%$).
   * Red drop markers indicate packets discarded at the server ingress queue.

---

### Step 4: Single-Source Denial of Service (DoS) Attack
1. Reset **Legitimate traffic** to `20` req/sec.
2. Select the **DoS** scenario button.
3. Configure the attack parameter:
   * **DoS attack rate:** `120` req/sec (single attacker)
   * **Server capacity:** `100` req/sec
4. Ensure **Enable upstream rate limiting** is **unchecked**.
5. **Observations:**
   * Offered Total = $140 \text{ req/sec}$ ($20 \text{ legit} + 120 \text{ attack}$)
   * Incoming = $140 \text{ req/sec}$
   * Accepted = $100 \text{ req/sec}$, Dropped = $40 \text{ req/sec}$
   * Server status: **Overloaded**
   * **Legitimate requests served:** Drops from $20$ down to $\approx 14.3 \text{ req/sec}$ ($28.5\%$ legitimate user request loss).
   * Notice that a single hostile client is successfully starving legitimate users of server resources.

---

### Step 5: Multi-Source Distributed Denial of Service (DDoS) Attack
1. Select the **DDoS** scenario button.
2. Configure the distributed attack parameters:
   * **Legitimate traffic:** `20` req/sec
   * **Attack rate per source:** `40` req/sec
   * **Attacker count (bots):** `5` attacking nodes
   * **Server capacity:** `100` req/sec
3. Ensure **Enable upstream rate limiting** is **unchecked**.
4. **Observations:**
   * Total attack volume = $5 \times 40 = 200 \text{ req/sec}$
   * Total Offered = $220 \text{ req/sec}$ ($20 \text{ legit} + 200 \text{ attack}$)
   * Incoming = $220 \text{ req/sec}$
   * Accepted = $100 \text{ req/sec}$, Dropped = $120 \text{ req/sec}$
   * Server status: **Overloaded** ($54.5\%$ total packet drop rate).
   * Legitimate requests processed drops to under $9.1 \text{ req/sec}$, demonstrating severe Denial of Service caused by distributed bot traffic.

---

### Step 6: Mitigate DDoS with Upstream Per-Source Rate Limiting
1. While maintaining the DDoS scenario above, check the **Enable upstream rate limiting** toggle.
2. Set the threshold parameter:
   * **Max rate per source:** `10` req/sec
3. **Observations:**
   * Each of the 5 attacking bots sending $40 \text{ req/sec}$ has $30 \text{ req/sec}$ rejected by the upstream filter ($5 \times 30 = 150 \text{ req/sec}$ **Blocked**).
   * Filtered Incoming reaching server = $20 \text{ (legit)} + (5 \times 10 \text{ attack}) = 70 \text{ req/sec}$.
   * Accepted = $70 \text{ req/sec}$, Dropped = $0 \text{ req/sec}$.
   * Server status recovers to **Normal** (Utilization: $70\%$, Drop Rate: $0\%$).
   * Legitimate processed rate returns to $100\%$ ($20 \text{ of } 20 \text{ req/sec}$).
   * The upstream firewall/proxy successfully neutralizes the flood before packets touch the origin server.

---

### Step 7: Evaluate Defense Limitations (Sub-Threshold Botnet Attack)
1. Keep **Enable upstream rate limiting** checked with limit = `10` req/sec.
2. Reconfigure the attack parameters to simulate a distributed, low-rate botnet:
   * Increase **Attacker count (bots):** to `25`
   * Decrease **Attack rate per source:** to `8` req/sec (below the $10 \text{ req/sec}$ limit)
3. **Observations:**
   * Aggregate attack volume $= 25 \times 8 = 200 \text{ req/sec}$.
   * Because every individual bot node transmits below the $10 \text{ req/sec}$ threshold, **Blocked = 0 req/sec**!
   * Filtered Incoming = $220 \text{ req/sec}$, Accepted = $100 \text{ req/sec}$, Dropped = $120 \text{ req/sec}$.
   * Server returns to **Overloaded** state, proving that per-source volumetric rate limiting cannot protect against distributed low-rate attacks without behavioral inspection.

---

### Step 8: Complete Assessment Quiz & Feedback
1. In the sidebar, click **Assessment - Quiz**.
2. Answer all 10 evaluation questions and click **Submit Quiz** to receive instant scoring and explanations.
3. Click **Feedback & References** to record your lab session feedback and review authoritative cybersecurity literature.
