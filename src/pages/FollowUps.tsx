import React, { useState, useMemo, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Task, FollowUp } from "@/types/task";
import { formatDate } from "@/utils/taskOperations";
import { useScopeColor, useTaskTypeColor, useEnvironmentColor, useStatusColor } from '@/hooks/useParameterColors';
import { FollowUpFiltersComponent } from "@/components/FollowUpFilters";
import { FollowUpExport } from "@/components/FollowUpExport";

interface FollowUpsPageProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
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

export const FollowUpsPage = ({ tasks, onEditTask }: FollowUpsPageProps) => {
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  const { getStatusStyle } = useStatusColor();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FollowUpFilters>({});
  
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

  // Get all follow-ups with task information
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
          taskStatus: task.status,
          projectName: task.project
        });
      });
    });

    return followUps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tasks]);

  // Get unique values for multi-select filters
  const getUniqueValues = (filterType: keyof MultiSelectFilters): string[] => {
    switch (filterType) {
      case 'date':
        return [...new Set(allFollowUps.map(f => new Date(f.timestamp).toLocaleDateString()))].sort();
      case 'task':
        return [...new Set(allFollowUps.map(f => f.taskTitle))].sort();
      case 'project':
        return [...new Set(allFollowUps.map(f => f.projectName))].sort();
      case 'scope':
        return [...new Set(allFollowUps.map(f => f.taskScope))].sort();
      case 'type':
        return [...new Set(allFollowUps.map(f => f.taskType))].sort();
      case 'environment':
        return [...new Set(allFollowUps.map(f => f.taskEnvironment))].sort();
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

  // Apply filters
  const filteredFollowUps = useMemo(() => {
    let filtered = allFollowUps;

    // Apply existing date filters
    if (filters.dateRange || filters.year || filters.month) {
      filtered = filtered.filter(followUp => {
        const followUpDate = new Date(followUp.timestamp);
        
        if (filters.dateRange) {
          return followUpDate >= filters.dateRange.from && followUpDate <= filters.dateRange.to;
        }
        
        if (filters.year && filters.month) {
          return followUpDate.getFullYear() === filters.year && followUpDate.getMonth() === filters.month - 1;
        }
        
        if (filters.year) {
          return followUpDate.getFullYear() === filters.year;
        }
        
        return true;
      });
    }

    // Apply multi-select filters
    if (multiSelectFilters.date.length > 0) {
      filtered = filtered.filter(f => multiSelectFilters.date.includes(new Date(f.timestamp).toLocaleDateString()));
    }
    if (multiSelectFilters.task.length > 0) {
      filtered = filtered.filter(f => multiSelectFilters.task.includes(f.taskTitle));
    }
    if (multiSelectFilters.project.length > 0) {
      filtered = filtered.filter(f => multiSelectFilters.project.includes(f.projectName));
    }
    if (multiSelectFilters.scope.length > 0) {
      filtered = filtered.filter(f => multiSelectFilters.scope.includes(f.taskScope));
    }
    if (multiSelectFilters.type.length > 0) {
      filtered = filtered.filter(f => multiSelectFilters.type.includes(f.taskType));
    }
    if (multiSelectFilters.environment.length > 0) {
      filtered = filtered.filter(f => multiSelectFilters.environment.includes(f.taskEnvironment));
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(followUp => 
        followUp.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.taskScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.taskType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.taskEnvironment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allFollowUps, filters, multiSelectFilters, searchTerm]);

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

  // formatDate is now imported from utils

  const clearFilters = () => {
    setFilters({});
  };

  // Handle click on follow-up row to open related task
  const handleRowClick = (followUp: FollowUpWithTask) => {
    if (onEditTask) {
      // Find the full task object
      const task = tasks.find(t => t.id === followUp.taskId);
      if (task) {
        onEditTask(task);
      }
    }
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
            Complete history of task follow-ups and comments
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
                  <TableHead>
                    <FilterableHeader filterType="task">Task</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="project">Project</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="scope">Scope</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="type">Type</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="environment">Environment</FilterableHeader>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-Up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowUps.map((followUp) => (
                  <TableRow 
                    key={`${followUp.taskId}-${followUp.id}`} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleRowClick(followUp)}
                  >
                    <TableCell>
                      <span className="text-base text-gray-900 dark:text-white">
                        {formatDate(followUp.timestamp)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-base text-gray-900 dark:text-white truncate">
                        {followUp.taskId}_{followUp.taskTitle}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-base text-gray-900 dark:text-white truncate">
                        {followUp.projectName}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getScopeStyle(followUp.taskScope)}
                          className="text-sm"
                        >
                          {followUp.taskScope}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getTaskTypeStyle(followUp.taskType)}
                          className="text-sm border"
                        >
                          {followUp.taskType}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getEnvironmentStyle(followUp.taskEnvironment)}
                          className="text-sm border"
                        >
                          {followUp.taskEnvironment}
                        </Badge>
                      </div>
                    </TableCell>
                    
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
                    
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white max-w-xs">
                        <p className="line-clamp-2">{followUp.text}</p>
                      </div>
                    </TableCell>
                  </TableRow>
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