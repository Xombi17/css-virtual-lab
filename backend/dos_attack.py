"""
dos_attack.py - Core mathematical DoS simulation module for Cryptography and System Security (CSS).

This module simulates Denial of Service (DoS) mathematically by evaluating
aggregate request arrival rates against server processing capacity.
No actual network traffic is generated or flooded.
"""

def simulate_dos(legitimate_rate, attack_rate, capacity):
    """
    Simulate a Denial of Service scenario mathematically.

    Parameters:
        legitimate_rate (int): Legitimate user request rate in requests/second (>= 0).
        attack_rate (int): Attack request rate from one source in requests/second (>= 0).
        capacity (int): Maximum server processing capacity in requests/second (> 0).

    Returns:
        dict: Detailed simulation metrics including incoming, accepted, dropped,
              utilization_percent, drop_percent, and status.
    """
    # Strict type and value validation
    # In Python, bool is an instance of int, so we check explicitly for bool
    if isinstance(legitimate_rate, bool) or not isinstance(legitimate_rate, int):
        raise ValueError("legitimate_rate must be an integer.")
    if legitimate_rate < 0:
        raise ValueError("legitimate_rate must be a non-negative integer (>= 0).")

    if isinstance(attack_rate, bool) or not isinstance(attack_rate, int):
        raise ValueError("attack_rate must be an integer.")
    if attack_rate < 0:
        raise ValueError("attack_rate must be a non-negative integer (>= 0).")

    if isinstance(capacity, bool) or not isinstance(capacity, int):
        raise ValueError("capacity must be an integer.")
    if capacity <= 0:
        raise ValueError("capacity must be a positive integer (> 0).")

    # Core mathematical simulation
    incoming = legitimate_rate + attack_rate
    accepted = min(incoming, capacity)
    dropped = incoming - accepted

    # Extended metrics
    utilization_percent = round((accepted / capacity) * 100, 2)
    drop_percent = round((dropped / incoming) * 100, 2) if incoming > 0 else 0.0

    return {
        "incoming": incoming,
        "accepted": accepted,
        "dropped": dropped,
        "status": "Overloaded" if dropped > 0 else "Normal",
        "legitimate_rate": legitimate_rate,
        "attack_rate": attack_rate,
        "capacity": capacity,
        "utilization_percent": utilization_percent,
        "drop_percent": drop_percent,
        "excess_requests": dropped
    }
