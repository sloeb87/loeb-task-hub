
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquarePlus, Edit, Calendar, User, FolderOpen, Mail, FileText, Users, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { Task } from "@/types/task";
import { useState } from "react";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
}

type SortField = 'id' | 'title' | 'project' | 'status' | 'priority' | 'responsible' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export const TaskTable = ({ tasks, onEditTask, onFollowUp }: TaskTableProps) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle date sorting
    if (sortField === 'dueDate') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-3 h-3" /> : 
            <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleRowClick = (task: Task) => {
    onEditTask(task);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Prevent row click
    action();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="title">Task</SortableHeader>
              <SortableHeader field="project">Project & Details</SortableHeader>
              <SortableHeader field="status">Status & Priority</SortableHeader>
              <SortableHeader field="responsible">Responsible</SortableHeader>
              <SortableHeader field="dueDate">Dates</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTasks.map((task) => (
              <tr 
                key={task.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(task)}
              >
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-600">{task.id}</span>
                      {isOverdue(task.dueDate, task.status) && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {task.description}
                    </p>
                    {task.followUps.length > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <MessageSquarePlus className="w-3 h-3 mr-1" />
                        {task.followUps.length} follow-up{task.followUps.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">{task.project}</div>
                    <div className="text-xs text-gray-500">{task.scope}</div>
                    <div className="text-xs text-gray-500">{task.environment}</div>
                    <Badge variant="outline" className="text-xs">
                      {task.taskType}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{task.responsible}</span>
                  </div>
                  {task.stakeholders.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        +{task.stakeholders.length} stakeholder{task.stakeholders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Created: {new Date(task.creationDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    {task.completionDate && (
                      <div className="flex items-center text-green-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        Completed: {new Date(task.completionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleActionClick(e, () => onFollowUp(task))}
                      className="flex items-center space-x-1"
                    >
                      <MessageSquarePlus className="w-3 h-3" />
                      <span className="text-xs">Follow Up</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleActionClick(e, () => onEditTask(task))}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="text-xs">Edit</span>
                    </Button>
                  </div>
                  {/* Quick Links */}
                  <div className="flex space-x-1 mt-2">
                    {task.links.folder && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1 h-6 w-6 hover:bg-blue-100"
                        onClick={(e) => handleLinkClick(task.links.folder!, e)}
                        title="Open Folder"
                      >
                        <FolderOpen className="w-3 h-3 text-blue-600" />
                      </Button>
                    )}
                    {task.links.email && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1 h-6 w-6 hover:bg-green-100"
                        onClick={(e) => handleLinkClick(`mailto:${task.links.email}`, e)}
                        title="Send Email"
                      >
                        <Mail className="w-3 h-3 text-green-600" />
                      </Button>
                    )}
                    {task.links.file && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1 h-6 w-6 hover:bg-purple-100"
                        onClick={(e) => handleLinkClick(task.links.file!, e)}
                        title="Open File"
                      >
                        <FileText className="w-3 h-3 text-purple-600" />
                      </Button>
                    )}
                    {task.links.oneNote && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1 h-6 w-6 hover:bg-orange-100"
                        onClick={(e) => handleLinkClick(task.links.oneNote!, e)}
                        title="Open OneNote"
                      >
                        <ExternalLink className="w-3 h-3 text-orange-600" />
                      </Button>
                    )}
                    {task.links.teams && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1 h-6 w-6 hover:bg-indigo-100"
                        onClick={(e) => handleLinkClick(task.links.teams!, e)}
                        title="Open Teams"
                      >
                        <ExternalLink className="w-3 h-3 text-indigo-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
