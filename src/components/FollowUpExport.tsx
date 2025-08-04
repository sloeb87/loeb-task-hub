import React from 'react';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Task, FollowUp } from "@/types/task";
import * as XLSX from 'xlsx';

interface FollowUpWithTask extends FollowUp {
  taskId: string;
  taskTitle: string;
  taskScope: string;
  taskType: string;
  taskEnvironment: string;
  projectName: string;
}

interface FollowUpExportProps {
  followUps: FollowUpWithTask[];
  filters: any;
}

export const FollowUpExport = ({ followUps, filters }: FollowUpExportProps) => {
  const generateCSV = () => {
    const headers = [
      'Follow-Up ID',
      'Task ID', 
      'Task Title',
      'Project',
      'Scope',
      'Task Type',
      'Environment',
      'Follow-Up Date',
      'Author',
      'Follow-Up Text'
    ];

    const csvData = followUps.map(followUp => {
      const followUpDate = new Date(followUp.timestamp);
      
      return [
        followUp.id,
        followUp.taskId,
        `"${followUp.taskTitle}"`,
        `"${followUp.projectName}"`,
        `"${followUp.taskScope}"`,
        `"${followUp.taskType}"`,
        `"${followUp.taskEnvironment}"`,
        followUpDate.toLocaleDateString(),
        `"${followUp.author}"`,
        `"${followUp.text}"`
      ];
    });

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with filters
    let filename = 'follow-ups';
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
      'Follow-Up ID',
      'Task ID', 
      'Task Title',
      'Project',
      'Scope',
      'Task Type',
      'Environment',
      'Follow-Up Date',
      'Author',
      'Follow-Up Text'
    ];

    const excelData = followUps.map(followUp => {
      const followUpDate = new Date(followUp.timestamp);
      
      return [
        followUp.id,
        followUp.taskId,
        followUp.taskTitle,
        followUp.projectName,
        followUp.taskScope,
        followUp.taskType,
        followUp.taskEnvironment,
        followUpDate.toLocaleDateString(),
        followUp.author,
        followUp.text
      ];
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
    
    // Auto-size columns
    const colWidths = headers.map((header, index) => {
      if (index === headers.length - 1) return { wch: 50 }; // Follow-Up Text column wider
      return { wch: 15 };
    });
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Follow Ups');
    
    // Generate filename with filters
    let filename = 'follow-ups';
    if (filters.year) filename += `-${filters.year}`;
    if (filters.month) filename += `-${filters.month}`;
    filename += '.xlsx';
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{followUps.length}</span> follow-ups
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={generateCSV}
          variant="outline"
          className="flex items-center gap-2"
          disabled={followUps.length === 0}
        >
          <FileText className="w-4 h-4" />
          Export CSV
        </Button>
        
        <Button 
          onClick={generateExcel}
          className="flex items-center gap-2"
          disabled={followUps.length === 0}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </Button>
      </div>
    </div>
  );
};