import { PrinterBrand, PartCondition } from '../types';

/**
 * Realistic Demo Inventory Items using ONLY verified parts from PARTS_MASTER.
 * Quantities are intentionally varied and randomized (NOT identical 10 or 19).
 */
export interface DemoInventoryRecord {
  'Part Number': string;
  'Part Description': string;
  'Brand': PrinterBrand;
  'Printer Model': string;
  'Condition': PartCondition;
  'Quantity': number;
  'Location': string;
  'Min Stock': number;
  'Notes'?: string;
}

export const REALISTIC_DEMO_INVENTORY: DemoInventoryRecord[] = [
  {
    'Part Number': 'FA11065',
    'Part Description': '89 SOLVENT PRIMING UNIT AND VALVE',
    'Brand': 'LINX',
    'Printer Model': '8920',
    'Condition': 'New',
    'Quantity': 7,
    'Location': 'Shelf A1',
    'Min Stock': 2,
    'Notes': 'Linx 8810+ common parts stock'
  },
  {
    'Part Number': 'FA11084',
    'Part Description': 'TRANSFER PUMP',
    'Brand': 'LINX',
    'Printer Model': '8910',
    'Condition': 'New',
    'Quantity': 14,
    'Location': 'Shelf A2',
    'Min Stock': 3,
    'Notes': 'Critical pump assembly'
  },
  {
    'Part Number': 'FA11088',
    'Part Description': 'PRESSURE TRANSDUCER ASSEMBLY',
    'Brand': 'LINX',
    'Printer Model': '8920',
    'Condition': 'New',
    'Quantity': 3,
    'Location': 'Shelf A3',
    'Min Stock': 1,
    'Notes': 'High accuracy transducer'
  },
  {
    'Part Number': 'FA10020',
    'Part Description': 'MAIN POWER SUPPLY UNIT (PSU) 24V',
    'Brand': 'LINX',
    'Printer Model': '8810',
    'Condition': 'New',
    'Quantity': 18,
    'Location': 'Shelf B1',
    'Min Stock': 4,
    'Notes': 'Power electronics'
  },
  {
    'Part Number': 'FA10034',
    'Part Description': 'CPU MOTHERBOARD ASSEMBLY',
    'Brand': 'LINX',
    'Printer Model': '8920',
    'Condition': 'Refurbished',
    'Quantity': 6,
    'Location': 'Shelf B2',
    'Min Stock': 2,
    'Notes': 'Tested refurbished control board'
  },
  {
    'Part Number': 'FA15401',
    'Part Description': 'SPECTRUM WHITE INK SYSTEM MANIFOLD',
    'Brand': 'LINX',
    'Printer Model': '8940 Spectrum',
    'Condition': 'New',
    'Quantity': 5,
    'Location': 'Special Bin S1',
    'Min Stock': 1,
    'Notes': 'Exclusive 8940 Spectrum pigmented unit'
  },
  {
    'Part Number': 'FA15403',
    'Part Description': 'SPECTRUM INK STIRRER MOTOR',
    'Brand': 'LINX',
    'Printer Model': '8940 Spectrum',
    'Condition': 'New',
    'Quantity': 11,
    'Location': 'Special Bin S2',
    'Min Stock': 2,
    'Notes': 'Spectrum anti-settling motor'
  },
  {
    'Part Number': '300.007.052',
    'Part Description': 'UBSLINK VI-A Display Board',
    'Brand': 'UBS',
    'Printer Model': 'MRX 10',
    'Condition': 'New',
    'Quantity': 27,
    'Location': 'Shelf C1',
    'Min Stock': 5,
    'Notes': 'UBS high res touchscreen display'
  },
  {
    'Part Number': '300.007.051',
    'Part Description': 'UBSLINK VI-A Control Board',
    'Brand': 'UBS',
    'Printer Model': 'MRX 10',
    'Condition': 'New',
    'Quantity': 9,
    'Location': 'Shelf C2',
    'Min Stock': 2,
    'Notes': 'UBS main system processor'
  },
  {
    'Part Number': 'RY-TIJ-C10',
    'Part Description': 'RYNAN TIJ 0.5" Single Cartridge Printhead Rig',
    'Brand': 'RYNAN',
    'Printer Model': 'B1040',
    'Condition': 'New',
    'Quantity': 38,
    'Location': 'Shelf D1',
    'Min Stock': 8,
    'Notes': 'Standard TIJ 2.5 HP cartridge slot'
  },
  {
    'Part Number': 'RY-TIJ-C20',
    'Part Description': 'RYNAN TIJ 1.0" Dual-Head High Resolution Rig',
    'Brand': 'RYNAN',
    'Printer Model': 'R20',
    'Condition': 'New',
    'Quantity': 12,
    'Location': 'Shelf D2',
    'Min Stock': 3,
    'Notes': 'Dual head stitch module'
  },
  {
    'Part Number': 'RY-PCB-01',
    'Part Description': 'RYNAN Smart Controller Interface Board',
    'Brand': 'RYNAN',
    'Printer Model': 'B1040',
    'Condition': 'Refurbished',
    'Quantity': 4,
    'Location': 'Shelf D3',
    'Min Stock': 2,
    'Notes': 'TIJ Controller board'
  },
  {
    'Part Number': 'RY-SEN-01',
    'Part Description': 'RYNAN High Speed Fiber Optic Product Sensor',
    'Brand': 'RYNAN',
    'Printer Model': 'TIJ 2.5',
    'Condition': 'New',
    'Quantity': 45,
    'Location': 'Shelf D4',
    'Min Stock': 10,
    'Notes': 'Optical photo sensor with mounting'
  },
  {
    'Part Number': 'FA75038',
    'Part Description': 'BOOT PROM SET',
    'Brand': 'LINX',
    'Printer Model': '7900',
    'Condition': 'Used',
    'Quantity': 2,
    'Location': 'Obsolete Bin Z',
    'Min Stock': 0,
    'Notes': 'Legacy stock'
  }
];

