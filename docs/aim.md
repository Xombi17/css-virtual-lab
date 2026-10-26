# AIM

To simulate and analyze normal network traffic, single-source **Denial of Service (DoS)** attacks, and multi-source **Distributed Denial of Service (DDoS)** attacks against a destination server with finite request handling capacity, and to evaluate how **upstream per-source rate limiting** mitigates volumetric request floods while preserving service availability for legitimate users.

---

### Core Focus Points:
* **Finite Server Capacity & Queuing:** Understand how web and application servers possess fixed worker threads, socket buffers, and CPU cycles that impose a hard ceiling on sustainable requests per second (req/s).
* **Single-Source DoS Floods:** Demonstrate how a single aggressive host transmitting high-rate requests competes for shared server capacity, causing severe packet drops and service degradation for legitimate users.
* **Distributed Botnet DDoS Floods:** Demonstrate how a coordinated network of distributed attacking nodes (botnets) aggregates overwhelming traffic volume to exhaust server resources.
* **Upstream Per-Source Rate Limiting:** Show how reverse proxies and upstream firewall filters enforce strict request thresholds per client IP to drop abusive volume before traffic reaches the origin server.
* **Defense Limitations:** Analyze the critical threshold conditions under which volumetric rate limiting succeeds against high-rate attack sources but fails against large-scale distributed attacks where individual bot rates remain beneath the filtering limit.
