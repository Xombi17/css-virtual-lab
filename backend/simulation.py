"""
simulation.py - Central Simulation Dispatcher for Traffic Simulation Project.

Coordinates educational simulations across:
- normal_traffic.py (Person 1)
- dos_attack.py     (Person 2)
- ddos_attack.py    (Person 3)
- protection.py     (Person 3)

Exposes run_simulation(settings) which validates normalized inputs,
invokes the appropriate scenario module, and normalizes output into a
consistent common result contract.
"""

import os
import sys
from typing import Any, Dict

# Ensure backend directory is in sys.path to reliably load peer modules
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from normal_traffic import simulate_normal
from dos_attack import simulate_dos
from ddos_attack import simulate_ddos
from protection import allowed_attack_after_limit


def run_simulation(settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dispatch and execute a traffic simulation scenario.

    Parameters:
        settings (dict): Normalized simulation parameters containing:
            - scenario (str): 'normal', 'dos', or 'ddos'
            - legitimate_rate (int): Legitimate user request rate (>= 0)
            - capacity (int): Maximum server processing capacity (> 0)
            - attack_rate_per_source (int, optional): Attack rate per source (>= 0)
            - attack_rate (int, optional): Alternative key for DoS attack rate
            - attacker_count (int, optional): Number of attack sources (>= 0)
            - protection_enabled (bool, optional): Whether rate limiting is active
            - per_source_limit (int, optional): Max req/s allowed per source

    Returns:
        dict: Standardized result structure with all common contract keys.
    """
    if not isinstance(settings, dict):
        raise ValueError("Simulation settings must be a dictionary.")

    scenario_raw = settings.get("scenario")
    if not isinstance(scenario_raw, str):
        raise ValueError("Missing or invalid 'scenario'. Must be 'normal', 'dos', or 'ddos'.")

    scenario = scenario_raw.strip().lower()
    if scenario not in ("normal", "dos", "ddos"):
        raise ValueError(f"Unsupported scenario '{scenario}'. Must be 'normal', 'dos', or 'ddos'.")

    # Validate legitimate_rate
    legitimate_rate = settings.get("legitimate_rate")
    if isinstance(legitimate_rate, bool) or not isinstance(legitimate_rate, int):
        raise ValueError("legitimate_rate must be an integer.")
    if legitimate_rate < 0:
        raise ValueError("legitimate_rate cannot be negative.")

    # Validate capacity
    capacity = settings.get("capacity")
    if isinstance(capacity, bool) or not isinstance(capacity, int):
        raise ValueError("capacity must be an integer.")
    if capacity <= 0:
        raise ValueError("capacity must be greater than zero.")

    # Bound check for safe classroom simulation
    if legitimate_rate > 100_000:
        raise ValueError("legitimate_rate exceeds maximum classroom simulation bound (100,000).")
    if capacity > 100_000:
        raise ValueError("capacity exceeds maximum classroom simulation bound (100,000).")

    # Dispatch based on scenario
    if scenario == "normal":
        raw = simulate_normal(legitimate_rate, capacity)
        incoming = raw["incoming"]
        accepted = raw["accepted"]
        dropped = raw["dropped"]
        status = "Normal" if dropped == 0 else "Overloaded"
        message = (
            "All simulated requests were accepted within server capacity."
            if dropped == 0
            else f"Legitimate traffic ({incoming} req/s) exceeded server capacity ({capacity} req/s) by {dropped} req/s; excess requests were dropped."
        )

        return {
            "scenario": "normal",
            "incoming": incoming,
            "accepted": accepted,
            "dropped": dropped,
            "blocked": 0,
            "legitimate_incoming": legitimate_rate,
            "legitimate_accepted": accepted,
            "attack_incoming": 0,
            "status": status,
            "protection_enabled": False,
            "message": message,
            "offered_total": incoming,
            "capacity": capacity,
            "utilization_percent": round((accepted / capacity) * 100, 2),
            "drop_percent": round((dropped / incoming) * 100, 2) if incoming > 0 else 0.0,
        }

    elif scenario == "dos":
        # Resolve attack rate: check attack_rate_per_source or attack_rate
        attack_rate = settings.get("attack_rate_per_source")
        if attack_rate is None:
            attack_rate = settings.get("attack_rate", 120)

        if isinstance(attack_rate, bool) or not isinstance(attack_rate, int):
            raise ValueError("attack_rate_per_source must be an integer.")
        if attack_rate < 0:
            raise ValueError("attack_rate_per_source cannot be negative.")
        if attack_rate > 100_000:
            raise ValueError("attack_rate_per_source exceeds maximum classroom simulation bound (100,000).")

        raw = simulate_dos(legitimate_rate, attack_rate, capacity)
        incoming = raw["incoming"]
        accepted = raw["accepted"]
        dropped = raw["dropped"]
        status = raw["status"]

        # Proportional sharing of accepted capacity among arriving streams
        legitimate_accepted = (
            round((legitimate_rate * accepted) / incoming, 2) if incoming > 0 else 0.0
        )

        message = (
            f"Single-source DoS attack ({attack_rate} req/s) combined with legitimate traffic ({legitimate_rate} req/s) "
            f"overwhelmed server capacity ({capacity} req/s). {dropped} req/s were dropped."
            if dropped > 0
            else "All incoming requests (legitimate + DoS) fit within server capacity."
        )

        return {
            "scenario": "dos",
            "incoming": incoming,
            "accepted": accepted,
            "dropped": dropped,
            "blocked": 0,
            "legitimate_incoming": legitimate_rate,
            "legitimate_accepted": legitimate_accepted,
            "attack_incoming": attack_rate,
            "status": status,
            "protection_enabled": False,
            "message": message,
            "offered_total": incoming,
            "capacity": capacity,
            "utilization_percent": raw.get("utilization_percent", round((accepted / capacity) * 100, 2)),
            "drop_percent": raw.get("drop_percent", round((dropped / incoming) * 100, 2) if incoming > 0 else 0.0),
        }

    elif scenario == "ddos":
        attacker_count = settings.get("attacker_count", 5)
        if isinstance(attacker_count, bool) or not isinstance(attacker_count, int):
            raise ValueError("attacker_count must be an integer.")
        if attacker_count < 0:
            raise ValueError("attacker_count cannot be negative.")
        if attacker_count > 10_000:
            raise ValueError("attacker_count exceeds maximum simulation bound (10,000).")

        attack_rate_per_source = settings.get("attack_rate_per_source", 40)
        if isinstance(attack_rate_per_source, bool) or not isinstance(attack_rate_per_source, int):
            raise ValueError("attack_rate_per_source must be an integer.")
        if attack_rate_per_source < 0:
            raise ValueError("attack_rate_per_source cannot be negative.")
        if attack_rate_per_source > 100_000:
            raise ValueError("attack_rate_per_source exceeds maximum simulation bound (100,000).")

        protection_enabled = settings.get("protection_enabled", False)
        if not isinstance(protection_enabled, bool):
            raise ValueError("protection_enabled must be a boolean.")

        per_source_limit = settings.get("per_source_limit")
        if protection_enabled:
            if per_source_limit is None:
                raise ValueError("per_source_limit is required when protection_enabled is true.")
            if isinstance(per_source_limit, bool) or not isinstance(per_source_limit, int):
                raise ValueError("per_source_limit must be an integer.")
            if per_source_limit < 0:
                raise ValueError("per_source_limit cannot be negative.")
            if per_source_limit > 100_000:
                raise ValueError("per_source_limit exceeds maximum simulation bound (100,000).")
        else:
            if per_source_limit is not None and not isinstance(per_source_limit, int):
                if isinstance(per_source_limit, bool):
                    raise ValueError("per_source_limit must be an integer when supplied.")

        # If attacker_count == 0, simulate no attack
        if attacker_count == 0:
            raw = simulate_ddos(
                legitimate_rate=legitimate_rate,
                attacker_count=1,
                attack_rate_per_source=0,
                capacity=capacity,
                protection_enabled=False,
                per_source_limit=None,
            )
            raw["attacker_count"] = 0
            raw["attack_incoming"] = 0
            raw["offered_total"] = legitimate_rate
            raw["incoming"] = legitimate_rate
            raw["accepted"] = min(legitimate_rate, capacity)
            raw["dropped"] = max(0, legitimate_rate - capacity)
            raw["legitimate_accepted"] = raw["accepted"]
            raw["status"] = "Normal" if raw["dropped"] == 0 else "Overloaded"
            raw["protection_enabled"] = protection_enabled
            return raw

        raw = simulate_ddos(
            legitimate_rate=legitimate_rate,
            attacker_count=attacker_count,
            attack_rate_per_source=attack_rate_per_source,
            capacity=capacity,
            protection_enabled=protection_enabled,
            per_source_limit=per_source_limit,
        )

        return raw

    raise ValueError(f"Unhandled scenario '{scenario}'.")
