
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Task } from "@/types/task";
import { Calendar, User, Clock, AlertTriangle } from "lucide-react";

interface TaskMetricsDetailProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tasks: Task[];
  metricType: 'created' | 'completed' | 'overdue' | 'inprogress' | 'onhold' | 'critical';
  onEditTask?: (task: Task) => void;
}

export const TaskMetricsDetail = React.memo(({ 
  isOpen, 
  onClose, 
  title, 
  tasks, 
  metricType,
  onEditTask 
}: TaskMetricsDetailProps) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Open": return "bg-orange-100 text-orange-800";
      case "On Hold": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "Completed") return false;
    return new Date(dueDate) < new Date();
  };

  const handleRowClick = (task: Task) => {
    console.log('Row clicked for task:', task.id, task.title);
    console.log('onEditTask available:', !!onEditTask);
    
    if (onEditTask) {
      console.log('Calling onEditTask with task:', task.id);
      onEditTask(task);
      // Don't close the metrics detail modal - keep it open so user can return to the list
    } else {
      console.log('onEditTask is not available');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{title}</span>
            <Badge variant="secondary">{tasks.length} tasks</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow 
                  key={task.id}
                  className={`transition-colors ${onEditTask ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(task)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{task.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{task.project}</div>
                      <div className="text-xs text-gray-500">{task.scope}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                    {isOverdue(task.dueDate, task.status) && (
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                        <span className="text-xs text-red-600">Overdue</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-sm">{task.responsible}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-sm">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-sm">
                        {new Date(task.creationDate).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
});
