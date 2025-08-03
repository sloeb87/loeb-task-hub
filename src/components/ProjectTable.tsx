import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useScopeColor } from "@/hooks/useScopeColor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, ChevronUp, ChevronDown, Plus, Edit, FileBarChart, FolderOpen, Mail, FileText, ExternalLink, MessageSquare, Filter, Search } from "lucide-react";
import { Project, Task } from "@/types/task";

interface ProjectTableProps {
  projects: Project[];
  tasks: Task[];
  onEditProject: (project: Project) => void;
  onCreateTask: (projectId: string) => void;
  onAddTaskToProject: (projectId: string) => void;
  onGenerateReport?: (project: Project) => void;
  filter?: 'all' | 'active' | 'on-hold' | 'completed';
}

type SortField = 'name' | 'scope' | 'owner' | 'startDate' | 'endDate' | 'status';
type SortDirection = 'asc' | 'desc';

interface ProjectFilters {
  scope: string[];
  owner: string[];
  status: string[];
}

export const ProjectTable = ({
  projects,
  tasks,
  onEditProject,
  onCreateTask,
  onAddTaskToProject,
  onGenerateReport,
  filter = 'all'
}: ProjectTableProps) => {
  const { getScopeStyle } = useScopeColor();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ProjectFilters>({
    scope: [],
    owner: [],
    status: []
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

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks * 100 : 0;
    return {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks: projectTasks.filter(task => task.status !== 'Completed' && new Date(task.dueDate) < new Date()).length,
      projectTasks
    };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getUniqueValues = (field: keyof Project) => {
    const values = [...new Set(projects.map(project => project[field] as string))].filter(Boolean);
    
    // Add default scope values if filtering by scope
    if (field === 'scope') {
      const allScopes = ['Frontend', 'Backend', 'Database', 'Infrastructure', 'Mobile', 'API', 'UI/UX', 'DevOps'];
      allScopes.forEach(scope => {
        if (!values.includes(scope)) {
          values.push(scope);
        }
      });
    }
    
    return values.sort();
  };

  const handleFilterChange = (filterType: keyof ProjectFilters, value: string, checked: boolean) => {
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

  const clearFilter = (filterType: keyof ProjectFilters) => {
    setFilters(prev => ({ ...prev, [filterType]: [] }));
  };

  const filteredProjects = projects.filter(project => {
    // Apply search filter
    const matchesSearch = searchTerm === "" || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    // Apply main filter
    if (filter === 'active' && project.status !== 'Active') return false;
    if (filter === 'on-hold' && project.status !== 'On Hold') return false;
    if (filter === 'completed' && project.status !== 'Completed') return false;
    
    // Apply additional filters
    if (filters.scope.length > 0 && !filters.scope.includes(project.scope)) return false;
    if (filters.owner.length > 0 && !filters.owner.includes(project.owner)) return false;
    if (filters.status.length > 0 && !filters.status.includes(project.status)) return false;
    
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];
    if (sortField === 'startDate' || sortField === 'endDate') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({
    field,
    children
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-1 rounded" onClick={() => handleSort(field)}>
      <span>{children}</span>
      {sortField === field && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </div>
  );

  const FilterableHeader = ({ 
    field, 
    filterType, 
    children 
  }: { 
    field: SortField; 
    filterType: keyof ProjectFilters; 
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
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-w-xs">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {getUniqueValues(filterType as keyof Project).map(value => (
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

  const toggleExpanded = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const handleRowClick = (project: Project) => {
    console.log('Row clicked:', project.name);
    onEditProject(project);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search projects..."
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
              <TableHead style={{ minWidth: '50px' }}>
                {/* Empty header for expand/collapse */}
              </TableHead>
              <TableHead style={{ minWidth: '120px' }}>
                <FilterableHeader field="scope" filterType="scope">Scope</FilterableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '300px' }}>
                <SortableHeader field="name">Project Name</SortableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '180px' }}>
                <FilterableHeader field="owner" filterType="owner">Owner & Team</FilterableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '220px' }}>
                <FilterableHeader field="status" filterType="status">Status & Progress</FilterableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '150px' }}>
                <SortableHeader field="startDate">Timeline</SortableHeader>
              </TableHead>
              <TableHead style={{ minWidth: '100px' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map(project => {
              const stats = getProjectStats(project);
              const isExpanded = expandedProject === project.id;
              return (
                <React.Fragment key={project.id}>
                  <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => handleRowClick(project)}>
                    {/* Expand/Collapse Column */}
                    <TableCell>
                      <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={e => toggleExpanded(project.id, e)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </TableCell>

                    {/* Scope Column */}
                    <TableCell>
                      <Badge 
                        className="text-sm font-medium border"
                        style={getScopeStyle(project.scope)}
                      >
                        {project.scope}
                      </Badge>
                    </TableCell>

                    {/* Project Name Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
                        
                        {/* Project Links */}
                        <div className="flex items-center space-x-1 mt-2">
                          {project.links?.folder && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={(e) => handleLinkClick(project.links.folder!, e)}
                              title="Open Project Folder"
                            >
                              <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </Button>
                          )}
                          {project.links?.email && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-green-100 dark:hover:bg-green-900"
                              onClick={(e) => handleLinkClick(`mailto:${project.links.email}`, e)}
                              title="Send Project Email"
                            >
                              <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </Button>
                          )}
                          {project.links?.file && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
                              onClick={(e) => handleLinkClick(project.links.file!, e)}
                              title="Open Project File"
                            >
                              <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            </Button>
                          )}
                          {project.links?.oneNote && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
                              onClick={(e) => handleLinkClick(project.links.oneNote!, e)}
                              title="Open Project OneNote"
                            >
                              <ExternalLink className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                            </Button>
                          )}
                          {project.links?.teams && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                              onClick={(e) => handleLinkClick(project.links.teams!, e)}
                              title="Open Project Teams"
                            >
                              <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Owner & Team Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{project.owner}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{project.team.length} team members</p>
                      </div>
                    </TableCell>

                    {/* Status & Progress Column */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={project.status === 'Active' ? 'default' : project.status === 'Completed' ? 'secondary' : 'outline'}>
                            {project.status}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {stats.completedTasks}/{stats.totalTasks} tasks
                          {stats.overdueTasks > 0 && <span className="text-red-600 dark:text-red-400 ml-1">({stats.overdueTasks} overdue)</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Timeline Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="w-3 h-3" />
                          <span>{project.startDate}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          to {project.endDate}
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900" onClick={e => handleActionClick(e, () => onCreateTask(project.id))} title="Create New Task">
                          <Plus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </Button>
                        
                        {onGenerateReport && (
                          <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900" onClick={e => handleActionClick(e, () => onGenerateReport(project))} title="Generate Report">
                            <FileBarChart className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <TableRow className="bg-gray-50 dark:bg-gray-900">
                      <TableCell colSpan={7}>
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Project Tasks</h4>
                            {stats.projectTasks.length > 0 ? (
                              <div className="space-y-2">
                                {stats.projectTasks.map(task => (
                                  <div key={task.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                                    <div className="flex items-center space-x-3">
                                      <Badge variant="outline" className="text-xs">
                                        {task.id}
                                      </Badge>
                                      <span className="text-sm text-gray-900 dark:text-white">{task.title}</span>
                                      <Badge variant={task.status === 'Completed' ? 'secondary' : task.status === 'In Progress' ? 'default' : 'outline'} className="text-xs">
                                        {task.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{task.responsible}</span>
                                      <span>Due: {task.dueDate}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to this project yet.</p>
                            )}
                            
                            {/* Recent Comments Section */}
                            {stats.projectTasks.some(task => task.followUps && task.followUps.length > 0) && (
                              <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Recent Follow-ups
                                </h4>
                                <div className="space-y-3">
                                  {stats.projectTasks
                                    .filter(task => task.followUps && task.followUps.length > 0)
                                    .slice(0, 3)
                                    .map(task => (
                                      <div key={task.id} className="bg-white dark:bg-gray-700 rounded border dark:border-gray-600 p-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Badge variant="outline" className="text-xs">
                                            {task.id}
                                          </Badge>
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</span>
                                        </div>
                                        <div className="space-y-2">
                                          {task.followUps!
                                            .slice(-3)
                                            .reverse()
                                            .map((followUp, index) => (
                                              <div key={index} className="border-l-2 border-blue-200 dark:border-blue-700 pl-3">
                                                <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                  {followUp.text}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                  {new Date(followUp.timestamp).toLocaleDateString()}
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {sortedProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No projects found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
