import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, Calendar, User, FolderOpen, Mail, FileText, Users, ChevronUp, ChevronDown, ExternalLink, Filter } from "lucide-react";
import { Task } from "@/types/task";
import { useState } from "react";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
}

type SortField = 'id' | 'title' | 'project' | 'status' | 'priority' | 'responsible' | 'dueDate';
type SortDirection = 'asc' | 'desc';

interface Filters {
  status: string[];
  priority: string[];
  project: string[];
  responsible: string[];
}

export const TaskTable = ({ tasks, onEditTask, onFollowUp }: TaskTableProps) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    project: [],
    responsible: []
  });
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});

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

  const getUniqueValues = (field: keyof Task) => {
    return [...new Set(tasks.map(task => task[field] as string))].sort();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (filterType: keyof Filters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const toggleFilterDropdown = (filterType: string) => {
    setShowFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (filters.status.length > 0 && !filters.status.includes(task.status)) return false;
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
      if (filters.project.length > 0 && !filters.project.includes(task.project)) return false;
      if (filters.responsible.length > 0 && !filters.responsible.includes(task.responsible)) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

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

  const FilterableHeader = ({ 
    field, 
    filterType, 
    children 
  }: { 
    field: SortField; 
    filterType: keyof Filters; 
    children: React.ReactNode;
  }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 transition-colors flex-1"
          onClick={() => handleSort(field)}
        >
          <span>{children}</span>
          {sortField === field && (
            sortDirection === 'asc' ? 
              <ChevronUp className="w-3 h-3" /> : 
              <ChevronDown className="w-3 h-3" />
          )}
        </div>
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6"
            onClick={() => toggleFilterDropdown(filterType)}
          >
            <Filter className="w-3 h-3" />
          </Button>
          {showFilters[filterType] && (
            <div className="absolute top-8 right-0 z-50 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getUniqueValues(filterType as keyof Task).map(value => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterType}-${value}`}
                      checked={filters[filterType].includes(value)}
                      onCheckedChange={(checked) => 
                        handleFilterChange(filterType, value, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`${filterType}-${value}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
              {filters[filterType].length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFilters(prev => ({ ...prev, [filterType]: [] }))}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
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

  const handleFollowUpClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    onFollowUp(task);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="title">Task</SortableHeader>
              <FilterableHeader field="project" filterType="project">Project & Details</FilterableHeader>
              <FilterableHeader field="status" filterType="status">Status & Priority</FilterableHeader>
              <FilterableHeader field="responsible" filterType="responsible">Responsible</FilterableHeader>
              <SortableHeader field="dueDate">Dates</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                Follow Ups
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedTasks.map((task) => (
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
                    
                    <div className="flex items-center space-x-1 mt-2">
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
                <td 
                  className="px-4 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={(e) => handleFollowUpClick(task, e)}
                >
                  <div className="space-y-2">
                    {task.followUps.length === 0 ? (
                      <div className="text-xs text-gray-400 italic flex items-center">
                        <MessageSquarePlus className="w-3 h-3 mr-1" />
                        Click to add follow-up
                      </div>
                    ) : (
                      task.followUps
                        .slice(-3) // Get last 3 follow-ups
                        .reverse() // Show most recent first
                        .map((followUp, index) => (
                          <div key={followUp.id} className="border-l-2 border-blue-200 pl-2">
                            <div className="text-xs text-gray-600 line-clamp-2">
                              {followUp.text}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {followUp.author} - {new Date(followUp.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                    )}
                    {task.followUps.length > 3 && (
                      <div className="text-xs text-blue-600 italic">
                        +{task.followUps.length - 3} more...
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
