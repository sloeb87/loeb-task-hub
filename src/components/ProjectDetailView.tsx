import React, { useState } from 'react';
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
import { TaskForm } from "@/components/TaskForm";
import { ProjectForm } from "@/components/ProjectForm";

interface ProjectDetailViewProps {
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  onBack: () => void;
  onEditProject: () => void;
  onUpdateProject?: (project: Project) => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onGenerateReport: () => void;
  onUpdateTask?: (task: Task) => void;
  onSaveTask?: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
}

export const ProjectDetailView = ({ 
  project, 
  tasks, 
  allTasks,
  onBack, 
  onEditProject, 
  onUpdateProject,
  onCreateTask, 
  onEditTask,
  onGenerateReport,
  onUpdateTask,
  onSaveTask 
}: ProjectDetailViewProps) => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const projectTasks = tasks.filter(task => task.project === project.name);
  const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
  const totalTasks = projectTasks.length;
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
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleSaveTaskLocal = (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    if (onSaveTask) {
      onSaveTask(taskData);
    } else if (onEditTask && 'id' in taskData) {
      onEditTask(taskData as Task);
    }
    setIsTaskFormOpen(false);
    setSelectedTask(null);
  };

  const handleOpenGanttWindow = () => {
    const ganttUrl = `/gantt?project=${encodeURIComponent(project.name)}`;
    window.open(ganttUrl, '_blank', 'width=1400,height=800,scrollbars=yes,resizable=yes');
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

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
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
          {projectTasks.length > 0 && (
            <Button variant="outline" onClick={handleOpenGanttWindow}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Gantt
            </Button>
          )}
          <Button onClick={onCreateTask}>
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
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Owner</p>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{project.owner}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Start Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{project.startDate}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{project.endDate}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Team Members</p>
              <div className="flex flex-wrap gap-2">
                {project.team.map((member, index) => (
                  <Badge key={index} variant="outline">
                    {member}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Project Links */}
            {project.links && Object.values(project.links).some(link => link) && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Project Links</p>
                <div className="flex items-center space-x-2">
                  {project.links.folder && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 hover:bg-blue-100"
                      onClick={(e) => handleLinkClick(project.links.folder!, e)}
                      title="Open Project Folder"
                    >
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                    </Button>
                  )}
                  {project.links.email && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 hover:bg-green-100"
                      onClick={(e) => handleLinkClick(`mailto:${project.links.email}`, e)}
                      title="Send Project Email"
                    >
                      <Mail className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  {project.links.file && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 hover:bg-purple-100"
                      onClick={(e) => handleLinkClick(project.links.file!, e)}
                      title="Open Project File"
                    >
                      <FileText className="w-4 h-4 text-purple-600" />
                    </Button>
                  )}
                  {project.links.oneNote && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 hover:bg-orange-100"
                      onClick={(e) => handleLinkClick(project.links.oneNote!, e)}
                      title="Open Project OneNote"
                    >
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                    </Button>
                  )}
                  {project.links.teams && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 hover:bg-indigo-100"
                      onClick={(e) => handleLinkClick(project.links.teams!, e)}
                      title="Open Project Teams"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
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
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="text-sm font-medium">{totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-green-600">{completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="text-sm font-medium text-blue-600">{totalTasks - completedTasks}</span>
              </div>
              {overdueTasks > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overdue</span>
                  <span className="text-sm font-medium text-red-600">{overdueTasks}</span>
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
          {projectTasks.length > 0 && (
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Project Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {projectTasks.length > 0 ? (
                <TaskTable 
                  tasks={projectTasks} 
                  onEditTask={handleEditTaskLocal}
                  onFollowUp={handleEditTaskLocal}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-medium mb-2">No tasks yet</p>
                  <p className="mb-4">Create your first task for this project</p>
                  <Button onClick={onCreateTask}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {projectTasks.length > 0 && (
          <TabsContent value="gantt">
            <GanttChart
              tasks={projectTasks}
              onTasksChange={handleTasksChange}
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
              onEditTask={handleEditTaskLocal}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Task Form Modal - Local to ProjectDetailView */}
      <TaskForm
        key={selectedTask?.id || 'new'}
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTaskLocal}
        task={selectedTask}
        allTasks={allTasks}
        projectName={project.name}
        onEditRelatedTask={handleEditTaskLocal}
      />

      {/* Project Form Modal - Local to ProjectDetailView */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
        }}
        onSave={handleSaveProjectLocal}
        project={project}
        allTasks={allTasks}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
};