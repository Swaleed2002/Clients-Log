import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  PartTransaction, 
  PartStatus 
} from '../types';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Search, 
  Building2, 
  Cpu, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

interface TestingBackupTrackerProps {
  currentUser: UserProfile;
}

export const TestingBackupTracker: React.FC<TestingBackupTrackerProps> = ({ currentUser }) => {
  const isStoreOrAdmin = currentUser.role === 'STORE' || currentUser.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'ALL' | 'TESTING' | 'BACKUP'>('ALL');
  const [transactions, setTransactions] = useState<PartTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to transactions where purpose is Testing or Backup, or status is TESTING or BACKUP
  useEffect(() => {
    const q = query(
      collection(db, 'partTransactions'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: PartTransaction[] = [];
      snap.forEach(d => {
        const tx = { id: d.id, ...d.data() } as PartTransaction;
        if (
          tx.purpose === 'Testing' || 
          tx.purpose === 'Backup' || 
          tx.status === 'TESTING' || 
          tx.status === 'BACKUP'
        ) {
          list.push(tx);
        }
      });
      setTransactions(list);
    }, (err) => {
      console.error("Failed to load testing/backup items:", err);
    });

    return () => unsub();
  }, []);

  // Action: Mark as permanently installed (customer bought or approved)
  const handleMarkInstalled = async (tx: PartTransaction) => {
    if (!window.confirm(`Mark ${tx.partNumber} as PERMANENTLY INSTALLED in customer machine?`)) return;

    const updated: PartTransaction = {
      ...tx,
      status: 'INSTALLED',
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'partTransactions', tx.id), updated);
      await offlineDb.partTransactions.put(updated);
      alert("Status updated to INSTALLED.");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  // Action: Retrieve back into engineer bag
  const handleRetrieveToBag = async (tx: PartTransaction) => {
    if (!window.confirm(`Retrieve ${tx.partNumber} back to Engineer Bag (${currentUser.fullName})?`)) return;

    const updatedTx: PartTransaction = {
      ...tx,
      status: 'WITH ENGINEER',
      destinationType: 'ENGINEER',
      destinationDetails: `Retrieved to Engineer Bag: ${currentUser.fullName}`,
      remarks: (tx.remarks ? tx.remarks + ' | ' : '') + `Retrieved from testing at ${tx.customerName || 'customer'} on ${new Date().toLocaleDateString()}`,
      updatedAt: Date.now()
    };

    // Credit bag
    const bagDocId = `${currentUser.userId}_${tx.partNumber}_${tx.condition}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const existingBag = await offlineDb.engineerBags.get(bagDocId);
    const updatedBag = {
      id: bagDocId,
      engineerId: currentUser.userId,
      engineerName: currentUser.fullName,
      partId: tx.partNumber,
      partNumber: tx.partNumber,
      description: tx.description,
      brand: tx.brand,
      quantity: (existingBag ? existingBag.quantity : 0) + tx.quantity,
      condition: tx.condition,
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'partTransactions', tx.id), updatedTx);
      await setDoc(doc(db, 'engineerBags', bagDocId), updatedBag);
      await offlineDb.partTransactions.put(updatedTx);
      await offlineDb.engineerBags.put(updatedBag);
      alert(`Part ${tx.partNumber} returned to your bag.`);
    } catch (err) {
      console.error("Error returning to bag:", err);
      alert("Failed to return part to bag.");
    }
  };

  // Filtered items
  const filteredList = transactions.filter(tx => {
    if (activeTab === 'TESTING' && tx.purpose !== 'Testing' && tx.status !== 'TESTING') return false;
    if (activeTab === 'BACKUP' && tx.purpose !== 'Backup' && tx.status !== 'BACKUP') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.partNumber.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      (tx.engineerName && tx.engineerName.toLowerCase().includes(q)) ||
      (tx.machineModel && tx.machineModel.toLowerCase().includes(q))
    );
  });

  const activeCount = transactions.filter(t => t.status === 'TESTING' || t.status === 'BACKUP').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1" /> ON-SITE PARTS TRACKER
            </span>
            <span className="text-xs text-gray-500 font-medium">Customer Sites & Workshop</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            Testing & Backup Parts Tracker
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor spare parts currently loaned to customers for trial testing, fault isolation, or standby backup.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <div className="text-center px-4">
            <p className="text-xl font-black text-amber-600">{activeCount}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Active on Site</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-2">
          {(['ALL', 'TESTING', 'BACKUP'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'ALL' ? 'ALL TRACKED' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search customer, part #, machine..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table of Tracked Parts */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No parts currently out on testing or backup</p>
            <p className="text-xs text-gray-400 mt-1">
              When an engineer issues a part for Testing or Backup in a Service Report or Store Issue, it appears here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Part & Description</th>
                  <th className="py-3.5 px-4">Purpose / Status</th>
                  <th className="py-3.5 px-4">Customer & Machine</th>
                  <th className="py-3.5 px-4">Engineer</th>
                  <th className="py-3.5 px-4">Installed Date</th>
                  <th className="py-3.5 px-4 text-right">Action / Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map(tx => {
                  const isActive = tx.status === 'TESTING' || tx.status === 'BACKUP';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-gray-900">{tx.partNumber}</div>
                        <div className="font-bold text-gray-700">{tx.description}</div>
                        <div className="text-[10px] text-gray-500">Qty: {tx.quantity} • Condition: {tx.condition}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          tx.status === 'TESTING' 
                            ? 'bg-purple-100 text-purple-800' 
                            : tx.status === 'BACKUP'
                            ? 'bg-amber-100 text-amber-800'
                            : tx.status === 'INSTALLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tx.status}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">Purpose: {tx.purpose}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex items-center">
                          <Building2 className="w-3 h-3 mr-1 text-gray-400" />
                          {tx.customerName || 'Customer Not Specified'}
                        </div>
                        {tx.machineModel && (
                          <div className="text-[10px] text-gray-500 flex items-center mt-0.5">
                            <Cpu className="w-3 h-3 mr-1 text-gray-400" />
                            {tx.brand} {tx.machineModel} {tx.machineSerial && `(S/N: ${tx.machineSerial})`}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {tx.engineerName}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {isActive ? (
                          <>
                            <button
                              onClick={() => handleMarkInstalled(tx)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded"
                              title="Mark as permanently purchased and installed"
                            >
                              Installed
                            </button>
                            <button
                              onClick={() => handleRetrieveToBag(tx)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded"
                              title="Take part back into engineer bag"
                            >
                              Take Back
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400">
                            Closed ({tx.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
