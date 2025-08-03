import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ListTodo, 
  Clock, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle2 
} from "lucide-react";
import { Task } from "@/types/task";
import { FilterType } from "@/hooks/useTaskFilters";

interface TaskSummaryCardsProps {
  tasks: Task[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

interface TaskStat {
  title: string;
  count: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  filter: FilterType;
}

export const TaskSummaryCardsOptimized = React.memo(({ 
  tasks, 
  activeFilter, 
  onFilterChange 
}: TaskSummaryCardsProps) => {
  
  const stats = useMemo((): TaskStat[] => {
    const openTasks = tasks.filter(t => t.status === "Open").length;
    const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
    const onHoldTasks = tasks.filter(t => t.status === "On Hold").length;
    const criticalTasks = tasks.filter(t => t.priority === "Critical" && t.status !== "Completed").length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;

    return [
      {
        title: "All Tasks",
        count: tasks.length,
        icon: ListTodo,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        filter: "all" as FilterType
      },
      {
        title: "Open",
        count: openTasks,
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        filter: "open" as FilterType
      },
      {
        title: "In Progress",
        count: inProgressTasks,
        icon: Play,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        filter: "inprogress" as FilterType
      },
      {
        title: "On Hold",
        count: onHoldTasks,
        icon: Pause,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        filter: "onhold" as FilterType
      },
      {
        title: "Critical",
        count: criticalTasks,
        icon: AlertTriangle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        filter: "critical" as FilterType
      }
    ];
  }, [tasks]);

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilter === stat.filter;
        
        return (
          <Card 
            key={stat.filter}
            className={`transition-all duration-200 hover:shadow-md cursor-pointer transform hover:scale-105 ${
              isActive 
                ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => onFilterChange(stat.filter)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.count}
                </div>
                {isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

TaskSummaryCardsOptimized.displayName = 'TaskSummaryCardsOptimized';