/**
 * Realistic Demo Clients.
 * Each client has a DIFFERENT number of machines:
 * - Delta Foods: 5 machines
 * - Saudi Beverage Factory: 4 machines
 * - Al Rawabi Dairy: 3 machines
 * - Emirates Mineral Water: 3 machines
 * - Gulf Packaging: 2 machines
 * - Al Ain Farms: 2 machines
 * - National Food Industries: 1 machine
 */
export interface DemoClientRecord {
  'Client Name': string;
  'Address': string;
  'Tel/Fax': string;
  'Email': string;
  'Contact Person': string;
}

export const REALISTIC_DEMO_CLIENTS: DemoClientRecord[] = [
  {
    'Client Name': 'Delta Foods Industries LLC',
    'Address': 'Industrial Area 4, Sharjah, UAE',
    'Tel/Fax': '+971 6 5348899',
    'Email': 'maintenance@deltafoods.ae',
    'Contact Person': 'Eng. Tariq Mansoor (Plant Manager)'
  },
  {
    'Client Name': 'Saudi Beverage Factory',
    'Address': '2nd Industrial City, Riyadh, Saudi Arabia',
    'Tel/Fax': '+966 11 4981122',
    'Email': 'ops@saudibev.com.sa',
    'Contact Person': 'Eng. Khalid Al-Otaibi (Operations Head)'
  },
  {
    'Client Name': 'Al Rawabi Dairy Co.',
    'Address': 'Al Khawaneej Area, Dubai, UAE',
    'Tel/Fax': '+971 4 2891234',
    'Email': 'packaging@alrawabi.ae',
    'Contact Person': 'Eng. Rashid Farooq (Packaging Lead)'
  },
  {
    'Client Name': 'Emirates Mineral Water Co',
    'Address': 'Jeebel Ali Free Zone, Dubai, UAE',
    'Tel/Fax': '+971 4 8816700',
    'Email': 'service@emirateswater.com',
    'Contact Person': 'Mr. Sunil Varma (Maintenance Supervisor)'
  },
  {
    'Client Name': 'Gulf Packaging & Bottling Corp',
    'Address': 'Shuaiba Industrial Area, Kuwait',
    'Tel/Fax': '+965 23261900',
    'Email': 'technical@gulfpack.kw',
    'Contact Person': 'Eng. Ahmed Zaki (Production Director)'
  },
  {
    'Client Name': 'Al Ain Farms',
    'Address': 'Sanaiya Industrial Zone, Al Ain, UAE',
    'Tel/Fax': '+971 3 7212233',
    'Email': 'lines@alainfarms.ae',
    'Contact Person': 'Eng. Yousef Nader (Line Engineer)'
  },
  {
    'Client Name': 'National Food Industries',
    'Address': 'Industrial Estate 1, Ajman, UAE',
    'Tel/Fax': '+971 6 7435522',
    'Email': 'nfi.service@nationalfood.ae',
    'Contact Person': 'Mr. Hisham Qasim (Store Coordinator)'
  }
];

