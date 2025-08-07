import React, { useState, useMemo, useEffect } from 'react';
import { useScopeColor } from '@/hooks/useParameterColors';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, Edit, Plus, FileBarChart, ExternalLink, FolderOpen, Mail, FileText } from "lucide-react";
import { Project, Task } from "@/types/task";
import { TaskTable } from "@/components/TaskTable";
import { GanttChart } from "@/components/GanttChart";
import { ProjectForm } from "@/components/ProjectForm";
import { useTaskForm } from "@/contexts/TaskFormContext";

interface ProjectDetailViewProps {
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  allProjects?: Project[]; // Add allProjects prop
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

  // Add effect to refresh when tasks prop changes
  useEffect(() => {
    console.log('ProjectDetailView - Tasks prop changed, refreshing');
    setRefreshKey(prev => prev + 1);
  }, [tasks]);
  
  // Use useMemo to recalculate project tasks when tasks change or refresh key changes
  // All project tasks (for stats calculation)
  const allProjectTasks = useMemo(() => {
    return tasks.filter(task => task.project === project.name);
  }, [tasks, project.name, refreshKey]);

  // Active project tasks (excluding completed ones, sorted)
  const projectTasks = useMemo(() => {
    console.log('ProjectDetailView - Recalculating project tasks for:', project.name);
    const filtered = tasks
      .filter(task => task.project === project.name && task.status !== 'Completed') // Exclude completed tasks
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
    console.log('ProjectDetailView - Found', filtered.length, 'non-completed tasks for project');
    return filtered;
  }, [tasks, project.name, refreshKey]);

  // Completed project tasks (for completed tasks view)
  const completedProjectTasks = useMemo(() => {
    const completed = tasks
      .filter(task => task.project === project.name && task.status === 'Completed')
      .sort((a, b) => {
        // Sort by completion date (most recent first)
        const dateA = new Date(a.completionDate || a.dueDate);
        const dateB = new Date(b.completionDate || b.dueDate);
        return dateB.getTime() - dateA.getTime();
      });
    console.log('ProjectDetailView - Found', completed.length, 'completed tasks for project');
    return completed;
  }, [tasks, project.name, refreshKey]);
  
  const completedTasks = allProjectTasks.filter(task => task.status === 'Completed').length;
  const totalTasks = allProjectTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const overdueTasks = projectTasks.filter(task => 
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
    console.log('ProjectDetailView - Calling parent onEditTask');
    // Call the parent onEditTask handler which should open the task form
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

  const handleOpenGanttWindow = () => {
    const ganttUrl = `/gantt?project=${encodeURIComponent(project.name)}`;
    window.open(ganttUrl, '_blank', 'width=1400,height=800,scrollbars=yes,resizable=yes');
  };

  const handleCreateTaskForProject = () => {
    console.log('ProjectDetailView - Creating new task for project:', project.name);
    openTaskForm(project.name, undefined, 'project-detail-new');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEditProjectLocal}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </Button>
          <Button variant="outline" onClick={onGenerateReport}>
            <FileBarChart className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          {allProjectTasks.length > 0 && (
            <Button variant="outline" onClick={handleOpenGanttWindow}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Gantt
            </Button>
          )}
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

      {/* Tasks and Gantt Section */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Task List</TabsTrigger>
          {completedProjectTasks.length > 0 && (
            <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
          )}
          {allProjectTasks.length > 0 && (
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
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
              {projectTasks.length > 0 ? (
                <TaskTable 
                  tasks={projectTasks} 
                  onEditTask={handleEditTaskLocal}
                  onFollowUp={handleFollowUpLocal}
                  hideProjectColumn={true}
                />
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

        {completedProjectTasks.length > 0 && (
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                  Completed Tasks
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {completedProjectTasks.length} completed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskTable 
                  tasks={completedProjectTasks} 
                  onEditTask={handleEditTaskLocal}
                  onFollowUp={handleFollowUpLocal}
                  hideProjectColumn={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {allProjectTasks.length > 0 && (
          <TabsContent value="gantt">
            <GanttChart
              tasks={allProjectTasks}
              onTasksChange={handleTasksChange}
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
              onEditTask={handleEditTaskLocal}
            />
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
