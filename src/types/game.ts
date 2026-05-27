// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type ClassOfSupply = 'CL_I' | 'CL_II' | 'CL_III' | 'CL_IV' | 'CL_V' | 'CL_VIII' | 'CL_IX';

export type UnitStatus = 'GREEN' | 'AMBER' | 'RED' | 'STONEWALL' | 'DARK';

export type NodeType = 'PORT' | 'AERIAL_PORT' | 'DEPOT' | 'ASP' | 'FOB' | 'AIRFIELD';

export type NodeStatus = 'ACTIVE' | 'DEGRADED' | 'INTERDICTED' | 'DESTROYED';

export type TurnPhase = 'INTELLIGENCE' | 'PLANNING' | 'EXECUTION';

export type ConvoyStatus = 'QUEUED' | 'EN_ROUTE' | 'DELIVERED' | 'INTERDICTED' | 'DELAYED';

export type DecisionOutcome = 'OPTIMAL' | 'ACCEPTABLE' | 'SUBOPTIMAL' | 'FAILURE';

export type RequestPriority = 'EMERGENCY' | 'PRIORITY' | 'ROUTINE';

export type WeatherCondition = 'CLEAR' | 'RAIN' | 'FOG' | 'STORM';

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── SUPPLY ───────────────────────────────────────────────────────────────────

export interface SupplyLevels {
  CL_I: number;    // Food/Water 0-100%
  CL_II: number;   // Clothing/Equipment
  CL_III: number;  // Fuel (POL)
  CL_IV: number;   // Construction
  CL_V: number;    // Ammunition
  CL_VIII: number; // Medical materiel
  CL_IX: number;   // Repair parts (Class IX)
}

export interface MaintenanceStatus {
  equipmentReadinessRate: number;  // 0-100% ERR
  vehiclesDeadlined: number;       // count
  pendingWorkOrders: number;
  repairPartsShortage: boolean;
}

export interface SupplyRequest {
  id: string;
  unitId: string;
  class: ClassOfSupply;
  priority: RequestPriority;
  amountRequested: number;
  deadline: number;           // Day number deadline
  submittedDay: number;
  status: 'PENDING' | 'ALLOCATED' | 'DENIED' | 'DELIVERED';
  requestCycleTime?: number;  // Hours from submission to delivery
}

// ─── UNITS ────────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  type: 'CORPS' | 'DIVISION' | 'BRIGADE' | 'AVIATION' | 'SUPPORT';
  nodeId: string;             // Current location node
  readiness: number;          // 0–100 percent
  status: UnitStatus;
  supplyLevels: SupplyLevels;
  dailyConsumption: SupplyLevels;
  maintenance: MaintenanceStatus;
  isManeuver: boolean;
  personnelStrength: number;  // 0-100% — soldiers available and combat effective
  stonewallStreak: number;    // consecutive days in STONEWALL
  isDark: boolean;            // unit offline — node goes dark on map
  history: ReadinessRecord[];
}

export interface ReadinessRecord {
  day: number;
  readiness: number;
  status: UnitStatus;
  cause?: string;
}

// ─── THEATER NODES ───────────────────────────────────────────────────────────

export interface TheaterNode {
  id: string;
  name: string;
  shortName: string;
  type: NodeType;
  status: NodeStatus;
  position: { x: number; y: number };   // SVG coordinates
  supplyLevels: SupplyLevels;
  maxCapacity: SupplyLevels;
  throughputPerDay: number;              // Convoys per day
  connectedNodes: string[];              // Node IDs this node connects to
  airCapable: boolean;
}

// ─── LOC (LINES OF COMMUNICATION) ────────────────────────────────────────────

export interface LOC {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  status: NodeStatus;
  threatLevel: ThreatLevel;
  travelTimeHours: number;
  type: 'GROUND' | 'AIR' | 'RAIL';
}

// ─── CONVOYS ─────────────────────────────────────────────────────────────────

export interface Convoy {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  locId: string;
  cargo: Partial<SupplyLevels>;
  status: ConvoyStatus;
  departedDay: number;
  eta: number;               // Day ETA
  requestIds: string[];      // Which requests this satisfies
}

