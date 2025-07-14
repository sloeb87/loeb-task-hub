
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
  timeRange: string;
}

export const ProfessionalMetricsCards = ({ tasks, onMetricClick, timeRange }: ProfessionalMetricsCardsProps) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed");
  const overdueTasks = tasks.filter(t => {
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return t.status !== "Completed" && dueDate < today;
  });
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const onHoldTasks = tasks.filter(t => t.status === "On Hold");
  
  // Critical tasks that are NOT completed
  const criticalTasks = tasks.filter(t => t.priority === "Critical" && t.status !== "Completed");
  
  // Filter created tasks based on time range
  const getCreatedTasks = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return tasks; // all time
    }
    
    return tasks.filter(t => {
      const creationDate = new Date(t.creationDate);
      return creationDate >= startDate;
    });
  };

  const createdTasks = getCreatedTasks();

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "week": return "This Week";
      case "month": return "This Month";
      case "quarter": return "This Quarter";
      case "year": return "This Year";
      default: return "All Time";
    }
  };

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
      title: "Created",
      value: createdTasks.length,
      subtitle: `${getTimeRangeLabel()}`,
      icon: Plus,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-900",
      metricType: "created",
      tasks: createdTasks
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
      subtitle: "Incomplete critical tasks",
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
