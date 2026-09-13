import Dexie, { Table } from 'dexie';
import { 
  WorkEntry, 
  ServiceReport, 
  StoreInventoryItem, 
  EngineerBagItem, 
  PartTransaction, 
  Client, 
  CustomerMachine 
} from '../types';

export interface PendingSyncItem {
  id?: number;
  collection: 'entries' | 'serviceReports' | 'storeInventory' | 'engineerBags' | 'partTransactions' | 'clients' | 'customerMachines';
  operation: 'create' | 'update' | 'delete';
  docId: string;
  data?: any;
  timestamp: number;
}

export class AppOfflineDatabase extends Dexie {
  workEntries!: Table<WorkEntry, string>;
  serviceReports!: Table<ServiceReport, string>;
  storeInventory!: Table<StoreInventoryItem, string>;
  engineerBags!: Table<EngineerBagItem, string>;
  partTransactions!: Table<PartTransaction, string>;
  clients!: Table<Client, string>;
  customerMachines!: Table<CustomerMachine, string>;
  pendingSyncQueue!: Table<PendingSyncItem, number>;

  constructor() {
    super('ClientsLogDatabase');
    this.version(1).stores({
      workEntries: 'id, userId, date, workType, customerName, syncStatus, createdAt',
      serviceReports: 'id, reportNo, userId, customer, modelNumber, syncStatus, createdAt',
      storeInventory: 'id, partId, partNumber, brand, condition, location',
      engineerBags: 'id, engineerId, partId, partNumber, brand, condition',
      partTransactions: 'id, partId, engineerId, customerId, status, purpose, createdAt',
      clients: 'id, name',
      customerMachines: 'id, customerId, brand, model, serialNumber',
      pendingSyncQueue: '++id, collection, operation, docId, timestamp'
    });
  }
}

export const offlineDb = new AppOfflineDatabase();
