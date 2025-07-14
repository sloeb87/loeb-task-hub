
import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";
import { Task } from "@/types/task";
import { MetricsCards } from "@/components/MetricsCards";
import { TaskCharts } from "@/components/TaskCharts";
import { TeamPerformanceChart } from "@/components/TeamPerformanceChart";
import { ProjectPerformance } from "@/components/ProjectPerformance";
import { FollowUpsSection } from "@/components/FollowUpsSection";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIDashboardProps {
  tasks: Task[];
  projects: { id: string; name: string; startDate: string; endDate: string; }[];
}

export const KPIDashboard = ({ tasks, projects }: KPIDashboardProps) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  
  const filteredTasks = useMemo(() => {
    if (selectedProject === "all") return tasks;
    return tasks.filter(task => task.project === selectedProject);
  }, [tasks, selectedProject]);

  const availableProjects = useMemo(() => {
    const projectNames = [...new Set(tasks.map(task => task.project))];
    return projectNames.map(name => ({ name, value: name }));
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

  // Gantt chart data for selected project
  const ganttData = useMemo(() => {
    if (selectedProject === "all") return [];
    
    return filteredTasks
      .filter(task => task.project === selectedProject)
      .map(task => {
        const startDate = new Date(task.creationDate);
        const dueDate = new Date(task.dueDate);
        const completionDate = task.completionDate ? new Date(task.completionDate) : null;
        
        return {
          id: task.id,
          title: task.title,
          start: startDate,
          due: dueDate,
          completion: completionDate,
          status: task.status,
          progress: task.status === "Completed" ? 100 : 
                   task.status === "In Progress" ? 60 : 
                   task.status === "On Hold" ? 30 : 10,
          responsible: task.responsible,
          priority: task.priority
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [filteredTasks, selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      case "Open": return "bg-orange-500";
      case "On Hold": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Filter */}
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
        </div>
        {selectedProject !== "all" && (
          <Badge variant="secondary" className="text-sm">
            Viewing: {selectedProject}
          </Badge>
        )}
      </div>

      <MetricsCards metrics={metrics} />
      <TaskCharts statusChartData={statusChartData} priorityChartData={priorityChartData} />
      <TeamPerformanceChart userPerformanceData={userPerformanceData} />
      <ProjectPerformance projectStats={projectStats} />

      {/* Gantt Chart - Only show for specific project */}
      {selectedProject !== "all" && ganttData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Project Timeline - {selectedProject}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ganttData.map((task) => {
                const startDate = task.start;
                const dueDate = task.due;
                const totalDays = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysPassed = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

                return (
                  <div key={task.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span>Responsible: {task.responsible}</span>
                          <span>Priority: {task.priority}</span>
                          <span>Status: {task.status}</span>
                        </div>
                      </div>
                      <Badge variant={task.status === "Completed" ? "default" : "secondary"} className="text-xs">
                        {task.progress}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{startDate.toLocaleDateString()}</span>
                        <span>{dueDate.toLocaleDateString()}</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(task.status)}`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <div 
                          className="absolute top-0 w-0.5 h-2 bg-destructive"
                          style={{ left: `${Math.min(progressPercentage, 100)}%` }}
                          title="Current date"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <FollowUpsSection followUps={filteredFollowUps} selectedProject={selectedProject} />
    </div>
  );
};
