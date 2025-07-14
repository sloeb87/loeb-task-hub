
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  TrendingUp,
  Calendar
} from "lucide-react";
import { Task } from "@/types/task";

interface ProfessionalMetricsCardsProps {
  tasks: Task[];
  onMetricClick: (metricType: string, title: string, filteredTasks: Task[]) => void;
}

export const ProfessionalMetricsCards = ({ tasks, onMetricClick }: ProfessionalMetricsCardsProps) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed");
  const overdueTasks = tasks.filter(t => {
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return t.status !== "Completed" && dueDate < today;
  });
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const onHoldTasks = tasks.filter(t => t.status === "On Hold");
  const criticalTasks = tasks.filter(t => t.priority === "Critical");
  
  // Calculate tasks created this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const tasksCreatedThisMonth = tasks.filter(t => {
    const creationDate = new Date(t.creationDate);
    return creationDate.getMonth() === currentMonth && creationDate.getFullYear() === currentYear;
  });

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const metrics = [
    {
      title: "Total Tasks",
      value: totalTasks,
      subtitle: "All tasks in system",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      metricType: "created",
      tasks: tasks
    },
    {
      title: "Created This Month",
      value: tasksCreatedThisMonth.length,
      subtitle: "New tasks added",
      icon: Plus,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-900",
      metricType: "created",
      tasks: tasksCreatedThisMonth
    },
    {
      title: "Completed Tasks",
      value: completedTasks.length,
      subtitle: `${completionRate.toFixed(1)}% completion rate`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      iconBg: "bg-emerald-100 dark:bg-emerald-900",
      metricType: "completed",
      tasks: completedTasks
    },
    {
      title: "Overdue Tasks",
      value: overdueTasks.length,
      subtitle: `${((overdueTasks.length / totalTasks) * 100).toFixed(1)}% of total`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-900",
      metricType: "overdue",
      tasks: overdueTasks,
      alert: overdueTasks.length > 0
    },
    {
      title: "In Progress",
      value: inProgressTasks.length,
      subtitle: "Active work items",
      icon: Play,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      metricType: "inprogress",
      tasks: inProgressTasks
    },
    {
      title: "On Hold",
      value: onHoldTasks.length,
      subtitle: "Paused tasks",
      icon: Pause,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      iconBg: "bg-gray-100 dark:bg-gray-900",
      metricType: "onhold",
      tasks: onHoldTasks
    },
    {
      title: "Critical Priority",
      value: criticalTasks.length,
      subtitle: "High priority items",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-900",
      metricType: "critical",
      tasks: criticalTasks,
      alert: criticalTasks.length > 0
    },
    {
      title: "Open Tasks",
      value: tasks.filter(t => t.status === "Open").length,
      subtitle: "Awaiting action",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      iconBg: "bg-yellow-100 dark:bg-yellow-900",
      metricType: "open",
      tasks: tasks.filter(t => t.status === "Open")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card 
            key={index}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${metric.bgColor} border-l-4 ${
              metric.alert ? 'border-l-red-500' : 'border-l-transparent'
            }`}
            onClick={() => onMetricClick(metric.metricType, metric.title, metric.tasks)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${metric.iconBg}`}>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-baseline space-x-2">
                <div className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                {metric.alert && (
                  <Badge variant="destructive" className="text-xs">
                    Alert
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metric.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
