
def simulate_normal(legitimate_rate, capacity):
    if not isinstance(legitimate_rate, int) or isinstance(legitimate_rate, bool):
        raise ValueError("Legitimate rate must be a whole number.")

    if not isinstance(capacity, int) or isinstance(capacity, bool):
        raise ValueError("Capacity must be a whole number.")

    if legitimate_rate < 0:
        raise ValueError("Legitimate traffic cannot be negative.")

    if capacity <= 0:
        raise ValueError("Capacity must be greater than zero.")

    incoming = legitimate_rate
    accepted = min(incoming, capacity)
    dropped = incoming - accepted

    return {
        "incoming": incoming,
        "accepted": accepted,
        "dropped": dropped,
        "status": "Normal" if dropped == 0 else "Overloaded"
    }


if __name__ == "__main__":
    test_cases = [
        (20, 100),
        (150, 100),
        (0, 100)
    ]

    for traffic, capacity in test_cases:
        print(f"\nTraffic: {traffic}, Capacity: {capacity}")
        print(simulate_normal(traffic, capacity))
