import reliableLogo from '../assets/reliable-app-icon.png';
import React, { useEffect, useState } from 'react';
import { canAccessModule } from '../utils/permissions';
import { 
  Home, 
  Printer, 
  Building2, 
  FileText, 
  Package, 
  Briefcase, 
  Warehouse, 
  Activity, 
  FileSpreadsheet, 
  ShieldCheck, 
  DatabaseBackup, 
  UploadCloud, 
  LogOut, 
  PlusCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { offlineDb } from '../db/indexedDb';
import { syncPendingQueue } from '../utils/syncManager';

interface DesktopSidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  profile: UserProfile;
  logout: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onAddEntry: () => void;
}

export function DesktopSidebar({
  currentView,
  setCurrentView,
  profile,
  logout,
  onBackup,
  onRestore,
  onAddEntry
}: DesktopSidebarProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

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

  const handleTriggerSync = async () => {
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

  const isStore = profile.role === 'STORE';
  const isAdmin = profile.role === 'ADMIN';

  const NavItem = ({
    view,
    icon: Icon,
    label,
    badge,
    badgeColor = 'bg-gray-700 text-gray-300'
  }: {
    view: ViewState;
    icon: any;
    label: string;
    badge?: string | number;
    badgeColor?: string;
  }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${
          isActive
            ? 'bg-[#E61C24] text-white shadow-md shadow-red-900/20'
            : 'text-gray-300 hover:text-white hover:bg-slate-800/80'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon
            className={`w-4 h-4 transition-transform group-hover:scale-110 ${
              isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`}
          />
          <span>{label}</span>
        </div>
        {badge !== undefined && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : badgeColor}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-[#0B132B] text-slate-200 border-r border-slate-800 z-30 select-none">
      
      {/* Brand & Organization Header */}
      <div className="p-5 border-b border-slate-800/80 bg-[#0B132B]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 relative bg-white rounded-xl p-1 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <img src={reliableLogo} alt="Reliable Logo" className="w-full h-full object-contain" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center space-x-1.5">
              <span className="text-[#E61C24] font-black text-sm tracking-wider uppercase">Reliable</span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/60 font-black px-1.5 py-0.2 rounded">CRM</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold truncate">Industrial Coding Systems</p>
          </div>
        </div>

        {canAccessModule(profile, 'workEntries') && (
<> {/* Quick Action Button for Desktop */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <button
            onClick={onAddEntry}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-red-600 to-[#E61C24] hover:from-red-700 hover:to-red-600 text-white rounded-xl font-black text-xs shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>LOG WORK ENTRY</span>
          </button>
        </div>
        </>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
        
        {/* Core Operations */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Field Operations
          </p>
          <NavItem view="dashboard" icon={Home} label="Dashboard" />
          {canAccessModule(profile, 'workEntries') && <NavItem view="form" icon={Clock} label="Daily Work Log" />}
          {canAccessModule(profile, 'workshop') && <NavItem view="workshop" icon={Wrench} label="Workshop Machines" />}
        </div>

        {/* Clients & Machines CRM */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Assets & CRM
          </p>
          {canAccessModule(profile, 'machines') && (
          <NavItem 
             view="clientMachines" 
             icon={Printer} 
             label="Equipment & Clients" 
             badge="CRM"
            badgeColor="bg-emerald-950 text-emerald-300 border border-emerald-800/50"
          />
          )}
          {canAccessModule(profile, 'partsIssue') && <NavItem view="testingBackup" icon={Activity} label="Testing & Backup Parts" />}
        </div>

        {/* Inventory & Parts */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Parts & Warehousing
          </p>
          {canAccessModule(profile, 'inventory') && <NavItem view="partsCatalog" icon={Package} label="Parts Master Catalog" />}
          <NavItem view="engineerParts" icon={Briefcase} label="My Bag Stock" />
          {canAccessModule(profile, 'inventory') && (
            <NavItem 
               view="storeInventory" 
               icon={Warehouse} 
               label="Store Inventory" 
               badge="STORE"
              badgeColor="bg-purple-950 text-purple-300 border border-purple-800/50"
            />
          )}
        </div>

        {/* Reporting & Administration */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Reports & Admin
          </p>
          {canAccessModule(profile, 'reports') && <NavItem view="report" icon={FileSpreadsheet} label="Weekly Report" />}
          {canAccessModule(profile, 'users') && (
            <NavItem 
               view="admin" 
               icon={ShieldCheck} 
               label="Admin User Control" 
               badge="ADMIN"
              badgeColor="bg-red-950 text-red-300 border border-red-800/50"
            />
          )}
        </div>

        {/* Database Utilities */}
        <div className="space-y-1 pt-2 border-t border-slate-800/60">
          <button
            onClick={onBackup}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-xs transition-colors"
          >
            <DatabaseBackup className="w-4 h-4 text-slate-400" />
            <span>Backup Local DB</span>
          </button>

          <button
            onClick={onRestore}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium text-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-slate-400" />
            <span>Restore Backup</span>
          </button>
        </div>

      </div>

      {/* User Profile & Network Sync Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
        
        {/* Offline / Cloud Sync Status Card */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
            <span className="font-bold text-slate-300">
              {isOnline ? 'Online (Cloud)' : 'Offline (Local)'}
            </span>
          </div>

          {pendingCount > 0 ? (
            <button
              onClick={handleTriggerSync}
              disabled={!isOnline || syncing}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black hover:bg-amber-500/30 transition-all"
              title="Click to sync pending records"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} Pending</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Synced</span>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-slate-700 text-white font-black text-xs flex items-center justify-center shrink-0">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white text-xs truncate leading-tight">
                {profile.fullName}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                {isAdmin ? 'Administrator' : isStore ? 'Store Manager' : 'Field Engineer'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </aside>
  );
}
