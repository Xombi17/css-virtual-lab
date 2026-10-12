"""
protection.py - Per-source rate limiting simulation for DDoS protection.

This module models an upstream firewall or rate limiter that enforces a maximum
requests-per-second threshold on each individual traffic source.

Educational simulation: All values represent mathematical models of request rates.
No real network packets, sockets, or traffic are generated.
"""
from typing import Tuple


def allowed_attack_after_limit(
    attacker_count: int,
    rate_per_source: int,
    per_source_limit: int
) -> Tuple[int, int]:
    """
    Calculate allowed and blocked attack traffic under per-source rate limiting.

    Parameters:
        attacker_count (int): Number of distinct attack sources (>= 1).
        rate_per_source (int): Request rate generated per source in req/s (>= 0).
        per_source_limit (int): Maximum allowed request rate per source in req/s (>= 0).

    Returns:
        tuple[int, int]: (allowed_total, blocked_total) in requests per second.

    Raises:
        ValueError: If any input is non-integer, negative, or attacker_count < 1.
    """
    # Strict type checks: disallow bools (which inherit from int) and non-ints
    if isinstance(attacker_count, bool) or not isinstance(attacker_count, int):
        raise ValueError("attacker_count must be an integer.")
    if attacker_count < 1:
        raise ValueError("attacker_count must be at least 1.")

    if isinstance(rate_per_source, bool) or not isinstance(rate_per_source, int):
        raise ValueError("rate_per_source must be an integer.")
    if rate_per_source < 0:
        raise ValueError("rate_per_source must be non-negative (>= 0).")

    if isinstance(per_source_limit, bool) or not isinstance(per_source_limit, int):
        raise ValueError("per_source_limit must be an integer.")
    if per_source_limit < 0:
        raise ValueError("per_source_limit must be non-negative (>= 0).")

    allowed_per_source = min(rate_per_source, per_source_limit)
    allowed = attacker_count * allowed_per_source
    blocked = attacker_count * (rate_per_source - allowed_per_source)

    # Invariant guarantee: if rate is within the limit, blocked must be 0
    if rate_per_source <= per_source_limit:
        blocked = 0

    return allowed, blocked
