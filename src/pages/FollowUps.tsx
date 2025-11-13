import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Search, Filter, Minimize2, Maximize2, X, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Task, FollowUp, Project } from "@/types/task";
import { formatDate } from "@/utils/taskOperations";
import { useScopeColor, useTaskTypeColor, useEnvironmentColor, useStatusColor } from '@/hooks/useParameterColors';
import { FollowUpFiltersComponent } from "@/components/FollowUpFilters";
import { FollowUpExport } from "@/components/FollowUpExport";
import { TimeEntryFiltersComponent } from "@/components/TimeEntryFilters";
import { TimeEntryFilters } from "@/types/timeEntry";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths, format, parseISO } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Line, LineChart, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TaskMetricsDetail } from "@/components/TaskMetricsDetail";
import { FollowUpTable } from "@/components/FollowUpTable";
// Helper function to identify automatic follow-ups
const isAutomaticFollowUp = (text: string): boolean => {
  const automaticPatterns = [
    /^Task marked completed$/,
    /^Status changed from .+ to .+$/,
    /^Priority changed from .+ to .+$/,
    /^Task type changed from .+ to .+$/,
    /^Due date changed from .+ to .+$/,
    /^Task updated:/
  ];
  
  return automaticPatterns.some(pattern => pattern.test(text));
};

