# ASSESSMENT & EVALUATION QUESTIONS

This document contains the complete question bank for **Experiment 32: Demonstrate the DoS and DDoS Attack**. These questions are also interactively rendered with real-time scoring in the virtual lab interface (`#assessmentSection`).

---

### Question 1: Fundamental Conceptual Difference
**What is the fundamental architectural difference between a Denial of Service (DoS) attack and a Distributed Denial of Service (DDoS) attack?**
* [ ] A) DoS targets the network layer (Layer 3), while DDoS exclusively targets the application layer (Layer 7).
* [x] **B) DoS originates from a single attacking source, whereas DDoS utilizes multiple distributed sources (a botnet).**
* [ ] C) DoS uses encrypted packets, whereas DDoS uses unencrypted plaintext packets.
* [ ] D) DoS is accidental network congestion, whereas DDoS is always malicious.

**Explanation:** In a DoS attack, an adversary generates flood traffic from a single host IP address. In a DDoS attack, the adversary coordinates an army of geographically dispersed compromised devices (botnets) to flood the target simultaneously from multiple origins.

---

### Question 2: Packet Drop Mechanics
**What causes network packets or client requests to be dropped by the destination server in this simulation?**
* [ ] A) A software bug in the network routing table.
* [x] **B) The aggregate incoming request rate exceeds the destination server's processing capacity.**
* [ ] C) The client browser closes the HTTP connection prematurely.
* [ ] D) The upstream firewall blocks all non-HTTP requests automatically.

**Explanation:** Servers possess finite worker threads, CPU time, and network buffer queues. When total incoming request volume exceeds the server's rated capacity ($\text{incoming} > \text{capacity}$), the excess packets cannot be scheduled for processing and are discarded (dropped).

---

### Question 3: Upstream Rate Limiting Principle
**How does an upstream per-source rate limiter mitigate an ongoing request flood?**
* [ ] A) By dynamically increasing the server's CPU clock frequency and RAM.
* [x] **B) By discarding requests from any individual source IP that exceed a predefined threshold before they reach the server.**
* [ ] C) By encrypting all inbound packets with RSA public keys.
* [ ] D) By rerouting all traffic to a fake dummy website.

**Explanation:** Upstream rate limiting enforces a maximum request rate per source IP (e.g., $10 \text{ req/s}$). Any traffic exceeding this quota is dropped at the network edge (firewall/proxy), preventing hostile volume from saturating the server's resources.

---

### Question 4: DDoS Quantitative Analysis (No Mitigation)
**Suppose a destination server has a capacity of $100 \text{ req/s}$. Legitimate traffic is $20 \text{ req/s}$, and $5$ botnet attackers each send $40 \text{ req/s}$ with rate limiting disabled. What is the result?**
* [ ] A) The server handles all traffic without dropping any packets.
* [ ] B) Total incoming traffic is $100 \text{ req/s}$ and $0$ packets are dropped.
* [x] **C) Total incoming traffic is $220 \text{ req/s}$; the server is overloaded and drops $120 \text{ req/s}$, starving legitimate users.**
* [ ] D) The server automatically blocks the attackers without configuration.

**Explanation:** Total offered traffic $= 20 \text{ (legitimate)} + (5 \times 40 \text{ attack}) = 220 \text{ req/s}$. With a capacity of $100 \text{ req/s}$, $120 \text{ req/s}$ are dropped, and legitimate users experience heavy service starvation.

---

### Question 5: Rate Limiting Architectural Vulnerability
**What is a primary architectural limitation of per-source volumetric rate limiting against sophisticated DDoS attacks?**
* [ ] A) Rate limiters require expensive GPUs to process incoming packets.
* [x] **B) It cannot prevent server exhaustion if thousands of bots each transmit volume just below the per-source threshold.**
* [ ] C) It only works on wireless Wi-Fi networks and fails on Ethernet.
* [ ] D) It completely shuts down the origin server whenever an attack is detected.

