const fs = require('fs');
const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

const regexSettingsMenu = /<div className="p-2 space-y-1 text-xs">[\s\S]*?<input type="file" ref=\{fileInputRef\}/;

const fixedSettingsMenu = `<div className="p-2 space-y-1 text-xs">
              {/* Module Shortcuts */}
              {canAccessModule(profile, 'inventory') && (
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('partsCatalog'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Package className="w-4 h-4 mr-2.5 text-blue-600" /> Parts Master Catalog
              </button>
              )}
              {canAccessModule(profile, 'engineerBag') && (
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('engineerParts'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Briefcase className="w-4 h-4 mr-2.5 text-emerald-600" /> Engineer Bag Stock
              </button>
              )}
              {canAccessModule(profile, 'inventory') && (
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('storeInventory'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Warehouse className="w-4 h-4 mr-2.5 text-purple-600" /> Store Room Inventory
              </button>
              )}
              {canAccessModule(profile, 'partsIssue') && (
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('testingBackup'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Activity className="w-4 h-4 mr-2.5 text-amber-600" /> Testing & Backup Tracker
              </button>
              )}
              {canAccessModule(profile, 'machines') && (
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('clientMachines'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Printer className="w-4 h-4 mr-2.5 text-emerald-600" /> Equipment Registry & History
              </button>
              )}
              {canAccessModule(profile, 'reports') && (
              <button 
                onClick={() => { setShowSettings(false); setCurrentView('report'); }}
                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2.5 text-blue-500" /> Weekly Timesheets
              </button>
              )}
              
              <div className="h-px bg-gray-100 my-1.5"></div>
              
              {canAccessModule(profile, 'users') && (
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
              
              <input type="file" ref={fileInputRef}`;

c = c.replace(regexSettingsMenu, fixedSettingsMenu);
fs.writeFileSync(p, c);
