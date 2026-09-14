import { PartMasterItem, PrinterBrand, LinxModel, UbsModel, RynanModel } from '../types';

// Standalone Models (NOT treated as series/families)
export const LINX_STANDALONE_MODELS: LinxModel[] = [
  '7900',
  '7300',
  'CJ400',
  '5900'
];

// Linx 8800 Series
export const LINX_8800_SERIES_MODELS: LinxModel[] = [
  '8820',
  '8830',
  '8840'
];

// Linx 8900 Series
export const LINX_8900_SERIES_MODELS: LinxModel[] = [
  '8910',
  '8920',
  '8940',
  '8940 Spectrum'
];

// Linx 9800 Series
export const LINX_9800_SERIES_MODELS: LinxModel[] = [
  '9810',
  '9820',
  '9830',
  '9840',
  '9840 Spectrum'
];

// Linx 9900 Series
export const LINX_9900_SERIES_MODELS: LinxModel[] = [
  '9900',
  '9910',
  '9920',
  '9940',
  '9940 Spectrum'
];

// Complete grouped Linx model structure for selectors
export const LINX_MODEL_GROUPS = [
  { group: 'Standalone Models', models: LINX_STANDALONE_MODELS },
  { group: 'Linx 8800 Series', models: LINX_8800_SERIES_MODELS },
  { group: 'Linx 8900 Series', models: LINX_8900_SERIES_MODELS },
  { group: 'Linx 9800 Series', models: LINX_9800_SERIES_MODELS },
  { group: 'Linx 9900 Series', models: LINX_9900_SERIES_MODELS },
];

// Flattened authoritative list of all active Linx models
export const LINX_MODELS: LinxModel[] = [
  ...LINX_STANDALONE_MODELS,
  ...LINX_8800_SERIES_MODELS,
  ...LINX_8900_SERIES_MODELS,
  ...LINX_9800_SERIES_MODELS,
  ...LINX_9900_SERIES_MODELS,
];

export const UBS_MODELS: UbsModel[] = [
  'MRX 10',
  'LCX 10'
];

export const RYNAN_MODELS: RynanModel[] = [
  'B1040',
  'R20',
  'R10',
  'TIJ 2.5'
];

// Common 8810+ / 8800+ series models list (Standard CIJ common architecture, except Spectrum models)
export const LINX_8810_PLUS_MODELS: LinxModel[] = [
  '8810', // retained for historical records
  '8820',
  '8830',
  '8840',
  '8910',
  '8920',
  '8940',
  '9800', // retained for historical records
  '9810',
  '9820',
  '9830',
  '9840',
  '9900',
  '9910',
  '9920',
  '9940',
];

/**
 * Resolves the authoritative list of compatible Linx / manufacturer machine models for any part.
 * Formats models cleanly for display (e.g. ['8820', '8830', '8840', '8910', '8920', '8940', ...] -> "8800 / 8900 / 9800 / 9900 Series")
 */
export function getPartCompatibleModels(part: {
  brand?: string;
  modelGroup?: string;
  applicableModels?: string[];
}): string[] {
  if (part.applicableModels && part.applicableModels.length > 0) {
    return part.applicableModels;
  }
  if (part.modelGroup === 'LINX_8810_PLUS_COMMON') {
    return LINX_8810_PLUS_MODELS;
  }
  if (part.modelGroup === 'LINX_8940_SPECTRUM') {
    return ['8940 Spectrum'];
  }
  if (part.modelGroup === 'LINX_5900_7900_SHARED') {
    return ['5900', '7900'];
  }
  if (part.modelGroup === 'LINX_5900') {
    return ['5900'];
  }
  if (part.modelGroup === 'LINX_7900') {
    return ['7900'];
  }
  if (part.modelGroup === 'LINX_CJ400') {
    return ['CJ400'];
  }
  if (part.modelGroup === 'UBS_LCX') {
    return ['LCX 10'];
  }
  if (part.modelGroup === 'UBS_MRX') {
    return ['MRX 10'];
  }
  if (part.modelGroup === 'RYNAN_TIJ') {
    return ['B1040', 'R20', 'R10', 'TIJ 2.5'];
  }
  return [];
}

/**
 * Formats compatible models into a concise, scannable human-readable string for UI display.
 * E.g. "8800 / 8900 / 9800 / 9900 Series" or "8900 / 7900 / 9820" or "5900 / 7900"
 */
export function formatCompatibilityString(models: string[]): string {
  if (!models || models.length === 0) return 'Universal / Accessory';
  
  // Check if it matches the common CIJ series family (10+ models across 8800/8900/9800/9900)
  const isCommonCIJ = models.includes('8820') && models.includes('8920') && (models.includes('9820') || models.includes('9900'));
  if (isCommonCIJ) {
    return '8800 / 8900 / 9800 / 9900 Series';
  }
  
  return models.join(' / ');
}

/**
 * Checks whether a part is compatible with a given machine model.
 */
export function isPartCompatibleWithModel(part: {
  modelGroup?: string;
  applicableModels?: string[];
}, targetModel: string): boolean {
  if (!targetModel) return true;
  const models = getPartCompatibleModels(part);
  const normalizedTarget = targetModel.trim().toLowerCase();
  
  // Check exact model match
  if (models.some(m => m.toLowerCase() === normalizedTarget)) return true;

  // Check family level match (e.g. machine model "8830" matches 8800 series or 8810_PLUS_COMMON)
  if (part.modelGroup === 'LINX_8810_PLUS_COMMON' && LINX_8810_PLUS_MODELS.some(m => m.toLowerCase() === normalizedTarget)) {
    return true;
  }
  
  return false;
}



