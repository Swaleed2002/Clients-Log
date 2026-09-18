import re

with open('src/components/ClientMachines.tsx', 'r') as f:
    content = f.read()

imports_find = """import { 
  Building2, 
  Plus, """

imports_repl = """import { WorkshopCase } from '../types';
import { 
  Building2, 
  Plus, """

content = content.replace(imports_find, imports_repl)

state_find = """  const [formBrand, setFormBrand] = useState<PrinterBrand>('LINX');"""

state_repl = """  const [workshopCases, setWorkshopCases] = useState<WorkshopCase[]>([]);
  const [formBrand, setFormBrand] = useState<PrinterBrand>('LINX');"""

content = content.replace(state_find, state_repl)

effect_find = """    const qRep = query(collection(db, 'serviceReports'), orderBy('createdAt', 'desc'));
    const unsubRep = onSnapshot(qRep, (snap) => {
      const list: ServiceReport[] = [];"""

effect_repl = """    const qWs = query(collection(db, 'workshopCases'), orderBy('receivedAt', 'desc'));
    const unsubWs = onSnapshot(qWs, (snap) => {
      const list: WorkshopCase[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as WorkshopCase));
      setWorkshopCases(list);
    });

    const qRep = query(collection(db, 'serviceReports'), orderBy('createdAt', 'desc'));
    const unsubRep = onSnapshot(qRep, (snap) => {
      const list: ServiceReport[] = [];"""

content = content.replace(effect_find, effect_repl)

effect_ret_find = """    return () => {
      unsubTx();
      unsubRep();
    };"""

effect_ret_repl = """    return () => {
      unsubTx();
      unsubRep();
      unsubWs();
    };"""

content = content.replace(effect_ret_find, effect_ret_repl)

ui_find = """                  {/* Machine Parts Replacement History */}"""

ui_repl = """                  {/* Workshop History */}
                  <div className="space-y-3 pt-3">
                    <h4 className="text-sm font-bold flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-emerald-600" /> Workshop History
                    </h4>
                    {workshopCases.filter(ws => ws.machineId === selectedMachine.id).map(ws => (
                      <article key={ws.id} className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3 space-y-2 text-sm">
                        <div className="flex justify-between items-start">
                          <p className="font-black text-emerald-900">{ws.caseNumber} · {new Date(ws.receivedAt).toLocaleDateString()}</p>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{ws.status}</span>
                        </div>
                        <p className="whitespace-pre-wrap"><span className="font-semibold">Complaint:</span> {ws.complaint}</p>
                        <p><span className="font-semibold">Engineers:</span> {Array.from(new Set([ws.receivedByName, ...ws.activities.map(a => a.engineerName)])).join(', ')}</p>
                        {ws.finalResult && <p><span className="font-semibold">Result:</span> {ws.finalResult}</p>}
                      </article>
                    ))}
                    {workshopCases.filter(ws => ws.machineId === selectedMachine.id).length === 0 && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-dashed">No workshop cases for this machine.</p>
                    )}
                  </div>

                  {/* Machine Parts Replacement History */}"""

content = content.replace(ui_find, ui_repl)

lucide_find = """  History, 
  CheckCircle2, 
  X,
  Printer,
  FileSpreadsheet,
  Droplet,
  ChevronRight,
  Database,
  Activity,
  UploadCloud,
  FileDown,
  Wrench"""

lucide_repl = """  History, 
  CheckCircle2, 
  X,
  Printer,
  FileSpreadsheet,
  Droplet,
  ChevronRight,
  Database,
  Activity,
  UploadCloud,
  FileDown,
  Wrench,
  Settings"""

content = content.replace(lucide_find, lucide_repl)

with open('src/components/ClientMachines.tsx', 'w') as f:
    f.write(content)

print("Patched ClientMachines.tsx")
