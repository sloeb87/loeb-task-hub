import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquarePlus, Calendar, User, FolderOpen, Mail, FileText, Users, ChevronUp, ChevronDown, ExternalLink, Filter, Search, Play, Pause, Clock } from "lucide-react";
import { Task } from "@/types/task";
import React, { useState, useRef, useEffect } from "react";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useScopeColor } from "@/hooks/useScopeColor";
import { useTaskTypeColor } from "@/hooks/useTaskTypeColor";
import { useEnvironmentColor } from "@/hooks/useEnvironmentColor";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveTaskCard } from "./ResponsiveTaskCard";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
}

type SortField = 'id' | 'title' | 'scope' | 'project' | 'status' | 'priority' | 'responsible' | 'dueDate';
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
}

export const TaskTable = ({ tasks, onEditTask, onFollowUp }: TaskTableProps) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>({
    scope: [],
    status: [],
    priority: [],
    project: [],
    responsible: [],
    dueDate: [],
    followUps: [],
    timeTracking: []
  });
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState<Task | null>(null);
  const { startTimer, stopTimer, getTaskTime } = useTimeTracking();
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Open": return "bg-orange-100 text-orange-800";
      case "On Hold": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "Completed") return false;
    return new Date(dueDate) < new Date();
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status === "Completed") return "text-green-600 dark:text-green-400";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0); // Reset to start of day
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 dark:text-red-400"; // Overdue
    if (diffDays <= 3) return "text-red-600 dark:text-red-400"; // Within 3 days
    if (diffDays <= 7) return "text-orange-600 dark:text-orange-400"; // Within 1 week
    
    return "text-gray-500 dark:text-gray-400"; // Normal
  };

  const getUniqueValues = (filterType: keyof Filters): string[] => {
    if (filterType === 'dueDate') {
      return [...new Set(tasks.map(task => new Date(task.dueDate).toLocaleDateString()))].sort();
    }
    
    if (filterType === 'followUps') {
      // Only return options that actually exist in the data
      const hasFollowUps = tasks.some(task => task.followUps && task.followUps.length > 0);
      const hasNoFollowUps = tasks.some(task => !task.followUps || task.followUps.length === 0);
      
      const options = [];
      if (hasFollowUps) options.push('Has Follow-ups');
      if (hasNoFollowUps) options.push('No Follow-ups');
      return options;
    }
    
    if (filterType === 'timeTracking') {
      // Only return options that actually exist in the data
      const options = [];
      const hasTimeLogged = tasks.some(task => {
        const taskTime = getTaskTime(task.id);
        return taskTime.totalTime > 0 && !taskTime.isRunning;
      });
      const hasNoTime = tasks.some(task => {
        const taskTime = getTaskTime(task.id);
        return taskTime.totalTime === 0 && !taskTime.isRunning;
      });
      const hasRunning = tasks.some(task => {
        const taskTime = getTaskTime(task.id);
        return taskTime.isRunning;
      });
      
      if (hasTimeLogged) options.push('Has Time Logged');
      if (hasNoTime) options.push('No Time Logged');
      if (hasRunning) options.push('Currently Running');
      return options;
    }
    
    // For actual Task properties - only return values that exist in the data
    const field = filterType as keyof Task;
    const values = [...new Set(tasks.map(task => task[field] as string))].filter(Boolean);
    
    return values.sort();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (filterType: keyof Filters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const toggleFilterDropdown = (filterType: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Filter button clicked:', filterType);
    setShowFilters(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {});
      newState[filterType] = !prev[filterType];
      console.log('New filter state:', newState);
      return newState;
    });
  };

  const clearFilter = (filterType: keyof Filters) => {
    setFilters(prev => ({ ...prev, [filterType]: [] }));
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filters.scope.length > 0 && !filters.scope.includes(task.scope)) return false;
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
    })
    .sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === 'dueDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

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

  const handleRowClick = (task: Task, e: React.MouseEvent) => {
    // Ensure we're not clicking on interactive elements within the row
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.follow-up-section')) {
      return;
    }
    
    console.log('Task row clicked - calling onEditTask with:', task);
    onEditTask(task);
  };

  const handleFollowUpClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Follow-up clicked for task:', task.title);
    setSelectedTaskForFollowUp(task);
    setFollowUpDialogOpen(true);
  };

  const handleAddFollowUp = (text: string) => {
    if (selectedTaskForFollowUp) {
      // Create a new follow-up object
      const newFollowUp = {
        id: `fu-${Date.now()}`,
        text: text,
        timestamp: new Date().toISOString(),
        author: 'Current User' // You might want to get this from a user context
      };

      // Update the task with the new follow-up
      const updatedTask = {
        ...selectedTaskForFollowUp,
        followUps: [...selectedTaskForFollowUp.followUps, newFollowUp]
      };

      // Call the onFollowUp callback to update the task
      onFollowUp(updatedTask);
    }
    
    setFollowUpDialogOpen(false);
    setSelectedTaskForFollowUp(null);
  };

  const handleTimerToggle = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskTime = getTaskTime(task.id);
    if (taskTime.isRunning) {
      stopTimer(task.id);
    } else {
      startTimer(task.id, task.title, task.project, task.responsible);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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

        {/* Follow-up Dialog */}
        {selectedTaskForFollowUp && (
          <FollowUpDialog
            isOpen={followUpDialogOpen}
            onClose={() => {
              setFollowUpDialogOpen(false);
              setSelectedTaskForFollowUp(null);
            }}
            onAddFollowUp={handleAddFollowUp}
            task={selectedTaskForFollowUp}
          />
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border">
        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead style={{ minWidth: '130px' }}>
                  <FilterableHeader field="scope" filterType="scope">Scope</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '300px' }}>
                  <SortableHeader field="title">Task</SortableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '150px' }}>
                  <FilterableHeader field="project" filterType="project">Project</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '180px' }}>
                  <FilterableHeader field="status" filterType="status">Status & Priority</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '150px' }}>
                  <FilterableHeader field="responsible" filterType="responsible">Responsible</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '120px' }}>
                  <FilterableHeader field="dueDate" filterType="dueDate">Due Date</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '120px' }}>
                  <FilterableHeader filterType="timeTracking">Time Tracking</FilterableHeader>
                </TableHead>
                <TableHead style={{ minWidth: '200px' }}>
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
                  {/* Scope Column */}
                  <TableCell>
                    <Badge 
                      className="text-sm font-medium border"
                      style={getScopeStyle(task.scope)}
                    >
                      {task.scope}
                    </Badge>
                  </TableCell>

                  {/* Task Column */}
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{task.id}</span>
                        {isOverdue(task.dueDate, task.status) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                      
                      {/* Task Links - Made more prominent */}
                      {task.links && Object.values(task.links).some(link => link) && (
                        <div className="space-y-1 mt-2">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Links</p>
                          <div className="flex flex-wrap gap-1">
                            {task.links.folder && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 py-1 text-xs"
                                onClick={(e) => handleLinkClick(task.links.folder!, e)}
                              >
                                <FolderOpen className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                                Folder
                              </Button>
                            )}
                            {task.links.email && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 py-1 text-xs"
                                onClick={(e) => handleLinkClick(`mailto:${task.links.email}`, e)}
                              >
                                <Mail className="w-3 h-3 mr-1 text-green-600 dark:text-green-400" />
                                Email
                              </Button>
                            )}
                            {task.links.file && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 py-1 text-xs"
                                onClick={(e) => handleLinkClick(task.links.file!, e)}
                              >
                                <FileText className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />
                                File
                              </Button>
                            )}
                            {task.links.oneNote && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 py-1 text-xs"
                                onClick={(e) => handleLinkClick(task.links.oneNote!, e)}
                              >
                                <ExternalLink className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-400" />
                                OneNote
                              </Button>
                            )}
                            {task.links.teams && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 py-1 text-xs"
                                onClick={(e) => handleLinkClick(task.links.teams!, e)}
                              >
                                <ExternalLink className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400" />
                                Teams
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Project Column */}
                  <TableCell>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{task.project}</div>
                      <div>
                        <Badge 
                          className="text-xs border"
                          style={getEnvironmentStyle(task.environment)}
                        >
                          {task.environment}
                        </Badge>
                      </div>
                      <div>
                        <Badge 
                          className="text-xs border"
                          style={getTaskTypeStyle(task.taskType)}
                        >
                          {task.taskType}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* Status & Priority Column */}
                  <TableCell>
                    <div className="space-y-2">
                      <div>
                        <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status}
                        </Badge>
                      </div>
                      <div>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* Responsible Column */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 dark:text-white">{task.responsible}</span>
                      </div>
                      {task.stakeholders.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{task.stakeholders.length} stakeholder{task.stakeholders.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                   {/* Due Date Column */}
                   <TableCell>
                     <div className="space-y-1 text-xs">
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
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant={taskTime.isRunning ? "destructive" : "outline"}
                              onClick={(e) => handleTimerToggle(task, e)}
                              className="h-8 w-8 p-0"
                              title={taskTime.isRunning ? "Stop Timer" : "Start Timer"}
                            >
                              {taskTime.isRunning ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            {taskTime.isRunning && (
                              <div className="flex items-center text-red-600 dark:text-red-400">
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-1"></div>
                                <span className="text-xs font-medium">Live</span>
                              </div>
                            )}
                          </div>
                          {taskTime.totalTime > 0 && (
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatTime(taskTime.totalTime)}</span>
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
                        task.followUps
                          .slice(-3)
                          .reverse()
                          .map((followUp, index) => (
                            <div key={followUp.id} className="border-l-2 border-blue-200 dark:border-blue-700 pl-2">
                              <div className="text-xs text-gray-400 mb-1">
                                {new Date(followUp.timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                {followUp.text}
                              </div>
                            </div>
                          ))
                      )}
                      {task.followUps.length > 3 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                          +{task.followUps.length - 3} more...
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

      {/* Follow-up Dialog */}
      {selectedTaskForFollowUp && (
        <FollowUpDialog
          isOpen={followUpDialogOpen}
          onClose={() => {
            setFollowUpDialogOpen(false);
            setSelectedTaskForFollowUp(null);
          }}
          onAddFollowUp={handleAddFollowUp}
          task={selectedTaskForFollowUp}
        />
      )}
    </>
  );
};
