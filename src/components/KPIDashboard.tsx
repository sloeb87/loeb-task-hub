
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Task, KPIMetrics } from "@/types/task";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Calendar, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface KPIDashboardProps {
  tasks: Task[];
  projects: { id: string; name: string; startDate: string; endDate: string; }[];
}

export const KPIDashboard = ({ tasks, projects }: KPIDashboardProps) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  
  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (selectedProject === "all") return tasks;
    return tasks.filter(task => task.project === selectedProject);
  }, [tasks, selectedProject]);

  // Get unique projects from tasks
  const availableProjects = useMemo(() => {
    const projectNames = [...new Set(tasks.map(task => task.project))];
    return projectNames.map(name => ({ name, value: name }));
  }, [tasks]);
  // Calculate KPI metrics
  const calculateMetrics = (): KPIMetrics => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === "Completed").length;
    const overdueTasks = filteredTasks.filter(t => {
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return t.status !== "Completed" && dueDate < today;
    }).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average task duration for completed tasks
    const completedTasksWithDuration = filteredTasks.filter(t => t.status === "Completed" && t.completionDate);
    const totalDuration = completedTasksWithDuration.reduce((sum, task) => {
      const created = new Date(task.creationDate);
      const completed = new Date(task.completionDate!);
      return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
    }, 0);
    const averageTaskDuration = completedTasksWithDuration.length > 0 ? totalDuration / completedTasksWithDuration.length : 0;

    const tasksByStatus = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = filteredTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByUser = filteredTasks.reduce((acc, task) => {
      acc[task.responsible] = (acc[task.responsible] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      averageTaskDuration,
      tasksByStatus,
      tasksByPriority,
      tasksByUser
    };
  };

  const metrics = calculateMetrics();

  const getProjectStats = () => {
    const projectStats = filteredTasks.reduce((acc, task) => {
      if (!acc[task.project]) {
        acc[task.project] = {
          total: 0,
          completed: 0,
          overdue: 0,
          inProgress: 0
        };
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

  // Prepare chart data
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
        const today = new Date();
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

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.completedTasks} of {metrics.totalTasks} tasks
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-3xl font-bold text-red-600">
                  {metrics.overdueTasks}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((metrics.overdueTasks / metrics.totalTasks) * 100).toFixed(1)}% of total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Task Duration</p>
                <p className="text-3xl font-bold text-blue-600">
                  {metrics.averageTaskDuration.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">days to complete</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Object.keys(metrics.tasksByUser).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">team members</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Tasks by Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Tasks by Priority</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={userPerformanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="user" type="category" width={50} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'completionRate' ? `${value}%` : value,
                  name === 'completionRate' ? 'Completion Rate' : 
                  name === 'completed' ? 'Completed Tasks' : 'Total Tasks'
                ]}
                labelFormatter={(label) => {
                  const user = userPerformanceData.find(u => u.user === label);
                  return user ? user.fullName : label;
                }}
              />
              <Bar dataKey="completionRate" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectStats.map((project) => (
              <div key={project.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <Badge variant={project.completionRate === 100 ? "default" : "secondary"}>
                    {project.completionRate.toFixed(0)}% Complete
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total</span>
                    <p className="font-medium">{project.total}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed</span>
                    <p className="font-medium text-green-600">{project.completed}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">In Progress</span>
                    <p className="font-medium text-blue-600">{project.inProgress}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Overdue</span>
                    <p className="font-medium text-red-600">{project.overdue}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              {ganttData.map((task, index) => {
                const startDate = task.start;
                const dueDate = task.due;
                const totalDays = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysPassed = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
                
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
                        {/* Timeline indicator */}
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
    </div>
  );
};
