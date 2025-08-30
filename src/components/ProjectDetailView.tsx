import React, { useState, useMemo, useEffect } from 'react';
import { useScopeColor } from '@/hooks/useParameterColors';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Users, Edit, Plus, FileBarChart, ExternalLink, FolderOpen, Mail, FileText } from "lucide-react";
import { Project, Task } from "@/types/task";
import { TaskTable } from "@/components/TaskTable";
import { ProjectForm } from "@/components/ProjectForm";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { getFirstLink, hasLinks } from "@/utils/linkUtils";

interface ProjectDetailViewProps {
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  allProjects?: Project[]; // Add allProjects prop
  loadAllTasksForProject?: (projectName: string) => Promise<Task[]>; // Add the function prop
  onBack: () => void;
  onEditProject: () => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onGenerateReport: () => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onSaveTask?: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
}

export const ProjectDetailView = ({ 
  project, 
  tasks, 
  allTasks,
  allProjects = [], // Default to empty array if not provided
  loadAllTasksForProject,
  onBack, 
  onEditProject, 
  onUpdateProject,
  onDeleteProject,
  onCreateTask, 
  onEditTask,
  onGenerateReport,
  onUpdateTask,
  onDeleteTask,
  onSaveTask 
}: ProjectDetailViewProps) => {
  const { getScopeStyle } = useScopeColor();
  const { navigateToTaskEdit } = useTaskNavigation();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State to store all project tasks (loaded directly from database)
  const [allProjectTasks, setAllProjectTasks] = useState<Task[]>([]);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  
  // Pagination state for open tasks, completed tasks, and meetings
  const [openTasksCurrentPage, setOpenTasksCurrentPage] = useState(1);
  const [completedTasksCurrentPage, setCompletedTasksCurrentPage] = useState(1);
  const [openMeetingsCurrentPage, setOpenMeetingsCurrentPage] = useState(1);
  const [completedMeetingsCurrentPage, setCompletedMeetingsCurrentPage] = useState(1);
  const tasksPerPage = 15; // Reduced for faster initial loading

  // Load all tasks for this project when component mounts or project changes
  useEffect(() => {
    const loadProjectTasks = async () => {
      if (!loadAllTasksForProject) {
        console.log('loadAllTasksForProject function not provided, using fallback tasks');
        setAllProjectTasks(tasks.filter(task => task.project === project.name));
        return;
      }

      try {
        setLoadingProjectTasks(true);
        const projectTasks = await loadAllTasksForProject(project.name);
        setAllProjectTasks(projectTasks);
      } catch (error) {
        console.error('Error loading project tasks:', error);
        setAllProjectTasks(tasks.filter(task => task.project === project.name));
      } finally {
        setLoadingProjectTasks(false);
      }
    };

    // Only load if we don't have data yet or if explicitly requested via refreshKey
    if (allProjectTasks.length === 0 || refreshKey > 0) {
      loadProjectTasks();
    }
  }, [project.name, loadAllTasksForProject, refreshKey]);

  // Listen for task updates to refresh the view only when necessary
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      // Only refresh if the updated task belongs to this project
      if (event.detail && event.detail.project === project.name) {
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdate as EventListener);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate as EventListener);
  }, [project.name]);

  // Add effect to refresh when tasks prop changes (fallback)
  useEffect(() => {
    if (!loadAllTasksForProject) {
      setAllProjectTasks(tasks.filter(task => task.project === project.name));
    }
  }, [tasks, project.name, loadAllTasksForProject]);
  
  // Optimized task calculations with combined memoization
  const taskCategories = useMemo(() => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortByDateAndPriority = (a: Task, b: Task) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    };

    const allTasks = allProjectTasks.filter(task => task.taskType !== 'Meeting');
    const allMeetings = allProjectTasks.filter(task => task.taskType === 'Meeting');

    return {
      allProjectTasksForStats: allTasks,
      allOpenProjectTasks: allTasks
        .filter(task => task.status !== 'Completed')
        .sort(sortByDateAndPriority),
      allCompletedProjectTasks: allTasks
        .filter(task => task.status === 'Completed')
        .sort((a, b) => new Date(b.completionDate || b.dueDate).getTime() - new Date(a.completionDate || a.dueDate).getTime()),
      allOpenProjectMeetings: allMeetings
        .filter(task => task.status !== 'Completed')
        .sort(sortByDateAndPriority),
      allCompletedProjectMeetings: allMeetings
        .filter(task => task.status === 'Completed')
        .sort((a, b) => new Date(b.completionDate || b.dueDate).getTime() - new Date(a.completionDate || a.dueDate).getTime())
    };
  }, [allProjectTasks]);

  // Optimized pagination with combined calculations
  const paginatedData = useMemo(() => {
    const { allOpenProjectTasks, allCompletedProjectTasks, allOpenProjectMeetings, allCompletedProjectMeetings } = taskCategories;

    const paginate = <T,>(items: T[], currentPage: number) => {
      const startIndex = (currentPage - 1) * tasksPerPage;
      const endIndex = startIndex + tasksPerPage;
      return {
        items: items.slice(startIndex, endIndex),
        pagination: {
          currentPage,
          pageSize: tasksPerPage,
          totalTasks: items.length,
          totalPages: Math.ceil(items.length / tasksPerPage)
        }
      };
    };

    return {
      openTasks: paginate(allOpenProjectTasks, openTasksCurrentPage),
      completedTasks: paginate(allCompletedProjectTasks, completedTasksCurrentPage),
      openMeetings: paginate(allOpenProjectMeetings, openMeetingsCurrentPage),
      completedMeetings: paginate(allCompletedProjectMeetings, completedMeetingsCurrentPage)
    };
  }, [taskCategories, openTasksCurrentPage, completedTasksCurrentPage, openMeetingsCurrentPage, completedMeetingsCurrentPage, tasksPerPage]);
  
  // Project statistics
  const stats = useMemo(() => {
    const { allOpenProjectTasks, allCompletedProjectTasks } = taskCategories;
    const completedTasks = allCompletedProjectTasks.length;
    const totalTasks = allOpenProjectTasks.length + completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const overdueTasks = allOpenProjectTasks.filter(task => 
      new Date(task.dueDate) < new Date()
    ).length;
    return { completedTasks, totalTasks, completionRate, overdueTasks };
  }, [taskCategories]);

  const handleTasksChange = (updatedTasks: Task[]) => {
    if (onUpdateTask) {
      updatedTasks.forEach(task => {
        const originalTask = allTasks.find(t => t.id === task.id);
        if (originalTask && JSON.stringify(originalTask) !== JSON.stringify(task)) {
          onUpdateTask(task);
        }
      });
    }
    
    // Also update local state to ensure immediate UI updates
    const allUpdatedTasks = allTasks.map(existingTask => {
      const updatedTask = updatedTasks.find(t => t.id === existingTask.id);
      return updatedTask || existingTask;
    });
    
    // Trigger any additional sync if needed
    if (onSaveTask) {
      updatedTasks.forEach(task => {
        const originalTask = allTasks.find(t => t.id === task.id);
        if (originalTask && JSON.stringify(originalTask) !== JSON.stringify(task)) {
          onSaveTask(task);
        }
      });
    }
  };

  const handleEditTaskLocal = (task: Task) => {
    console.log('ProjectDetailView - handleEditTaskLocal called for task:', task.id, task.title);
    alert(`Task clicked in Project Detail: ${task.id} - ${task.title}`);
    onEditTask(task);
  };

  const handleFollowUpLocal = (updatedTask: Task) => {
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleSaveTaskLocal = (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    if (onSaveTask) {
      onSaveTask(taskData);
    } else if (onEditTask && 'id' in taskData) {
      onEditTask(taskData as Task);
    }
    // Task form closing is now handled by global context
  };

  const handleCreateTaskForProject = () => {
    onCreateTask();
  };

  const handleEditProjectLocal = () => {
    setIsProjectFormOpen(true);
  };

  const handleSaveProjectLocal = (projectData: Project | Omit<Project, 'id'>) => {
    if (onUpdateProject && 'id' in projectData) {
      onUpdateProject(projectData);
    }
    setIsProjectFormOpen(false);
  };

  const handleDeleteProjectLocal = (projectId: string) => {
    if (onDeleteProject) {
      onDeleteProject(projectId);
    }
    onBack(); // Go back to projects list after deletion
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              <span className="text-green-700 dark:text-green-400">{project.id}</span>_{project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEditProjectLocal}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </Button>
          <Button variant="outline" onClick={onGenerateReport}>
            <FileBarChart className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button onClick={handleCreateTaskForProject}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status and Scope */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</p>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Scopes</p>
                <div className="flex flex-wrap gap-2">
                  {project.scope.length > 0 ? (
                    project.scope.map((scopeItem, index) => (
                      <Badge 
                        key={index}
                        className="text-sm font-medium border"
                        style={getScopeStyle(scopeItem)}
                      >
                        {scopeItem}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No scopes assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Start Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">End Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner and Cost Center */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Owner</p>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{project.owner || 'No owner assigned'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cost Center</p>
                <span className="text-sm text-gray-900 dark:text-gray-100">{project.cost_center || 'Not assigned'}</span>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Team Members</p>
              <div className="flex flex-wrap gap-2">
                {project.team && project.team.length > 0 ? (
                  project.team.map((member, index) => (
                    <Badge key={index} variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                      {member}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">No team members assigned</span>
                )}
              </div>
            </div>

            {/* Project Links */}
            {project.links && Object.entries(project.links).some(([key, links]) => hasLinks(links)) && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Project Links</p>
                <div className="grid grid-cols-2 gap-3">
                  {hasLinks(project.links.folder) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => project.links.folder && getFirstLink(project.links.folder) && handleLinkClick(getFirstLink(project.links.folder), e)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm">Project Folder</span>
                    </Button>
                  )}
                  {hasLinks(project.links.email) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => project.links.email && getFirstLink(project.links.email) && handleLinkClick(`mailto:${getFirstLink(project.links.email)}`, e)}
                    >
                      <Mail className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm">Project Email</span>
                    </Button>
                  )}
                  {hasLinks(project.links.file) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => project.links.file && getFirstLink(project.links.file) && handleLinkClick(getFirstLink(project.links.file), e)}
                    >
                      <FileText className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm">Project File</span>
                    </Button>
                  )}
                  {hasLinks(project.links.oneNote) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => project.links.oneNote && getFirstLink(project.links.oneNote) && handleLinkClick(getFirstLink(project.links.oneNote), e)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm">OneNote</span>
                    </Button>
                  )}
                  {hasLinks(project.links.teams) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => project.links.teams && getFirstLink(project.links.teams) && handleLinkClick(getFirstLink(project.links.teams), e)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm">Teams</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Project Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Completion</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(stats.completionRate)}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{stats.completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Remaining</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{stats.totalTasks - stats.completedTasks}</span>
              </div>
              {stats.overdueTasks > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Overdue</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.overdueTasks}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Opened Tasks</TabsTrigger>
          {taskCategories.allCompletedProjectTasks.length > 0 && (
            <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
          )}
          {(taskCategories.allOpenProjectMeetings.length > 0 || taskCategories.allCompletedProjectMeetings.length > 0) && (
            <TabsTrigger value="open-meetings">Opened Meetings</TabsTrigger>
          )}
          {taskCategories.allCompletedProjectMeetings.length > 0 && (
            <TabsTrigger value="completed-meetings">Completed Meetings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                Project Tasks
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {project.name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProjectTasks ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400">Data loading...</p>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : taskCategories.allOpenProjectTasks.length > 0 ? (
                <div className="space-y-4">
                  <TaskTable 
                    tasks={paginatedData.openTasks.items} 
                    onEditTask={handleEditTaskLocal}
                    onFollowUp={handleFollowUpLocal}
                    hideProjectColumn={true}
                    pagination={paginatedData.openTasks.pagination}
                    onPageChange={setOpenTasksCurrentPage}
                  />
                  
                  {/* Pagination Controls for Open Tasks */}
                  {paginatedData.openTasks.pagination.totalPages > 1 && (
                    <div className="flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (openTasksCurrentPage > 1) {
                                  setOpenTasksCurrentPage(openTasksCurrentPage - 1);
                                }
                              }}
                              className={openTasksCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: paginatedData.openTasks.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                isActive={page === openTasksCurrentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenTasksCurrentPage(page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (openTasksCurrentPage < paginatedData.openTasks.pagination.totalPages) {
                                  setOpenTasksCurrentPage(openTasksCurrentPage + 1);
                                }
                              }}
                              className={openTasksCurrentPage === paginatedData.openTasks.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">No tasks yet</p>
                  <p className="mb-4">Create your first task for this project</p>
                  <Button onClick={handleCreateTaskForProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {taskCategories.allCompletedProjectTasks.length > 0 && (
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Completed Tasks
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {taskCategories.allCompletedProjectTasks.length} completed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProjectTasks ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400">Data loading...</p>
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TaskTable 
                      tasks={paginatedData.completedTasks.items} 
                      onEditTask={handleEditTaskLocal}
                      onFollowUp={handleFollowUpLocal}
                      hideProjectColumn={true}
                      pagination={paginatedData.completedTasks.pagination}
                      onPageChange={setCompletedTasksCurrentPage}
                    />
                    
                    {/* Pagination Controls for Completed Tasks */}
                    {paginatedData.completedTasks.pagination.totalPages > 1 && (
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (completedTasksCurrentPage > 1) {
                                    setCompletedTasksCurrentPage(completedTasksCurrentPage - 1);
                                  }
                                }}
                                className={completedTasksCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: paginatedData.completedTasks.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === completedTasksCurrentPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCompletedTasksCurrentPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (completedTasksCurrentPage < paginatedData.completedTasks.pagination.totalPages) {
                                    setCompletedTasksCurrentPage(completedTasksCurrentPage + 1);
                                  }
                                }}
                                className={completedTasksCurrentPage === paginatedData.completedTasks.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(taskCategories.allOpenProjectMeetings.length > 0 || taskCategories.allCompletedProjectMeetings.length > 0) && (
          <TabsContent value="open-meetings">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Opened Meetings
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {taskCategories.allOpenProjectMeetings.length} opened meetings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProjectTasks ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400">Data loading...</p>
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TaskTable 
                      tasks={paginatedData.openMeetings.items} 
                      onEditTask={handleEditTaskLocal}
                      onFollowUp={handleFollowUpLocal}
                      hideProjectColumn={true}
                      pagination={paginatedData.openMeetings.pagination}
                      onPageChange={setOpenMeetingsCurrentPage}
                    />
                    
                    {/* Pagination Controls for Open Meetings */}
                    {paginatedData.openMeetings.pagination.totalPages > 1 && (
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (openMeetingsCurrentPage > 1) {
                                    setOpenMeetingsCurrentPage(openMeetingsCurrentPage - 1);
                                  }
                                }}
                                className={openMeetingsCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: paginatedData.openMeetings.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === openMeetingsCurrentPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOpenMeetingsCurrentPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (openMeetingsCurrentPage < paginatedData.openMeetings.pagination.totalPages) {
                                    setOpenMeetingsCurrentPage(openMeetingsCurrentPage + 1);
                                  }
                                }}
                                className={openMeetingsCurrentPage === paginatedData.openMeetings.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {taskCategories.allCompletedProjectMeetings.length > 0 && (
          <TabsContent value="completed-meetings">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Completed Meetings
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {taskCategories.allCompletedProjectMeetings.length} completed meetings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProjectTasks ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400">Data loading...</p>
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TaskTable 
                      tasks={paginatedData.completedMeetings.items} 
                      onEditTask={handleEditTaskLocal}
                      onFollowUp={handleFollowUpLocal}
                      hideProjectColumn={true}
                      pagination={paginatedData.completedMeetings.pagination}
                      onPageChange={setCompletedMeetingsCurrentPage}
                    />
                    
                    {/* Pagination Controls for Completed Meetings */}
                    {paginatedData.completedMeetings.pagination.totalPages > 1 && (
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (completedMeetingsCurrentPage > 1) {
                                    setCompletedMeetingsCurrentPage(completedMeetingsCurrentPage - 1);
                                  }
                                }}
                                className={completedMeetingsCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: paginatedData.completedMeetings.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === completedMeetingsCurrentPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCompletedMeetingsCurrentPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (completedMeetingsCurrentPage < paginatedData.completedMeetings.pagination.totalPages) {
                                    setCompletedMeetingsCurrentPage(completedMeetingsCurrentPage + 1);
                                  }
                                }}
                                className={completedMeetingsCurrentPage === paginatedData.completedMeetings.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Task Form is now handled globally - no local instance needed */}

      {/* Project Form Modal - Local to ProjectDetailView */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
        }}
        onSave={handleSaveProjectLocal}
        onDelete={handleDeleteProjectLocal}
        project={project}
        allTasks={allTasks}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
};
