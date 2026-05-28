/**
 * LOG ACTUAL — Scenario Node Networks
 * Each scenario has its own geographic node network and LOC structure
 * matching the actual theater of operations.
 */

export interface TheaterNode {
  id: string; name: string; short: string
  type: 'circle' | 'square' | 'diamond'
  nodeType: 'PORT' | 'AERIAL_PORT' | 'DEPOT' | 'ASP' | 'FOB' | 'AIRFIELD' | 'FARP' | 'SEAPORT'
  lat: number; lng: number
  unitId: string | null
  maritime?: boolean  // is a port that receives ships
}

export interface TheaterLOC {
  id: string; from: string; to: string
  type: 'GROUND' | 'AIR' | 'SEA' | 'RAIL'
  status: 'ACTIVE' | 'INTERDICTED'
  cargo: string
  threat: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface TheaterNetwork {
  scenarioId: string
  mapCenter: [number, number]
  mapZoom: number
  nodes: TheaterNode[]
  locs: TheaterLOC[]
  // Strategic sealift / airlift departure points
  strategicOrigin?: { lat: number; lng: number; name: string }
}

// ── CAMPAIGN 1: EUROPEAN THEATER (Belgium → Poland → Baltic) ──────────────────
const EUROPE: TheaterNetwork = {
  scenarioId: 'CAMPAIGN_1',
  mapCenter: [51.5, 13.0], mapZoom: 5,
  strategicOrigin: { lat: 36.8, lng: -76.3, name: 'Norfolk, VA' },
  nodes: [
    { id:'PORT_ANT', name:'Port of Antwerp',     short:'SPOD-ANT', type:'circle',  nodeType:'SEAPORT',     lat:51.2194, lng:4.4025,  unitId:null, maritime:true  },
    { id:'PORT_ROT', name:'Port of Rotterdam',   short:'SPOD-ROT', type:'circle',  nodeType:'SEAPORT',     lat:51.9244, lng:4.4777,  unitId:null, maritime:true  },
    { id:'PORT_BRE', name:'Bremerhaven SPOD',    short:'SPOD-BRE', type:'circle',  nodeType:'SEAPORT',     lat:53.5396, lng:8.5800,  unitId:null, maritime:true  },
    { id:'APS_RAM',  name:'Ramstein Air Base',   short:'APOD-RAM', type:'square',  nodeType:'AERIAL_PORT', lat:49.4369, lng:7.6003,  unitId:null                 },
    { id:'APS_WAR',  name:'Warsaw APOD',          short:'APOD-WAR', type:'square',  nodeType:'AERIAL_PORT', lat:52.1657, lng:20.9671, unitId:null                 },
    { id:'DEP_KTN',  name:'Depot Kaiserslautern', short:'DEP-KTN', type:'square',  nodeType:'DEPOT',       lat:49.4444, lng:7.7689,  unitId:null                 },
    { id:'DEP_GRA',  name:'Depot Grafenwoehr',    short:'DEP-GRA', type:'square',  nodeType:'DEPOT',       lat:49.7021, lng:11.9607, unitId:null                 },
    { id:'DEP_BYD',  name:'Depot Bydgoszcz',      short:'DEP-BYD', type:'square',  nodeType:'DEPOT',       lat:53.1235, lng:18.0084, unitId:null                 },
    { id:'ASP_MIE',  name:'ASP Miesau',            short:'ASP-MIE', type:'diamond', nodeType:'ASP',         lat:49.4700, lng:7.4800,  unitId:null                 },
    { id:'ASP_DRA',  name:'ASP Drawsko',           short:'ASP-DRA', type:'diamond', nodeType:'ASP',         lat:53.5300, lng:15.7900, unitId:null                 },
    { id:'FARP_A',   name:'FARP Alpha',            short:'FARP-A',  type:'square',  nodeType:'FARP',        lat:50.9800, lng:11.0300, unitId:null                 },
    { id:'FOB_WAR',  name:'FOB Iron (Warsaw)',     short:'FOB-I',   type:'circle',  nodeType:'FOB',         lat:52.2297, lng:21.0122, unitId:'FOB1'               },
    { id:'FOB_GDA',  name:'FOB Valor (Gdansk)',    short:'FOB-V',   type:'circle',  nodeType:'FOB',         lat:54.3520, lng:18.6466, unitId:'FOB2'               },
    { id:'FOB_KRA',  name:'FOB Eagle (Krakow)',    short:'FOB-E',   type:'circle',  nodeType:'FOB',         lat:50.0647, lng:19.9450, unitId:'FOB3'               },
    { id:'FOB_VIL',  name:'FOB Thunder (Vilnius)', short:'FOB-T',   type:'circle',  nodeType:'FOB',         lat:54.6872, lng:25.2797, unitId:'III_CORPS'          },
    { id:'AVN_MAL',  name:'Aviation BDE (Malbork)',short:'AVN',     type:'circle',  nodeType:'AIRFIELD',    lat:54.0326, lng:19.0283, unitId:'AVN_BDE'            },
  ],
  locs: [
    { id:'l01', from:'PORT_ANT', to:'DEP_KTN',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/III/IX', threat:'LOW'    },
    { id:'l02', from:'PORT_ROT', to:'DEP_KTN',  type:'GROUND', status:'ACTIVE',      cargo:'CL II/IV',    threat:'LOW'    },
    { id:'l03', from:'PORT_BRE', to:'DEP_GRA',  type:'GROUND', status:'ACTIVE',      cargo:'CL V/IX',     threat:'LOW'    },
    { id:'l04', from:'APS_RAM',  to:'DEP_KTN',  type:'AIR',    status:'ACTIVE',      cargo:'PRIORITY',    threat:'LOW'    },
    { id:'l05', from:'DEP_KTN',  to:'ASP_MIE',  type:'GROUND', status:'ACTIVE',      cargo:'CL V',        threat:'LOW'    },
    { id:'l06', from:'DEP_KTN',  to:'DEP_GRA',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/III',    threat:'LOW'    },
    { id:'l07', from:'DEP_KTN',  to:'FARP_A',   type:'GROUND', status:'ACTIVE',      cargo:'CL III',      threat:'LOW'    },
    { id:'l08', from:'DEP_GRA',  to:'DEP_BYD',  type:'GROUND', status:'ACTIVE',      cargo:'CL I-IX',     threat:'MEDIUM' },
    { id:'l09', from:'ASP_MIE',  to:'DEP_GRA',  type:'GROUND', status:'ACTIVE',      cargo:'CL V/VIII',   threat:'LOW'    },
    { id:'l10', from:'DEP_BYD',  to:'ASP_DRA',  type:'GROUND', status:'ACTIVE',      cargo:'CL V',        threat:'MEDIUM' },
    { id:'l11', from:'DEP_BYD',  to:'FOB_WAR',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/III',    threat:'HIGH'   },
    { id:'l12', from:'DEP_BYD',  to:'FOB_GDA',  type:'GROUND', status:'ACTIVE',      cargo:'CL III/IX',   threat:'MEDIUM' },
    { id:'l13', from:'DEP_BYD',  to:'FOB_KRA',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/V',      threat:'LOW'    },
    { id:'l14', from:'ASP_DRA',  to:'AVN_MAL',  type:'GROUND', status:'ACTIVE',      cargo:'CL III/V',    threat:'MEDIUM' },
    { id:'l15', from:'ASP_DRA',  to:'FOB_GDA',  type:'GROUND', status:'ACTIVE',      cargo:'CL V',        threat:'MEDIUM' },
    { id:'l16', from:'FOB_WAR',  to:'FOB_VIL',  type:'GROUND', status:'INTERDICTED', cargo:'CL I/III/V',  threat:'HIGH'   },
    { id:'l17', from:'APS_RAM',  to:'APS_WAR',  type:'AIR',    status:'ACTIVE',      cargo:'STRATEGIC',   threat:'LOW'    },
    { id:'l18', from:'APS_WAR',  to:'FOB_WAR',  type:'AIR',    status:'ACTIVE',      cargo:'PRIORITY',    threat:'LOW'    },
    { id:'l19', from:'APS_WAR',  to:'FOB_VIL',  type:'AIR',    status:'ACTIVE',      cargo:'EMERGENCY',   threat:'MEDIUM' },
    { id:'l20', from:'FARP_A',   to:'FOB_WAR',  type:'AIR',    status:'ACTIVE',      cargo:'CL III/V',    threat:'LOW'    },
    { id:'l21', from:'AVN_MAL',  to:'FOB_GDA',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',     threat:'LOW'    },
    { id:'l22', from:'AVN_MAL',  to:'FOB_VIL',  type:'AIR',    status:'ACTIVE',      cargo:'AASLT',       threat:'MEDIUM' },
    { id:'l23', from:'AVN_MAL',  to:'FOB_KRA',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',     threat:'LOW'    },
    { id:'l24', from:'AVN_MAL',  to:'FOB_WAR',  type:'AIR',    status:'ACTIVE',      cargo:'LIFT',        threat:'LOW'    },
  ],
}

// ── CAMPAIGN 2: BALTIC SHIELD (Riga → Tallinn defense corridor) ───────────────
const BALTIC: TheaterNetwork = {
  scenarioId: 'CAMPAIGN_2',
  mapCenter: [57.5, 24.5], mapZoom: 6,
  strategicOrigin: { lat: 54.0, lng: 10.5, name: 'Kiel, Germany' },
  nodes: [
    { id:'PORT_RIG', name:'Port of Riga',         short:'SPOD-RIG', type:'circle',  nodeType:'SEAPORT',     lat:56.9496, lng:24.1052, unitId:null, maritime:true },
    { id:'PORT_TAL', name:'Port of Tallinn',       short:'SPOD-TAL', type:'circle',  nodeType:'SEAPORT',     lat:59.4370, lng:24.7536, unitId:null, maritime:true },
    { id:'PORT_KLA', name:'Port of Klaipeda',      short:'SPOD-KLA', type:'circle',  nodeType:'SEAPORT',     lat:55.7033, lng:21.1443, unitId:null, maritime:true },
    { id:'APS_RIG',  name:'Riga International',    short:'APOD-RIG', type:'square',  nodeType:'AERIAL_PORT', lat:56.9236, lng:23.9711, unitId:null               },
    { id:'APS_PAL',  name:'Palanga Air Base',       short:'APOD-PAL', type:'square',  nodeType:'AERIAL_PORT', lat:55.9733, lng:21.0939, unitId:null               },
    { id:'DEP_VIL',  name:'Depot Vilnius',          short:'DEP-VIL', type:'square',  nodeType:'DEPOT',       lat:54.6872, lng:25.2797, unitId:null               },
    { id:'DEP_RIG',  name:'Depot Riga',             short:'DEP-RIG', type:'square',  nodeType:'DEPOT',       lat:56.8500, lng:24.0000, unitId:null               },
    { id:'ASP_TAR',  name:'ASP Tartu',              short:'ASP-TAR', type:'diamond', nodeType:'ASP',         lat:58.3776, lng:26.7290, unitId:null               },
    { id:'FARP_SIA', name:'FARP Siauliai',          short:'FARP-SIA',type:'square',  nodeType:'FARP',        lat:55.9349, lng:23.3137, unitId:null               },
    { id:'FOB_TAL',  name:'FOB Iron (Tallinn)',     short:'FOB-I',   type:'circle',  nodeType:'FOB',         lat:59.4370, lng:24.7536, unitId:'FOB1'             },
    { id:'FOB_TAR',  name:'FOB Valor (Tartu)',      short:'FOB-V',   type:'circle',  nodeType:'FOB',         lat:58.3776, lng:26.7290, unitId:'FOB2'             },
    { id:'FOB_KUN',  name:'FOB Eagle (Kaunas)',     short:'FOB-E',   type:'circle',  nodeType:'FOB',         lat:54.8985, lng:23.9036, unitId:'FOB3'             },
    { id:'FOB_SIA',  name:'FOB Thunder (Siauliai)', short:'FOB-T',   type:'circle',  nodeType:'FOB',         lat:55.9349, lng:23.3137, unitId:'III_CORPS'        },
    { id:'AVN_TAL',  name:'Aviation BDE (Amari)',   short:'AVN',     type:'circle',  nodeType:'AIRFIELD',    lat:59.2603, lng:24.2083, unitId:'AVN_BDE'          },
  ],
  locs: [
    { id:'l01', from:'PORT_KLA', to:'DEP_VIL',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/III',  threat:'LOW'    },
    { id:'l02', from:'PORT_RIG', to:'DEP_RIG',  type:'GROUND', status:'ACTIVE',      cargo:'CL V/IX',   threat:'MEDIUM' },
    { id:'l03', from:'DEP_VIL',  to:'FOB_KUN',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/V',    threat:'MEDIUM' },
    { id:'l04', from:'DEP_VIL',  to:'FOB_SIA',  type:'GROUND', status:'INTERDICTED', cargo:'CL III',    threat:'HIGH'   },
    { id:'l05', from:'DEP_RIG',  to:'FOB_TAL',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/III',  threat:'MEDIUM' },
    { id:'l06', from:'DEP_RIG',  to:'FARP_SIA', type:'GROUND', status:'ACTIVE',      cargo:'CL III',    threat:'MEDIUM' },
    { id:'l07', from:'ASP_TAR',  to:'FOB_TAR',  type:'GROUND', status:'ACTIVE',      cargo:'CL V',      threat:'LOW'    },
    { id:'l08', from:'APS_RIG',  to:'FOB_TAL',  type:'AIR',    status:'ACTIVE',      cargo:'PRIORITY',  threat:'LOW'    },
    { id:'l09', from:'APS_PAL',  to:'FOB_KUN',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',   threat:'LOW'    },
    { id:'l10', from:'AVN_TAL',  to:'FOB_TAL',  type:'AIR',    status:'ACTIVE',      cargo:'LIFT',      threat:'LOW'    },
    { id:'l11', from:'AVN_TAL',  to:'FOB_TAR',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',   threat:'MEDIUM' },
    { id:'l12', from:'AVN_TAL',  to:'FOB_SIA',  type:'AIR',    status:'ACTIVE',      cargo:'AASLT',     threat:'HIGH'   },
    { id:'l13', from:'PORT_TAL', to:'DEP_RIG',  type:'SEA',    status:'ACTIVE',      cargo:'STRATEGIC', threat:'LOW'    },
  ],
}

// ── CAMPAIGN 3: DESERT LINES (Jordan → Iraq/Syria border) ─────────────────────
const DESERT: TheaterNetwork = {
  scenarioId: 'CAMPAIGN_3',
  mapCenter: [33.0, 40.0], mapZoom: 6,
  strategicOrigin: { lat: 12.0, lng: 43.5, name: 'Djibouti, Horn of Africa' },
  nodes: [
    { id:'PORT_AQJ', name:'Port of Aqaba',          short:'SPOD-AQJ', type:'circle',  nodeType:'SEAPORT',     lat:29.5321, lng:34.9996, unitId:null, maritime:true },
    { id:'APS_AMM',  name:'Queen Alia Intl (Amman)',short:'APOD-AMM', type:'square',  nodeType:'AERIAL_PORT', lat:31.7226, lng:35.9935, unitId:null               },
    { id:'APS_BGW',  name:'Baghdad Intl Airport',   short:'APOD-BGW', type:'square',  nodeType:'AERIAL_PORT', lat:33.2625, lng:44.2346, unitId:null               },
    { id:'DEP_AMM',  name:'Depot Amman',             short:'DEP-AMM', type:'square',  nodeType:'DEPOT',       lat:31.9566, lng:35.9457, unitId:null               },
    { id:'DEP_BGW',  name:'Depot Baghdad',           short:'DEP-BGW', type:'square',  nodeType:'DEPOT',       lat:33.3152, lng:44.3661, unitId:null               },
    { id:'ASP_AZR',  name:'ASP Az Zarqa',            short:'ASP-AZR', type:'diamond', nodeType:'ASP',         lat:32.0726, lng:36.0855, unitId:null               },
    { id:'FARP_RTB', name:'FARP Rutbah',             short:'FARP-RTB',type:'square',  nodeType:'FARP',        lat:33.0444, lng:40.2833, unitId:null               },
    { id:'FOB_RTB',  name:'FOB Iron (Rutbah)',       short:'FOB-I',   type:'circle',  nodeType:'FOB',         lat:33.0444, lng:40.2833, unitId:'FOB1'             },
    { id:'FOB_RMD',  name:'FOB Valor (Ramadi)',      short:'FOB-V',   type:'circle',  nodeType:'FOB',         lat:33.4258, lng:43.2999, unitId:'FOB2'             },
    { id:'FOB_MSL',  name:'FOB Eagle (Mosul area)',  short:'FOB-E',   type:'circle',  nodeType:'FOB',         lat:36.3400, lng:43.1300, unitId:'FOB3'             },
    { id:'FOB_TKR',  name:'FOB Thunder (Tikrit)',    short:'FOB-T',   type:'circle',  nodeType:'FOB',         lat:34.5974, lng:43.6939, unitId:'III_CORPS'        },
    { id:'AVN_BGW',  name:'Aviation BDE (Baghdad)',  short:'AVN',     type:'circle',  nodeType:'AIRFIELD',    lat:33.3000, lng:44.4000, unitId:'AVN_BDE'          },
  ],
  locs: [
    { id:'l01', from:'PORT_AQJ', to:'DEP_AMM',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/III',  threat:'LOW'    },
    { id:'l02', from:'DEP_AMM',  to:'ASP_AZR',  type:'GROUND', status:'ACTIVE',      cargo:'CL V',      threat:'LOW'    },
    { id:'l03', from:'DEP_AMM',  to:'FARP_RTB', type:'GROUND', status:'ACTIVE',      cargo:'CL III',    threat:'HIGH'   },
    { id:'l04', from:'DEP_AMM',  to:'DEP_BGW',  type:'GROUND', status:'ACTIVE',      cargo:'CL I-IX',   threat:'HIGH'   },
    { id:'l05', from:'DEP_BGW',  to:'FOB_RMD',  type:'GROUND', status:'ACTIVE',      cargo:'CL III/V',  threat:'HIGH'   },
    { id:'l06', from:'DEP_BGW',  to:'FOB_TKR',  type:'GROUND', status:'ACTIVE',      cargo:'CL I/V',    threat:'MEDIUM' },
    { id:'l07', from:'FARP_RTB', to:'FOB_RTB',  type:'GROUND', status:'INTERDICTED', cargo:'CL III',    threat:'HIGH'   },
    { id:'l08', from:'APS_AMM',  to:'DEP_BGW',  type:'AIR',    status:'ACTIVE',      cargo:'PRIORITY',  threat:'LOW'    },
    { id:'l09', from:'APS_BGW',  to:'FOB_RTB',  type:'AIR',    status:'ACTIVE',      cargo:'EMERGENCY', threat:'LOW'    },
    { id:'l10', from:'APS_BGW',  to:'FOB_MSL',  type:'AIR',    status:'ACTIVE',      cargo:'CL V/VIII', threat:'MEDIUM' },
    { id:'l11', from:'AVN_BGW',  to:'FOB_RTB',  type:'AIR',    status:'ACTIVE',      cargo:'LIFT',      threat:'MEDIUM' },
    { id:'l12', from:'AVN_BGW',  to:'FOB_RMD',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',   threat:'LOW'    },
    { id:'l13', from:'AVN_BGW',  to:'FOB_TKR',  type:'AIR',    status:'ACTIVE',      cargo:'AASLT',     threat:'MEDIUM' },
    { id:'l14', from:'AVN_BGW',  to:'FOB_MSL',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',   threat:'HIGH'   },
  ],
}

// ── CAMPAIGN 4: SAND BRIDGE (UAE → Kuwait) ────────────────────────────────────
const SAND_BRIDGE: TheaterNetwork = {
  scenarioId: 'CAMPAIGN_4',
  mapCenter: [26.0, 51.0], mapZoom: 7,
  strategicOrigin: { lat: 12.5, lng: 53.5, name: 'Djibouti / Horn of Africa' },
  nodes: [
    { id:'PORT_JBL', name:'Jebel Ali Port (Dubai)', short:'SPOD-JBL', type:'circle',  nodeType:'SEAPORT',     lat:25.0028, lng:55.0693, unitId:null, maritime:true },
    { id:'PORT_AUH', name:'Port of Abu Dhabi',       short:'SPOD-AUH', type:'circle',  nodeType:'SEAPORT',     lat:24.4675, lng:54.3667, unitId:null, maritime:true },
    { id:'APS_DXB',  name:'Dubai Intl Airport',      short:'APOD-DXB', type:'square',  nodeType:'AERIAL_PORT', lat:25.2532, lng:55.3657, unitId:null               },
    { id:'APS_KWI',  name:'Kuwait Intl Airport',     short:'APOD-KWI', type:'square',  nodeType:'AERIAL_PORT', lat:29.2267, lng:47.9689, unitId:null               },
    { id:'DEP_AUH',  name:'Depot Abu Dhabi',         short:'DEP-AUH', type:'square',  nodeType:'DEPOT',       lat:24.4675, lng:54.3667, unitId:null               },
    { id:'DEP_KWT',  name:'Depot Kuwait City',       short:'DEP-KWT', type:'square',  nodeType:'DEPOT',       lat:29.3759, lng:47.9774, unitId:null               },
    { id:'ASP_RYD',  name:'ASP Al Ahsa',             short:'ASP-AHS', type:'diamond', nodeType:'ASP',         lat:25.3800, lng:49.6000, unitId:null               },
    { id:'FARP_MIS', name:'FARP Mişraq',             short:'FARP-MIS',type:'square',  nodeType:'FARP',        lat:28.0000, lng:47.5000, unitId:null               },
    { id:'FOB_BUE',  name:'FOB Iron (Camp Buehring)',short:'FOB-I',   type:'circle',  nodeType:'FOB',         lat:29.5000, lng:47.5000, unitId:'FOB1'             },
    { id:'FOB_ARF',  name:'FOB Valor (Camp Arifjan)',short:'FOB-V',   type:'circle',  nodeType:'FOB',         lat:29.0667, lng:48.1167, unitId:'FOB2'             },
    { id:'FOB_ARZ',  name:'FOB Eagle (Camp Ariz)',   short:'FOB-E',   type:'circle',  nodeType:'FOB',         lat:28.5000, lng:47.8000, unitId:'FOB3'             },
    { id:'FOB_NAS',  name:'FOB Thunder (Nasiriyah)', short:'FOB-T',   type:'circle',  nodeType:'FOB',         lat:31.0500, lng:46.2500, unitId:'III_CORPS'        },
    { id:'AVN_ARF',  name:'Aviation BDE (Ali Al Salem)',short:'AVN',  type:'circle',  nodeType:'AIRFIELD',    lat:29.3467, lng:47.5167, unitId:'AVN_BDE'          },
  ],
  locs: [
    { id:'l01', from:'PORT_JBL', to:'DEP_AUH',  type:'GROUND', status:'ACTIVE', cargo:'CL I/III',  threat:'LOW' },
    { id:'l02', from:'PORT_AUH', to:'DEP_AUH',  type:'GROUND', status:'ACTIVE', cargo:'CL V/IX',   threat:'LOW' },
    { id:'l03', from:'DEP_AUH',  to:'ASP_RYD',  type:'GROUND', status:'ACTIVE', cargo:'CL V',      threat:'LOW' },
    { id:'l04', from:'DEP_AUH',  to:'DEP_KWT',  type:'GROUND', status:'ACTIVE', cargo:'CL I-IX',   threat:'LOW' },
    { id:'l05', from:'DEP_KWT',  to:'FOB_BUE',  type:'GROUND', status:'ACTIVE', cargo:'CL I/III',  threat:'LOW' },
    { id:'l06', from:'DEP_KWT',  to:'FOB_ARF',  type:'GROUND', status:'ACTIVE', cargo:'CL III/V',  threat:'LOW' },
    { id:'l07', from:'ASP_RYD',  to:'FOB_ARZ',  type:'GROUND', status:'ACTIVE', cargo:'CL V',      threat:'LOW' },
    { id:'l08', from:'FARP_MIS', to:'FOB_NAS',  type:'GROUND', status:'ACTIVE', cargo:'CL III',    threat:'MEDIUM' },
    { id:'l09', from:'APS_DXB',  to:'APS_KWI',  type:'AIR',    status:'ACTIVE', cargo:'STRATEGIC', threat:'LOW' },
    { id:'l10', from:'APS_KWI',  to:'FOB_BUE',  type:'AIR',    status:'ACTIVE', cargo:'PRIORITY',  threat:'LOW' },
    { id:'l11', from:'APS_KWI',  to:'FOB_NAS',  type:'AIR',    status:'ACTIVE', cargo:'EMERGENCY', threat:'LOW' },
    { id:'l12', from:'AVN_ARF',  to:'FOB_BUE',  type:'AIR',    status:'ACTIVE', cargo:'LIFT',      threat:'LOW' },
    { id:'l13', from:'AVN_ARF',  to:'FOB_ARF',  type:'AIR',    status:'ACTIVE', cargo:'MEDEVAC',   threat:'LOW' },
    { id:'l14', from:'AVN_ARF',  to:'FOB_NAS',  type:'AIR',    status:'ACTIVE', cargo:'AASLT',     threat:'MEDIUM' },
    { id:'l15', from:'PORT_JBL', to:'PORT_AUH', type:'SEA',    status:'ACTIVE', cargo:'STRATEGIC', threat:'LOW' },
  ],
}

// ── CAMPAIGN 5: PACIFIC PUSH (Japan → Korean Peninsula) ──────────────────────
const PACIFIC_PUSH: TheaterNetwork = {
  scenarioId: 'CAMPAIGN_5',
  mapCenter: [36.5, 128.5], mapZoom: 6,
  strategicOrigin: { lat: 21.3, lng: -157.8, name: 'Pearl Harbor, Hawaii' },
  nodes: [
    { id:'PORT_PUS', name:'Port of Busan',           short:'SPOD-PUS', type:'circle',  nodeType:'SEAPORT',     lat:35.1028, lng:129.0403, unitId:null, maritime:true },
    { id:'PORT_ICN', name:'Port of Incheon',          short:'SPOD-ICN', type:'circle',  nodeType:'SEAPORT',     lat:37.4563, lng:126.7052, unitId:null, maritime:true },
    { id:'APS_YOK',  name:'Yokota Air Base (Japan)',  short:'APOD-YOK', type:'square',  nodeType:'AERIAL_PORT', lat:35.7485, lng:139.3483, unitId:null               },
    { id:'APS_OSN',  name:'Osan Air Base (Korea)',    short:'APOD-OSN', type:'square',  nodeType:'AERIAL_PORT', lat:37.0903, lng:127.0297, unitId:null               },
    { id:'DEP_CRL',  name:'Camp Carroll',             short:'DEP-CRL', type:'square',  nodeType:'DEPOT',       lat:35.9900, lng:128.4200, unitId:null               },
    { id:'DEP_DAG',  name:'Camp Henry (Daegu)',       short:'DEP-DAG', type:'square',  nodeType:'DEPOT',       lat:35.8561, lng:128.6060, unitId:null               },
    { id:'ASP_CCA',  name:'ASP Camp Casey Area',      short:'ASP-CCA', type:'diamond', nodeType:'ASP',         lat:37.9000, lng:127.0600, unitId:null               },
    { id:'FARP_HUM', name:'FARP Humphreys',           short:'FARP-HUM',type:'square',  nodeType:'FARP',        lat:37.0100, lng:127.0700, unitId:null               },
    { id:'FOB_HUM',  name:'FOB Iron (Camp Humphreys)',short:'FOB-I',   type:'circle',  nodeType:'FOB',         lat:36.9746, lng:127.0289, unitId:'FOB1'             },
    { id:'FOB_CSY',  name:'FOB Valor (Camp Casey)',   short:'FOB-V',   type:'circle',  nodeType:'FOB',         lat:37.9011, lng:127.0594, unitId:'FOB2'             },
    { id:'FOB_DAG',  name:'FOB Eagle (Camp Walker)',  short:'FOB-E',   type:'circle',  nodeType:'FOB',         lat:35.8561, lng:128.5000, unitId:'FOB3'             },
    { id:'FOB_RED',  name:'FOB Thunder (Red Cloud)',  short:'FOB-T',   type:'circle',  nodeType:'FOB',         lat:37.9500, lng:127.0800, unitId:'III_CORPS'        },
    { id:'AVN_OSN',  name:'Aviation BDE (Osan)',      short:'AVN',     type:'circle',  nodeType:'AIRFIELD',    lat:37.0903, lng:127.0500, unitId:'AVN_BDE'          },
  ],
  locs: [
    { id:'l01', from:'PORT_PUS', to:'DEP_CRL',  type:'GROUND', status:'ACTIVE', cargo:'CL I/III',  threat:'LOW'    },
    { id:'l02', from:'PORT_ICN', to:'FOB_CSY',  type:'GROUND', status:'ACTIVE', cargo:'CL V/IX',   threat:'MEDIUM' },
    { id:'l03', from:'DEP_CRL',  to:'FARP_HUM', type:'GROUND', status:'ACTIVE', cargo:'CL III',    threat:'LOW'    },
    { id:'l04', from:'DEP_CRL',  to:'FOB_HUM',  type:'GROUND', status:'ACTIVE', cargo:'CL I/V',    threat:'MEDIUM' },
    { id:'l05', from:'DEP_CRL',  to:'DEP_DAG',  type:'GROUND', status:'ACTIVE', cargo:'CL IX',     threat:'LOW'    },
    { id:'l06', from:'DEP_DAG',  to:'FOB_DAG',  type:'GROUND', status:'ACTIVE', cargo:'CL I/III',  threat:'LOW'    },
    { id:'l07', from:'ASP_CCA',  to:'FOB_CSY',  type:'GROUND', status:'ACTIVE', cargo:'CL V',      threat:'HIGH'   },
    { id:'l08', from:'ASP_CCA',  to:'FOB_RED',  type:'GROUND', status:'INTERDICTED', cargo:'CL V', threat:'HIGH'   },
    { id:'l09', from:'APS_YOK',  to:'APS_OSN',  type:'AIR',    status:'ACTIVE', cargo:'STRATEGIC', threat:'LOW'    },
    { id:'l10', from:'APS_OSN',  to:'FOB_HUM',  type:'AIR',    status:'ACTIVE', cargo:'PRIORITY',  threat:'LOW'    },
    { id:'l11', from:'APS_OSN',  to:'FOB_CSY',  type:'AIR',    status:'ACTIVE', cargo:'EMERGENCY', threat:'LOW'    },
    { id:'l12', from:'AVN_OSN',  to:'FOB_HUM',  type:'AIR',    status:'ACTIVE', cargo:'LIFT',      threat:'LOW'    },
    { id:'l13', from:'AVN_OSN',  to:'FOB_CSY',  type:'AIR',    status:'ACTIVE', cargo:'MEDEVAC',   threat:'MEDIUM' },
    { id:'l14', from:'AVN_OSN',  to:'FOB_RED',  type:'AIR',    status:'ACTIVE', cargo:'AASLT',     threat:'HIGH'   },
    { id:'l15', from:'AVN_OSN',  to:'FOB_DAG',  type:'AIR',    status:'ACTIVE', cargo:'MEDEVAC',   threat:'LOW'    },
    { id:'l16', from:'PORT_PUS', to:'PORT_ICN', type:'SEA',    status:'ACTIVE', cargo:'COASTAL',   threat:'MEDIUM' },
  ],
}

// ── CAMPAIGN 6: ISLAND HOP (Pacific island chain) ─────────────────────────────
const ISLAND_HOP: TheaterNetwork = {
  scenarioId: 'CAMPAIGN_6',
  mapCenter: [12.0, 145.0], mapZoom: 5,
  strategicOrigin: { lat: 21.3, lng: -157.8, name: 'Pearl Harbor, Hawaii' },
  nodes: [
    { id:'PORT_GUM', name:'Apra Harbor (Guam)',       short:'SPOD-GUM', type:'circle',  nodeType:'SEAPORT',     lat:13.4443, lng:144.6553, unitId:null, maritime:true },
    { id:'APS_UAM',  name:'Andersen AFB (Guam)',      short:'APOD-UAM', type:'square',  nodeType:'AERIAL_PORT', lat:13.5840, lng:144.9299, unitId:null               },
    { id:'DEP_GUM',  name:'Depot Guam',               short:'DEP-GUM', type:'square',  nodeType:'DEPOT',       lat:13.4800, lng:144.7500, unitId:null               },
    { id:'DEP_SPN',  name:'Saipan Depot',             short:'DEP-SPN', type:'square',  nodeType:'DEPOT',       lat:15.1772, lng:145.7232, unitId:null               },
    { id:'FARP_TIN', name:'FARP Tinian',              short:'FARP-TIN',type:'square',  nodeType:'FARP',        lat:15.0000, lng:145.6167, unitId:null               },
    { id:'FOB_TIN',  name:'FOB Iron (Tinian)',        short:'FOB-I',   type:'circle',  nodeType:'FOB',         lat:15.0000, lng:145.6167, unitId:'FOB1'             },
    { id:'FOB_PLU',  name:'FOB Valor (Palau)',        short:'FOB-V',   type:'circle',  nodeType:'FOB',         lat:7.5149,  lng:134.5825, unitId:'FOB2'             },
    { id:'FOB_YAP',  name:'FOB Eagle (Yap)',          short:'FOB-E',   type:'circle',  nodeType:'FOB',         lat:9.5167,  lng:138.1333, unitId:'FOB3'             },
    { id:'FOB_CHK',  name:'FOB Thunder (Chuuk)',      short:'FOB-T',   type:'circle',  nodeType:'FOB',         lat:7.4167,  lng:151.7833, unitId:'III_CORPS'        },
    { id:'AVN_GUM',  name:'Aviation BDE (Guam)',      short:'AVN',     type:'circle',  nodeType:'AIRFIELD',    lat:13.5000, lng:144.8000, unitId:'AVN_BDE'          },
  ],
  locs: [
    { id:'l01', from:'PORT_GUM', to:'DEP_GUM',  type:'GROUND', status:'ACTIVE',      cargo:'CL I-IX',   threat:'LOW'    },
    { id:'l02', from:'DEP_GUM',  to:'DEP_SPN',  type:'SEA',    status:'ACTIVE',      cargo:'STRATEGIC', threat:'LOW'    },
    { id:'l03', from:'DEP_SPN',  to:'FOB_TIN',  type:'SEA',    status:'ACTIVE',      cargo:'CL I/V',    threat:'LOW'    },
    { id:'l04', from:'APS_UAM',  to:'FOB_TIN',  type:'AIR',    status:'ACTIVE',      cargo:'PRIORITY',  threat:'LOW'    },
    { id:'l05', from:'APS_UAM',  to:'FOB_PLU',  type:'AIR',    status:'ACTIVE',      cargo:'CL I/III',  threat:'MEDIUM' },
    { id:'l06', from:'APS_UAM',  to:'FOB_YAP',  type:'AIR',    status:'ACTIVE',      cargo:'EMERGENCY', threat:'HIGH'   },
    { id:'l07', from:'APS_UAM',  to:'FOB_CHK',  type:'AIR',    status:'ACTIVE',      cargo:'CL V',      threat:'MEDIUM' },
    { id:'l08', from:'DEP_GUM',  to:'FOB_PLU',  type:'SEA',    status:'ACTIVE',      cargo:'CL I/IX',   threat:'MEDIUM' },
    { id:'l09', from:'DEP_SPN',  to:'FOB_CHK',  type:'SEA',    status:'ACTIVE',      cargo:'CL III/V',  threat:'HIGH'   },
    { id:'l10', from:'AVN_GUM',  to:'FOB_TIN',  type:'AIR',    status:'ACTIVE',      cargo:'LIFT',      threat:'LOW'    },
    { id:'l11', from:'AVN_GUM',  to:'FOB_YAP',  type:'AIR',    status:'INTERDICTED', cargo:'MEDEVAC',   threat:'HIGH'   },
    { id:'l12', from:'AVN_GUM',  to:'FOB_PLU',  type:'AIR',    status:'ACTIVE',      cargo:'AASLT',     threat:'MEDIUM' },
    { id:'l13', from:'AVN_GUM',  to:'FOB_CHK',  type:'AIR',    status:'ACTIVE',      cargo:'MEDEVAC',   threat:'MEDIUM' },
  ],
}

// ── EXPORT MAP ────────────────────────────────────────────────────────────────
export const THEATER_NETWORKS: Record<string, TheaterNetwork> = {
  CAMPAIGN_1: EUROPE,
  CAMPAIGN_2: BALTIC,
  CAMPAIGN_3: DESERT,
  CAMPAIGN_4: SAND_BRIDGE,
  CAMPAIGN_5: PACIFIC_PUSH,
  CAMPAIGN_6: ISLAND_HOP,
}

export function getTheaterNetwork(scenarioId: string): TheaterNetwork {
  return THEATER_NETWORKS[scenarioId] || EUROPE
}
