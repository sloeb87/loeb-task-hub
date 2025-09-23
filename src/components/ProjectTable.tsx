import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Plus, Edit, Trash2, Users, Calendar, CheckCircle, FolderOpen, FileText, Clock, AlertTriangle, Filter, Search, ListTodo } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Project, Task } from "@/types/task";
import { useScopeColor } from '@/hooks/useParameterColors';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileProjectCard } from './MobileProjectCard';
interface ProjectTableProps {
  projects: Project[];
  tasks: Task[];
  onCreateProject: (projectData: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateTask: (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  projectFilter: 'all' | 'active' | 'on-hold' | 'completed';
  setProjectFilter: (filter: 'all' | 'active' | 'on-hold' | 'completed') => void;
  onAddFollowUp: (taskId: string, followUpText: string) => void;
  onViewProject?: (project: Project) => void; // New prop for viewing project details
}
export const ProjectTable = ({
  projects,
  tasks,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  projectFilter,
  setProjectFilter,
  onAddFollowUp,
  onViewProject
}: ProjectTableProps) => {
  const isMobile = useIsMobile();
  const { getScopeStyle, loading: scopeLoading } = useScopeColor();
  
  // Wait for parameter colors to load to prevent the grey-to-color flash
  const parametersLoading = scopeLoading;

  // Filter states
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    
    // Separate tasks and meetings
    const regularTasks = projectTasks.filter(task => task.taskType !== 'Meeting');
    const meetings = projectTasks.filter(task => task.taskType === 'Meeting');
    
    // Calculate totals
    const totalTasks = regularTasks.length;
    const totalMeetings = meetings.length;
    const totalItems = totalTasks + totalMeetings;
    
    // Calculate completed counts
    const completedTasks = regularTasks.filter(task => task.status === 'Completed').length;
    const completedMeetings = meetings.filter(task => task.status === 'Completed').length;
    const totalCompleted = completedTasks + completedMeetings;
    
    // Calculate active (non-completed) counts
    const activeTasks = regularTasks.filter(task => task.status !== 'Completed').length;
    const activeMeetings = meetings.filter(task => task.status !== 'Completed').length;
    
    // Calculate completion rate for progress bar based on all items
    const completionRate = totalItems > 0 ? Math.round(totalCompleted / totalItems * 100) : 0;
    
    return {
      activeTasks,
      totalTasks,
      activeMeetings,
      totalMeetings,
      completionRate,
      completedTasks,
      completedMeetings,
      totalCompleted,
      totalItems
    };
  };
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Filter projects based on projectFilter and custom filters
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scope.some(scope => scope.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (projectFilter === 'active') filtered = filtered.filter(p => p.status === 'Active');
    if (projectFilter === 'on-hold') filtered = filtered.filter(p => p.status === 'On Hold');
    if (projectFilter === 'completed') filtered = filtered.filter(p => p.status === 'Completed');

    // Apply scope filter
    if (selectedScopes.length > 0) {
      filtered = filtered.filter(p => selectedScopes.some(scope => p.scope.includes(scope)));
    }

    // Apply project name filter
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(p => selectedProjects.includes(p.name));
    }
    return filtered;
  }, [projects, projectFilter, selectedScopes, selectedProjects, searchTerm]);
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      // Primary sort: by scope (first scope alphabetically)
      const aFirstScope = a.scope[0] || '';
      const bFirstScope = b.scope[0] || '';
      const scopeComparison = aFirstScope.localeCompare(bFirstScope);
      
      // Secondary sort: by project name if scopes are the same
      if (scopeComparison === 0) {
        return a.name.localeCompare(b.name);
      }
      
      return scopeComparison;
    });
  }, [filteredProjects]);

  // Get unique values for filters
  const uniqueScopes = useMemo(() => {
    return [...new Set(projects.flatMap(p => p.scope))].sort();
  }, [projects]);
  const uniqueProjectNames = useMemo(() => {
    return [...new Set(projects.map(p => p.name))].sort();
  }, [projects]);

  // Filter handlers
  const handleScopeFilterChange = (scope: string, checked: boolean) => {
    if (checked) {
      setSelectedScopes(prev => [...prev, scope]);
    } else {
      setSelectedScopes(prev => prev.filter(s => s !== scope));
    }
  };
  const handleProjectFilterChange = (projectName: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectName]);
    } else {
      setSelectedProjects(prev => prev.filter(p => p !== projectName));
    }
  };
  const handleRowClick = (project: Project) => {
    if (onViewProject) {
      onViewProject(project);
    } else {
      // Fallback to edit project if onViewProject is not provided
      onUpdateProject(project);
    }
  };

  // Mobile view
  if (isMobile) {
    // Show loading skeleton for mobile while parameters are loading
    if (parametersLoading) {
      return (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex space-x-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-18" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          <Button variant={projectFilter === 'all' ? 'default' : 'outline'} onClick={() => setProjectFilter('all')} size="sm">
            All ({projects.length})
          </Button>
          <Button variant={projectFilter === 'active' ? 'default' : 'outline'} onClick={() => setProjectFilter('active')} size="sm">
            Active ({projects.filter(p => p.status === 'Active').length})
          </Button>
          <Button variant={projectFilter === 'on-hold' ? 'default' : 'outline'} onClick={() => setProjectFilter('on-hold')} size="sm">
            On Hold ({projects.filter(p => p.status === 'On Hold').length})
          </Button>
          <Button variant={projectFilter === 'completed' ? 'default' : 'outline'} onClick={() => setProjectFilter('completed')} size="sm">
            Completed ({projects.filter(p => p.status === 'Completed').length})
          </Button>
        </div>

        {/* Mobile Project Cards */}
        <div className="space-y-4">
          {sortedProjects.map(project => {
          const projectTasks = tasks.filter(task => task.project === project.name);
          return <MobileProjectCard 
            key={project.id} 
            project={project} 
            projectTasks={projectTasks} 
            onEditProject={onViewProject || onUpdateProject} 
            onDeleteProject={onDeleteProject} 
            onCreateTask={onCreateTask} 
            onEditTask={onUpdateTask} 
            onDeleteTask={onDeleteTask} 
          />;
        })}
        </div>

        {sortedProjects.length === 0 && <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>}
      </div>;
  }

  // Show loading skeleton for desktop while parameters are loading
  if (parametersLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return <div className="space-y-6">
      {/* Desktop Table */}
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
              <TableRow className="bg-muted/50 border-border">
                <TableHead style={{
                minWidth: '120px'
              }}>
                  <div className="flex items-center gap-1">
                    Scope
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${selectedScopes.length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}>
                          <Filter className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {uniqueScopes.map(scope => (
                          <DropdownMenuCheckboxItem 
                            key={scope} 
                            checked={selectedScopes.includes(scope)} 
                            onCheckedChange={checked => handleScopeFilterChange(scope, checked || false)}
                          >
                            {scope}
                          </DropdownMenuCheckboxItem>
                        ))}
                        {selectedScopes.length > 0 && <div className="border-t pt-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedScopes([])} className="w-full">
                              Clear All ({selectedScopes.length})
                            </Button>
                          </div>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {selectedScopes.length > 0 && <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedScopes.length}
                      </span>}
                  </div>
                </TableHead>
                <TableHead style={{
                minWidth: '200px'
              }}>
                  <div className="flex items-center gap-1">
                    Project Name
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${selectedProjects.length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}>
                          <Filter className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
                        {uniqueProjectNames.map(projectName => <DropdownMenuCheckboxItem key={projectName} checked={selectedProjects.includes(projectName)} onCheckedChange={checked => handleProjectFilterChange(projectName, checked || false)}>
                            {projectName}
                          </DropdownMenuCheckboxItem>)}
                        {selectedProjects.length > 0 && <div className="border-t pt-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedProjects([])} className="w-full">
                              Clear All ({selectedProjects.length})
                            </Button>
                          </div>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {selectedProjects.length > 0 && <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedProjects.length}
                      </span>}
                  </div>
                </TableHead>
                <TableHead style={{
                minWidth: '150px'
              }}>
                  Timeline
                </TableHead>
                <TableHead style={{
                minWidth: '120px'
              }}>
                  Status
                </TableHead>
                <TableHead style={{
                minWidth: '180px'
              }}>
                  Owner & Team
                </TableHead>
                <TableHead style={{
                minWidth: '220px'
              }}>
                  Tasks & Meetings
                </TableHead>
                
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.map(project => {
              const stats = getProjectStats(project);
              return <TableRow key={`project-${project.id}`} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleRowClick(project)}>
                    {/* Scope Column */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.scope.length > 0 ? (
                          project.scope.map((scopeItem, index) => (
                            <Badge 
                              key={index}
                              className="text-base font-medium border" 
                              style={parametersLoading ? {} : getScopeStyle(scopeItem)}
                            >
                              {scopeItem}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No scope</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Project Name Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-medium text-green-700 dark:text-green-400">{project.id}</span>
                          <h3 className="text-base font-medium text-foreground">{project.name}</h3>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Timeline Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-base text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(project.startDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          to {new Date(project.endDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <Badge className={`${getStatusColor(project.status)} text-sm px-2 py-1`}>
                        {project.status}
                      </Badge>
                    </TableCell>

                    {/* Owner & Team Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-base font-medium text-foreground">{project.owner || 'No owner assigned'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.team.length} team members</p>
                      </div>
                    </TableCell>

                    {/* Tasks & Meetings Column */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {stats.completionRate}%
                          </span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{stats.totalCompleted}/{stats.totalItems} completed</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
          </Table>
        </div>
        {sortedProjects.length === 0 && <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>}
      </div>
    </div>;
};