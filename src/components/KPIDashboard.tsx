import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Filter, Calendar as CalendarIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { TaskCharts } from "@/components/TaskCharts";
import { FollowUpsSection } from "@/components/FollowUpsSection";
import { ProfessionalMetricsCards } from "@/components/ProfessionalMetricsCards";
import { TaskMetricsDetail } from "@/components/TaskMetricsDetail";
import { TaskStatusTimelineChart } from "@/components/TaskStatusTimelineChart";
import { OverdueAnalysisChart } from "@/components/OverdueAnalysisChart";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";

interface KPIDashboardProps {
  tasks: Task[];
  projects: { id: string; name: string; startDate: string; endDate: string; }[];
  onEditTask?: (task: Task) => void;
}

export const KPIDashboard = ({ tasks, projects, onEditTask }: KPIDashboardProps) => {
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
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectMatch = selectedProject === "all" || task.project === selectedProject;
      const scopeMatch = selectedScope === "all" || task.scope === selectedScope;
      
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
  }, [tasks, selectedProject, selectedScope, selectedTimeRange, customDateFrom, customDateTo]);

  const availableProjects = useMemo(() => {
    const projectNames = [...new Set(tasks.map(task => task.project))];
    return projectNames.map(name => ({ name, value: name }));
  }, [tasks]);

  const availableScopes = useMemo(() => {
    const scopeNames = [...new Set(tasks.map(task => task.scope))];
    return scopeNames.map(name => ({ name, value: name }));
  }, [tasks]);

  const filteredFollowUps = useMemo(() => {
    const followUps = filteredTasks.flatMap(task => 
      task.followUps.map(followUp => ({
        ...followUp,
        taskId: task.id,
        taskTitle: task.title,
        project: task.project
      }))
    );
    return followUps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredTasks]);

  const metrics = useKPIMetrics(filteredTasks);

  const handleMetricClick = (metricType: string, title: string, tasks: Task[]) => {
    console.log('Metric clicked:', metricType, 'tasks:', tasks.length);
    setDetailModal({
      isOpen: true,
      title,
      tasks,
      metricType
    });
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

  // Generate timeline data for status chart - now respects the filtered tasks
  const generateTimelineData = () => {
    const now = new Date();
    const data = [];
    
    // Use custom date range if set, otherwise use default periods
    let startDate: Date;
    let endDate: Date;
    
    if (selectedTimeRange === "custom" && customDateFrom && customDateTo) {
      startDate = new Date(customDateFrom);
      endDate = new Date(customDateTo);
      
      // Generate data based on the custom range
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      const periodsCount = Math.min(12, Math.max(1, daysDiff / 7)); // Weekly periods within the range
      
      for (let i = 0; i < periodsCount; i++) {
        const periodStart = new Date(startDate.getTime() + (i * (daysDiff / periodsCount) * 24 * 60 * 60 * 1000));
        const periodEnd = new Date(startDate.getTime() + ((i + 1) * (daysDiff / periodsCount) * 24 * 60 * 60 * 1000));
        
        const periodTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.creationDate);
          return taskDate >= periodStart && taskDate < periodEnd;
        });
        
        data.push({
          date: periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          open: periodTasks.filter(t => t.status === "Open").length,
          inProgress: periodTasks.filter(t => t.status === "In Progress").length,
          completed: periodTasks.filter(t => t.status === "Completed").length,
        });
      }
    } else {
      // Generate data for the last 12 periods based on time range
      for (let i = 11; i >= 0; i--) {
        let periodStart = new Date();
        let periodEnd = new Date();
        let dateLabel = '';
        
        switch (selectedTimeRange) {
          case "week":
            periodStart.setDate(now.getDate() - (i * 7) - 7);
            periodEnd.setDate(now.getDate() - (i * 7));
            dateLabel = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            break;
          case "month":
            periodStart.setMonth(now.getMonth() - i - 1);
            periodEnd.setMonth(now.getMonth() - i);
            dateLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            break;
          case "quarter":
            periodStart.setMonth(now.getMonth() - (i * 3) - 3);
            periodEnd.setMonth(now.getMonth() - (i * 3));
            dateLabel = `Q${Math.floor(periodStart.getMonth() / 3) + 1} ${periodStart.getFullYear().toString().slice(-2)}`;
            break;
          default:
            periodStart.setMonth(now.getMonth() - i - 1);
            periodEnd.setMonth(now.getMonth() - i);
            dateLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
        
        const periodTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.creationDate);
          return taskDate >= periodStart && taskDate < periodEnd;
        });
        
        data.push({
          date: dateLabel,
          open: periodTasks.filter(t => t.status === "Open").length,
          inProgress: periodTasks.filter(t => t.status === "In Progress").length,
          completed: periodTasks.filter(t => t.status === "Completed").length,
        });
      }
    }
    
    return data;
  };

  const timelineData = generateTimelineData();

  // Calculate overdue analysis
  const overdueTasks = filteredTasks.filter(t => {
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return t.status !== "Completed" && dueDate < today;
  });
  const notOverdueTasks = filteredTasks.filter(t => {
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return t.status === "Completed" || dueDate >= today;
  });

  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
    if (value !== "custom") {
      setCustomDateFrom(undefined);
      setCustomDateTo(undefined);
    }
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
          <Select value={selectedProject} onValueChange={setSelectedProject}>
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
          <Select value={selectedScope} onValueChange={setSelectedScope}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              {availableScopes.map((scope) => (
                <SelectItem key={scope.value} value={scope.value}>
                  {scope.name}
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
            <Badge variant="secondary" className="text-sm">
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
        tasks={filteredTasks} 
        onMetricClick={handleMetricClick}
        timeRange={selectedTimeRange}
      />

      {/* Charts Section */}
      <TaskCharts statusChartData={statusChartData} priorityChartData={priorityChartData} />
      
      {/* New Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatusTimelineChart data={timelineData} />
        <OverdueAnalysisChart 
          overdueCount={overdueTasks.length} 
          notOverdueCount={notOverdueTasks.length} 
        />
      </div>

      {/* Follow-ups Section */}
      <FollowUpsSection followUps={filteredFollowUps} selectedProject={selectedProject} />

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
