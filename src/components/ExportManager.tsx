import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Calendar, Filter } from "lucide-react";
import { Task, Project } from "@/types/task";
import { useToast } from "@/hooks/use-toast";

interface ExportManagerProps {
  tasks: Task[];
  projects: Project[];
}

interface ExportOptions {
  format: 'csv' | 'excel';
  type: 'tasks' | 'projects' | 'both';
  dateRange: 'all' | 'month' | 'quarter' | 'year';
  includeCompleted: boolean;
  includeTimeTracking: boolean;
  groupBy: 'none' | 'project' | 'status' | 'responsible';
}

export const ExportManager = ({ tasks, projects }: ExportManagerProps) => {
  const { toast } = useToast();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    type: 'tasks',
    dateRange: 'all',
    includeCompleted: true,
    includeTimeTracking: true,
    groupBy: 'none'
  });

  const handleExport = async () => {
    try {
      const filteredTasks = filterTasksByOptions(tasks, exportOptions);
      const filteredProjects = filterProjectsByOptions(projects, exportOptions);

      if (exportOptions.format === 'csv') {
        if (exportOptions.type === 'tasks' || exportOptions.type === 'both') {
          downloadCSV(tasksToCSV(filteredTasks), 'tasks');
        }
        if (exportOptions.type === 'projects' || exportOptions.type === 'both') {
          downloadCSV(projectsToCSV(filteredProjects), 'projects');
        }
      } else {
        // Excel format - would need additional library like xlsx
        toast({
          title: "Excel Export",
          description: "Excel export feature coming soon! Using CSV format instead.",
        });
        if (exportOptions.type === 'tasks' || exportOptions.type === 'both') {
          downloadCSV(tasksToCSV(filteredTasks), 'tasks');
        }
        if (exportOptions.type === 'projects' || exportOptions.type === 'both') {
          downloadCSV(projectsToCSV(filteredProjects), 'projects');
        }
      }

      toast({
        title: "Export Successful",
        description: `${exportOptions.type} exported successfully as ${exportOptions.format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filterTasksByOptions = (tasks: Task[], options: ExportOptions): Task[] => {
    let filtered = [...tasks];

    // Filter by completion status
    if (!options.includeCompleted) {
      filtered = filtered.filter(task => task.status !== 'Completed');
    }

    // Filter by date range
    if (options.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (options.dateRange) {
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(task => new Date(task.creationDate) >= cutoffDate);
    }

    // Sort by groupBy option
    if (options.groupBy !== 'none') {
      filtered.sort((a, b) => {
        const aValue = a[options.groupBy as keyof Task] as string;
        const bValue = b[options.groupBy as keyof Task] as string;
        return aValue.localeCompare(bValue);
      });
    }

    return filtered;
  };

  const filterProjectsByOptions = (projects: Project[], options: ExportOptions): Project[] => {
    let filtered = [...projects];

    // Filter by completion status
    if (!options.includeCompleted) {
      filtered = filtered.filter(project => project.status !== 'Completed');
    }

    return filtered;
  };

  const tasksToCSV = (tasks: Task[]): string => {
    const headers = [
      'Task ID',
      'Title',
      'Project',
      'Scope',
      'Environment',
      'Task Type',
      'Status',
      'Priority',
      'Responsible',
      'Creation Date',
      'Start Date',
      'Due Date',
      'Completion Date',
      'Description',
      'Details',
      'Dependencies',
      'Follow-ups Count'
    ];

    if (exportOptions.includeTimeTracking) {
      headers.push('Time Spent (minutes)', 'Duration');
    }

    const csvContent = [
      headers.join(','),
      ...tasks.map(task => [
        `"${task.id}"`,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.project}"`,
        `"${task.scope}"`,
        `"${task.environment}"`,
        `"${task.taskType}"`,
        `"${task.status}"`,
        `"${task.priority}"`,
        `"${task.responsible}"`,
        `"${task.creationDate}"`,
        `"${task.startDate}"`,
        `"${task.dueDate}"`,
        `"${task.completionDate || ''}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        `"${(task.details || '').replace(/"/g, '""')}"`,
        `"${task.dependencies?.join('; ') || ''}"`,
        `"${task.followUps?.length || 0}"`,
        ...(exportOptions.includeTimeTracking ? [
          `"${task.duration || 0}"`,
          `"${task.duration ? Math.floor(task.duration / 60) + 'h ' + (task.duration % 60) + 'm' : ''}"`
        ] : [])
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  const projectsToCSV = (projects: Project[]): string => {
    const headers = [
      'Project ID',
      'Name',
      'Description',
      'Owner',
      'Scope',
      'Status',
      'Start Date',
      'End Date',
      'Team Members',
      'Tasks Count'
    ];

    const csvContent = [
      headers.join(','),
      ...projects.map(project => [
        `"${project.id}"`,
        `"${project.name.replace(/"/g, '""')}"`,
        `"${(project.description || '').replace(/"/g, '""')}"`,
        `"${project.owner}"`,
        `"${project.scope || ''}"`,
        `"${project.status}"`,
        `"${project.startDate}"`,
        `"${project.endDate}"`,
        `"${project.team?.join('; ') || ''}"`,
        `"${project.tasks?.length || 0}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = (csvContent: string, type: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    link.setAttribute('download', `${type}_export_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export your tasks and projects to CSV or Excel format with customizable options.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Export Type */}
        <div className="space-y-2">
          <Label>Export Type</Label>
          <Select 
            value={exportOptions.type} 
            onValueChange={(value: 'tasks' | 'projects' | 'both') => 
              setExportOptions(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasks">Tasks Only</SelectItem>
              <SelectItem value="projects">Projects Only</SelectItem>
              <SelectItem value="both">Tasks & Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>File Format</Label>
          <Select 
            value={exportOptions.format} 
            onValueChange={(value: 'csv' | 'excel') => 
              setExportOptions(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV Format
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel Format (Coming Soon)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Select 
            value={exportOptions.dateRange} 
            onValueChange={(value: 'all' | 'month' | 'quarter' | 'year') => 
              setExportOptions(prev => ({ ...prev, dateRange: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Group By */}
        {exportOptions.type !== 'projects' && (
          <div className="space-y-2">
            <Label>Group By</Label>
            <Select 
              value={exportOptions.groupBy} 
              onValueChange={(value: 'none' | 'project' | 'status' | 'responsible') => 
                setExportOptions(prev => ({ ...prev, groupBy: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="project">Group by Project</SelectItem>
                <SelectItem value="status">Group by Status</SelectItem>
                <SelectItem value="responsible">Group by Responsible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          <Label>Options</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeCompleted"
              checked={exportOptions.includeCompleted}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeCompleted: checked as boolean }))
              }
            />
            <Label htmlFor="includeCompleted" className="text-sm">
              Include completed items
            </Label>
          </div>

          {exportOptions.type !== 'projects' && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeTimeTracking"
                checked={exportOptions.includeTimeTracking}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeTimeTracking: checked as boolean }))
                }
              />
              <Label htmlFor="includeTimeTracking" className="text-sm">
                Include time tracking data
              </Label>
            </div>
          )}
        </div>

        {/* Export Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-2">Export Summary</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p>• Format: {exportOptions.format.toUpperCase()}</p>
            <p>• Type: {exportOptions.type}</p>
            <p>• Date Range: {exportOptions.dateRange}</p>
            {exportOptions.type !== 'projects' && (
              <p>• Grouping: {exportOptions.groupBy === 'none' ? 'None' : exportOptions.groupBy}</p>
            )}
          </div>
        </div>

        {/* Export Button */}
        <Button onClick={handleExport} className="w-full" size="lg">
          <Download className="w-4 h-4 mr-2" />
          Export {exportOptions.type}
        </Button>
      </CardContent>
    </Card>
  );
};