import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { Client, CustomerMachine } from '../types';

export interface CustomerOption {
  id: string;
  name: string;
  address: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  isExisting: true;
}

export function useCustomers() {
  const [clients, setClients] = useState<CustomerOption[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper to merge and deduplicate clients from clients collection & customer machines
  const mergeCustomers = useCallback((clientList: Client[], machineList: CustomerMachine[]): CustomerOption[] => {
    const map = new Map<string, CustomerOption>();

    // 1. Add from clients collection
    clientList.forEach(c => {
      if (c && c.name && c.name.trim()) {
        const key = c.name.trim().toLowerCase();
        map.set(key, {
          id: c.id,
          name: c.name.trim(),
          address: c.address || '',
          contactPerson: c.contactPerson || '',
          contactNumber: c.telFax || '',
          email: c.email || '',
          isExisting: true
        });
      }
    });

    // 2. Add from customerMachines if not present
    machineList.forEach(m => {
      if (m && m.customerName && m.customerName.trim()) {
        const key = m.customerName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: m.customerId || ('client_' + key.replace(/[^a-z0-9]/g, '_')),
            name: m.customerName.trim(),
            address: m.location || '',
            contactPerson: '',
            contactNumber: '',
            email: '',
            isExisting: true
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // 1. Initial immediate load from local IndexedDB
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      offlineDb.clients.toArray().catch(() => [] as Client[]),
      offlineDb.customerMachines.toArray().catch(() => [] as CustomerMachine[])
    ]).then(([localClients, localMachines]) => {
      if (!isMounted) return;
      if (localClients.length > 0 || localMachines.length > 0) {
        const merged = mergeCustomers(localClients, localMachines);
        setClients(merged);
        setIsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mergeCustomers]);

  // 2. Real-time Firestore sync with offline fallback
  useEffect(() => {
    let cachedMachines: CustomerMachine[] = [];

    // Also get machines to ensure any machine-registered customer is present
    const unsubMachines = onSnapshot(collection(db, 'customerMachines'), (mSnap) => {
      cachedMachines = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerMachine));
    }, () => {
      offlineDb.customerMachines.toArray().then(m => { cachedMachines = m; });
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Client);
      });

      if (list.length > 0) {
        offlineDb.clients.bulkPut(list).catch(() => {});
      }

      const merged = mergeCustomers(list, cachedMachines);
      setClients(merged);
      setIsLoaded(true);
    }, (err) => {
      console.warn('Clients onSnapshot listener error (falling back to IndexedDB):', err);
      Promise.all([
        offlineDb.clients.toArray().catch(() => [] as Client[]),
        offlineDb.customerMachines.toArray().catch(() => [] as CustomerMachine[])
      ]).then(([localClients, localMachines]) => {
        setClients(mergeCustomers(localClients, localMachines));
        setIsLoaded(true);
      });
    });

    return () => {
      unsubMachines();
      unsubClients();
    };
  }, [mergeCustomers]);

  // Search case-insensitively
  const searchCustomers = useCallback((query: string): CustomerOption[] => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return clients.slice(0, 15);
    }
    return clients.filter(c => {
      return (
        c.name.toLowerCase().includes(trimmed) ||
        c.id.toLowerCase().includes(trimmed) ||
        (c.address && c.address.toLowerCase().includes(trimmed)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(trimmed))
      );
    });
  }, [clients]);

  return {
    clients,
    isLoaded,
    searchCustomers
  };
}
