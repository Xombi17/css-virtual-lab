
# DoS & DDoS Virtual Lab

## Module
Educational simulation of normal traffic, DoS and DDoS scenarios.

## Files
- index.html: Virtual lab interface and experiment content
- style.css: Common-template-inspired styling
- script.js: Navigation, simulations, results, quiz and feedback
- normal_traffic.py: Python normal traffic simulation

## Run the frontend
Open index.html in a browser or use VS Code Live Server.

## Run the Python simulation
Run `python normal_traffic.py` from the module directory.

## Normal traffic formula
Accepted = min(Incoming, Capacity)
Dropped = Incoming - Accepted

## Expected scenarios
| Scenario | Incoming | Accepted | Dropped |
|---|---:|---:|---:|
| Normal | 20 | 20 | 0 |
| DoS | 140 | 100 | 40 |
| DDoS | 220 | 100 | 120 |

## Integration
The frontend uses sample calculations until the Flask API is available.
Confirm the endpoint, request format and response schema with Person 4
before replacing the temporary JavaScript functions.

## Limitations
This is a mathematical classroom simulation. It does not generate
real network traffic or guarantee protection against actual attacks.
