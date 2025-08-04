import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { Task, Project } from "@/types/task";
import { ProjectTable } from "@/components/ProjectTable";
import { ProjectForm } from "@/components/ProjectForm";
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { ProjectDetailView } from "@/components/ProjectDetailView";
import { ReportModal } from "@/components/ReportModal";

interface ProjectsPageProps {
  tasks: Task[];
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateTask: (task: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddFollowUp: (taskId: string, followUpText: string) => void;
  projectFilter?: 'all' | 'active' | 'on-hold' | 'completed';
  setProjectFilter?: (filter: 'all' | 'active' | 'on-hold' | 'completed') => void;
}

const ProjectsPage = ({ 
  tasks, 
  projects, 
  onCreateProject, 
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddFollowUp,
  projectFilter = 'all',
  setProjectFilter
}: ProjectsPageProps) => {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportProject, setReportProject] = useState<Project | null>(null);

  console.log('Projects page render - isTaskFormOpen:', isTaskFormOpen, 'selectedTask:', selectedTask?.title);

  const handleEditProject = (project: Project) => {
    console.log('handleEditProject called with:', project.name);
    setDetailProject(project);
    setViewMode('detail');
  };

  const handleEditProjectForm = () => {
    setSelectedProject(detailProject);
    setIsProjectFormOpen(true);
  };

  const handleSaveProject = (projectData: Project | Omit<Project, 'id'>) => {
    if ('id' in projectData) {
      onUpdateProject(projectData);
    } else {
      onCreateProject(projectData);
    }
    setIsProjectFormOpen(false);
    setSelectedProject(null);
  };

  const handleCreateTaskForProject = (projectId?: string) => {
    const project = projectId ? projects.find(p => p.id === projectId) : detailProject;
    if (project) {
      setTaskProjectId(project.name); // Use project name for task.project field
      setSelectedTask(null);
      setIsTaskFormOpen(true);
    }
  };

  const handleEditTask = (task: Task) => {
    console.log('handleEditTask called with:', task.title, 'current isTaskFormOpen:', isTaskFormOpen);
    
    // Force state reset first, then set new values
    setIsTaskFormOpen(false);
    setSelectedTask(null);
    
    // Use requestAnimationFrame to ensure DOM updates
    requestAnimationFrame(() => {
      setSelectedTask(task);
      setIsTaskFormOpen(true);
      console.log('State updated - task:', task.title, 'opening modal');
    });
  };

  const handleFollowUp = (updatedTask: Task) => {
    console.log('Follow-up updated for task:', updatedTask.title);
    onUpdateTask(updatedTask);
  };

  const handleAddTaskToProject = (projectId: string) => {
    // For now, just open task form to create new task
    handleCreateTaskForProject(projectId);
  };

  const handleSaveTask = (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    if ('id' in taskData) {
      onUpdateTask(taskData);
    } else {
      // Set the project name if creating task for specific project
      const finalTaskData = {
        ...taskData,
        project: taskProjectId || taskData.project
      };
      onCreateTask(finalTaskData);
    }
    setIsTaskFormOpen(false);
    setSelectedTask(null);
    setTaskProjectId(null);
  };

  const handleGenerateReport = (project?: Project) => {
    const targetProject = project || detailProject;
    if (!targetProject) return;
    setReportProject(targetProject);
    setIsReportModalOpen(true);
  };

  if (viewMode === 'detail' && detailProject) {
    return (
      <ProjectDetailView
        project={detailProject}
        tasks={tasks}
        allTasks={tasks}
        allProjects={projects} // Pass the projects list
        onBack={() => setViewMode('list')}
        onEditProject={handleEditProjectForm}
        onUpdateProject={onUpdateProject}
        onDeleteProject={onDeleteProject}
        onCreateTask={() => handleCreateTaskForProject()}
        onEditTask={handleEditTask}
        onGenerateReport={() => handleGenerateReport()}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onSaveTask={handleSaveTask}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex items-center space-x-3">
          <FolderKanban className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage projects, assign tasks, and track progress</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <RunningTimerDisplay tasks={tasks} />
          <Button 
            onClick={() => setIsProjectFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${projectFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setProjectFilter?.('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${projectFilter === 'active' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setProjectFilter?.('active')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {projects.filter(p => p.status === 'Active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${projectFilter === 'on-hold' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => setProjectFilter?.('on-hold')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">On Hold</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {projects.filter(p => p.status === 'On Hold').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${projectFilter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setProjectFilter?.('completed')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {projects.filter(p => p.status === 'Completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Table */}
      {projects.length > 0 ? (
        <ProjectTable
          projects={projects}
          tasks={tasks}
          onCreateProject={onCreateProject}
          onUpdateProject={handleEditProject}
          onDeleteProject={onDeleteProject}
          onCreateTask={onCreateTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          onAddFollowUp={onAddFollowUp}
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">No projects yet</p>
              <p className="mb-4">Create your first project to start managing timelines</p>
              <Button onClick={() => setIsProjectFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleSaveProject}
        onDelete={onDeleteProject}
        project={selectedProject}
        allTasks={tasks}
        onUpdateTask={onUpdateTask}
      />

      {/* Task Form Modal */}
      <TaskFormOptimized
        key={selectedTask?.id || 'new'}
        isOpen={isTaskFormOpen}
        onClose={() => {
          console.log('TaskForm onClose called');
          setIsTaskFormOpen(false);
          setSelectedTask(null);
          setTaskProjectId(null);
        }}
        onSave={handleSaveTask}
        onDelete={onDeleteTask}
        onAddFollowUp={onAddFollowUp}
        task={selectedTask}
        allTasks={tasks}
        allProjects={projects}
        projectName={taskProjectId}
        onEditRelatedTask={handleEditTask}
      />

      {/* Report Modal */}
      {reportProject && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportProject(null);
          }}
          project={reportProject}
          tasks={tasks}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