// ─── DOCTRINE DECISIONS ──────────────────────────────────────────────────────

export interface DecisionChoice {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  doctrineBasis: string;     // ATP/ADP reference
  outcome: DecisionOutcome;
  effects: DecisionEffect[];
  doctrineNote: string;      // Explanation shown after choice
}

export interface DecisionEffect {
  type: 'READINESS' | 'SIGMA' | 'RCT' | 'STONEWALL' | 'SUPPLY' | 'MULTIPLIER';
  unitId?: string;
  classOfSupply?: ClassOfSupply;
  delta: number;             // Positive = improvement, negative = degradation
  description: string;
}

export interface DoctrineDecision {
  id: string;
  day: number;
  title: string;
  type: 'PUSH_PULL' | 'PRIORITY' | 'LOC' | 'AIR_GROUND' | 'TRIAGE' | 'ECONOMY_OF_FORCE' | 'PRE_POSITION';
  situation: string;         // SITACREP text
  question: string;          // Commander prompt
  choices: DecisionChoice[];
  optimalChoice: 'A' | 'B' | 'C' | 'D';
  forceMultiplierBonus: number;   // % bonus for optimal choice
  relatedUnits: string[];
  relatedNodes: string[];
}

// ─── CAMPAIGN ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  theater: string;
  description: string;
  durationDays: number;
  decisions: DoctrineDecision[];
  startingUnits: Unit[];
  startingNodes: TheaterNode[];
  startingLOCs: LOC[];
  startingSupply: SupplyLevels;
  victoryConditions: VictoryCondition[];
}

export interface VictoryCondition {
  id: string;
  description: string;
  type: 'MIN_READINESS' | 'MAX_STONEWALL_RATE' | 'MIN_SIGMA' | 'MAX_RCT';
  threshold: number;
  weight: number;            // Contribution to final score (0–1)
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────

export interface TheaterMetrics {
  avgReadiness: number;
  stonewallRate: number;
  avgRequestCycleTime: number;
  sigmaLevel: number;
  doctrineAccuracy: number;   // % of doctrine decisions answered optimally
  forceMultiplierTotal: number;
}

export interface GameState {
  // Campaign
  campaignId: string;
  campaignName: string;

  // Time
  currentDay: number;
  totalDays: number;
  currentPhase: TurnPhase;

  // Theater
  units: Record<string, Unit>;
  nodes: Record<string, TheaterNode>;
  locs: Record<string, LOC>;
  convoys: Convoy[];
  requestQueue: SupplyRequest[];

  // Decisions
  pendingDecision: DoctrineDecision | null;
  completedDecisions: Array<{
    decisionId: string;
    choiceId: string;
    outcome: DecisionOutcome;
    day: number;
  }>;

  // Metrics
  metrics: TheaterMetrics;
  metricsHistory: Array<{ day: number } & TheaterMetrics>;

  // Weather
  weather: WeatherCondition;

  // Flags
  isGameOver: boolean;
  isPaused: boolean;
  showAAR: boolean;
}

// ─── STORE ACTIONS ────────────────────────────────────────────────────────────

export interface GameActions {
  advanceTurn: () => void;
  resolveDecision: (decisionId: string, choiceId: string) => void;
  allocateSupply: (requestId: string, fromNodeId: string) => void;
  denyRequest: (requestId: string) => void;
  dispatchConvoy: (convoy: Omit<Convoy, 'id' | 'status' | 'departedDay'>) => void;
  selectNode: (nodeId: string | null) => void;
  selectUnit: (unitId: string | null) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: (campaignId: string) => void;
}

// ─── UI STATE ─────────────────────────────────────────────────────────────────

export interface UIState {
  selectedNodeId: string | null;
  selectedUnitId: string | null;
  activePanel: 'UNITS' | 'SUPPLY' | 'REQUESTS' | 'CONVOYS' | 'METRICS';
  showDecisionModal: boolean;
  showResultCard: boolean;
  lastDecisionResult: DecisionChoice | null;
  mapZoom: number;
  mapOffset: { x: number; y: number };
}
