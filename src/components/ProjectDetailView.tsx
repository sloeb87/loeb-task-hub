import React, { useState, useMemo, useEffect } from 'react';
import { useScopeColor } from '@/hooks/useParameterColors';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowLeft, Calendar, Users, Edit, Plus, FileBarChart, ExternalLink, FolderOpen, Mail, FileText } from "lucide-react";
import { Project, Task } from "@/types/task";
import { TaskTable } from "@/components/TaskTable";
import { ProjectForm } from "@/components/ProjectForm";
import { useTaskForm } from "@/contexts/TaskFormContext";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { openTaskForm } = useTaskForm();
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
  const tasksPerPage = 50;

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
        console.log('Loading all tasks for project:', project.name);
        const projectTasks = await loadAllTasksForProject(project.name);
        console.log(`Loaded ${projectTasks.length} tasks for project ${project.name}`);
        setAllProjectTasks(projectTasks);
      } catch (error) {
        console.error('Error loading project tasks:', error);
        // Fallback to using the tasks prop
        setAllProjectTasks(tasks.filter(task => task.project === project.name));
      } finally {
        setLoadingProjectTasks(false);
      }
    };

    loadProjectTasks();
  }, [project.name, loadAllTasksForProject, refreshKey]);

  // Listen for task updates to refresh the view
  useEffect(() => {
    console.log('ProjectDetailView - Setting up task update listener');
    const handleTaskUpdate = () => {
      console.log('ProjectDetailView - Task updated, refreshing view');
      setRefreshKey(prev => prev + 1);
    };

    // Listen for custom task update events
    window.addEventListener('taskUpdated', handleTaskUpdate);
    
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate);
    };
  }, []);

  // Add effect to refresh when tasks prop changes (fallback)
  useEffect(() => {
    if (!loadAllTasksForProject) {
      console.log('ProjectDetailView - Tasks prop changed, updating fallback tasks');
      setAllProjectTasks(tasks.filter(task => task.project === project.name));
    }
  }, [tasks, project.name, loadAllTasksForProject]);
  
  // Use useMemo to recalculate project tasks when allProjectTasks changes
  // All project tasks (for stats calculation, excluding meetings)
  const allProjectTasksForStats = useMemo(() => {
    return allProjectTasks.filter(task => task.taskType !== 'Meeting');
  }, [allProjectTasks]);

  // Active project tasks (excluding completed ones and meetings, sorted)
  const allOpenProjectTasks = useMemo(() => {
    console.log('ProjectDetailView - Recalculating project tasks for:', project.name);
    const filtered = allProjectTasks
      .filter(task => 
        task.status !== 'Completed' && 
        task.taskType !== 'Meeting'
      ) // Exclude completed tasks and meetings
      .sort((a, b) => {
        // Sort by due date first (earliest first), then by priority
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        // If dates are equal, sort by priority (High > Medium > Low)
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      });
    console.log('ProjectDetailView - Found', filtered.length, 'non-completed, non-meeting tasks for project');
    return filtered;
  }, [allProjectTasks, project.name]);

  // Paginated open tasks
  const projectTasks = useMemo(() => {
    const startIndex = (openTasksCurrentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return allOpenProjectTasks.slice(startIndex, endIndex);
  }, [allOpenProjectTasks, openTasksCurrentPage, tasksPerPage]);

  // Open tasks pagination info
  const openTasksPagination = useMemo(() => ({
    currentPage: openTasksCurrentPage,
    pageSize: tasksPerPage,
    totalTasks: allOpenProjectTasks.length,
    totalPages: Math.ceil(allOpenProjectTasks.length / tasksPerPage)
  }), [allOpenProjectTasks.length, openTasksCurrentPage, tasksPerPage]);

  // All completed project tasks (excluding meetings)
  const allCompletedProjectTasks = useMemo(() => {
    const completed = allProjectTasks
      .filter(task => 
        task.status === 'Completed' && 
        task.taskType !== 'Meeting'
      )
      .sort((a, b) => {
        // Sort by completion date (most recent first)
        const dateA = new Date(a.completionDate || a.dueDate);
        const dateB = new Date(b.completionDate || b.dueDate);
        return dateB.getTime() - dateA.getTime();
      });
    console.log('ProjectDetailView - Found', completed.length, 'completed, non-meeting tasks for project');
    return completed;
  }, [allProjectTasks]);

  // All opened meetings for this project
  const allOpenProjectMeetings = useMemo(() => {
    const meetings = allProjectTasks
      .filter(task => task.taskType === 'Meeting' && task.status !== 'Completed')
      .sort((a, b) => {
        // Sort by due date first (earliest first), then by priority
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        // If dates are equal, sort by priority (High > Medium > Low)
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      });
    console.log('ProjectDetailView - Found', meetings.length, 'open meetings for project');
    return meetings;
  }, [allProjectTasks]);

  // All completed meetings for this project
  const allCompletedProjectMeetings = useMemo(() => {
    const meetings = allProjectTasks
      .filter(task => task.taskType === 'Meeting' && task.status === 'Completed')
      .sort((a, b) => {
        // Sort by completion date (most recent first)
        const dateA = new Date(a.completionDate || a.dueDate);
        const dateB = new Date(b.completionDate || b.dueDate);
        return dateB.getTime() - dateA.getTime();
      });
    console.log('ProjectDetailView - Found', meetings.length, 'completed meetings for project');
    return meetings;
  }, [allProjectTasks]);

  // Paginated completed tasks
  const completedProjectTasks = useMemo(() => {
    const startIndex = (completedTasksCurrentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return allCompletedProjectTasks.slice(startIndex, endIndex);
  }, [allCompletedProjectTasks, completedTasksCurrentPage, tasksPerPage]);

  // Completed tasks pagination info
  const completedTasksPagination = useMemo(() => ({
    currentPage: completedTasksCurrentPage,
    pageSize: tasksPerPage,
    totalTasks: allCompletedProjectTasks.length,
    totalPages: Math.ceil(allCompletedProjectTasks.length / tasksPerPage)
  }), [allCompletedProjectTasks.length, completedTasksCurrentPage, tasksPerPage]);

  // Paginated open meetings
  const paginatedOpenMeetings = useMemo(() => {
    const startIndex = (openMeetingsCurrentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return allOpenProjectMeetings.slice(startIndex, endIndex);
  }, [allOpenProjectMeetings, openMeetingsCurrentPage, tasksPerPage]);

  // Open meetings pagination info
  const openMeetingsPagination = useMemo(() => ({
    currentPage: openMeetingsCurrentPage,
    pageSize: tasksPerPage,
    totalTasks: allOpenProjectMeetings.length,
    totalPages: Math.ceil(allOpenProjectMeetings.length / tasksPerPage)
  }), [allOpenProjectMeetings.length, openMeetingsCurrentPage, tasksPerPage]);

  // Paginated completed meetings
  const paginatedCompletedMeetings = useMemo(() => {
    const startIndex = (completedMeetingsCurrentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return allCompletedProjectMeetings.slice(startIndex, endIndex);
  }, [allCompletedProjectMeetings, completedMeetingsCurrentPage, tasksPerPage]);

  // Completed meetings pagination info
  const completedMeetingsPagination = useMemo(() => ({
    currentPage: completedMeetingsCurrentPage,
    pageSize: tasksPerPage,
    totalTasks: allCompletedProjectMeetings.length,
    totalPages: Math.ceil(allCompletedProjectMeetings.length / tasksPerPage)
  }), [allCompletedProjectMeetings.length, completedMeetingsCurrentPage, tasksPerPage]);
  
  const completedTasks = allCompletedProjectTasks.length;
  const totalTasks = allOpenProjectTasks.length + allCompletedProjectTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const overdueTasks = allOpenProjectTasks.filter(task => 
    task.status !== 'Completed' && new Date(task.dueDate) < new Date()
  ).length;

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
    console.log('ProjectDetailView - handleEditTaskLocal called with:', task.title);
    console.log('ProjectDetailView - Switching to Task Details tab');
    // Use the parent's onEditTask to switch to task-edit view
    onEditTask(task);
  };

  const handleFollowUpLocal = (updatedTask: Task) => {
    console.log('ProjectDetailView - handleFollowUpLocal called with:', updatedTask.title);
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
      // Force refresh the view
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
    console.log('ProjectDetailView - Creating new task for project:', project.name);
    openTaskForm(project.name, undefined, 'project-detail-new', true);
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
              <span className="text-green-700 dark:text-green-400">{project.id}</span> {project.name}
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
            {project.links && Object.values(project.links).some(link => link) && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Project Links</p>
                <div className="grid grid-cols-2 gap-3">
                  {project.links.folder && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => handleLinkClick(project.links.folder!, e)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm">Project Folder</span>
                    </Button>
                  )}
                  {project.links.email && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => handleLinkClick(`mailto:${project.links.email}`, e)}
                    >
                      <Mail className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm">Project Email</span>
                    </Button>
                  )}
                  {project.links.file && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => handleLinkClick(project.links.file!, e)}
                    >
                      <FileText className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm">Project File</span>
                    </Button>
                  )}
                  {project.links.oneNote && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => handleLinkClick(project.links.oneNote!, e)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm">OneNote</span>
                    </Button>
                  )}
                  {project.links.teams && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="justify-start h-auto py-2 px-3"
                      onClick={(e) => handleLinkClick(project.links.teams!, e)}
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
                <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Remaining</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{totalTasks - completedTasks}</span>
              </div>
              {overdueTasks > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Overdue</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">{overdueTasks}</span>
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
          {allCompletedProjectTasks.length > 0 && (
            <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
          )}
          {(allOpenProjectMeetings.length > 0 || allCompletedProjectMeetings.length > 0) && (
            <TabsTrigger value="open-meetings">Opened Meetings</TabsTrigger>
          )}
          {allCompletedProjectMeetings.length > 0 && (
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
              ) : allOpenProjectTasks.length > 0 ? (
                <div className="space-y-4">
                  <TaskTable 
                    tasks={projectTasks} 
                    onEditTask={handleEditTaskLocal}
                    onFollowUp={handleFollowUpLocal}
                    hideProjectColumn={true}
                    pagination={openTasksPagination}
                    onPageChange={setOpenTasksCurrentPage}
                  />
                  
                  {/* Pagination Controls for Open Tasks */}
                  {openTasksPagination.totalPages > 1 && (
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
                          
                          {Array.from({ length: openTasksPagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                                if (openTasksCurrentPage < openTasksPagination.totalPages) {
                                  setOpenTasksCurrentPage(openTasksCurrentPage + 1);
                                }
                              }}
                              className={openTasksCurrentPage === openTasksPagination.totalPages ? "pointer-events-none opacity-50" : ""}
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

        {allCompletedProjectTasks.length > 0 && (
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Completed Tasks
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {allCompletedProjectTasks.length} completed
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
                      tasks={completedProjectTasks} 
                      onEditTask={handleEditTaskLocal}
                      onFollowUp={handleFollowUpLocal}
                      hideProjectColumn={true}
                      pagination={completedTasksPagination}
                      onPageChange={setCompletedTasksCurrentPage}
                    />
                    
                    {/* Pagination Controls for Completed Tasks */}
                    {completedTasksPagination.totalPages > 1 && (
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
                            
                            {Array.from({ length: completedTasksPagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                                  if (completedTasksCurrentPage < completedTasksPagination.totalPages) {
                                    setCompletedTasksCurrentPage(completedTasksCurrentPage + 1);
                                  }
                                }}
                                className={completedTasksCurrentPage === completedTasksPagination.totalPages ? "pointer-events-none opacity-50" : ""}
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

        {(allOpenProjectMeetings.length > 0 || allCompletedProjectMeetings.length > 0) && (
          <TabsContent value="open-meetings">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Opened Meetings
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {allOpenProjectMeetings.length} opened meetings
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
                      tasks={paginatedOpenMeetings} 
                      onEditTask={handleEditTaskLocal}
                      onFollowUp={handleFollowUpLocal}
                      hideProjectColumn={true}
                      pagination={openMeetingsPagination}
                      onPageChange={setOpenMeetingsCurrentPage}
                    />
                    
                    {/* Pagination Controls for Open Meetings */}
                    {openMeetingsPagination.totalPages > 1 && (
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
                            
                            {Array.from({ length: openMeetingsPagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                                  if (openMeetingsCurrentPage < openMeetingsPagination.totalPages) {
                                    setOpenMeetingsCurrentPage(openMeetingsCurrentPage + 1);
                                  }
                                }}
                                className={openMeetingsCurrentPage === openMeetingsPagination.totalPages ? "pointer-events-none opacity-50" : ""}
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

        {allCompletedProjectMeetings.length > 0 && (
          <TabsContent value="completed-meetings">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Completed Meetings
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {allCompletedProjectMeetings.length} completed meetings
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
                      tasks={paginatedCompletedMeetings} 
                      onEditTask={handleEditTaskLocal}
                      onFollowUp={handleFollowUpLocal}
                      hideProjectColumn={true}
                      pagination={completedMeetingsPagination}
                      onPageChange={setCompletedMeetingsCurrentPage}
                    />
                    
                    {/* Pagination Controls for Completed Meetings */}
                    {completedMeetingsPagination.totalPages > 1 && (
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
                            
                            {Array.from({ length: completedMeetingsPagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                                  if (completedMeetingsCurrentPage < completedMeetingsPagination.totalPages) {
                                    setCompletedMeetingsCurrentPage(completedMeetingsCurrentPage + 1);
                                  }
                                }}
                                className={completedMeetingsCurrentPage === completedMeetingsPagination.totalPages ? "pointer-events-none opacity-50" : ""}
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
