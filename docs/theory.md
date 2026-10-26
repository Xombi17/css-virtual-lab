# THEORY

## 1. Network Traffic and Server Capacity

In computer network security, network traffic refers to the data packets and requests transmitted between client computers and destination servers. A server is an endpoint designed to process incoming requests and respond with the requested resources (web pages, database records, API responses).

Every physical or virtual server operates with finite processing capacity, bounded by:
* **CPU Processing Power:** Time required to parse request headers, execute business logic, and compute responses.
* **Available Memory & Buffers:** RAM allocated for OS network socket buffers (`SO_RCVBUF`), connection tracking tables, and application heaps.
* **Worker Threads & Connection Pools:** Maximum concurrent worker processes or event-loop handles (e.g., Apache MPM worker threads, NGINX worker connections).
* **Network Bandwidth:** Ingress link throughput (e.g., 1 Gbps NIC interface).

In this educational mathematical model, server capacity is represented as a discrete scalar threshold:
$$\text{capacity} \quad (\text{measured in requests per second, req/s})$$

---

## 2. Normal Traffic Behavior

Under normal network operating conditions, legitimate clients issue requests at varying rates depending on user activity.

### A. Under-Capacity Operation ($\text{legitimate\_rate} \le \text{capacity}$)
* The destination server smoothly handles all client traffic.
* **Formulas:**
  $$\text{incoming} = \text{legitimate\_rate}$$
  $$\text{accepted} = \text{incoming}$$
  $$\text{dropped} = 0$$
  $$\text{blocked} = 0$$
  $$\text{server status} = \text{"Normal"}$$
* **Result:** $100\%$ of legitimate client requests are serviced with zero packet drops.

### B. Over-Capacity Congestion ($\text{legitimate\_rate} > \text{capacity}$)
* When benign demand spikes (e.g., flash crowds or ticket sales), the server reaches $100\%$ resource utilization.
* **Formulas:**
  $$\text{accepted} = \text{capacity}$$
  $$\text{dropped} = \text{incoming} - \text{capacity}$$
  $$\text{server status} = \text{"Overloaded"}$$
* **Result:** The server processes requests up to its capacity limit; excess requests are dropped due to buffer exhaustion.

---

## 3. Single-Source Denial of Service (DoS)

### A. Conceptual Architecture
A **Denial of Service (DoS)** attack occurs when a single malicious host deliberately floods a target server with an overwhelming volume of rapid requests.

```
+-------------------+
|  Legitimate Users | -------\
+-------------------+         \
                               +-------------------+       +--------------------+
                               | Upstream Network  | ----> | Destination Server |
+-------------------+         / (Router / Switch)  |       | (Finite Capacity)  |
| Attacking Host    | -------/                             +--------------------+
| (1 Attacker Node) | (High-Rate Flood)
+-------------------+
```

### B. Mathematical Model
* $\text{offered} = \text{legitimate\_rate} + \text{attack\_rate}$
* $\text{incoming} = \text{offered}$
* $\text{accepted} = \min(\text{incoming}, \text{capacity})$
* $\text{dropped} = \max(0, \text{incoming} - \text{capacity})$

### C. Impact on Legitimate Users (Service Starvation)
Because the server queue does not distinguish malicious requests from benign requests in an unmitigated environment, legitimate traffic is starved proportionally:
$$\text{legitimate\_accepted} = \text{legitimate\_rate} \times \left(\frac{\text{accepted}}{\text{incoming}}\right)$$
* **Example:** With $\text{capacity} = 100$, $\text{legitimate} = 20$, and $\text{attack} = 120$:
  * Total $\text{incoming} = 140 \text{ req/s}$
  * Total $\text{accepted} = 100 \text{ req/s}$, Total $\text{dropped} = 40 \text{ req/s}$
  * Legitimate accepted $= 20 \times (100 / 140) \approx 14.3 \text{ req/s}$
  * Legitimate users experience a $28.5\%$ drop rate despite benign behavior.

---

## 4. Multi-Source Distributed Denial of Service (DDoS)

