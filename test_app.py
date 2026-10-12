"""
test_app.py - Integration tests for Flask endpoints in app.py.
"""
import unittest
from app import app

class TestAppEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_simulate_dos_valid(self):
        response = self.client.post(
            "/api/simulate-dos",
            json={"legitimate_rate": 40, "attack_rate": 100, "capacity": 100}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["incoming"], 140)
        self.assertEqual(data["accepted"], 100)
        self.assertEqual(data["dropped"], 40)
        self.assertEqual(data["status"], "Overloaded")
        self.assertEqual(data["utilization_percent"], 100.0)
        self.assertEqual(data["drop_percent"], 28.57)

    def test_simulate_dos_normal(self):
        response = self.client.post(
            "/api/simulate-dos",
            json={"legitimate_rate": 40, "attack_rate": 0, "capacity": 100}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["incoming"], 40)
        self.assertEqual(data["accepted"], 40)
        self.assertEqual(data["dropped"], 0)
        self.assertEqual(data["status"], "Normal")

    def test_simulate_dos_missing_field(self):
        response = self.client.post(
            "/api/simulate-dos",
            json={"legitimate_rate": 40, "attack_rate": 100}
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)

    def test_simulate_dos_negative_value(self):
        response = self.client.post(
            "/api/simulate-dos",
            json={"legitimate_rate": -10, "attack_rate": 100, "capacity": 100}
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)

    def test_simulate_dos_zero_capacity(self):
        response = self.client.post(
            "/api/simulate-dos",
            json={"legitimate_rate": 40, "attack_rate": 100, "capacity": 0}
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)

    def test_static_routes(self):
        res_index = self.client.get("/")
        self.assertEqual(res_index.status_code, 200)
        self.assertIn(b"DoS Simulation &amp; Monitoring", res_index.data)

        res_css = self.client.get("/styles.css")
        self.assertEqual(res_css.status_code, 200)

        res_js = self.client.get("/monitoring.js")
        self.assertEqual(res_js.status_code, 200)
        self.assertIn(b"renderDosResults", res_js.data)

if __name__ == "__main__":
    unittest.main()