export const PARTS_MASTER: PartMasterItem[] = [
  // =========================================================================
  // 1. LINX 8810+ COMMON PARTS SET (Applicable to 8810, 8820, 8840, 8910, 8920, 9800, 9900)
  // Official source: Linx 8900 / 8800 Series Parts & Accessories Documentation
  // =========================================================================
  {
    id: 'FA11065',
    partNumber: 'FA11065',
    description: '89 SOLVENT PRIMING UNIT AND VALVE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Solvent System',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11084',
    partNumber: 'FA11084',
    description: 'TRANSFER PUMP',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Pump',
    comments: 'Comes with bracket and screws.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11029',
    partNumber: 'FA11029',
    description: '6-WAY FLUID CONNECTOR BASE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Ink System',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11237',
    partNumber: 'FA11237',
    description: 'VENTURI MANIFOLD',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Venturi',
    comments: 'Includes FA16103 MK5 venturi.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA16103-88',
    partNumber: 'FA16103',
    description: 'MK5 VENTURI REPLACEMENT KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Venturi',
    comments: 'Used for MK5 venturi replacement.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11037',
    partNumber: 'FA11037',
    description: 'SOLVENT RECOVERY UNIT',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Solvent System',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11021',
    partNumber: 'FA11021',
    description: 'SOLVENT LEVEL SENSOR AND CABLE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Sensor',
    comments: 'Level sensor is fitted inside the solvent tank.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11036',
    partNumber: 'FA11036',
    description: 'BUFFER TANK ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Ink System',
    comments: 'Includes the level sensor cable assembly and dip-tube.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11204',
    partNumber: 'FA11204',
    description: 'TUBE SET 5M',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Ink System',
    comments: 'Five metres of each of the seven types of tube used in the printer plus five support elbows.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA72529',
    partNumber: 'FA72529',
    description: 'CARTRIDGE IN-LINE FILTER',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Filter',
    comments: 'Fit for life filter. Only to be replaced in fluid systems that have become contaminated.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11083',
    partNumber: 'FA11083',
    description: 'DOOR SEAL',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    comments: 'Includes the seal carrier parts.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11080',
    partNumber: 'FA11080',
    description: 'DOOR CATCH AND GUIDE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11081',
    partNumber: 'FA11081',
    description: 'MK2 CARTRIDGE GUIDE WITH NEEDLES',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    comments: 'Includes needle assemblies, RFID module, door sensor magnet, and screws.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11079',
    partNumber: 'FA11079',
    description: 'DOOR DAMPER WITH CABLE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    comments: 'Combined damper and door sensor assembly. Includes Nyloc nuts.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11075',
    partNumber: 'FA11075',
    description: 'RFID PCBA AND CABLE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    comments: 'Includes ribbon cable assembly ready folded with the Mylar strip, seals, cable, and screws.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11082',
    partNumber: 'FA11082',
    description: 'DOOR NEEDLE ASSEMBLIES (2)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    comments: 'Includes left and right needle assemblies, nylon cable clamps, and screws.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11074',
    partNumber: 'FA11074',
    description: 'DOOR AND SPILL SENSOR CABLE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cable',
    comments: 'I/O PCB to cartridge access door and spill sensors cable assembly.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11073',
    partNumber: 'FA11073',
    description: 'DOOR ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    comments: 'Includes cartridge guide, needle assemblies, RFID module, door sensor magnet, cables, and screws.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA11002',
    partNumber: 'FA11002',
    description: 'IPM ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    comments: 'Connectors are part of the IPM assembly. Requires Printer Software from v6.0.0.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA70526',
    partNumber: 'FA70526',
    description: 'HVPM FUSE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    quantityRef: 5,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11215',
    partNumber: 'FA11215',
    description: 'LVPSU SAFETY COVER',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Power Supply',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11048',
    partNumber: 'FA11048',
    description: 'LVPM',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Power Supply',
    comments: 'Fitted with Earth Strap Pack FA11239.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11050',
    partNumber: 'FA11050',
    description: 'HVPM ON A TRAY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    comments: 'Includes the LVPSU safety cover FA11215.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11051',
    partNumber: 'FA11051',
    description: 'HVPM AND LVPM WITH ENCLOSURE',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    comments: 'Fitted with Earth Strap Pack FA11239.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA67111',
    partNumber: 'FA67111',
    description: 'POSITIVE AIR UPGRADE INTERNAL',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Pump',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11026',
    partNumber: 'FA11026',
    description: 'AIR FILTER HOUSING',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11092',
    partNumber: 'FA11092',
    description: 'SCREEN MEMBRANE WITH POWER BUTTON',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11045',
    partNumber: 'FA11045',
    description: 'TOUCH SCREEN ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA11022',
    partNumber: 'FA11022',
    description: 'CABLE HVPSU TO IPM',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cable',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 11,
    status: 'ACTIVE'
  },
  {
    id: 'FA70516',
    partNumber: 'FA70516',
    description: 'IPM POWER 5-WAY CABLEFORM',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cable',
    quantityRef: 4,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 11,
    status: 'ACTIVE'
  },
  {
    id: 'FA11239',
    partNumber: 'FA11239',
    description: 'EARTH STRAP PACK',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cable',
    comments: 'Chassis to rear panel, front door, and PSU earth straps.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA11202',
    partNumber: 'FA11202',
    description: 'CABLE DISPLAY TO IPM',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cable',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA11049',
    partNumber: 'FA11049',
    description: 'CABLE MAINS TO PSU',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cable',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 13,
    status: 'ACTIVE'
  },
  {
    id: 'FA11043',
    partNumber: 'FA11043',
    description: 'IP65 AIR FILTER',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Filter',
    comments: 'Also part of the EASI-CHANGE SERVICE KIT.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 15,
    status: 'ACTIVE'
  },
  {
    id: 'FA11099',
    partNumber: 'FA11099',
    description: 'SERVICE MODULE ACCESS PANEL',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    comments: 'Common to 8900 & 8800 series printers.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 15,
    status: 'ACTIVE'
  },
  {
    id: 'FA79030',
    partNumber: 'FA79030',
    description: 'FEET WITH SCREWS',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Mechanical',
    comments: 'Includes quantity 4 feet, washers and screws.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 15,
    status: 'ACTIVE'
  },
  {
    id: 'FA11094',
    partNumber: 'FA11094',
    description: 'INK SYSTEM BAFFLE VENTS',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Ink System',
    quantityRef: 4,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 15,
    status: 'ACTIVE'
  },
  {
    id: 'FA27027',
    partNumber: 'FA27027',
    description: 'MK11 MIDI 2MR/A PRINTHEAD ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA27028',
    partNumber: 'FA27028',
    description: 'MK11 MIDI 4MR/A PRINTHEAD ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA73527',
    partNumber: 'FA73527',
    description: 'M2 X 8 CAP HEAD SOCKET SCREW',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Mechanical',
    quantityRef: 50,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA20017',
    partNumber: 'FA20017',
    description: 'MK9/11/13 NOZZLE COVER (5 PACK)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Nozzle',
    quantityRef: 5,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA74508',
    partNumber: 'FA74508',
    description: "MK11 CAL'D NOZZLE ASSY 75µm",
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Nozzle',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA73531',
    partNumber: 'FA73531',
    description: 'MK9 PRINTHEAD SENSE CLIP – PACK',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    quantityRef: 10,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA73524',
    partNumber: 'FA73524',
    description: 'MK9 PRINTHEAD COVER THUMBSCREW',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    quantityRef: 5,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA73534',
    partNumber: 'FA73534',
    description: 'MK 9/11/13 COVER SCREW WITH WINGS (5 PACK)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    quantityRef: 5,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11077',
    partNumber: 'FA11077',
    description: '3 WAY SOLVENT FEED CONNECTOR WITH FILTER',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Solvent System',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11012',
    partNumber: 'FA11012',
    description: 'PRINTHEAD FILTERS',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Filter',
    comments: 'For the ink and solvent feed connectors of the Mk11 Midi printhead.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11076',
    partNumber: 'FA11076',
    description: '3 WAY INK FEED CONNECTOR WITH FILTER',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Ink System',
    comments: 'For the Mk11 Midi printhead only.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA77501',
    partNumber: 'FA77501',
    description: 'MK9 PRINTHEAD FILTER WITH HOUSING (MK2)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Filter',
    comments: 'For the Mk11 Midi printhead.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 18,
    status: 'ACTIVE'
  },
  {
    id: 'FA73523',
    partNumber: 'FA73523',
    description: 'MK9/ MIDI COVER TUBE ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 18,
    status: 'ACTIVE'
  },
  {
    id: 'FA20000',
    partNumber: 'FA20000',
    description: 'NOZZLE ALIGNMENT TOOL',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Tool',
    comments: 'For use on all Mk9 and Mk11 printhead nozzles.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 18,
    status: 'ACTIVE'
  },
  {
    id: 'FA20020',
    partNumber: 'FA20020',
    description: 'MK11 COVER SEAL',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    comments: 'In wet applications, prevents water leaking into printhead.',
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 18,
    status: 'ACTIVE'
  },
  {
    id: 'FA20019',
    partNumber: 'FA20019',
    description: 'MK11/13 GUTTER PLATE (5 PACK)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Printhead',
    quantityRef: 5,
    sourceDoc: 'Linx 8900 Series Illustrated Parts List',
    sourcePage: 18,
    status: 'ACTIVE'
  },
  {
    id: 'FA11100',
    partNumber: 'FA11100',
    description: '8900 SERIES IP55 EASI-CHANGE SERVICE KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Service Kit',
    comments: 'For IP55 printers before serial number AI742. Includes air filter.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 35,
    status: 'ACTIVE'
  },
  {
    id: 'FA11101',
    partNumber: 'FA11101',
    description: '8900 SERIES IP65 EASI-CHANGE SERVICE KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Service Kit',
    comments: 'Includes the air filter.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 35,
    status: 'ACTIVE'
  },
  {
    id: 'FA11102',
    partNumber: 'FA11102',
    description: '8900/8800 SERIES IP55 EASI-CHANGE SIMPLE SERVICE KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Service Kit',
    comments: 'For IP55 printers from serial number AI742. Includes 2nd and 3rd gen air filters.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 35,
    status: 'ACTIVE'
  },
  {
    id: 'FA74512',
    partNumber: 'FA74512',
    description: '8900 SERIES IP65 EASI-CHANGE SERVICE KIT — PIGMENTED',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Service Kit',
    comments: 'For printer with Mk11 Midi plus printhead. Includes air filter and 35 µm connector filter.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 35,
    status: 'ACTIVE'
  },
  {
    id: 'FA74513',
    partNumber: 'FA74513',
    description: '8900/8800 SERIES EASI-CHANGE SERVICE KIT — PIGMENTED',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Service Kit',
    comments: 'For IP55 printer with Mk11 Midi plus printhead. Includes air filters and 35 µm filter.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 35,
    status: 'ACTIVE'
  },
  {
    id: 'FA78501',
    partNumber: 'FA78501',
    description: '8X00 SERIES DECOMMISSIONING KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Maintenance Kit',
    comments: '8800 & 8900 Series printers.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 30,
    status: 'ACTIVE'
  },
  {
    id: 'FA62100',
    partNumber: 'FA62100',
    description: '8900 HALTBAR RANGE SHELF',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA62101',
    partNumber: 'FA62101',
    description: '8900 HALTBAR RANGE BOLT-DOWN STAND',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA62102',
    partNumber: 'FA62102',
    description: '8900 HALTBAR RANGE TROLLEY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA62104',
    partNumber: 'FA62104',
    description: '8900 HALTBAR RANGE BOLT-DOWN CABINET',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA62105',
    partNumber: 'FA62105',
    description: '8900 HALTBAR RANGE TROLLEY CABINET',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Cabinet',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11213',
    partNumber: 'FA11213',
    description: '8900 PARALLEL I/O & RS-232 ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA11214',
    partNumber: 'FA11214',
    description: '8900 MULTI-STAGE ALARM VFC & RS-232 ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA11216',
    partNumber: 'FA11216',
    description: '8900 MULTI-STAGE ALARM 24V & RS-232 ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA11217',
    partNumber: 'FA11217',
    description: '8900 PARALLEL I/O, MULTI-STAGE ALARM VFC, RS-232 ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA11220',
    partNumber: 'FA11220',
    description: '8900 PARALLEL I/O PCBA',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'PCB',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA11221',
    partNumber: 'FA11221',
    description: '8900 MULTI-STAGE ALARM PCBA',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'PCB',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA11225',
    partNumber: 'FA11225',
    description: 'VFC OPTIONS KIT (6-WAY)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    comments: 'Provides a VFC output for 3-stage beacon. Includes 6-way connector (FA67102).',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11226',
    partNumber: 'FA11226',
    description: 'VFC OPTIONS KIT (3-WAY)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    comments: 'Provides single VFC output for beacon. Includes 3-way connector (FA72186).',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11233',
    partNumber: 'FA11233',
    description: 'VFC RS232 OPTIONS KIT (3-WAY)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    comments: 'Provides a 3 pin VFC and RS-232 output.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11234',
    partNumber: 'FA11234',
    description: 'VFC OPTIONS KIT (3-WAY)',
    brand: 'LINX',
    modelGroup: 'LINX_8810_PLUS_COMMON',
    applicableModels: LINX_8810_PLUS_MODELS,
    category: 'Accessory',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },

  // =========================================================================
  // 2. LINX 8940 SPECTRUM EXCLUSIVE PARTS SET
  // Official source: Linx 8940 Spectrum CIJ Printers Illustrated Parts List (TP1H011-3)
  // MUST NOT BE MIXED into the common 8810+ parts set!
  // =========================================================================
  {
    id: 'FA11189',
    partNumber: 'FA11189',
    description: 'DOUBLE DAMPER ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Ink System',
    comments: '8940SP Spectrum exclusive double damper unit.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11191',
    partNumber: 'FA11191',
    description: '8X SPECTRUM MAIN INK PUMP ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Pump',
    comments: '8940SP heavy-duty spectrum pigmented main ink pump.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11195',
    partNumber: 'FA11195',
    description: '8X SPECTRUM VALVE MANIFOLD ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Manifold',
    comments: '8940SP complete valve manifold block with mix valves.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11192',
    partNumber: 'FA11192',
    description: 'SPECTRUM VALVE CABLEFORM ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Cable',
    comments: '8940SP harness for V1-V7, Vmix, Vfd.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11188',
    partNumber: 'FA11188',
    description: '8X SPECTRUM INK TRAY - WELDED SM',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Cabinet',
    comments: '8940SP Spectrum welded sheet metal ink tray.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11199',
    partNumber: 'FA11199',
    description: 'MIX VALVE 3-2 NO 6-4 TUBE BARB',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Valve',
    comments: '8940SP mix valve for pigmented inks.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA74121-SP',
    partNumber: 'FA74121',
    description: 'NYLON C-CLIP',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Valve',
    quantityRef: 20,
    comments: 'For MIX VALVE, part number FA11199.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11241',
    partNumber: 'FA11241',
    description: 'SPECTRUM PRESSURE TRANSDUCER',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Sensor',
    comments: 'Complete with Barb connectors (push fit), 8900 Spectrum PRT adaptor, tubing, and cable.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11193',
    partNumber: 'FA11193',
    description: '89 SPECTRUM INK SYSTEM',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Ink System',
    comments: 'Complete 8940 Spectrum ink system modular block.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA11196',
    partNumber: 'FA11196',
    description: '89 SPECTRUM REAR PANEL ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Cabinet',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 15,
    status: 'ACTIVE'
  },
  {
    id: 'FA11197',
    partNumber: 'FA11197',
    description: 'SPECTRUM SERVICE MODULE ACCESS PANEL',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Cabinet',
    comments: 'Includes four securing screws and captive washers.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 15,
    status: 'ACTIVE'
  },
  {
    id: 'FA74514',
    partNumber: 'FA74514',
    description: '8940 SPECTRUM EASI-CHANGE SERVICE KIT - PIGMENTED',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Service Kit',
    comments: 'Complete with Vortex® Service Module with Easi-Change® Service key (RFID), Pureflow® Main Ink Filter, Ink Fluid Connector Filter and Air Filter.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 20,
    status: 'ACTIVE'
  },
  {
    id: 'FA66080',
    partNumber: 'FA66080',
    description: '8940 SPECTRUM DECOMMISSIONING KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Maintenance Kit',
    comments: 'Dedicated decommissioning flush kit for 8940 Spectrum printers.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 22,
    status: 'ACTIVE'
  },
  {
    id: 'FA60003',
    partNumber: 'FA60003',
    description: '8X40 CUSTOMER CLEANING KIT',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Consumable',
    comments: 'For 8X40 Spectrum printers.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 31,
    status: 'ACTIVE'
  },
  {
    id: 'FA66076',
    partNumber: 'FA66076',
    description: 'INK SHAKER 8XXX SERIES 230V 50/60HZ',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Tool',
    comments: 'For 8X40 Spectrum printers that use 500ml ink cartridges.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 42,
    status: 'ACTIVE'
  },
  {
    id: 'FA66077',
    partNumber: 'FA66077',
    description: 'INK SHAKER SERIES 115V 50/60HZ',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Tool',
    comments: 'For 8X40 Spectrum printers that use 500ml ink cartridges.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 42,
    status: 'ACTIVE'
  },
  {
    id: 'FA66078',
    partNumber: 'FA66078',
    description: 'INK SHAKER CARTRIDGE HOLDER ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Tool',
    comments: 'For FA66077 and FA66076 Ink Shakers.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 42,
    status: 'ACTIVE'
  },
  {
    id: 'FA27018/3103',
    partNumber: 'FA27018/3103',
    description: 'MK11 MIDI PRINTHEAD ASSY 2M',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Printhead',
    comments: 'For use on the 8940 Spectrum with 1316 ink only.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA27019/3103',
    partNumber: 'FA27019/3103',
    description: 'MK11 MIDI PRINTHEAD ASSY 4M',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Printhead',
    comments: 'For use on the 8940 Spectrum with 1316 ink only.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA27037',
    partNumber: 'FA27037',
    description: 'MK11 MIDI PLUS 2M',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Printhead',
    comments: 'This version of Midi plus printhead is designed specifically for use with Spectrum printer inks.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA27038',
    partNumber: 'FA27038',
    description: 'MK11 MIDI PLUS 4M',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Printhead',
    comments: 'Designed specifically for use with Spectrum printer inks.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA27040',
    partNumber: 'FA27040',
    description: 'MK11 MIDI PLUS 2M RA',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Printhead',
    comments: 'Right angled printhead designed specifically for Spectrum printer inks.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA27041',
    partNumber: 'FA27041',
    description: 'MK11 MIDI PLUS 4M RA',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Printhead',
    comments: 'Right angled 4M printhead designed specifically for Spectrum printer inks.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA77518/XXXX',
    partNumber: 'FA77518/XXXX',
    description: 'CAL’D NOZZLE ASSY MK9/11 62µm',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Nozzle',
    comments: 'Only for FA27018/3103 and FA27019/3103 printheads.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA11190',
    partNumber: 'FA11190',
    description: 'CABLE SERVICE MODULE',
    brand: 'LINX',
    modelGroup: 'LINX_8940_SPECTRUM',
    applicableModels: ['8940 Spectrum'],
    category: 'Cable',
    comments: 'I/O PCB to service module cable assembly 720mm.',
    sourceDoc: 'Linx 8940 Spectrum Illustrated Parts List',
    sourcePage: 9,
    status: 'ACTIVE'
  },

  // =========================================================================
  // 3. LINX 5900 SPECIFIC & SHARED 5900/7900 PARTS
  // Official source: Linx 5900 and 7900 CIJ Illustrated Parts List (Issue 07)
  // =========================================================================
  {
    id: 'FA74380',
    partNumber: 'FA74380',
    description: '5900 KEYPAD ASSEMBLY - EUROPEAN',
    brand: 'LINX',
    modelGroup: 'LINX_5900',
    applicableModels: ['5900'],
    category: 'Cabinet',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA13806-59',
    partNumber: 'FA13806',
    description: '5900 IPM + CE TRIP PCBA',
    brand: 'LINX',
    modelGroup: 'LINX_5900',
    applicableModels: ['5900'],
    category: 'Electronics',
    comments: 'For use with the 5900 printer only, implemented from serial no. P5900449.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 6,
    status: 'ACTIVE'
  },
  {
    id: 'FA13888',
    partNumber: 'FA13888',
    description: '5900 IPM PCB',
    brand: 'LINX',
    modelGroup: 'LINX_5900',
    applicableModels: ['5900'],
    category: 'Electronics',
    comments: 'For printers that are not compliant to IEC62368-1.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA75044',
    partNumber: 'FA75044',
    description: '5900 BOOT PROM SET',
    brand: 'LINX',
    modelGroup: 'LINX_5900',
    applicableModels: ['5900'],
    category: 'Electronics',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 16,
    status: 'ACTIVE'
  },
  {
    id: 'FA66071',
    partNumber: 'FA66071',
    description: 'ENHANCED 5900 SERVICE KIT (FULL KIT)',
    brand: 'LINX',
    modelGroup: 'LINX_5900',
    applicableModels: ['5900'],
    category: 'Service Kit',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 17,
    status: 'ACTIVE'
  },
  {
    id: 'FA16103-59',
    partNumber: 'FA16103',
    description: 'MK5 VENTURI REPLACEMENT KIT',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Venturi',
    comments: 'Used for Mk7 and Mk9 4M plus heads, refer to Service Bulletin SB0828.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA72514-59',
    partNumber: 'FA72514',
    description: 'MK6 VENTURI REPLACEMENT KIT',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Venturi',
    comments: 'Not used for Mk7 4M plus heads.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA16319-59',
    partNumber: 'FA16319',
    description: 'MK4 MANIFOLD ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Manifold',
    comments: 'Refer to SB0679. Includes Y-piece FA73006 and a bare manifold with barbs.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA16318-59',
    partNumber: 'FA16318',
    description: 'MK6 VNTRI/MANFLD/PT/Y CON ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Manifold',
    comments: 'Refer to SB0679 and SB0681. Includes Y-piece FA73006.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA16320-59',
    partNumber: 'FA16320',
    description: 'MK6 VENTURI WITH MK4 MANIFOLD ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Manifold',
    comments: 'Refer to SB0679, SB0681 and SB0840. Includes Y-piece FA73006.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 12,
    status: 'ACTIVE'
  },
  {
    id: 'FA16015',
    partNumber: 'FA16015',
    description: 'LINX BADGE',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Cabinet',
    comments: 'For 5900 and 7900 printers.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA71089',
    partNumber: 'FA71089',
    description: 'LCD ASSEMBLY BACKLIT',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    comments: 'Display PCB with LCD. For older printers order the entire assembly FA71089.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA71088',
    partNumber: 'FA71088',
    description: 'LCD LED BACKLIT',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    comments: 'LCD and cableform for 5900 and 7900 printers from serial number FP005.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 4,
    status: 'ACTIVE'
  },
  {
    id: 'FA13543',
    partNumber: 'FA13543',
    description: 'COVER SEAL',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Cabinet',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA74152',
    partNumber: 'FA74152',
    description: 'MOULDED INK CAP',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Ink System',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA74153',
    partNumber: 'FA74153',
    description: 'MOULDED SOLVENT CAP',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Solvent System',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA72050',
    partNumber: 'FA72050',
    description: 'FEED DAMPER ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Ink System',
    comments: 'Consumable. See CIJ Scheduled Maintenance document.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 11,
    status: 'ACTIVE'
  },
  {
    id: 'FA320019',
    partNumber: 'FA320019',
    description: 'IN LINE FILTER POLYPROPYLENE',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Filter',
    comments: 'Should be replaced during scheduled maintenance.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 11,
    status: 'ACTIVE'
  },
  {
    id: 'FA74316',
    partNumber: 'FA74316',
    description: 'CIJ PUMP ASSEMBLY',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Pump',
    comments: 'Includes pump gasket FA10577, two BSP connectors FA73003, and four flange nuts FA73172.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 11,
    status: 'ACTIVE'
  },
  {
    id: 'FA73044',
    partNumber: 'FA73044',
    description: 'MAIN INK FILTER 10 MICRON',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Filter',
    comments: 'Consumable scheduled maintenance item.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 11,
    status: 'ACTIVE'
  },
  {
    id: 'FA13484',
    partNumber: 'FA13484',
    description: 'SOLVENT TANK ASSEMBLY MK2',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Solvent System',
    comments: 'With tank, filler tube, dip tube and cap. Used in 5900 and 7900 printers.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 14,
    status: 'ACTIVE'
  },
  {
    id: 'FA13483',
    partNumber: 'FA13483',
    description: 'INK TANK ASSEMBLY MK2',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Ink System',
    comments: 'With tank, filler tube, dip tube and cap. Used in 5900 and 7900 printers.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 14,
    status: 'ACTIVE'
  },

  // =========================================================================
  // 4. LINX 7900 SPECIFIC PARTS
  // =========================================================================
  {
    id: 'FA71812',
    partNumber: 'FA71812',
    description: '7900 KEYPAD ASSEMBLY - EUROPEAN',
    brand: 'LINX',
    modelGroup: 'LINX_7900',
    applicableModels: ['7900'],
    category: 'Cabinet',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 19,
    status: 'ACTIVE'
  },
  {
    id: 'FA13805-79',
    partNumber: 'FA13805',
    description: '7900 IPM + CE TRIP PCBA',
    brand: 'LINX',
    modelGroup: 'LINX_7900',
    applicableModels: ['7900'],
    category: 'Electronics',
    comments: 'For IP55 printers only. Implemented from serial no. P7900512.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 23,
    status: 'ACTIVE'
  },
  {
    id: 'FA13800-79',
    partNumber: 'FA13800',
    description: '7900 IPM PCB',
    brand: 'LINX',
    modelGroup: 'LINX_7900',
    applicableModels: ['7900'],
    category: 'Electronics',
    comments: 'For use with non IEC62368-1 compliant 7900 IP65 printers to serial number P7900528.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 26,
    status: 'ACTIVE'
  },
  {
    id: 'FA74330',
    partNumber: 'FA74330',
    description: '7900 SCHEDULED SERVICE KIT',
    brand: 'LINX',
    modelGroup: 'LINX_7900',
    applicableModels: ['7900'],
    category: 'Service Kit',
    comments: 'For 7900 IP55, IP65 and Solver printers. Not for Spectrum and Food Grade printers.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 53,
    status: 'ACTIVE'
  },
  {
    id: 'FA74203',
    partNumber: 'FA74203',
    description: '6800 DUAL HEAD PUMP ASSY',
    brand: 'LINX',
    modelGroup: 'LINX_7900',
    applicableModels: ['7900'],
    category: 'Pump',
    comments: 'Used in 7900FG food grade printers.',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 48,
    status: 'ACTIVE'
  },

  // =========================================================================
  // 5. LINX CJ400 PARTS
  // =========================================================================
  {
    id: 'FA12111',
    partNumber: 'FA12111',
    description: 'LINX 10/CJ400 EASI-CHANGE SERVICE KIT',
    brand: 'LINX',
    modelGroup: 'LINX_CJ400',
    applicableModels: ['CJ400'],
    category: 'Service Kit',
    comments: 'Includes service module, Easi-Change service key and cartridge adaptor.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 37,
    status: 'ACTIVE'
  },
  {
    id: 'FA12016',
    partNumber: 'FA12016',
    description: 'LINX 10/CJ400 PRINTER STAND MOUNTED',
    brand: 'LINX',
    modelGroup: 'LINX_CJ400',
    applicableModels: ['CJ400'],
    category: 'Accessory',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA12012',
    partNumber: 'FA12012',
    description: 'LINX 10/CJ400 PRINTER CONVEYOR MOUNTING BRACKET',
    brand: 'LINX',
    modelGroup: 'LINX_CJ400',
    applicableModels: ['CJ400'],
    category: 'Accessory',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'FA12101',
    partNumber: 'FA12101',
    description: 'LINX 10/CJ400 DECOMMISSIONING KIT',
    brand: 'LINX',
    modelGroup: 'LINX_CJ400',
    applicableModels: ['CJ400'],
    category: 'Maintenance Kit',
    comments: 'Includes cartridge adaptor.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 30,
    status: 'ACTIVE'
  },
  {
    id: 'FA60000',
    partNumber: 'FA60000',
    description: 'CUSTOMER CLEANING KIT',
    brand: 'LINX',
    modelGroup: 'LINX_CJ400',
    applicableModels: ['CJ400'],
    category: 'Consumable',
    comments: 'Includes solvent bottle, beaker, cleaner, gloves & safety spectacles.',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 31,
    status: 'ACTIVE'
  },

  // =========================================================================
  // 6. UBS LCX 10 (LCX17, LCX72, APLINK LCX)
  // Official source: United Barcode Systems Spare Parts Catalog LCX Series
  // =========================================================================
  {
    id: 'UBS-200.007.982',
    partNumber: '200.007.982',
    description: 'Printhead Protection Plate LCX17',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Printhead',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.5',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.007.202-LCX',
    partNumber: '200.007.202',
    description: 'Magnet Frontal Plate LCX',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Printhead',
    comments: 'Must be assembled in Item 3 with special glue.',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.5',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.812',
    partNumber: '300.007.812',
    description: 'Printhead XAAR 128 / 40pl 8.3 Khz',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Printhead',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.5',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.856',
    partNumber: '300.007.856',
    description: 'Printhead Interface Board LCX',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'PCB',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.5',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.842-LCX',
    partNumber: '300.007.842',
    description: 'Photocell',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Sensor',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.5',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.100.279',
    partNumber: '200.100.279',
    description: 'SIDE POSITION KIT LCX17',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Accessory',
    comments: 'Complete Kit including bracket, side cover, and bottom plate.',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.6',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.100.273',
    partNumber: '200.100.273',
    description: 'TOP POSITION KIT LCX17',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Accessory',
    comments: 'Complete Kit for top printing position.',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.6',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.007.977',
    partNumber: '200.007.977',
    description: 'Printhead Protection Plate LCX72',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Printhead',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.7',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.047-LCX',
    partNumber: '300.007.047',
    description: 'Printhead SEIKO 35 PL',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Printhead',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.7',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.053-LCX',
    partNumber: '300.007.053',
    description: 'SEIKO Printhead Interface Board',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'PCB',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.7',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.907.009',
    partNumber: '200.907.009',
    description: 'Maintenance Kit for APLINK LCX Series',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Maintenance Kit',
    comments: 'Complete Maintenance Kit including Ink Tank, tubes, and vacuum filters.',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.9',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.051-LCX',
    partNumber: '300.007.051',
    description: 'UBSLINK Board',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Electronics',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.9',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.092-LCX',
    partNumber: '300.007.092',
    description: 'Air Pump 12 V',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Pump',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.9',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.029-LCX',
    partNumber: '300.007.029',
    description: 'Ink Pump 12 V',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Pump',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.9',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-400.007.000-LCX',
    partNumber: '400.007.000',
    description: 'Electrovalve MH1',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Valve',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.9',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.110.067',
    partNumber: '200.110.067',
    description: 'KIT Panel PC 5.7” LVDS',
    brand: 'UBS',
    modelGroup: 'UBS_LCX',
    applicableModels: ['LCX 10'],
    category: 'Electronics',
    sourceDoc: 'UBS LCX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC LCX17/72 p.9',
    status: 'ACTIVE'
  },

  // =========================================================================
  // 7. UBS MRX 10 (MRX72, APLINK MRX Series)
  // Official source: United Barcode Systems Spare Parts Catalog MRX Series
  // =========================================================================
  {
    id: 'UBS-200.017.071',
    partNumber: '200.017.071',
    description: 'Printhead Protection Plate MRX 72',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Printhead',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.2',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.017.069',
    partNumber: '200.017.069',
    description: 'Printhead Frontal Plate MRX 72',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Printhead',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.2',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.047-MRX',
    partNumber: '300.007.047',
    description: 'Printhead SEIKO 35 PL',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Printhead',
    comments: 'Seiko 35 PL printhead unit for MRX.',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.2',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.053-MRX',
    partNumber: '300.007.053',
    description: 'Seiko Printhead Interface Board MRX',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'PCB',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.2',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.253',
    partNumber: '300.007.253',
    description: 'Relay Board (Heating System)',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Electronics',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.2',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.708',
    partNumber: '300.007.708',
    description: 'Electrical Resistance Heater',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Electronics',
    comments: 'Refill with thermal paste before replacement.',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.2',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.100.282',
    partNumber: '200.100.282',
    description: 'TOP TO SIDE POSITION CONVERSION KIT MRX72',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Accessory',
    comments: 'Complete Kit (Racor + Tube).',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.3',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.100.281',
    partNumber: '200.100.281',
    description: 'SIDE TO TOP POSITION CONVERSION KIT MRX72',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Accessory',
    comments: 'Complete Kit (Racor + Tube + Cables).',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.3',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-200.907.001',
    partNumber: '200.907.001',
    description: 'Maintenance Kit for APLINK Series',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Maintenance Kit',
    comments: 'Complete Maintenance Kit with Ink Tank and filters.',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.4',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.052',
    partNumber: '300.007.052',
    description: 'UBSLINK VI-A Display Board',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Electronics',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.4',
    status: 'ACTIVE'
  },
  {
    id: 'UBS-300.007.051-MRX',
    partNumber: '300.007.051',
    description: 'UBSLINK VI-A Control Board',
    brand: 'UBS',
    modelGroup: 'UBS_MRX',
    applicableModels: ['MRX 10'],
    category: 'Electronics',
    sourceDoc: 'UBS MRX Series Spare Parts Catalog',
    sourcePage: 'Doc : SPC MRX72 p.4',
    status: 'ACTIVE'
  },

  // =========================================================================
  // 8. RYNAN TIJ PRINTERS PARTS
  // =========================================================================
  {
    id: 'RY-TIJ-C10',
    partNumber: 'RY-TIJ-C10',
    description: 'RYNAN TIJ 0.5" Single Cartridge Printhead Rig',
    brand: 'RYNAN',
    modelGroup: 'RYNAN_TIJ',
    applicableModels: ['B1040', 'R10', 'TIJ 2.5'],
    category: 'Printhead',
    comments: 'Supports standard HP 45A thermal inkjet cartridges.',
    sourceDoc: 'RYNAN TIJ Technical Spare Parts Catalog',
    sourcePage: 1,
    status: 'ACTIVE'
  },
  {
    id: 'RY-TIJ-C20',
    partNumber: 'RY-TIJ-C20',
    description: 'RYNAN TIJ 1.0" Dual-Head High Resolution Rig',
    brand: 'RYNAN',
    modelGroup: 'RYNAN_TIJ',
    applicableModels: ['R20', 'TIJ 2.5'],
    category: 'Printhead',
    comments: 'Stitched 1-inch print height cartridge unit.',
    sourceDoc: 'RYNAN TIJ Technical Spare Parts Catalog',
    sourcePage: 1,
    status: 'ACTIVE'
  },
  {
    id: 'RY-PCB-01',
    partNumber: 'RY-PCB-01',
    description: 'RYNAN Smart Controller Interface Board',
    brand: 'RYNAN',
    modelGroup: 'RYNAN_TIJ',
    applicableModels: ['B1040', 'R20', 'R10', 'TIJ 2.5'],
    category: 'PCB',
    sourceDoc: 'RYNAN TIJ Technical Spare Parts Catalog',
    sourcePage: 2,
    status: 'ACTIVE'
  },
  {
    id: 'RY-SEN-01',
    partNumber: 'RY-SEN-01',
    description: 'RYNAN High Speed Fiber Optic Product Sensor',
    brand: 'RYNAN',
    modelGroup: 'RYNAN_TIJ',
    applicableModels: ['B1040', 'R20', 'R10', 'TIJ 2.5'],
    category: 'Sensor',
    sourceDoc: 'RYNAN TIJ Technical Spare Parts Catalog',
    sourcePage: 3,
    status: 'ACTIVE'
  },

  // =========================================================================
  // 9. OBSOLETE PARTS (Separately tracked, with replacement parts when supplied)
  // Official source: Linx Obsolete Parts List (Pages 65-67 and 49)
  // =========================================================================
  {
    id: 'FA75038',
    partNumber: 'FA75038',
    description: 'BOOT PROM SET',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 65,
    status: 'OBSOLETE'
  },
  {
    id: 'FA67059',
    partNumber: 'FA67059',
    description: 'REBOOT KIT',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Maintenance Kit',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 65,
    status: 'OBSOLETE'
  },
  {
    id: 'FA77120',
    partNumber: 'FA77120',
    description: 'O-RING PACK',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Consumable',
    sourceDoc: 'Linx 5900 & 7900 Illustrated Parts List',
    sourcePage: 65,
    status: 'OBSOLETE'
  },
  {
    id: 'FA67000',
    partNumber: 'FA67000',
    description: 'PARAL I/O+VFC M/ALARM+ETH UPGR+OP/PLT',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 49,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA67106'
  },
  {
    id: 'FA67065',
    partNumber: 'FA67065',
    description: 'VFC MULTI ALARM UG ASSY NO OP PLATE',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 49,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA67107'
  },
  {
    id: 'FA67089',
    partNumber: 'FA67089',
    description: '59/73 PARALLEL I/O+VFC M/ALARM UPGR',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 49,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA67105'
  },
  {
    id: 'FA67100',
    partNumber: 'FA67100',
    description: '5900 PARA I/O+ ENET+MULTI STAGE VFC',
    brand: 'LINX',
    modelGroup: 'LINX_5900',
    applicableModels: ['5900'],
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 49,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA67109'
  },
  {
    id: 'FA72181',
    partNumber: 'FA72181',
    description: '59/79 M/STGE ALARM VFC & PRL I/O INTR',
    brand: 'LINX',
    modelGroup: 'LINX_5900_7900_SHARED',
    applicableModels: ['5900', '7900'],
    category: 'Electronics',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 49,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA67108'
  },
  {
    id: 'FA61077',
    partNumber: 'FA61077',
    description: 'REGISTRATION MARK SCANNER, IP67 D 5M',
    brand: 'LINX',
    modelGroup: 'UNIVERSAL_ACCESSORY',
    applicableModels: ['5900', '7900', '8810', '8820', '8910', '8920'],
    category: 'Sensor',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 49,
    status: 'OBSOLETE'
  },
  {
    id: 'FA61062',
    partNumber: 'FA61062',
    description: 'REFLECTION LIGHT BEAM SCANNER',
    brand: 'LINX',
    modelGroup: 'UNIVERSAL_ACCESSORY',
    applicableModels: ['5900', '7900', '8810', '8820', '8910', '8920'],
    category: 'Sensor',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 9,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA61105'
  },
  {
    id: 'FA61050',
    partNumber: 'FA61050',
    description: 'RETRO-REFLECTION SENSOR',
    brand: 'LINX',
    modelGroup: 'UNIVERSAL_ACCESSORY',
    applicableModels: ['5900', '7900', '8810', '8820', '8910', '8920'],
    category: 'Sensor',
    sourceDoc: 'Linx CIJ Accessories Parts List',
    sourcePage: 9,
    status: 'OBSOLETE',
    replacementPartNumber: 'FA61108'
  }
];

