import React, { useState, useEffect, useMemo } from 'react';
import { WorkEntry, WorkType, CustomerMachine, ServiceReportPartUsed, JobPauseSegment } from '../types';
import { format } from 'date-fns';
import { cn, calculateDuration, calculateJobWorkingDuration, formatDuration } from '../utils';
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  Building, 
  Clock, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  StopCircle, 
  Pencil, 
  Pause, 
  Play, 
  Trash2, 
  Check, 
  Coffee, 
  Plus, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';

import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { WorkOrderFields, readWorkOrderImage } from './WorkOrderFields';
import { CustomerAutocomplete } from './CustomerAutocomplete';

interface WorkEntryFormProps {
  initialData?: WorkEntry;
  onSave: (entry: Omit<WorkEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<void>;
  technicianName: string;
  machine?: CustomerMachine;
  initialPart?: ServiceReportPartUsed;
  onCancel: () => void;
  uniqueCustomers: string[];
  uniqueLocations: string[];
}

const JOB_CATEGORIES = [
  'Troubleshooting',
  'Preventive Maintenance',
  'Repair',
  'Installation',
  'Testing',
  'Inspection',
  'Spare Parts',
  'Workshop Testing',
  'Assembly',
  'Other'
];

const DRAFT_KEY = 'field_engineer_active_form_draft';

export function WorkEntryForm({ initialData, onSave, onCancel, uniqueCustomers, uniqueLocations, technicianName, machine, initialPart }: WorkEntryFormProps) {
  // Check for stored draft if creating a new entry
  const savedDraft = useMemo(() => {
    if (initialData) return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse draft:', e);
    }
    return null;
  }, [initialData]);

  const [draftRestored, setDraftRestored] = useState<boolean>(Boolean(savedDraft));

  const [date, setDate] = useState(initialData?.date || savedDraft?.date || format(new Date(), 'yyyy-MM-dd'));
  const [workType, setWorkType] = useState<WorkType>(initialData?.workType || savedDraft?.workType || 'Customer');
  const [deliveryType, setDeliveryType] = useState<'Delivery of Consumables' | 'Delivery of Parts' | ''>(initialData?.deliveryType || savedDraft?.deliveryType || '');
  const [customerName, setCustomerName] = useState(initialData?.customerName || savedDraft?.customerName || machine?.customerName || '');
  const [customerId, setCustomerId] = useState<string | undefined>(initialData?.customerId || savedDraft?.customerId || machine?.customerId || undefined);
  const [location, setLocation] = useState(initialData?.location || savedDraft?.location || machine?.location || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || savedDraft?.contactPerson || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || savedDraft?.contactNumber || '');
  const [isUnregisteredCustomer, setIsUnregisteredCustomer] = useState<boolean>(Boolean(initialData?.isUnregisteredCustomer ?? savedDraft?.isUnregisteredCustomer ?? false));
  
  const [travelSegments, setTravelSegments] = useState<{start: string; end: string; durationMinutes: number}[]>(() => {
    if (initialData?.travelSegments) return initialData.travelSegments;
    if (savedDraft?.travelSegments) return savedDraft.travelSegments;
    const oldStart = initialData?.travelStart || (initialData as any)?.travelToStart || '';
    const oldStop = initialData?.travelStop || (initialData as any)?.travelToEnd || '';
    if (oldStart && oldStop) {
      return [{ start: oldStart, end: oldStop, durationMinutes: calculateDuration(oldStart, oldStop).totalMinutes }];
    }
    return [];
  });
  const [currentTravelStart, setCurrentTravelStart] = useState(() => {
    if (savedDraft?.currentTravelStart) return savedDraft.currentTravelStart;
    if (!initialData?.travelSegments) {
       const oldStart = initialData?.travelStart || (initialData as any)?.travelToStart || '';
       const oldStop = initialData?.travelStop || (initialData as any)?.travelToEnd || '';
       if (oldStart && !oldStop) return oldStart;
    }
    return '';
  });
  const [isEditingTravel, setIsEditingTravel] = useState(false);
  
