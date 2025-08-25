import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { TimeEntry, TimeEntryFilters } from "@/types/timeEntry";
import * as XLSX from 'xlsx';

interface TimeEntryExportProps {
  entries: TimeEntry[];
  filters: TimeEntryFilters;
  onExport: () => void;
}

export const TimeEntryExport = ({ entries, filters, onExport }: TimeEntryExportProps) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const generateCSV = () => {
    const headers = [
      'Entry ID',
      'Task ID', 
      'Task Title',
      'Project',
      'Responsible',
      'Date',
      'Start Time',
      'End Time',
      'Duration (Hours)',
      'Status',
      'Description'
    ];

    const csvData = entries.map(entry => {
      const startDate = new Date(entry.startTime);
      const endDate = entry.endTime ? new Date(entry.endTime) : null;
      
      return [
        entry.id,
        entry.taskId,
        `"${entry.taskTitle}"`,
        `"${entry.projectName}"`,
        `"${entry.responsible}"`,
        startDate.toLocaleDateString(),
        startDate.toLocaleTimeString(),
        endDate ? endDate.toLocaleTimeString() : 'In Progress',
        entry.duration ? formatTime(entry.duration) : '0:00',
        entry.isRunning ? 'Running' : 'Completed',
        `"${entry.description || ''}"`
      ];
    });

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with filters
    let filename = 'time-entries';
    if (filters.year) filename += `-${filters.year}`;
    if (filters.month) filename += `-${filters.month}`;
    filename += '.csv';
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateExcel = () => {
    const headers = [
      'Entry ID',
      'Task ID', 
      'Task Title',
      'Project',
      'Responsible',
      'Date',
      'Start Time',
      'End Time',
      'Duration (Hours)',
      'Status',
      'Description'
    ];

    const excelData = entries.map(entry => {
      const startDate = new Date(entry.startTime);
      const endDate = entry.endTime ? new Date(entry.endTime) : null;
      
      return [
        entry.id,
        entry.taskId,
        entry.taskTitle,
        entry.projectName,
        entry.responsible,
        startDate.toLocaleDateString(),
        startDate.toLocaleTimeString(),
        endDate ? endDate.toLocaleTimeString() : 'In Progress',
        entry.duration ? formatTime(entry.duration) : '0:00',
        entry.isRunning ? 'Running' : 'Completed',
        entry.description || ''
      ];
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
    
    // Auto-size columns
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Time Entries');
    
    // Generate filename with filters
    let filename = 'time-entries';
    if (filters.year) filename += `-${filters.year}`;
    if (filters.month) filename += `-${filters.month}`;
    filename += '.xlsx';
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  const totalTime = Math.round(entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) * 1.10);
  const completedEntries = entries.filter(entry => !entry.isRunning).length;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{entries.length}</span> entries
          {completedEntries > 0 && (
            <>
              {' • '}
              <span className="font-medium">{formatTime(totalTime)}</span> total time
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={generateCSV}
          variant="outline"
          className="flex items-center gap-2"
          disabled={entries.length === 0}
        >
          <FileText className="w-4 h-4" />
          Export CSV
        </Button>
        
        <Button 
          onClick={generateExcel}
          className="flex items-center gap-2"
          disabled={entries.length === 0}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </Button>
      </div>
    </div>
  );
};