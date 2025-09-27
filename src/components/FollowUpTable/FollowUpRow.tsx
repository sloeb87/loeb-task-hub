import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Edit } from "lucide-react";
import { formatDate } from "@/utils/taskOperations";

// Helper function to identify automatic follow-ups
const isAutomaticFollowUp = (text: string): boolean => {
  const automaticPatterns = [
    /^Task marked completed$/,
    /^Status changed from .+ to .+$/,
    /^Priority changed from .+ to .+$/,
    /^Task type changed from .+ to .+$/,
    /^Due date changed from .+ to .+$/,
    /^Task updated: Due date: .+ → .+$/
  ];
  
  return automaticPatterns.some(pattern => pattern.test(text));
};

interface FollowUpRowProps {
  followUp: {
    id: string;
    taskId: string;
    timestamp: string;
    taskStatus: string;
    text: string;
  };
  isEditing: boolean;
  editingText: string;
  editingTimestamp: string;
  onRowClick: (followUp: any, event: React.MouseEvent) => void;
  onEditClick: (followUp: any, event: React.MouseEvent) => void;
  onSaveEdit: (event: React.MouseEvent) => void;
  onCancelEdit: (event: React.MouseEvent) => void;
  onEditingTextChange: (value: string) => void;
  onEditingTimestampChange: (value: string) => void;
  getStatusStyle: (status: string) => object;
}

export const FollowUpRow: React.FC<FollowUpRowProps> = ({
  followUp,
  isEditing,
  editingText,
  editingTimestamp,
  onRowClick,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onEditingTextChange,
  onEditingTimestampChange,
  getStatusStyle
}) => {
  return (
    <TableRow 
      key={`${followUp.taskId}-${followUp.id}`}
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
      onClick={(e) => onRowClick(followUp, e)}
    >
      {/* Date Column */}
      <TableCell className="pl-12">
        {isEditing ? (
          <div className="edit-controls">
            <Input 
              type="datetime-local" 
              value={editingTimestamp} 
              onChange={(e) => onEditingTimestampChange(e.target.value)} 
              className="text-xs w-40" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        ) : (
          <span className="text-sm">
            {formatDate(followUp.timestamp)}
          </span>
        )}
      </TableCell>
      
      {/* Status Column */}
      <TableCell>
        <div className="flex items-center">
          <Badge 
            style={getStatusStyle(followUp.taskStatus)} 
            className="text-sm border"
          >
            {followUp.taskStatus}
          </Badge>
        </div>
      </TableCell>
      
      {/* Follow-Up Text Column */}
      <TableCell>
        {isEditing ? (
          <div className="edit-controls">
            <Textarea 
              value={editingText} 
              onChange={(e) => onEditingTextChange(e.target.value)} 
              className="text-sm min-h-[60px] w-full" 
              onClick={(e) => e.stopPropagation()} 
              rows={2} 
            />
          </div>
        ) : (
          <div className="max-w-md">
            <p className={`text-sm whitespace-pre-wrap ${
              isAutomaticFollowUp(followUp.text) 
                ? 'text-blue-600 dark:text-blue-400' 
                : ''
            }`}>
              {followUp.text}
            </p>
          </div>
        )}
      </TableCell>
      
      {/* Actions Column */}
      <TableCell>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button 
                size="sm" 
                onClick={onSaveEdit} 
                className="h-8 w-8 p-0"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancelEdit} 
                className="h-8 w-8 p-0"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => onEditClick(followUp, e)} 
              className="h-8 w-8 p-0"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};