/**
 * Realistic Demo Machines.
 * Each machine has:
 * - Client (matches realistic clients with varied machine count)
 * - Brand (LINX, UBS, RYNAN)
 * - Model
 * - Machine Serial Number (varied and unique)
 * - Printhead Serial Number (MANDATORY, varied and unique)
 * - Ink (MANDATORY, individual consumable specification)
 * - Solvent (MANDATORY, individual consumable specification)
 * - Location
 * - Status
 */
export interface DemoMachineRecord {
  'Client Name': string;
  'Brand': PrinterBrand;
  'Model': string;
  'Machine Serial Number': string;
  'Printhead Serial Number': string;
  'Ink': string;
  'Solvent': string;
  'Location': string;
  'Status': string;
  'Notes'?: string;
}

export const REALISTIC_DEMO_MACHINES: DemoMachineRecord[] = [
  // --- Delta Foods (5 machines: varied models, brands, consumables) ---
  {
    'Client Name': 'Delta Foods Industries LLC',
    'Brand': 'LINX',
    'Model': '8920',
    'Machine Serial Number': 'LX-8920-4102',
    'Printhead Serial Number': 'PH-8920-0941',
    'Ink': '1240',
    'Solvent': '1505',
    'Location': 'Canning Line 1 - Tomato Paste',
    'Status': 'Active',
    'Notes': 'High speed continuous production'
  },
  {
    'Client Name': 'Delta Foods Industries LLC',
    'Brand': 'LINX',
    'Model': '8910',
    'Machine Serial Number': 'LX-8910-1849',
    'Printhead Serial Number': 'PH-8910-0312',
    'Ink': '1010',
    'Solvent': '1505',
    'Location': 'Tetra Pak Line 2 - Evaporated Milk',
    'Status': 'Active',
    'Notes': 'Regular service interval 6000 hrs'
  },
  {
    'Client Name': 'Delta Foods Industries LLC',
    'Brand': 'LINX',
    'Model': '8940 Spectrum',
    'Machine Serial Number': 'SPEC-8940-0092',
    'Printhead Serial Number': 'PH-SPEC-0081',
    'Ink': '3103',
    'Solvent': '3501',
    'Location': 'Line 4 - Dark Glass Jar Labeling',
    'Status': 'Active',
    'Notes': 'High contrast white pigmented ink'
  },
  {
    'Client Name': 'Delta Foods Industries LLC',
    'Brand': 'UBS',
    'Model': 'MRX 10',
    'Machine Serial Number': 'UBS-MRX-9201',
    'Printhead Serial Number': 'PH-MRX-0442',
    'Ink': 'Oil Black 100',
    'Solvent': 'UBS Flush 50',
    'Location': 'Outer Master Carton Packing Area',
    'Status': 'Active',
    'Notes': 'Direct carton barcode print'
  },
  {
    'Client Name': 'Delta Foods Industries LLC',
    'Brand': 'RYNAN',
    'Model': 'B1040',
    'Machine Serial Number': 'RYN-B10-3301',
    'Printhead Serial Number': 'PH-RYN-0108',
    'Ink': 'Solvent Black 45A',
    'Solvent': 'Cleaner Cartridge TIJ',
    'Location': 'Sachet Pouch Packaging Line',
    'Status': 'Active',
    'Notes': 'TIJ fast drying ink'
  },

  // --- Saudi Beverage Factory (4 machines) ---
  {
    'Client Name': 'Saudi Beverage Factory',
    'Brand': 'LINX',
    'Model': '8920',
    'Machine Serial Number': 'LX-8920-7712',
    'Printhead Serial Number': 'PH-8920-1129',
    'Ink': '1240',
    'Solvent': '1512',
    'Location': 'Bottling Line 1 - Carbonated Drink',
    'Status': 'Active',
    'Notes': 'Condensation penetration ink formula'
  },
  {
    'Client Name': 'Saudi Beverage Factory',
    'Brand': 'LINX',
    'Model': '8920',
    'Machine Serial Number': 'LX-8920-7715',
    'Printhead Serial Number': 'PH-8920-1134',
    'Ink': '1240',
    'Solvent': '1512',
    'Location': 'Bottling Line 2 - Juices',
    'Status': 'Active',
    'Notes': 'Line running 2 shifts daily'
  },
  {
    'Client Name': 'Saudi Beverage Factory',
    'Brand': 'LINX',
    'Model': '8820',
    'Machine Serial Number': 'LX-8820-2204',
    'Printhead Serial Number': 'PH-8820-0588',
    'Ink': '1014',
    'Solvent': '1505',
    'Location': 'Can Filling Section Line 3',
    'Status': 'Under Maintenance',
    'Notes': 'Scheduled filter replacement due'
  },
  {
    'Client Name': 'Saudi Beverage Factory',
    'Brand': 'RYNAN',
    'Model': 'B1040',
    'Machine Serial Number': 'RYN-B10-6641',
    'Printhead Serial Number': 'PH-RYN-0892',
    'Ink': 'Aqueous Black HP45',
    'Solvent': 'TIJ Flush Purge',
    'Location': 'Outer Wrap Bundling Section',
    'Status': 'Active',
    'Notes': 'Secondary carton marking'
  },

  // --- Al Rawabi Dairy Co. (3 machines) ---
  {
    'Client Name': 'Al Rawabi Dairy Co.',
    'Brand': 'LINX',
    'Model': '8920',
    'Machine Serial Number': 'LX-8920-3351',
    'Printhead Serial Number': 'PH-8920-0720',
    'Ink': '1059',
    'Solvent': '1505',
    'Location': 'Dairy Line 1 - Fresh Milk Bottles',
    'Status': 'Active',
    'Notes': 'Washdown stainless steel environment'
  },
  {
    'Client Name': 'Al Rawabi Dairy Co.',
    'Brand': 'LINX',
    'Model': '8810',
    'Machine Serial Number': 'LX-8810-9943',
    'Printhead Serial Number': 'PH-8810-2101',
    'Ink': '1240',
    'Solvent': '1505',
    'Location': 'Line 2 - Yoghurt & Laban Tubs',
    'Status': 'Active',
    'Notes': 'Cold room operating environment'
  },
  {
    'Client Name': 'Al Rawabi Dairy Co.',
    'Brand': 'LINX',
    'Model': '7900',
    'Machine Serial Number': 'LX-7900-5021',
    'Printhead Serial Number': 'PH-7900-3490',
    'Ink': '1010',
    'Solvent': '1505',
    'Location': 'Secondary Butter Cup Packing',
    'Status': 'Active',
    'Notes': 'Legacy 7900 line machine'
  },

  // --- Emirates Mineral Water Co (3 machines) ---
  {
    'Client Name': 'Emirates Mineral Water Co',
    'Brand': 'LINX',
    'Model': '8920',
    'Machine Serial Number': 'LX-8920-5509',
    'Printhead Serial Number': 'PH-8920-1432',
    'Ink': '1240',
    'Solvent': '1505',
    'Location': '500ml PET Line 1',
    'Status': 'Active',
    'Notes': 'Rotary blow-molding discharge'
  },
  {
    'Client Name': 'Emirates Mineral Water Co',
    'Brand': 'LINX',
    'Model': '8910',
    'Machine Serial Number': 'LX-8910-6612',
    'Printhead Serial Number': 'PH-8910-1845',
    'Ink': '1240',
    'Solvent': '1505',
    'Location': '1.5L PET Line 2',
    'Status': 'Active',
    'Notes': 'High efficiency clean line'
  },
  {
    'Client Name': 'Emirates Mineral Water Co',
    'Brand': 'UBS',
    'Model': 'MRX 10',
    'Machine Serial Number': 'UBS-MRX-4410',
    'Printhead Serial Number': 'PH-MRX-0901',
    'Ink': 'Oil Black 100',
    'Solvent': 'UBS Flush 50',
    'Location': 'Shrink Wrap Palletizing Line',
    'Status': 'Active',
    'Notes': 'Pallet barcode generation'
  },

  // --- Gulf Packaging & Bottling Corp (2 machines) ---
  {
    'Client Name': 'Gulf Packaging & Bottling Corp',
    'Brand': 'UBS',
    'Model': 'MRX 10',
    'Machine Serial Number': 'UBS-MRX-8104',
    'Printhead Serial Number': 'PH-MRX-1011',
    'Ink': 'Oil Black 100',
    'Solvent': 'UBS Flush 50',
    'Location': 'Corrugated Box Folding Conveyor',
    'Status': 'Active',
    'Notes': 'Variable high-res QR code print'
  },
  {
    'Client Name': 'Gulf Packaging & Bottling Corp',
    'Brand': 'RYNAN',
    'Model': 'R20',
    'Machine Serial Number': 'RYN-R20-5520',
    'Printhead Serial Number': 'PH-RYN-0341',
    'Ink': 'Solvent Black 45A',
    'Solvent': 'Cleaner Cartridge TIJ',
    'Location': 'Flexible Film Reel Rewinder',
    'Status': 'Active',
    'Notes': 'Dual head stitched print'
  },

  // --- Al Ain Farms (2 machines) ---
  {
    'Client Name': 'Al Ain Farms',
    'Brand': 'LINX',
    'Model': '8810',
    'Machine Serial Number': 'LX-8810-6102',
    'Printhead Serial Number': 'PH-8810-0988',
    'Ink': '1240',
    'Solvent': '1505',
    'Location': 'Poultry Egg Carton Printing',
    'Status': 'Active',
    'Notes': 'Special food grade packaging print'
  },
  {
    'Client Name': 'Al Ain Farms',
    'Brand': 'RYNAN',
    'Model': 'TIJ 2.5',
    'Machine Serial Number': 'RYN-TIJ-9921',
    'Printhead Serial Number': 'PH-RYN-0762',
    'Ink': 'Aqueous Red TIJ',
    'Solvent': 'TIJ Flush Purge',
    'Location': 'Egg Tray Conveyor Line B',
    'Status': 'Active',
    'Notes': 'Direct egg shell coding'
  },

  // --- National Food Industries (1 machine) ---
  {
    'Client Name': 'National Food Industries',
    'Brand': 'LINX',
    'Model': '8910',
    'Machine Serial Number': 'LX-8910-9081',
    'Printhead Serial Number': 'PH-8910-2219',
    'Ink': '1014',
    'Solvent': '1505',
    'Location': 'Snack Bag Vertical Form Fill Seal (VFFS)',
    'Status': 'Active',
    'Notes': 'Continuous fast packaging line'
  }
];