  const [jobStart, setJobStart] = useState(initialData?.jobStart || savedDraft?.jobStart || '');
  const [jobStop, setJobStop] = useState(initialData?.jobStop || (initialData as any)?.jobEnd || savedDraft?.jobStop || '');
  const [jobPaused, setJobPaused] = useState<boolean>(Boolean(initialData?.jobPaused ?? savedDraft?.jobPaused));
  const [jobPauses, setJobPauses] = useState<JobPauseSegment[]>(initialData?.jobPauses || savedDraft?.jobPauses || []);
  const [isEditingJob, setIsEditingJob] = useState(false);

  const [lunchStart, setLunchStart] = useState(initialData?.lunchStart || savedDraft?.lunchStart || '');
  const [lunchEnd, setLunchEnd] = useState(initialData?.lunchEnd || savedDraft?.lunchEnd || '');
  const [isEditingLunch, setIsEditingLunch] = useState(false);
  
  const [jobCategory, setJobCategory] = useState(initialData?.jobCategory || savedDraft?.jobCategory || '');
  const [remarks, setRemarks] = useState(initialData?.remarks || savedDraft?.remarks || '');
  
  const [machines, setMachines] = useState<CustomerMachine[]>([]);
  const [machineId, setMachineId] = useState(initialData?.machineId || savedDraft?.machineId || machine?.id || '');
  const [complaint, setComplaint] = useState(initialData?.complaint || savedDraft?.complaint || '');
  const [partsUsed, setPartsUsed] = useState<ServiceReportPartUsed[]>(initialData?.partsUsed || savedDraft?.partsUsed || (initialPart ? [initialPart] : []));
  const [workOrderImage, setWorkOrderImage] = useState(initialData?.workOrderImage || savedDraft?.workOrderImage || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [machineLoadError, setMachineLoadError] = useState('');

  useEffect(() => onSnapshot(collection(db, 'customerMachines'), snap => {
    setMachineLoadError('');
    setMachines(snap.docs.map(d => ({ ...d.data(), id: d.id } as CustomerMachine)));
  }, err => {
    if (err.code === 'permission-denied') {
      setMachines([]);
      setMachineLoadError('Machine access denied by Firestore. Contact the project administrator to check the database rules.');
      return;
    }
    setMachineLoadError('Machines could not be loaded from the cloud. Showing any saved offline machines.');
    offlineDb.customerMachines.toArray().then(setMachines).catch(() => setMachineLoadError('Could not load machines. Please reconnect.'));
  }), []);
  
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  // Auto-save form draft to localStorage when creating a new entry
  useEffect(() => {
    if (initialData) return;
    const hasData = Boolean(
      currentTravelStart ||
      travelSegments.length > 0 ||
      jobStart ||
      jobStop ||
      lunchStart ||
      (customerName && customerName !== 'Workshop' && customerName !== 'Office') ||
      location ||
      jobCategory ||
      remarks
    );
    if (hasData) {
      const draft = {
        date,
        workType,
        deliveryType,
        customerId,
        customerName,
        location,
        contactPerson,
        contactNumber,
        isUnregisteredCustomer,
        travelSegments,
        currentTravelStart,
        jobStart,
        jobStop,
        jobPaused,
        jobPauses,
        lunchStart,
        lunchEnd,
        jobCategory,
        remarks,
        machineId,
        complaint,
        partsUsed
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }
  }, [initialData, date, workType, deliveryType, customerId, customerName, location, contactPerson, contactNumber, isUnregisteredCustomer, travelSegments, currentTravelStart, jobStart, jobStop, jobPaused, jobPauses, lunchStart, lunchEnd, jobCategory, remarks, machineId, complaint, partsUsed]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setDraftRestored(false);
    } catch {}
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setWorkType('Customer');
    setDeliveryType('');
    setCustomerName('');
    setLocation('');
    setTravelSegments([]);
    setCurrentTravelStart('');
    setJobStart('');
    setJobStop('');
    setJobPaused(false);
    setJobPauses([]);
    setLunchStart('');
    setLunchEnd('');
    setJobCategory('');
    setRemarks('');
    setMachineId('');
    setComplaint('');
    setPartsUsed([]);
    setWorkOrderImage('');
  };

  useEffect(() => {
    if (workType === 'Workshop') {
      setCustomerId(undefined);
      setCustomerName('Workshop');
      setLocation('Workshop');
      setContactPerson('');
      setContactNumber('');
      setIsUnregisteredCustomer(false);
      setTravelSegments([]);
      setCurrentTravelStart('');
    } else if (workType === 'Office') {
      setCustomerId(undefined);
      setCustomerName('Office');
      setLocation('Office');
      setContactPerson('');
      setContactNumber('');
      setIsUnregisteredCustomer(false);
    } else if (!initialData && (customerName === 'Workshop' || customerName === 'Office')) {
      setCustomerId(undefined);
      setCustomerName('');
      setLocation('');
      setContactPerson('');
      setContactNumber('');
      setIsUnregisteredCustomer(false);
    }
  }, [workType, initialData]);

  const getCurrentTimeHHmm = () => format(new Date(), 'HH:mm');

  // Timer state flags
  const isTravelRunning = Boolean(currentTravelStart);
  const isJobActive = Boolean(jobStart && !jobStop && !jobPaused);
  const isJobPaused = Boolean(jobStart && !jobStop && jobPaused);
  const isJobRunningOrPaused = Boolean(jobStart && !jobStop);
  const isJobCompleted = Boolean(jobStart && jobStop);

  const isLunchRunning = Boolean(lunchStart && !lunchEnd);
  const isLunchCompleted = Boolean(lunchStart && lunchEnd);

  // Timer conflict rules:
  // - Travel Active: Job and Lunch cannot start.
  // - Job Active: Travel cannot start. Lunch requires Job to be paused first.
  // - Job Paused: Lunch can start. Resume Job is available when Lunch not running.
  // - Lunch Active: Job cannot resume, Travel cannot start, another Lunch cannot start.
  // - Lunch Stopped: Resume Job becomes available for the paused Job.
  const canStartTravel = !isTravelRunning && !isJobRunningOrPaused && !isLunchRunning;
  const canStartJob = !isTravelRunning && !isLunchRunning && !jobStart;
  const canPauseJob = isJobActive && !isLunchRunning;
  const canResumeJob = isJobPaused && !isLunchRunning && !isTravelRunning;
  const canStopJob = isJobRunningOrPaused && !isLunchRunning;
  const canStartLunch = !isTravelRunning && !isLunchRunning && !isJobActive;

  // Travel calculation
  const totalTravelMinutes = travelSegments.reduce((sum, seg) => sum + (seg.durationMinutes || 0), 0);
  const travelDur = {
    hours: Math.floor(totalTravelMinutes / 60),
    minutes: totalTravelMinutes % 60,
    totalMinutes: totalTravelMinutes
  };

  // Lunch calculation
  const lunchDur = calculateDuration(lunchStart, lunchEnd);

  // Job calculation (excludes pauses and lunch)
  const rawJobDur = calculateDuration(jobStart, jobStop);
  const jobDur = calculateJobWorkingDuration(jobStart, jobStop, jobPauses, lunchStart, lunchEnd);
  const totalJobPauseMinutes = Math.max(0, rawJobDur.totalMinutes - jobDur.totalMinutes);

  const lastPauseStartTime = useMemo(() => {
    if (!jobPauses || jobPauses.length === 0) return '';
    const openPause = jobPauses.find(p => !p.pauseEnd);
    if (openPause) return openPause.pauseStart;
    return jobPauses[jobPauses.length - 1].pauseStart;
  }, [jobPauses]);

  // Actions
  const handleStartTravel = () => {
    if (!canStartTravel) return;
    setCurrentTravelStart(getCurrentTimeHHmm());
  };

  const handleStopTravel = () => {
    if (!currentTravelStart) return;
    const stop = getCurrentTimeHHmm();
    const durMins = calculateDuration(currentTravelStart, stop).totalMinutes;
    setTravelSegments(prev => [...prev, { start: currentTravelStart, end: stop, durationMinutes: durMins }]);
    setCurrentTravelStart('');
  };

  const handleStartJob = () => {
    if (!canStartJob) return;
    const now = getCurrentTimeHHmm();
    setJobStart(now);
    setJobStop('');
    setJobPaused(false);
    setJobPauses([]);
  };

  const handlePauseJob = () => {
    if (!canPauseJob) return;
    const now = getCurrentTimeHHmm();
    setJobPaused(true);
    setJobPauses(prev => [...prev, { pauseStart: now }]);
  };

  const handleResumeJob = () => {
    if (!canResumeJob) return;
    const now = getCurrentTimeHHmm();
    setJobPaused(false);
    setJobPauses(prev => {
      if (prev.length === 0) return prev;
      const lastIdx = prev.length - 1;
      const last = prev[lastIdx];
      if (!last.pauseEnd) {
        const dur = calculateDuration(last.pauseStart, now).totalMinutes;
        const copy = [...prev];
        copy[lastIdx] = { ...last, pauseEnd: now, durationMinutes: dur };
        return copy;
      }
      return prev;
    });
  };

  const handleStopJob = () => {
    if (!canStopJob) return;
    const now = getCurrentTimeHHmm();
    if (jobPaused) {
      setJobPaused(false);
      setJobPauses(prev => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        if (!last.pauseEnd) {
          const dur = calculateDuration(last.pauseStart, now).totalMinutes;
          const copy = [...prev];
          copy[lastIdx] = { ...last, pauseEnd: now, durationMinutes: dur };
          return copy;
        }
        return prev;
      });
    }
    setJobStop(now);
  };

