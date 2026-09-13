import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  StoreInventoryItem, 
  PartMasterItem, 
  PartCondition, 
  PartPurpose, 
  PartTransaction, 
  PrinterBrand 
} from '../types';
import { PARTS_MASTER } from '../data/partsMaster';
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
  Warehouse, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  User, 
  Clock, 
  Tag, 
  Layers, 
  X,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { BulkExcelImportModal } from './BulkExcelImportModal';

interface StoreInventoryProps {
  currentUser: UserProfile;
}

export const StoreInventory: React.FC<StoreInventoryProps> = ({ currentUser }) => {
  const isStoreOrAdmin = currentUser.role === 'STORE' || currentUser.role === 'ADMIN';

  const [inventory, setInventory] = useState<StoreInventoryItem[]>([]);
  const [engineers, setEngineers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<PartTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  
  // Modal states
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showIssuePartModal, setShowIssuePartModal] = useState(false);
  const [showReceiveReturnModal, setShowReceiveReturnModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedTxForReturn, setSelectedTxForReturn] = useState<PartTransaction | null>(null);

  // Form states for Add Stock
  const [addPartNumber, setAddPartNumber] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addBrand, setAddBrand] = useState<PrinterBrand>('LINX');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addCondition, setAddCondition] = useState<PartCondition>('New');
  const [addLocation, setAddLocation] = useState('Shelf A1');
  const [addMinStock, setAddMinStock] = useState<number>(2);

  // Form states for Issue to Engineer
  const [issueEngineerId, setIssueEngineerId] = useState('');
  const [issuePartId, setIssuePartId] = useState('');
  const [issueQuantity, setIssueQuantity] = useState<number>(1);
  const [issueCondition, setIssueCondition] = useState<PartCondition>('New');
  const [issuePurpose, setIssuePurpose] = useState<PartPurpose>('Engineer Bag Stock');
  const [issueCustomerName, setIssueCustomerName] = useState('');
  const [issueRemarks, setIssueRemarks] = useState('');

  // 1. Subscribe to Store Inventory
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      const items: StoreInventoryItem[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as StoreInventoryItem));
      setInventory(items);
      // Save locally
      offlineDb.storeInventory.bulkPut(items).catch(() => {});
    }, (err) => {
      console.error("Inventory snapshot error, falling back to local DB:", err);
      offlineDb.storeInventory.toArray().then(setInventory);
    });

    return () => unsub();
  }, []);

  // 2. Fetch Engineers list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const userList: UserProfile[] = [];
        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.status === 'Active' && (u.role === 'ENGINEER' || u.role === 'ADMIN')) {
            userList.push({ uid: d.id, ...u });
          }
        });
        setEngineers(userList);
        if (userList.length > 0 && !issueEngineerId) {
          setIssueEngineerId(userList[0].userId);
        }
      } catch (err) {
        console.error("Failed to load engineers:", err);
      }
    };
    fetchUsers();
  }, []);

  // 3. Subscribe to Part Transactions
  useEffect(() => {
    const q = query(collection(db, 'partTransactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const txs: PartTransaction[] = [];
      snap.forEach(d => txs.push({ id: d.id, ...d.data() } as PartTransaction));
      setTransactions(txs);
      offlineDb.partTransactions.bulkPut(txs).catch(() => {});
    }, (err) => {
      console.error("Transactions snapshot error:", err);
      offlineDb.partTransactions.toArray().then(setTransactions);
    });

    return () => unsub();
  }, []);

  // Auto-populate description when selecting part number for Add Stock
  const handlePartNumberSelect = (partNo: string) => {
    setAddPartNumber(partNo);
    const master = PARTS_MASTER.find(p => p.partNumber === partNo);
    if (master) {
      setAddDescription(master.description);
      setAddBrand(master.brand);
    }
  };

  // Submit Add Stock
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPartNumber.trim()) return;

    const existing = inventory.find(i => i.partNumber === addPartNumber.trim() && i.condition === addCondition);
    const itemId = existing ? existing.id : doc(collection(db, 'inventory')).id;

    const newStockItem: StoreInventoryItem = {
      id: itemId,
      partId: addPartNumber.trim(),
      partNumber: addPartNumber.trim(),
      description: addDescription.trim() || addPartNumber.trim(),
      brand: addBrand,
      applicableModels: [],
      quantity: existing ? existing.quantity + Number(addQuantity) : Number(addQuantity),
      condition: addCondition,
      location: addLocation,
      minStock: Number(addMinStock),
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'inventory', itemId), newStockItem);
      await offlineDb.storeInventory.put(newStockItem);
      setShowAddStockModal(false);
      setAddPartNumber('');
      setAddDescription('');
      setAddQuantity(1);
    } catch (err) {
      console.error("Failed to add inventory stock:", err);
      alert("Error saving inventory item to database.");
    }
  };

  // Submit Issue Part to Engineer
  const handleIssuePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuePartId || !issueEngineerId || issueQuantity <= 0) return;

    const engObj = engineers.find(e => e.userId === issueEngineerId);
    const engName = engObj ? engObj.fullName : issueEngineerId;

    // Find in inventory or parts master
    const invItem = inventory.find(i => i.id === issuePartId || i.partNumber === issuePartId);
    const masterItem = PARTS_MASTER.find(p => p.partNumber === issuePartId);

    const partNum = invItem ? invItem.partNumber : (masterItem ? masterItem.partNumber : issuePartId);
    const partDesc = invItem ? invItem.description : (masterItem ? masterItem.description : partNum);
    const partBrand = invItem ? invItem.brand : (masterItem ? masterItem.brand : 'LINX');

    // 1. Check Store Stock & Deduct if present
    if (invItem) {
      if (invItem.quantity < issueQuantity) {
        if (!window.confirm(`Store only has ${invItem.quantity} units recorded. Issue anyway?`)) {
          return;
        }
      }
      const updatedInv = {
        ...invItem,
        quantity: Math.max(0, invItem.quantity - issueQuantity),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'inventory', invItem.id), updatedInv);
      await offlineDb.storeInventory.put(updatedInv);
    }

    // 2. Create Audit Transaction Record
    const txId = doc(collection(db, 'partTransactions')).id;
    const newTx: PartTransaction = {
      id: txId,
      partId: partNum,
      partNumber: partNum,
      description: partDesc,
      brand: partBrand,
      sourceType: 'STORE',
      sourceDetails: 'Main Store Room',
      destinationType: 'ENGINEER',
      destinationDetails: `Engineer Bag: ${engName}`,
      engineerId: issueEngineerId,
      engineerName: engName,
      customerName: issueCustomerName || undefined,
      quantity: Number(issueQuantity),
      condition: issueCondition,
      purpose: issuePurpose,
      status: 'WITH ENGINEER',
      remarks: issueRemarks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser.fullName
    };

    // 3. Credit Engineer Bag Stock
    const bagDocId = `${issueEngineerId}_${partNum}_${issueCondition}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const existingBagSnap = await offlineDb.engineerBags.get(bagDocId);
    const updatedBagQty = (existingBagSnap ? existingBagSnap.quantity : 0) + Number(issueQuantity);

    const bagItem = {
      id: bagDocId,
      engineerId: issueEngineerId,
      engineerName: engName,
      partId: partNum,
      partNumber: partNum,
      description: partDesc,
      brand: partBrand,
      quantity: updatedBagQty,
      condition: issueCondition,
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'partTransactions', txId), newTx);
      await setDoc(doc(db, 'engineerBags', bagDocId), bagItem);
      await offlineDb.partTransactions.put(newTx);
      await offlineDb.engineerBags.put(bagItem);

      setShowIssuePartModal(false);
      setIssueCustomerName('');
      setIssueRemarks('');
      alert(`Issued ${issueQuantity}x ${partNum} to ${engName}. Added to engineer bag!`);
    } catch (err) {
      console.error("Failed to issue part:", err);
      alert("Error issuing part to engineer.");
    }
  };

  // Receive Return into Store
  const handleConfirmReturn = async () => {
    if (!selectedTxForReturn) return;

    // Update Transaction
    const updatedTx: PartTransaction = {
      ...selectedTxForReturn,
      status: 'RETURNED',
      storeReceivedAt: Date.now(),
      storeReceivedBy: currentUser.fullName,
      updatedAt: Date.now()
    };

    // Add back to Store Inventory
    const existingInv = inventory.find(i => i.partNumber === selectedTxForReturn.partNumber && i.condition === selectedTxForReturn.condition);
    const invId = existingInv ? existingInv.id : doc(collection(db, 'inventory')).id;

    const updatedInv: StoreInventoryItem = {
      id: invId,
      partId: selectedTxForReturn.partNumber,
      partNumber: selectedTxForReturn.partNumber,
      description: selectedTxForReturn.description,
      brand: selectedTxForReturn.brand,
      applicableModels: [],
      quantity: existingInv ? existingInv.quantity + selectedTxForReturn.quantity : selectedTxForReturn.quantity,
      condition: selectedTxForReturn.condition,
      location: existingInv ? existingInv.location : 'Returns Bin R1',
      minStock: existingInv ? existingInv.minStock : 1,
      createdAt: existingInv ? existingInv.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    // Deduct from Engineer Bag
    const bagDocId = `${selectedTxForReturn.engineerId}_${selectedTxForReturn.partNumber}_${selectedTxForReturn.condition}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const existingBag = await offlineDb.engineerBags.get(bagDocId);
    if (existingBag) {
      const newQty = Math.max(0, existingBag.quantity - selectedTxForReturn.quantity);
      if (newQty === 0) {
        await deleteDoc(doc(db, 'engineerBags', bagDocId)).catch(() => {});
        await offlineDb.engineerBags.delete(bagDocId).catch(() => {});
      } else {
        const upBag = { ...existingBag, quantity: newQty, updatedAt: Date.now() };
        await setDoc(doc(db, 'engineerBags', bagDocId), upBag);
        await offlineDb.engineerBags.put(upBag);
      }
    }

    try {
      await setDoc(doc(db, 'partTransactions', selectedTxForReturn.id), updatedTx);
      await setDoc(doc(db, 'inventory', invId), updatedInv);
      await offlineDb.partTransactions.put(updatedTx);
      await offlineDb.storeInventory.put(updatedInv);

      setShowReceiveReturnModal(false);
      setSelectedTxForReturn(null);
      alert(`Return confirmed. ${selectedTxForReturn.quantity}x ${selectedTxForReturn.partNumber} restored to Store inventory.`);
    } catch (err) {
      console.error("Failed to receive return:", err);
      alert("Error confirming return.");
    }
  };

  // Filtered inventory
  const filteredInventory = inventory.filter(item => {
    if (selectedBrand !== 'ALL' && item.brand !== selectedBrand) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.partNumber.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
    );
  });

  // Pending returns
  const pendingReturns = transactions.filter(t => t.returnInitiatedAt && !t.storeReceivedAt);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center">
              <Warehouse className="w-3.5 h-3.5 mr-1" /> STORE ROOM MODULE
            </span>
            <span className="text-xs text-gray-500 font-medium">Real-time Parts Inventory & Issue Log</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            Spare Parts Store & Inventory
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track warehouse quantities, issue spare parts to field engineers, and manage returned items.
          </p>
        </div>

        {/* Action Buttons */}
        {isStoreOrAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddStockModal(true)}
              className="flex items-center px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              ADD / RESTOCK
            </button>
            <button
              onClick={() => setShowIssuePartModal(true)}
              className="flex items-center px-4 py-2.5 bg-[#E61C24] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              ISSUE TO ENGINEER
            </button>
            <button
              onClick={() => setShowExcelImportModal(true)}
              className="flex items-center px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              title="Bulk import Inventory / Stock via Excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              EXCEL IMPORT
            </button>
          </div>
        )}
      </div>

      {/* Pending Returns Alert Banner (if any) */}
      {pendingReturns.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RotateCcw className="w-5 h-5 text-amber-700 animate-spin" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {pendingReturns.length} Pending Return(s) from Field Engineers
              </p>
              <p className="text-xs text-amber-700">
                Engineers have flagged items for return to the store room. Review and accept into inventory.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTxForReturn(pendingReturns[0]);
              setShowReceiveReturnModal(true);
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
          >
            Review Returns
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search part #, description or bin location..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E61C24] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-gray-400 uppercase">Brand:</span>
          {['ALL', 'LINX', 'UBS', 'RYNAN'].map(b => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedBrand === b
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 tracking-wide uppercase">
            Store Room Stock Items ({filteredInventory.length})
          </h3>
          <span className="text-xs text-gray-500 font-medium">Condition & Location Tracked</span>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">No stock items in store yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "ADD / RESTOCK" to record spare parts in the warehouse.</p>
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
                  <th className="py-3.5 px-4 text-center">In Store Qty</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map(item => {
                  const isLowStock = item.quantity <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-gray-900">
                        {item.partNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {item.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 font-bold rounded text-[10px]">
                          {item.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-xs ${
                          isLowStock 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.quantity}
                          {isLowStock && <AlertCircle className="w-3 h-3 ml-1 text-red-500" />}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {item.location}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {isStoreOrAdmin && (
                          <button
                            onClick={() => {
                              setIssuePartId(item.id);
                              setShowIssuePartModal(true);
                            }}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#E61C24] font-bold rounded"
                          >
                            Issue
                          </button>
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

      {/* Recent Movements / Audit Trail */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center">
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          Recent Movement & Issuance Log
        </h3>
        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400">No part movements recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-gray-900">{tx.partNumber}</span>
                    <span className="text-gray-600 font-medium">({tx.quantity}x {tx.condition})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.status === 'WITH ENGINEER' ? 'bg-blue-100 text-blue-800' :
                      tx.status === 'INSTALLED' ? 'bg-emerald-100 text-emerald-800' :
                      tx.status === 'TESTING' ? 'bg-purple-100 text-purple-800' :
                      tx.status === 'BACKUP' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    Issued to <span className="font-bold text-gray-700">{tx.engineerName}</span> for <span className="font-bold">{tx.purpose}</span>
                    {tx.customerName && ` (Customer: ${tx.customerName})`}
                  </p>
                </div>
                <span className="text-gray-400 text-[11px]">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / RESTOCK */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black text-gray-900">Add Stock to Store Room</h2>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Part Number</label>
                <input
                  type="text"
                  value={addPartNumber}
                  onChange={e => handlePartNumberSelect(e.target.value)}
                  placeholder="e.g. FA11065 or 200.007.982"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-mono uppercase text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={addDescription}
                  onChange={e => setAddDescription(e.target.value)}
                  placeholder="e.g. 89 SOLVENT PRIMING UNIT AND VALVE"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Brand</label>
                  <select
                    value={addBrand}
                    onChange={e => setAddBrand(e.target.value as PrinterBrand)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="LINX">LINX</option>
                    <option value="UBS">UBS</option>
                    <option value="RYNAN">RYNAN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Condition</label>
                  <select
                    value={addCondition}
                    onChange={e => setAddCondition(e.target.value as PartCondition)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="New">New (OEM)</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used / Tested</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={e => setAddQuantity(Number(e.target.value))}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Location / Bin</label>
                  <input
                    type="text"
                    value={addLocation}
                    onChange={e => setAddLocation(e.target.value)}
                    placeholder="Shelf A1"
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={addMinStock}
                    onChange={e => setAddMinStock(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-lg"
                >
                  Save to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE TO ENGINEER */}
      {showIssuePartModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black text-gray-900">Issue Spare Part to Field Engineer</h2>
              <button onClick={() => setShowIssuePartModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssuePart} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Select Engineer</label>
                <select
                  value={issueEngineerId}
                  onChange={e => setIssueEngineerId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                >
                  {engineers.map(eng => (
                    <option key={eng.userId} value={eng.userId}>
                      {eng.fullName} ({eng.userId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Select Part from Store</label>
                <select
                  value={issuePartId}
                  onChange={e => setIssuePartId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm font-mono"
                >
                  <option value="">-- Choose Stock Item --</option>
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.partNumber} - {inv.description} (Store Qty: {inv.quantity}, {inv.condition})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={issueQuantity}
                    onChange={e => setIssueQuantity(Number(e.target.value))}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Condition</label>
                  <select
                    value={issueCondition}
                    onChange={e => setIssueCondition(e.target.value as PartCondition)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Issuance Purpose</label>
                <select
                  value={issuePurpose}
                  onChange={e => setIssuePurpose(e.target.value as PartPurpose)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                >
                  <option value="Engineer Bag Stock">Engineer Bag Stock (Van Stock)</option>
                  <option value="Customer Replacement">Customer Site Replacement</option>
                  <option value="Testing">Testing / Fault Diagnosis</option>
                  <option value="Backup">Backup Unit for Customer Site</option>
                  <option value="Workshop/Other">Workshop Repair Machine</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={issueCustomerName}
                  onChange={e => setIssueCustomerName(e.target.value)}
                  placeholder="e.g. National Beverage Co."
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={issueRemarks}
                  onChange={e => setIssueRemarks(e.target.value)}
                  placeholder="Special instructions or job reference..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIssuePartModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E61C24] hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Issue Part Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM RECEIVE RETURN */}
      {showReceiveReturnModal && selectedTxForReturn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <h2 className="text-lg font-black text-gray-900 flex items-center">
              <RotateCcw className="w-5 h-5 mr-2 text-amber-600" />
              Confirm Part Return to Store
            </h2>
            <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-xs">
              <p><span className="font-bold">Part:</span> {selectedTxForReturn.partNumber} ({selectedTxForReturn.description})</p>
              <p><span className="font-bold">Quantity:</span> {selectedTxForReturn.quantity} ({selectedTxForReturn.condition})</p>
              <p><span className="font-bold">Returned By:</span> {selectedTxForReturn.engineerName}</p>
              <p><span className="font-bold">Return Reason:</span> {selectedTxForReturn.returnReason || 'Unused / Testing Complete'}</p>
              {selectedTxForReturn.returnRemarks && (
                <p><span className="font-bold">Remarks:</span> {selectedTxForReturn.returnRemarks}</p>
              )}
            </div>

            <p className="text-xs text-gray-600">
              Confirming this return will automatically add <span className="font-bold">{selectedTxForReturn.quantity} unit(s)</span> back to the Store Room inventory and deduct it from the engineer's bag.
            </p>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowReceiveReturnModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
              >
                Confirm Receipt into Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Bulk Import Modal */}
      <BulkExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        defaultType="INVENTORY"
        currentUser={currentUser}
        onSuccess={() => {
          offlineDb.storeInventory.toArray().then(setInventory);
        }}
      />
    </div>
  );
};
