"""
app.py - Flask API & Static Asset Server for Traffic Simulation Project.

Person 4 implementation:
- Serves the frontend lab interface at GET /
- Provides POST /api/simulate endpoint with strict request validation
- Integrates with simulation.py dispatcher
- Handles unexpected internal errors safely
"""

import math
import os
import sys
from typing import Any
from flask import Flask, jsonify, request, send_from_directory

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from simulation import run_simulation

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")


# ---------------------------------------------------------------------------
# Static Route Handlers
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
@app.route("/index.html", methods=["GET"])
def index():
    """Serve the main frontend lab interface."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>", methods=["GET"])
def static_files(filename):
    """Serve static assets (CSS, JS, images) from frontend directory."""
    return send_from_directory(FRONTEND_DIR, filename)


# ---------------------------------------------------------------------------
# API Simulation Endpoint
# ---------------------------------------------------------------------------

def _is_invalid_number(val: Any) -> bool:
    """Check if value is float, NaN, infinite, or boolean."""
    if isinstance(val, bool):
        return True
    if isinstance(val, float):
        return math.isnan(val) or math.isinf(val) or True  # All floats rejected (integers required)
    return False


@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    """
    Simulate traffic scenario and evaluate server capacity / rate limiting.

    Request Body (JSON):
    {
        "scenario": "normal" | "dos" | "ddos",
        "legitimate_rate": int (>= 0),
        "capacity": int (> 0),
        "attack_rate_per_source": int (>= 0),
        "attacker_count": int (>= 0),
        "protection_enabled": bool,
        "per_source_limit": int (>= 0, required if protection_enabled is true)
    }
    """
    if not request.is_json:
        return jsonify({"error": "Request Content-Type must be application/json."}), 400

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Malformed or empty JSON request body."}), 400

    # 1. Required field checks
    if "scenario" not in data or data["scenario"] is None:
        return jsonify({"error": "Missing required field: 'scenario'."}), 400

    if not isinstance(data["scenario"], str):
        return jsonify({"error": "Field 'scenario' must be a string."}), 400

    scenario = data["scenario"].strip().lower()
    if scenario not in ("normal", "dos", "ddos"):
        return jsonify({"error": f"Unsupported scenario '{scenario}'. Allowed: 'normal', 'dos', 'ddos'."}), 400

    if "legitimate_rate" not in data or data["legitimate_rate"] is None:
        return jsonify({"error": "Missing required field: 'legitimate_rate'."}), 400

    if "capacity" not in data or data["capacity"] is None:
        return jsonify({"error": "Missing required field: 'capacity'."}), 400

    # 2. Type & Value Validation
    legitimate_rate = data["legitimate_rate"]
    if _is_invalid_number(legitimate_rate) or not isinstance(legitimate_rate, int):
        return jsonify({"error": "'legitimate_rate' must be an integer."}), 400
    if legitimate_rate < 0:
        return jsonify({"error": "'legitimate_rate' cannot be negative."}), 400
    if legitimate_rate > 100_000:
        return jsonify({"error": "'legitimate_rate' exceeds classroom maximum of 100,000."}), 400

    capacity = data["capacity"]
    if _is_invalid_number(capacity) or not isinstance(capacity, int):
        return jsonify({"error": "'capacity' must be an integer."}), 400
    if capacity <= 0:
        return jsonify({"error": "'capacity' must be greater than zero."}), 400
    if capacity > 100_000:
        return jsonify({"error": "'capacity' exceeds classroom maximum of 100,000."}), 400

    normalized_settings = {
        "scenario": scenario,
        "legitimate_rate": legitimate_rate,
        "capacity": capacity,
    }

    # 3. Scenario-specific validations
    if scenario == "dos":
        # Check attack rate
        attack_rate = data.get("attack_rate_per_source", data.get("attack_rate", 120))
        if attack_rate is None or _is_invalid_number(attack_rate) or not isinstance(attack_rate, int):
            return jsonify({"error": "'attack_rate_per_source' must be an integer for DoS scenario."}), 400
        if attack_rate < 0:
            return jsonify({"error": "'attack_rate_per_source' cannot be negative."}), 400
        if attack_rate > 100_000:
            return jsonify({"error": "'attack_rate_per_source' exceeds classroom maximum of 100,000."}), 400

        normalized_settings["attack_rate_per_source"] = attack_rate
        normalized_settings["attacker_count"] = 1

    elif scenario == "ddos":
        attacker_count = data.get("attacker_count", 5)
        if attacker_count is None or _is_invalid_number(attacker_count) or not isinstance(attacker_count, int):
            return jsonify({"error": "'attacker_count' must be an integer for DDoS scenario."}), 400
        if attacker_count < 0:
            return jsonify({"error": "'attacker_count' cannot be negative."}), 400
        if attacker_count > 10_000:
            return jsonify({"error": "'attacker_count' exceeds maximum bound of 10,000."}), 400

        attack_rate_per_source = data.get("attack_rate_per_source", 40)
        if attack_rate_per_source is None or _is_invalid_number(attack_rate_per_source) or not isinstance(attack_rate_per_source, int):
            return jsonify({"error": "'attack_rate_per_source' must be an integer for DDoS scenario."}), 400
        if attack_rate_per_source < 0:
            return jsonify({"error": "'attack_rate_per_source' cannot be negative."}), 400
        if attack_rate_per_source > 100_000:
            return jsonify({"error": "'attack_rate_per_source' exceeds maximum bound of 100,000."}), 400

        protection_enabled = data.get("protection_enabled", False)
        if not isinstance(protection_enabled, bool):
            return jsonify({"error": "'protection_enabled' must be a boolean (true/false)."}), 400

        per_source_limit = data.get("per_source_limit")
        if protection_enabled:
            if per_source_limit is None:
                return jsonify({"error": "'per_source_limit' is required when protection_enabled is true."}), 400
            if _is_invalid_number(per_source_limit) or not isinstance(per_source_limit, int):
                return jsonify({"error": "'per_source_limit' must be an integer."}), 400
            if per_source_limit < 0:
                return jsonify({"error": "'per_source_limit' cannot be negative."}), 400
            if per_source_limit > 100_000:
                return jsonify({"error": "'per_source_limit' exceeds maximum bound of 100,000."}), 400
        else:
            if per_source_limit is not None:
                if _is_invalid_number(per_source_limit) or not isinstance(per_source_limit, int):
                    return jsonify({"error": "'per_source_limit' must be an integer when supplied."}), 400
                if per_source_limit < 0:
                    return jsonify({"error": "'per_source_limit' cannot be negative."}), 400

        normalized_settings["attacker_count"] = attacker_count
        normalized_settings["attack_rate_per_source"] = attack_rate_per_source
        normalized_settings["protection_enabled"] = protection_enabled
        normalized_settings["per_source_limit"] = per_source_limit

    # 4. Execute simulation via dispatcher
    try:
        result = run_simulation(normalized_settings)
        return jsonify(result), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        # Avoid leaking internal stack trace in response
        app.logger.error(f"Unexpected simulation error: {err}", exc_info=True)
        return jsonify({"error": "An internal simulation error occurred."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