  const handleStartLunch = () => {
    if (!canStartLunch) return;
    const now = getCurrentTimeHHmm();
    setLunchStart(now);
    setLunchEnd('');
  };

  const handleStopLunch = () => {
    if (!isLunchRunning) return;
    const now = getCurrentTimeHHmm();
    setLunchEnd(now);
  };

  const handleSave = async () => {
    if (busy || showSavedMsg) return;
    if (!date || !workType) {
      alert('Please fill Date and Work Type');
      return;
    }
    if (jobStart && !jobCategory) {
      alert('Please fill Job Category as a job was started');
      return;
    }
    if ((workType === 'Customer' || workType === 'Other' || workType === 'Delivery') && (!customerName || !location)) {
      alert('Please fill Customer/Recipient Name and Location');
      return;
    }
    if (workType === 'Delivery' && !deliveryType) {
      alert('Please select a Delivery Type');
      return;
    }

    const selected = machines.find(m => m.id === machineId) || (machine?.id === machineId ? machine : undefined);
    if ((initialData?.machineId || workOrderImage || partsUsed.length || complaint) && !selected) { setError('Select the machine for this service.'); return; }
    if (selected && selected.customerName.trim().toLowerCase() !== customerName.trim().toLowerCase()) { setError('Selected machine belongs to a different customer.'); return; }
    if (partsUsed.some(p => !p.partNumber.trim() || !p.description.trim() || !Number.isInteger(p.quantity) || p.quantity < 1)) { setError('Each part needs a number, description and positive whole quantity.'); return; }
    
    setBusy(true); setError('');
    try {
      await onSave({
        machineId, 
        machineSerial: selected?.serialNumber || '', 
        machineModel: selected?.model || '',
        complaint, 
        partsUsed, 
        workOrderImage, 
        technicianName: initialData?.technicianName || technicianName,
        date,
        workType,
        ...(workType === 'Delivery' ? { deliveryType: deliveryType as any } : {}),
        customerId: customerId || undefined,
        customerName: customerName.trim(),
        location: location.trim(),
        contactPerson: contactPerson.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        isUnregisteredCustomer: Boolean(isUnregisteredCustomer),
        travelStart: travelSegments.length > 0 ? travelSegments[0].start : '',
        travelStop: travelSegments.length > 0 ? travelSegments[travelSegments.length - 1].end : '',
        travelSegments,
        jobStart,
        jobStop,
        jobPaused: false,
        jobPauses,
        lunchStart: lunchStart || null,
        lunchEnd: lunchEnd || null,
        lunchDurationMinutes: calculateDuration(lunchStart, lunchEnd).totalMinutes,
        jobCategory,
        remarks
      });
      
      clearDraft();
      setShowSavedMsg(true);
      setTimeout(() => {
        onCancel();
      }, 800);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Unable to save. Please retry.'); 
    } finally { 
      setBusy(false); 
    }
  };