### A. Conceptual Architecture & Botnets
A **Distributed Denial of Service (DDoS)** attack amplifies the attack scale by utilizing a distributed network of compromised machines (**botnet**), infected with malware and remotely commanded by an attacker (Botmaster) via Command-and-Control (C2) channels.

```
+--------------------+
|  Legitimate Users  | --------\
+--------------------+          \
                                 \
+--------------------+            \
| Botnet Node 1      | -----\      \
+--------------------+       \      \
+--------------------+        \      +-------------------+       +--------------------+
| Botnet Node 2      | --------+---> | Upstream Network  | ----> | Destination Server |
+--------------------+        /      | (Router / Switch)  |       | (Finite Capacity)  |
+--------------------+       /      / +-------------------+       +--------------------+
| Botnet Node N      | -----/      /
+--------------------+            /
| (Distributed Bots) |           /
+--------------------+ ---------/
```

### B. Mathematical Model
* $\text{total\_attack} = \text{attacker\_count} \times \text{attack\_rate\_per\_source}$
* $\text{offered} = \text{legitimate\_rate} + \text{total\_attack}$

In an unmitigated DDoS scenario ($\text{protection\_enabled} = \text{false}$):
* $\text{incoming} = \text{offered}$
* If $\text{incoming} > \text{capacity}$, massive packet loss occurs and the server enters the **Overloaded** state.

---

## 5. Upstream Defense: Per-Source Rate Limiting

### A. Defense Mechanism
To protect origin servers from being overwhelmed, network engineers deploy upstream protective middleboxes (such as firewalls, reverse proxies, API gateways, or scrubbing centers).

**Per-Source Rate Limiting** is an inline traffic policy that enforces an upper bound on the number of requests accepted from any individual client IP address within a unit of time:
$$\text{per\_source\_limit} \quad (\text{req/s allowed per source IP})$$

```
+-------------------+
| Attacker Node     | ---> [ Upstream Filter: Threshold = 10 ] ---> 10 req/s Allowed ---> Server
| (Sending 40 req/s)|      | Rejects excess (30 req/s Blocked) |
+-------------------+
```

### B. Mathematical Formulation
For each attack node transmitting at rate $R_{\text{attack}}$:
$$\text{allowed\_per\_source} = \min(R_{\text{attack}}, \text{per\_source\_limit})$$
$$\text{blocked\_per\_source} = \max(0, R_{\text{attack}} - \text{per\_source\_limit})$$

Across all $N$ attacking bot nodes:
$$\text{blocked} = N \times \max(0, R_{\text{attack}} - \text{per\_source\_limit})$$
$$\text{incoming} = \text{legitimate\_rate} + (N \times \text{allowed\_per\_source})$$
$$\text{accepted} = \min(\text{incoming}, \text{capacity})$$
$$\text{dropped} = \max(0, \text{incoming} - \text{capacity})$$

### C. Fundamental Conservation of Traffic Law
In every state of the simulation, traffic conservation is rigorously satisfied:
$$\mathbf{\text{offered\_total} = \text{accepted} + \text{dropped} + \text{blocked}}$$
$$\mathbf{\text{incoming} = \text{accepted} + \text{dropped}}$$

---

## 6. Architectural Limitations of Rate Limiting

While per-source rate limiting is highly effective against high-rate individual flooders, it has fundamental limitations against large-scale distributed attacks:

1. **Sub-Threshold Botnet Bypass:**
   If an attacker commands $1,000$ bots and instructs each bot to transmit at only $5 \text{ req/s}$ (below a rate limit of $10 \text{ req/s}$), the filter permits every packet through ($\text{blocked} = 0$). The resulting aggregate volume ($5,000 \text{ req/s}$) completely overwhelms the origin server.
2. **IP Address Spoofing:**
   In UDP and ICMP flood attacks, source IP addresses can be forged, preventing the filter from accurately tracking per-host state.
3. **Collateral Damage (False Positives):**
   Legitimate users behind large corporate NAT gateways or shared university proxies share a single public IP address, causing honest users to be mistakenly throttled.

**Conclusion:** Comprehensive defense requires multi-tiered security, combining rate limiting with Web Application Firewalls (WAF), CAPTCHA verification, IP reputation intelligence, Anycast routing, and behavioral anomaly detection.
