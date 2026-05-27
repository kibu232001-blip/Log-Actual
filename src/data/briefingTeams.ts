/**
 * LOG ACTUAL — Briefing Teams
 * KibuglogalVentures LLC
 *
 * Each scenario has a unique briefing team with distinct personalities,
 * voice profiles, and dialog written for their specific theater and role.
 */

export type VoiceProfile = {
  rate:  number    // 0.5 - 2.0
  pitch: number    // 0 - 2.0
  gender: 'M' | 'F'
}

export interface BriefingCharacter {
  id:           string
  name:         string
  rank:         string
  role:         string
  personality:  string    // one-line description for rendering style
  portraitStyle:'CDR'|'SGM'|'S4'|'FEMALE_CDR'|'WARRANT'|'ALLIED'
  accentColor:  string
  voice:        VoiceProfile
}

export interface BriefingSection {
  tab:    string    // SITUATION, MISSION, EXECUTION, SERVICE SUPPORT, COMMAND
  speakerId: string
  lines:  string[]
}

export interface BriefingTeam {
  scenarioId:  string
  teamName:    string
  location:    string    // "USAREUR HQ, Wiesbaden" etc.
  briefingDate:string
  characters:  BriefingCharacter[]
  sections:    BriefingSection[]
  openingLine: string    // first thing said when dialog opens
}

// ── CAMPAIGN 1: IRON SUSTAIN — EUROPEAN THEATER ───────────────────────────────
export const TEAM_EUROPE: BriefingTeam = {
  scenarioId:'CAMPAIGN_1', teamName:'USAREUR-AF J4 BRIEFING TEAM',
  location:'USAREUR-AF HQ, Wiesbaden, Germany', briefingDate:'D-DAY+0',
  openingLine: "Close the door. What I am about to tell you does not leave this room.",
  characters:[
    { id:'LTG_HAYES', name:'LTG HAYES', rank:'Lieutenant General', role:'USAREUR-AF Deputy Commanding General',
      personality:'Direct. No tolerance for excuses. Has seen three wars. Expects you already know the answer.',
      portraitStyle:'CDR', accentColor:'#00ff88',
      voice:{ rate:0.88, pitch:0.80, gender:'M' } },
    { id:'SGM_FORD', name:'SGM FORD', rank:'Sergeant Major', role:'Theater Senior Logistics NCO',
      personality:'Blunt. Calls things exactly what they are. Has been running logistics since before you were commissioned.',
      portraitStyle:'SGM', accentColor:'#ffaa00',
      voice:{ rate:0.92, pitch:0.75, gender:'M' } },
    { id:'MAJ_CHEN', name:'MAJ CHEN', rank:'Major', role:'J4 Plans Officer',
      personality:'Precise. Numbers-first. Quotes DA Pam 710-2-1 from memory. Gets uncomfortable when people improvise.',
      portraitStyle:'S4', accentColor:'#00aaff',
      voice:{ rate:1.05, pitch:1.00, gender:'F' } },
  ],
  sections:[
    { tab:'SITUATION', speakerId:'LTG_HAYES', lines:[
      "The situation is this. Eleven days ago, OPFOR crossed the line of departure. Our forward units have been in contact continuously since.",
      "Supply lines are stretched. The enemy knows it. Their entire campaign plan is built around collapsing our distribution network before we can stabilize it.",
      "You are inheriting a theater that is already under stress. Every commodity is below optimal. Some units are below threshold.",
      "The question is whether you can hold this together long enough for the operational picture to shift in our favor.",
    ]},
    { tab:'MISSION', speakerId:'MAJ_CHEN', lines:[
      "Your mission: maintain theater distribution at or above minimum combat threshold across all six units for thirty days.",
      "Critical thresholds — Class III below twenty percent grounds aviation. Class V below twenty-five percent halts offensive operations. Class VIII below twenty percent increases mass casualty risk.",
      "Success metric is sigma level. You need to hold at or above two-point-five sigma. Below one-point-five and theater headquarters will question your effectiveness.",
      "You have full authority over convoy routing, air asset tasking, and lateral transfer between units. Use all of it.",
    ]},
    { tab:'EXECUTION', speakerId:'SGM_FORD', lines:[
      "Here is what you need to understand about execution. The routes on your map are not guaranteed. The enemy has been watching our convoy patterns for two weeks.",
      "MSR Iron is compromised. I would not put a vehicle on it without an escort and a prayer. Route Delta adds six hours but it is clean — for now.",
      "Aviation is your backup, not your primary. When FARP Whiskey goes down — and it will go down — you need ground routes that work.",
      "Push supply forward before you need it. Do not wait for a unit to call STONEWALL. By the time they call, it is already too late.",
    ]},
    { tab:'SERVICE SUPPORT', speakerId:'MAJ_CHEN', lines:[
      "Service support architecture: primary distribution hub is Depot Kaiserslautern. Forward depot at Bydgoszcz.",
      "Class V is routed exclusively through ASP Miesau. Any rerouting requires J4 coordination — do not bypass the ASP.",
      "Class VIII is critically low at FOB Iron. Twenty-two percent. Medical battalion is tracking but needs resupply within forty-eight hours.",
      "Equipment readiness at Aviation Brigade is sixty-eight percent. Class IX shortage. Parts are on order but ETA is uncertain.",
    ]},
    { tab:'COMMAND', speakerId:'LTG_HAYES', lines:[
      "Command and signal. You report directly to me. If a unit hits stonewall and you have not already called it, that is a leadership failure, not a logistics failure.",
      "I do not want to hear about problems after they become crises. I want to hear about them while there is still time to fix them.",
      "The enemy is not random. They are targeting your distribution network deliberately. They will get smarter the longer this runs.",
      "That is all. Questions? Good. Get to work.",
    ]},
  ],
}

