const fs = require('fs');
const p = './src/components/Dashboard.tsx';
let c = fs.readFileSync(p, 'utf8');

const mobileMenu = `
        <div className="grid grid-cols-3 gap-2">
          {canAccessModule(currentUser, 'clients') && (
            <button
              onClick={onOpenClientMachines}
              className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
            >
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-black uppercase">My Clients</span>
            </button>
          )}
          {canAccessModule(currentUser, 'machines') && (
            <button
              onClick={onOpenClientMachines}
              className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
            >
              <Printer className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase">Machines</span>
            </button>
          )}
          {canAccessModule(currentUser, 'engineerBag') && (
            <button
              onClick={onOpenEngineerBag}
              className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
            >
              <Briefcase className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] font-black uppercase">My Bag</span>
            </button>
          )}
          {canAccessModule(currentUser, 'machines') && ( // Assuming testing/backup falls under testing/machines
            <button
              onClick={onOpenTestingTracker}
              className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all"
            >
              <Activity className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-black uppercase">Testing Parts</span>
            </button>
          )}
        </div>
`;

c = c.replace(/<div className="grid grid-cols-3 gap-2">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* KPI Metrics Row \*\/\}/, mobileMenu.trim() + "\n      </div>\n      {/* KPI Metrics Row */}");

fs.writeFileSync(p, c);
