const fs = require('fs');
const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

const effectCode = `  useEffect(() => {
    if (!profile) return;
    
    let allowed = true;
    switch (currentView) {
      case 'partsCatalog':
      case 'storeInventory':
        allowed = canAccessModule(profile, 'inventory');
        break;
      case 'engineerParts':
        allowed = canAccessModule(profile, 'engineerBag');
        break;
      case 'testingBackup':
        allowed = canAccessModule(profile, 'partsIssue');
        break;
      case 'clientMachines':
        allowed = canAccessModule(profile, 'machines');
        break;
      case 'workshop':
        allowed = canAccessModule(profile, 'workshop');
        break;
      case 'report':
        allowed = canAccessModule(profile, 'reports');
        break;
      case 'admin':
        allowed = canAccessModule(profile, 'users');
        break;
      case 'form':
        allowed = canAccessModule(profile, 'workEntries');
        break;
      case 'serviceReportForm':
        allowed = canAccessModule(profile, 'serviceReports');
        break;
    }
    
    if (!allowed) {
      setCurrentView('dashboard');
    }
  }, [currentView, profile]);
`;

c = c.replace("useEffect(() => {", effectCode + "\n  useEffect(() => {");
fs.writeFileSync(p, c);
