import React, { useState } from 'react';
import { UserProfile, WorkshopCase, WorkshopChecklistItem, WorkshopActivity } from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ChevronLeft, Save, CheckCircle2, AlertTriangle, Clock, Hammer, ShieldCheck, Truck } from 'lucide-react';
import { generateId } from '../../utils';

interface Props {
  workshopCase: WorkshopCase;
  currentUser: UserProfile;
  onBack: () => void;
}

export function WorkshopCaseDetail({ workshopCase, currentUser, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'repair' | 'dispatch'>('info');
  const isStore = currentUser.role === 'STORE' || currentUser.role === 'ADMIN';
  const isEngineer = currentUser.role === 'ENGINEER' || currentUser.role === 'ADMIN';

  // --- Store In Verification State ---
  const [inVerificationChecklist, setInVerificationChecklist] = useState<WorkshopChecklistItem[]>(workshopCase.incomingChecklist);
  const [storeInRemarks, setStoreInRemarks] = useState('');
  const [verifyingIn, setVerifyingIn] = useState(false);

  // --- Repair Activity State ---
  const [newWorkPerformed, setNewWorkPerformed] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  // --- Dispatch & Out State ---
  const [outgoingChecklist, setOutgoingChecklist] = useState<WorkshopChecklistItem[]>(workshopCase.outgoingChecklist.length > 0 ? workshopCase.outgoingChecklist : workshopCase.incomingChecklist);
  const [dispatchRemarks, setDispatchRemarks] = useState('');
  const [finalResult, setFinalResult] = useState('Repair Completed');
  
  const [verifyingOut, setVerifyingOut] = useState(false);
  const [storeOutRemarks, setStoreOutRemarks] = useState('');

  const handleStoreVerifyIn = async () => {
    setVerifyingIn(true);
    try {
      const auditEntry = {
        id: generateId(),
        uid: currentUser.userId,
        userName: currentUser.fullName,
        action: 'STORE_IN_VERIFIED',
        details: 'Store verified incoming machine condition.',
        timestamp: Date.now()
      };
      
      await updateDoc(doc(db, 'workshopCases', workshopCase.id), {
        status: 'In Workshop',
        incomingChecklist: inVerificationChecklist,
        storeInApprovedBy: currentUser.userId,
        storeInApprovedByName: currentUser.fullName,
        storeInApprovedAt: Date.now(),
        storeInRemarks: storeInRemarks.trim(),
        auditLog: arrayUnion(auditEntry)
      });
      // Will auto-update via snapshot
    } catch (e) {
      console.error(e);
      alert('Failed to verify');
    }
    setVerifyingIn(false);
  };

  const handleAddActivity = async () => {
    if (!newWorkPerformed.trim()) return;
    setAddingActivity(true);
    try {
      const activity: WorkshopActivity = {
        id: generateId(),
        uid: currentUser.userId,
        engineerId: currentUser.userId,
        engineerName: currentUser.fullName,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        workPerformed: newWorkPerformed.trim(),
        partsUsed: [] // TBD: Add parts integration
      };
      
      await updateDoc(doc(db, 'workshopCases', workshopCase.id), {
        status: 'Repair In Progress',
        activities: arrayUnion(activity)
      });
      setNewWorkPerformed('');
    } catch (e) {
      console.error(e);
      alert('Failed to add activity');
    }
    setAddingActivity(false);
  };

  const updateInVerifyChecklist = (id: string, field: string, value: any) => {
    setInVerificationChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateOutChecklist = (id: string, condition: any) => {
    setOutgoingChecklist(prev => prev.map(item => item.id === id ? { ...item, outgoingCondition: condition } : item));
  };

  const handleMarkReady = async () => {
    setVerifyingOut(true);
    try {
      const auditEntry = {
        id: generateId(),
        uid: currentUser.userId,
        userName: currentUser.fullName,
        action: 'READY_FOR_DISPATCH',
        details: 'Engineer marked machine ready for dispatch.',
        timestamp: Date.now()
      };
      
      await updateDoc(doc(db, 'workshopCases', workshopCase.id), {
        status: 'Awaiting Out Verification',
        outgoingChecklist,
        readyForDispatchAt: Date.now(),
        takenByUid: currentUser.userId,
        takenByName: currentUser.fullName,
        dispatchRemarks: dispatchRemarks.trim(),
        finalResult,
        auditLog: arrayUnion(auditEntry)
      });
    } catch (e) {
      console.error(e);
      alert('Failed to mark ready');
    }
    setVerifyingOut(false);
  };

  const handleStoreVerifyOut = async () => {
    // Check missing items validation
    const hasMissingWarning = outgoingChecklist.some(item => {
       const inCondition = item.storeVerifiedCondition || item.condition;
       const outCondition = item.outgoingCondition || item.storeVerifiedCondition || item.condition;
       return inCondition === 'OK / Present' && outCondition === 'Missing';
    });
    
    if (hasMissingWarning && !storeOutRemarks.trim()) {
      alert('You must provide Store Remarks explaining why previously present items are now missing at dispatch.');
      return;
    }

    setVerifyingOut(true);
    try {
      const auditEntry = {
        id: generateId(),
        uid: currentUser.userId,
        userName: currentUser.fullName,
        action: 'STORE_OUT_VERIFIED',
        details: 'Store verified outgoing machine condition and dispatched.',
        timestamp: Date.now()
      };
      
      await updateDoc(doc(db, 'workshopCases', workshopCase.id), {
        status: 'Returned to Customer',
        storeOutApprovedBy: currentUser.userId,
        storeOutApprovedByName: currentUser.fullName,
        storeOutApprovedAt: Date.now(),
        storeOutRemarks: storeOutRemarks.trim(),
        closedAt: Date.now(),
        auditLog: arrayUnion(auditEntry)
      });
    } catch (e) {
      console.error(e);
      alert('Failed to verify out');
    }
    setVerifyingOut(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 uppercase">{workshopCase.caseNumber}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {workshopCase.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {workshopCase.customerName} • {workshopCase.brand} {workshopCase.model} (SN: {workshopCase.serialNumber})
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          1. Incoming & Store Verification
        </button>
        <button 
          onClick={() => setActiveTab('repair')}
          disabled={!workshopCase.storeInApprovedAt}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors disabled:opacity-30 ${activeTab === 'repair' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          2. Repair Timeline
        </button>
        <button 
          onClick={() => setActiveTab('dispatch')}
          disabled={!workshopCase.storeInApprovedAt}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors disabled:opacity-30 ${activeTab === 'dispatch' ? 'border-orange-600 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          3. Dispatch & Out
        </button>
      </div>

      {/* TAB: INFO & STORE IN */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Customer Complaint
            </h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 font-medium">
              {workshopCase.complaint}
            </p>
            <div className="mt-3 text-[10px] text-gray-500 font-bold uppercase">
              Received By: {workshopCase.receivedByName} on {new Date(workshopCase.receivedAt).toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" /> 
              {workshopCase.storeInApprovedAt ? 'Store Incoming Verification (Completed)' : 'Store Incoming Verification (Pending)'}
            </h3>

            {/* Checklist Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3 bg-blue-50/50">Eng. Reported</th>
                    <th className="p-3 bg-purple-50/50">Store Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inVerificationChecklist.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-gray-900">{item.name}</td>
                      <td className="p-3 bg-blue-50/30">
                        <span className={`font-bold ${item.condition === 'OK / Present' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.condition}
                        </span>
                        {item.engineerNote && <div className="text-[10px] text-gray-500 mt-1 italic">{item.engineerNote}</div>}
                      </td>
                      <td className="p-3 bg-purple-50/30">
                        {workshopCase.storeInApprovedAt ? (
                          <>
                            <span className={`font-bold ${item.storeVerifiedCondition === 'OK / Present' ? 'text-green-600' : 'text-red-600'}`}>
                              {item.storeVerifiedCondition || item.condition}
                            </span>
                            {item.storeNote && <div className="text-[10px] text-gray-500 mt-1 italic">{item.storeNote}</div>}
                          </>
                        ) : isStore ? (
                          <select
                            value={item.storeVerifiedCondition || item.condition}
                            onChange={e => updateInVerifyChecklist(item.id, 'storeVerifiedCondition', e.target.value)}
                            className="w-full p-1 border rounded text-[10px] font-bold"
                          >
                            <option value="OK / Present">OK / Present</option>
                            <option value="Missing">Missing</option>
                            <option value="Damaged / Faulty">Damaged / Faulty</option>
                            <option value="N/A">N/A</option>
                          </select>
                        ) : (
                          <span className="text-gray-400 italic">Pending Store...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!workshopCase.storeInApprovedAt && isStore && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <label className="block text-xs font-bold text-purple-900 mb-1">Store Remarks (Optional)</label>
                <input 
                  type="text" 
                  value={storeInRemarks}
                  onChange={e => setStoreInRemarks(e.target.value)}
                  placeholder="Any corrections or observations..."
                  className="w-full p-2 text-sm border border-purple-200 rounded bg-white mb-3"
                />
                <button 
                  onClick={handleStoreVerifyIn}
                  disabled={verifyingIn}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {verifyingIn ? 'Verifying...' : 'Approve Machine In'}
                </button>
              </div>
            )}
            
            {workshopCase.storeInApprovedAt && (
              <div className="mt-3 text-[10px] text-gray-500 font-bold uppercase">
                Verified By: {workshopCase.storeInApprovedByName} on {new Date(workshopCase.storeInApprovedAt).toLocaleString()}
                {workshopCase.storeInRemarks && <p className="text-purple-700 mt-1">Remarks: {workshopCase.storeInRemarks}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: REPAIR TIMELINE */}
      {activeTab === 'repair' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <Clock className="w-4 h-4 mr-2 text-purple-500" /> Workshop Repair Timeline
            </h3>

            {workshopCase.activities.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center border border-dashed">
                No repair activities logged yet.
              </p>
            ) : (
              <div className="space-y-4">
                {workshopCase.activities.map(act => (
                  <div key={act.id} className="p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-purple-900">{act.engineerName}</span>
                      <span className="text-[10px] text-gray-500 font-bold">{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">{act.workPerformed}</p>
                  </div>
                ))}
              </div>
            )}

            {isEngineer && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Add Workshop Activity
                </label>
                <textarea 
                  value={newWorkPerformed}
                  onChange={e => setNewWorkPerformed(e.target.value)}
                  placeholder="Describe work performed today (e.g. Replaced pump, tested nozzles...)"
                  className="w-full p-3 text-sm border border-gray-200 rounded-lg bg-gray-50 min-h-[100px] mb-3 font-medium"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={addingActivity || !newWorkPerformed.trim()}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {addingActivity ? 'Adding...' : 'Log Activity'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <Truck className="w-4 h-4 mr-2 text-orange-500" /> Dispatch & Store Out Verification
            </h3>

            {/* Engineer Prepares for Dispatch */}
            {workshopCase.status !== 'Awaiting Out Verification' && workshopCase.status !== 'Returned to Customer' && isEngineer && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Prepare machine for dispatch. Review outgoing checklist.</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3 bg-purple-50/50">Incoming Verified</th>
                        <th className="p-3 bg-orange-50/50">Outgoing Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {outgoingChecklist.map((item, i) => {
                        const inCondition = item.storeVerifiedCondition || item.condition;
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-gray-900">{item.name}</td>
                            <td className="p-3 bg-purple-50/30 font-bold text-gray-600">{inCondition}</td>
                            <td className="p-3 bg-orange-50/30">
                              <select
                                value={item.outgoingCondition || inCondition}
                                onChange={e => updateOutChecklist(item.id, e.target.value)}
                                className="w-full p-1 border rounded text-[10px] font-bold"
                              >
                                <option value="OK / Present">OK / Present</option>
                                <option value="Missing">Missing</option>
                                <option value="Damaged / Faulty">Damaged / Faulty</option>
                                <option value="N/A">N/A</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Final Result</label>
                    <select
                      value={finalResult}
                      onChange={e => setFinalResult(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium"
                    >
                      <option value="Repair Completed">Repair Completed</option>
                      <option value="Tested OK">Tested OK</option>
                      <option value="Partially Repaired">Partially Repaired</option>
                      <option value="Returned Unrepaired">Returned Unrepaired</option>
                      <option value="Customer Approval Required">Customer Approval Required</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Dispatch Remarks</label>
                    <input 
                      type="text" 
                      value={dispatchRemarks}
                      onChange={e => setDispatchRemarks(e.target.value)}
                      placeholder="e.g. Taking to customer site..."
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleMarkReady}
                    disabled={verifyingOut}
                    className="px-6 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    {verifyingOut ? 'Processing...' : 'Mark Ready for Dispatch'}
                  </button>
                </div>
              </div>
            )}

            {/* Store Out Verification */}
            {(workshopCase.status === 'Awaiting Out Verification' || workshopCase.status === 'Returned to Customer') && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                  <h4 className="font-bold text-orange-900 text-sm mb-2">Final Dispatch Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-orange-800">
                    <p><strong>Taken By:</strong> {workshopCase.takenByName}</p>
                    <p><strong>Result:</strong> {workshopCase.finalResult}</p>
                    <p className="col-span-2"><strong>Remarks:</strong> {workshopCase.dispatchRemarks || 'None'}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3 bg-purple-50/50">Incoming Verified</th>
                        <th className="p-3 bg-orange-50/50">Outgoing Condition</th>
                        <th className="p-3 bg-red-50/50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workshopCase.outgoingChecklist.map((item, i) => {
                        const inCondition = item.storeVerifiedCondition || item.condition;
                        const outCondition = item.outgoingCondition || inCondition;
                        const isMissingNow = inCondition === 'OK / Present' && outCondition === 'Missing';
                        const isImproved = inCondition !== 'OK / Present' && outCondition === 'OK / Present';
                        
                        return (
                          <tr key={i} className={`hover:bg-gray-50/50 ${isMissingNow ? 'bg-red-50/50' : ''}`}>
                            <td className="p-3 font-medium text-gray-900">{item.name}</td>
                            <td className="p-3 font-bold text-gray-600">{inCondition}</td>
                            <td className="p-3 font-bold text-gray-800">{outCondition}</td>
                            <td className="p-3">
                              {isMissingNow && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">Warning: Missing</span>}
                              {isImproved && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase">Replaced/Fixed</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {workshopCase.status === 'Awaiting Out Verification' && isStore && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <label className="block text-xs font-bold text-orange-900 mb-1">Store Dispatch Remarks (Mandatory if missing warnings exist)</label>
                    <input 
                      type="text" 
                      value={storeOutRemarks}
                      onChange={e => setStoreOutRemarks(e.target.value)}
                      placeholder="Any observations on dispatch..."
                      className="w-full p-2 text-sm border border-orange-200 rounded bg-white mb-3"
                    />
                    <button 
                      onClick={handleStoreVerifyOut}
                      disabled={verifyingOut}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded shadow-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                      {verifyingOut ? 'Verifying...' : 'Approve Machine Out'}
                    </button>
                  </div>
                )}
                
                {workshopCase.status === 'Returned to Customer' && (
                  <div className="mt-3 text-[10px] text-gray-500 font-bold uppercase p-3 bg-green-50 rounded border border-green-100">
                    Dispatched / Out Verified By: {workshopCase.storeOutApprovedByName} on {new Date(workshopCase.storeOutApprovedAt!).toLocaleString()}
                    {workshopCase.storeOutRemarks && <p className="text-green-700 mt-1">Remarks: {workshopCase.storeOutRemarks}</p>}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