// ── CAMPAIGN 2: BALTIC SHIELD ─────────────────────────────────────────────────
export const TEAM_BALTIC: BriefingTeam = {
  scenarioId:'CAMPAIGN_2', teamName:'NATO eFP BATTLEGROUP SUPPORT ELEMENT',
  location:'Riga, Latvia — NATO eFP HQ', briefingDate:'D-DAY+0',
  openingLine: "Gentlemen. The alliance is watching this theater. What we do here matters beyond this map.",
  characters:[
    { id:'BG_WALSH', name:'BG WALSH', rank:'Brigadier General', role:'NATO eFP Battlegroup Commander',
      personality:'Coalition mindset. Politically aware. Careful with language. Knows that every decision has alliance implications.',
      portraitStyle:'CDR', accentColor:'#00aaff',
      voice:{ rate:0.90, pitch:0.85, gender:'M' } },
    { id:'COL_ANDERS', name:'COL ANDERS', rank:'Colonel', role:'Latvian Armed Forces Liaison',
      personality:'Proud of his country. Direct. Has no patience for NATO bureaucracy slowing down the defense of his soil.',
      portraitStyle:'ALLIED', accentColor:'#ff8844',
      voice:{ rate:0.95, pitch:0.88, gender:'M' } },
    { id:'CW3_BANKS', name:'CW3 BANKS', rank:'Chief Warrant Officer 3', role:'Logistics Warrant Officer',
      personality:'Seen everything. Fixes problems quietly. Speaks only when he has something that matters.',
      portraitStyle:'WARRANT', accentColor:'#aaaaff',
      voice:{ rate:0.85, pitch:0.78, gender:'M' } },
  ],
  sections:[
    { tab:'SITUATION', speakerId:'BG_WALSH', lines:[
      "The Baltic situation has deteriorated faster than any model predicted. OPFOR is not posturing — they are fully committed.",
      "Our forward positioning was designed for deterrence. We are now fighting with a deterrence posture in a war posture situation. That gap is your problem to solve.",
      "Three NATO allies are depending on your distribution network. If you fail, the political consequences will outlast this campaign.",
    ]},
    { tab:'MISSION', speakerId:'COL_ANDERS', lines:[
      "Your mission is clear from where I stand. Keep our units fighting. Everything else is secondary.",
      "The roads in this country were not built for military logistics. Our bridges have weight limits. Our fuel points are civilian infrastructure.",
      "I have seen what happens when supply fails in this theater. My country's history is full of it. Do not let it happen again.",
    ]},
    { tab:'EXECUTION', speakerId:'CW3_BANKS', lines:[
      "Three things. First — Klaipeda port is your primary entry point but the road north is single lane. Traffic management is critical.",
      "Second — the air corridor through Palanga has a noise restriction that the civilian airport enforces. You will need coordination every time.",
      "Third — OPFOR has shown they will target logistics nodes. Riga depot got hit with indirect fire two days ago. Disperse your stocks.",
    ]},
    { tab:'SERVICE SUPPORT', speakerId:'BG_WALSH', lines:[
      "Service support is complicated by host nation considerations. Latvian and Lithuanian civilian infrastructure is part of our network — treat it accordingly.",
      "Fuel at Siauliai FARP is adequate for now. Class V is staged at Vilnius depot. Long route to forward units — expect two-day transit minimum.",
      "Medical is a coalition concern. Estonian medical battalion is attached. Their Class VIII integration with US systems is not seamless.",
    ]},
    { tab:'COMMAND', speakerId:'COL_ANDERS', lines:[
      "Command is multinational. That means every decision you make will be scrutinized by four different headquarters.",
      "I suggest you make decisions faster than the bureaucracy can catch up with you.",
      "My soldiers are fighting for their country. Make sure they have what they need to do it.",
    ]},
  ],
}

