const fs = require('fs');
const storePath = './src/components/StoreInventory.tsx';
let code = fs.readFileSync(storePath, 'utf8');

// Ensure we have WorkshopCase imported
if (!code.includes('WorkshopCase')) {
  code = code.replace("import { \n  StoreInventoryItem,", "import { \n  WorkshopCase,\n  StoreInventoryItem,");
}

// Add state for clients, machines, workshopCases
const stateHtml = `
  const [clients, setClients] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [workshopCases, setWorkshopCases] = useState<WorkshopCase[]>([]);

  // Form states for Issue
  const [issueFor, setIssueFor] = useState<'ENGINEER_BAG' | 'CUSTOMER' | 'WORKSHOP'>('ENGINEER_BAG');
  const [issueClientId, setIssueClientId] = useState('');
  const [issueMachineId, setIssueMachineId] = useState('');
  const [issueWorkshopCaseId, setIssueWorkshopCaseId] = useState('');
`;
code = code.replace("  // Form states for Issue to Engineer\n", stateHtml);

const effectHtml = `
  useEffect(() => {
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubMachines = onSnapshot(collection(db, 'customerMachines'), (snap) => {
      setMachines(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubWorkshop = onSnapshot(collection(db, 'workshopCases'), (snap) => {
      const cases = snap.docs.map(d => ({ ...d.data(), id: d.id } as WorkshopCase));
      setWorkshopCases(cases.filter(c => c.status !== 'Returned to Customer'));
    });
    return () => {
      unsubClients();
      unsubMachines();
      unsubWorkshop();
    }
  }, []);
`;
code = code.replace("  useEffect(() => {", effectHtml + "  useEffect(() => {");

fs.writeFileSync(storePath, code);
console.log('Patched StoreInventory.tsx State successfully');
