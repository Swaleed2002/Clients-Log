import React, { useState, useEffect } from 'react';
import { WorkEntry, UserProfile } from '../types';
import { calculateEntryTotals, formatDuration } from '../utils';
import { 
  FileSpreadsheet, 
  Download, 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon, 
  ArrowRight,
  FileText,
  Package,
  Briefcase,
  Warehouse,
  Activity,
  Printer,
  Building2,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  ChevronRight,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { format, isSameDay, isSameWeek, parseISO } from 'date-fns';
import { offlineDb } from '../db/indexedDb';
import { syncPendingQueue } from '../utils/syncManager';

interface DashboardProps {
  entries: WorkEntry[];
  onAddEntry: () => void;
  onViewReport: () => void;
  onExport: () => void;
  onOpenServiceReports?: () => void;
  onOpenPartsCatalog?: () => void;
  onOpenStoreInventory?: () => void;
  onOpenEngineerBag?: () => void;
  onOpenTestingTracker?: () => void;
  onOpenClientMachines?: () => void;
  profile: UserProfile;
}

export function Dashboard({ 
  entries, 
  onAddEntry, 
  onViewReport, 
  onExport,
  onOpenServiceReports,
  onOpenPartsCatalog,
  onOpenStoreInventory,
  onOpenEngineerBag,
  onOpenTestingTracker,
  onOpenClientMachines,
  profile 
}: DashboardProps) {
  const today = new Date();
  const isStore = profile.role === 'STORE';
  const isAdmin = profile.role === 'ADMIN';

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  
  let todayJobMinutes = 0;
  let todayTravelMinutes = 0;
  let weekJobMinutes = 0;
  let weekTravelMinutes = 0;
  let weekEntriesCount = 0;

  const recentEntries = [...entries]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  entries.forEach(entry => {
    const entryDate = parseISO(entry.date);
    const totals = calculateEntryTotals(entry);
    
    if (isSameDay(entryDate, today)) {
      todayJobMinutes += totals.job.totalMinutes;
      todayTravelMinutes += totals.travel.totalMinutes;
    }
    
    if (isSameWeek(entryDate, today, { weekStartsOn: 1 })) {
      weekJobMinutes += totals.job.totalMinutes;
      weekTravelMinutes += totals.travel.totalMinutes;
      weekEntriesCount++;
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateCount = () => {
      offlineDb.pendingSyncQueue.count().then(setPendingCount).catch(() => {});
    };
    updateCount();
    const interval = setInterval(updateCount, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      await syncPendingQueue();
      const count = await offlineDb.pendingSyncQueue.count();
      setPendingCount(count);
    } finally {
      setSyncing(false);
    }
  };

  const formatMins = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return formatDuration({ hours: h, minutes: m, totalMinutes: totalMins });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Enterprise Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {format(today, 'EEEE, dd MMMM yyyy')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {isOnline ? 'Cloud Synced' : 'Offline Mode'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Welcome back, {profile.fullName}
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Reliable Industrial Coding CRM & Field Service Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Role badge */}
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
            profile.role === 'ADMIN' ? 'bg-purple-50 text-purple-800 border-purple-200' :
            profile.role === 'STORE' ? 'bg-amber-50 text-amber-800 border-amber-200' :
            'bg-red-50 text-red-800 border-red-200'
          }`}>
            {profile.role === 'STORE' ? 'Store Manager' : profile.role === 'ADMIN' ? 'Administrator' : 'Field Engineer'}
          </span>

          {/* New Work Log action button */}
          <button
            onClick={onAddEntry}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#E61C24] hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ LOG WORK ENTRY</span>
          </button>
        </div>
      </div>

      {/* MOBILE ENGINEER FAST-ACTION BAR (Optimized for 1-hand field navigation) */}
      <div className="md:hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-md border border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black tracking-wider text-slate-300 uppercase">
            ⚡ Quick Field Actions (1-Hand Access)
          </p>
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={!isOnline || syncing}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-black"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} Pending Sync</span>
            </button>
          )}
        </div>

        {/* Priority Flow: My Clients → Machines → Service Report → My Bag → Testing → Backup */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onOpenClientMachines}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
          >
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] font-black uppercase">My Clients</span>
          </button>

          <button
            onClick={onOpenClientMachines}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
          >
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-black uppercase">Machines</span>
          </button>



          <button
            onClick={onOpenEngineerBag}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
          >
            <Briefcase className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-black uppercase">My Bag</span>
          </button>

          <button
            onClick={onOpenTestingTracker}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
          >
            <Activity className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-black uppercase">Testing Parts</span>
          </button>

          <button
            onClick={onOpenTestingTracker}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
          >
            <Clock className="w-5 h-5 text-teal-400" />
            <span className="text-[10px] font-black uppercase">Backup Spares</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Job Time */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Today Job Time</span>
            <Clock className="w-4 h-4 text-[#E61C24]" />
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {formatMins(todayJobMinutes)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Logged on site today</p>
        </div>

        {/* Today's Travel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Today Travel</span>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {formatMins(todayTravelMinutes)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Transit time to clients</p>
        </div>

        {/* Week Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Weekly Job Hours</span>
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {formatMins(weekJobMinutes)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{weekEntriesCount} logs recorded this week</p>
        </div>

        {/* System Sync / Offline Queue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Sync Status</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {pendingCount === 0 ? 'All Synced' : `${pendingCount} Queued`}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-gray-400">
              {isOnline ? 'Online mode' : 'Working offline'}
            </span>
            {pendingCount > 0 && isOnline && (
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Field Service Quick Navigation Hub (Bento Layout) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">
            CRM Modules & Quick Workflows
          </h3>
          <span className="text-xs text-gray-400">Desktop Enterprise Layout</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Equipment Base & Consumables CRM */}
          <button
            onClick={onOpenClientMachines}
            className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-emerald-100">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Equipment CRM & Clients
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  CRM
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Customer fleet, mandatory Printhead Serial, Ink & Solvent pairing, and maintenance history.
              </p>
            </div>
            <div className="flex items-center text-emerald-700 font-bold text-xs mt-4 group-hover:translate-x-1 transition-transform">
              <span>Manage Machines & Clients</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Service Reports / Work Orders */}


          {/* Parts Master Catalog */}
          <button
            onClick={onOpenPartsCatalog}
            className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-blue-100">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Parts Master Catalog
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Documentation
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                LINX common 8810+ database, 8940 Spectrum, UBS high-res, and Rynan TIJ technical parts specs.
              </p>
            </div>
            <div className="flex items-center text-blue-700 font-bold text-xs mt-4 group-hover:translate-x-1 transition-transform">
              <span>Browse Parts Documentation</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Store Room Inventory or Engineer Bag */}
          {isStore || isAdmin ? (
            <button
              onClick={onOpenStoreInventory}
              className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-purple-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-purple-100">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                    Store Room Inventory
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Warehouse
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Central inventory management, restock logs, Excel bulk imports, and allocations to field engineers.
                </p>
              </div>
              <div className="flex items-center text-purple-700 font-bold text-xs mt-4 group-hover:translate-x-1 transition-transform">
                <span>Manage Warehouse Inventory</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenEngineerBag}
              className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#E61C24] hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-purple-100">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                    My Bag Inventory
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Engineer
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Personal van stock, parts in hand, quick installation, and store room return requests.
                </p>
              </div>
              <div className="flex items-center text-purple-700 font-bold text-xs mt-4 group-hover:translate-x-1 transition-transform">
                <span>View Bag Stock</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          )}

          {/* Testing / Backup Tracker */}
          <button
            onClick={onOpenTestingTracker}
            className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-amber-500 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-amber-100">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Testing & Backup Spares
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Loaned
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Track parts currently left at customer sites on trial, pending customer purchase or retrieval.
              </p>
            </div>
            <div className="flex items-center text-amber-700 font-bold text-xs mt-4 group-hover:translate-x-1 transition-transform">
              <span>View Loaned Spares</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Weekly Report Timesheets */}
          <button
            onClick={onViewReport}
            className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-blue-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  Weekly Report
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Timesheets
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Company weekly timesheet submission, job times, travel calculation, and Excel export.
              </p>
            </div>
            <div className="flex items-center text-blue-700 font-bold text-xs mt-4 group-hover:translate-x-1 transition-transform">
              <span>Open Weekly Timesheet</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

        </div>
      </div>

      {/* Recent Activity Table for Desktop */}
      {!isStore && recentEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Recent Field Work Logs
              </h3>
              <p className="text-xs text-gray-500">Latest entries submitted this week</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onExport}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={onViewReport}
                className="text-xs font-bold text-[#E61C24] hover:underline flex items-center"
              >
                <span>View Full Timesheet</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase font-black tracking-wider border-b border-gray-100 text-[10px]">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Customer / Site</th>
                  <th className="px-6 py-3">Work Category</th>
                  <th className="px-6 py-3">Job Duration</th>
                  <th className="px-6 py-3">Travel Duration</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEntries.map(entry => {
                  const totals = calculateEntryTotals(entry);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                        {format(parseISO(entry.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-900">
                        {entry.customerName || '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                          {entry.workType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-700">
                        {formatDuration(totals.job)}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-700">
                        {formatDuration(totals.travel)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={onViewReport}
                          className="text-[#E61C24] hover:underline font-bold text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
