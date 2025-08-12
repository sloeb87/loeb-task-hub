import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface FollowUpWithTask {
  id: string;
  text: string;
  timestamp: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  taskScope: string;
  taskType: string;
  taskEnvironment: string;
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
      'Follow-Up Text'
    ];

    // Filter follow-ups based on current filters
    const filteredFollowUps = followUps.filter(followUp => {
      if (filters.project && followUp.projectName !== filters.project) return false;
      if (filters.taskType && followUp.taskType !== filters.taskType) return false;
      if (filters.environment && followUp.taskEnvironment !== filters.environment) return false;
      if (filters.scope && followUp.taskScope !== filters.scope) return false;
      
      if (filters.dateFrom || filters.dateTo) {
        const followUpDate = new Date(followUp.timestamp);
        if (filters.dateFrom && followUpDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && followUpDate > new Date(filters.dateTo)) return false;
      }
      
      return true;
    });

    const csvData = filteredFollowUps.map(followUp => {
      const followUpDate = new Date(followUp.timestamp);
      const csvRow = [
        `"${followUp.id}"`,
        `"${followUp.taskId}"`,
        `"${followUp.taskTitle}"`,
        `"${followUp.projectName}"`,
        `"${followUp.taskScope}"`,
        `"${followUp.taskType}"`,
        `"${followUp.taskEnvironment}"`,
        followUpDate.toLocaleDateString(),
        `"${followUp.text}"`
      ];
      return csvRow.join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    link.setAttribute('download', `follow-ups-export-${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateExcel = () => {
    // Filter follow-ups based on current filters
    const filteredFollowUps = followUps.filter(followUp => {
      if (filters.project && followUp.projectName !== filters.project) return false;
      if (filters.taskType && followUp.taskType !== filters.taskType) return false;
      if (filters.environment && followUp.taskEnvironment !== filters.environment) return false;
      if (filters.scope && followUp.taskScope !== filters.scope) return false;
      
      if (filters.dateFrom || filters.dateTo) {
        const followUpDate = new Date(followUp.timestamp);
        if (filters.dateFrom && followUpDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && followUpDate > new Date(filters.dateTo)) return false;
      }
      
      return true;
    });

    const excelData = filteredFollowUps.map((followUp) => {
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
        followUp.text
      ];
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    const headers = [
      'Follow-Up ID',
      'Task ID',
      'Task Title',
      'Project Name',
      'Task Scope', 
      'Task Type',
      'Task Environment',
      'Date',
      'Follow-up Text'
    ];

    const wsData = [headers, ...excelData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns
    const colWidths = headers.map((header, colIndex) => {
      const columnData = wsData.map(row => row[colIndex] || '');
      const maxLength = Math.max(...columnData.map(cell => String(cell).length));
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Follow-ups');

    // Write file
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    XLSX.writeFile(wb, `follow-ups-export-${dateStr}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={generateCSV}
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </Button>
      
      <Button 
        onClick={generateExcel}
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Export Excel
      </Button>
    </div>
  );
};