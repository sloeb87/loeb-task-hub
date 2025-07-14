import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Task } from "@/types/task";

interface TaskSummaryCardsProps {
  tasks: Task[];
  activeFilter: string;
  onFilterChange: (filter: "all" | "open" | "inprogress" | "onhold" | "critical") => void;
}

export const TaskSummaryCards = ({ tasks, activeFilter, onFilterChange }: TaskSummaryCardsProps) => {
  const getFilteredCount = (filter: string) => {
    switch (filter) {
      case "all":
        return tasks.length; // Include ALL tasks, including completed ones
      case "open":
        return tasks.filter(t => t.status === "Open").length;
      case "inprogress":
        return tasks.filter(t => t.status === "In Progress").length;
      case "onhold":
        return tasks.filter(t => t.status === "On Hold").length;
      case "critical":
        return tasks.filter(t => t.priority === "Critical").length;
      default:
        return 0;
    }
  };

  const cards = [
    {
      key: "all",
      title: "Total Tasks",
      count: getFilteredCount("all"),
      color: "blue"
    },
    {
      key: "open",
      title: "Open",
      count: getFilteredCount("open"),
      color: "orange"
    },
    {
      key: "inprogress",
      title: "In Progress",
      count: getFilteredCount("inprogress"),
      color: "blue"
    },
    {
      key: "onhold",
      title: "On Hold",
      count: getFilteredCount("onhold"),
      color: "gray"
    },
    {
      key: "critical",
      title: "Critical",
      count: getFilteredCount("critical"),
      color: "red"
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        text: "text-blue-600",
        bg: "bg-blue-100 dark:bg-blue-900",
        dot: "bg-blue-600",
        ring: "ring-blue-500"
      },
      orange: {
        text: "text-orange-600",
        bg: "bg-orange-100 dark:bg-orange-900",
        dot: "bg-orange-600",
        ring: "ring-orange-500"
      },
      gray: {
        text: "text-gray-600",
        bg: "bg-gray-100 dark:bg-gray-700",
        dot: "bg-gray-600",
        ring: "ring-gray-500"
      },
      red: {
        text: "text-red-600",
        bg: "bg-red-100 dark:bg-red-900",
        dot: "bg-red-600",
        ring: "ring-red-500"
      }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const colorClasses = getColorClasses(card.color, activeFilter === card.key);
        return (
          <Card 
            key={card.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeFilter === card.key ? `ring-2 ${colorClasses.ring}` : ""
            }`} 
            onClick={() => onFilterChange(card.key as any)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${colorClasses.text}`}>
                    {card.count}
                  </p>
                </div>
                <div className={`h-8 w-8 ${colorClasses.bg} rounded-full flex items-center justify-center`}>
                  <div className={`h-4 w-4 ${colorClasses.dot} rounded-full`}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
