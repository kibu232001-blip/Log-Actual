import { Unit } from '../types/game';

const maint = (err: number, dl: number, wo: number, short: boolean) =>
  ({ equipmentReadinessRate:err, vehiclesDeadlined:dl, pendingWorkOrders:wo, repairPartsShortage:short })

export const CAMPAIGN_1_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'III Corps', shortName:'III CORPS', type:'CORPS', nodeId:'FOB1',
    readiness:72, status:'AMBER', isManeuver:true,
    maintenance: maint(78, 6, 14, false),
    personnelStrength: 74, stonewallStreak: 0, isDark: false,
    supplyLevels:  { CL_I:62, CL_II:48, CL_III:41, CL_IV:58, CL_V:38, CL_VIII:55, CL_IX:44 },
    dailyConsumption:{ CL_I:4,  CL_II:1,  CL_III:8,  CL_IV:1,  CL_V:6,  CL_VIII:2.5, CL_IX:3  },
    history:[{day:1,readiness:72,status:'AMBER'}],
  },
  {
    id:'FOB1', name:'FOB Iron', shortName:'FOB IRON', type:'BRIGADE', nodeId:'FOB1',
    readiness:18, status:'RED', isManeuver:true,
    maintenance: maint(54, 12, 22, true),
    personnelStrength: 52, stonewallStreak: 0, isDark: false,
    supplyLevels:  { CL_I:38, CL_II:44, CL_III:14, CL_IV:41, CL_V:18, CL_VIII:22, CL_IX:12 },
    dailyConsumption:{ CL_I:3,  CL_II:1,  CL_III:6,  CL_IV:1,  CL_V:5,  CL_VIII:2.0, CL_IX:2  },
    history:[{day:1,readiness:18,status:'RED'}],
  },
  {
    id:'FOB2', name:'FOB Valor', shortName:'FOB VALOR', type:'BRIGADE', nodeId:'FOB2',
    readiness:65, status:'AMBER', isManeuver:true,
    maintenance: maint(82, 4, 8, false),
    personnelStrength: 81, stonewallStreak: 0, isDark: false,
    supplyLevels:  { CL_I:64, CL_II:54, CL_III:48, CL_IV:52, CL_V:41, CL_VIII:58, CL_IX:52 },
    dailyConsumption:{ CL_I:3,  CL_II:1,  CL_III:5,  CL_IV:1,  CL_V:4,  CL_VIII:1.8, CL_IX:2  },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
  {
    id:'4ID', name:'4th Infantry Division', shortName:'4ID', type:'DIVISION', nodeId:'FOB3',
    readiness:91, status:'GREEN', isManeuver:true,
    maintenance: maint(91, 2, 5, false),
    personnelStrength: 94, stonewallStreak: 0, isDark: false,
    supplyLevels:  { CL_I:75, CL_II:68, CL_III:71, CL_IV:62, CL_V:74, CL_VIII:70, CL_IX:65 },
    dailyConsumption:{ CL_I:5,  CL_II:2,  CL_III:9,  CL_IV:2,  CL_V:7,  CL_VIII:3.0, CL_IX:4  },
    history:[{day:1,readiness:91,status:'GREEN'}],
  },
  {
    id:'FOB3', name:'FOB Eagle', shortName:'FOB EAGLE', type:'BRIGADE', nodeId:'FOB3',
    readiness:88, status:'GREEN', isManeuver:true,
    maintenance: maint(86, 3, 7, false),
    personnelStrength: 88, stonewallStreak: 0, isDark: false,
    supplyLevels:  { CL_I:70, CL_II:58, CL_III:66, CL_IV:54, CL_V:63, CL_VIII:62, CL_IX:71 },
    dailyConsumption:{ CL_I:3,  CL_II:1,  CL_III:5,  CL_IV:1,  CL_V:4,  CL_VIII:1.5, CL_IX:2  },
    history:[{day:1,readiness:88,status:'GREEN'}],
  },
  {
    id:'AVN_BDE', name:'Aviation Brigade', shortName:'AVN BDE', type:'AVIATION', nodeId:'AIRFIELD',
    readiness:65, status:'AMBER', isManeuver:false,
    maintenance: maint(68, 8, 18, true),
    personnelStrength: 71, stonewallStreak: 0, isDark: false,
    supplyLevels:  { CL_I:58, CL_II:62, CL_III:31, CL_IV:44, CL_V:38, CL_VIII:48, CL_IX:24 },
    dailyConsumption:{ CL_I:3,  CL_II:1,  CL_III:10, CL_IV:1,  CL_V:3,  CL_VIII:1.5, CL_IX:6  },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
];
