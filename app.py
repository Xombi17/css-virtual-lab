"""
app.py - Minimal Flask server for DoS Simulation + Monitoring.

Serves the frontend files and provides the POST /api/simulate-dos endpoint.
"""
import os
from flask import Flask, request, jsonify, send_from_directory
from dos_attack import simulate_dos

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")


@app.route("/")
def index():
    """Serve the main frontend page."""
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/styles.css")
def styles():
    """Serve the CSS stylesheet."""
    return send_from_directory(BASE_DIR, "styles.css")


@app.route("/monitoring.js")
def monitoring_js():
    """Serve the monitoring JavaScript logic."""
    return send_from_directory(BASE_DIR, "monitoring.js")


@app.route("/api/simulate-dos", methods=["POST"])
def api_simulate_dos():
    """
    Simulate a Denial of Service scenario.

    Expected JSON body:
    {
        "legitimate_rate": 40,
        "attack_rate": 100,
        "capacity": 100
    }
    """
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 400

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Invalid or missing JSON payload."}), 400

    required_fields = ["legitimate_rate", "attack_rate", "capacity"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required parameter: '{field}'."}), 400

    legitimate_rate = data["legitimate_rate"]
    attack_rate = data["attack_rate"]
    capacity = data["capacity"]

    try:
        result = simulate_dos(legitimate_rate, attack_rate, capacity)
        return jsonify(result), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": f"Server processing error: {str(err)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="127.0.0.1", port=port, debug=True)
