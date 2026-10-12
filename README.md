# 🛡️ DoS and DDoS Attack Virtual Lab

> **Course:** Cryptography & System Security (CSS TH ISE) — Virtual Lab Development  
> **Institution:** Department of Computer Engineering, Fr. Conceicao Rodrigues College of Engineering (Fr. CRCE)  
> **Faculty Incharge:** Dr. Smita Ambarkar  
> **Experiment:** Demonstrate the DoS and DDoS attack

---

## 📌 Overview

This repository contains an interactive, web-based **Virtual Laboratory** designed to demonstrate the dynamics of **Denial of Service (DoS)** and **Distributed Denial of Service (DDoS)** attacks. 

The lab enables students and security practitioners to observe how high-volume request streams exhaust server capacity, lead to request drops and elevated latency, and how modern defensive countermeasures (such as Rate Limiting, SYN Cookies, and Traffic Scrubbing) preserve service availability.

---

## ✨ Features

- 🎮 **Interactive Simulation Panel:** Dynamically tune Legitimate Request Rate (req/s), Attack Intensity (req/s), and Server Capacity limits.
- 📊 **Real-time Telemetry & Visualizations:**
  - Dynamic request distribution donut charts.
  - Time-series traffic vs. capacity trend charts.
  - Live server health metrics: CPU load, Memory utilization, Latency, and Packet Drop Rate.
- 🛡️ **Active Mitigation Playground:**
  - **Rate Limiting (Token Bucket):** Throttle aggressive client IP requests.
  - **SYN Cookies:** Protect against connection queue starvation.
  - **IP Blacklisting / Traffic Scrubbing:** Isolate anomalous traffic streams.
- 🧪 **Dual Execution Support:** Runs either completely standalone in the browser (client-side JS simulation) or backed by a Flask Python API engine.
- 🔬 **Comprehensive Unit Test Suite:** Automated validation of attack simulation formulas and API endpoint behavior.

---

## 📂 Repository Structure

```text
├── index.html               # Main Virtual Lab interactive interface
├── styles.css               # Modern, responsive CSS design system
├── monitoring.js            # Real-time traffic simulator & dashboard telemetry
├── app.py                   # Flask backend server providing simulation REST APIs
├── dos_attack.py            # Core DoS/DDoS simulation algorithm & mathematical models
├── test_app.py              # Test suite for Flask API endpoints
├── test_dos_attack.py       # Test suite for core simulation logic
├── requirements.txt         # Python project dependencies
├── DOS-DDOS-LAB-CONTEXT.md  # Detailed course context and laboratory development notes
└── .gitignore               # Ignored build and cache artifacts
```

---

## 🚀 Getting Started

### Option 1: Standalone Browser (Zero Installation)
Simply open [`index.html`](index.html) in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari). All simulation mechanics, telemetry charts, and mitigation controls run entirely client-side.

### Option 2: Running with Python Flask Backend
To run with the Python simulation server:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Xombi17/css-virtual-lab.git
   cd css-virtual-lab
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   python app.py
   ```

4. **Access the lab:**
   Open your browser and navigate to:
   👉 `http://127.0.0.1:5050`

---

## 🧪 Running Tests

Ensure system reliability by executing the test suite:

```bash
# Run simulation engine tests
python test_dos_attack.py

# Run API endpoint tests
python test_app.py
```

---

## 📖 Extended Documentation

For full project guidelines, academic rubrics, and detailed role responsibilities, refer to [`DOS-DDOS-LAB-CONTEXT.md`](DOS-DDOS-LAB-CONTEXT.md).
