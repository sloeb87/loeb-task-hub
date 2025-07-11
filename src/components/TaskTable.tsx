
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquarePlus, Edit, Calendar, User, FolderOpen, Mail, FileText, Users } from "lucide-react";
import { Task } from "@/types/task";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
}

export const TaskTable = ({ tasks, onEditTask, onFollowUp }: TaskTableProps) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project & Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status & Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsible
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors">
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
                      onClick={() => onFollowUp(task)}
                      className="flex items-center space-x-1"
                    >
                      <MessageSquarePlus className="w-3 h-3" />
                      <span className="text-xs">Follow Up</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditTask(task)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="text-xs">Edit</span>
                    </Button>
                  </div>
                  {/* Quick Links */}
                  <div className="flex space-x-1 mt-2">
                    {task.links.folder && (
                      <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                        <FolderOpen className="w-3 h-3 text-gray-400" />
                      </Button>
                    )}
                    {task.links.email && (
                      <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                        <Mail className="w-3 h-3 text-gray-400" />
                      </Button>
                    )}
                    {task.links.file && (
                      <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                        <FileText className="w-3 h-3 text-gray-400" />
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
