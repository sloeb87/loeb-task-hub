import React, { useState, useMemo, useCallback } from 'react';
import { useScopeColor } from '@/hooks/useParameterColors';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Filter, Calendar as CalendarIcon, BarChart3 } from "lucide-react";
import { format, startOfWeek, addWeeks, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { TaskCharts } from "@/components/TaskCharts";
import { ProfessionalMetricsCards } from "@/components/ProfessionalMetricsCards";
import { TaskMetricsDetail } from "@/components/TaskMetricsDetail";
import { TaskStatusTimelineChart } from "@/components/TaskStatusTimelineChart";
import { OverdueAnalysisChart } from "@/components/OverdueAnalysisChart";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";
import { useNavigate } from 'react-router-dom';

interface KPIDashboardProps {
  tasks: Task[];
  projects: { id: string; name: string; startDate: string; endDate: string; }[];
  onEditTask?: (task: Task) => void;
}

// Cache interface for dashboard data
interface DashboardCache {
  filteredTasks: Task[];
  kpiTasks: Task[];
  availableProjects: { name: string; value: string; }[];
  availableScopes: { name: string; value: string; }[];
  filteredFollowUps: any[];
  timelineData: any[];
  statusChartData: any[];
  priorityChartData: any[];
  overdueTasks: Task[];
  notOverdueTasks: Task[];
  filterKey: string;
}

export const KPIDashboard = ({ tasks, projects, onEditTask }: KPIDashboardProps) => {
  const { getScopeStyle } = useScopeColor();
  const navigate = useNavigate();
  console.log('KPIDashboard rendered with onEditTask:', !!onEditTask);
  
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    title: string;
    tasks: Task[];
    metricType: string;
  }>({
    isOpen: false,
    title: '',
    tasks: [],
    metricType: ''
  });

  // Cache state for dashboard calculations
  const [dashboardCache, setDashboardCache] = useState<DashboardCache | null>(null);
  
  // Generate cache key based on current filters and tasks
  const generateCacheKey = useCallback(() => {
    const tasksHash = tasks.length + JSON.stringify(tasks.map(t => ({ id: t.id, status: t.status, completionDate: t.completionDate })));
    return `${selectedProject}-${selectedScope}-${selectedTimeRange}-${customDateFrom?.getTime()}-${customDateTo?.getTime()}-${tasksHash}`;
  }, [tasks, selectedProject, selectedScope, selectedTimeRange, customDateFrom, customDateTo]);

  // Clear cache when filters change
  const clearCache = useCallback(() => {
    setDashboardCache(null);
  }, []);

  // Memoized cache-aware data calculation
  const cachedDashboardData = useMemo(() => {
    const currentKey = generateCacheKey();
    
    // Return cached data if available and key matches
    if (dashboardCache && dashboardCache.filterKey === currentKey) {
      return dashboardCache;
    }

    // Calculate fresh data
    const filteredTasks = tasks.filter(task => {
      const projectMatch = selectedProject === "all" || task.project === selectedProject;
      const scopeMatch = selectedScope === "all" || task.scope.includes(selectedScope);
      
      // Date range filtering
      let dateMatch = true;
      if (selectedTimeRange === "custom" && (customDateFrom || customDateTo)) {
        const taskDate = new Date(task.creationDate);
        if (customDateFrom && taskDate < customDateFrom) {
          dateMatch = false;
        }
        if (customDateTo && taskDate > customDateTo) {
          dateMatch = false;
        }
      }
      
      return projectMatch && scopeMatch && dateMatch;
    });

    // Exclude Meeting tasks from all KPI calculations and charts
    const kpiTasks = filteredTasks.filter(task => task.taskType !== "Meeting");

    const availableProjects = [...new Set(tasks.map(task => task.project))]
      .map(name => ({ name, value: name }));

    const availableScopes = [...new Set(tasks.flatMap(task => task.scope))]
      .map(name => ({ name, value: name }));

    const filteredFollowUps = kpiTasks.flatMap(task => 
      task.followUps.map(followUp => ({
        id: followUp.id,
        text: followUp.text,
        timestamp: followUp.timestamp,
        taskId: task.id,
        taskTitle: task.title,
        project: task.project
      }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Generate timeline data
    const generateTimelineData = () => {
      const now = new Date();
      const data = [] as Array<{ date: string; opened: number; completed: number; wip: number }>;
      
      if (selectedTimeRange === "custom" && customDateFrom && customDateTo) {
        const startDate = new Date(customDateFrom);
        const endDate = new Date(customDateTo);
        
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const weeksCount = Math.max(1, Math.ceil(daysDiff / 7));
        
        for (let i = 0; i < weeksCount; i++) {
          const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
          const weekEnd = new Date(startDate.getTime() + ((i + 1) * 7 * 24 * 60 * 60 * 1000));
          
          const openedTasks = kpiTasks.filter(task => {
            const taskDate = new Date(task.creationDate);
            return taskDate >= weekStart && taskDate < weekEnd;
          });
          
          const closedTasks = kpiTasks.filter(task => {
            const completionDate = task.completionDate ? new Date(task.completionDate) : null;
            return completionDate && completionDate >= weekStart && completionDate < weekEnd;
          });
          
          const allTasksUpToWeek = kpiTasks.filter(task => {
            const taskDate = new Date(task.creationDate);
            return taskDate < weekEnd;
          });
          const completedTasksUpToWeek = allTasksUpToWeek.filter(task => {
            const completionDate = task.completionDate ? new Date(task.completionDate) : null;
            return completionDate && completionDate < weekEnd;
          });
          const wipTasks = allTasksUpToWeek.length - completedTasksUpToWeek.length;
          
          data.push({
            date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            opened: openedTasks.length,
            completed: closedTasks.length,
            wip: wipTasks,
          });
        }
      } else {
        for (let i = 11; i >= 0; i--) {
          const weekStart = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1 });
          const weekEnd = addDays(weekStart, 7);

          const dateLabel = format(weekStart, 'MMM d');

          const openedTasks = kpiTasks.filter(task => {
            const taskDate = new Date(task.creationDate);
            return taskDate >= weekStart && taskDate < weekEnd;
          });

          const closedTasks = kpiTasks.filter(task => {
            const completionDate = task.completionDate ? new Date(task.completionDate) : null;
            return completionDate && completionDate >= weekStart && completionDate < weekEnd;
          });

          const allTasksUpToWeek = kpiTasks.filter(task => {
            const taskDate = new Date(task.creationDate);
            return taskDate < weekEnd;
          });
          const completedTasksUpToWeek = allTasksUpToWeek.filter(task => {
            const completionDate = task.completionDate ? new Date(task.completionDate) : null;
            return completionDate && completionDate < weekEnd;
          });
          const wipTasks = allTasksUpToWeek.length - completedTasksUpToWeek.length;

          data.push({
            date: dateLabel,
            opened: openedTasks.length,
            completed: closedTasks.length,
            wip: wipTasks,
          });
        }
      }
      
      return data;
    };

    const timelineData = generateTimelineData();

    // Calculate overdue analysis
    const today = new Date();
    const overdueTasks = kpiTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return t.status !== "Completed" && dueDate < today;
    });
    const notOverdueTasks = kpiTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return t.status === "Completed" || dueDate >= today;
    });

    // Calculate metrics using the hook
    const metrics = { 
      totalTasks: kpiTasks.length,
      tasksByStatus: kpiTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tasksByPriority: kpiTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const statusChartData = Object.entries(metrics.tasksByStatus).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / metrics.totalTasks) * 100).toFixed(1)
    }));

    const priorityChartData = Object.entries(metrics.tasksByPriority).map(([priority, count]) => ({
      priority,
      count,
      percentage: ((count / metrics.totalTasks) * 100).toFixed(1)
    }));

    const newCache: DashboardCache = {
      filteredTasks,
      kpiTasks,
      availableProjects,
      availableScopes,
      filteredFollowUps,
      timelineData,
      statusChartData,
      priorityChartData,
      overdueTasks,
      notOverdueTasks,
      filterKey: currentKey
    };

    // Cache the calculated data
    setDashboardCache(newCache);
    
    return newCache;
  }, [generateCacheKey, dashboardCache, tasks, selectedProject, selectedScope, selectedTimeRange, customDateFrom, customDateTo]);

  // Use cached data
  const { 
    filteredTasks, 
    kpiTasks, 
    availableProjects, 
    availableScopes, 
    filteredFollowUps, 
    timelineData, 
    statusChartData, 
    priorityChartData, 
    overdueTasks, 
    notOverdueTasks 
  } = cachedDashboardData;

  const metrics = useKPIMetrics(kpiTasks);

  const handleMetricClick = (metricType: string, title: string, tasks: Task[]) => {
    console.log('Metric clicked:', metricType, 'tasks:', tasks.length);
    
    // Navigate to tasks view with filtered tasks by creating a date filter
    // that includes all the filtered tasks by their creation dates
    const taskDates = tasks.map(task => new Date(task.creationDate));
    if (taskDates.length > 0) {
      const minDate = new Date(Math.min(...taskDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...taskDates.map(d => d.getTime())));
      
      navigate('/', {
        state: {
          activeView: 'tasks',
          dateFilter: {
            from: minDate,
            to: maxDate
          }
        }
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailModal({
      isOpen: false,
      title: '',
      tasks: [],
      metricType: ''
    });
  };

  const handleEditTaskFromDetail = (task: Task) => {
    console.log('handleEditTaskFromDetail called with task:', task.id);
    if (onEditTask) {
      console.log('Calling onEditTask from KPIDashboard');
      onEditTask(task);
    } else {
      console.log('onEditTask not available in KPIDashboard');
    }
  };

  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
    if (value !== "custom") {
      setCustomDateFrom(undefined);
      setCustomDateTo(undefined);
    }
    // Clear cache when filters change
    clearCache();
  };

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    clearCache();
  };

  const handleScopeChange = (value: string) => {
    setSelectedScope(value);
    clearCache();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Professional task management insights</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedProject} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {availableProjects.map((project) => (
                <SelectItem key={project.value} value={project.value}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedScope} onValueChange={handleScopeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              {availableScopes.map((scope) => (
                 <SelectItem key={scope.name} value={scope.name}>
                   <div className="flex items-center">
                     <div 
                       className="w-3 h-3 rounded-full mr-2" 
                       style={{ backgroundColor: getScopeStyle(scope.name).color }}
                     ></div>
                     {scope.name}
                   </div>
                 </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Custom Date Range Pickers */}
          {selectedTimeRange === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !customDateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateFrom ? format(customDateFrom, "PPP") : <span>From date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !customDateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateTo ? format(customDateTo, "PPP") : <span>To date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedProject !== "all" && (
            <Badge variant="secondary" className="text-sm">
              Project: {selectedProject}
            </Badge>
          )}
          {selectedScope !== "all" && (
            <Badge 
              className="border"
              style={getScopeStyle(selectedScope)}
            >
              Scope: {selectedScope}
            </Badge>
          )}
          {selectedTimeRange !== "all" && (
            <Badge variant="secondary" className="text-sm">
              Time: {selectedTimeRange === "custom" ? "Custom Range" : selectedTimeRange}
            </Badge>
          )}
          {selectedTimeRange === "custom" && (customDateFrom || customDateTo) && (
            <Badge variant="secondary" className="text-sm">
              {customDateFrom ? format(customDateFrom, "MMM dd") : "Start"} - {customDateTo ? format(customDateTo, "MMM dd") : "End"}
            </Badge>
          )}
        </div>
      </div>

      {/* Professional Metrics Cards */}
      <ProfessionalMetricsCards 
        tasks={kpiTasks} 
        onMetricClick={handleMetricClick}
        timeRange={selectedTimeRange}
      />

      {/* Charts Section */}
      <TaskCharts 
        statusChartData={statusChartData} 
        priorityChartData={priorityChartData}
        tasks={kpiTasks}
        onMetricClick={handleMetricClick}
      />

      {/* New Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatusTimelineChart data={timelineData} />
        <OverdueAnalysisChart 
          overdueCount={overdueTasks.length} 
          notOverdueCount={notOverdueTasks.length} 
        />
      </div>

      {/* Detail Modal */}
      <TaskMetricsDetail
        isOpen={detailModal.isOpen}
        onClose={handleCloseDetail}
        title={detailModal.title}
        tasks={detailModal.tasks}
        metricType={detailModal.metricType as any}
        onEditTask={handleEditTaskFromDetail}
      />
    </div>
  );
};
