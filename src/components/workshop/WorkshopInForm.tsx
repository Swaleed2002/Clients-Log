import React, { useState, useEffect } from 'react';
import { UserProfile, CustomerMachine, Client, WorkshopCase, WorkshopChecklistItem, PrinterBrand } from '../../types';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, doc } from 'firebase/firestore';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { generateId } from '../../utils';

interface WorkshopInFormProps {
  currentUser: UserProfile;
  onBack: () => void;
}

const DEFAULT_CHECKLIST = [
  'Machine physically OK',
  'Ink present',
  'Solvent present',
  'Sensor present',
  'Thumb Screw present',
  'All machine legs/feet present',
  'Door Latch OK',
  'Printhead present',
  'Printhead physically OK',
  'Power Cable present',
  'Required machine covers present',
  'Connectors/cables OK'
];

export function WorkshopInForm({ currentUser, onBack }: WorkshopInFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [machines, setMachines] = useState<CustomerMachine[]>([]);
  
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [complaint, setComplaint] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [checklist, setChecklist] = useState<WorkshopChecklistItem[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubClients = onSnapshot(collection(db, 'clients'), snap => {
      const list: Client[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Client));
      setClients(list.sort((a,b) => a.name.localeCompare(b.name)));
    });
    
    const unsubMachines = onSnapshot(collection(db, 'customerMachines'), snap => {
      const list: CustomerMachine[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as CustomerMachine));
      setMachines(list);
    });

    // Init default checklist
    setChecklist(DEFAULT_CHECKLIST.map(name => ({
      id: generateId(),
      name,
      condition: 'OK / Present'
    })));

    return () => { unsubClients(); unsubMachines(); };
  }, []);

  const filteredMachines = machines.filter(m => m.customerName === selectedClient);
  const activeMachine = machines.find(m => m.id === selectedMachine);

  const updateChecklist = (id: string, field: string, value: any) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedMachine || !complaint.trim()) {
      setError('Please select customer, machine, and enter a complaint.');
      return;
    }
    if (!activeMachine) return;
    
    setSaving(true);
    setError('');
    
    try {
      const year = new Date().getFullYear();
      const caseNumber = `WS-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newCase: Omit<WorkshopCase, 'id'> = {
        caseNumber,
        machineId: activeMachine.id,
        customerId: activeMachine.customerId,
        customerName: activeMachine.customerName,
        brand: activeMachine.brand,
        model: activeMachine.model,
        serialNumber: activeMachine.serialNumber,
        printHeadSerial: activeMachine.printHeadSerial,
        status: 'Awaiting Store Verification',
        complaint: complaint.trim(),
        
        receivedByUid: currentUser.userId,
        receivedByName: currentUser.fullName,
        receivedAt: Date.now(),
        engineerRemarks: remarks.trim(),
        incomingChecklist: checklist,
        
        activities: [],
        outgoingChecklist: [],
        auditLog: [{
          id: generateId(),
          uid: currentUser.userId,
          userName: currentUser.fullName,
          action: 'CREATED',
          details: 'Machine received into workshop.',
          timestamp: Date.now()
        }]
      };
      
      await addDoc(collection(db, 'workshopCases'), newCase);
      onBack();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3 p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase">Receive Machine</h2>
          <p className="text-xs text-gray-500">Workshop In - Awaiting Store Verification</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl flex items-center border border-red-200">
          <AlertCircle className="w-4 h-4 mr-2" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm mb-4">1. Select Equipment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Customer</label>
              <select 
                value={selectedClient} 
                onChange={e => { setSelectedClient(e.target.value); setSelectedMachine(''); }}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium"
              >
                <option value="">-- Select Customer --</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Machine</label>
              <select 
                value={selectedMachine} 
                onChange={e => setSelectedMachine(e.target.value)}
                disabled={!selectedClient}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium disabled:opacity-50"
              >
                <option value="">-- Select Machine --</option>
                {filteredMachines.map(m => (
                  <option key={m.id} value={m.id}>{m.brand} {m.model} (SN: {m.serialNumber})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {activeMachine && (
          <div className="p-4 border-b border-gray-100 bg-blue-50/30">
            <h3 className="font-bold text-gray-800 text-sm mb-3">2. Customer Complaint</h3>
            <textarea
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              placeholder="e.g. Machine not printing. Pump suspected faulty. Brought for troubleshooting."
              className="w-full p-3 border border-gray-200 rounded-lg text-sm font-medium h-24"
            />
          </div>
        )}

        {activeMachine && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm mb-1">3. Incoming Condition Checklist</h3>
            <p className="text-xs text-gray-500 mb-4">All standard items are checked (OK) by default. Uncheck or change items that are missing or damaged.</p>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {checklist.map(item => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className="flex-1 font-bold text-sm text-gray-700">
                    {item.name}
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      value={item.condition}
                      onChange={e => updateChecklist(item.id, 'condition', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs font-bold ${
                        item.condition === 'OK / Present' ? 'bg-green-50 text-green-700 border-green-200' :
                        item.condition === 'Missing' ? 'bg-red-50 text-red-700 border-red-200' :
                        item.condition === 'Damaged / Faulty' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <option value="OK / Present">OK / Present</option>
                      <option value="Missing">Missing</option>
                      <option value="Damaged / Faulty">Damaged / Faulty</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                  {(item.condition === 'Missing' || item.condition === 'Damaged / Faulty') && (
                    <div className="w-full md:w-1/3">
                      <input 
                        type="text" 
                        placeholder="Note (optional)" 
                        value={item.engineerNote || ''}
                        onChange={e => updateChecklist(item.id, 'engineerNote', e.target.value)}
                        className="w-full p-1.5 border border-red-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMachine && (
          <div className="p-4 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm mb-3">4. Additional Remarks</h3>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any other observations..."
              className="w-full p-3 border border-gray-200 rounded-lg text-sm font-medium h-20"
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Submit to Workshop'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
