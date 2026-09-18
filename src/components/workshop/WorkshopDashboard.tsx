import React, { useState, useEffect } from 'react';
import { UserProfile, WorkshopCase } from '../../types';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Wrench, Plus, Search, Filter } from 'lucide-react';
import { WorkshopInForm } from './WorkshopInForm';
import { WorkshopCaseDetail } from './WorkshopCaseDetail';

interface WorkshopDashboardProps {
  currentUser: UserProfile;
}

export function WorkshopDashboard({ currentUser }: WorkshopDashboardProps) {
  const [cases, setCases] = useState<WorkshopCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [view, setView] = useState<'list' | 'in-form' | 'detail'>('list');
  const [selectedCase, setSelectedCase] = useState<WorkshopCase | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'workshopCases'), orderBy('receivedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: WorkshopCase[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as WorkshopCase));
      setCases(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredCases = cases.filter(c => 
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.model.toLowerCase().includes(search.toLowerCase()) ||
    c.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Awaiting Store Verification': return 'bg-yellow-100 text-yellow-800';
      case 'In Workshop': return 'bg-blue-100 text-blue-800';
      case 'Repair In Progress': return 'bg-purple-100 text-purple-800';
      case 'Ready for Dispatch': return 'bg-orange-100 text-orange-800';
      case 'Awaiting Out Verification': return 'bg-yellow-100 text-yellow-800';
      case 'Returned to Customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenCase = (c: WorkshopCase) => {
    setSelectedCase(c);
    setView('detail');
  };

  if (view === 'in-form') {
    return (
      <WorkshopInForm 
        currentUser={currentUser} 
        onBack={() => setView('list')}
      />
    );
  }

  if (view === 'detail' && selectedCase) {
    return (
      <WorkshopCaseDetail 
        workshopCase={selectedCase}
        currentUser={currentUser}
        onBack={() => {
          setSelectedCase(null);
          setView('list');
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center">
            <Wrench className="w-6 h-6 mr-2 text-emerald-600" />
            Workshop Machines
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage machine repair in/out and histories.</p>
        </div>
        {(currentUser.role === 'ENGINEER' || currentUser.role === 'ADMIN') && (
          <button
            onClick={() => setView('in-form')}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Receive Machine
          </button>
        )}
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'In Workshop', count: cases.filter(c => c.status !== 'Returned to Customer').length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Awaiting In Ver.', count: cases.filter(c => c.status === 'Awaiting Store Verification').length, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { label: 'Repairing', count: cases.filter(c => c.status === 'Repair In Progress').length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Ready Dispatch', count: cases.filter(c => c.status === 'Ready for Dispatch').length, color: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: 'Awaiting Out Ver.', count: cases.filter(c => c.status === 'Awaiting Out Verification').length, color: 'bg-red-50 text-red-700 border-red-200' },
        ].map((stat, i) => (
          <div key={i} className={`p-3 rounded-xl border ${stat.color} flex flex-col items-center text-center`}>
            <span className="text-2xl font-black">{stat.count}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search cases, customers, models, serials..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full outline-none text-sm font-medium text-gray-900"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-bold">No workshop cases found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCases.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleOpenCase(c)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-emerald-700">{c.caseNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{c.customerName}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="font-semibold text-gray-700">{c.brand} {c.model}</span>
                    <span>•</span>
                    <span className="font-mono">SN: {c.serialNumber}</span>
                  </div>
                </div>
                <div className="text-left md:text-right text-xs">
                  <p className="text-gray-500 font-medium mb-1">Received: {new Date(c.receivedAt).toLocaleDateString()}</p>
                  <p className="text-gray-700 font-bold text-[10px] uppercase">{c.receivedByName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