// ── CAMPAIGN 3: DESERT LINES — JORDAN/IRAQ ───────────────────────────────────
export const TEAM_DESERT: BriefingTeam = {
  scenarioId:'CAMPAIGN_3', teamName:'CENTCOM FORWARD LOGISTICS ELEMENT',
  location:'Muwaffaq Salti Air Base, Jordan', briefingDate:'D-DAY+0',
  openingLine: "Welcome to the sandbox. Hope you like dust. You are going to be eating a lot of it.",
  characters:[
    { id:'COL_PETERSEN', name:'COL PETERSEN', rank:'Colonel', role:'CENTCOM J4 Forward Element Commander',
      personality:'Desert veteran. Three CENTCOM rotations. Methodical. Expects problems and plans for them before they happen.',
      portraitStyle:'CDR', accentColor:'#ffcc00',
      voice:{ rate:0.87, pitch:0.80, gender:'M' } },
    { id:'SGM_RIVERS', name:'SGM RIVERS', rank:'Sergeant Major', role:'Senior Logistics NCO',
      personality:'Hard. Weathered. Has run logistics in this region since 2003. Allergic to optimism.',
      portraitStyle:'SGM', accentColor:'#ff8800',
      voice:{ rate:0.83, pitch:0.72, gender:'M' } },
    { id:'LT_COLE', name:'1LT COLE', rank:'First Lieutenant', role:'Distribution Platoon Leader',
      personality:'First real deployment. Eager. Asks good questions. Occasionally gets things right by accident.',
      portraitStyle:'S4', accentColor:'#88ffaa',
      voice:{ rate:1.10, pitch:1.05, gender:'F' } },
  ],
  sections:[
    { tab:'SITUATION', speakerId:'COL_PETERSEN', lines:[
      "OPFOR in this theater is not a conventional force. They are adaptive, decentralized, and they have been fighting in this terrain longer than we have been alive.",
      "The routes from Aqaba to Baghdad are the longest sustainment lines in any current theater. Distance is your enemy before the enemy is your enemy.",
      "The desert environment will degrade everything faster than your planning factors account for. Double your Class III estimates.",
    ]},
    { tab:'MISSION', speakerId:'SGM_RIVERS', lines:[
      "Mission. Keep the forward units alive long enough to matter. That is it.",
      "Rutbah is the forward edge. Getting anything to Rutbah is a four-day problem if the route is clean. If it is not clean — and it usually is not — it is a week.",
      "Class V to forward positions is your hardest problem. The enemy knows our supply schedule. Change it. Often.",
    ]},
    { tab:'EXECUTION', speakerId:'LT_COLE', lines:[
      "Sir, I have the route analysis. The southern corridor through Amman depot adds forty kilometers but avoids the three highest-threat segments.",
      "Air movement is available through Baghdad APOD but priority air is reserved for Class VIII and emergency Class V only.",
      "The FARP at Rutbah is positioned forward but it is exposed. Aviation confirmed they are comfortable with the risk but recommend we have a fallback plan.",
    ]},
    { tab:'SERVICE SUPPORT', speakerId:'COL_PETERSEN', lines:[
      "Class III. In the desert everything burns more fuel. Your planning factors are for temperate. Add thirty percent to every vehicle estimate.",
      "Water. Class I in this theater is primarily about water. Daily requirement is double temperate baseline. If a unit runs low on water, they stop functioning in eight hours, not forty-eight.",
      "Class IX. Sand destroys equipment. Expect double the normal parts demand. The depot at Amman is stocked but resupply from CONUS takes fourteen days.",
    ]},
    { tab:'COMMAND', speakerId:'SGM_RIVERS', lines:[
      "Command. Every convoy in this theater moves with communication to higher. No solo movement. No exceptions.",
      "You will lose vehicles. Plan for it. Have your recovery plan before you need it.",
      "The desert does not care about your timeline. Build margin into everything or the desert will take it from you.",
    ]},
  ],
}

