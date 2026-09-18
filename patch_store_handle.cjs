const fs = require('fs');
const storePath = './src/components/StoreInventory.tsx';
let code = fs.readFileSync(storePath, 'utf8');

const handleIssueBody = `
  const handleIssuePart = async (e: React.FormEvent) => {
    e.preventDefault();
    const invItem = inventory.find(i => i.id === issuePartId);
    if (!invItem) return alert('Select a part');

    if (issueQuantity > invItem.quantity) {
      if (!window.confirm(\`Store only has \${invItem.quantity} units recorded. Issue anyway?\`)) {
        return;
      }
    }

    const eng = engineers.find(e => e.userId === issueEngineerId);
    if (!eng) return alert('Select engineer');

    let destType: 'ENGINEER' | 'CUSTOMER_MACHINE' | 'WORKSHOP' = 'ENGINEER';
    let customerName = issueCustomerName;
    let customerId = '';
    let machineSerial = '';
    let destDetails = '';
    let wkMachine = undefined;

    if (issueFor === 'CUSTOMER') {
      const c = clients.find(c => c.id === issueClientId);
      const m = machines.find(m => m.id === issueMachineId);
      if (!c || !m) return alert('Select customer and machine');
      destType = 'CUSTOMER_MACHINE';
      customerName = c.name;
      customerId = c.id;
      machineSerial = m.serialNumber;
      destDetails = \`Machine: \${m.brand} \${m.model} (\${m.serialNumber})\`;
    } else if (issueFor === 'WORKSHOP') {
      const wk = workshopCases.find(w => w.id === issueWorkshopCaseId);
      if (!wk) return alert('Select workshop case');
      destType = 'WORKSHOP';
      customerName = wk.customerName;
      customerId = wk.customerId;
      machineSerial = wk.serialNumber;
      destDetails = \`Workshop Case: \${wk.caseNumber}\`;
      wkMachine = {
        machineType: 'Customer Machine',
        machineName: 'Workshop Repair',
        printerBrand: wk.brand,
        printerModel: wk.model,
        serialNumber: wk.serialNumber,
        customerId: wk.customerId,
        customerName: wk.customerName
      };
    } else {
      destType = 'ENGINEER';
    }

    try {
      const txRef = doc(collection(db, 'partTransactions'));
      const newTx = {
        id: txRef.id,
        partId: invItem.partId,
        partNumber: invItem.partNumber,
        description: invItem.description,
        brand: invItem.brand,
        sourceType: 'STORE',
        destinationType: destType,
        destinationDetails: destDetails,
        workshopMachine: wkMachine,
        engineerId: eng.userId,
        engineerName: eng.fullName,
        customerId: customerId,
        customerName: customerName,
        machineSerial: machineSerial,
        quantity: issueQuantity,
        condition: issueCondition,
        purpose: issuePurpose,
        status: destType === 'ENGINEER' ? 'WITH ENGINEER' : 'INSTALLED',
        remarks: issueRemarks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: currentUser.userId
      };

      await setDoc(txRef, newTx);
      await updateDoc(doc(db, 'inventory', invItem.id), {
        quantity: Math.max(0, invItem.quantity - issueQuantity),
        updatedAt: Date.now()
      });

      // If issue to engineer bag
      if (destType === 'ENGINEER') {
        const bagQuery = query(
          collection(db, 'engineerBags'),
          where('engineerId', '==', eng.userId),
          where('partId', '==', invItem.partId),
          where('condition', '==', issueCondition)
        );
        const bagSnap = await getDocs(bagQuery);
        if (!bagSnap.empty) {
          const bagItem = bagSnap.docs[0];
          await updateDoc(doc(db, 'engineerBags', bagItem.id), {
            quantity: bagItem.data().quantity + issueQuantity,
            updatedAt: Date.now()
          });
        } else {
          const newBagRef = doc(collection(db, 'engineerBags'));
          await setDoc(newBagRef, {
            id: newBagRef.id,
            engineerId: eng.userId,
            engineerName: eng.fullName,
            partId: invItem.partId,
            partNumber: invItem.partNumber,
            description: invItem.description,
            brand: invItem.brand,
            quantity: issueQuantity,
            condition: issueCondition,
            updatedAt: Date.now()
          });
        }
      }

      // Automatically log parts in WorkshopCase if issued to workshop
      if (destType === 'WORKSHOP' && issueWorkshopCaseId) {
        const wkRef = doc(db, 'workshopCases', issueWorkshopCaseId);
        const wk = workshopCases.find(w => w.id === issueWorkshopCaseId);
        if (wk) {
          const newActivity = {
            id: 'ACT_' + Date.now().toString(),
            uid: currentUser.userId,
            engineerId: currentUser.userId,
            engineerName: currentUser.fullName,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            workPerformed: \`Store Issued \${issueQuantity}x \${invItem.partNumber}\`,
            partsUsed: [{
              partId: invItem.partId,
              partNumber: invItem.partNumber,
              description: invItem.description,
              brand: invItem.brand,
              quantity: issueQuantity,
              source: 'STORE',
              condition: issueCondition,
              status: 'INSTALL'
            }]
          };
          await updateDoc(wkRef, {
            activities: [...(wk.activities || []), newActivity]
          });
        }
      }

      setShowIssuePartModal(false);
      setIssueCustomerName('');
      setIssueClientId('');
      setIssueMachineId('');
      setIssueWorkshopCaseId('');
      setIssueRemarks('');
      alert(\`Issued \${issueQuantity}x \${invItem.partNumber} to \${eng.fullName}.\`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to issue part: ' + err.message);
    }
  };
`;

code = code.replace(/const handleIssuePart = async \(e: React.FormEvent\) => \{[\s\S]*?catch \(err: any\) \{[\s\S]*?alert\('Failed to issue part: ' \+ err.message\);\s*\}\s*\};/, handleIssueBody);

fs.writeFileSync(storePath, code);
console.log('Patched handleIssuePart successfully');
