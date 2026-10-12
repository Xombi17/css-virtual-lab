"""
test_simulation.py - Unit tests for simulation dispatcher and mathematical models.
"""

import os
import sys
import pytest

# Ensure project root and backend are on sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TEST_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from simulation import run_simulation


def test_normal_traffic_within_capacity():
    """TEST 1: Normal traffic within capacity."""
    settings = {
        "scenario": "normal",
        "legitimate_rate": 20,
        "capacity": 100
    }
    res = run_simulation(settings)
    assert res["scenario"] == "normal"
    assert res["incoming"] == 20
    assert res["accepted"] == 20
    assert res["dropped"] == 0
    assert res["blocked"] == 0
    assert res["legitimate_incoming"] == 20
    assert res["legitimate_accepted"] == 20
    assert res["attack_incoming"] == 0
    assert res["status"] == "Normal"
    assert res["protection_enabled"] is False


def test_normal_traffic_over_capacity():
    """TEST 2: Normal traffic exceeding server capacity."""
    settings = {
        "scenario": "normal",
        "legitimate_rate": 120,
        "capacity": 100
    }
    res = run_simulation(settings)
    assert res["scenario"] == "normal"
    assert res["incoming"] == 120
    assert res["accepted"] == 100
    assert res["dropped"] == 20
    assert res["blocked"] == 0
    assert res["status"] == "Overloaded"


def test_dos_attack():
    """TEST 3: Single-source DoS attack."""
    settings = {
        "scenario": "dos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 120,
        "attacker_count": 1,
        "capacity": 100
    }
    res = run_simulation(settings)
    assert res["scenario"] == "dos"
    assert res["incoming"] == 140
    assert res["accepted"] == 100
    assert res["dropped"] == 40
    assert res["blocked"] == 0
    assert res["attack_incoming"] == 120
    assert res["legitimate_incoming"] == 20
    assert res["status"] == "Overloaded"


def test_ddos_without_protection():
    """TEST 4: Multi-source DDoS without protection."""
    settings = {
        "scenario": "ddos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 40,
        "attacker_count": 5,
        "capacity": 100,
        "protection_enabled": False
    }
    res = run_simulation(settings)
    assert res["scenario"] == "ddos"
    assert res["attack_incoming"] == 200
    assert res["incoming"] == 220
    assert res["accepted"] == 100
    assert res["dropped"] == 120
    assert res["blocked"] == 0
    assert res["status"] == "Overloaded"
    assert res["protection_enabled"] is False


def test_ddos_with_protection():
    """TEST 5: Multi-source DDoS with per-source rate limiting."""
    settings = {
        "scenario": "ddos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 40,
        "attacker_count": 5,
        "capacity": 100,
        "protection_enabled": True,
        "per_source_limit": 10
    }
    res = run_simulation(settings)
    assert res["scenario"] == "ddos"
    assert res["attack_incoming"] == 200
    assert res["blocked"] == 150
    assert res["incoming"] == 70
    assert res["accepted"] == 70
    assert res["dropped"] == 0
    assert res["status"] == "Normal"
    assert res["protection_enabled"] is True


def test_validation_negative_legitimate_rate():
    """TEST 6: Negative input rejected with ValueError."""
    with pytest.raises(ValueError, match="negative"):
        run_simulation({
            "scenario": "normal",
            "legitimate_rate": -1,
            "capacity": 100
        })


def test_validation_zero_capacity():
    """TEST 7: Zero capacity rejected with ValueError."""
    with pytest.raises(ValueError, match="greater than zero"):
        run_simulation({
            "scenario": "normal",
            "legitimate_rate": 20,
            "capacity": 0
        })


def test_validation_unknown_scenario():
    """TEST 8: Unknown scenario rejected with ValueError."""
    with pytest.raises(ValueError, match="Unsupported scenario"):
        run_simulation({
            "scenario": "unknown",
            "legitimate_rate": 20,
            "capacity": 100
        })


def test_conservation_and_consistency_invariant():
    """Verify mathematical invariant: incoming == accepted + dropped."""
    test_cases = [
        {"scenario": "normal", "legitimate_rate": 50, "capacity": 100},
        {"scenario": "normal", "legitimate_rate": 150, "capacity": 100},
        {"scenario": "dos", "legitimate_rate": 30, "attack_rate_per_source": 90, "capacity": 100},
        {"scenario": "ddos", "legitimate_rate": 20, "attacker_count": 4, "attack_rate_per_source": 50, "capacity": 100, "protection_enabled": False},
        {"scenario": "ddos", "legitimate_rate": 20, "attacker_count": 4, "attack_rate_per_source": 50, "capacity": 100, "protection_enabled": True, "per_source_limit": 15},
    ]

    for tc in test_cases:
        res = run_simulation(tc)
        assert res["incoming"] == res["accepted"] + res["dropped"]
        assert res["incoming"] >= 0
        assert res["accepted"] >= 0
        assert res["dropped"] >= 0
        assert res["blocked"] >= 0
