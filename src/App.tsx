import React, { useState, useRef, useEffect } from 'react';
import { useWorkEntries } from './hooks/useWorkEntries';
import { Dashboard } from './components/Dashboard';
import { WorkEntryForm } from './components/WorkEntryForm';
import { WeeklyReport } from './components/WeeklyReport';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { PartsCatalog } from './components/PartsCatalog';
import { StoreInventory } from './components/StoreInventory';
import { EngineerParts } from './components/EngineerParts';
import { TestingBackupTracker } from './components/TestingBackupTracker';
import { ClientMachines } from './components/ClientMachines';
import { exportToExcel } from './utils';
import { WorkEntry, ViewState, EngineerBagItem, PartMasterItem, CustomerMachine } from './types';
import { 
  DatabaseBackup, 
  UploadCloud, 
  LogOut, 
  ShieldCheck, 
  Home, 
  PlusCircle, 
  FileSpreadsheet, 
  Settings, 
  FileText,
  Package,
  Warehouse,
  Briefcase,
  Activity,
  Printer,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { HeaderMinimal } from './components/Brand';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopTopBar } from './components/DesktopTopBar';

export default function App() {
  const { user, profile, loading, logout } = useAuth();
  
  const {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    backupData,
    restoreData,
    getUniqueCustomers,
    getUniqueLocations
  } = useWorkEntries(user?.uid);

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [editingEntry, setEditingEntry] = useState<WorkEntry | undefined>(undefined);
  const [entryMachine, setEntryMachine] = useState<CustomerMachine | undefined>();
  const [preselectedBagItem, setPreselectedBagItem] = useState<EngineerBagItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When auth changes or role is STORE, direct appropriately
  useEffect(() => {
    if (user && currentView === 'login') {
      setCurrentView('dashboard');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-gray-500">
        Loading Application...
      </div>
    );
  }

  if (!user || !profile) {
    return <Login onSuccess={() => setCurrentView('dashboard')} />;
  }

  const handleAddEntry = () => {
    setEditingEntry(undefined);
    setEntryMachine(undefined);
    setPreselectedBagItem(null);
    setCurrentView('form');
  };

  const handleEditEntry = (entry: WorkEntry) => {
    setEntryMachine(undefined);
    setPreselectedBagItem(null);
    setEditingEntry(entry);
    setCurrentView('form');
  };

  const handleSaveEntry = async (entryData: Omit<WorkEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, entryData);
    } else {
      await addEntry(entryData);
    }
  };

  const handleExport = (entriesToExport: WorkEntry[], weekStart: Date) => {
    exportToExcel(entriesToExport, weekStart, undefined, profile);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await restoreData(file);
        alert('Data restored successfully!');
      } catch (err) {
        alert('Failed to restore data. Make sure it is a valid backup file.');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const NavItem = ({ view, icon: Icon, label }: any) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setCurrentView(view)}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          isActive ? 'text-[#E61C24]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'fill-red-50' : ''}`} />
        <span className="text-[9px] font-black tracking-wider uppercase">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col md:flex-row relative">
      {/* Desktop Enterprise Left Sidebar */}
      {currentView !== 'login' && (
        <DesktopSidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          profile={profile}
          logout={logout}
          onBackup={backupData}
          onRestore={handleRestoreClick}
          onAddEntry={handleAddEntry}
        />
      )}

      {/* Main Content Area Container (with left padding on desktop to clear sidebar) */}
      <div className={`flex-1 flex flex-col min-h-screen ${currentView !== 'login' ? 'md:pl-64' : ''} pb-20 md:pb-8`}>
        {/* Desktop Top Header Bar */}
        {currentView !== 'login' && (
          <DesktopTopBar
            currentView={currentView}
            setCurrentView={setCurrentView}
            profile={profile}
            onAddEntry={handleAddEntry}
          />
        )}

        {/* Mobile Header (Hidden on Desktop) */}
        {currentView !== 'login' && currentView !== 'admin' && currentView !== 'serviceReportForm' && (
          <div className="md:hidden">
            <HeaderMinimal />
          </div>
        )}

        {/* Main Content Router */}
        <main className="flex-1 overflow-x-hidden">
          {currentView === 'dashboard' && (
          <Dashboard 
            entries={entries}
            onAddEntry={handleAddEntry}
            onViewReport={() => setCurrentView('report')}
            onExport={() => handleExport(entries, new Date())}
            onOpenServiceReports={handleAddEntry}
            onOpenPartsCatalog={() => setCurrentView('partsCatalog')}
            onOpenStoreInventory={() => setCurrentView('storeInventory')}
            onOpenEngineerBag={() => setCurrentView('engineerParts')}
            onOpenTestingTracker={() => setCurrentView('testingBackup')}
            onOpenClientMachines={() => setCurrentView('clientMachines')}
            profile={profile}
          />
        )}
        
        {currentView === 'form' && (
          <WorkEntryForm 
            technicianName={profile.fullName}
            machine={entryMachine}
            initialPart={preselectedBagItem ? { partId: preselectedBagItem.partId, partNumber: preselectedBagItem.partNumber, description: preselectedBagItem.description, quantity: 1, source: preselectedBagItem.id.startsWith('temp_') ? 'OTHER' : 'MY BAG', condition: preselectedBagItem.condition } : undefined}
            initialData={editingEntry}
            onSave={handleSaveEntry}
            onCancel={() => setCurrentView(editingEntry ? 'report' : 'dashboard')}
            uniqueCustomers={getUniqueCustomers()}
            uniqueLocations={getUniqueLocations()}
          />
        )}
        
        {currentView === 'partsCatalog' && (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-4 flex items-center">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO DASHBOARD
              </button>
            </div>
            <PartsCatalog 
              currentUser={profile}
              onSelectPartForReport={(part: PartMasterItem) => {
                handleAddEntry();
                setPreselectedBagItem({
                  id: `temp_${part.partNumber}`,
                  engineerId: profile.userId,
                  engineerName: profile.fullName,
                  partId: part.partNumber,
                  partNumber: part.partNumber,
                  description: part.description,
                  brand: part.brand,
                  quantity: 1,
                  condition: 'New',
                  updatedAt: Date.now()
                });
                setCurrentView('form');
              }}
              onRequestFromStore={(part: PartMasterItem) => {
                setCurrentView('storeInventory');
              }}
            />
          </div>
        )}

        {currentView === 'storeInventory' && (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-4 flex items-center">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO DASHBOARD
              </button>
            </div>
            <StoreInventory currentUser={profile} />
          </div>
        )}

        {currentView === 'engineerParts' && (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-4 flex items-center">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO DASHBOARD
              </button>
            </div>
            <EngineerParts 
              currentUser={profile}
              onOpenServiceReport={(bagItem: EngineerBagItem) => {
                handleAddEntry();
                setPreselectedBagItem(bagItem);
                setCurrentView('form');
              }}
              onOpenCatalog={() => setCurrentView('partsCatalog')}
            />
          </div>
        )}

        {currentView === 'testingBackup' && (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-4 flex items-center">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO DASHBOARD
              </button>
            </div>
            <TestingBackupTracker currentUser={profile} />
          </div>
        )}

        {currentView === 'clientMachines' && (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-4 flex items-center">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO DASHBOARD
              </button>
            </div>
            <ClientMachines 
              currentUser={profile} 
              onOpenServiceReport={(machine) => {
                handleAddEntry();
                setEntryMachine(machine);
                setCurrentView('form');
              }}
            />
          </div>
        )}

        {currentView === 'report' && (
          <WeeklyReport 
            entries={entries}
            onBack={() => setCurrentView('dashboard')}
            onEdit={handleEditEntry}
            onDelete={deleteEntry}
            onExport={handleExport}
          />
        )}
        
        {currentView === 'admin' && profile.role === 'ADMIN' && (
          <AdminPanel 
            onBack={() => setCurrentView('dashboard')}
            currentUser={profile}
          />
        )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible ONLY on mobile) */}
      {currentView !== 'login' && currentView !== 'admin' && currentView !== 'form' && currentView !== 'serviceReportForm' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <NavItem view="dashboard" icon={Home} label="HOME" />

          
          <button 
            onClick={handleAddEntry}
            className="relative -top-4 flex flex-col items-center justify-center"
            title="Log Work Entry"
          >
            <div className="w-13 h-13 bg-[#E61C24] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 border-4 border-gray-50 p-3 hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-gray-700 mt-0.5 tracking-wider uppercase">LOG</span>
          </button>
          
          <NavItem view="partsCatalog" icon={Package} label="PARTS" />
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex flex-col items-center justify-center h-full w-full space-y-1 ${
              showSettings ? 'text-[#E61C24]' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Settings className={`w-5 h-5 ${showSettings ? 'fill-red-50' : ''}`} />
            <span className="text-[9px] font-black tracking-wider uppercase">MORE</span>
          </button>
        </div>
      )}

      {/* More / Settings Menu Modal */}
      {showSettings && currentView !== 'admin' && currentView !== 'form' && currentView !== 'serviceReportForm' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div 
            className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-xl w-72 overflow-hidden animate-in slide-in-from-bottom-4 border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Logged in as</p>
              <p className="text-sm font-black text-gray-900">{profile.fullName}</p>
              <span className="text-[10px] font-bold text-[#E61C24] uppercase">
                {profile.role === 'ADMIN' ? 'Administrator' : profile.role === 'STORE' ? 'Store Manager' : 'Field Engineer'}
              </span>
            </div>
            
            <div className="p-2 space-y-1 text-xs">
              {/* Module Shortcuts */}
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('partsCatalog'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Package className="w-4 h-4 mr-2.5 text-blue-600" /> Parts Master Catalog
              </button>

              <button 
                onClick={() => { setShowSettings(false); setCurrentView('engineerParts'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Briefcase className="w-4 h-4 mr-2.5 text-emerald-600" /> Engineer Bag Stock
              </button>

              {(profile.role === 'STORE' || profile.role === 'ADMIN') && (
                <button 
                  onClick={() => { setShowSettings(false); setCurrentView('storeInventory'); }}
                  className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  <Warehouse className="w-4 h-4 mr-2.5 text-purple-600" /> Store Room Inventory
                </button>
              )}

              <button 
                onClick={() => { setShowSettings(false); setCurrentView('testingBackup'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Activity className="w-4 h-4 mr-2.5 text-amber-600" /> Testing & Backup Tracker
              </button>

              <button 
                onClick={() => { setShowSettings(false); setCurrentView('clientMachines'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Printer className="w-4 h-4 mr-2.5 text-emerald-600" /> Equipment Registry & History
              </button>

              <button 
                onClick={() => { setShowSettings(false); setCurrentView('report'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2.5 text-blue-500" /> Weekly Timesheets
              </button>

              <div className="h-px bg-gray-100 my-1.5"></div>

              {profile.role === 'ADMIN' && (
                <button 
                  onClick={() => { setShowSettings(false); setCurrentView('admin'); }}
                  className="w-full flex items-center p-2.5 font-bold text-purple-700 hover:bg-purple-50 rounded-xl"
                >
                  <ShieldCheck className="w-4 h-4 mr-2.5 text-purple-600" /> Admin User Management
                </button>
              )}

              <button 
                onClick={backupData}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <DatabaseBackup className="w-4 h-4 mr-2.5 text-gray-500" /> Backup Data
              </button>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              <button 
                onClick={handleRestoreClick}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <UploadCloud className="w-4 h-4 mr-2.5 text-gray-500" /> Restore Data
              </button>
              
              <div className="h-px bg-gray-100 my-1.5"></div>
              
              <button 
                onClick={logout}
                className="w-full flex items-center p-2.5 font-bold text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
