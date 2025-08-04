import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Plus, Edit, Trash2, Users, Calendar, CheckCircle, FolderOpen, FileText, Clock, AlertTriangle } from "lucide-react";
import { Project, Task } from "@/types/task";
import { useScopeColor } from '@/hooks/useScopeColor';
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
  onAddFollowUp
}: ProjectTableProps) => {
  const isMobile = useIsMobile();
  const { getScopeStyle } = useScopeColor();
  

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const inProgressTasks = projectTasks.filter(task => task.status === 'In Progress').length;
    const overdueTasks = projectTasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'Completed'
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      projectTasks
    };
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100';
      case 'on hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Filter projects based on projectFilter
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects;
    if (projectFilter === 'active') return projects.filter(p => p.status === 'Active');
    if (projectFilter === 'on-hold') return projects.filter(p => p.status === 'On Hold');
    if (projectFilter === 'completed') return projects.filter(p => p.status === 'Completed');
    return projects;
  }, [projects, projectFilter]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredProjects]);


  const handleRowClick = (project: Project) => {
    onUpdateProject(project);
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={projectFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setProjectFilter('all')}
            size="sm"
          >
            All ({projects.length})
          </Button>
          <Button
            variant={projectFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setProjectFilter('active')}
            size="sm"
          >
            Active ({projects.filter(p => p.status === 'Active').length})
          </Button>
          <Button
            variant={projectFilter === 'on-hold' ? 'default' : 'outline'}
            onClick={() => setProjectFilter('on-hold')}
            size="sm"
          >
            On Hold ({projects.filter(p => p.status === 'On Hold').length})
          </Button>
          <Button
            variant={projectFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setProjectFilter('completed')}
            size="sm"
          >
            Completed ({projects.filter(p => p.status === 'Completed').length})
          </Button>
        </div>

        {/* Mobile Project Cards */}
        <div className="space-y-4">
          {sortedProjects.map(project => {
            const projectTasks = tasks.filter(task => task.project === project.name);
            return (
              <MobileProjectCard
                key={project.id}
                project={project}
                projectTasks={projectTasks}
                onEditProject={onUpdateProject}
                onDeleteProject={onDeleteProject}
                onCreateTask={onCreateTask}
                onEditTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            );
          })}
        </div>

        {sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="space-y-6">
      {/* Desktop Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead style={{ minWidth: '120px' }}>
                  Scope
                </TableHead>
                <TableHead style={{ minWidth: '300px' }}>
                  Project Name
                </TableHead>
                <TableHead style={{ minWidth: '180px' }}>
                  Owner & Team
                </TableHead>
                <TableHead style={{ minWidth: '220px' }}>
                  Status & Progress
                </TableHead>
                <TableHead style={{ minWidth: '150px' }}>
                  Timeline
                </TableHead>
                
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.map(project => {
                const stats = getProjectStats(project);
                return (
                  <TableRow key={`project-${project.id}`} className="hover:bg-muted/50 transition-colors cursor-pointer" onDoubleClick={() => handleRowClick(project)}>
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
                        <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                      </div>
                    </TableCell>

                    {/* Owner & Team Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{project.owner}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{project.team.length} team members</p>
                      </div>
                    </TableCell>

                    {/* Status & Progress Column */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`${getStatusColor(project.status)} text-xs px-2 py-1`}>
                            {project.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {stats.completionRate}%
                          </span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {stats.completedTasks}/{stats.totalTasks} tasks
                          {stats.overdueTasks > 0 && <span className="text-destructive ml-1">({stats.overdueTasks} overdue)</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Timeline Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{project.startDate}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {project.endDate}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};