// ── CAMPAIGN 4: SAND BRIDGE — UAE/KUWAIT ──────────────────────────────────────
export const TEAM_GULF: BriefingTeam = {
  scenarioId:'CAMPAIGN_4', teamName:'ARCENT FORWARD — COALITION LOGISTICS ELEMENT',
  location:'Camp Arifjan, Kuwait', briefingDate:'D-DAY+0',
  openingLine: "This is a coalition operation. Everything we do here is being watched by our partners. Professionalism at all times.",
  characters:[
    { id:'COL_MARTINEZ', name:'COL MARTINEZ', rank:'Colonel', role:'ARCENT G4, Coalition Logistics Coordinator',
      personality:'Diplomat. Knows that logistics is political in this theater. Builds relationships. Gets things done through people.',
      portraitStyle:'CDR', accentColor:'#ffaa44',
      voice:{ rate:0.92, pitch:0.88, gender:'F' } },
    { id:'LTC_AL_RASHID', name:'LTC AL-RASHID', rank:'Lieutenant Colonel', role:'Kuwait Army Liaison Officer',
      personality:'Formal. Proud. Excellent English. His country is the host — he wants that acknowledged.',
      portraitStyle:'ALLIED', accentColor:'#44ddff',
      voice:{ rate:0.88, pitch:0.82, gender:'M' } },
    { id:'CW4_NGUYEN', name:'CW4 NGUYEN', rank:'Chief Warrant Officer 4', role:'Aviation Logistics Officer',
      personality:'Technical. Precise. Cares about Class III and IX above everything. Aviation is his world.',
      portraitStyle:'WARRANT', accentColor:'#aaffdd',
      voice:{ rate:0.95, pitch:0.90, gender:'M' } },
  ],
  sections:[
    { tab:'SITUATION', speakerId:'COL_MARTINEZ', lines:[
      "The Gulf theater presents unique challenges. We are operating within sovereign territory of our host nation partners. Every logistics decision has a diplomatic dimension.",
      "Jebel Ali and Abu Dhabi ports are your primary entry points. The infrastructure is world-class. The politics are complex.",
      "OPFOR in this theater is not a peer competitor. But they are adaptive, well-funded, and they understand our logistics patterns.",
    ]},
    { tab:'MISSION', speakerId:'LTC_AL_RASHID', lines:[
      "Your mission is to sustain coalition forces operating from Kuwait northward. My country's infrastructure is part of your supply line.",
      "We expect that infrastructure to be respected. Damaged roads, contaminated fuel points — these create political problems that outlast the military problem.",
      "Sustain your forces. Protect our infrastructure. These are not competing requirements.",
    ]},
    { tab:'EXECUTION', speakerId:'CW4_NGUYEN', lines:[
      "Aviation in this theater runs on JP-8 almost exclusively. Ali Al Salem has good fuel capacity but the distribution to forward FARPs is the problem.",
      "Heat is your Class III enemy here. Fuel vaporization in summer temperatures reduces effective volume by up to eight percent.",
      "I recommend pre-positioning Class III at Camp Buehring before Day 5. If you wait until demand signals, you will be forty-eight hours behind.",
    ]},
    { tab:'SERVICE SUPPORT', speakerId:'COL_MARTINEZ', lines:[
      "Service support runs through the coalition framework. Coordination with host nation logistics elements is required for all movements through Kuwait territory.",
      "Class V is staged at Al Ahsa ASP. Long route to forward units but the road network is excellent.",
      "Medical. This theater has high heat casualty rates. Class VIII consumption will exceed your planning factors in summer operations. Monitor daily.",
    ]},
    { tab:'COMMAND', speakerId:'LTC_AL_RASHID', lines:[
      "Command in coalition operations requires patience. Decisions move slower when four nations must coordinate.",
      "I will tell you this directly — when decisions need to be made quickly, make them. Then inform the coalition.",
      "Our partnership depends on results. Deliver results and you will have our full support.",
    ]},
  ],
}

