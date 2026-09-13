import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { Client, CustomerMachine, StoreInventoryItem, validateMachineData } from '../types';

/**
 * Ensures validation is strictly enforced before saving a CustomerMachine to both local
 * IndexedDB and Firestore.
 */
export async function saveCustomerMachineWithSync(machine: CustomerMachine, isNew = false): Promise<void> {
  const { valid, errors } = validateMachineData(machine, isNew);
  if (!valid) {
    throw new Error(errors.join(', '));
  }

  // 1. Immediately save locally for offline-first reliability
  await offlineDb.customerMachines.put(machine);

  // 2. Synchronize to Firestore
  try {
    if (navigator.onLine) {
      await setDoc(doc(db, 'customerMachines', machine.id), machine, { merge: true });
    } else {
      await enqueueSyncItem('customerMachines', isNew ? 'create' : 'update', machine.id, machine);
    }
  } catch (err) {
    console.warn('Network sync failed for customerMachine, queuing for offline sync:', err);
    await enqueueSyncItem('customerMachines', isNew ? 'create' : 'update', machine.id, machine);
  }
}

/**
 * Saves or updates a Client with offline-first persistence and online sync.
 */
export async function saveClientWithSync(client: Client, isNew = false): Promise<void> {
  if (!client.name || !client.name.trim()) {
    throw new Error('Client Name is required.');
  }

  // 1. Save locally
  await offlineDb.clients.put(client);

  // 2. Synchronize to Firestore
  try {
    if (navigator.onLine) {
      await setDoc(doc(db, 'clients', client.id), client, { merge: true });
    } else {
      await enqueueSyncItem('clients', isNew ? 'create' : 'update', client.id, client);
    }
  } catch (err) {
    console.warn('Network sync failed for client, queuing for offline sync:', err);
    await enqueueSyncItem('clients', isNew ? 'create' : 'update', client.id, client);
  }
}

/**
 * Saves Store Inventory item with offline-first persistence.
 */
export async function saveInventoryItemWithSync(item: StoreInventoryItem, isNew = false): Promise<void> {
  if (!item.partNumber || !item.partNumber.trim()) {
    throw new Error('Part Number is required.');
  }

  await offlineDb.storeInventory.put(item);

  try {
    if (navigator.onLine) {
      await setDoc(doc(db, 'inventory', item.id), item, { merge: true });
    } else {
      await enqueueSyncItem('storeInventory', isNew ? 'create' : 'update', item.id, item);
    }
  } catch (err) {
    console.warn('Network sync failed for inventory, queuing for offline sync:', err);
    await enqueueSyncItem('storeInventory', isNew ? 'create' : 'update', item.id, item);
  }
}

async function enqueueSyncItem(
  collection: 'customerMachines' | 'clients' | 'storeInventory',
  operation: 'create' | 'update' | 'delete',
  docId: string,
  data: any
) {
  try {
    await offlineDb.pendingSyncQueue.add({
      collection: collection as any,
      operation,
      docId,
      data,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('Failed to enqueue sync item:', e);
  }
}

/**
 * Replays any pending sync items when connectivity is restored.
 */
export async function syncPendingQueue(): Promise<number> {
  if (!navigator.onLine) return 0;

  let syncedCount = 0;
  try {
    const pendingItems = await offlineDb.pendingSyncQueue.toArray();
    for (const item of pendingItems) {
      try {
        const targetCollection = item.collection === 'storeInventory' ? 'inventory' : item.collection;
        if (item.operation === 'delete') {
          await deleteDoc(doc(db, targetCollection, item.docId));
        } else {
          await setDoc(doc(db, targetCollection, item.docId), item.data, { merge: true });
        }
        if (item.id) {
          await offlineDb.pendingSyncQueue.delete(item.id);
        }
        syncedCount++;
      } catch (e) {
        console.warn('Failed to sync item:', item.docId, e);
      }
    }
  } catch (err) {
    console.error('Error running pending sync queue:', err);
  }
  return syncedCount;
}

// Automatically sync when back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network back online. Synchronizing offline queue...');
    syncPendingQueue();
  });
}
