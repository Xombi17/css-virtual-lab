"""
test_dos_attack.py - Unit tests for dos_attack.py.
"""
import unittest
from dos_attack import simulate_dos

class TestDosSimulation(unittest.TestCase):

    def test_normal_without_attack(self):
        res = simulate_dos(40, 0, 100)
        self.assertEqual(res["incoming"], 40)
        self.assertEqual(res["accepted"], 40)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "Normal")
        self.assertEqual(res["utilization_percent"], 40.0)
        self.assertEqual(res["drop_percent"], 0.0)
        self.assertEqual(res["excess_requests"], 0)

    def test_at_capacity(self):
        res = simulate_dos(40, 60, 100)
        self.assertEqual(res["incoming"], 100)
        self.assertEqual(res["accepted"], 100)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "Normal")
        self.assertEqual(res["utilization_percent"], 100.0)
        self.assertEqual(res["drop_percent"], 0.0)
        self.assertEqual(res["excess_requests"], 0)

    def test_overloaded_with_attack(self):
        res = simulate_dos(40, 100, 100)
        self.assertEqual(res["incoming"], 140)
        self.assertEqual(res["accepted"], 100)
        self.assertEqual(res["dropped"], 40)
        self.assertEqual(res["status"], "Overloaded")
        self.assertEqual(res["utilization_percent"], 100.0)
        self.assertEqual(res["drop_percent"], 28.57)
        self.assertEqual(res["excess_requests"], 40)

    def test_zero_traffic(self):
        res = simulate_dos(0, 0, 100)
        self.assertEqual(res["incoming"], 0)
        self.assertEqual(res["accepted"], 0)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "Normal")
        self.assertEqual(res["utilization_percent"], 0.0)
        self.assertEqual(res["drop_percent"], 0.0)
        self.assertEqual(res["excess_requests"], 0)

    def test_legitimate_traffic_exceeds_capacity(self):
        res = simulate_dos(120, 0, 100)
        self.assertEqual(res["incoming"], 120)
        self.assertEqual(res["accepted"], 100)
        self.assertEqual(res["dropped"], 20)
        self.assertEqual(res["status"], "Overloaded")
        self.assertEqual(res["utilization_percent"], 100.0)
        self.assertEqual(res["drop_percent"], 16.67)
        self.assertEqual(res["excess_requests"], 20)

    def test_negative_legitimate_rate(self):
        with self.assertRaises(ValueError):
            simulate_dos(-1, 50, 100)

    def test_negative_attack_rate(self):
        with self.assertRaises(ValueError):
            simulate_dos(50, -5, 100)

    def test_zero_capacity(self):
        with self.assertRaises(ValueError):
            simulate_dos(50, 50, 0)

    def test_negative_capacity(self):
        with self.assertRaises(ValueError):
            simulate_dos(50, 50, -10)

    def test_float_inputs(self):
        with self.assertRaises(ValueError):
            simulate_dos(40.5, 50, 100)
        with self.assertRaises(ValueError):
            simulate_dos(40, 50.2, 100)
        with self.assertRaises(ValueError):
            simulate_dos(40, 50, 100.5)

    def test_string_inputs(self):
        with self.assertRaises(ValueError):
            simulate_dos("40", 50, 100)

    def test_boolean_inputs(self):
        with self.assertRaises(ValueError):
            simulate_dos(True, 50, 100)
        with self.assertRaises(ValueError):
            simulate_dos(40, False, 100)
        with self.assertRaises(ValueError):
            simulate_dos(40, 50, True)

if __name__ == "__main__":
    unittest.main()