// ── CAMPAIGN 5: PACIFIC PUSH — KOREAN PENINSULA ──────────────────────────────
export const TEAM_KOREA: BriefingTeam = {
  scenarioId:'CAMPAIGN_5', teamName:'USFK / ROK COMBINED SUSTAINMENT ELEMENT',
  location:'Camp Humphreys, South Korea', briefingDate:'D-DAY+0',
  openingLine: "The peninsula is forty-eight hours from total war. This briefing assumes you understand the stakes.",
  characters:[
    { id:'MG_HARRIS', name:'MG HARRIS', rank:'Major General', role:'USFK G4',
      personality:'Serious. Technical. Studied this theater for twenty years. Speaks carefully because every word here carries weight.',
      portraitStyle:'CDR', accentColor:'#00ff88',
      voice:{ rate:0.85, pitch:0.80, gender:'M' } },
    { id:'BG_KIM', name:'BG KIM', rank:'Brigadier General', role:'ROK Army Deputy G4',
      personality:'Precise. Formal. Deeply knowledgeable about peninsula terrain. Quiet until he disagrees — then very direct.',
      portraitStyle:'ALLIED', accentColor:'#00ddff',
      voice:{ rate:0.90, pitch:0.88, gender:'M' } },
    { id:'CPT_PARK', name:'CPT PARK', rank:'Captain', role:'ROK-US Liaison Officer',
      personality:'Sharp. Bilingual. Navigates the alliance friction with skill. Gets things done that colonels cannot.',
      portraitStyle:'S4', accentColor:'#88ffcc',
      voice:{ rate:1.00, pitch:0.98, gender:'F' } },
  ],
  sections:[
    { tab:'SITUATION', speakerId:'MG_HARRIS', lines:[
      "The Korean peninsula is the most logistics-constrained major theater in any US war plan. Mountains, population density, and limited road networks constrain everything.",
      "OPFOR on this peninsula has invested decades in logistics interdiction planning. They know our routes. They know our timelines. They have rehearsed disrupting them.",
      "Busan and Incheon are your entry points. Both are at capacity. Throughput is the constraint — not the ports themselves.",
    ]},
    { tab:'MISSION', speakerId:'BG_KIM', lines:[
      "The mission is combined. ROK forces and US forces sustain from the same network. There is no separate system.",
      "Camp Humphreys is your primary hub. It was built for exactly this scenario. Use its capacity fully.",
      "The ROK logistics system is efficient and capable. Do not assume you need to build what is already here.",
    ]},
    { tab:'EXECUTION', speakerId:'CPT_PARK', lines:[
      "Execution challenge number one — Route 1 north of Humphreys goes through civilian population centers. Convoy timing must avoid peak traffic or you lose hours.",
      "Challenge two — the mountain passes north of the thirty-seventh parallel limit vehicle weight. Heavy equipment transporting Class V requires alternate routing.",
      "Challenge three — Camp Casey sits close to the DMZ. Resupply convoys are tactically visible to OPFOR. Every delivery is an intelligence event for them.",
    ]},
    { tab:'SERVICE SUPPORT', speakerId:'MG_HARRIS', lines:[
      "Camp Carroll depot is your Class IX anchor. ROK Army maintains the facility jointly. Stocks are deep but draw procedures require combined coordination.",
      "Class V. This is the constraint. The ammunition storage at Osan is protected but the route to forward units goes through three chokepoints.",
      "Class VIII. ROK medical system is fully integrated. Blood products are ROK-maintained. US Class VIII augments. No redundancy issues — this is a strength.",
    ]},
    { tab:'COMMAND', speakerId:'BG_KIM', lines:[
      "Command in this theater operates on the combined basis established by mutual defense treaty. Both flags have equal standing.",
      "Speed matters here more than any other theater. The peninsula compresses everything. Distance is short but time is shorter.",
      "If the logistics network fails, the peninsula falls in days — not weeks. That is not an estimate. That is history speaking.",
    ]},
  ],
}

