import React, { useState, useMemo } from 'react';
import { WorkEntry } from '../types';
import { calculateEntryTotals, formatDuration } from '../utils';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, isWithinInterval, parseISO } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit2, Trash2, Download } from 'lucide-react';

interface WeeklyReportProps {
  entries: WorkEntry[];
  onBack: () => void;
  onEdit: (entry: WorkEntry) => void;
  onDelete: (id: string) => void;
  onExport: (entries: WorkEntry[], weekStart: Date) => void;
}

export function WeeklyReport({ entries, onBack, onEdit, onDelete, onExport }: WeeklyReportProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const weekEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    }).sort((a, b) => {
      if (a.date === b.date) {
        const timeA = a.travelStart || (a as any).travelToStart || a.jobStart || '';
        const timeB = b.travelStart || (b as any).travelToStart || b.jobStart || '';
        return timeA.localeCompare(timeB);
      }
      return a.date.localeCompare(b.date);
    });
  }, [entries, weekStart, weekEnd]);

  let totalJobMinutes = 0;
  let totalTravelMinutes = 0;

  weekEntries.forEach(entry => {
    const totals = calculateEntryTotals(entry);
    totalJobMinutes += totals.job.totalMinutes;
    totalTravelMinutes += totals.travel.totalMinutes;
  });

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-gray-50 pb-20">
      
      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Entry</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this entry?</p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setEntryToDelete(null); }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

       <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <button type="button" onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Weekly Report</h2>
        <button type="button" onClick={() => onExport(weekEntries, weekStart)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="Export Excel">
          <Download className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center justify-between">
          <button type="button" onClick={handlePrevWeek} className="p-3 hover:bg-gray-100 rounded-lg"><ChevronLeft /></button>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Week</p>
            <p className="text-sm font-bold text-gray-900">
              {format(weekStart, 'dd MMM yyyy')} - {format(weekEnd, 'dd MMM yyyy')}
            </p>
          </div>
          <button type="button" onClick={handleNextWeek} className="p-3 hover:bg-gray-100 rounded-lg"><ChevronRight /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Entries</p>
            <p className="text-xl font-bold text-gray-900">{weekEntries.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Job Time</p>
            <p className="text-xl font-bold text-gray-900">{formatDuration({ hours: Math.floor(totalJobMinutes/60), minutes: totalJobMinutes%60, totalMinutes: totalJobMinutes})}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Travel Time</p>
            <p className="text-xl font-bold text-gray-900">{formatDuration({ hours: Math.floor(totalTravelMinutes/60), minutes: totalTravelMinutes%60, totalMinutes: totalTravelMinutes})}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center bg-red-50">
            <p className="text-xs text-[#E61C24] font-semibold uppercase mb-1">Total Time</p>
            <p className="text-xl font-bold text-red-900">
              {formatDuration({ 
                 hours: Math.floor((totalJobMinutes + totalTravelMinutes)/60), 
                 minutes: (totalJobMinutes + totalTravelMinutes)%60, 
                 totalMinutes: totalJobMinutes + totalTravelMinutes
              })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {weekEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No entries found for this week.
            </div>
          ) : (
            weekEntries.map(entry => {
              const totals = calculateEntryTotals(entry);
              const dateObj = parseISO(entry.date);
              
              return (
                <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-0">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="font-bold text-gray-900">{format(dateObj, 'dd MMM yyyy')}</span>
                         <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700">
                           {entry.workType}{entry.deliveryType ? ` - ${entry.deliveryType}` : ''}
                         </span>
                      </div>
                      <h4 className="font-bold text-lg text-gray-800">{entry.customerName}</h4>
                      {entry.location && <p className="text-sm text-gray-500">{entry.location}</p>}
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <button type="button" onClick={() => onEdit(entry)} className="p-2 text-gray-400 hover:text-[#E61C24] hover:bg-red-50 rounded-lg">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEntryToDelete(entry.id);
                        }} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50/50">
                    <p className="text-sm text-gray-800 font-medium mb-3">{entry.jobCategory}</p>
                    
                    <div className="flex gap-6 text-sm">
                       <div>
                         <p className="text-gray-400 text-xs uppercase font-bold mb-1">Travel Time</p>
                         <p className="font-bold text-gray-900">{totals.travel.totalMinutes === 0 ? '0' : formatDuration(totals.travel)}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-xs uppercase font-bold mb-1">Job Time</p>
                         <p className="font-bold text-gray-900">{formatDuration(totals.job)}</p>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {weekEntries.length > 0 && (
           <button
            type="button"
            onClick={() => onExport(weekEntries, weekStart)}
            className="w-full mt-4 bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" /> EXPORT WEEKLY EXCEL
          </button>
        )}

      </div>
    </div>
  );
}
