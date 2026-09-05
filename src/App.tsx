import React, { useState, useRef, useEffect } from 'react';
import { useWorkEntries } from './hooks/useWorkEntries';
import { Dashboard } from './components/Dashboard';
import { WorkEntryForm } from './components/WorkEntryForm';
import { WeeklyReport } from './components/WeeklyReport';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { exportToExcel } from './utils';
import { WorkEntry, ViewState } from './types';
import { DatabaseBackup, UploadCloud, LogOut, ShieldCheck, Home, PlusCircle, FileSpreadsheet, Settings } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { HeaderMinimal } from './components/Brand';

export default function App() {
  const { user, profile, loading, logout } = useAuth();
  
  // We only initialize work entries hook if we have a user
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
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When auth changes, reset view
  useEffect(() => {
    if (user && currentView === 'login') {
      setCurrentView('dashboard');
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-gray-500">Loading Application...</div>;
  }

  if (!user || !profile) {
    return <Login onSuccess={() => setCurrentView('dashboard')} />;
  }

  const handleAddEntry = () => {
    setEditingEntry(undefined);
    setCurrentView('form');
  };

  const handleEditEntry = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setCurrentView('form');
  };

  const handleSaveEntry = (entryData: Omit<WorkEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, entryData);
    } else {
      addEntry(entryData);
    }
  };

  const handleExport = (entriesToExport: WorkEntry[], weekStart: Date) => {
    // Pass undefined for userMap since it exports own entries, but pass profile for Header Info
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
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#E61C24]' : 'text-gray-500 hover:text-gray-900'}`}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'fill-red-50' : ''}`} />
        <span className="text-[10px] font-bold tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col relative pb-20">
      {currentView !== 'login' && currentView !== 'admin' && (
        <HeaderMinimal />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        {currentView === 'dashboard' && (
          <Dashboard 
            entries={entries}
            onAddEntry={handleAddEntry}
            onViewReport={() => setCurrentView('report')}
            onExport={() => handleExport(entries, new Date())}
            profile={profile}
          />
        )}
        
        {currentView === 'form' && (
          <WorkEntryForm 
            initialData={editingEntry}
            onSave={handleSaveEntry}
            onCancel={() => setCurrentView(editingEntry ? 'report' : 'dashboard')}
            uniqueCustomers={getUniqueCustomers()}
            uniqueLocations={getUniqueLocations()}
          />
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
      </div>

      {/* Bottom Navigation */}
      {currentView !== 'login' && currentView !== 'admin' && currentView !== 'form' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <NavItem view="dashboard" icon={Home} label="HOME" />
          
          <button 
            onClick={handleAddEntry}
            className="relative -top-5 flex flex-col items-center justify-center"
          >
            <div className="w-14 h-14 bg-[#E61C24] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 border-4 border-gray-50">
              <PlusCircle className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-bold text-gray-700 mt-1 tracking-wider">ADD</span>
          </button>
          
          <NavItem view="report" icon={FileSpreadsheet} label="REPORT" />
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex flex-col items-center justify-center h-full w-full space-y-1 ${showSettings ? 'text-[#E61C24]' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Settings className={`w-6 h-6 ${showSettings ? 'fill-red-50' : ''}`} />
            <span className="text-[10px] font-bold tracking-wider">MORE</span>
          </button>
        </div>
      )}

      {/* Settings Modal overlay */}
      {showSettings && currentView !== 'admin' && currentView !== 'form' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div 
            className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-xl w-64 overflow-hidden animate-in slide-in-from-bottom-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Logged in as</p>
              <p className="text-sm font-bold text-gray-900">{profile.fullName}</p>
            </div>
            <div className="p-2 space-y-1">
              {profile.role === 'ADMIN' && (
                <button 
                  onClick={() => { setShowSettings(false); setCurrentView('admin'); }}
                  className="w-full flex items-center p-3 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  <ShieldCheck className="w-5 h-5 mr-3 text-purple-600" /> Admin Panel
                </button>
              )}
              <button 
                onClick={backupData}
                className="w-full flex items-center p-3 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <DatabaseBackup className="w-5 h-5 mr-3 text-blue-600" /> Backup Data
              </button>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              <button 
                onClick={handleRestoreClick}
                className="w-full flex items-center p-3 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <UploadCloud className="w-5 h-5 mr-3 text-emerald-600" /> Restore Data
              </button>
              
              <div className="h-px bg-gray-100 my-2"></div>
              
              <button 
                onClick={logout}
                className="w-full flex items-center p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-5 h-5 mr-3" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
