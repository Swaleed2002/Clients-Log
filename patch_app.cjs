const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Imports
const searchImport = "import { AdminPanel } from './components/AdminPanel';";
const replacementImport = "import { AdminPanel } from './components/AdminPanel';\nimport { ServiceReportsList } from './components/ServiceReportsList';\nimport { ServiceReportForm } from './components/ServiceReportForm';";
if (!content.includes('ServiceReportsList')) {
  content = content.replace(searchImport, replacementImport);
}

// State for active ServiceReport
const searchState = "const [editingEntry, setEditingEntry] = useState<WorkEntry | undefined>();";
const replacementState = "const [editingEntry, setEditingEntry] = useState<WorkEntry | undefined>();\n  const [activeServiceReport, setActiveServiceReport] = useState<any>(undefined);";
if (!content.includes('activeServiceReport')) {
  content = content.replace(searchState, replacementState);
}

// Rendering components
const searchRender = "{currentView === 'report' && (";
const replacementRender = `{currentView === 'serviceReportsList' && (
          <ServiceReportsList 
            currentUser={profile}
            onBack={() => setCurrentView('dashboard')}
            onNew={() => {
              setActiveServiceReport(undefined);
              setCurrentView('serviceReportForm');
            }}
            onEdit={(report) => {
              setActiveServiceReport(report);
              setCurrentView('serviceReportForm');
            }}
          />
        )}

        {currentView === 'serviceReportForm' && (
          <ServiceReportForm 
            initialData={activeServiceReport}
            currentUser={profile}
            onBack={() => setCurrentView('serviceReportsList')}
            onSaved={() => setCurrentView('serviceReportsList')}
          />
        )}

        {currentView === 'report' && (`;
if (!content.includes("currentView === 'serviceReportsList'")) {
  content = content.replace(searchRender, replacementRender);
}

// Add navigation button to settings menu or a new icon in bottom bar. Let's add it to bottom bar.
// Look for <NavItem view="report" icon={FileSpreadsheet} label="REPORT" />
const searchNavItem = "<NavItem view=\"report\" icon={FileSpreadsheet} label=\"REPORT\" />";
// I need FileText from lucide-react. Let's check imports.
const searchLucide = "DatabaseBackup, UploadCloud, LogOut, ShieldCheck, Home, PlusCircle, FileSpreadsheet, Settings } from 'lucide-react';";
const replacementLucide = "DatabaseBackup, UploadCloud, LogOut, ShieldCheck, Home, PlusCircle, FileSpreadsheet, Settings, FileText } from 'lucide-react';";
if (content.includes(searchLucide) && !content.includes('FileText }')) {
  content = content.replace(searchLucide, replacementLucide);
}

const replacementNavItem = `<NavItem view="report" icon={FileSpreadsheet} label="REPORT" />
          <NavItem view="serviceReportsList" icon={FileText} label="SRV RPT" />`;
if (!content.includes('serviceReportsList" icon={FileText}')) {
  content = content.replace(searchNavItem, replacementNavItem);
}

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx successfully");
