"""
dev_ddos_server.py - Isolated local Flask development server for Person 3 testing.

Runs strictly for local development on port 5001 to test ddos_lab.html and the
POST /api/simulate endpoint without modifying or colliding with Person 4's app.py.

PRODUCTION NOTE:
In production, Person 4 integrates simulate_ddos into app.py (running on port 5050).
This server is only used for Person 3's independent verification.
"""
import os
from flask import Flask, jsonify, request, send_from_directory
from ddos_attack import simulate_ddos

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")


@app.route("/")
def index():
    """Default route: serve the DDoS lab page."""
    return send_from_directory(BASE_DIR, "ddos_lab.html")


@app.route("/ddos_lab.html")
def ddos_lab():
    """Serve the themed DDoS lab HTML page."""
    return send_from_directory(BASE_DIR, "ddos_lab.html")


@app.route("/ddos_view.css")
def ddos_view_css():
    """Serve scoped DDoS styles."""
    return send_from_directory(BASE_DIR, "ddos_view.css")


@app.route("/ddos_view.js")
def ddos_view_js():
    """Serve DDoS visualization and interaction logic."""
    return send_from_directory(BASE_DIR, "ddos_view.js")


@app.route("/index.html")
def main_index():
    """Allow navigation back to the primary lab page."""
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    """
    Simulation API endpoint supporting DDoS and related scenarios.

    Expected JSON payload:
    {
        "scenario": "ddos" | "dos" | "normal",
        "legitimate_rate": 20,
        "attack_rate_per_source": 40,
        "attacker_count": 5,
        "capacity": 100,
        "protection_enabled": false,
        "per_source_limit": 10
    }
    """
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 400

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Invalid or missing JSON payload."}), 400

    scenario = str(data.get("scenario", "ddos")).lower()

    # Extract parameters with scenario adjustments
    try:
        legitimate_rate = int(data.get("legitimate_rate", 20))
        capacity = int(data.get("capacity", 100))
        protection_enabled = bool(data.get("protection_enabled", False))

        per_source_limit_raw = data.get("per_source_limit")
        per_source_limit = (
            int(per_source_limit_raw)
            if per_source_limit_raw is not None and str(per_source_limit_raw).strip() != ""
            else None
        )

        if scenario == "normal":
            attacker_count = 1
            attack_rate_per_source = 0
            protection_enabled = False
        elif scenario == "dos":
            attacker_count = 1
            attack_rate_per_source = int(
                data.get("attack_rate_per_source", data.get("attack_rate", 120))
            )
        else:  # ddos
            attacker_count = int(data.get("attacker_count", 5))
            attack_rate_per_source = int(data.get("attack_rate_per_source", 40))

        result = simulate_ddos(
            legitimate_rate=legitimate_rate,
            attacker_count=attacker_count,
            attack_rate_per_source=attack_rate_per_source,
            capacity=capacity,
            protection_enabled=protection_enabled,
            per_source_limit=per_source_limit,
        )
        return jsonify(result), 200

    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": f"Server processing error: {str(err)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("DEV_PORT", 5001))
    print(f"Starting Person 3 Dev Server on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=True)
