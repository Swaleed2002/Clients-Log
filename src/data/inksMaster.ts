import { InkMasterItem, PrinterBrand } from '../types';

export type { InkMasterItem };

export const INKS_MASTER: InkMasterItem[] = [
  // =========================================================================
  // LINX CIJ INKS & SOLVENTS
  // =========================================================================
  {
    id: 'LINX-1240',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1240',
    name: 'Linx Black Fast-Drying MEK Ink 1240',
    chemistry: 'MEK',
    applicableModels: ['8810', '8820', '8910', '8920', '5900', '7900', '9800', '9900'],
    notes: 'Standard versatile fast drying ink for plastics, metal, glass, coated card.'
  },
  {
    id: 'LINX-1512',
    brand: 'LINX',
    type: 'Solvent',
    productCode: '1512',
    name: 'Linx Solvent 1512 (For Ink 1240)',
    chemistry: 'MEK',
    applicableModels: ['8810', '8820', '8910', '8920', '5900', '7900', '9800', '9900'],
    notes: 'Compatible make-up solvent for 1240 ink.'
  },
  {
    id: 'LINX-1010',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1010',
    name: 'Linx Black High Speed MEK Ink 1010',
    chemistry: 'MEK',
    applicableModels: ['8810', '8820', '8910', '8920', '5900', '7900', '9800', '9900'],
    notes: 'General purpose black ink for high-speed bottling and packaging lines.'
  },
  {
    id: 'LINX-1505',
    brand: 'LINX',
    type: 'Solvent',
    productCode: '1505',
    name: 'Linx Solvent 1505 (For Ink 1010/1014)',
    chemistry: 'MEK',
    applicableModels: ['8810', '8820', '8910', '8920', '5900', '7900', '9800', '9900'],
    notes: 'Compatible make-up solvent for 1010 and 1014.'
  },
  {
    id: 'LINX-1014',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1014',
    name: 'Linx Black MEK-Free Alcohol Resistant Ink 1014',
    chemistry: 'Mixed Solvent',
    applicableModels: ['8810', '8820', '8910', '8920', '5900', '7900'],
    notes: 'High resistance to alcohol wipes and sterilization processes.'
  },
  {
    id: 'LINX-1059',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1059',
    name: 'Linx Black Food Grade Ink 1059',
    chemistry: 'Ethanol',
    applicableModels: ['7900', '8910', '8920'],
    notes: 'Direct-food-contact approved ink for eggs, pharmaceuticals, and confectionery.'
  },
  {
    id: 'LINX-1559',
    brand: 'LINX',
    type: 'Solvent',
    productCode: '1559',
    name: 'Linx Solvent 1559 (For Food Grade 1059)',
    chemistry: 'Ethanol',
    applicableModels: ['7900', '8910', '8920'],
    notes: 'Pure ethanol make-up solvent for food grade ink.'
  },
  {
    id: 'LINX-1058',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1058',
    name: 'Linx Black Wet-Bottle Glass Ink 1058',
    chemistry: 'MEK',
    applicableModels: ['8810', '8820', '8910', '8920', '7900'],
    notes: 'Penetrates condensation on glass bottles during cold-fill processes.'
  },
  {
    id: 'LINX-1088',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1088',
    name: 'Linx Yellow High Contrast Pigmented Ink 1088',
    chemistry: 'Pigmented MEK',
    applicableModels: ['8940 Spectrum'],
    notes: 'Heavy pigmented yellow ink for dark substrates, cables, extrusion and pipes.'
  },
  {
    id: 'LINX-1588',
    brand: 'LINX',
    type: 'Solvent',
    productCode: '1588',
    name: 'Linx Solvent 1588 (For Pigmented 1088)',
    chemistry: 'MEK',
    applicableModels: ['8940 Spectrum'],
    notes: 'High volatility solvent for 8940 Spectrum yellow ink.'
  },
  {
    id: 'LINX-3103',
    brand: 'LINX',
    type: 'Ink',
    productCode: '3103',
    name: 'Linx Opaque White Pigmented Ink 3103',
    chemistry: 'Pigmented',
    applicableModels: ['8940 Spectrum'],
    notes: 'Highest contrast white ink for colored rubber, black plastic and dark glass.'
  },
  {
    id: 'LINX-1316',
    brand: 'LINX',
    type: 'Ink',
    productCode: '1316',
    name: 'Linx Light Blue Pigmented Ink 1316',
    chemistry: 'Pigmented',
    applicableModels: ['8940 Spectrum'],
    notes: 'Used with FA27018/3103 and FA27019/3103 printhead configurations.'
  },
  {
    id: 'LINX-CJ-1010',
    brand: 'LINX',
    type: 'Ink',
    productCode: 'CJ-1010',
    name: 'Linx CJ400 Black Ink Cartridge',
    chemistry: 'MEK',
    applicableModels: ['CJ400'],
    notes: 'Plug and play self-sealing cartridge.'
  },
  {
    id: 'LINX-CJ-1505',
    brand: 'LINX',
    type: 'Solvent',
    productCode: 'CJ-1505',
    name: 'Linx CJ400 Solvent Cartridge',
    chemistry: 'MEK',
    applicableModels: ['CJ400'],
    notes: 'Self-sealing solvent cartridge for CJ400.'
  },
  {
    id: 'LINX-CLEANER-1505',
    brand: 'LINX',
    type: 'Cleaning',
    productCode: 'TC-1505',
    name: 'Linx Printhead Cleaning Fluid 1505 500ml',
    chemistry: 'MEK',
    applicableModels: ['8810', '8820', '8910', '8920', '8940 Spectrum', '5900', '7900', 'CJ400'],
    notes: 'Standard printhead wash bottle.'
  },

  // =========================================================================
  // UBS INKS & FLUIDS
  // =========================================================================
  {
    id: 'UBS-MOF-BK',
    brand: 'UBS',
    type: 'Ink',
    productCode: 'UBS-MOF',
    name: 'UBS Mineral Oil Free (MOF) High Contrast Black Ink',
    chemistry: 'Oil Based',
    applicableModels: ['MRX 10', 'LCX 10'],
    notes: '100% Mineral oil free ink for porous cardboard cases and secondary packaging.'
  },
  {
    id: 'UBS-UV-BK',
    brand: 'UBS',
    type: 'Ink',
    productCode: 'UBS-UV-LED',
    name: 'UBS UV LED Curable Black Ink',
    chemistry: 'UV Curable',
    applicableModels: ['MRX 10', 'LCX 10'],
    notes: 'Instant cure on non-porous plastics, varnished surfaces, and metallized foil.'
  },
  {
    id: 'UBS-CLEANER-01',
    brand: 'UBS',
    type: 'Cleaning',
    productCode: 'UBS-CLN-100',
    name: 'UBS Printhead Flushing & Cleaning Solution 1L',
    chemistry: 'Solvent/Flushing',
    applicableModels: ['MRX 10', 'LCX 10'],
    notes: 'For Seiko 35PL and Xaar 128 printhead maintenance kits.'
  },

  // =========================================================================
  // RYNAN TIJ INK CARTRIDGES
  // =========================================================================
  {
    id: 'RYNAN-SOLU-BK',
    brand: 'RYNAN',
    type: 'Ink',
    productCode: 'SOLU-INX-BK',
    name: 'RYNAN Solu-Inx 01 Black Solvent Cartridge (42ml)',
    chemistry: 'Solvent Based',
    applicableModels: ['B1040', 'R20', 'R10', 'TIJ 2.5'],
    notes: 'Fast drying (2-3s) on aluminum foil, blister packs, plastic film (BOPP, PE).'
  },
  {
    id: 'RYNAN-HYDRA-BK',
    brand: 'RYNAN',
    type: 'Ink',
    productCode: 'HYDRA-INX-BK',
    name: 'RYNAN Hydra-Inx 02 Black Aqueous Cartridge (42ml)',
    chemistry: 'Aqueous',
    applicableModels: ['B1040', 'R20', 'R10', 'TIJ 2.5'],
    notes: 'High optical density on uncoated cartons, paper, timber and corrugated boxes.'
  }
];

export function getInksForModel(brand: PrinterBrand, model: string): InkMasterItem[] {
  const normModel = model.trim();
  return INKS_MASTER.filter(ink => {
    if (ink.brand !== brand) return false;
    return ink.applicableModels.includes(normModel);
  });
}
