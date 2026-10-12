# DoS and DDoS Virtual Lab: Project Context and Member 3 Plan

Course: CSS TH ISE, Virtual Lab Development (TE Comp A, Fr. CRCE)
Subject incharge: Dr. Smita Ambarkar
Our experiment: **Demonstrate the DoS and DDoS attack** (allotment Sr. No. 32 to 36)
This file: context for the whole project, plus the detailed build plan for Member 3 (Simulation and JavaScript).

---

## 1. Snapshot

| Item | Detail |
|---|---|
| What we are building | An interactive, browser-only virtual lab that shows how a DoS and a DDoS attack hit a server, and how mitigations help |
| Weightage | Part of theory ISE, 20 marks |
| Group size | 5 students from the same batch |
| Tech | Plain HTML, CSS, JavaScript. No libraries, no backend |
| Repo | One shared GitHub repo (`cryptography-virtual-lab`) run by the integration team. Each group gets its own branch |
| Our deliverable | One self-contained experiment module, folder `experiments/<our-folder>/` |

### Key dates

| Date | What |
|---|---|
| Fri 16/10/2026 | Group member details due in the shared Google Doc link (in the guidelines PDF) |
| Tue 20/10/2026 | Virtual lab and documentation must be complete |
| 26/10/2026 to 31/10/2026 | Evaluation and demo during lab hours |

---

## 2. What the guidelines require (digest)

### Group rules
1. Groups of 5, everyone contributes meaningfully.
2. Faculty allots experiments. Each group builds the complete virtual lab for its experiment.
3. All groups use the same front-end tool, and the same UI, layout, colour scheme and theme.
4. Demo to faculty on the communicated schedule. Submit documentation along with the lab.
5. Verify the correctness of the experiment before submission.

### Every virtual lab should include (as applicable)
a. Aim and objectives
b. Relevant theory
c. Step-by-step procedure
d. Interactive simulation or implementation
e. Assessment / quiz
f. References
g. Feedback

The interface has to be simple, intuitive and interactive. Navigation and terminology stay consistent with the other experiments. Static content alone is not acceptable.

### Rubric (5 criteria, 4 marks each, total 20)

| Criterion | What earns a 4 |
|---|---|
| Experiment content and accuracy | Complete, accurate, well structured. Covers objective, theory, procedure, observations, results |
| Functionality and working | Every input, process, output, control and step works |
| Interactivity and simulation | Realistic simulation. User inputs produce dynamic responses and meaningful feedback or visualization |
| Presentation and demonstration | Clear, confident, technically sound. Questions answered accurately |
| Individual contribution | Each student understands and can explain their own part, and can handle technical issues on their own |

Member 3 mostly owns rows 2 and 3, and row 5 applies to everyone.