// ── CAMPAIGN 6: ISLAND HOP — PACIFIC ─────────────────────────────────────────
export const TEAM_PACIFIC: BriefingTeam = {
  scenarioId:'CAMPAIGN_6', teamName:'INDOPACOM JOINT LOGISTICS OVER-THE-SHORE ELEMENT',
  location:'Andersen AFB, Guam', briefingDate:'D-DAY+0',
  openingLine: "Everything in this theater is about distance. Every decision you make, think about the ocean between you and your next supply.",
  characters:[
    { id:'RDML_FLETCHER', name:'RDML FLETCHER', rank:'Rear Admiral', role:'INDOPACOM J4 (Naval Component)',
      personality:'Naval officer in a joint role. Thinks in sea lanes. Impatient with land-centric thinking. Excellent at distance logistics.',
      portraitStyle:'CDR', accentColor:'#4488ff',
      voice:{ rate:0.88, pitch:0.82, gender:'M' } },
    { id:'COL_SANTOS', name:'COL SANTOS', rank:'Colonel', role:'Marine Logistics Group Commander',
      personality:'MAGTF thinker. Everything is self-sustaining to him. Does not believe in long supply lines. Will improvise.',
      portraitStyle:'CDR', accentColor:'#44ffaa',
      voice:{ rate:0.95, pitch:0.85, gender:'M' } },
    { id:'CW2_TAFAO', name:'CW2 TAFAO', rank:'Chief Warrant Officer 2', role:'Aviation Maintenance Technician',
      personality:'Pacific Islander. Quiet strength. Knows every island in the theater personally. Technical and exact.',
      portraitStyle:'WARRANT', accentColor:'#ffdd44',
      voice:{ rate:0.88, pitch:0.88, gender:'M' } },
  ],
  sections:[
    { tab:'SITUATION', speakerId:'RDML_FLETCHER', lines:[
      "The Pacific theater is defined by one number: distance. Guam to Palau is eight hundred miles. Guam to Chuuk is seven hundred. Everything floats or flies.",
      "There are no land routes in this theater. No MSRs. No ground convoys. Every Class III, every Class V, every Class VIII crosses water or airspace to reach your units.",
      "OPFOR in this theater controls the sea lanes in contested areas. Your logistics aircraft and ships are primary targets from the moment they depart Guam.",
    ]},
    { tab:'MISSION', speakerId:'COL_SANTOS', lines:[
      "The mission is island-by-island sustainment of forward positioned forces. Each island is its own sustainment problem.",
      "My approach — pre-position. Get supply to the islands before the fight starts. Once the fight starts, getting anything in is three times harder.",
      "Yap and Palau are the hardest. Longest route. Most exposed. If those islands are going to hold, they need to be stocked before Day 5.",
    ]},
    { tab:'EXECUTION', speakerId:'CW2_TAFAO', lines:[
      "I grew up near these waters. The weather patterns around Chuuk are unpredictable from October through March. Plan for a forty-eight-hour weather window as your planning factor.",
      "Andersen's runway can handle C-17s and C-5s. Apra Harbor can handle any ship in the fleet. The limitation is not the hub — it is the forward islands.",
      "Tinian has the best runway in the forward area. That is your FARP. Protect it.",
    ]},
    { tab:'SERVICE SUPPORT', speakerId:'RDML_FLETCHER', lines:[
      "Service support at sea is my domain. Two logistics ships are positioned east of Guam. They can pre-position forward on order.",
      "Class III is the theater constraint. JP-8 for aircraft, diesel for generators, and marine fuel for sea movement — three separate supply chains.",
      "Class IX at this distance is the risk no one talks about. A broken aircraft part in the Pacific can ground an asset for two weeks waiting on resupply. Stock deep.",
    ]},
    { tab:'COMMAND', speakerId:'COL_SANTOS', lines:[
      "Command in the Pacific is about communications. The distances degrade everything. When comms go down — and they will — your forward commanders need to know how to act without you.",
      "I run on mission command. My element will execute. But they need supply to execute. That is your job.",
      "The Pacific rewards preparation and punishes improvisation. Be ready before the day arrives.",
    ]},
  ],
}

// ── EXPORT MAP ────────────────────────────────────────────────────────────────
export const BRIEFING_TEAMS: Record<string, BriefingTeam> = {
  CAMPAIGN_1: TEAM_EUROPE,
  CAMPAIGN_2: TEAM_BALTIC,
  CAMPAIGN_3: TEAM_DESERT,
  CAMPAIGN_4: TEAM_GULF,
  CAMPAIGN_5: TEAM_KOREA,
  CAMPAIGN_6: TEAM_PACIFIC,
}

export function getBriefingTeam(scenarioId: string): BriefingTeam {
  return BRIEFING_TEAMS[scenarioId] ?? TEAM_EUROPE
}