**Explanation:** If each bot in a large botnet of $1,000$ nodes sends only $5 \text{ req/s}$ while the threshold is $10 \text{ req/s}$, zero packets are blocked. The aggregate $5,000 \text{ req/s}$ floods the server unimpeded.

---

### Question 6: Server Health State
**What operational status is reported when incoming traffic is less than or equal to server capacity ($\text{incoming} \le \text{capacity}$)?**
* [x] **A) Normal (Safe operating conditions, $0\%$ drop rate).**
* [ ] B) Critical (Server shutdown imminent).
* [ ] C) Under Attack.
* [ ] D) Suspended.

**Explanation:** When total incoming request volume does not exceed the server's rated capacity, all requests are serviced smoothly with zero drops, corresponding to the **Normal** state.

---

### Question 7: Proportional Starvation of Honest Traffic
**What happens to legitimate users during an unmitigated attack when the server is operating under heavy overload?**
* [ ] A) Legitimate requests receive priority treatment over attack requests automatically.
* [ ] B) Legitimate users are unaffected because their packets are marked "friendly".
* [x] **C) Legitimate requests compete equally in the FIFO queue and are proportionally dropped alongside attack requests.**
* [ ] D) The operating system automatically bans all foreign IP addresses.

**Explanation:** Without advanced identity verification or upstream filtering, network routers process packets on a Best-Effort basis. Malicious packets outnumber benign packets, leading to proportional starvation of legitimate requests.

---

### Question 8: Botnet Infrastructure
**What is a "botnet" in the context of Distributed Denial of Service attacks?**
* [ ] A) An automated chatbot used in customer service.
* [x] **B) A network of compromised Internet-connected devices remotely controlled by an attacker to launch coordinated floods.**
* [ ] C) A specialized server rack designed for high-performance scientific computing.
* [ ] D) An antivirus engine deployed inside a network firewall.

**Explanation:** A botnet comprises internet-connected computers, servers, or IoT devices that have been infected with malware and enlisted into a command-and-control network to perform malicious actions on command.

---

### Question 9: Upstream Filtering vs. Origin Server Dropping
**Why is dropping malicious flood packets upstream (at a reverse proxy or firewall) vastly superior to dropping them on the origin server?**
* [ ] A) Origin servers do not have operating system firewalls installed.
* [x] **B) Upstream filtering prevents abusive packets from saturating the origin server's network bandwidth and CPU socket buffers.**
* [ ] C) Dropping packets upstream automatically traces and arrests the attacker.
* [ ] D) Server-side packet dropping permanently corrupts the database.

**Explanation:** If flood traffic reaches the origin server's network interface card, it has already consumed link bandwidth and OS kernel interrupts. Upstream filtering terminates the flood before it ever touches the server's infrastructure.

---

### Question 10: Quantitative Mitigation Verification
**Given: Server Capacity = $100 \text{ req/s}$, Legitimate Rate = $20 \text{ req/s}$, $5$ Attackers sending $40 \text{ req/s}$ each. If an Upstream Rate Limiter is enabled with a threshold of $10 \text{ req/s}$, what is the final server state?**
* [ ] A) Overloaded, because total offered traffic is $220 \text{ req/s}$.
* [x] **B) Normal, because $150 \text{ req/s}$ are blocked upstream, leaving $70 \text{ req/s}$ incoming, which is safely below $100 \text{ req/s}$.**
* [ ] C) Offline, because rate limiting consumes $100\%$ of server memory.
* [ ] D) Stressed, because exactly $100 \text{ req/s}$ reach the server.

**Explanation:** Each of the 5 bots is restricted to $10 \text{ req/s}$ ($5 \times 10 = 50 \text{ req/s}$ allowed; $5 \times 30 = 150 \text{ req/s}$ blocked). Total incoming reaching server $= 20 \text{ (legitimate)} + 50 \text{ (allowed attack)} = 70 \text{ req/s}$. Since $70 \le 100$, Accepted $= 70$, Dropped $= 0$, and status is **Normal**.
