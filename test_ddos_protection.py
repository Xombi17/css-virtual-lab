"""
test_ddos_protection.py - Unit and invariant tests for DDoS simulation and protection modules.

Follows the same unittest structure and style as test_dos_attack.py.
"""
import unittest
from ddos_attack import simulate_ddos, estimate_resource_usage
from protection import allowed_attack_after_limit


class TestDdosSimulationAndProtection(unittest.TestCase):
    """Test suite for ddos_attack.py and protection.py."""

    def test_case_1_unmitigated_ddos_overload(self):
        """1. 5x40, no protection, legit 20, cap 100 -> attack 200, offered 220, incoming 220, accepted 100, dropped 120, blocked 0, Overloaded."""
        res = simulate_ddos(
            legitimate_rate=20,
            attacker_count=5,
            attack_rate_per_source=40,
            capacity=100,
            protection_enabled=False,
            per_source_limit=None,
        )
        self.assertEqual(res["attack_incoming"], 200)
        self.assertEqual(res["offered_total"], 220)
        self.assertEqual(res["incoming"], 220)
        self.assertEqual(res["accepted"], 100)
        self.assertEqual(res["dropped"], 120)
        self.assertEqual(res["blocked"], 0)
        self.assertEqual(res["status"], "Overloaded")
        self.assertEqual(res["service_state"], "Unresponsive")
        self.assertGreater(res["cpu_percent"], 90.0)

    def test_case_2_ddos_with_per_source_rate_limiting(self):
        """2. Same with limit 10/source -> allowed 50, blocked 150, incoming 70, accepted 70, dropped 0, Normal."""
        res = simulate_ddos(
            legitimate_rate=20,
            attacker_count=5,
            attack_rate_per_source=40,
            capacity=100,
            protection_enabled=True,
            per_source_limit=10,
        )
        self.assertEqual(res["attack_incoming"], 200)
        self.assertEqual(res["offered_total"], 220)
        self.assertEqual(res["blocked"], 150)
        self.assertEqual(res["incoming"], 70)
        self.assertEqual(res["accepted"], 70)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "Normal")
        self.assertEqual(res["service_state"], "Responsive")
        self.assertEqual(res["legitimate_accepted"], 20.0)

    def test_case_3_rate_below_limit(self):
        """3. Rate below limit (5x5, limit 10) -> blocked 0."""
        res = simulate_ddos(
            legitimate_rate=20,
            attacker_count=5,
            attack_rate_per_source=5,
            capacity=100,
            protection_enabled=True,
            per_source_limit=10,
        )
        self.assertEqual(res["blocked"], 0)
        self.assertEqual(res["attack_incoming"], 25)
        self.assertEqual(res["incoming"], 45)
        self.assertEqual(res["accepted"], 45)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "Normal")

    def test_case_4_exactly_at_capacity(self):
        """4. Exactly at capacity -> 'At Capacity', dropped 0."""
        # legit 20 + 2x40 = 100 incoming, capacity 100
        res = simulate_ddos(
            legitimate_rate=20,
            attacker_count=2,
            attack_rate_per_source=40,
            capacity=100,
            protection_enabled=False,
        )
        self.assertEqual(res["incoming"], 100)
        self.assertEqual(res["accepted"], 100)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "At Capacity")
        self.assertEqual(res["service_state"], "Slow")

    def test_case_5_protection_on_but_still_overloaded(self):
        """5. Protection on but still overloaded (50x40, limit 10, legit 20, cap 100) -> blocked > 0 AND dropped > 0."""
        # 50 bots * 40 = 2000 offered. Limit 10 -> allowed 50*10 = 500, blocked 1500.
        # incoming = 20 + 500 = 520. Cap = 100 -> accepted 100, dropped 420.
        res = simulate_ddos(
            legitimate_rate=20,
            attacker_count=50,
            attack_rate_per_source=40,
            capacity=100,
            protection_enabled=True,
            per_source_limit=10,
        )
        self.assertGreater(res["blocked"], 0)
        self.assertGreater(res["dropped"], 0)
        self.assertEqual(res["blocked"], 1500)
        self.assertEqual(res["incoming"], 520)
        self.assertEqual(res["accepted"], 100)
        self.assertEqual(res["dropped"], 420)
        self.assertEqual(res["status"], "Overloaded")
        self.assertEqual(res["service_state"], "Unresponsive")

    def test_case_6_zero_attack_rate_behaves_like_normal_traffic(self):
        """6. Zero attack rate behaves like normal traffic."""
        res = simulate_ddos(
            legitimate_rate=30,
            attacker_count=10,
            attack_rate_per_source=0,
            capacity=100,
            protection_enabled=False,
        )
        self.assertEqual(res["attack_incoming"], 0)
        self.assertEqual(res["incoming"], 30)
        self.assertEqual(res["accepted"], 30)
        self.assertEqual(res["dropped"], 0)
        self.assertEqual(res["status"], "Normal")
        self.assertEqual(res["legitimate_accepted"], 30.0)

    def test_case_7_validation_errors(self):
        """7. Validation errors for every bad input."""
        # Negative legitimate_rate
        with self.assertRaises(ValueError):
            simulate_ddos(-1, 5, 10, 100)

        # Negative attack_rate_per_source
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, -1, 100)

        # Attacker count < 1
        with self.assertRaises(ValueError):
            simulate_ddos(20, 0, 10, 100)
        with self.assertRaises(ValueError):
            simulate_ddos(20, -5, 10, 100)

        # Non-integer attacker_count
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5.5, 10, 100)

        # Capacity <= 0
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, 0)
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, -50)

        # Boolean inputs treated strictly
        with self.assertRaises(ValueError):
            simulate_ddos(True, 5, 10, 100)
        with self.assertRaises(ValueError):
            simulate_ddos(20, False, 10, 100)
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, True, 100)
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, False)

        # Protection enabled without per_source_limit
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, 100, protection_enabled=True, per_source_limit=None)

        # Protection enabled with negative per_source_limit
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, 100, protection_enabled=True, per_source_limit=-5)

        # Protection enabled with non-integer limit
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, 100, protection_enabled=True, per_source_limit=10.5)

        # Non-boolean protection_enabled
        with self.assertRaises(ValueError):
            simulate_ddos(20, 5, 10, 100, protection_enabled="yes", per_source_limit=10)

    def test_case_8_invariants_over_many_combos(self):
        """8. Invariants over many combos:
        incoming + blocked == offered_total
        accepted + dropped == incoming
        accepted <= capacity
        values >= 0
        legitimate_accepted <= legitimate_incoming
        """
        combos = [
            # (legit, count, rate, cap, prot, limit)
            (0, 1, 0, 50, False, None),
            (10, 1, 10, 50, False, None),
            (50, 1, 50, 100, False, None),
            (20, 10, 15, 100, True, 5),
            (30, 20, 50, 200, True, 20),
            (0, 5, 100, 50, False, None),
            (100, 1, 0, 50, False, None),
            (80, 50, 30, 100, True, 10),
            (15, 3, 25, 90, True, 30),
            (40, 100, 10, 500, False, None),
        ]

        for legit, count, rate, cap, prot, limit in combos:
            with self.subTest(legit=legit, count=count, rate=rate, cap=cap, prot=prot, limit=limit):
                res = simulate_ddos(legit, count, rate, cap, prot, limit)

                # Invariant 1: incoming + blocked == offered_total
                self.assertEqual(res["incoming"] + res["blocked"], res["offered_total"])

                # Invariant 2: accepted + dropped == incoming
                self.assertEqual(res["accepted"] + res["dropped"], res["incoming"])

                # Invariant 3: accepted <= capacity
                self.assertLessEqual(res["accepted"], cap)

                # Invariant 4: non-negative values
                self.assertGreaterEqual(res["offered_total"], 0)
                self.assertGreaterEqual(res["incoming"], 0)
                self.assertGreaterEqual(res["accepted"], 0)
                self.assertGreaterEqual(res["dropped"], 0)
                self.assertGreaterEqual(res["blocked"], 0)
                self.assertGreaterEqual(res["legitimate_accepted"], 0)

                # Invariant 5: legitimate_accepted <= legitimate_incoming
                self.assertLessEqual(res["legitimate_accepted"], res["legitimate_incoming"])

    def test_case_9_all_interface_keys_and_resource_bounds(self):
        """9. All interface keys present; estimate_resource_usage monotonic and bounded."""
        res = simulate_ddos(25, 4, 30, 100, True, 15)

        required_keys = [
            "scenario",
            "offered_total",
            "incoming",
            "accepted",
            "dropped",
            "blocked",
            "legitimate_incoming",
            "legitimate_accepted",
            "attack_incoming",
            "status",
            "protection_enabled",
            "message",
            "packets_per_sec",
            "cpu_percent",
            "ram_percent",
            "service_state",
        ]
        for key in required_keys:
            self.assertIn(key, res, f"Missing required interface key '{key}'")

        # Monotonicity test of estimate_resource_usage
        r1 = estimate_resource_usage(0.2)
        r2 = estimate_resource_usage(0.5)
        r3 = estimate_resource_usage(0.95)
        r4 = estimate_resource_usage(1.5)

        self.assertLessEqual(r1["cpu_percent"], r2["cpu_percent"])
        self.assertLessEqual(r2["cpu_percent"], r3["cpu_percent"])
        self.assertLessEqual(r3["cpu_percent"], r4["cpu_percent"])

        self.assertLessEqual(r1["ram_percent"], r2["ram_percent"])
        self.assertLessEqual(r2["ram_percent"], r3["ram_percent"])
        self.assertLessEqual(r3["ram_percent"], r4["ram_percent"])

        # Bounds check
        for r in [r1, r2, r3, r4]:
            self.assertGreaterEqual(r["cpu_percent"], 2.0)
            self.assertLessEqual(r["cpu_percent"], 99.0)
            self.assertGreaterEqual(r["ram_percent"], 20.0)
            self.assertLessEqual(r["ram_percent"], 95.0)

        # Service states
        self.assertEqual(r1["service_state"], "Responsive")
        self.assertEqual(r3["service_state"], "Slow")
        self.assertEqual(r4["service_state"], "Unresponsive")

    def test_protection_module_direct(self):
        """Direct unit tests for protection.py."""
        # Under limit
        allowed, blocked = allowed_attack_after_limit(5, 8, 10)
        self.assertEqual(allowed, 40)
        self.assertEqual(blocked, 0)

        # At limit
        allowed, blocked = allowed_attack_after_limit(5, 10, 10)
        self.assertEqual(allowed, 50)
        self.assertEqual(blocked, 0)

        # Over limit
        allowed, blocked = allowed_attack_after_limit(5, 25, 10)
        self.assertEqual(allowed, 50)
        self.assertEqual(blocked, 75)

        # Bad inputs
        with self.assertRaises(ValueError):
            allowed_attack_after_limit(0, 10, 10)
        with self.assertRaises(ValueError):
            allowed_attack_after_limit(5, -1, 10)
        with self.assertRaises(ValueError):
            allowed_attack_after_limit(5, 10, -1)


if __name__ == "__main__":
    unittest.main()
