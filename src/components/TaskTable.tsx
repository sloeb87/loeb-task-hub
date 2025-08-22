import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus, Calendar, User, FolderOpen, Mail, FileText, Users, ChevronUp, ChevronDown, ExternalLink, Filter, Search, Play, Pause, Clock, Repeat, Link2 } from "lucide-react";
import { Task } from "@/types/task";
import { isOverdue, getDueDateColor, formatTime } from "@/utils/taskOperations";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useScopeColor, useTaskTypeColor, useEnvironmentColor, useStatusColor, usePriorityColor } from '@/hooks/useParameterColors';
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveTaskCard } from "./ResponsiveTaskCard";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
  hideProjectColumn?: boolean; // New prop to hide project name
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalTasks: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
}

type SortField = 'id' | 'title' | 'scope' | 'project' | 'status' | 'priority' | 'responsible' | 'dueDate' | 'taskType' | 'environment';
type SortDirection = 'asc' | 'desc';

interface Filters {
  scope: string[];
  status: string[];
  priority: string[];
  project: string[];
  responsible: string[];
  dueDate: string[];
  followUps: string[];
  timeTracking: string[];
  taskType: string[];
  environment: string[];
}

export const TaskTable = ({
  tasks,
  onEditTask,
  onFollowUp,
  hideProjectColumn = false, // Default to false for backward compatibility
  pagination,
  onPageChange,
  isLoading = false,
  sortField = 'dueDate',
  sortDirection = 'asc',
  onSortChange
}: TaskTableProps) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>({
    scope: [],
    status: [],
    priority: [],
    project: [],
    responsible: [],
    dueDate: [],
    followUps: [],
    timeTracking: [],
    taskType: [],
    environment: []
  });
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { startTimer, stopTimer, getTaskTime } = useTimeTracking();
  const { getScopeStyle, loading: scopeLoading } = useScopeColor();
  const { getTaskTypeStyle, loading: taskTypeLoading } = useTaskTypeColor();
  const { getEnvironmentStyle, loading: environmentLoading } = useEnvironmentColor();
  const { getStatusStyle, loading: statusLoading } = useStatusColor();
  const { getPriorityStyle, loading: priorityLoading } = usePriorityColor();
  
  // Wait for all parameter colors to load to prevent the grey-to-color flash
  const parametersLoading = scopeLoading || taskTypeLoading || environmentLoading || statusLoading || priorityLoading;

  // Live preview map for in-form edits (not yet saved to backend)
  const [previews, setPreviews] = useState<Record<string, Partial<Task>>>({});

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const e = event as CustomEvent;
      const { id, changes } = (e.detail || {}) as { id: string; changes: Partial<Task> };
      if (!id || !changes) return;
      setPreviews(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...changes } }));
    };
    const handleClear = (event: Event) => {
      const e = event as CustomEvent;
      const { id } = (e.detail || {}) as { id: string };
      if (!id) return;
      setPreviews(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    };
    window.addEventListener('taskPreviewUpdated', handleUpdate as EventListener);
    window.addEventListener('taskPreviewClear', handleClear as EventListener);
    return () => {
      window.removeEventListener('taskPreviewUpdated', handleUpdate as EventListener);
      window.removeEventListener('taskPreviewClear', handleClear as EventListener);
    };
  }, []);


  // Merge live previews into tasks for immediate UI sync (not persisted)
  const effectiveTasks = useMemo(() => {
    return tasks.map(t => (previews[t.id] ? { ...t, ...previews[t.id] } : t));
  }, [tasks, previews]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside = Object.keys(showFilters).every(filterType => {
        const ref = filterRefs.current[filterType];
        return !ref || !ref.contains(target);
      });
      
      if (clickedOutside) {
        setShowFilters({});
      }
    };

    if (Object.values(showFilters).some(show => show)) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);


  // Remove duplicate functions - now using utilities
  // isOverdue and getDueDateColor are imported from utils

  const getUniqueValues = useMemo(() => {
    return (filterType: keyof Filters): string[] => {
      const sourceTasks = effectiveTasks;
      if (filterType === 'dueDate') {
        return [...new Set(sourceTasks.map(task => new Date(task.dueDate).toLocaleDateString()))].sort();
      }
      if (filterType === 'followUps') {
        const hasFollowUps = sourceTasks.some(task => task.followUps && task.followUps.length > 0);
        const hasNoFollowUps = sourceTasks.some(task => !task.followUps || task.followUps.length === 0);
        const options: string[] = [];
        if (hasFollowUps) options.push('Has Follow-ups');
        if (hasNoFollowUps) options.push('No Follow-ups');
        return options;
      }
      if (filterType === 'timeTracking') {
        const options: string[] = [];
        const hasTimeLogged = sourceTasks.some(task => {
          const taskTime = getTaskTime(task.id);
          return taskTime.totalTime > 0 && !taskTime.isRunning;
        });
        const hasNoTime = sourceTasks.some(task => {
          const taskTime = getTaskTime(task.id);
          return taskTime.totalTime === 0 && !taskTime.isRunning;
        });
        const hasRunning = sourceTasks.some(task => {
          const taskTime = getTaskTime(task.id);
          return taskTime.isRunning;
        });
        if (hasTimeLogged) options.push('Has Time Logged');
        if (hasNoTime) options.push('No Time Logged');
        if (hasRunning) options.push('Currently Running');
        return options;
      }
      const field = filterType as keyof Task;
      const values = [...new Set(sourceTasks.map(task => task[field] as string))].filter(Boolean);
      return values.sort();
    };
  }, [effectiveTasks, getTaskTime]);

  const handleSort = useCallback((field: SortField) => {
    if (!onSortChange) return;
    
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(field, newDirection);
    } else {
      onSortChange(field, 'asc');
    }
  }, [sortField, sortDirection, onSortChange]);

  const handleFilterChange = useCallback((filterType: keyof Filters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  }, []);

  const toggleFilterDropdown = useCallback((filterType: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFilters(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {});
      newState[filterType] = !prev[filterType];
      return newState;
    });
  }, []);

  const clearFilter = useCallback((filterType: keyof Filters) => {
    setFilters(prev => ({ ...prev, [filterType]: [] }));
  }, []);


  const filteredAndSortedTasks = useMemo(() => {
    return effectiveTasks
      .filter(task => {
        const matchesSearch = searchTerm === "" || 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filters.scope.length > 0 && !task.scope.some(scope => filters.scope.includes(scope))) return false;
        if (filters.status.length > 0 && !filters.status.includes(task.status)) return false;
        if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
        if (filters.project.length > 0 && !filters.project.includes(task.project)) return false;
        if (filters.responsible.length > 0 && !filters.responsible.includes(task.responsible)) return false;
        if (filters.dueDate.length > 0 && !filters.dueDate.includes(new Date(task.dueDate).toLocaleDateString())) return false;
        
        // Follow-ups filter
        if (filters.followUps.length > 0) {
          const hasFollowUps = task.followUps && task.followUps.length > 0;
          const followUpStatus = hasFollowUps ? 'Has Follow-ups' : 'No Follow-ups';
          if (!filters.followUps.includes(followUpStatus)) return false;
        }
        
        // Time tracking filter
        if (filters.timeTracking.length > 0) {
          const taskTime = getTaskTime(task.id);
          let timeStatus = 'No Time Logged';
          if (taskTime.isRunning) {
            timeStatus = 'Currently Running';
          } else if (taskTime.totalTime > 0) {
            timeStatus = 'Has Time Logged';
          }
          if (!filters.timeTracking.includes(timeStatus)) return false;
        }
        
        return true;
      });
      // Removed sorting logic - now handled at database level
  }, [effectiveTasks, searchTerm, filters, getTaskTime]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <div 
      className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-1 rounded"
      onClick={() => handleSort(field)}
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUp className="w-3 h-3" /> : 
          <ChevronDown className="w-3 h-3" />
      )}
    </div>
  );

  const FilterableHeader = ({ 
    field, 
    filterType, 
    children 
  }: { 
    field?: SortField; 
    filterType: keyof Filters; 
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between min-w-0">
      <div className="flex items-center gap-1">
        {field ? <SortableHeader field={field}>{children}</SortableHeader> : <span>{children}</span>}
        <div className="relative" ref={el => filterRefs.current[filterType] = el}>
          <Button
            size="sm"
            variant="ghost"
            className={`p-1 h-6 w-6 shrink-0 ${filters[filterType].length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
            onClick={(e) => toggleFilterDropdown(filterType, e)}
          >
            <Filter className="w-3 h-3" />
          </Button>
          {filters[filterType].length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {filters[filterType].length}
            </span>
          )}
          {showFilters[filterType] && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-w-xs">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getUniqueValues(filterType).map(value => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterType}-${value}`}
                      checked={filters[filterType].includes(value)}
                      onCheckedChange={(checked) => 
                        handleFilterChange(filterType, value, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`${filterType}-${value}`}
                      className="text-sm cursor-pointer flex-1 text-gray-900 dark:text-white truncate"
                      title={value}
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
              {filters[filterType].length > 0 && (
                <div className="mt-2 pt-2 border-t dark:border-gray-600">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clearFilter(filterType)}
                    className="w-full"
                  >
                    Clear All ({filters[filterType].length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleRowClick = useCallback((task: Task, e: React.MouseEvent) => {
    console.log('TaskTable - Row clicked for task:', task.title);
    // Ensure we're not clicking on interactive elements within the row
    const target = e.target as HTMLElement;
    console.log('TaskTable - Click target:', target.tagName, target.className);
    
    if (target.closest('button') || target.closest('a') || target.closest('.follow-up-section')) {
      console.log('TaskTable - Click blocked by interactive element');
      return;
    }
    
    console.log('TaskTable - Calling onEditTask for:', task.title);
    onEditTask(task);
  }, [onEditTask]);

  const handleFollowUpClick = useCallback((task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowUp(task); // Use the parent's follow-up system
  }, [onFollowUp]);

  const handleTimerToggle = useCallback((task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskTime = getTaskTime(task.id);
    if (taskTime.isRunning) {
      stopTimer(task.id);
    } else {
      startTimer(task.id, task.title, task.project, task.responsible);
    }
  }, [getTaskTime, stopTimer, startTimer]);

  // formatTime is now imported from utils

  // Mobile view
  if (isMobile) {
    // Show loading skeleton for mobile while parameters are loading
    if (parametersLoading) {
      return (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <Skeleton className="h-10 w-full" />
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex space-x-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Search Bar with Pagination */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Pagination Controls for Mobile */}
            {pagination && pagination.totalPages > 1 && onPageChange && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="px-2 py-1"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
                
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {pagination.currentPage}/{pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  className="px-2 py-1"
                >
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Task Cards */}
        {filteredAndSortedTasks.map(task => (
          <ResponsiveTaskCard
            key={task.id}
            task={task}
            onEditTask={onEditTask}
            onFollowUp={onFollowUp}
            onStartTimer={(taskId) => startTimer(taskId, task.title, task.project, task.responsible)}
            onStopTimer={stopTimer}
            isTimerRunning={getTaskTime(task.id).isRunning}
            timeSpent={getTaskTime(task.id).totalTime}
          />
        ))}

        {filteredAndSortedTasks.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No tasks found matching your criteria.</p>
          </div>
        )}

        {/* Bottom Pagination Controls for Mobile */}
        {pagination && pagination.totalPages > 1 && onPageChange && (
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="px-2 py-1"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
                
                <span className="text-sm text-muted-foreground whitespace-nowrap px-3">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  className="px-2 py-1"
                >
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Show loading skeleton for desktop while parameters are loading
  if (parametersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border">
        {/* Search Bar with Pagination */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Pagination Controls for Desktop */}
            {pagination && pagination.totalPages > 1 && onPageChange && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="px-3 py-1"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  className="px-3 py-1"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead style={{ minWidth: '180px' }}>
                  <FilterableHeader field="scope" filterType="scope">
                    {hideProjectColumn ? 'Scope' : 'Scope & Project'}
                  </FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '300px' }}>
                  <SortableHeader field="title">Task</SortableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '150px' }}>
                  <FilterableHeader field="taskType" filterType="taskType">Type & Environment</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '150px' }}>
                  <FilterableHeader field="responsible" filterType="responsible">Responsible</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '180px' }}>
                  <FilterableHeader field="priority" filterType="status">Priority & Status</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '120px' }}>
                  <FilterableHeader field="dueDate" filterType="dueDate">Due Date</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '160px' }}>
                  <FilterableHeader filterType="timeTracking">Action</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '300px' }}>
                  <FilterableHeader filterType="followUps">Follow Ups</FilterableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={(e) => handleRowClick(task, e)}
                >
                  {/* Scope & Project Column */}
                  <TableCell>
                    <div className="space-y-2">
                       <div className="flex flex-wrap gap-1">
                         {task.scope.map((scopeName, index) => (
                           <Badge 
                             key={index}
                             className="text-base font-medium border"
                             style={parametersLoading ? {} : getScopeStyle(scopeName)}
                           >
                             {scopeName}
                           </Badge>
                         ))}
                       </div>
                      {!hideProjectColumn && (
                        <div className="text-base font-medium text-gray-900 dark:text-white">{task.project}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* Task Column */}
                  <TableCell>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-medium text-blue-600 dark:text-blue-400">{task.id}</span>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2">
                              {task.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {(task.isRecurring || task.parentTaskId) && (
                              <>
                                {task.isRecurring && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                    <Repeat className="w-3 h-3 mr-1" />
                                    Parent
                                  </Badge>
                                )}
                                {task.parentTaskId && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                    <Link2 className="w-3 h-3 mr-1" />
                                    Instance
                                  </Badge>
                                )}
                              </>
                            )}
                            {isOverdue(task.dueDate, task.status) && (
                              <Badge variant="destructive" className="text-sm">Overdue</Badge>
                            )}
                          </div>
                        </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </TableCell>

                  {/* Type & Environment Column */}
                  <TableCell>
                    <div className="space-y-2">
                      <div>
                         <Badge 
                           className="text-sm border"
                           style={parametersLoading ? {} : getTaskTypeStyle(task.taskType)}
                         >
                           {task.taskType}
                         </Badge>
                       </div>
                       <div>
                         <Badge 
                           className="text-sm border"
                           style={parametersLoading ? {} : getEnvironmentStyle(task.environment)}
                         >
                           {task.environment}
                         </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* Responsible Column */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-base text-gray-900 dark:text-white">{task.responsible}</span>
                      </div>
                      {task.stakeholders.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{task.stakeholders.length} stakeholder{task.stakeholders.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Priority & Status Column */}
                  <TableCell>
                    <div className="space-y-2">
                      <div>
                         <Badge 
                           className="text-sm border"
                           style={parametersLoading ? {} : getPriorityStyle(task.priority)}
                         >
                           {task.priority}
                         </Badge>
                       </div>
                       <div>
                         <Badge 
                           className="text-sm border"
                           style={parametersLoading ? {} : getStatusStyle(task.status)}
                         >
                           {task.status}
                         </Badge>
                      </div>
                    </div>
                  </TableCell>

                   {/* Due Date Column */}
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className={`flex items-center font-medium ${getDueDateColor(task.dueDate, task.status)}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        {task.completionDate && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            Completed: {new Date(task.completionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>

                  {/* Time Tracking Column */}
                   <TableCell>
                     {(() => {
                       const taskTime = getTaskTime(task.id);
                       return (
                         <div className="space-y-2">
                           {/* Time Tracking Controls */}
                           <div className="flex items-center space-x-2">
                             <Button
                               size="sm"
                               variant={taskTime.isRunning ? "destructive" : "outline"}
                               onClick={(e) => handleTimerToggle(task, e)}
                               className="h-7 w-7 p-0"
                               title={taskTime.isRunning ? "Stop Timer" : "Start Timer"}
                             >
                               {taskTime.isRunning ? (
                                 <Pause className="w-3 h-3" />
                               ) : (
                                 <Play className="w-3 h-3" />
                               )}
                             </Button>
                             {taskTime.isRunning && (
                               <div className="flex items-center text-red-600 dark:text-red-400">
                                 <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-1"></div>
                                 <span className="text-sm font-medium">Live</span>
                               </div>
                             )}
                           </div>
                           {taskTime.totalTime > 0 && (
                             <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                               <Clock className="w-3 h-3 mr-1" />
                               <span>{formatTime(taskTime.totalTime)}</span>
                             </div>
                           )}
                           
                           {/* Task Link Icons */}
                           {task.links && Object.values(task.links).some(link => link) && (
                             <div className="flex items-center space-x-1">
                               {task.links.folder && (
                                 <Button 
                                   size="sm" 
                                   variant="ghost" 
                                   className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
                                   onClick={(e) => handleLinkClick(task.links.folder!, e)}
                                   title="Open Folder"
                                 >
                                   <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                 </Button>
                               )}
                               {task.links.email && (
                                 <Button 
                                   size="sm" 
                                   variant="ghost" 
                                   className="p-1 h-6 w-6 hover:bg-green-100 dark:hover:bg-green-900"
                                   onClick={(e) => handleLinkClick(`mailto:${task.links.email}`, e)}
                                   title="Send Email"
                                 >
                                   <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
                                 </Button>
                               )}
                               {task.links.file && (
                                 <Button 
                                   size="sm" 
                                   variant="ghost" 
                                   className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
                                   onClick={(e) => handleLinkClick(task.links.file!, e)}
                                   title="Open File"
                                 >
                                   <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                 </Button>
                               )}
                               {task.links.oneNote && (
                                 <Button 
                                   size="sm" 
                                   variant="ghost" 
                                   className="p-1 h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
                                   onClick={(e) => handleLinkClick(task.links.oneNote!, e)}
                                   title="Open OneNote"
                                 >
                                   <ExternalLink className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                 </Button>
                               )}
                               {task.links.teams && (
                                 <Button 
                                   size="sm" 
                                   variant="ghost" 
                                   className="p-1 h-6 w-6 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                                   onClick={(e) => handleLinkClick(task.links.teams!, e)}
                                   title="Open Teams"
                                 >
                                   <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                 </Button>
                               )}
                             </div>
                           )}
                         </div>
                       );
                     })()}
                   </TableCell>

                  {/* Follow Ups Column */}
                  <TableCell>
                    <div 
                      className="follow-up-section space-y-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors p-2 rounded" 
                      onClick={(e) => handleFollowUpClick(task, e)}
                    >
                      {task.followUps.length === 0 ? (
                        <div className="text-xs text-gray-400 italic flex items-center">
                          <MessageSquarePlus className="w-3 h-3 mr-1" />
                          Click to add follow-up
                        </div>
                      ) : (
                        <div className="border-l-2 border-blue-200 dark:border-blue-700 pl-2">
                          <div className="text-xs text-gray-400 mb-1">
                            {new Date(task.followUps[task.followUps.length - 1].timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {task.followUps[task.followUps.length - 1].text}
                          </div>
                        </div>
                      )}
                      {task.followUps.length > 1 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                          +{task.followUps.length - 1} more...
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredAndSortedTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Bottom Pagination Controls for Desktop */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="p-4 border-t border-border bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="px-2 py-1"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </Button>
              
              <span className="text-sm text-muted-foreground whitespace-nowrap px-3">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="px-2 py-1"
              >
                <ChevronUp className="w-4 h-4 rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
