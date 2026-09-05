import { useState, useEffect } from 'react';
import { WorkEntry } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, setDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';

export function useWorkEntries(userId?: string) {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    const q = query(collection(db, 'entries'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries: WorkEntry[] = [];
      snapshot.forEach(docSnap => {
        fetchedEntries.push(docSnap.data() as WorkEntry);
      });
      // Sort by createdAt desc locally
      fetchedEntries.sort((a, b) => b.createdAt - a.createdAt);
      setEntries(fetchedEntries);
      setIsLoaded(true);
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
    });

    return () => unsubscribe();
  }, [userId]);

  const addEntry = async (entry: Omit<WorkEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    const newDocRef = doc(collection(db, 'entries'));
    const newEntry: WorkEntry = {
      ...entry,
      id: newDocRef.id,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'synced'
    };
    // Update local state optimistically
    setEntries(prev => [newEntry, ...prev].sort((a, b) => b.createdAt - a.createdAt));
    try {
      await setDoc(newDocRef, newEntry);
    } catch (err) {
      console.error("Failed to add entry", err);
    }
    return newEntry;
  };

  const updateEntry = async (id: string, updatedEntry: Omit<WorkEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return;
    const existing = entries.find(e => e.id === id);
    if (!existing) return;

    const mergedEntry: WorkEntry = {
      ...existing,
      ...updatedEntry,
      updatedAt: Date.now(),
      syncStatus: 'synced'
    };
    
    // Optimistic
    setEntries(prev => prev.map(e => e.id === id ? mergedEntry : e));
    try {
      await setDoc(doc(db, 'entries', id), mergedEntry);
    } catch (err) {
      console.error("Failed to update entry", err);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!userId) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'entries', id));
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  };

  const backupData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `field_engineer_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const restoreData = async (file: File) => {
    if (!userId) throw new Error("Must be logged in");
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          const parsed = JSON.parse(result) as any[];
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              // Only restore entries matching the schema, and attach current user id
              const restoredEntry: WorkEntry = {
                ...item,
                userId,
                id: item.id || doc(collection(db, 'entries')).id,
                createdAt: item.createdAt || Date.now(),
                updatedAt: Date.now()
              };
              await setDoc(doc(db, 'entries', restoredEntry.id), restoredEntry);
            }
            resolve();
          } else {
            reject(new Error('Invalid backup file format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  };

  const getUniqueCustomers = () => {
    const customers = new Set<string>();
    entries.forEach(e => {
      if ((e.workType === 'Customer' || e.workType === 'Other') && e.customerName) {
        customers.add(e.customerName);
      }
    });
    return Array.from(customers);
  };

  const getUniqueLocations = () => {
    const locations = new Set<string>();
    entries.forEach(e => {
      if ((e.workType === 'Customer' || e.workType === 'Other') && e.location) {
        locations.add(e.location);
      }
    });
    return Array.from(locations);
  };

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    backupData,
    restoreData,
    getUniqueCustomers,
    getUniqueLocations,
    isLoaded
  };
}
