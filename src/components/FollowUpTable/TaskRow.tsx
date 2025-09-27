import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

interface TaskRowProps {
  projectName: string;
  taskTitle: string;
  isExpanded: boolean;
  taskType: string;
  taskEnvironment: string;
  onToggle: (projectName: string, taskTitle: string) => void;
  getTaskTypeStyle: (type: string) => object;
  getEnvironmentStyle: (environment: string) => object;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  projectName,
  taskTitle,
  isExpanded,
  taskType,
  taskEnvironment,
  onToggle,
  getTaskTypeStyle,
  getEnvironmentStyle
}) => {
  return (
    <TableRow 
      className="bg-muted/30 hover:bg-muted/30 cursor-pointer" 
      onClick={() => onToggle(projectName, taskTitle)}
    >
      <TableCell colSpan={4} className="font-medium text-base py-2 pl-8">
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
          <span>📋 {taskTitle}</span>
          <Badge 
            style={getTaskTypeStyle(taskType)} 
            className="text-xs border"
          >
            {taskType}
          </Badge>
          <Badge 
            style={getEnvironmentStyle(taskEnvironment)} 
            className="text-xs border"
          >
            {taskEnvironment}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
};