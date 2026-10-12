"""
test_api.py - Integration tests for Flask API and HTTP endpoint validation.
"""

import os
import sys
import pytest

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TEST_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_get_root_serves_frontend(client):
    """GET / should serve the frontend lab index.html with 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"<!DOCTYPE html>" in response.data or b"<html" in response.data


def test_api_normal_traffic(client):
    """TEST 1: Normal traffic within capacity via API."""
    payload = {
        "scenario": "normal",
        "legitimate_rate": 20,
        "capacity": 100
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["scenario"] == "normal"
    assert data["incoming"] == 20
    assert data["accepted"] == 20
    assert data["dropped"] == 0
    assert data["blocked"] == 0
    assert data["status"] == "Normal"
    assert data["protection_enabled"] is False


def test_api_normal_traffic_over_capacity(client):
    """TEST 2: Normal traffic over capacity via API."""
    payload = {
        "scenario": "normal",
        "legitimate_rate": 120,
        "capacity": 100
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["incoming"] == 120
    assert data["accepted"] == 100
    assert data["dropped"] == 20
    assert data["status"] == "Overloaded"


def test_api_dos_attack(client):
    """TEST 3: DoS attack via API."""
    payload = {
        "scenario": "dos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 120,
        "attacker_count": 1,
        "capacity": 100
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["incoming"] == 140
    assert data["accepted"] == 100
    assert data["dropped"] == 40
    assert data["blocked"] == 0
    assert data["attack_incoming"] == 120
    assert data["status"] == "Overloaded"


def test_api_ddos_attack_no_protection(client):
    """TEST 4: DDoS attack without protection via API."""
    payload = {
        "scenario": "ddos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 40,
        "attacker_count": 5,
        "capacity": 100,
        "protection_enabled": False
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["incoming"] == 220
    assert data["accepted"] == 100
    assert data["dropped"] == 120
    assert data["blocked"] == 0
    assert data["attack_incoming"] == 200
    assert data["status"] == "Overloaded"


def test_api_ddos_attack_with_protection(client):
    """TEST 5: DDoS attack with rate limiting protection via API."""
    payload = {
        "scenario": "ddos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 40,
        "attacker_count": 5,
        "capacity": 100,
        "protection_enabled": True,
        "per_source_limit": 10
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["attack_incoming"] == 200
    assert data["blocked"] == 150
    assert data["incoming"] == 70
    assert data["accepted"] == 70
    assert data["dropped"] == 0
    assert data["status"] == "Normal"
    assert data["protection_enabled"] is True


def test_api_negative_rate_rejected(client):
    """TEST 6: Negative input rejected with HTTP 400 and clear error message."""
    payload = {
        "scenario": "normal",
        "legitimate_rate": -1,
        "capacity": 100
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "negative" in data["error"].lower()


def test_api_zero_capacity_rejected(client):
    """TEST 7: Zero capacity rejected with HTTP 400."""
    payload = {
        "scenario": "normal",
        "legitimate_rate": 20,
        "capacity": 0
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "greater than zero" in data["error"].lower()


def test_api_unknown_scenario_rejected(client):
    """TEST 8: Unknown scenario rejected with HTTP 400."""
    payload = {
        "scenario": "unknown",
        "legitimate_rate": 20,
        "capacity": 100
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "unsupported scenario" in data["error"].lower()


def test_api_missing_fields_rejected(client):
    """TEST 9: Missing required fields rejected with HTTP 400."""
    # Missing scenario
    res1 = client.post("/api/simulate", json={"legitimate_rate": 20, "capacity": 100})
    assert res1.status_code == 400
    assert "scenario" in res1.get_json()["error"].lower()

    # Missing legitimate_rate
    res2 = client.post("/api/simulate", json={"scenario": "normal", "capacity": 100})
    assert res2.status_code == 400
    assert "legitimate_rate" in res2.get_json()["error"].lower()

    # Missing capacity
    res3 = client.post("/api/simulate", json={"scenario": "normal", "legitimate_rate": 20})
    assert res3.status_code == 400
    assert "capacity" in res3.get_json()["error"].lower()


def test_api_repeated_requests_isolation(client):
    """TEST 10: Sequential requests produce isolated results with no state leakage."""
    res1 = client.post("/api/simulate", json={"scenario": "normal", "legitimate_rate": 20, "capacity": 100})
    res2 = client.post("/api/simulate", json={"scenario": "dos", "legitimate_rate": 20, "attack_rate_per_source": 120, "capacity": 100})
    res3 = client.post("/api/simulate", json={"scenario": "normal", "legitimate_rate": 20, "capacity": 100})

    d1 = res1.get_json()
    d2 = res2.get_json()
    d3 = res3.get_json()

    assert d1["incoming"] == 20
    assert d2["incoming"] == 140
    assert d3["incoming"] == 20
    assert d1 == d3


def test_api_non_json_request_rejected(client):
    """POST without JSON content type is rejected with HTTP 400."""
    response = client.post("/api/simulate", data="legitimate_rate=20", content_type="text/plain")
    assert response.status_code == 400
    assert "application/json" in response.get_json()["error"]


def test_api_boolean_and_float_rejected_for_integers(client):
    """Reject boolean or float masquerading as rate integers."""
    res_bool = client.post("/api/simulate", json={"scenario": "normal", "legitimate_rate": True, "capacity": 100})
    assert res_bool.status_code == 400

    res_float = client.post("/api/simulate", json={"scenario": "normal", "legitimate_rate": 25.5, "capacity": 100})
    assert res_float.status_code == 400


def test_api_protection_requires_limit(client):
    """DDoS with protection enabled must require per_source_limit."""
    payload = {
        "scenario": "ddos",
        "legitimate_rate": 20,
        "attack_rate_per_source": 40,
        "attacker_count": 5,
        "capacity": 100,
        "protection_enabled": True
        # per_source_limit missing
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 400
    assert "per_source_limit" in response.get_json()["error"].lower()