  const handleChipClick = (cat: string) => {
    const current = jobCategory.trim();
    if (current && !current.includes(cat)) {
       setJobCategory(current + (current.endsWith(',') ? ' ' : ', ') + cat);
    } else if (!current) {
       setJobCategory(cat);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-50 min-h-screen pb-28">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
        <button 
          type="button"
          onClick={onCancel} 
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{initialData ? 'Edit Work Entry' : 'Daily Work Log'}</h2>
        <div className="w-9" />
      </div>

      {/* Restored Draft Banner */}
      {draftRestored && !initialData && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Restored in-progress timer draft.</span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 ml-2"
          >
            <RotateCcw className="w-3 h-3" /> Discard Draft
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        
        {/* Work Type Selection */}
        <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(['Customer', 'Workshop', 'Office', 'Delivery', 'Other'] as WorkType[]).map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setWorkType(type)}
                className={cn(
                  "py-2.5 text-center rounded-lg font-bold transition-all text-xs tracking-wide uppercase border",
                  workType === type 
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {workType === 'Delivery' && (
            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Delivery Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(['Delivery of Consumables', 'Delivery of Parts'] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setDeliveryType(type)}
                    className={cn(
                      "py-2.5 text-center rounded-lg font-semibold transition-colors border text-xs",
                      deliveryType === type 
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(workType === 'Customer' || workType === 'Other' || workType === 'Delivery') && (
            <CustomerAutocomplete
              customerId={customerId}
              customerName={customerName}
              location={location}
              contactPerson={contactPerson}
              contactNumber={contactNumber}
              isUnregisteredCustomer={isUnregisteredCustomer}
              onCustomerChange={(data) => {
                setCustomerId(data.customerId);
                setCustomerName(data.customerName);
                if (data.location !== undefined) setLocation(data.location);
                if (data.contactPerson !== undefined) setContactPerson(data.contactPerson);
                if (data.contactNumber !== undefined) setContactNumber(data.contactNumber);
                setIsUnregisteredCustomer(data.isUnregisteredCustomer);
              }}
              onLocationChange={setLocation}
              onContactPersonChange={setContactPerson}
              onContactNumberChange={setContactNumber}
              disabled={busy}
            />
          )}
        </section>

        {/* 1. Travel Section */}
        {workType !== 'Workshop' && (
          <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Travel
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isTravelRunning && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    In Progress ({currentTravelStart})
                  </span>
                )}
                {!isTravelRunning && travelSegments.length > 0 && (
                  <>
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {formatDuration(travelDur)} recorded
                    </span>
                    <button 
                      type="button"
                      onClick={() => setIsEditingTravel(!isEditingTravel)} 
                      className={cn(
                        "p-1.5 rounded-md border transition-colors",
                        isEditingTravel 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                      )}
                      title="Edit travel timings"
                      aria-label="Edit travel timings"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Travel Timer Controls */}
            {!isTravelRunning ? (
              <div className="space-y-2">
                <button 
                  type="button"
                  onClick={handleStartTravel}
                  disabled={!canStartTravel}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors border",
                    canStartTravel 
                      ? "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white border-slate-900"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  )}
                >
                  <Play className="w-4 h-4 fill-current" /> START TRAVEL
                </button>
                {!canStartTravel && (
                  <p className="text-[11px] text-slate-500 text-center">
                    {isJobRunningOrPaused ? "Complete or stop the active Job before starting travel." : "Stop active Lunch before starting travel."}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Travel began at <span className="font-semibold text-slate-800">{currentTravelStart}</span></p>
                </div>
                <button 
                  type="button"
                  onClick={handleStopTravel}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors"
                >
                  <StopCircle className="w-4 h-4" /> STOP TRAVEL
                </button>
              </div>
            )}

            {/* Completed Travel Segments & Editable Times */}
            {travelSegments.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-100 pt-3">
                  <span>Completed Travel Segments</span>
                  <span className="font-bold text-slate-900">Total: {formatDuration(travelDur)}</span>
                </div>

                {/* Normal Summary View */}
                {!isEditingTravel ? (
                  <div className="space-y-2">
                    {travelSegments.map((seg, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                          <span className="text-sm font-mono font-medium text-slate-800">{seg.start} &rarr; {seg.end}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                          {formatDuration({ hours: Math.floor(seg.durationMinutes / 60), minutes: seg.durationMinutes % 60, totalMinutes: seg.durationMinutes })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Web Pencil Edit Panel */
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Edit Travel Segments</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingTravel(false)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        <Check className="w-3.5 h-3.5" /> Done
                      </button>
                    </div>

                    {travelSegments.map((seg, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-md border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">Segment {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...travelSegments];
                              copy.splice(idx, 1);
                              setTravelSegments(copy);
                            }}
                            className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={seg.start}
                              onChange={(e) => {
                                const newStart = e.target.value;
                                const copy = [...travelSegments];
                                const dur = calculateDuration(newStart, seg.end).totalMinutes;
                                copy[idx] = { ...seg, start: newStart, durationMinutes: dur };
                                setTravelSegments(copy);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">Stop Time</label>
                            <input
                              type="time"
                              value={seg.end}
                              onChange={(e) => {
                                const newEnd = e.target.value;
                                const copy = [...travelSegments];
                                const dur = calculateDuration(seg.start, newEnd).totalMinutes;
                                copy[idx] = { ...seg, end: newEnd, durationMinutes: dur };
                                setTravelSegments(copy);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100">
                          <span>Segment Duration:</span>
                          <span className="font-semibold text-slate-800">
                            {formatDuration({ hours: Math.floor(seg.durationMinutes / 60), minutes: seg.durationMinutes % 60, totalMinutes: seg.durationMinutes })}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const lastSeg = travelSegments[travelSegments.length - 1];
                          const newStart = lastSeg ? lastSeg.end : '09:00';
                          const dur = calculateDuration(newStart, newStart).totalMinutes;
                          setTravelSegments(prev => [...prev, { start: newStart, end: newStart, durationMinutes: dur }]);
                        }}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Segment
                      </button>
                      <span className="text-xs font-bold text-slate-800">
                        Total Travel: {formatDuration(travelDur)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 2. Job Section (Start / Pause / Resume / Stop) */}
        <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Job Timer
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isJobActive && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  In Progress ({jobStart})
                </span>
              )}
              {isJobPaused && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Paused {lastPauseStartTime ? `(${lastPauseStartTime})` : ''}
                </span>
              )}
              {isJobCompleted && (
                <>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {formatDuration(jobDur)} working
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsEditingJob(!isEditingJob)} 
                    className={cn(
                      "p-1.5 rounded-md border transition-colors",
                      isEditingJob 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                    )}
                    title="Edit job timings"
                    aria-label="Edit job timings"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Job Timer Action States */}
          {!jobStart ? (
            /* State 1: Unstarted */
            <div className="space-y-2">
              <button 
                type="button"
                onClick={handleStartJob}
                disabled={!canStartJob}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors",
                  canStartJob
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                )}
              >
                <Play className="w-4 h-4 fill-current" /> START JOB
              </button>
              {!canStartJob && (
                <p className="text-[11px] text-slate-500 text-center">
                  {isTravelRunning ? "Stop Travel before starting Job." : "Stop Lunch before starting Job."}
                </p>
              )}
            </div>
          ) : !jobStop ? (
            /* State 2 & 3: Job in progress or paused */
            <div className="space-y-3">
              <div className={cn(
                "p-3 rounded-lg border text-center space-y-1 transition-colors",
                isJobPaused ? "bg-amber-50/70 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-800"
              )}>
                <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                  <span>Job started at <span className="font-bold">{jobStart}</span></span>
                  {isJobPaused && (
                    <span className="text-amber-700">&bull; Currently Paused</span>
                  )}
                </div>
                {isJobPaused && (
                  <p className="text-[11px] text-slate-500">
                    You may take Lunch break now or resume when ready.
                  </p>
                )}
              </div>

              {/* Action Buttons: Pause / Resume / Stop */}
              <div className="grid grid-cols-2 gap-3">
                {isJobActive ? (
                  <button 
                    type="button"
                    onClick={handlePauseJob}
                    disabled={!canPauseJob}
                    className="py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors"
                  >
                    <Pause className="w-4 h-4 fill-current" /> PAUSE JOB
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleResumeJob}
                    disabled={!canResumeJob}
                    className={cn(
                      "py-3 px-4 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors",
                      canResumeJob 
                        ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white" 
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    )}
                  >
                    <Play className="w-4 h-4 fill-current" /> RESUME JOB
                  </button>
                )}

                <button 
                  type="button"
                  onClick={handleStopJob}
                  disabled={!canStopJob}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors"
                >
                  <StopCircle className="w-4 h-4" /> STOP JOB
                </button>
              </div>
            </div>
          ) : (
            /* State 4: Completed Job Display */
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Job Session Completed</span>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-700">{jobStart} &rarr; {jobStop}</p>
                <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Actual Working Time: </span>
                    <span className="font-bold text-slate-900 text-sm">{formatDuration(jobDur)}</span>
                  </div>
                  {totalJobPauseMinutes > 0 && (
                    <div className="text-slate-500 text-[11px]">
                      (Elapsed: {formatDuration(rawJobDur)} &bull; Pauses/Lunch: -{formatDuration({ hours: Math.floor(totalJobPauseMinutes / 60), minutes: totalJobPauseMinutes % 60, totalMinutes: totalJobPauseMinutes })})
                    </div>
                  )}
                </div>
              </div>

              {/* Web Pencil Edit Controls for Job */}
              {isEditingJob && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Edit Job Timings</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingJob(false)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
                    >
                      <Check className="w-3.5 h-3.5" /> Done
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={jobStart}
                        onChange={e => setJobStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Stop Time</label>
                      <input
                        type="time"
                        value={jobStop}
                        onChange={e => setJobStop(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 flex justify-between items-center">
                    <span>Recalculated Working Time:</span>
                    <span className="font-bold text-slate-900">{formatDuration(jobDur)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 3. Lunch Break Section */}
        <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lunch Break
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isLunchRunning && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  In Progress ({lunchStart})
                </span>
              )}
              {isLunchCompleted && (
                <>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {formatDuration(lunchDur)}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsEditingLunch(!isEditingLunch)} 
                    className={cn(
                      "p-1.5 rounded-md border transition-colors",
                      isEditingLunch 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                    )}
                    title="Edit lunch timings"
                    aria-label="Edit lunch timings"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Lunch Timer Actions */}
          {!lunchStart ? (
            <div className="space-y-2">
              <button 
                type="button"
                onClick={handleStartLunch}
                disabled={!canStartLunch}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors",
                  canStartLunch 
                    ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white" 
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                )}
              >
                <Coffee className="w-4 h-4" /> START LUNCH BREAK
              </button>
              {!canStartLunch && (
                <p className="text-[11px] text-slate-500 text-center">
                  {isJobActive ? "Please pause the active Job first before starting Lunch." : "Stop active Travel before starting Lunch."}
                </p>
              )}
            </div>
          ) : !lunchEnd ? (
            <div className="space-y-3">
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-center text-xs text-amber-900">
                <p>Lunch started at <span className="font-bold">{lunchStart}</span></p>
                <p className="text-[11px] text-slate-500 mt-0.5">Active Job remains paused while Lunch is underway.</p>
              </div>
              <button 
                type="button"
                onClick={handleStopLunch}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 min-h-[48px] shadow-xs transition-colors"
              >
                <StopCircle className="w-4 h-4" /> STOP LUNCH BREAK
              </button>
            </div>
          ) : (
            /* Completed Lunch Display */
            <div className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-medium text-slate-800">{lunchStart} &rarr; {lunchEnd}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Automatically excluded from Job working time.</p>
                </div>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                  {formatDuration(lunchDur)}
                </span>
              </div>

              {/* Web Pencil Edit Controls for Lunch */}
              {isEditingLunch && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Edit Lunch Break Timings</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingLunch(false)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
                    >
                      <Check className="w-3.5 h-3.5" /> Done
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={lunchStart}
                        onChange={e => setLunchStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Stop Time</label>
                      <input
                        type="time"
                        value={lunchEnd}
                        onChange={e => setLunchEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 flex justify-between items-center">
                    <span>Recalculated Lunch Duration:</span>
                    <span className="font-bold text-slate-900">{formatDuration(lunchDur)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Machine & Work Order Fields */}
        <WorkOrderFields 
          machines={machines} 
          machineId={machineId} 
          onMachine={m => { 
            setMachineId(m?.id || ''); 
            if (m) { 
              setCustomerName(m.customerName); 
              if (m.customerId) {
                setCustomerId(m.customerId);
                setIsUnregisteredCustomer(false);
              }
              setLocation(m.location || location); 
            } 
          }} 
          complaint={complaint} 
          setComplaint={setComplaint} 
          parts={partsUsed} 
          setParts={setPartsUsed} 
          image={workOrderImage} 
          onImage={async file => { 
            setBusy(true); 
            setError(''); 
            try { 
              setWorkOrderImage(await readWorkOrderImage(file)); 
            } catch (err) { 
              setError(String(err)); 
            } finally { 
              setBusy(false); 
            } 
          }} 
          removeImage={() => setWorkOrderImage('')} 
          busy={busy} 
          technician={initialData?.technicianName || technicianName} 
          customerName={customerName}
          customerId={customerId}
        />
        
        {machineLoadError && <p role="alert" className="text-red-700 text-xs">{machineLoadError}</p>}
        {error && <p role="alert" className="text-red-700 text-xs">{error}</p>}

        {/* Work Details Section */}
        <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Job Category / Work Carried Out *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {JOB_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleChipClick(cat)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md transition-colors active:bg-slate-300 font-medium"
                >
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              value={jobCategory}
              onChange={e => setJobCategory(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none min-h-[90px]"
              placeholder="Describe work carried out..."
            />
          </div>
          <div>
            <label className="flex items-center text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" /> Remarks / Notes
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none min-h-[70px]"
              placeholder="Optional notes..."
            />
          </div>
        </section>

      </div>

      {/* Fixed Bottom Save Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {showSavedMsg && (
            <span className="text-emerald-700 font-bold text-sm whitespace-nowrap animate-in fade-in flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" /> Entry Saved
            </span>
          )}
          <button
            type="button"
            disabled={busy || showSavedMsg}
            onClick={handleSave}
            className="flex-1 bg-slate-900 text-white font-bold text-sm tracking-wide py-3.5 px-4 rounded-xl shadow-xs hover:bg-slate-800 active:bg-slate-950 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Save className="w-4 h-4" /> SAVE ENTRY
          </button>
        </div>
      </div>
    </div>
  );
}
