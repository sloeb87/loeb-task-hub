import React, { useState, useMemo, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Search, Filter, Edit, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Task, FollowUp } from "@/types/task";
import { formatDate } from "@/utils/taskOperations";
import { useScopeColor, useTaskTypeColor, useEnvironmentColor, useStatusColor } from '@/hooks/useParameterColors';
import { FollowUpFiltersComponent } from "@/components/FollowUpFilters";
import { FollowUpExport } from "@/components/FollowUpExport";

interface FollowUpsPageProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onUpdateFollowUp?: (taskId: string, followUpId: string, text: string, timestamp?: string) => void;
}

interface FollowUpFilters {
  dateRange?: { from: Date; to: Date };
  year?: number;
  month?: number;
  projects?: string[];
  scopes?: string[];
  taskTypes?: string[];
  environments?: string[];
}

interface MultiSelectFilters {
  date: string[];
  task: string[];
  project: string[];
  scope: string[];
  type: string[];
  environment: string[];
}

interface FollowUpWithTask extends FollowUp {
  taskId: string;
  taskTitle: string;
  taskScope: string;
  taskType: string;
  taskEnvironment: string;
  taskStatus: string;
  projectName: string;
}

export const FollowUpsPage = ({ tasks, onEditTask, onUpdateFollowUp }: FollowUpsPageProps) => {
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  const { getStatusStyle } = useStatusColor();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FollowUpFilters>({});
  
  // Edit state for follow-ups
  const [editingFollowUp, setEditingFollowUp] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTimestamp, setEditingTimestamp] = useState('');
  
  // Multi-select filters
  const [multiSelectFilters, setMultiSelectFilters] = useState<MultiSelectFilters>({
    date: [],
    task: [],
    project: [],
    scope: [],
    type: [],
    environment: []
  });
  
  const [showFilters, setShowFilters] = useState<Record<keyof MultiSelectFilters, boolean>>({
    date: false,
    task: false,
    project: false,
    scope: false,
    type: false,
    environment: false
  });
  
  const filterRefs = useRef<Record<keyof MultiSelectFilters, HTMLDivElement | null>>({
    date: null,
    task: null,
    project: null,
    scope: null,
    type: null,
    environment: null
  });

  // Get all follow-ups with task information (flattened for filtering)
  const allFollowUps = useMemo(() => {
    const followUps: FollowUpWithTask[] = [];
    
    tasks.forEach(task => {
      task.followUps.forEach(followUp => {
        followUps.push({
          ...followUp,
          taskId: task.id,
          taskTitle: task.title,
          taskScope: task.scope,
          taskType: task.taskType,
          taskEnvironment: task.environment,
          taskStatus: followUp.taskStatus || 'Unknown',
          projectName: task.project
        });
      });
    });

    return followUps;
  }, [tasks]);

  // Get unique values for multi-select filters
  const getUniqueValues = (filterType: keyof MultiSelectFilters): string[] => {
    switch (filterType) {
      case 'date':
        return [...new Set(allFollowUps.map(f => formatDate(f.timestamp)))];
      case 'task':
        return [...new Set(allFollowUps.map(f => f.taskTitle))];
      case 'project':
        return [...new Set(allFollowUps.map(f => f.projectName))];
      case 'scope':
        return [...new Set(allFollowUps.map(f => f.taskScope))];
      case 'type':
        return [...new Set(allFollowUps.map(f => f.taskType))];
      case 'environment':
        return [...new Set(allFollowUps.map(f => f.taskEnvironment))];
      default:
        return [];
    }
  };

  // Multi-select filter handlers
  const handleFilterChange = (filterType: keyof MultiSelectFilters, value: string, checked: boolean) => {
    setMultiSelectFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearFilter = (filterType: keyof MultiSelectFilters) => {
    setMultiSelectFilters(prev => ({
      ...prev,
      [filterType]: []
    }));
  };

  const toggleFilterDropdown = (filterType: keyof MultiSelectFilters, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowFilters(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof MultiSelectFilters, boolean>),
      [filterType]: !prev[filterType]
    }));
  };

  // Filter component for table headers
  const FilterableHeader = ({ 
    filterType, 
    children 
  }: { 
    filterType: keyof MultiSelectFilters; 
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between min-w-0">
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <div className="relative" ref={el => filterRefs.current[filterType] = el}>
          <Button
            size="sm"
            variant="ghost"
            className={`p-1 h-6 w-6 shrink-0 ${multiSelectFilters[filterType].length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
            onClick={(e) => toggleFilterDropdown(filterType, e)}
          >
            <Filter className="w-3 h-3" />
          </Button>
          {multiSelectFilters[filterType].length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {multiSelectFilters[filterType].length}
            </span>
          )}
          {showFilters[filterType] && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-w-xs">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getUniqueValues(filterType).map(value => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterType}-${value}`}
                      checked={multiSelectFilters[filterType].includes(value)}
                      onCheckedChange={(checked) => 
                        handleFilterChange(filterType, value, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`${filterType}-${value}`}
                      className="text-base cursor-pointer flex-1 text-gray-900 dark:text-white truncate"
                      title={value}
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
              {multiSelectFilters[filterType].length > 0 && (
                <div className="mt-2 pt-2 border-t dark:border-gray-600">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clearFilter(filterType)}
                    className="w-full"
                  >
                    Clear All ({multiSelectFilters[filterType].length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Filter follow-ups based on search and filters
  const filteredFollowUps = useMemo(() => {
    return allFollowUps.filter(followUp => {
      // Search filter
      if (searchTerm && !followUp.text.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !followUp.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Date range filter from FollowUpFilters component
      if (filters.dateRange) {
        const followUpDate = new Date(followUp.timestamp);
        if (followUpDate < filters.dateRange.from || followUpDate > filters.dateRange.to) {
          return false;
        }
      }

      // Project filter from FollowUpFilters component
      if (filters.projects && filters.projects.length > 0) {
        if (!filters.projects.includes(followUp.projectName)) {
          return false;
        }
      }

      // Multi-select filters
      if (multiSelectFilters.date.length > 0 && 
          !multiSelectFilters.date.includes(formatDate(followUp.timestamp))) {
        return false;
      }
      if (multiSelectFilters.task.length > 0 && 
          !multiSelectFilters.task.includes(followUp.taskTitle)) {
        return false;
      }
      if (multiSelectFilters.project.length > 0 && 
          !multiSelectFilters.project.includes(followUp.projectName)) {
        return false;
      }
      if (multiSelectFilters.scope.length > 0 && 
          !multiSelectFilters.scope.includes(followUp.taskScope)) {
        return false;
      }
      if (multiSelectFilters.type.length > 0 && 
          !multiSelectFilters.type.includes(followUp.taskType)) {
        return false;
      }
      if (multiSelectFilters.environment.length > 0 && 
          !multiSelectFilters.environment.includes(followUp.taskEnvironment)) {
        return false;
      }

      return true;
    });
  }, [allFollowUps, searchTerm, multiSelectFilters, filters]);

  // Group filtered follow-ups by project then by task
  const groupedFollowUps = useMemo(() => {
    const grouped: Record<string, Record<string, FollowUpWithTask[]>> = {};
    
    filteredFollowUps.forEach(followUp => {
      const projectKey = followUp.projectName || 'No Project';
      if (!grouped[projectKey]) {
        grouped[projectKey] = {};
      }
      
      const taskKey = followUp.taskTitle;
      if (!grouped[projectKey][taskKey]) {
        grouped[projectKey][taskKey] = [];
      }
      
      grouped[projectKey][taskKey].push(followUp);
    });

    // Sort follow-ups within each task by date (newest first)
    Object.keys(grouped).forEach(project => {
      Object.keys(grouped[project]).forEach(task => {
        grouped[project][task].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    });

    return grouped;
  }, [filteredFollowUps]);

  // Calculate statistics
  const stats = useMemo(() => {
    const uniqueTasks = new Set(filteredFollowUps.map(f => f.taskId));
    const recentFollowUps = filteredFollowUps.filter(f => {
      const followUpDate = new Date(f.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return followUpDate >= sevenDaysAgo;
    });

    return {
      totalFollowUps: filteredFollowUps.length,
      tasksWithFollowUps: uniqueTasks.size,
      recentFollowUps: recentFollowUps.length
    };
  }, [filteredFollowUps]);

  const clearFilters = () => {
    setFilters({});
  };

  // Handle click on follow-up row to open related task
  const handleRowClick = (followUp: FollowUpWithTask, event: React.MouseEvent) => {
    // Don't open task if clicking on edit controls
    if ((event.target as HTMLElement).closest('.edit-controls')) {
      return;
    }
    
    if (onEditTask) {
      // Find the full task object
      const task = tasks.find(t => t.id === followUp.taskId);
      if (task) {
        onEditTask(task);
      }
    }
  };

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Handle edit follow-up
  const handleEditClick = (followUp: FollowUpWithTask, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingFollowUp(followUp.id);
    setEditingText(followUp.text);
    setEditingTimestamp(formatDateForInput(followUp.timestamp));
  };

  // Handle save edit
  const handleSaveEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (editingFollowUp && onUpdateFollowUp && editingText.trim()) {
      const followUp = allFollowUps.find(f => f.id === editingFollowUp);
      if (followUp) {
        const newTimestamp = editingTimestamp ? new Date(editingTimestamp).toISOString() : undefined;
        onUpdateFollowUp(followUp.taskId, editingFollowUp, editingText.trim(), newTimestamp);
        setEditingFollowUp(null);
        setEditingText('');
        setEditingTimestamp('');
      }
    }
  };

  // Handle cancel edit
  const handleCancelEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingFollowUp(null);
    setEditingText('');
    setEditingTimestamp('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and manage all task follow-ups</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Total Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalFollowUps}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Tasks with Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.tasksWithFollowUps}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Recent (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.recentFollowUps}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <FollowUpFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        availableProjects={[...new Set(allFollowUps.map(f => f.projectName))]}
      />

      {/* Export */}
      <FollowUpExport
        followUps={filteredFollowUps}
        filters={filters}
      />

      {/* Follow-Ups Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Follow-Ups</CardTitle>
          <CardDescription>
            Complete history of task follow-ups grouped by project and task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <FilterableHeader filterType="date">Date</FilterableHeader>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-Up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedFollowUps).map(([projectName, tasks]) => (
                  <React.Fragment key={projectName}>
                    {/* Project Header Row */}
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={4} className="font-semibold text-lg py-3">
                        <div className="flex items-center gap-3">
                          <span>📁 {projectName}</span>
                          <Badge style={getScopeStyle(Object.values(tasks)[0][0].taskScope)} className="text-sm border">
                            {Object.values(tasks)[0][0].taskScope}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {Object.entries(tasks).map(([taskTitle, followUps]) => (
                      <React.Fragment key={`${projectName}-${taskTitle}`}>
                        {/* Task Header Row with Scope, Type, Environment */}
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={4} className="font-medium text-base py-2 pl-8">
                            <div className="flex items-center gap-3">
                              <span>📋 {taskTitle}</span>
                              <Badge style={getTaskTypeStyle(followUps[0].taskType)} className="text-xs border">
                                {followUps[0].taskType}
                              </Badge>
                              <Badge style={getEnvironmentStyle(followUps[0].taskEnvironment)} className="text-xs border">
                                {followUps[0].taskEnvironment}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Follow-up Rows */}
                        {followUps.map((followUp) => (
                          <TableRow 
                            key={`${followUp.taskId}-${followUp.id}`} 
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={(e) => handleRowClick(followUp, e)}
                          >
                            {/* Date Column */}
                            <TableCell className="pl-12">
                              {editingFollowUp === followUp.id ? (
                                <div className="edit-controls">
                                  <Input
                                    type="datetime-local"
                                    value={editingTimestamp}
                                    onChange={(e) => setEditingTimestamp(e.target.value)}
                                    className="text-xs w-40"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ) : (
                                <span className="text-sm">{formatDate(followUp.timestamp)}</span>
                              )}
                            </TableCell>
                            
                            {/* Status Column */}
                            <TableCell>
                              <div className="flex items-center">
                                <Badge 
                                  style={getStatusStyle(followUp.taskStatus)}
                                  className="text-sm border"
                                >
                                  {followUp.taskStatus}
                                </Badge>
                              </div>
                            </TableCell>
                            
                            {/* Follow-Up Text Column */}
                            <TableCell>
                              {editingFollowUp === followUp.id ? (
                                <div className="edit-controls">
                                  <Textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="text-sm min-h-[60px] w-full"
                                    onClick={(e) => e.stopPropagation()}
                                    rows={2}
                                  />
                                </div>
                              ) : (
                                <div className="max-w-md">
                                  <p className="text-sm">{followUp.text}</p>
                                </div>
                              )}
                            </TableCell>
                            
                            {/* Actions Column */}
                            <TableCell>
                              <div className="flex space-x-2">
                                {editingFollowUp === followUp.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={(e) => handleSaveEdit(e)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => handleCancelEdit(e)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleEditClick(followUp, e)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredFollowUps.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No follow-ups found matching your search."
                  : "No follow-ups yet. Add follow-ups to tasks to track progress and discussions."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};