### Module rules from the integration team
- Independent, self-contained web module. Must not modify the main app or other experiments.
- Common structure: `index.html`, `script.js`, `README.md` (the group template also lists `style.css`).
- Submit: source code, experiment content, test cases, expected outputs, evaluation questions, quiz questions, and an integration README.
- The integration README must carry: Experiment ID, Experiment Name, Folder, Entry File, Navigation Title, Short Description, Input, Output, Required Libraries (the SQL Injection group's page in the PDF shows the exact format).
- Submission goes through a branch and pull request. Branches look like `group-EXP-N`.
- The integration team builds home page, listing, navigation, header/footer, common CSS/theme, and a possible common quiz framework. They test across Chrome, Edge, Firefox and different screen sizes.

---

## 3. Open items to confirm (do this first)

The PDF has a few inconsistencies. Ask the integration team (the 7-person compilation team) or Dr. Ambarkar and write the answers into this section.

| # | Question | Why it matters | Answer |
|---|---|---|---|
| 1 | What is our Experiment ID and folder name? | PDF only gives full details for SQL Injection, and that one is listed as both EXP03 and EXP08. We have no ID yet | |
| 2 | Proposed folder: `/experiments/dos-ddos/`, nav title: `DoS and DDoS Attack`. OK? | Integration links by these exact strings | |
| 3 | Exact colour theme values (hex codes) | The PDF only shows a screenshot of a brown/terracotta "Computer Science Lab Manual" style page. Need the real palette, fonts and layout | |
| 4 | Is `style.css` allowed inside our folder, or only the common CSS? | Group template has it, integration template does not | |
| 5 | Can we add extra files (for example `quiz.js`, `tests/`)? | Avoids Member 3 and Member 4 editing the same `script.js` | |
| 6 | Will integration provide a common quiz framework, and in what format? | Decides how Member 4 writes quiz data | |
| 7 | Our group has 4 roles but groups are 5 people. Who is member 5 and what do they own? | Every member must contribute meaningfully, and rubric row 5 grades each person | |
| 8 | Is the repo created yet? Which branch name is ours? | Needed before first push | |

Everything is called "Cryptography Virtual Lab" in the PDF even though the allotted experiments are mostly attacks. Ignore the naming, just follow the folder and branch conventions they give.

---

## 4. Our team split

| Member | Role | Owns |
|---|---|---|
| 1 | Research and Theory | Theory, DoS/DDoS concepts, diagrams, procedure, references |
| 2 | UI/UX and Frontend | Page layout, common theme, navigation, visual design (HTML and CSS) |
| **3 (Varad)** | **Simulation and JavaScript** | **Interactive DoS/DDoS simulation, server and traffic visualization, all functionality in JS** |
| 4 | Assessment and Documentation | Quiz, feedback, test cases, expected outputs, evaluation questions, README |
| 5 | TBD (see open item 7) | Suggested: QA/testing, GitHub and PR owner, demo lead |

### File ownership (keeps merge conflicts down)

| File | Owner | Others |
|---|---|---|
| `index.html` | Member 2 | M1 adds theory text into marked sections. M3 gets the sim section with agreed element IDs |
| `style.css` | Member 2 | M3 requests classes through the DOM contract in section 6.6 |
| `script.js` | **Member 3** | Nobody else edits it |
| quiz data / feedback | Member 4 | In a separate file if integration allows, otherwise ask M3 to expose a hook |
| `README.md` | Member 4 | M3 supplies the Input/Output and behaviour notes |

---

## 5. Member 3 deliverables

1. A working simulation in `script.js` covering normal traffic, a DoS attack, and a DDoS attack.
2. A live visualization of traffic flowing to a simulated server (canvas).
3. Live metrics: server status, CPU load, queue fill, response time, legitimate success rate, dropped requests, requests per second.
4. Controls: scenario, number of attackers, attack rate, server capacity, start, pause, reset.
5. Mitigation toggles: rate limiting, IP blocklist, scale-out, traffic scrubbing.
6. A timestamped activity log.
7. A small public API so Member 4 can write test cases against it.
8. Zero dependencies, no network calls, no storage collisions with other modules.

---

## 6. Simulation design

### 6.1 Core idea
Everything is fake. No real packets, no real servers, nothing leaves the browser. A simulated server has a fixed capacity. Simulated sources (legitimate users and attackers) send requests to it. We step the world forward in small time ticks and draw the result.

The lesson the sim has to teach:

| | DoS | DDoS |
|---|---|---|
| Sources | 1 attacker IP | Many IPs (botnet) |
| Per-source rate | Very high | Low, looks normal |
| Rate limiting per IP | Works well | Barely helps |
| IP blocklist | Works, one block ends it | Slow and partial, too many IPs |
| What helps | Block the source | Scale out, scrubbing/CDN, upstream filtering |

If the sim shows that table through behaviour, it hits the rubric for realism.

### 6.2 Entities

- **Source**: `{ id, ip, type: 'legit' | 'attacker', rate, active, blocked, lastRate }`
- **Server**: `{ capacity, queueLimit, queue, baseLatencyMs, status }`
- **Mitigations**: `{ rateLimit: {on, perIp}, blocklist: {on, threshold, ticksNeeded}, scale: {on, factor}, scrub: {on, filterPct} }`
- **Metrics**: per-tick history array for the chart

Use documentation-reserved IP ranges so nothing looks like a real target: legit users in `192.0.2.x`, attackers in `203.0.113.x` and `198.51.100.x`.

### 6.3 Default numbers (starting point, tune after testing)

| Param | Default |
|---|---|
| Tick length | 100 ms |
| Server capacity | 200 requests/sec |
| Queue limit | 400 requests |
| Base latency | 40 ms |
| Legit users | 20, each 2 req/s (total 40 req/s, about 20% load) |
| DoS | 1 attacker at 600 req/s |
| DDoS | 200 attackers at 5 req/s each (1000 req/s total) |
| Rate limit | 50 req/s per IP |
| Blocklist trigger | Over 100 req/s for 5 ticks in a row |
| Scale-out | capacity x3 |
| Scrubbing | filters 70% of attack traffic |

Sanity check on these numbers: the 50 req/s rate limit cuts the DoS from 600 to 50 (server fine), while each DDoS bot at 5 req/s is under the limit so nothing changes. The blocklist at 100 req/s catches the single DoS source but none of the 200 bots. That is exactly the story we want.

### 6.4 Per-tick model

```
dt = tickMs / 1000

for each active, unblocked source:
    n = source.rate * dt * (0.8 + 0.4 * rng())        // jitter
    if rateLimit.on: n = min(n, rateLimit.perIp * dt)
    add n to legitIn or attackIn
    source.lastRate = n / dt

if scrub.on: attackIn *= (1 - scrub.filterPct)

incoming   = legitIn + attackIn
capacity_t = server.capacity * (scale.on ? scale.factor : 1) * dt
pool       = server.queue + incoming
served     = min(pool, capacity_t)
queue      = pool - served
dropped    = max(0, queue - queueLimit);  queue = min(queue, queueLimit)

legitShare   = incoming > 0 ? legitIn / incoming : 1
legitServed  = served * legitShare
successRate  = legitIn > 0 ? min(1, legitServed / legitIn) : 1

cpu          = min(100, 100 * incoming / capacity_t)
responseMs   = baseLatency + (queue / (capacity_t / dt)) * 1000
```

Status rules (keep simple and visible to the user):

| Status | Condition |
|---|---|
| Healthy | cpu under 60% and successRate above 95% |
| Degraded | cpu 60 to 100%, or successRate 60 to 95% |
| Overloaded | queue over 80% full, or successRate 20 to 60% |
| Down | successRate under 20% for 10 ticks in a row |

This is a simplified model. The `legitShare` shortcut assumes a shared FIFO queue where legit and attack requests get served in proportion to how many of each arrived. Say that in the demo if asked. It is a teaching model, not a network simulator.

### 6.5 Visualization (canvas)

- Left: legit users (green dots). Bottom-left cluster: attackers (red dots). One red dot for DoS, a swarm for DDoS.
- Right: server box. Fill bar shows queue. Colour changes with status.
- Moving particles from sources to the server, one particle per N requests (do not draw every request, it will lag).
- Blocked sources turn grey with a cross.
- Mitigation shown as a visible shield or filter box on the path to the server.
- Below: line chart of response time and success rate over the last 60 seconds (draw it manually on a second canvas, no chart library).

Performance rule: cap particles at around 300 and drive drawing with `requestAnimationFrame`, while the model runs on a fixed `setInterval` tick, so the sim speed does not depend on the frame rate.

### 6.6 DOM contract (agree this with Member 2 in the first 2 days)

| Element ID | Type | Purpose |
|---|---|---|
| `scenario` | select | normal / dos / ddos |
| `attackers` | range or number | attacker count |
| `attack-rate` | range or number | req/s per attacker |
| `server-capacity` | range or number | req/s |
| `btn-start`, `btn-pause`, `btn-reset` | buttons | run controls |
| `mit-ratelimit`, `mit-blocklist`, `mit-scale`, `mit-scrub` | checkboxes | mitigations |
| `traffic-canvas` | canvas | live network view |
| `chart-canvas` | canvas | history chart |
| `stat-status`, `stat-cpu`, `stat-queue`, `stat-response`, `stat-success`, `stat-dropped`, `stat-rps` | elements | live metrics |
| `log-body` | element | activity log, newest on top |
| `vuln-status` | element | text such as "Vulnerable: no rate limiting" |

JS only reads and writes these IDs. Member 2 can style them freely. Put the contract into the PR description so it does not get lost.

### 6.7 Input and Output spec (for the README, Member 4 finalises)

| | Fields |
|---|---|
| Input | Scenario (Normal / DoS / DDoS), number of attackers, attack rate per attacker, server capacity, mitigation toggles |
| Output | Server status, CPU load, queue usage, response time, legitimate request success rate, dropped requests, vulnerability status, activity log |
| Required libraries | None |

The sample spec in the PDF lists `Authentication Result` and `Generated SQL Query` for the SQL experiment. Ours are different, which is fine, but confirm the integration team accepts a custom list.

### 6.8 Suggested lab components (mirrors the SQL group's 7-part layout)
1. Control panel (scenario and parameters)
2. Simulated server
3. Traffic visualization
4. Attack simulation
5. Vulnerability detection (is the server exposed? what is missing?)
6. Mitigation demonstration
7. Result and activity log

---

## 7. Code architecture

Single `script.js`, wrapped in an IIFE so nothing leaks into the global scope and breaks other experiments. Only one global is exposed: `window.DoSLab`.

```
script.js
├── CONFIG            defaults and thresholds
├── RNG               seeded random (mulberry32), for repeatable test cases
├── State             sources, server, mitigations, metrics history
├── Model             step(): the per-tick math from 6.4
├── Mitigations       rate limit, blocklist detection, scale, scrub
├── Renderer          canvas drawing and particles
├── Chart             history line chart
├── Logger            timestamped log entries into #log-body
├── UI                reads controls, writes metrics, wires events
└── Public API        window.DoSLab
```

### Skeleton to start from

```js
(() => {
  'use strict';

  const CFG = {
    tickMs: 100,
    server: { capacity: 200, queueLimit: 400, baseLatencyMs: 40 },
    legit: { users: 20, ratePerUser: 2 },
    scenarios: {
      normal: { attackers: 0, rate: 0 },
      dos:    { attackers: 1, rate: 600 },
      ddos:   { attackers: 200, rate: 5 }
    },
    mit: {
      rateLimit: { perIp: 50 },
      blocklist: { threshold: 100, ticksNeeded: 5 },
      scale:     { factor: 3 },
      scrub:     { filterPct: 0.7 }
    }
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeState(scenarioKey, seed = 1) {
    const sc = CFG.scenarios[scenarioKey];
    const sources = [];
    for (let i = 0; i < CFG.legit.users; i++)
      sources.push({ ip: `192.0.2.${i + 1}`, type: 'legit', rate: CFG.legit.ratePerUser,
                     blocked: false, over: 0, lastRate: 0 });
    for (let i = 0; i < sc.attackers; i++)
      sources.push({ ip: `203.0.113.${(i % 254) + 1}`, type: 'attacker', rate: sc.rate,
                     blocked: false, over: 0, lastRate: 0 });
    return {
      tick: 0, running: false, rng: mulberry32(seed), sources,
      server: { ...CFG.server, queue: 0, status: 'Healthy', downTicks: 0 },
      mit: { rateLimit: false, blocklist: false, scale: false, scrub: false },
      metrics: { cpu: 0, queue: 0, responseMs: CFG.server.baseLatencyMs,
                 success: 1, dropped: 0, rps: 0 },
      history: [], log: []
    };
  }

  function step(s) {
    const dt = CFG.tickMs / 1000;
    let legitIn = 0, attackIn = 0;

    for (const src of s.sources) {
      if (src.blocked) { src.lastRate = 0; continue; }
      let n = src.rate * dt * (0.8 + 0.4 * s.rng());
      if (s.mit.rateLimit) n = Math.min(n, CFG.mit.rateLimit.perIp * dt);
      src.lastRate = n / dt;
      if (src.type === 'legit') legitIn += n; else attackIn += n;

      if (s.mit.blocklist) {                       // detection
        src.over = src.lastRate > CFG.mit.blocklist.threshold ? src.over + 1 : 0;
        if (src.over >= CFG.mit.blocklist.ticksNeeded) {
          src.blocked = true;
          log(s, `Blocked ${src.ip} (${Math.round(src.lastRate)} req/s)`);
        }
      }
    }
    if (s.mit.scrub) attackIn *= (1 - CFG.mit.scrub.filterPct);

    const incoming = legitIn + attackIn;
    const capT = s.server.capacity * (s.mit.scale ? CFG.mit.scale.factor : 1) * dt;
    const pool = s.server.queue + incoming;
    const served = Math.min(pool, capT);
    let queue = pool - served;
    const dropped = Math.max(0, queue - s.server.queueLimit);
    queue = Math.min(queue, s.server.queueLimit);

    const legitShare = incoming > 0 ? legitIn / incoming : 1;
    const success = legitIn > 0 ? Math.min(1, (served * legitShare) / legitIn) : 1;

    s.server.queue = queue;
    s.metrics = {
      cpu: Math.min(100, 100 * incoming / capT),
      queue: queue / s.server.queueLimit,
      responseMs: s.server.baseLatencyMs + (queue / (capT / dt)) * 1000,
      success, dropped, rps: incoming / dt
    };
    s.server.status = classify(s);
    s.history.push({ t: s.tick, ...s.metrics });
    if (s.history.length > 600) s.history.shift();
    s.tick++;
  }

  function classify(s) {
    const m = s.metrics;
    s.server.downTicks = m.success < 0.2 ? s.server.downTicks + 1 : 0;
    if (s.server.downTicks >= 10) return 'Down';
    if (m.queue > 0.8 || m.success < 0.6) return 'Overloaded';
    if (m.cpu >= 60 || m.success < 0.95) return 'Degraded';
    return 'Healthy';
  }

  function log(s, msg) {
    s.log.unshift({ t: (s.tick * CFG.tickMs / 1000).toFixed(1) + 's', msg });
  }

  // ---- UI, renderer, chart: build these next (sections 8.2 to 8.4) ----

  let state = makeState('normal');

  window.DoSLab = {
    reset: (scenario = 'normal', seed = 1) => { state = makeState(scenario, seed); },
    setMitigation: (name, on) => { state.mit[name] = !!on; },
    step: (n = 1) => { for (let i = 0; i < n; i++) step(state); },
    getState: () => state,
    // headless run for test cases
    run: (scenario, seed, ticks, mit = {}) => {
      state = makeState(scenario, seed);
      Object.assign(state.mit, mit);
      for (let i = 0; i < ticks; i++) step(state);
      return { status: state.server.status, ...state.metrics };
    }
  };
})();
```

This runs headless in Node too if you stub `window`, which is how you get quick sanity checks before the UI exists (see 8.1).

### Integration safety rules
- Everything inside the IIFE. One global: `window.DoSLab`.
- Prefix any storage keys, CSS classes you add, and event names with `dos-`.
- No `document.body` styling, no global listeners on `window` or `document` that outlive the module, no `alert()`.
- No CDN scripts, fonts or images from the web. The page may be hosted anywhere and must work offline.
- Never touch anything outside our own folder.
- Use relative paths only.

### Repeatable test cases for Member 4
Because the RNG is seeded, `DoSLab.run('ddos', 42, 300, { rateLimit: true })` returns the same numbers every time. Member 4 can paste expected outputs into the test-case table and re-check them after any change. Agree the final numbers only after the model is frozen (section 9, Oct 17).

---

## 8. Setup and build guide

### 8.1 One-time setup (single block)

Install first if missing: Git, VS Code, and the VS Code extension "Live Server". Node.js is optional, only for headless sanity checks.

```bash
# 1. Check tools
git --version && code --version && node --version

# 2. Identify yourself to git (skip if already set)
git config --global user.name "Varad Joshi"
git config --global user.email "varadaj47@gmail.com"

# 3. Clone the shared repo once the integration team shares the URL
git clone <REPO_URL> cryptography-virtual-lab
cd cryptography-virtual-lab

# 4. Get onto the group branch, then branch off it for your own work
git fetch origin
git checkout group-EXP-<N>            # the branch the integration team gave us
git checkout -b group-EXP-<N>-m3-sim  # NOT group-EXP-<N>/m3  (see note below)

# 5. Create our module folder if it is not there yet
mkdir -p experiments/dos-ddos
cd experiments/dos-ddos
touch index.html style.css script.js README.md

# 6. Open in VS Code, then right click index.html -> "Open with Live Server"
code .

# 7. Optional headless check once script.js has the model in it
node -e "global.window={}; require('./script.js'); console.log(window.DoSLab.run('ddos',42,300))"
```

Git note: you cannot have both a branch named `group-EXP-3` and one named `group-EXP-3/m3`, git refuses it. Use a dash, as above. Merge your branch into the group branch through a pull request, and the group branch goes to `main` via the integration team's PR.

Until the repo exists, build in a local folder with the same structure and init a personal repo to keep history:

```bash
mkdir -p dos-ddos-lab && cd dos-ddos-lab
git init
touch index.html style.css script.js README.md
git add . && git commit -m "chore: scaffold module"
```

### 8.2 Commit style
Small commits, one idea each. Examples:
`feat(sim): add server queue model`, `feat(sim): rate limiting`, `feat(viz): particle renderer`, `fix(sim): clamp negative queue`, `docs: add input/output notes`.
Pull from the group branch before you start each day: `git pull origin group-EXP-<N>`.

### 8.3 Build order (do not skip ahead)

1. **Model first, no UI.** Get `step()` and `run()` correct. Check in Node or the browser console that the three scenarios behave as in 6.3.
2. **Wire controls and the metrics panel** to the model using the IDs from 6.6. Use a bare-bones HTML page if Member 2 is not ready.
3. **Canvas renderer.** Static layout, then particles, then status colours.
4. **History chart.**
5. **Mitigations** and the log. Make sure each mitigation has a visible effect in the canvas and the log.
6. **Vulnerability status text.** For example: "Vulnerable: no rate limit, no blocklist" turns into "Partially protected: rate limiting on, but distributed sources bypass it."
7. **Edge cases and polish.** Reset mid-run, switching scenario while running, zero attackers, extreme sliders, tab hidden.
8. **Handover.** Update the DOM contract, write the behaviour notes for Member 4, add a short code walkthrough for yourself.

### 8.4 Expected behaviour check (acceptance tests for the model)

| Scenario | Mitigation | Expected after ~30 s |
|---|---|---|
| Normal | none | Healthy, success about 100%, CPU about 20% |
| DoS | none | Overloaded or Down, success low, response time at queue limit |
| DoS | rate limit | Healthy or Degraded, success high |
| DoS | blocklist | Down at first, then recovers after the attacker is blocked (about 0.5 s plus queue drain) |
| DDoS | none | Down |
| DDoS | rate limit | Still bad (bots stay under the limit) |
| DDoS | blocklist | Still bad |
| DDoS | scale-out | Improves but still stressed (1000 req/s vs 600 capacity) |
| DDoS | scale + scrub | Healthy or Degraded |

If any row misbehaves, change the numbers in `CFG`, not the model logic.

### 8.5 Browser compatibility
Test in Chrome, Edge and Firefox. Avoid very new APIs. Check at about 1366x768 (typical lab laptop) and a narrow width.

---

## 9. Timeline

Today is Mon 05/10/2026. The hard deadline is Tue 20/10. Group registration is due Fri 16/10.

| Dates | Plan |
|---|---|
| Mon 5 to Tue 6 Oct | Read this doc with the team. Settle the open items in section 3. Agree the DOM contract with Member 2. Confirm the 5th member. Set up repo and tools |
| Wed 7 to Fri 9 Oct | Model and `run()` working, acceptance table passing in console |
| Sat 10 to Mon 12 Oct | Controls, metrics panel, canvas renderer |
| Tue 13 to Wed 14 Oct | Mitigations, log, vulnerability status, chart |
| Thu 15 Oct | First integrated build with Member 2's real layout. Submit group details by Fri 16 at the latest |
| Fri 16 to Sat 17 Oct | Bug fixing. Freeze model numbers so Member 4 can lock expected outputs |
| Sun 18 Oct | Cross browser and screen size testing. Final polish |
| Mon 19 Oct | Code freeze, PR opened, integration README checked |
| Tue 20 Oct | Buffer day and final submission |
| 21 to 25 Oct | Demo rehearsal, everyone explains their own part |
| 26 to 31 Oct | Evaluation |

---

## 10. Definition of done (Member 3)

- [ ] Normal, DoS and DDoS scenarios all run and look clearly different
- [ ] All four mitigations work and match the table in 8.4
- [ ] Every control in the DOM contract is wired and has an effect
- [ ] Reset works at any moment, and switching scenario mid-run does not break state
- [ ] No console errors in Chrome, Edge, Firefox
- [ ] No network requests, no external files, no globals except `DoSLab`
- [ ] Page stays smooth with 200+ attackers
- [ ] `DoSLab.run()` returns repeatable results for the same seed
- [ ] Code commented where the model is non-obvious
- [ ] Input/Output notes handed to Member 4
- [ ] Changes merged through a pull request, nothing outside our folder touched
- [ ] I can explain every function in `script.js` without looking at it

---

## 11. Viva prep (Member 3)

Expect to be asked about your part individually. Short answers you should be able to give:

| Question | Answer in one or two lines |
|---|---|
| What is a DoS attack? | One source floods a service so legitimate users cannot get served |
| What makes DDoS different? | The flood comes from many distributed sources (often a botnet), so blocking one IP does nothing |
| Why does rate limiting help DoS but not DDoS in your sim? | Each bot sends below the per-IP limit, the damage comes from the sum |
| How does your simulation work? | Fixed time ticks. Sources generate requests, the server processes up to its capacity, the rest queue or drop |
| Why a queue limit? | Real servers have finite buffers. When full, new requests are dropped, which is the denial of service |
| How do you compute response time? | Base latency plus the time it takes to drain the current queue at server capacity |
| Why seeded random numbers? | Same seed gives the same run, so test cases and expected outputs are repeatable |
| How did you keep it independent of the main app? | IIFE, one global, prefixed names, no external dependencies, nothing outside our folder |
| What are the limits of your model? | Simplified: shared FIFO queue, no real protocol behaviour, no connection state, rates are averages with jitter |
| Real mitigations not in the sim? | Upstream ISP filtering, anycast/CDN absorption, SYN cookies, ingress filtering (BCP 38) |
| Is anything here a real attack? | No. Everything is simulated in the browser, no packets are sent anywhere |

---

## 12. Scope and ethics

This lab is a **simulation for teaching**. Do not add any code that sends real traffic, opens sockets, calls `fetch` or `XMLHttpRequest` to other hosts, or targets real IPs and domains. Keep all addresses in the reserved documentation ranges (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`). That is also better for the demo: nothing can go wrong in front of faculty.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| DoS | Denial of Service, one source |
| DDoS | Distributed DoS, many sources |
| Botnet | A network of compromised machines controlled by an attacker |
| Volumetric attack | Exhausts bandwidth or request capacity with sheer volume |
| Rate limiting | Capping requests per source per time window |
| Blocklist | Dropping all traffic from specific IPs |
| Scrubbing | Filtering attack traffic out before it reaches the server, usually at a provider |
| Scale-out | Adding capacity (more servers behind a load balancer) |
| Queue | Buffer of requests waiting to be processed |
| Availability | The "A" in the CIA triad, the property DoS attacks target |

---

## 14. References (starting points, Member 1 owns the final list)

- RFC 4732: Internet Denial-of-Service Considerations
- RFC 4987: TCP SYN Flooding Attacks and Common Mitigations
- RFC 2827 (BCP 38): Network Ingress Filtering
- CISA: Understanding Denial-of-Service Attacks
- Cloudflare Learning Center: What is a DDoS attack

Check each link and cite properly before it goes into the lab page.

---

## 15. Decisions log

Keep a running list here so the repo explains itself later.

| Date | Decision | Who |
|---|---|---|
| | | |
