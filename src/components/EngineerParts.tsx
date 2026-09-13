import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  EngineerBagItem, 
  PartTransaction, 
  PartCondition, 
  PartPurpose,
  PartMasterItem
} from '../types';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { 
  Briefcase, 
  RotateCcw, 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

interface EngineerPartsProps {
  currentUser: UserProfile;
  onOpenServiceReport?: (part: EngineerBagItem) => void;
  onOpenCatalog?: () => void;
}

export const EngineerParts: React.FC<EngineerPartsProps> = ({ 
  currentUser,
  onOpenServiceReport,
  onOpenCatalog
}) => {
  const isStoreOrAdmin = currentUser.role === 'STORE' || currentUser.role === 'ADMIN';

  const [bagItems, setBagItems] = useState<EngineerBagItem[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>(currentUser.userId);
  const [engineers, setEngineers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Return Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningItem, setReturningItem] = useState<EngineerBagItem | null>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>('Unused / Surplus');
  const [returnRemarks, setReturnRemarks] = useState<string>('');

  // 1. Fetch Engineers for filter (if Admin/Store)
  useEffect(() => {
    if (isStoreOrAdmin) {
      getDocs(collection(db, 'users')).then(snap => {
        const list: UserProfile[] = [];
        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.role === 'ENGINEER' || u.role === 'ADMIN') {
            list.push({ uid: d.id, ...u });
          }
        });
        setEngineers(list);
      });
    }
  }, [isStoreOrAdmin]);

  // 2. Subscribe to Engineer Bags
  useEffect(() => {
    const q = isStoreOrAdmin && selectedEngineerId === 'ALL'
      ? collection(db, 'engineerBags')
      : query(collection(db, 'engineerBags'), where('engineerId', '==', selectedEngineerId));

    const unsub = onSnapshot(q, (snap) => {
      const items: EngineerBagItem[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as EngineerBagItem));
      setBagItems(items);
      offlineDb.engineerBags.bulkPut(items).catch(() => {});
    }, (err) => {
      console.error("Engineer bags snapshot error, loading from local DB:", err);
      offlineDb.engineerBags.where('engineerId').equals(selectedEngineerId).toArray().then(setBagItems);
    });

    return () => unsub();
  }, [selectedEngineerId, isStoreOrAdmin]);

  // Initiate Return to Store
  const handleInitiateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningItem || returnQty <= 0) return;

    const txId = doc(collection(db, 'partTransactions')).id;
    const returnTx: PartTransaction = {
      id: txId,
      partId: returningItem.partId,
      partNumber: returningItem.partNumber,
      description: returningItem.description,
      brand: returningItem.brand,
      sourceType: 'MY BAG',
      sourceDetails: `Engineer Bag: ${currentUser.fullName}`,
      destinationType: 'STORE',
      destinationDetails: 'Store Room',
      engineerId: returningItem.engineerId,
      engineerName: returningItem.engineerName,
      quantity: Number(returnQty),
      condition: returningItem.condition,
      purpose: 'Other',
      status: 'WITH ENGINEER', // will become RETURNED once Store receives it
      returnInitiatedAt: Date.now(),
      returnReason: returnReason,
      returnRemarks: returnRemarks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser.fullName
    };

    try {
      await setDoc(doc(db, 'partTransactions', txId), returnTx);
      await offlineDb.partTransactions.put(returnTx);
      
      setShowReturnModal(false);
      setReturningItem(null);
      setReturnRemarks('');
      alert(`Return initiated for ${returnQty}x ${returningItem.partNumber}. The store room has been notified to receive it.`);
    } catch (err) {
      console.error("Failed to initiate return:", err);
      alert("Error initiating part return.");
    }
  };

  const filteredItems = bagItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.partNumber.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.condition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-1" /> ENGINEER BAG STOCK
            </span>
            <span className="text-xs text-gray-500 font-medium">Van / Toolkit Inventory</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            {isStoreOrAdmin && selectedEngineerId !== currentUser.userId 
              ? `Engineer Stock: ${selectedEngineerId}` 
              : 'My Bag & Van Stock'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Spare parts in your possession. Install them directly in Service Reports or initiate a return to the store room.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2">
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="flex items-center px-4 py-2.5 bg-[#E61C24] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              BROWSE CATALOG & REQUEST
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search parts in bag..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E61C24] focus:bg-white"
          />
        </div>

        {/* Engineer selector for Admin & Store */}
        {isStoreOrAdmin && engineers.length > 0 && (
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-gray-500 uppercase">Engineer:</span>
            <select
              value={selectedEngineerId}
              onChange={e => setSelectedEngineerId(e.target.value)}
              className="p-2 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={currentUser.userId}>My Bag ({currentUser.userId})</option>
              <option value="ALL">All Engineers</option>
              {engineers.filter(e => e.userId !== currentUser.userId).map(eng => (
                <option key={eng.userId} value={eng.userId}>
                  {eng.fullName} ({eng.userId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bag Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
            Parts Currently in Bag ({filteredItems.length})
          </h3>
          <span className="text-xs text-gray-500">Live Bag Count</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No parts currently in bag</p>
            <p className="text-xs text-gray-400 mt-1">
              Request parts from the Store Room or browse the Parts Catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Part Number</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4 text-center">Quantity</th>
                  {isStoreOrAdmin && selectedEngineerId === 'ALL' && (
                    <th className="py-3.5 px-4">Engineer</th>
                  )}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-gray-900">
                      {item.partNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 font-bold rounded text-[10px]">
                        {item.brand}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.condition === 'New' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : item.condition === 'Refurbished'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full font-black text-xs bg-blue-100 text-blue-800">
                        {item.quantity}
                      </span>
                    </td>
                    {isStoreOrAdmin && selectedEngineerId === 'ALL' && (
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {item.engineerName}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {onOpenServiceReport && (
                        <button
                          onClick={() => onOpenServiceReport(item)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#E61C24] font-bold rounded"
                        >
                          Use in Report
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReturningItem(item);
                          setReturnQty(item.quantity);
                          setShowReturnModal(true);
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded"
                      >
                        Return to Store
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: RETURN PART TO STORE */}
      {showReturnModal && returningItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center">
                <RotateCcw className="w-5 h-5 mr-2 text-red-600" />
                Return Part to Store Room
              </h2>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateReturn} className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="font-mono font-black text-sm text-gray-900">{returningItem.partNumber}</p>
                <p className="font-bold text-gray-700">{returningItem.description}</p>
                <p className="text-gray-500 mt-1">Condition: {returningItem.condition} • In Bag: {returningItem.quantity}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Quantity to Return</label>
                <input
                  type="number"
                  min="1"
                  max={returningItem.quantity}
                  value={returnQty}
                  onChange={e => setReturnQty(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                >
                  <option value="Unused / Surplus">Unused / Surplus Stock</option>
                  <option value="Testing Complete - Part OK">Testing Complete - Part OK</option>
                  <option value="Defective / Faulty Part">Defective / Faulty Part</option>
                  <option value="Wrong Part Issued">Wrong Part Issued</option>
                  <option value="Customer Declined Repair">Customer Declined Repair</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Remarks</label>
                <textarea
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  placeholder="Notes about reason or condition..."
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Confirm Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
