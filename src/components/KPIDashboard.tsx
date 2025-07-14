
import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar, BarChart3 } from "lucide-react";
import { Task } from "@/types/task";
import { TaskCharts } from "@/components/TaskCharts";
import { TeamPerformanceChart } from "@/components/TeamPerformanceChart";
import { ProjectPerformance } from "@/components/ProjectPerformance";
import { FollowUpsSection } from "@/components/FollowUpsSection";
import { ProfessionalMetricsCards } from "@/components/ProfessionalMetricsCards";
import { TaskMetricsDetail } from "@/components/TaskMetricsDetail";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIDashboardProps {
  tasks: Task[];
  projects: { id: string; name: string; startDate: string; endDate: string; }[];
}

export const KPIDashboard = ({ tasks, projects }: KPIDashboardProps) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedScope, setSelectedScope] = useState<string>("all");
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
      return projectMatch && scopeMatch;
    });
  }, [tasks, selectedProject, selectedScope]);

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

  const userPerformanceData = Object.entries(metrics.tasksByUser)
    .map(([user, count]) => {
      const userTasks = filteredTasks.filter(t => t.responsible === user);
      const completedTasks = userTasks.filter(t => t.status === "Completed").length;
      return {
        user: user.split(' ').map(n => n[0]).join('').toUpperCase(),
        fullName: user,
        total: count,
        completed: completedTasks,
        completionRate: count > 0 ? (completedTasks / count) * 100 : 0
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  const getProjectStats = () => {
    const projectStats = filteredTasks.reduce((acc, task) => {
      if (!acc[task.project]) {
        acc[task.project] = { total: 0, completed: 0, overdue: 0, inProgress: 0 };
      }
      acc[task.project].total++;
      if (task.status === "Completed") acc[task.project].completed++;
      if (task.status === "In Progress") acc[task.project].inProgress++;
      
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      if (task.status !== "Completed" && dueDate < today) {
        acc[task.project].overdue++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(projectStats).map(([name, stats]) => ({
      name,
      ...stats,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }));
  };

  const projectStats = getProjectStats();

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
        </div>
      </div>

      {/* Professional Metrics Cards */}
      <ProfessionalMetricsCards 
        tasks={filteredTasks} 
        onMetricClick={handleMetricClick}
      />

      {/* Charts Section */}
      <TaskCharts statusChartData={statusChartData} priorityChartData={priorityChartData} />
      
      {/* Team Performance */}
      <TeamPerformanceChart userPerformanceData={userPerformanceData} />
      
      {/* Project Performance */}
      <ProjectPerformance projectStats={projectStats} />

      {/* Follow-ups Section */}
      <FollowUpsSection followUps={filteredFollowUps} selectedProject={selectedProject} />

      {/* Detail Modal */}
      <TaskMetricsDetail
        isOpen={detailModal.isOpen}
        onClose={handleCloseDetail}
        title={detailModal.title}
        tasks={detailModal.tasks}
        metricType={detailModal.metricType as any}
      />
    </div>
  );
};
