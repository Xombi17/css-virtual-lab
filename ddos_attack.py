"""
ddos_attack.py - Multi-source Distributed Denial of Service (DDoS) simulation module.

Course: Cryptography and System Security (CSS) Virtual Lab
Experiment: Demonstrate the DoS and DDoS Attack (Person 3: DDoS & Protection)

EDUCATIONAL SIMULATION NOTICE:
This module is a local mathematical model of request arrival rates (req/s)
versus server processing capacity. It contains NO socket connections, NO real
packet crafting, NO packet flooding, and NO attack tools. Real-world tools
(e.g., iptables, firewalls, htop) are discussed strictly conceptually in lab theory.

MODEL LIMITATIONS:
1. Assumes all incoming sources are identifiable and have distinct, stable rate limits.
2. Does not simulate TCP handshakes, SYN cookies, connection states, socket buffers, or latency queues.
3. Does not simulate IP address spoofing, reflection/amplification, or botnet churn.
4. Simplified proportional sharing: legitimate traffic and allowed attack traffic share
   processing capacity in proportion to their incoming volume.
5. In the real world, a simple per-IP rate limiter alone cannot stop high-scale DDoS attacks
   because thousands of distributed bots each send at normal, low rates.
"""
from typing import Any, Dict, Optional
from protection import allowed_attack_after_limit


def estimate_resource_usage(load_ratio: float) -> Dict[str, Any]:
    """
    Estimate illustrative server resource metrics based on the traffic load ratio.

    NOTE: These values are purely ILLUSTRATIVE teaching estimates to demonstrate
    resource stress conceptually; they are not physically measured operating system stats.

    Parameters:
        load_ratio (float): Ratio of incoming traffic to capacity (incoming / capacity).
                            Must be non-negative.

    Returns:
        dict: Estimated cpu_percent, ram_percent, and service_state.
    """
    if isinstance(load_ratio, bool) or not isinstance(load_ratio, (int, float)):
        raise ValueError("load_ratio must be a numeric value.")
    if load_ratio < 0:
        raise ValueError("load_ratio must be non-negative (>= 0).")

    clamped_load = min(float(load_ratio), 1.0)

    # Monotonic bounded estimates:
    # CPU: base 2.0% idle up to 98.0%, capped strictly at 99.0%
    cpu = round(min(99.0, 2.0 + 96.0 * clamped_load), 1)

    # RAM: base 20.0% system baseline up to 85.0%, capped at 95.0%
    ram = round(min(95.0, 20.0 + 65.0 * clamped_load), 1)

    # Service responsiveness threshold:
    # Responsive: load < 0.9 (90% capacity)
    # Slow: 0.9 <= load <= 1.0
    # Unresponsive: load > 1.0 (traffic exceeds capacity, requests dropped)
    if load_ratio < 0.9:
        service_state = "Responsive"
    elif load_ratio <= 1.0:
        service_state = "Slow"
    else:
        service_state = "Unresponsive"

    return {
        "cpu_percent": cpu,
        "ram_percent": ram,
        "service_state": service_state,
        "is_illustrative": True,
    }


