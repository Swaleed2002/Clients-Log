import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  CustomerMachine, 
  Client, 
  PrinterBrand, 
  PartTransaction,
  ServiceReport,
  validateMachineData 
} from '../types';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { 
  Building2, 
  Plus, 
  Search, 
  History, 
  CheckCircle2, 
  X,
  Printer,
  FileSpreadsheet,
  Droplet,
  FlaskConical,
  Barcode,
  Cpu,
  Edit3,
  FileText,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  UserCheck
} from 'lucide-react';
import { LINX_MODELS, UBS_MODELS, RYNAN_MODELS } from '../data/partsMaster';
import { INKS_MASTER } from '../data/inksMaster';
import { BulkExcelImportModal } from './BulkExcelImportModal';
import { saveCustomerMachineWithSync, saveClientWithSync } from '../utils/syncManager';

interface ClientMachinesProps {
  currentUser: UserProfile;
  onOpenServiceReport?: (machine: CustomerMachine) => void;
}

export const ClientMachines: React.FC<ClientMachinesProps> = ({ 
  currentUser,
  onOpenServiceReport 
}) => {
  const [machines, setMachines] = useState<CustomerMachine[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<PartTransaction[]>([]);
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  
  const [activeTab, setActiveTab] = useState<'MACHINES' | 'CLIENTS'>('MACHINES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<CustomerMachine | null>(null);
  
  // Modals
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [showEditMachineModal, setShowEditMachineModal] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState<CustomerMachine | null>(null);
  
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  // Form states for new machine
  const [formClientName, setFormClientName] = useState('');
  const [formBrand, setFormBrand] = useState<PrinterBrand>('LINX');
  const [formModel, setFormModel] = useState<string>('8920');
  const [formSerial, setFormSerial] = useState<string>('');
  const [formPrintheadSerial, setFormPrintheadSerial] = useState<string>('');
  const [formInk, setFormInk] = useState<string>('1240');
  const [formSolvent, setFormSolvent] = useState<string>('1505');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for Client
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientTelFax, setClientTelFax] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  // 1. Fetch Machines (Firestore with offlineDb fallback)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customerMachines'), (snap) => {
      const list: CustomerMachine[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as CustomerMachine));
      setMachines(list);
      setLoadErrors(previous => ({ ...previous, machines: '' }));
      offlineDb.customerMachines.bulkPut(list).catch(() => {});
    }, (err) => {
      setLoadErrors(previous => ({ ...previous, machines: err.code === 'permission-denied'
        ? 'Machine access denied by Firestore. Contact the project administrator to check the database rules.'
        : 'Machine cloud data is unavailable. Saved offline data may be incomplete.' }));
      if (err.code === 'permission-denied') { setMachines([]); return; }
      console.warn("Falling back to local IndexedDB customerMachines:", err);
      offlineDb.customerMachines.toArray().then(setMachines).catch(() => setMachines([]));
    });

    return () => unsub();
  }, []);

  // 2. Fetch Clients
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Client));
      setClients(list);
      offlineDb.clients.bulkPut(list).catch(() => {});
    }, (err) => {
      console.warn("Falling back to local IndexedDB clients:", err);
      offlineDb.clients.toArray().then(setClients);
    });

    return () => unsub();
  }, []);

  // 3. Fetch Transactions & Service Reports to construct history
  useEffect(() => {
    const qTx = query(collection(db, 'partTransactions'), orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const list: PartTransaction[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as PartTransaction));
      setTransactions(list);
    }, () => {
      offlineDb.partTransactions.toArray().then(setTransactions);
    });

    const qRep = query(collection(db, 'serviceReports'), orderBy('createdAt', 'desc'));
    const unsubRep = onSnapshot(qRep, (snap) => {
      const list: ServiceReport[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ServiceReport));
      setReports(list);
      setLoadErrors(previous => ({ ...previous, history: '' }));
    }, err => {
      setLoadErrors(previous => ({ ...previous, history: err.code === 'permission-denied'
        ? 'Service history access denied by Firestore. History cannot be verified until database access is restored.'
        : 'Service history cloud data is unavailable. Saved offline history may be incomplete.' }));
      if (err.code === 'permission-denied') { setReports([]); return; }
      offlineDb.serviceReports.toArray().then(setReports).catch(() => setReports([]));
    });

    return () => {
      unsubTx();
      unsubRep();
    };
  }, []);

  // Quick brand consumable options
  const linxInks = INKS_MASTER.filter(i => i.brand === 'LINX' && i.type === 'Ink');
  const linxSolvents = INKS_MASTER.filter(i => i.brand === 'LINX' && i.type === 'Solvent');

  // Submit Add Machine
  const handleAddMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks for required fields
    const validation = validateMachineData({
      customerName: formClientName,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      printHeadSerial: formPrintheadSerial,
      ink: formInk,
      solvent: formSolvent
    }, true);

    if (!validation.valid) {
      setFormError(validation.errors.join(' '));
      return;
    }

    const id = doc(collection(db, 'customerMachines')).id;
    const newMachine: CustomerMachine = {
      id,
      customerId: formClientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
      customerName: formClientName.trim(),
      brand: formBrand,
      model: formModel.trim(),
      serialNumber: formSerial.trim().toUpperCase(),
      printHeadSerial: formPrintheadSerial.trim(),
      ink: formInk.trim(),
      solvent: formSolvent.trim(),
      location: formLocation.trim() || undefined,
      notes: formNotes.trim() || undefined,
      status: 'Active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await saveCustomerMachineWithSync(newMachine, true);
      
      // Also ensure client exists in clients list
      const clientExists = clients.some(c => c.name.toLowerCase() === formClientName.trim().toLowerCase());
      if (!clientExists) {
        const newClientDoc: Client = {
          id: 'client_' + formClientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: formClientName.trim(),
          address: formLocation.trim() || 'Factory Premises',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await saveClientWithSync(newClientDoc, true);
      }

      setShowAddMachineModal(false);
      resetMachineForm();
      setSelectedMachine(newMachine);
    } catch (err: any) {
      console.error("Failed to add machine:", err);
      setFormError(err.message || "Error saving equipment record to database.");
    }
  };

  // Submit Edit Machine
  const handleEditMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineToEdit) return;
    setFormError(null);

    // Validation checks: Printhead Serial, Ink and Solvent must not be blank or whitespace-only
    const validation = validateMachineData({
      customerName: formClientName,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      printHeadSerial: formPrintheadSerial,
      ink: formInk,
      solvent: formSolvent
    }, false);

    if (!validation.valid) {
      setFormError(validation.errors.join(' '));
      return;
    }

    const updatedMachine: CustomerMachine = {
      ...machineToEdit,
      customerName: formClientName.trim(),
      brand: formBrand,
      model: formModel.trim(),
      serialNumber: formSerial.trim().toUpperCase(),
      printHeadSerial: formPrintheadSerial.trim(),
      ink: formInk.trim(),
      solvent: formSolvent.trim(),
      location: formLocation.trim() || undefined,
      notes: formNotes.trim() || undefined,
      updatedAt: Date.now()
    };

    try {
      await saveCustomerMachineWithSync(updatedMachine, false);
      setShowEditMachineModal(false);
      setSelectedMachine(updatedMachine);
      resetMachineForm();
    } catch (err: any) {
      console.error("Failed to update machine:", err);
      setFormError(err.message || "Error updating machine details.");
    }
  };

  const openEditMachineModal = (machine: CustomerMachine) => {
    setMachineToEdit(machine);
    setFormClientName(machine.customerName);
    setFormBrand(machine.brand);
    setFormModel(machine.model);
    setFormSerial(machine.serialNumber);
    setFormPrintheadSerial(machine.printHeadSerial || '');
    setFormInk(machine.ink || '');
    setFormSolvent(machine.solvent || '');
    setFormLocation(machine.location || '');
    setFormNotes(machine.notes || '');
    setFormError(null);
    setShowEditMachineModal(true);
  };

  const resetMachineForm = () => {
    setFormClientName('');
    setFormBrand('LINX');
    setFormModel('8920');
    setFormSerial('');
    setFormPrintheadSerial('');
    setFormInk('1240');
    setFormSolvent('1505');
    setFormLocation('');
    setFormNotes('');
    setFormError(null);
    setMachineToEdit(null);
  };

  // Submit Add Client
  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!clientName.trim()) {
      setClientError('Client Name is required.');
      return;
    }
    if (!clientAddress.trim()) {
      setClientError('Address is required.');
      return;
    }

    const newClient: Client = {
      id: 'client_' + clientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
      name: clientName.trim(),
      address: clientAddress.trim(),
      telFax: clientTelFax.trim() || undefined,
      email: clientEmail.trim() || undefined,
      contactPerson: clientContactPerson.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await saveClientWithSync(newClient, true);
      setShowAddClientModal(false);
      resetClientForm();
    } catch (err: any) {
      console.error("Failed to add client:", err);
      setClientError(err.message || "Error saving client record.");
    }
  };

  // Submit Edit Client
  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    setClientError(null);

    if (!clientName.trim()) {
      setClientError('Client Name is required.');
      return;
    }

    const updatedClient: Client = {
      ...clientToEdit,
      name: clientName.trim(),
      address: clientAddress.trim(),
      telFax: clientTelFax.trim() || undefined,
      email: clientEmail.trim() || undefined,
      contactPerson: clientContactPerson.trim() || undefined,
      updatedAt: Date.now()
    };

    try {
      await saveClientWithSync(updatedClient, false);
      setShowEditClientModal(false);
      resetClientForm();
    } catch (err: any) {
      console.error("Failed to update client:", err);
      setClientError(err.message || "Error updating client record.");
    }
  };

  const openEditClientModal = (client: Client) => {
    setClientToEdit(client);
    setClientName(client.name);
    setClientAddress(client.address);
    setClientTelFax(client.telFax || '');
    setClientEmail(client.email || '');
    setClientContactPerson(client.contactPerson || '');
    setClientError(null);
    setShowEditClientModal(true);
  };

  const resetClientForm = () => {
    setClientName('');
    setClientAddress('');
    setClientTelFax('');
    setClientEmail('');
    setClientContactPerson('');
    setClientError(null);
    setClientToEdit(null);
  };

  // Filtered Machines
  const filteredMachines = machines.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.customerName.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.serialNumber.toLowerCase().includes(q) ||
      (m.printHeadSerial && m.printHeadSerial.toLowerCase().includes(q)) ||
      (m.ink && m.ink.toLowerCase().includes(q)) ||
      (m.solvent && m.solvent.toLowerCase().includes(q)) ||
      (m.location && m.location.toLowerCase().includes(q))
    );
  });

  // Filtered Clients
  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Machine History
  const machineHistory = selectedMachine ? transactions.filter(t => 
    t.customerName?.toLowerCase() === selectedMachine.customerName.toLowerCase() &&
    t.machineSerial?.toLowerCase() === selectedMachine.serialNumber.toLowerCase()
  ) : [];


  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {Object.entries(loadErrors).filter(([, message]) => message).map(([key, message]) => (
        <p key={key} role="alert" className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{message}</p>
      ))}
      
      {/* Top Banner with Action Buttons */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center">
              <Printer className="w-3.5 h-3.5 mr-1" /> CUSTOMER MACHINES & ASSETS CRM
            </span>
            <span className="text-xs text-gray-500 font-medium">Equipments, Consumables & Service Registry</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            Installed Printer Base & Consumables
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track customer printers, mandatory ink and solvent consumables, printhead serial numbers, and maintenance history.
          </p>
        </div>

        {/* Action Buttons: Add Machine, Add Client, Excel Import */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Add Client Button */}
          <button
            onClick={() => {
              resetClientForm();
              setShowAddClientModal(true);
            }}
            className="flex items-center px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4 mr-1.5 text-blue-600" />
            ADD CLIENT
          </button>

          {/* Add Machine Button */}
          <button
            onClick={() => {
              resetMachineForm();
              setShowAddMachineModal(true);
            }}
            className="flex items-center px-4 py-2.5 bg-[#E61C24] hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            REGISTER NEW MACHINE
          </button>

          {/* Additional Excel Import Button */}
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="flex items-center px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            title="Additional bulk import via Excel"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            EXCEL IMPORT
          </button>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('MACHINES')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
              activeTab === 'MACHINES'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Installed Machines ({machines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
              activeTab === 'CLIENTS'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Clients Directory ({clients.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'MACHINES' ? "Search client, model, serial, ink..." : "Search client name, location, contact..."}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E61C24] focus:bg-white"
          />
        </div>
      </div>

      {/* TAB 1: INSTALLED MACHINES VIEW */}
      {activeTab === 'MACHINES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Machines List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Registered Equipment ({filteredMachines.length})
                </h3>
                <span className="text-xs text-gray-400">Select any machine to view consumables & history</span>
              </div>

              {filteredMachines.length === 0 ? (
                <div className="p-12 text-center">
                  <Printer className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No equipment registered yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use "REGISTER NEW MACHINE" or "EXCEL IMPORT" to add client machines.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMachines.map(machine => {
                    const isSelected = selectedMachine?.id === machine.id;
                    const hasMissingPrinthead = !machine.printHeadSerial || !machine.printHeadSerial.trim();
                    const hasMissingInk = !machine.ink || !machine.ink.trim();
                    const hasMissingSolvent = !machine.solvent || !machine.solvent.trim();

                    return (
                      <div
                        key={machine.id}
                        onClick={() => setSelectedMachine(machine)}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer transition-colors gap-3 ${
                          isSelected ? 'bg-red-50/50 border-l-4 border-l-[#E61C24]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-gray-900 text-sm">
                              {machine.customerName}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 font-bold rounded text-[10px] text-gray-700">
                              {machine.brand}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 font-bold rounded text-[10px] text-blue-700">
                              {machine.model}
                            </span>
                          </div>

                          {/* Machine & Consumables Quick Pills */}
                          <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                              S/N: {machine.serialNumber}
                            </span>

                            {/* Printhead Serial pill */}
                            {hasMissingPrinthead ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[10px] flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1 text-amber-700" />
                                PH: Not Recorded
                              </span>
                            ) : (
                              <span className="font-mono px-2 py-0.5 bg-gray-100 text-gray-700 font-medium rounded text-[11px]">
                                PH: {machine.printHeadSerial}
                              </span>
                            )}

                            {/* Consumables Quick Badges */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center ${
                              hasMissingInk ? 'bg-amber-100 text-amber-900' : 'bg-red-50 text-red-900'
                            }`}>
                              <Droplet className="w-3 h-3 mr-1 text-red-600" />
                              Ink: {machine.ink || 'Not Recorded'}
                            </span>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center ${
                              hasMissingSolvent ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-900'
                            }`}>
                              <FlaskConical className="w-3 h-3 mr-1 text-blue-600" />
                              Sol: {machine.solvent || 'Not Recorded'}
                            </span>

                            {machine.location && (
                              <span className="text-gray-500 text-[11px] flex items-center">
                                <MapPin className="w-3 h-3 mr-0.5 text-gray-400" /> {machine.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditMachineModal(machine);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            title="Edit Machine Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMachine(machine);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isSelected 
                                ? 'bg-[#E61C24] text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Dedicated Consumables & Inspector Panel (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center">
                  <Printer className="w-4 h-4 mr-2 text-emerald-600" />
                  Machine Consumables & Details
                </h3>
                {selectedMachine && (
                  <button
                    onClick={() => openEditMachineModal(selectedMachine)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Edit3 className="w-3 h-3 mr-1" /> Edit
                  </button>
                )}
              </div>

              {selectedMachine ? (
                <div className="space-y-4">
                  {/* Machine Header */}
                  <div className="bg-gray-50 p-3.5 rounded-xl space-y-1 text-xs">
                    <p className="font-black text-gray-900 text-sm">{selectedMachine.customerName}</p>
                    <p className="font-bold text-gray-700">{selectedMachine.brand} {selectedMachine.model}</p>
                    {selectedMachine.location && (
                      <p className="text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1 text-gray-400" /> {selectedMachine.location}
                      </p>
                    )}
                  </div>

                  {/* =========================================================================
                      7. ENGINEER EXPERIENCE — DEDICATED CONSUMABLES SECTION
                      Clearly displays:
                      - INK: 1240
                      - SOLVENT: 1505
                      - MACHINE SERIAL: ...
                      - PRINTHEAD SERIAL: ...
                     ========================================================================= */}
                  <div className="border border-red-100 bg-red-50/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-red-900 uppercase tracking-wider">
                      <Droplet className="w-4 h-4 text-[#E61C24]" />
                      <span>Consumables Specification</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* INK */}
                      <div className="bg-white p-3 rounded-xl border border-red-100 shadow-2xs">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          INK
                        </span>
                        {selectedMachine.ink ? (
                          <span className="text-base font-black text-gray-900 font-mono">
                            {selectedMachine.ink}
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            Not Recorded
                          </span>
                        )}
                      </div>

                      {/* SOLVENT */}
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          SOLVENT
                        </span>
                        {selectedMachine.solvent ? (
                          <span className="text-base font-black text-gray-900 font-mono">
                            {selectedMachine.solvent}
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            Not Recorded
                          </span>
                        )}
                      </div>

                      {/* MACHINE SERIAL */}
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          MACHINE SERIAL
                        </span>
                        <span className="text-xs font-bold text-gray-900 font-mono">
                          {selectedMachine.serialNumber}
                        </span>
                      </div>

                      {/* PRINTHEAD SERIAL */}
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          PRINTHEAD SERIAL
                        </span>
                        {selectedMachine.printHeadSerial ? (
                          <span className="text-xs font-bold text-gray-900 font-mono">
                            {selectedMachine.printHeadSerial}
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px]">
                            Missing / Not Recorded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Button to Start Job for this Machine */}
                    {onOpenServiceReport && (
                      <button
                        onClick={() => onOpenServiceReport(selectedMachine)}
                        className="w-full mt-2 py-2 bg-[#E61C24] hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Create Service Report for this Machine</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 pt-3">
                    <h4 className="text-sm font-bold">Service / Work History</h4>
                    {reports.filter(r => r.machineId ? r.machineId === selectedMachine.id : r.printerSerial?.trim().toLowerCase() === selectedMachine.serialNumber.trim().toLowerCase() && r.customer?.trim().toLowerCase() === selectedMachine.customerName.trim().toLowerCase()).sort((a,b) => b.date.localeCompare(a.date) || b.createdAt-a.createdAt).map(r => (
                      <article key={r.id} className="bg-white border rounded-xl p-3 space-y-2 text-sm">
                        <p className="font-bold">{r.date} · {r.engineerName || r.userId}</p>
                        <p className="whitespace-pre-wrap">Complaint: {r.complaint || 'Not recorded'}</p>
                        <p className="whitespace-pre-wrap">Work: {r.jobCarriedOut || 'Not recorded'}</p>
                        {r.remarks && <p className="whitespace-pre-wrap">{r.remarks}</p>}
                        <p className="font-semibold">Parts Used</p>
                        {r.partsUsed?.length ? r.partsUsed.map((p,i) => <p key={i}>{p.partNumber} — {p.description} × {p.quantity} ({p.condition}, {p.source})</p>) : <p>{r.partsReplaced || 'None recorded'}</p>}
                        {r.workOrderImage && <a href={r.workOrderImage} download={'work-order-' + r.date + '.jpg'}><img src={r.workOrderImage} alt={'Physical Work Order — ' + r.date} className="max-h-96 w-full object-contain border rounded" /><span className="text-red-700">Download Work Order image</span></a>}
                      </article>
                    ))}
                  </div>
                  {/* Machine Parts Replacement History */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                      <History className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      Parts Installed History ({machineHistory.length})
                    </h4>

                    {machineHistory.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center bg-gray-50 rounded-xl">
                        No part replacements recorded for this machine.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {machineHistory.map(tx => (
                          <div key={tx.id} className="p-2.5 bg-gray-50 rounded-lg text-xs space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-gray-900">{tx.partNumber}</span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                {tx.status}
                              </span>
                            </div>
                            <p className="text-gray-600 text-[11px] truncate">{tx.description}</p>
                            <p className="text-[10px] text-gray-400">By {tx.engineerName || 'Service Engineer'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Printer className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-bold">Select a machine from the left to view consumables specifications.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CLIENTS DIRECTORY VIEW */}
      {activeTab === 'CLIENTS' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
              Client Accounts Directory ({filteredClients.length})
            </h3>
            <button
              onClick={() => {
                resetClientForm();
                setShowAddClientModal(true);
              }}
              className="text-xs font-bold text-[#E61C24] hover:text-red-700 flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add New Client
            </button>
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No client accounts recorded</p>
              <p className="text-xs text-gray-400 mt-1">
                Add clients manually using the "ADD CLIENT" button or import via Excel.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredClients.map(client => {
                const clientMachines = machines.filter(
                  m => m.customerName.toLowerCase() === client.name.toLowerCase()
                );

                return (
                  <div key={client.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-gray-900 text-sm">{client.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-full text-[10px]">
                          {clientMachines.length} Machine{clientMachines.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                        {client.address}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1">
                        {client.contactPerson && (
                          <span className="flex items-center font-medium">
                            <UserCheck className="w-3 h-3 mr-1 text-gray-400" /> {client.contactPerson}
                          </span>
                        )}
                        {client.telFax && (
                          <span className="flex items-center font-medium">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" /> {client.telFax}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center font-medium">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" /> {client.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => openEditClientModal(client)}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Edit Client
                      </button>

                      <button
                        onClick={() => {
                          setSearchQuery(client.name);
                          setActiveTab('MACHINES');
                        }}
                        className="px-3 py-1.5 bg-[#E61C24] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        View Machines
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW MACHINE (WITH MANDATORY PRINTHEAD, INK, SOLVENT)
         ========================================================================= */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Register New Client Machine
                </h3>
                <p className="text-[11px] text-gray-500">
                  Consumables and printhead serial are mandatory for new machines.
                </p>
              </div>
              <button 
                onClick={() => setShowAddMachineModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddMachineSubmit} className="space-y-3.5 text-xs">
              
              {/* Customer Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Customer / Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formClientName}
                  onChange={e => setFormClientName(e.target.value)}
                  placeholder="e.g. Delta Foods Industries LLC"
                  list="client-suggestions"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                />
                <datalist id="client-suggestions">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBrand}
                    onChange={e => {
                      const b = e.target.value as PrinterBrand;
                      setFormBrand(b);
                      if (b === 'LINX') setFormModel('8920');
                      if (b === 'UBS') setFormModel('MRX 10');
                      if (b === 'RYNAN') setFormModel('B1040');
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="LINX">LINX</option>
                    <option value="UBS">UBS</option>
                    <option value="RYNAN">RYNAN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formModel}
                    onChange={e => setFormModel(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    {formBrand === 'LINX' && LINX_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    {formBrand === 'UBS' && UBS_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    {formBrand === 'RYNAN' && RYNAN_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Machine Serial Number */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Machine Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formSerial}
                  onChange={e => setFormSerial(e.target.value)}
                  placeholder="e.g. DEMO-MACHINE-001 or CN123456"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-mono uppercase font-bold"
                />
              </div>

              {/* Printhead Serial Number (MANDATORY) */}
              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Printhead Serial Number <span className="text-red-600 font-bold">* MANDATORY</span>
                </label>
                <input
                  type="text"
                  value={formPrintheadSerial}
                  onChange={e => setFormPrintheadSerial(e.target.value)}
                  placeholder="e.g. DEMO-HEAD-001 or PH-890-77"
                  required
                  className="w-full p-2.5 border-2 border-gray-300 focus:border-[#E61C24] rounded-lg font-mono font-bold"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Printhead serial is strictly required. Blank or whitespace values will be rejected.
                </p>
              </div>

              {/* Consumables Pairing Section: INK & SOLVENT (MANDATORY) */}
              <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-200 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-black text-red-900">
                  <Droplet className="w-3.5 h-3.5 text-[#E61C24]" />
                  <span>Mandatory Consumables Association</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* INK */}
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">
                      Ink Code <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formInk}
                      onChange={e => setFormInk(e.target.value)}
                      placeholder="e.g. 1240"
                      list="ink-suggestions"
                      required
                      className="w-full p-2.5 border-2 border-gray-300 focus:border-red-500 rounded-lg font-mono font-bold"
                    />
                    <datalist id="ink-suggestions">
                      {linxInks.map(i => <option key={i.id} value={i.productCode}>{i.name}</option>)}
                    </datalist>
                  </div>

                  {/* SOLVENT */}
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">
                      Solvent Code <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formSolvent}
                      onChange={e => setFormSolvent(e.target.value)}
                      placeholder="e.g. 1505"
                      list="solvent-suggestions"
                      required
                      className="w-full p-2.5 border-2 border-gray-300 focus:border-blue-500 rounded-lg font-mono font-bold"
                    />
                    <datalist id="solvent-suggestions">
                      {linxSolvents.map(s => <option key={s.id} value={s.productCode}>{s.name}</option>)}
                    </datalist>
                  </div>
                </div>

                {/* Quick chip pairings */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-gray-500 font-bold">Quick Linx Pairs:</span>
                  <button
                    type="button"
                    onClick={() => { setFormInk('1240'); setFormSolvent('1505'); }}
                    className="px-2 py-0.5 bg-white border border-gray-300 hover:border-gray-500 rounded text-[10px] font-bold"
                  >
                    1240 / 1505
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormInk('1240'); setFormSolvent('1512'); }}
                    className="px-2 py-0.5 bg-white border border-gray-300 hover:border-gray-500 rounded text-[10px] font-bold"
                  >
                    1240 / 1512
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormInk('1010'); setFormSolvent('1505'); }}
                    className="px-2 py-0.5 bg-white border border-gray-300 hover:border-gray-500 rounded text-[10px] font-bold"
                  >
                    1010 / 1505
                  </button>
                </div>
              </div>

              {/* Plant Location */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Plant / Production Line Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  placeholder="e.g. Line 2 - Bottling Section"
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMachineModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E61C24] hover:bg-red-700 text-white font-black rounded-xl shadow-sm"
                >
                  Register Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT MACHINE
         ========================================================================= */}
      {showEditMachineModal && machineToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Edit Machine Information
                </h3>
                <p className="text-[11px] text-gray-500">
                  Update serials, consumables, and location for {machineToEdit.customerName}.
                </p>
              </div>
              <button 
                onClick={() => setShowEditMachineModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditMachineSubmit} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formClientName}
                  onChange={e => setFormClientName(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Brand</label>
                  <select
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value as PrinterBrand)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="LINX">LINX</option>
                    <option value="UBS">UBS</option>
                    <option value="RYNAN">RYNAN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={e => setFormModel(e.target.value)}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* Machine Serial Number */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Machine Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formSerial}
                  onChange={e => setFormSerial(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-mono uppercase font-bold"
                />
              </div>

              {/* Printhead Serial Number (Mandatory) */}
              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Printhead Serial Number <span className="text-red-600 font-bold">* MANDATORY</span>
                </label>
                <input
                  type="text"
                  value={formPrintheadSerial}
                  onChange={e => setFormPrintheadSerial(e.target.value)}
                  placeholder="e.g. DEMO-HEAD-001"
                  required
                  className="w-full p-2.5 border-2 border-gray-300 focus:border-[#E61C24] rounded-lg font-mono font-bold"
                />
              </div>

              {/* Ink & Solvent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Ink <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formInk}
                    onChange={e => setFormInk(e.target.value)}
                    required
                    className="w-full p-2.5 border-2 border-gray-300 focus:border-red-500 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Solvent <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSolvent}
                    onChange={e => setFormSolvent(e.target.value)}
                    required
                    className="w-full p-2.5 border-2 border-gray-300 focus:border-blue-500 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditMachineModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW CLIENT (MANUAL CRM)
         ========================================================================= */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Add New Client
                </h3>
                <p className="text-[11px] text-gray-500">
                  Register customer account in CRM database.
                </p>
              </div>
              <button 
                onClick={() => setShowAddClientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {clientError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{clientError}</span>
              </div>
            )}

            <form onSubmit={handleAddClientSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Client / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Al Rawabi Dairy Co."
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Address / Plant Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  placeholder="e.g. Al Khawaneej, Dubai, UAE"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tel / Fax</label>
                  <input
                    type="text"
                    value={clientTelFax}
                    onChange={e => setClientTelFax(e.target.value)}
                    placeholder="+971 4 2891234"
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={e => setClientContactPerson(e.target.value)}
                  placeholder="e.g. Eng. Rashid (Maintenance Manager)"
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-sm"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT CLIENT (MANUAL CRM)
         ========================================================================= */}
      {showEditClientModal && clientToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Edit Client Details
                </h3>
                <p className="text-[11px] text-gray-500">
                  Update company profile for {clientToEdit.name}.
                </p>
              </div>
              <button 
                onClick={() => setShowEditClientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {clientError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{clientError}</span>
              </div>
            )}

            <form onSubmit={handleEditClientSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tel / Fax</label>
                  <input
                    type="text"
                    value={clientTelFax}
                    onChange={e => setClientTelFax(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={e => setClientContactPerson(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditClientModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EXCEL BULK IMPORT MODAL
         ========================================================================= */}
      <BulkExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        defaultType="MACHINES"
        currentUser={currentUser}
        onSuccess={() => {
          // Re-trigger local reload
          offlineDb.customerMachines.toArray().then(setMachines);
          offlineDb.clients.toArray().then(setClients);
        }}
      />

    </div>
  );
};
