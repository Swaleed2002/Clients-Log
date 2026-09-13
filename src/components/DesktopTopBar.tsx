import React from 'react';
import { ViewState, UserProfile } from '../types';
import { 
  Home, 
  Printer, 
  FileText, 
  Package, 
  Briefcase, 
  Warehouse, 
  Activity, 
  FileSpreadsheet, 
  ShieldCheck, 
  Clock,
  Plus,
  Sparkles,
  Search,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

interface DesktopTopBarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  profile: UserProfile;
  onAddEntry: () => void;
}

const VIEW_TITLES: Record<ViewState, { title: string; subtitle: string; icon: any }> = {
  dashboard: {
    title: 'Operations Dashboard',
    subtitle: 'System overview, field activity & quick access metrics',
    icon: Home
  },
  clientMachines: {
    title: 'Equipment & Clients CRM',
    subtitle: 'Installed printer fleet, mandatory consumables & maintenance records',
    icon: Printer
  },
  serviceReportsList: {
    title: 'Service Reports & Work Orders',
    subtitle: 'Official field service reports, customer signoffs & parts used',
    icon: FileText
  },
  serviceReportForm: {
    title: 'Service Report Document',
    subtitle: 'Structured field work order with digital customer signature',
    icon: FileText
  },
  form: {
    title: 'Daily Work Log',
    subtitle: 'Job entry form, travel tracking & work notes',
    icon: Clock
  },
  partsCatalog: {
    title: 'Spare Parts Master Catalog',
    subtitle: 'LINX, UBS & RYNAN parts specifications and documentation',
    icon: Package
  },
  partsSearch: {
    title: 'Spare Parts Search',
    subtitle: 'Search parts specifications and documentation',
    icon: Package
  },
  engineerParts: {
    title: 'Engineer Bag Inventory',
    subtitle: 'Personal boot stock, van inventory and allocated spares',
    icon: Briefcase
  },
  storeInventory: {
    title: 'Central Store Room Inventory',
    subtitle: 'Warehouse stock levels, check-in, restock & engineer allocations',
    icon: Warehouse
  },
  testingBackup: {
    title: 'Testing & Backup Spares Tracker',
    subtitle: 'Components left at customer sites for trial or backup',
    icon: Activity
  },
  report: {
    title: 'Weekly Timesheet & Performance Report',
    subtitle: 'Official company weekly report generation and Excel export',
    icon: FileSpreadsheet
  },
  admin: {
    title: 'Admin Control Center',
    subtitle: 'User access levels, authorization & system settings',
    icon: ShieldCheck
  },
  login: {
    title: 'Authentication',
    subtitle: 'Sign in to access system',
    icon: ShieldCheck
  }
};

export function DesktopTopBar({
  currentView,
  setCurrentView,
  profile,
  onAddEntry
}: DesktopTopBarProps) {
  const currentInfo = VIEW_TITLES[currentView] || VIEW_TITLES.dashboard;
  const Icon = currentInfo.icon;

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      
      {/* Current Section & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200/80 shadow-sm">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-black text-gray-900 tracking-tight">
              {currentInfo.title}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              Enterprise CRM
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick actions & System Date */}
      <div className="flex items-center space-x-4">
        
        {/* Date Display */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-gray-500 font-semibold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{format(new Date(), 'EEEE, dd MMMM yyyy')}</span>
        </div>

        {/* Quick Log Button if not on form */}
        {currentView !== 'form' && currentView !== 'serviceReportForm' && (
          <button
            onClick={onAddEntry}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E61C24] hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Log</span>
          </button>
        )}

        {/* User Role Tag */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
          <div className="text-right">
            <p className="text-xs font-black text-gray-900 leading-tight">
              {profile.fullName}
            </p>
            <p className="text-[9px] font-bold text-[#E61C24] uppercase tracking-wider">
              {profile.role === 'ADMIN' ? 'Admin' : profile.role === 'STORE' ? 'Store Mgr' : 'Field Engg'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white text-xs font-black flex items-center justify-center shadow-sm">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

      </div>

    </header>
  );
}
