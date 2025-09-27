import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ProjectRowProps {
  projectName: string;
  isExpanded: boolean;
  firstFollowUpScope: string;
  onToggle: (projectName: string) => void;
  getScopeStyle: (scope: string) => object;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({
  projectName,
  isExpanded,
  firstFollowUpScope,
  onToggle,
  getScopeStyle
}) => {
  return (
    <TableRow 
      className="bg-muted/50 hover:bg-muted/50 cursor-pointer" 
      onClick={() => onToggle(projectName)}
    >
      <TableCell colSpan={4} className="font-semibold text-lg py-3">
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
          <span>📁 {projectName}</span>
          <Badge 
            style={getScopeStyle(firstFollowUpScope)} 
            className="text-sm border"
          >
            {firstFollowUpScope}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
};