const fs = require('fs');
const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/\{currentView === 'partsCatalog' && \(/, "{currentView === 'partsCatalog' && canAccessModule(profile, 'inventory') && (");
c = c.replace(/\{currentView === 'engineerParts' && \(/, "{currentView === 'engineerParts' && canAccessModule(profile, 'engineerBag') && (");
c = c.replace(/\{currentView === 'storeInventory' && \(/, "{currentView === 'storeInventory' && canAccessModule(profile, 'inventory') && (");
c = c.replace(/\{currentView === 'testingBackup' && \(/, "{currentView === 'testingBackup' && canAccessModule(profile, 'partsIssue') && (");
c = c.replace(/\{currentView === 'clientMachines' && \(/, "{currentView === 'clientMachines' && canAccessModule(profile, 'machines') && (");
c = c.replace(/\{currentView === 'workshop' && \(/, "{currentView === 'workshop' && canAccessModule(profile, 'workshop') && (");
c = c.replace(/\{currentView === 'report' && \(/, "{currentView === 'report' && canAccessModule(profile, 'reports') && (");
c = c.replace(/\{currentView === 'admin' && profile\.role === 'ADMIN' && \(/, "{currentView === 'admin' && canAccessModule(profile, 'users') && (");
// Note: workEntries logic. The 'form' is for work log. Service report form is 'serviceReportForm'
c = c.replace(/\{currentView === 'form' && \(/, "{currentView === 'form' && canAccessModule(profile, 'workEntries') && (");
c = c.replace(/\{currentView === 'serviceReportForm' && \(/, "{currentView === 'serviceReportForm' && canAccessModule(profile, 'serviceReports') && (");

fs.writeFileSync(p, c);
