# OBJECTIVES

After completing this virtual lab experiment, you will be able to:

* **Understand Network Traffic & Capacity Limits:**
  * Explain how client requests travel across computer networks to destination servers.
  * Model server request handling capacity in discrete requests per second ($\text{req/s}$) and identify system constraints (CPU cores, memory, socket buffers, thread pools).

* **Demonstrate Normal Traffic Operations:**
  * Benchmark server throughput under ordinary conditions where incoming legitimate request rates are within the server's rated capacity ($\text{incoming} \le \text{capacity}$).
  * Observe benign congestion when legitimate user demand exceeds total processing capacity, resulting in queued or dropped requests.

* **Simulate Single-Source Denial of Service (DoS):**
  * Demonstrate how an attacker from a single IP address sends an overwhelming volume of rapid requests.
  * Quantify legitimate request starvation as malicious and benign traffic compete for finite server processing slots.

* **Simulate Multi-Source Distributed Denial of Service (DDoS):**
  * Model a distributed botnet where multiple compromised zombie nodes simultaneously flood the target server under the direction of an attacker.
  * Calculate aggregate attack volume: $\text{offered attack} = \text{attacker\_count} \times \text{attack\_rate\_per\_source}$.

* **Implement Upstream Per-Source Rate Limiting Defense:**
  * Configure an upstream network firewall or reverse proxy filter with a maximum allowed threshold per source IP ($\text{per\_source\_limit}$).
  * Demonstrate how malicious traffic exceeding the threshold is blocked upfront before it reaches the origin server, restoring server health and legitimate user fulfillment.

* **Critically Analyze Rate Limiting Limitations:**
  * Evaluate attack scenarios where an adversary distributes a massive aggregate attack across hundreds of bot nodes, each transmitting below the per-source limit threshold.
  * Understand why volumetric threshold rate limiting alone is insufficient against sophisticated distributed botnets and why multi-layered defenses (WAF, behavioral filtering, Anycast) are necessary.
