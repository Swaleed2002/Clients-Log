import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ServiceReport, UserProfile } from '../types';
import { Plus, FileText, Search, ArrowLeft, PenTool, Printer, ChevronRight, Cpu } from 'lucide-react';
import { offlineDb } from '../db/indexedDb';

interface ServiceReportsListProps {
  currentUser: UserProfile;
  onNew: () => void;
  onEdit: (report: ServiceReport) => void;
  onBack: () => void;
}

export function ServiceReportsList({ currentUser, onNew, onEdit, onBack }: ServiceReportsListProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, [currentUser]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let q;
      if (currentUser.role === 'ADMIN' || currentUser.role === 'STORE') {
        q = query(collection(db, 'serviceReports'), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'serviceReports'), where('userId', '==', currentUser.userId));
      }
      const snapshot = await getDocs(q);
      const fetched: ServiceReport[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...(doc.data() as any) } as ServiceReport);
      });
      fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReports(fetched);
      offlineDb.serviceReports.bulkPut(fetched).catch(() => {});
    } catch (err) {
      console.warn("Firestore fetch error, loading from local offline DB:", err);
      const local = await offlineDb.serviceReports.toArray();
      local.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReports(local);
    }
    setLoading(false);
  };

  const filtered = reports.filter(r => 
    r.customer?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.reportNo?.includes(searchTerm) ||
    r.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.printerSerial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div className="flex items-center">
          <button 
            onClick={onBack} 
            className="mr-3 p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Service Reports & Work Orders</h2>
            <p className="text-xs text-gray-500 font-medium">Original Work Order forms with full parts & signature tracking</p>
          </div>
        </div>
        <button 
          onClick={onNew}
          className="flex items-center justify-center px-4 py-2.5 bg-[#E61C24] text-white rounded-xl font-bold shadow-md shadow-red-500/20 hover:bg-red-700 transition-colors text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" /> CREATE WORK ORDER
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search customer, report #, model, or serial..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E61C24] shadow-sm font-medium"
        />
      </div>

      {/* Reports Listing */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-xs font-bold animate-pulse">Loading work orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-[#E61C24]" />
          </div>
          <p className="text-sm font-bold text-gray-700">No service reports found</p>
          <p className="text-xs text-gray-400 mt-1">Click "CREATE WORK ORDER" to fill in the A4 digital Work Order.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(report => {
            const hasParts = report.partsUsed && report.partsUsed.length > 0;
            return (
              <div 
                key={report.id} 
                onClick={() => onEdit(report)}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#E61C24] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-[#E61C24] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      #{report.reportNo || '40000'}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{report.customer || 'Unnamed Customer'}</span>
                    {report.modelNumber && (
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded flex items-center">
                        <Cpu className="w-3 h-3 mr-1 text-gray-500" />
                        {report.modelNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center">
                      <PenTool className="w-3 h-3 mr-1 text-gray-400" /> 
                      {report.engineerName}
                    </span>
                    <span>•</span>
                    <span>{report.date}</span>
                    {report.printerSerial && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-gray-600">S/N: {report.printerSerial}</span>
                      </>
                    )}
                    {hasParts && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {report.partsUsed?.length} part(s) replaced
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400 group-hover:text-[#E61C24] flex items-center transition-colors">
                    View & Print <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
