export type WorkType = 'Customer' | 'Workshop' | 'Office' | 'Delivery' | 'Other';
export type UserRole = 'ADMIN' | 'STORE' | 'ENGINEER';
export type UserStatus = 'Active' | 'Disabled';

export interface UserProfile {
  uid?: string; // Firebase Auth UID (Document ID)
  userId: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  email?: string;
  phone?: string;
  createdAt?: number;
}

export interface TimeDuration {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export interface WorkEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  workType: WorkType;
  machineId?: string;
  machineSerial?: string;
  machineModel?: string;
  complaint?: string;
  technicianName?: string;
  partsUsed?: ServiceReportPartUsed[];
  workOrderImage?: string;
  deliveryType?: 'Delivery of Consumables' | 'Delivery of Parts';
  customerName: string;
  location: string;
  
  travelStart: string; // HH:mm
  travelStop: string;
  
  jobStart: string;
  jobStop: string;
  
  jobCategory: string;
  remarks: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'synced' | 'pending';
}

export type ViewState = 
  | 'login' 
  | 'dashboard' 
  | 'form' 
  | 'report' 
  | 'admin' 
  | 'serviceReportsList' 
  | 'serviceReportForm'
  | 'partsSearch'
  | 'partsCatalog'
  | 'storeInventory'
  | 'engineerParts'
  | 'testingBackup'
  | 'clientMachines';

export type PrinterBrand = 'LINX' | 'UBS' | 'RYNAN';

export type LinxModel = 
  | 'CJ400' 
  | '5900' 
  | '7900' 
  | '8810' 
  | '8820' 
  | '8840' 
  | '8910' 
  | '8920' 
  | '8940 Spectrum' 
  | '9800' 
  | '9900';

export type UbsModel = 'MRX 10' | 'LCX 10';
export type RynanModel = 'B1040' | 'R20' | 'R10' | 'TIJ 2.5';

export type PrinterModel = LinxModel | UbsModel | RynanModel;

export type PartModelGroup = 
  | 'LINX_8810_PLUS_COMMON' 
  | 'LINX_8940_SPECTRUM' 
  | 'LINX_5900' 
  | 'LINX_7900' 
  | 'LINX_5900_7900_SHARED' 
  | 'LINX_CJ400' 
  | 'UBS_LCX' 
  | 'UBS_MRX' 
  | 'RYNAN_TIJ'
  | 'UNIVERSAL_ACCESSORY';

export type PartCategory = 
  | 'Ink System'
  | 'Solvent System'
  | 'Filter'
  | 'Pump'
  | 'Valve'
  | 'Manifold'
  | 'Venturi'
  | 'Printhead'
  | 'Nozzle'
  | 'Electronics'
  | 'PCB'
  | 'Cable'
  | 'Sensor'
  | 'Power Supply'
  | 'Mechanical'
  | 'Cabinet'
  | 'Maintenance Kit'
  | 'Service Kit'
  | 'Tool'
  | 'Consumable'
  | 'Accessory'
  | 'Other';

export interface PartMasterItem {
  id: string;
  partNumber: string;
  description: string;
  brand: PrinterBrand;
  modelGroup: PartModelGroup;
  applicableModels: string[]; // e.g. ['8810', '8820', '8910', '8920', '9800', '9900']
  category: PartCategory;
  quantityRef?: number;
  comments?: string;
  sourceDoc: string;
  sourcePage: number | string;
  status: 'ACTIVE' | 'OBSOLETE';
  replacementPartNumber?: string;
}

export interface InkMasterItem {
  id: string;
  brand: PrinterBrand;
  type: 'Ink' | 'Solvent' | 'Cleaning';
  productCode: string;
  name: string;
  chemistry?: string; // MEK, Pigmented, Aqueous, UV, Oil Based, Ethanol
  applicableModels: string[];
  notes?: string;
}

export type PartCondition = 'New' | 'Used' | 'Refurbished';

export type PartPurpose = 
  | 'Customer Replacement' 
  | 'Testing' 
  | 'Backup' 
  | 'Engineer Bag Stock' 
  | 'Workshop/Other' 
  | 'Other';

export type PrimaryPartStatus = 
  | 'WITH ENGINEER' 
  | 'INSTALLED' 
  | 'TESTING' 
  | 'BACKUP' 
  | 'RETURNED';

export type PartStatus = PrimaryPartStatus;

export type PartSourceType = 
  | 'STORE' 
  | 'MY BAG' 
  | 'WORKSHOP MACHINE' 
  | 'OTHER';

export type PartSource = PartSourceType;

export type PartAction = 'Installed' | 'Left for Testing' | 'Left as Backup';

