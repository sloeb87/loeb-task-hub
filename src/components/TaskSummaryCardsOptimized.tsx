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

interface DateFilter {
  from: Date;
  to: Date;
}

interface TaskSummaryCardsProps {
  tasks: Task[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  dateFilter?: DateFilter;
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
  onFilterChange,
  dateFilter 
}: TaskSummaryCardsProps) => {
  
  const stats = useMemo((): TaskStat[] => {
    // Apply date filter if present to get the correct counts
    let filteredForCounting = tasks;
    if (dateFilter) {
      filteredForCounting = tasks.filter(task => {
        const creationDate = new Date(task.creationDate);
        const dueDate = new Date(task.dueDate);
        const completionDate = task.completionDate ? new Date(task.completionDate) : null;
        
        // Normalize dates to start of day for comparison
        const creationDateNormalized = new Date(creationDate.getFullYear(), creationDate.getMonth(), creationDate.getDate());
        const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const completionDateNormalized = completionDate ? new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate()) : null;
        const filterStartNormalized = new Date(dateFilter.from.getFullYear(), dateFilter.from.getMonth(), dateFilter.from.getDate());
        const filterEndNormalized = new Date(dateFilter.to.getFullYear(), dateFilter.to.getMonth(), dateFilter.to.getDate());
        
        const wasCreatedBeforeOrDuringPeriod = creationDateNormalized <= filterEndNormalized;
        const isDueAfterOrDuringPeriod = dueDateNormalized >= filterStartNormalized;
        const wasNotCompletedBeforePeriod = !completionDateNormalized || completionDateNormalized >= filterStartNormalized;
        
        return wasCreatedBeforeOrDuringPeriod && isDueAfterOrDuringPeriod && wasNotCompletedBeforePeriod;
      });
    }

    const openTasks = filteredForCounting.filter(t => t.status === "Open").length;
    const inProgressTasks = filteredForCounting.filter(t => t.status === "In Progress").length;
    const activeTasks = openTasks + inProgressTasks; // Merge Open and In Progress
    const onHoldTasks = filteredForCounting.filter(t => t.status === "On Hold").length;
    const criticalTasks = filteredForCounting.filter(t => t.priority === "Critical" && t.status !== "Completed").length;
    const completedTasks = filteredForCounting.filter(t => t.status === "Completed").length;

    return [
      {
        title: "All Tasks",
        count: filteredForCounting.length,
        icon: ListTodo,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        filter: "all" as FilterType
      },
      {
        title: "Active",
        count: activeTasks,
        icon: Play,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        filter: "active" as FilterType
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
  }, [tasks, dateFilter]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilter === stat.filter;
        
        return (
          <Card 
            key={stat.filter}
            className={`transition-all hover:shadow-md cursor-pointer ${
              isActive 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => onFilterChange(stat.filter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
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