def simulate_ddos(
    legitimate_rate: int,
    attacker_count: int,
    attack_rate_per_source: int,
    capacity: int,
    protection_enabled: bool = False,
    per_source_limit: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Simulate a multi-source Distributed Denial of Service (DDoS) scenario.

    Parameters:
        legitimate_rate (int): Legitimate user traffic in req/s (>= 0).
        attacker_count (int): Number of distributed attack nodes (>= 1).
        attack_rate_per_source (int): Attack request rate per source node in req/s (>= 0).
        capacity (int): Server processing capacity in req/s (> 0).
        protection_enabled (bool): Whether per-source rate limiting is active.
        per_source_limit (int | None): Rate limit threshold per source (req/s) when enabled.

    Returns:
        dict: Complete metrics matching Person 3's interface and teammate conventions.
    """
    # Strict validation of numeric inputs and types
    if isinstance(legitimate_rate, bool) or not isinstance(legitimate_rate, int):
        raise ValueError("legitimate_rate must be an integer.")
    if legitimate_rate < 0:
        raise ValueError("legitimate_rate must be a non-negative integer (>= 0).")

    if isinstance(attacker_count, bool) or not isinstance(attacker_count, int):
        raise ValueError("attacker_count must be an integer.")
    if attacker_count < 1:
        raise ValueError("attacker_count must be an integer >= 1.")

    if isinstance(attack_rate_per_source, bool) or not isinstance(attack_rate_per_source, int):
        raise ValueError("attack_rate_per_source must be an integer.")
    if attack_rate_per_source < 0:
        raise ValueError("attack_rate_per_source must be a non-negative integer (>= 0).")

    if isinstance(capacity, bool) or not isinstance(capacity, int):
        raise ValueError("capacity must be an integer.")
    if capacity <= 0:
        raise ValueError("capacity must be a positive integer (> 0).")

    if not isinstance(protection_enabled, bool):
        raise ValueError("protection_enabled must be a boolean.")

    if protection_enabled:
        if per_source_limit is None:
            raise ValueError("per_source_limit is required when protection is enabled.")
        if isinstance(per_source_limit, bool) or not isinstance(per_source_limit, int):
            raise ValueError("per_source_limit must be an integer.")
        if per_source_limit < 0:
            raise ValueError("per_source_limit must be a non-negative integer (>= 0).")

    # 1. Calculate offered traffic
    attack_incoming = attacker_count * attack_rate_per_source
    offered_total = legitimate_rate + attack_incoming

    # 2. Apply simulated per-source rate limiting protection
    if protection_enabled and per_source_limit is not None:
        allowed_attack, blocked = allowed_attack_after_limit(
            attacker_count, attack_rate_per_source, per_source_limit
        )
    else:
        allowed_attack = attack_incoming
        blocked = 0

    # 3. Traffic reaching the victim server
    incoming = legitimate_rate + allowed_attack
    accepted = min(incoming, capacity)
    dropped = incoming - accepted

    # 4. Determine operational server status
    if dropped > 0:
        status = "Overloaded"
    elif accepted == capacity and dropped == 0:
        status = "At Capacity"
    else:
        status = "Normal"

    # 5. Legitimate traffic accepted under proportional capacity sharing
    # Assumption: Server FIFO buffers treat arriving requests homogeneously;
    # legitimate requests succeed in proportion to their fraction of total incoming traffic.
    if incoming == 0:
        legitimate_accepted = 0.0
    else:
        legitimate_accepted = round((legitimate_rate * accepted) / incoming, 2)

    # 6. Illustrative resource metrics
    load_ratio = incoming / capacity
    resource_estimates = estimate_resource_usage(load_ratio)

    # 7. Formulate educational message in plain English
    if status == "Overloaded":
        if blocked > 0:
            message = (
                f"Rate limiter blocked {blocked} req/s, but remaining volume ({incoming} req/s) "
                f"still overshoots server capacity ({capacity} req/s) by {dropped} req/s. "
                f"Distributed bot traffic overwhelmed the server despite per-source filtering."
            )
        else:
            message = (
                f"Server capacity ({capacity} req/s) is exceeded by {dropped} req/s. "
                f"Unmitigated multi-source traffic ({incoming} req/s) is causing severe denial of service."
            )
    elif status == "At Capacity":
        if blocked > 0:
            message = (
                f"Rate limiter successfully blocked {blocked} req/s. The server is operating "
                f"at 100% processing capacity ({capacity} req/s) with 0 dropped requests."
            )
        else:
            message = (
                f"Server is operating at exactly 100% capacity ({capacity} req/s) "
                f"with zero drops, but no headroom remains."
            )
    else:
        if blocked > 0:
            message = (
                f"Rate limiting blocked {blocked} req/s from high-rate sources. "
                f"Server traffic ({incoming} req/s) is within safe capacity ({capacity} req/s)."
            )
        else:
            message = (
                f"Traffic load ({incoming} req/s) is normal and comfortably within "
                f"server capacity ({capacity} req/s). All requests serviced."
            )

    utilization_percent = round((accepted / capacity) * 100, 2)
    drop_percent = round((dropped / incoming) * 100, 2) if incoming > 0 else 0.0

    return {
        "scenario": "ddos",
        "offered_total": offered_total,
        "incoming": incoming,
        "accepted": accepted,
        "dropped": dropped,
        "blocked": blocked,
        "legitimate_incoming": legitimate_rate,
        "legitimate_accepted": legitimate_accepted,
        "attack_incoming": attack_incoming,
        "status": status,
        "protection_enabled": protection_enabled,
        "message": message,
        # Illustrative monitoring metrics
        "packets_per_sec": incoming,
        "cpu_percent": resource_estimates["cpu_percent"],
        "ram_percent": resource_estimates["ram_percent"],
        "service_state": resource_estimates["service_state"],
        # Teammate compatibility keys
        "utilization_percent": utilization_percent,
        "drop_percent": drop_percent,
        "capacity": capacity,
        "attacker_count": attacker_count,
        "attack_rate_per_source": attack_rate_per_source,
        "per_source_limit": per_source_limit if protection_enabled else None,
        "excess_requests": dropped,
    }