export interface StoreInventoryItem {
  id: string;
  partId: string;
  partNumber: string;
  description: string;
  brand: PrinterBrand;
  applicableModels: string[];
  quantity: number;
  condition: PartCondition;
  location: string;
  minStock: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EngineerBagItem {
  id: string;
  engineerId: string;
  engineerName: string;
  partId: string;
  partNumber: string;
  description: string;
  brand: PrinterBrand;
  quantity: number;
  condition: PartCondition;
  updatedAt: number;
}

export interface WorkshopMachineDetails {
  machineType: 'Company Machine' | 'Customer Machine';
  machineName: string;
  printerBrand: PrinterBrand;
  printerModel: string;
  serialNumber?: string;
  customerId?: string;
  customerName?: string;
}

export interface PartTransaction {
  id: string;
  localId?: string;
  partId: string;
  partNumber: string;
  description: string;
  brand: PrinterBrand;
  printerModel?: string;
  
  sourceType: PartSourceType;
  sourceDetails?: string;
  workshopMachine?: WorkshopMachineDetails;

  destinationType: 'ENGINEER' | 'CUSTOMER_MACHINE' | 'STORE' | 'WORKSHOP';
  destinationDetails?: string;

  engineerId: string;
  engineerName: string;
  customerId?: string;
  customerName?: string;
  machineSerial?: string;

  quantity: number;
  condition: PartCondition;
  purpose: PartPurpose;
  status: PrimaryPartStatus;
  
  // Accept/Decline action tracking
  acceptedAt?: number;
  declinedAt?: number;
  declineReason?: string;

  // Return action tracking
  returnInitiatedAt?: number;
  returnReason?: string;
  returnRemarks?: string;
  storeReceivedAt?: number;
  storeReceivedBy?: string;

  // Testing & Backup specific
  testingReason?: string;
  followUpDate?: string;
  backupReason?: string;

  remarks?: string;
  linkedServiceReportId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  syncStatus?: 'synced' | 'pending';
}

export interface ServiceReportPartUsed {
  partId: string;
  partNumber: string;
  description: string;
  brand?: PrinterBrand;
  quantity: number;
  source: PartSourceType;
  sourceDetails?: string;
  condition: PartCondition;
  action?: PartAction;
  status?: 'INSTALL' | 'TESTING' | 'BACKUP' | 'Installed' | 'Left for Testing' | 'Left as Backup';
  workshopDetails?: WorkshopMachineDetails;
  remarks?: string;
  transactionId?: string;
}

export interface ServiceReport {
  linkedEntryId?: string;
  machineId?: string;
  complaint?: string;
  workOrderImage?: string;
  id?: string;
  userId: string;
  reportNo: string;
  date: string;
  customer: string;
  address: string;
  telFax: string;
  email: string;
  machineDetails: string;
  modelNumber: string;
  printerSerial: string;
  printHeadSerial: string;
  inkBatch: string;
  jobTypes: string[];
  invoiceNo: string;
  doNo: string;
  qtnNo: string;
  jobCarriedOut: string;
  partsReplaced: string; // Legacy field for backward compatibility
  partsUsed?: ServiceReportPartUsed[]; // Rich structured parts tracking
  remarks: string;
  customerName: string;
  customerPosition: string;
  customerSignature: string;
  customerDate: string;
  engineerName: string;
  engineerPosition: string;
  engineerSignature: string;
  engineerDate: string;
  createdAt: number;
  updatedAt: number;
  localId?: string;
  syncStatus?: 'synced' | 'pending';
}

export interface Client {
  id: string;
  name: string;
  address: string;
  telFax?: string;
  email?: string;
  contactPerson?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CustomerMachine {
  id: string;
  customerId: string;
  customerName: string;
  brand: PrinterBrand;
  model: string;
  serialNumber: string;
  printHeadSerial?: string; // Required for new machines; legacy may be missing/not recorded
  ink?: string;             // Required for new machines; legacy may be missing/not recorded
  solvent?: string;         // Required for new machines; legacy may be missing/not recorded
  installDate?: string;
  location?: string;
  status?: 'Active' | 'Under Maintenance' | 'Decommissioned';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export function validateMachineData(data: {
  customerName?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  printHeadSerial?: string;
  ink?: string;
  solvent?: string;
}, isNew = true): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.customerName || !data.customerName.trim()) {
    errors.push('Client is required.');
  }
  if (!data.brand || !data.brand.trim()) {
    errors.push('Printer Brand is required.');
  }
  if (!data.model || !data.model.trim()) {
    errors.push('Printer Model is required.');
  }
  if (!data.serialNumber || !data.serialNumber.trim()) {
    errors.push('Machine Serial Number is required.');
  }
  if (isNew || data.printHeadSerial !== undefined) {
    if (!data.printHeadSerial || !data.printHeadSerial.trim()) {
      errors.push('Printhead Serial Number is required.');
    }
  }
  if (isNew || data.ink !== undefined) {
    if (!data.ink || !data.ink.trim()) {
      errors.push('Ink is required.');
    }
  }
  if (isNew || data.solvent !== undefined) {
    if (!data.solvent || !data.solvent.trim()) {
      errors.push('Solvent is required.');
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