/**
 * Filter parts strictly according to user-defined model applicability rules:
 * - LINX models 8810 onward EXCEPT 8940 Spectrum: return LINX_8810_PLUS_COMMON set.
 * - LINX 8940 Spectrum: return ONLY LINX_8940_SPECTRUM set.
 * - LINX 5900: return LINX_5900 and LINX_5900_7900_SHARED set.
 * - LINX 7900: return LINX_7900 and LINX_5900_7900_SHARED set.
 * - LINX CJ400: return LINX_CJ400 set.
 * - UBS LCX: return UBS_LCX set.
 * - UBS MRX: return UBS_MRX set.
 * - RYNAN: return RYNAN_TIJ set.
 */
export function getPartsForModel(brand: PrinterBrand, model: string, includeObsolete: boolean = false): PartMasterItem[] {
  const normModel = model.trim();

  return PARTS_MASTER.filter(part => {
    if (!includeObsolete && part.status === 'OBSOLETE') {
      return false;
    }
    if (part.brand !== brand) {
      return false;
    }

    // STRICT APPLICABILITY RULES:
    if (brand === 'LINX') {
      if (normModel === '8940 Spectrum') {
        // 8940 Spectrum must have its own separate Spectrum Parts Set.
        // Do NOT mix common 8810+ parts into Spectrum.
        return part.modelGroup === 'LINX_8940_SPECTRUM';
      }

      // Any LINX model 8810+ (8810, 8820, 8840, 8910, 8920, 9800, 9900)
      if (LINX_8810_PLUS_MODELS.includes(normModel as LinxModel)) {
        // Must show Common 8810+ Parts Set.
        // Never show 8940 Spectrum exclusive parts here.
        return part.modelGroup === 'LINX_8810_PLUS_COMMON';
      }

      if (normModel === '5900') {
        return part.modelGroup === 'LINX_5900' || part.modelGroup === 'LINX_5900_7900_SHARED';
      }

      if (normModel === '7900') {
        return part.modelGroup === 'LINX_7900' || part.modelGroup === 'LINX_5900_7900_SHARED';
      }

      if (normModel === 'CJ400') {
        return part.modelGroup === 'LINX_CJ400';
      }
    }

    if (brand === 'UBS') {
      if (normModel === 'LCX 10') {
        return part.modelGroup === 'UBS_LCX';
      }
      if (normModel === 'MRX 10') {
        return part.modelGroup === 'UBS_MRX';
      }
    }

    if (brand === 'RYNAN') {
      return part.modelGroup === 'RYNAN_TIJ';
    }

    // Direct match fallback if specifically mapped
    return part.applicableModels.includes(normModel);
  });
}

export function searchParts(
  brand: PrinterBrand,
  model: string,
  queryText: string,
  includeObsolete: boolean = false
): PartMasterItem[] {
  const baseList = getPartsForModel(brand, model, includeObsolete);
  const q = queryText.trim().toLowerCase();
  if (!q) return baseList;

  return baseList.filter(p => 
    p.partNumber.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (p.comments && p.comments.toLowerCase().includes(q))
  );
}
