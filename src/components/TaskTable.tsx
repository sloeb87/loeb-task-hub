import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquarePlus, Calendar, User, FolderOpen, Mail, FileText, Users, ChevronUp, ChevronDown, ExternalLink, Filter, Search } from "lucide-react";
import { Task } from "@/types/task";
import React, { useState, useRef, useEffect } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    project: [],
    responsible: []
  });
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside = Object.keys(showFilters).every(filterType => {
        const ref = filterRefs.current[filterType];
        return !ref || !ref.contains(target);
      });
      
      if (clickedOutside) {
        setShowFilters({});
      }
    };

    if (Object.values(showFilters).some(show => show)) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

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
    const values = [...new Set(tasks.map(task => task[field] as string))].filter(Boolean);
    
    // Ensure all possible values are included for specific fields
    if (field === 'status') {
      const allStatuses = ['Open', 'In Progress', 'Completed', 'On Hold'];
      allStatuses.forEach(status => {
        if (!values.includes(status)) {
          values.push(status);
        }
      });
    } else if (field === 'priority') {
      const allPriorities = ['Low', 'Medium', 'High', 'Critical'];
      allPriorities.forEach(priority => {
        if (!values.includes(priority)) {
          values.push(priority);
        }
      });
    }
    
    return values.sort();
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

  const toggleFilterDropdown = (filterType: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Filter button clicked:', filterType);
    setShowFilters(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {});
      newState[filterType] = !prev[filterType];
      console.log('New filter state:', newState);
      return newState;
    });
  };

  const clearFilter = (filterType: keyof Filters) => {
    setFilters(prev => ({ ...prev, [filterType]: [] }));
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
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
    <div 
      className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-1 rounded"
      onClick={() => handleSort(field)}
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUp className="w-3 h-3" /> : 
          <ChevronDown className="w-3 h-3" />
      )}
    </div>
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
    <div className="flex items-center justify-between min-w-0">
      <SortableHeader field={field}>{children}</SortableHeader>
      <div className="relative ml-2" ref={el => filterRefs.current[filterType] = el}>
        <Button
          size="sm"
          variant="ghost"
          className={`p-1 h-6 w-6 shrink-0 ${filters[filterType].length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
          onClick={(e) => toggleFilterDropdown(filterType, e)}
        >
          <Filter className="w-3 h-3" />
          {filters[filterType].length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {filters[filterType].length}
            </span>
          )}
        </Button>
        {showFilters[filterType] && (
          <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[250px]">
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
                    className="text-sm cursor-pointer flex-1 text-gray-900 dark:text-white truncate"
                    title={value}
                  >
                    {value}
                  </label>
                </div>
              ))}
            </div>
            {filters[filterType].length > 0 && (
              <div className="mt-2 pt-2 border-t dark:border-gray-600">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearFilter(filterType)}
                  className="w-full"
                >
                  Clear All ({filters[filterType].length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleRowClick = (task: Task) => {
    console.log('Task row clicked:', task.title);
    onEditTask(task);
  };

  const handleFollowUpClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowUp(task);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-border">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900">
              <TableHead style={{ minWidth: '300px' }}>
                <SortableHeader field="title">Task</SortableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '150px' }}>
                <FilterableHeader field="project" filterType="project">Project</FilterableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '180px' }}>
                <FilterableHeader field="status" filterType="status">Status & Priority</FilterableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '150px' }}>
                <FilterableHeader field="responsible" filterType="responsible">Responsible</FilterableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '120px' }}>
                <SortableHeader field="dueDate">Due Date</SortableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '150px' }}>Follow Ups</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.map((task) => (
              <TableRow 
                key={task.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleRowClick(task)}
              >
                {/* Task Column */}
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{task.id}</span>
                      {isOverdue(task.dueDate, task.status) && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center space-x-1">
                      {task.links.folder && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
                          onClick={(e) => handleLinkClick(task.links.folder!, e)}
                          title="Open Folder"
                        >
                          <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </Button>
                      )}
                      {task.links.email && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={(e) => handleLinkClick(`mailto:${task.links.email}`, e)}
                          title="Send Email"
                        >
                          <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </Button>
                      )}
                      {task.links.file && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
                          onClick={(e) => handleLinkClick(task.links.file!, e)}
                          title="Open File"
                        >
                          <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </Button>
                      )}
                      {task.links.oneNote && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
                          onClick={(e) => handleLinkClick(task.links.oneNote!, e)}
                          title="Open OneNote"
                        >
                          <ExternalLink className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                        </Button>
                      )}
                      {task.links.teams && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                          onClick={(e) => handleLinkClick(task.links.teams!, e)}
                          title="Open Teams"
                        >
                          <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Project Column */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{task.project}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{task.scope}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{task.environment}</div>
                    <Badge variant="outline" className="text-xs">
                      {task.taskType}
                    </Badge>
                  </div>
                </TableCell>

                {/* Status & Priority Column */}
                <TableCell>
                  <div className="space-y-2">
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </TableCell>

                {/* Responsible Column */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{task.responsible}</span>
                    </div>
                    {task.stakeholders.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{task.stakeholders.length} stakeholder{task.stakeholders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Due Date Column */}
                <TableCell>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    {task.completionDate && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        Completed: {new Date(task.completionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Follow Ups Column */}
                <TableCell>
                  <div className="space-y-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors p-2 rounded" onClick={(e) => handleFollowUpClick(task, e)}>
                    {task.followUps.length === 0 ? (
                      <div className="text-xs text-gray-400 italic flex items-center">
                        <MessageSquarePlus className="w-3 h-3 mr-1" />
                        Click to add follow-up
                      </div>
                    ) : (
                      task.followUps
                        .slice(-3)
                        .reverse()
                        .map((followUp, index) => (
                          <div key={followUp.id} className="border-l-2 border-blue-200 dark:border-blue-700 pl-2">
                            <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                              {followUp.text}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(followUp.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                    )}
                    {task.followUps.length > 3 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                        +{task.followUps.length - 3} more...
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No tasks found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