interface FollowUpsPageProps {
  tasks: Task[];
  projects: Project[];
  followUps: any[];
  onEditTask?: (task: Task) => void;
  onUpdateFollowUp?: (taskId: string, followUpId: string, text: string, timestamp?: string) => void;
}
interface FollowUpFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  year?: number;
  month?: number;
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
// Wrapper component to avoid passing attributes to React.Fragment in dev overlay
const Group = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const FollowUpsPage = ({
  tasks,
  projects,
  followUps,
  onEditTask,
  onUpdateFollowUp
}: FollowUpsPageProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>(tasks); // State to hold all tasks
  
  const {
    getScopeStyle,
    getScopeColor
  } = useScopeColor();
  const {
    getTaskTypeStyle
  } = useTaskTypeColor();
  const {
    getEnvironmentStyle
  } = useEnvironmentColor();
  const {
    getStatusStyle
  } = useStatusColor();
  // Fetch all tasks from database for chart calculations
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error fetching all tasks:', error);
          return;
        }
        
        // Convert Supabase tasks to our Task type
        const convertedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as any,
          priority: task.priority as any,
          responsible: task.responsible,
          startDate: task.start_date,
          dueDate: task.due_date,
          completionDate: task.completion_date || undefined,
          duration: task.duration || undefined,
          plannedTimeHours: task.planned_time_hours || 0,
          project: task.project_id || '',
          scope: task.scope || [],
          taskType: task.task_type as any,
          environment: task.environment as any,
          dependencies: task.dependencies || [],
          stakeholders: task.stakeholders || [],
          details: task.details || '',
          links: (task.links && typeof task.links === 'object' && !Array.isArray(task.links)) 
            ? task.links as any 
            : {},
          checklist: typeof task.checklist === 'string' ? JSON.parse(task.checklist) : (Array.isArray(task.checklist) ? task.checklist : []),
          creationDate: task.creation_date,
          followUps: [], // Will be populated separately
          isRecurring: task.is_recurring || false,
          recurrenceType: task.recurrence_type as any || undefined,
          recurrenceInterval: task.recurrence_interval || undefined,
          recurrenceEndDate: task.recurrence_end_date || undefined,
          parentTaskId: task.parent_task_id || undefined
        }));
        
        setAllTasks(convertedTasks);
      } catch (error) {
        console.error('Failed to fetch all tasks:', error);
      }
    };
    
    fetchAllTasks();
  }, [isAuthenticated, user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FollowUpFilters>(() => {
    const now = new Date();
    return { dateRange: { from: startOfDay(now), to: endOfDay(now) } };
  });
  
  // Date filter proxy for TimeEntryFilters
  const dateFilters: TimeEntryFilters = {
    dateRange: filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined,
  };

  const handleDateFiltersChange = (newDateFilters: TimeEntryFilters) => {
    setFilters(prev => ({ ...prev, dateRange: newDateFilters.dateRange }));
  };

  const handleDateClear = () => {
    setFilters(prev => ({ ...prev, dateRange: undefined }));
  };

  // State for collapsible project groups
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  // State for collapsible task groups
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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
    const followUpsWithTask: FollowUpWithTask[] = [];
    
    followUps.forEach(followUp => {
      // Find the task by task number (task.id is the task_number like T468)
      const task = tasks.find(t => t.id === followUp.task_id);
      if (!task) return;
      
      const project = projects.find(p => p.id === task.project);
      
      followUpsWithTask.push({
        id: followUp.id,
        text: followUp.text,
        timestamp: followUp.created_at,
        taskId: task.id,
        taskTitle: task.title,
        taskScope: task.scope.join(', '),
        taskType: task.taskType,
        taskEnvironment: task.environment,
        taskStatus: followUp.task_status || task.status,
        projectName: project?.name || task.project || 'Unknown'
      });
    });
    return followUpsWithTask;
  }, [tasks, projects, followUps]);

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
      [filterType]: checked ? [...prev[filterType], value] : prev[filterType].filter(item => item !== value)
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
      ...Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {} as Record<keyof MultiSelectFilters, boolean>),
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
  }) => <div className="flex items-center justify-between min-w-0">
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <div className="relative" ref={el => filterRefs.current[filterType] = el}>
          
          {multiSelectFilters[filterType].length > 0 && <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {multiSelectFilters[filterType].length}
            </span>}
          {showFilters[filterType] && <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-w-xs">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getUniqueValues(filterType).map(value => <div key={value} className="flex items-center space-x-2">
                    <Checkbox id={`${filterType}-${value}`} checked={multiSelectFilters[filterType].includes(value)} onCheckedChange={checked => handleFilterChange(filterType, value, checked as boolean)} />
                    <label htmlFor={`${filterType}-${value}`} className="text-base cursor-pointer flex-1 text-gray-900 dark:text-white truncate" title={value}>
                      {value}
                    </label>
                  </div>)}
              </div>
              {multiSelectFilters[filterType].length > 0 && <div className="mt-2 pt-2 border-t dark:border-gray-600">
                  <Button size="sm" variant="outline" onClick={() => clearFilter(filterType)} className="w-full">
                    Clear All ({multiSelectFilters[filterType].length})
                  </Button>
                </div>}
            </div>}
        </div>
      </div>
    </div>;

  // Filter follow-ups based on search and filters
  const filteredFollowUps = useMemo(() => {
    return allFollowUps.filter(followUp => {
      // Search filter
      if (searchTerm && !followUp.text.toLowerCase().includes(searchTerm.toLowerCase()) && !followUp.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) && !followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Date range filter from FollowUpFilters component
      if (filters.dateRange) {
        const followUpDate = new Date(followUp.timestamp);
        if (followUpDate < filters.dateRange.from || followUpDate > filters.dateRange.to) {
          return false;
        }
      }

      // Multi-select filters
      if (multiSelectFilters.date.length > 0 && !multiSelectFilters.date.includes(formatDate(followUp.timestamp))) {
        return false;
      }
      if (multiSelectFilters.task.length > 0 && !multiSelectFilters.task.includes(followUp.taskTitle)) {
        return false;
      }
      if (multiSelectFilters.project.length > 0 && !multiSelectFilters.project.includes(followUp.projectName)) {
        return false;
      }
      // For scope filter, check if any selected scope is included in the task's scopes
      if (multiSelectFilters.scope.length > 0) {
        const taskScopes = followUp.taskScope.split(', ');
        const hasMatchingScope = multiSelectFilters.scope.some(filterScope => 
          taskScopes.includes(filterScope)
        );
        if (!hasMatchingScope) {
          return false;
        }
      }
      if (multiSelectFilters.type.length > 0 && !multiSelectFilters.type.includes(followUp.taskType)) {
        return false;
      }
      if (multiSelectFilters.environment.length > 0 && !multiSelectFilters.environment.includes(followUp.taskEnvironment)) {
        return false;
      }
      return true;
    });
  }, [allFollowUps, searchTerm, multiSelectFilters, filters]);

  // Group filtered follow-ups by week, then project scope, then project name, then task
  const groupedFollowUps = useMemo(() => {
    const grouped: Record<string, Record<string, Record<string, Record<string, FollowUpWithTask[]>>>> = {};
    
    filteredFollowUps.forEach(followUp => {
      // Group by week first
      const followUpDate = new Date(followUp.timestamp);
      const weekKey = format(followUpDate, "'Week of' MMM dd, yyyy");
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = {};
      }
      
      // Then by project scope
      const scopeKey = followUp.taskScope || 'No Scope';
      if (!grouped[weekKey][scopeKey]) {
        grouped[weekKey][scopeKey] = {};
      }
      
      // Then by project name
      const projectKey = followUp.projectName || 'No Project';
      if (!grouped[weekKey][scopeKey][projectKey]) {
        grouped[weekKey][scopeKey][projectKey] = {};
      }
      
      // Finally by task name
      const taskKey = followUp.taskTitle;
      if (!grouped[weekKey][scopeKey][projectKey][taskKey]) {
        grouped[weekKey][scopeKey][projectKey][taskKey] = [];
      }
      
      grouped[weekKey][scopeKey][projectKey][taskKey].push(followUp);
    });

    // Sort follow-ups within each task by date (newest first)
    Object.keys(grouped).forEach(week => {
      Object.keys(grouped[week]).forEach(scope => {
        Object.keys(grouped[week][scope]).forEach(project => {
          Object.keys(grouped[week][scope][project]).forEach(task => {
            grouped[week][scope][project][task].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        });
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

  // Calculate chart data for projects over time
  const projectsChartData = useMemo(() => {
    if (projects.length === 0) return [];
    
    // Find date range from projects
    const projectDates = projects.map(p => [new Date(p.startDate), new Date(p.endDate)]).flat();
    const currentDate = new Date();
    const maxDate = projectDates.length > 0 ? new Date(Math.max(...projectDates.map(d => d.getTime()))) : endOfMonth(addMonths(currentDate, 12));
    
    // Generate ALL monthly data points starting from current month (including months with 0 projects)
    const months: { week: string; count: number; date: Date }[] = [];
    let currentMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(maxDate);
    
    while (currentMonth <= endMonth) {
      const monthEnd = endOfMonth(currentMonth);
      const activeProjects = projects.filter(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);
        return projectStart <= monthEnd && projectEnd >= currentMonth;
      });
      
      months.push({
        week: format(currentMonth, 'MMM yy'),
        count: activeProjects.length,
        date: new Date(currentMonth)
      });
      
      currentMonth = addMonths(currentMonth, 1);
    }
    
    return months;
  }, [projects]);

  // Calculate chart data for tasks over time (using all tasks from database)
  const tasksChartData = useMemo(() => {
    if (allTasks.length === 0) return [];
    
    // Find date range from tasks
    const taskDates = allTasks.map(t => [new Date(t.startDate), new Date(t.dueDate)]).flat();
    const currentDate = new Date();
    const maxDate = taskDates.length > 0 ? new Date(Math.max(...taskDates.map(d => d.getTime()))) : endOfMonth(addMonths(currentDate, 12));
    
    // Generate ALL monthly data points starting from current month (including months with 0 tasks)
    const months: { week: string; count: number; date: Date }[] = [];
    let currentMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(maxDate);
    
    while (currentMonth <= endMonth) {
      const monthEnd = endOfMonth(currentMonth);
      const activeTasks = allTasks.filter(task => {
        const taskStart = new Date(task.startDate);
        const taskDue = new Date(task.dueDate);
        const isActive = taskStart <= monthEnd && taskDue >= currentMonth;
        const isNotCompleted = task.status !== 'Completed';
        return isActive && isNotCompleted;
      });
      
      months.push({
        week: format(currentMonth, 'MMM yy'),
        count: activeTasks.length,
        date: new Date(currentMonth)
      });
      
      currentMonth = addMonths(currentMonth, 1);
    }
    
    return months;
  }, [allTasks]);

  // Calculate chart data for hours over time (using all tasks from database)
  // Optimized hours chart data using pre-calculated metrics
  const hoursChartData = useMemo(() => {
    if (allTasks.length === 0) return [];
    
    // Find date range from tasks
    const taskDates = allTasks.map(t => [new Date(t.startDate), new Date(t.dueDate)]).flat();
    if (taskDates.length === 0) return [];
    
    const currentDate = new Date();
    const maxDate = taskDates.length > 0 ? new Date(Math.max(...taskDates.map(d => d.getTime()))) : endOfMonth(addMonths(currentDate, 12));
    
    // Generate monthly data points starting from current month - use simpler calculation for performance
    const months: { week: string; cumulativeHours: number; date: Date }[] = [];
    let currentMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(maxDate);
    
    while (currentMonth <= endMonth) {
      const monthEnd = endOfMonth(currentMonth);
      
      // Simplified calculation - just sum planned hours for tasks active in this month
      const totalPlannedHours = allTasks
        .filter(task => {
          const taskStart = new Date(task.startDate);
          const taskDue = new Date(task.dueDate);
          return taskStart <= monthEnd && taskDue >= currentMonth && task.status !== 'Completed';
        })
        .reduce((sum, task) => sum + (task.plannedTimeHours || 0), 0);
      
      months.push({
        week: format(currentMonth, 'MMM yy'),
        cumulativeHours: totalPlannedHours,
        date: new Date(currentMonth)
      });
      
      currentMonth = addMonths(currentMonth, 1);
    }
    
    return months;
  }, [allTasks]); // Simplified dependency

  // Fetch time entries for planned vs logged chart
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error fetching time entries:', error);
          return;
        }
        
        setTimeEntries(data || []);
      } catch (error) {
        console.error('Failed to fetch time entries:', error);
      }
    };
    
    fetchTimeEntries();
  }, [isAuthenticated, user]);

  // Helper functions for pie chart labels
  const formatPercentCeil = (num: number) => String(Math.min(100, Math.ceil(num)));
  
  const abbreviate = (text: string, max = 18) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text);
  
  // Outside multi-line label positioned near its slice
  const makePieLabelOutside = (total: number) => (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    const RADIAN = Math.PI / 180;
    const r = (outerRadius || 0) + 18;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    const alignRight = x > cx;
    const count = typeof value === 'number' ? value : 0;
    const pctNum = total > 0 ? (count / total) * 100 : 0;
    const pct = formatPercentCeil(pctNum);

    return (
      <text x={x} y={y} textAnchor={alignRight ? "start" : "end"} dominantBaseline="central" className="fill-current text-foreground">
        <tspan x={x} dy="-0.5em">{abbreviate(name)}</tspan>
        <tspan x={x} dy="1.1em">{`${pct}% • ${count}`}</tspan>
      </text>
    );
  };

  // Calculate pie chart data for open tasks per scope (without meetings)
  const openTasksPerScopeData = useMemo(() => {
    const openTasks = allTasks.filter(task => 
      task.status !== 'Completed' && 
      !task.taskType?.toLowerCase().includes('meeting')
    );
    
    const scopeCounts: Record<string, number> = {};
    openTasks.forEach(task => {
      task.scope?.forEach(scope => {
        scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
      });
    });
    
    return Object.entries(scopeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allTasks]);

  const scopeTotal = useMemo(() => 
    openTasksPerScopeData.reduce((sum, item) => sum + item.value, 0)
  , [openTasksPerScopeData]);

  // Calculate pie chart data for open tasks per project (without meetings)
  const openTasksPerProjectData = useMemo(() => {
    let openTasks = allTasks.filter(task => 
      task.status !== 'Completed' && 
      !task.taskType?.toLowerCase().includes('meeting')
    );
    
    // Apply scope filter if active
    if (multiSelectFilters.scope && multiSelectFilters.scope.length > 0) {
      openTasks = openTasks.filter(task =>
        task.scope?.some(s => multiSelectFilters.scope.includes(s))
      );
    }
    
    const projectCounts: Record<string, number> = {};
    openTasks.forEach(task => {
      const projectName = projects.find(p => p.id === task.project)?.name || 'No Project';
      projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
    });
    
    return Object.entries(projectCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allTasks, projects, multiSelectFilters.scope]);

  const projectTotal = useMemo(() => 
    openTasksPerProjectData.reduce((sum, item) => sum + item.value, 0)
  , [openTasksPerProjectData]);

  // Calculate pie chart data for open meetings per project
  const openMeetingsPerProjectData = useMemo(() => {
    let openMeetings = allTasks.filter(task => 
      task.status !== 'Completed' && 
      task.taskType?.toLowerCase().includes('meeting')
    );
    
    // Apply scope filter if active
    if (multiSelectFilters.scope && multiSelectFilters.scope.length > 0) {
      openMeetings = openMeetings.filter(task =>
        task.scope?.some(s => multiSelectFilters.scope.includes(s))
      );
    }
    
    const projectCounts: Record<string, number> = {};
    openMeetings.forEach(task => {
      const projectName = projects.find(p => p.id === task.project)?.name || 'No Project';
      projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
    });
    
    return Object.entries(projectCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allTasks, projects, multiSelectFilters.scope]);

  const meetingTotal = useMemo(() => 
    openMeetingsPerProjectData.reduce((sum, item) => sum + item.value, 0)
  , [openMeetingsPerProjectData]);

  // Calculate chart data for planned vs logged hours by month
  const plannedVsLoggedChartData = useMemo(() => {
    if (allTasks.length === 0) return [];
    
    const currentDate = new Date();
    
    // Generate monthly data points from 6 months before to 1 year from current month
    const months: { week: string; plannedHours: number; loggedHours: number; date: Date }[] = [];
    let currentMonth = startOfMonth(addMonths(currentDate, -6)); // Start 6 months before
    const endMonth = endOfMonth(addMonths(currentDate, 12)); // End 1 year from now
    
    while (currentMonth <= endMonth) {
      const monthEnd = endOfMonth(currentMonth);
      
      // Calculate planned hours for tasks due in this month
      const plannedHours = allTasks
        .filter(task => {
          const taskDue = new Date(task.dueDate);
          return taskDue >= currentMonth && taskDue <= monthEnd;
        })
        .reduce((sum, task) => sum + (task.plannedTimeHours || 0), 0);
      
      // Calculate logged hours for time entries in this month
      const loggedHours = timeEntries
        .filter(entry => {
          const entryDate = new Date(entry.start_time);
          return entryDate >= currentMonth && entryDate <= monthEnd;
        })
        .reduce((sum, entry) => sum + ((entry.duration || 0) / 60), 0); // Convert minutes to hours
      
      months.push({
        week: format(currentMonth, 'MMM yy'),
        plannedHours: Math.round(plannedHours * 10) / 10, // Round to 1 decimal
        loggedHours: Math.round(loggedHours * 10) / 10, // Round to 1 decimal
        date: new Date(currentMonth)
      });
      
      currentMonth = addMonths(currentMonth, 1);
    }
    
    return months;
  }, [allTasks, timeEntries]);

  // Handle pie chart clicks for scope filter
  const handleScopePieClick = (data: any) => {
    if (data && data.name) {
      setMultiSelectFilters(prev => ({
        ...prev,
        scope: [data.name]
      }));
    }
  };

  // Handle pie chart clicks for project filter (tasks)
  const handleProjectTasksPieClick = (data: any) => {
    if (data && data.name) {
      setMultiSelectFilters(prev => ({
        ...prev,
        project: [data.name]
      }));
    }
  };

  // Handle pie chart clicks for project filter (meetings)
  const handleProjectMeetingsPieClick = (data: any) => {
    if (data && data.name) {
      setMultiSelectFilters(prev => ({
        ...prev,
        project: [data.name]
      }));
    }
  };

  // Handle planned vs logged chart clicks - filter follow-ups by month
  const handlePlannedVsLoggedChartClick = (data: any) => {
    console.log('Planned vs Logged chart clicked:', data);
    
    // Extract the clicked data from the recharts event structure
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload[0].payload;
      console.log('Extracted clicked data:', clickedData);
      
      if (clickedData && clickedData.date) {
        const monthStart = startOfMonth(clickedData.date);
        const monthEnd = endOfMonth(clickedData.date);
        
        console.log('Setting date filter:', { from: monthStart, to: monthEnd });
        
        // Update the filters to show only follow-ups from the clicked month
        setFilters(prev => ({
          ...prev,
          dateRange: {
            from: monthStart,
            to: monthEnd
          }
        }));
      }
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const clearChartFilters = () => {
    setMultiSelectFilters({
      date: [],
      task: [],
      project: [],
      scope: [],
      type: [],
      environment: [],
    });
  };

  const hasActiveChartFilters = 
    multiSelectFilters.project.length > 0 || 
    multiSelectFilters.scope.length > 0 || 
    multiSelectFilters.type.length > 0 || 
    multiSelectFilters.environment.length > 0;

  // Handle click on follow-up row to open related task
  const handleRowClick = (followUp: FollowUpWithTask, event: React.MouseEvent) => {
    // Don't open task if clicking on edit controls or buttons
    const target = event.target as HTMLElement;
    if (target.closest('.edit-controls') || target.closest('button') || target.tagName === 'BUTTON') {
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
    event.preventDefault();
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
    event.preventDefault();
    event.stopPropagation();
    setEditingFollowUp(null);
    setEditingText('');
    setEditingTimestamp('');
  };

  // Toggle project expansion
  const toggleProjectExpansion = (projectName: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectName)) {
        newSet.delete(projectName);
      } else {
        newSet.add(projectName);
      }
      return newSet;
    });
  };

  // Toggle task expansion
  const toggleTaskExpansion = (projectName: string, taskTitle: string) => {
    const taskKey = `${projectName}-${taskTitle}`;
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskKey)) {
        newSet.delete(taskKey);
      } else {
        newSet.add(taskKey);
      }
      return newSet;
    });
  };

  // Toggle between collapse all and expand all
  const toggleExpandCollapseAll = () => {
    const hasExpandedItems = expandedProjects.size > 0 || expandedTasks.size > 0;
    
    if (hasExpandedItems) {
      // Collapse all
      setExpandedProjects(new Set());
      setExpandedTasks(new Set());
    } else {
      // Expand all - now with 4-level hierarchy
      const allProjects = new Set<string>();
      const allTasks = new Set<string>();
      
      Object.entries(groupedFollowUps).forEach(([weekName, scopes]) => {
        Object.entries(scopes).forEach(([scopeName, projects]) => {
          Object.entries(projects).forEach(([projectName, tasks]) => {
            const projectKey = `${weekName}-${scopeName}-${projectName}`;
            allProjects.add(projectKey);
            
            Object.keys(tasks).forEach(taskTitle => {
              allTasks.add(`${projectKey}-${taskTitle}`);
            });
          });
        });
      });
      
      setExpandedProjects(allProjects);
      setExpandedTasks(allTasks);
    }
  };

  // Determine current state for button
  const hasExpandedItems = expandedProjects.size > 0 || expandedTasks.size > 0;

  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">View and manage all task follow-ups</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Avg. Hours per Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalFollowUps > 0 ? (stats.totalFollowUps / stats.tasksWithFollowUps).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <TimeEntryFiltersComponent
          filters={dateFilters}
          onFiltersChange={handleDateFiltersChange}
          onClearFilters={handleDateClear}
        />
        <FollowUpFiltersComponent 
          filters={filters} 
          onFiltersChange={setFilters} 
          onClearFilters={clearFilters} 
          hideDateRange
        />
        
        {/* Chart Selection Filters */}
        {hasActiveChartFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Chart Filters:</span>
                  {multiSelectFilters.scope.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Scope:</span>
                      {multiSelectFilters.scope.map(scope => (
                        <Badge 
                          key={scope} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {scope}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => {
                              setMultiSelectFilters(prev => ({
                                ...prev,
                                scope: prev.scope.filter(s => s !== scope)
                              }));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  {multiSelectFilters.project.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Project:</span>
                      {multiSelectFilters.project.map(project => (
                        <Badge 
                          key={project} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {project}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => {
                              setMultiSelectFilters(prev => ({
                                ...prev,
                                project: prev.project.filter(p => p !== project)
                              }));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  {multiSelectFilters.type.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      {multiSelectFilters.type.map(type => (
                        <Badge 
                          key={type} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {type}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => {
                              setMultiSelectFilters(prev => ({
                                ...prev,
                                type: prev.type.filter(t => t !== type)
                              }));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  {multiSelectFilters.environment.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Environment:</span>
                      {multiSelectFilters.environment.map(env => (
                        <Badge 
                          key={env} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {env}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => {
                              setMultiSelectFilters(prev => ({
                                ...prev,
                                environment: prev.environment.filter(e => e !== env)
                              }));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearChartFilters}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Chart Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Tasks per Scope (without meetings) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 items-center justify-items-center">
              <ChartContainer config={{}} className="h-72 w-full">
                <PieChart>
                  <defs>
                    {openTasksPerScopeData.map((entry, index) => {
                      const color = getScopeColor(entry.name);
                      return (
                        <linearGradient key={`scopeGradient-${index}`} id={`scopeGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number, name: string) => {
                          const count = Number(value) || 0;
                          const pct = scopeTotal > 0 ? formatPercentCeil((count / scopeTotal) * 100) : '0';
                          return [`${count} tasks • ${pct}%`, name];
                        }}
                      />
                    }
                  />
                  <Pie
                    data={openTasksPerScopeData}
                    dataKey="value"
                    nameKey="name"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={70}
                    outerRadius={110}
                    strokeWidth={3}
                    stroke="hsl(var(--background))"
                    label={makePieLabelOutside(scopeTotal)}
                    labelLine={true}
                    onClick={(data) => handleScopePieClick(data)}
                  >
                    {openTasksPerScopeData.map((entry, index) => {
                      const color = getScopeColor(entry.name);
                      return (
                        <Cell 
                          key={`scope-${entry.name}-${index}`} 
                          fill={`url(#scopeGradient-${index})`}
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Open Tasks per Project (without meetings) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Project (Tasks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 items-center justify-items-center">
              <ChartContainer config={{}} className="h-72 w-full">
                <PieChart>
                  <defs>
                    {openTasksPerProjectData.map((entry, index) => {
                      // Find the project and use its scope color
                      const project = projects.find(p => p.name === entry.name);
                      const projectScope = Array.isArray(project?.scope) 
                        ? project?.scope[0] || 'Unassigned'
                        : project?.scope || 'Unassigned';
                      const color = getScopeColor(projectScope);
                      return (
                        <linearGradient key={`projectGradient-${index}`} id={`projectGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number, name: string) => {
                          const count = Number(value) || 0;
                          const pct = projectTotal > 0 ? formatPercentCeil((count / projectTotal) * 100) : '0';
                          return [`${count} tasks • ${pct}%`, name];
                        }}
                      />
                    }
                  />
                  <Pie
                    data={openTasksPerProjectData}
                    dataKey="value"
                    nameKey="name"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={70}
                    outerRadius={110}
                    strokeWidth={3}
                    stroke="hsl(var(--background))"
                    label={makePieLabelOutside(projectTotal)}
                    labelLine={true}
                    onClick={(data) => handleProjectTasksPieClick(data)}
                  >
                    {openTasksPerProjectData.map((entry, index) => {
                      // Find the project and use its scope color for stroke
                      const project = projects.find(p => p.name === entry.name);
                      const projectScope = Array.isArray(project?.scope) 
                        ? project?.scope[0] || 'Unassigned'
                        : project?.scope || 'Unassigned';
                      const color = getScopeColor(projectScope);
                      return (
                        <Cell 
                          key={`project-${entry.name}-${index}`} 
                          fill={`url(#projectGradient-${index})`}
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Open Meetings per Project */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Project (Meetings)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 items-center justify-items-center">
              <ChartContainer config={{}} className="h-72 w-full">
                <PieChart>
                  <defs>
                    {openMeetingsPerProjectData.map((entry, index) => {
                      // Find the project and use its scope color
                      const project = projects.find(p => p.name === entry.name);
                      const projectScope = Array.isArray(project?.scope) 
                        ? project?.scope[0] || 'Unassigned'
                        : project?.scope || 'Unassigned';
                      const color = getScopeColor(projectScope);
                      return (
                        <linearGradient key={`meetingGradient-${index}`} id={`meetingGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number, name: string) => {
                          const count = Number(value) || 0;
                          const pct = meetingTotal > 0 ? formatPercentCeil((count / meetingTotal) * 100) : '0';
                          return [`${count} meetings • ${pct}%`, name];
                        }}
                      />
                    }
                  />
                  <Pie
                    data={openMeetingsPerProjectData}
                    dataKey="value"
                    nameKey="name"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={70}
                    outerRadius={110}
                    strokeWidth={3}
                    stroke="hsl(var(--background))"
                    label={makePieLabelOutside(meetingTotal)}
                    labelLine={true}
                    onClick={(data) => handleProjectMeetingsPieClick(data)}
                  >
                    {openMeetingsPerProjectData.map((entry, index) => {
                      // Find the project and use its scope color for stroke
                      const project = projects.find(p => p.name === entry.name);
                      const projectScope = Array.isArray(project?.scope) 
                        ? project?.scope[0] || 'Unassigned'
                        : project?.scope || 'Unassigned';
                      const color = getScopeColor(projectScope);
                      return (
                        <Cell 
                          key={`meeting-${entry.name}-${index}`} 
                          fill={`url(#meetingGradient-${index})`}
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planned vs Logged Hours Chart - Full Width */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Planned vs Logged Hours</CardTitle>
          <CardDescription>Monthly comparison of planned hours vs actual logged hours</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
           <div className="relative group w-full">
             <div className="w-full h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart 
                     data={plannedVsLoggedChartData}
                     margin={{ top: 10, right: 0, left: 0, bottom: 60 }}
                     barCategoryGap={10}
                     barGap={2}
                     onClick={handlePlannedVsLoggedChartClick}
                   >
                  <defs>
                    <linearGradient id="plannedHoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="loggedHoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                   <XAxis 
                     dataKey="week" 
                     axisLine={false}
                     tickLine={false}
                     className="text-xs"
                     interval={0}
                     angle={-45}
                     textAnchor="end"
                     height={60}
                     type="category"
                     domain={['dataMin', 'dataMax']}
                   />
                 <YAxis 
                   axisLine={false}
                   tickLine={false}
                   className="text-xs"
                 />
                 <ChartTooltip 
                   content={({ active, payload, label }) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-white dark:bg-gray-800 border rounded-lg p-2 shadow-lg">
                           <p className="text-sm font-medium">{label}</p>
                           {payload.map((entry, index) => (
                             <p key={index} className="text-sm" style={{ color: entry.color }}>
                               {entry.name}: {entry.value} hours
                             </p>
                           ))}
                         </div>
                       );
                     }
                     return null;
                   }} 
                 />
                   <Bar 
                     dataKey="plannedHours" 
                     fill="url(#plannedHoursGradient)"
                     stroke="hsl(var(--chart-4))"
                     radius={[2, 2, 0, 0]}
                     name="Planned Hours"
                     style={{ cursor: 'pointer' }}
                   />
                   <Bar 
                     dataKey="loggedHours" 
                     fill="url(#loggedHoursGradient)"
                     stroke="hsl(var(--chart-2))"
                     radius={[2, 2, 0, 0]}
                     name="Logged Hours"
                     style={{ cursor: 'pointer' }}
                   />
                </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
       </CardContent>
      </Card>


      {/* Export */}
      <FollowUpExport followUps={filteredFollowUps} filters={filters} />

      {/* Follow-Ups Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Follow-Ups</CardTitle>
              <CardDescription>
                Complete history of task follow-ups grouped by project and task
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleExpandCollapseAll}
              className="flex items-center gap-2"
            >
              {hasExpandedItems ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search follow-ups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <FollowUpTable
            groupedFollowUps={groupedFollowUps}
            expandedProjects={expandedProjects}
            expandedTasks={expandedTasks}
            editingFollowUp={editingFollowUp}
            editingText={editingText}
            editingTimestamp={editingTimestamp}
            FilterableHeader={FilterableHeader}
            onToggleProjectExpansion={toggleProjectExpansion}
            onToggleTaskExpansion={toggleTaskExpansion}
            onRowClick={handleRowClick}
            onEditClick={handleEditClick}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onEditingTextChange={setEditingText}
            onEditingTimestampChange={setEditingTimestamp}
            getScopeStyle={getScopeStyle}
            getTaskTypeStyle={getTaskTypeStyle}
            getEnvironmentStyle={getEnvironmentStyle}
            getStatusStyle={getStatusStyle}
          />

          {filteredFollowUps.length === 0 && <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? "No follow-ups found matching your search." : "No follow-ups yet. Add follow-ups to tasks to track progress and discussions."}
              </p>
            </div>}
        </CardContent>
      </Card>
    </div>;
};