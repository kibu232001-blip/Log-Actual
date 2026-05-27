# LOG ACTUAL
### Theater Sustainment Command Simulation

> *"Amateurs study tactics. Professionals study logistics."*
> — General Omar Bradley, U.S. Army

---

**LOG ACTUAL** is a real-time military logistics strategy game built on U.S. Army doctrine. You command a theater distribution network under sustained enemy pressure. Supply runs out. Units go dark. The enemy learns your patterns and hits your routes. Every decision has a consequence. No guardrails.

Built by **KibuglogalVentures LLC**.

---

## What It Is

A sustainment simulation grounded in FM 4-0, DA Pam 710-2-1, and ATP 4-0. You manage six forward operating units across a live geographic map, sustaining them through seven classes of supply while an adaptive enemy AI systematically targets your lines of communication.

This is not a combat game. There are no weapons to fire, no battles to win. You win by keeping your units alive long enough to matter. You lose when your distribution network collapses.

---

## Core Mechanics

**Supply System**
- Seven classes of supply tracked per unit: Class I (food/water), II (equipment), III (fuel/POL), IV (construction), V (ammunition), VIII (medical), IX (repair parts)
- Burn rates scale with operational tempo and campaign phase
- Equipment Readiness Rate (ERR) driven by Class IX availability
- Personnel strength depletes from fatigue and battlefield casualties

**Commander-Directed Logistics**
- No automatic resupply — every convoy is a commander decision
- Multi-class cargo loading: mix CL III, CL V, CL VIII in a single run
- Asset type selection: Ground Convoy / Air Sortie / Helicopter / Sea Lift
- Route choice affects enemy targeting — they track your patterns

**Enemy AI**
- Four-phase escalation tied to campaign day and player behavior
- Learns which routes you favor and ambushes them
- Reacts when you dispatch convoys — COL Petrov notices
- Gets more ruthless the longer you go without making decisions
- Multi-vector simultaneous attacks in later phases

**Battlefield Feed**
- Live events: convoy ambushes, bridge demolitions, FARP strikes, depot attacks, mass casualties
- Every event forces a commander decision with a 10-second countdown
- No response = worst outcome applied automatically
- Events reflect actual game state — if it says Class III is at 14%, it is

**Commander Popups**
- 31 scripted C&C-style events across the full campaign arc
- Enemy commanders taunt, threaten, and adapt
- Friendly commanders beg, demand, and despair
- Fires from Day 1, escalates through Day 30

**Theater Map**
- Real geographic map (OpenStreetMap) per scenario
- NATO tactical symbols on all nodes (APP-6 / FM 1-02.2)
- Incoming missile and drone animations when enemy attacks fire
- Weather effects: rain, storm, fog, sandstorm, typhoon, tropical squall — theater-specific
- Click any feed event → map flies to the affected location

---

## Six Campaign Theaters

| Campaign | Theater | Entry Points | Forward Units |
|---|---|---|---|
| **Iron Sustain** | European Theater — Belgium to Poland | Antwerp, Rotterdam, Bremerhaven | Warsaw, Gdansk, Krakow, Vilnius |
| **Baltic Shield** | NATO eFP — Baltic States | Riga, Tallinn, Klaipeda | Tallinn, Tartu, Kaunas, Siauliai |
| **Desert Lines** | CENTCOM — Jordan to Iraq | Aqaba, Baghdad APOD | Rutbah, Ramadi, Mosul, Tikrit |
| **Sand Bridge** | ARCENT — UAE to Kuwait | Jebel Ali, Abu Dhabi | Camp Buehring, Arifjan, Ariz |
| **Pacific Push** | USFK — Korean Peninsula | Busan, Incheon | Camp Humphreys, Casey, Walker |
| **Island Hop** | INDOPACOM — Pacific Chain | Guam (Apra Harbor) | Tinian, Palau, Yap, Chuuk |

Each theater has its own node network, unit roster, briefing team, weather patterns, and distribution challenges.

---

## Failure Conditions

The campaign ends when you fail to sustain:

- **Theater Collapse** — 30%+ of units in STONEWALL simultaneously
- **Sigma Collapse** — theater sigma drops below 1.0σ
- **Force Attrition** — 2+ units go DARK (zero supply + personnel collapse)
- **Extended Stonewall** — any unit holds STONEWALL for 3+ consecutive days
- **Unit Collapse** — any unit at zero readiness for 2+ days

---

## Campaign Phases

| Phase | Days | Description |
|---|---|---|
| **PH I — CONTACT** | 1–5 | Conflict already ongoing. Units stressed before you arrive. |
| **PH II — ESCALATION** | 6–12 | First deliberate LOC interdiction. Patterns exploited. |
| **PH III — DECISIVE ACTION** | 13–20 | Full combat ops. Enemy targets your network as primary objective. |
| **PH IV — ATTRITION** | 21–26 | Extended lines. Personnel degrading. Enemy knows your routes. |
| **PH V — CULMINATION** | 27–30 | Breaking point. One side folds. |

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| State | Zustand |
| Map | Leaflet + OpenStreetMap |
| Build | Vite 5 |
| Mobile | Capacitor (Android APK via PWABuilder) |
| Deployment | Cloudflare Pages |

---

## Running Locally

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build
```

Node.js 18+ required.

---

## Project Structure

```
src/
├── components/
│   ├── Campaign/         # After Action Review screen
│   ├── Commanders/       # C&C-style commander popup
│   ├── Events/           # Commander decision modal (10-sec countdown)
│   ├── HUD/              # TopBar with timer and metrics
│   ├── MissionBrief/     # OPORD briefing with VOT
│   ├── Sidebar/          # Unit readiness + supply status
│   ├── Splash/           # Cinematic intro, splash, quote screens
│   └── TheaterMap/       # Map, feed, nodes, weather, attack animations
├── data/
│   ├── Commanders.ts     # 31 commander events (enemy + friendly)
│   ├── MTOE.ts           # Army MTOE burn rate engine
│   ├── briefingTeams.ts  # 6 theater-specific briefing teams
│   ├── scenarioNodes.ts  # 6 theater node networks (geo coords)
│   ├── unitRosters.ts    # Theater-correct unit names per scenario
│   └── quotes.ts         # 20 logistics doctrine quotes
├── engine/
│   ├── EnemyAI.ts        # 4-phase adaptive enemy AI
│   └── EventResponseGenerator.ts  # Contextual multi-option responses
└── store/
    └── gameStore.ts      # Zustand game state
```

---

## Doctrine References

- FM 4-0: Sustainment
- ADP 4-0: Sustainment
- ATP 4-0: Sustainment Operations
- DA Pam 710-2-1: Unit Supply Operations
- ATP 4-11: Army Motor Transport Operations
- FM 1-02.2: Military Symbols (NATO APP-6)
- FM 3-0: Operations (campaign phase structure)

---

## About

Built by **Kirk Bucknor** (SFC, U.S. Army, 21st Theater Sustainment Command) as part of KibuglogalVentures LLC's software portfolio.

The sustainment domain is underrepresented in serious games. LOG ACTUAL exists to fill that gap — a training simulation and commercial game that respects the complexity of theater logistics without simplifying it into an abstraction.

**Classification:** UNCLASSIFIED // EXERCISE // FOR TRAINING PURPOSES ONLY

---

## License

© 2025 KibuglogalVentures LLC. All rights reserved.

---

*Every corner of the battlefield has something that needs supply. LOG ACTUAL makes sure you never forget it.*
