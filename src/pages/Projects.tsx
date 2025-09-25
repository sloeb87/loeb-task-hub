import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { Task, Project } from "@/types/task";
import { ProjectTable } from "@/components/ProjectTable";
import { ProjectForm } from "@/components/ProjectForm";
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
  chartDateFilter?: { from: Date; to: Date }; // Date filter from chart clicks
  onEditTask?: (task: Task) => void; // Add callback to redirect to Task Details
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
  setProjectFilter,
  chartDateFilter,
  onEditTask
}: ProjectsPageProps) => {
  const navigate = useNavigate();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportProject, setReportProject] = useState<Project | null>(null);

  console.log('Projects page render - Projects list view');
  
  // Apply date filtering if chartDateFilter is provided
  const filteredProjects = React.useMemo(() => {
    if (!chartDateFilter) {
      return projects;
    }
    
    // Filter projects that were active during the specified date range
    return projects.filter(project => {
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const filterStart = new Date(chartDateFilter.from);
      const filterEnd = new Date(chartDateFilter.to);
      
      // Project is included if it overlaps with the filter date range
      return projectStart <= filterEnd && projectEnd >= filterStart;
    });
  }, [projects, chartDateFilter]);

  console.log('Projects filtering:', {
    chartDateFilter,
    totalProjects: projects.length,
    filteredProjects: filteredProjects.length
  });

  const handleEditProject = (project: Project) => {
    console.log('Navigating to project details for:', project.name);
    navigate(`/projects/${project.id}`);
  };

  const handleEditProjectForm = () => {
    setSelectedProject(null); // Open form for new project or current project
    setIsProjectFormOpen(true);
  };

  const handleSaveProject = (projectData: Project | Omit<Project, 'id'>) => {
    console.log('handleSaveProject called with:', projectData);
    console.log('Project has id?', 'id' in projectData);
    
    if ('id' in projectData) {
      console.log('Calling onUpdateProject with:', projectData);
      onUpdateProject(projectData);
    } else {
      console.log('Calling onCreateProject with:', projectData);
      onCreateProject(projectData);
    }
    setIsProjectFormOpen(false);
    setSelectedProject(null);
  };

  const handleCreateTaskForProject = (projectId?: string) => {
    // Navigate to new task with project pre-selected
    const project = projectId ? projects.find(p => p.id === projectId) : null;
    if (project) {
      navigate('/tasks/new', { 
        state: { 
          projectId: project.id,
          projectName: project.name 
        } 
      });
    } else {
      navigate('/tasks/new');
    }
  };

  const handleEditTask = (task: Task) => {
    console.log('handleEditTask called with:', task.title);
    if (onEditTask) {
      onEditTask(task); // This will navigate to task edit page
    }
  };

  const handleFollowUp = (updatedTask: Task) => {
    console.log('Follow-up updated for task:', updatedTask.title);
    onUpdateTask(updatedTask);
  };

  const handleAddTaskToProject = (projectId: string) => {
    handleCreateTaskForProject(projectId);
  };

  const handleSaveTask = (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    // This function might not be needed anymore since tasks are handled in Task Details
    if ('id' in taskData) {
      onUpdateTask(taskData as Task);
    } else {
      // For task creation, redirect to Task Details instead
      console.log('Task creation should be handled in Task Details page');
    }
  };

  const handleGenerateReport = (project?: Project) => {
    console.log('handleGenerateReport called with project:', project?.name);
    const targetProject = project;
    if (!targetProject) {
      console.error('No project found for report generation');
      return;
    }
    console.log('Setting report project:', targetProject.name);
    setReportProject(targetProject);
    setIsReportModalOpen(true);
  };

  // Detail view is now handled in separate window, no conditional rendering needed

  // Remove all conditional rendering and debug functions - now using proper routing

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex items-center space-x-3">
            <FolderKanban className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage projects, assign tasks, and track progress</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
                <p className="text-base font-medium text-gray-600 dark:text-gray-300">Total Projects</p>
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
                <p className="text-base font-medium text-gray-600 dark:text-gray-300">Active Projects</p>
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
                <p className="text-base font-medium text-gray-600 dark:text-gray-300">On Hold</p>
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
                <p className="text-base font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {projects.filter(p => p.status === 'Completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter Indicator */}
      {chartDateFilter && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Filtered by Date: {new Date(chartDateFilter.from).toLocaleDateString()} - {new Date(chartDateFilter.to).toLocaleDateString()}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Showing {filteredProjects.length} of {projects.length} projects
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  window.history.replaceState({}, '', window.location.pathname);
                  window.location.reload();
                }}
                className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40"
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Table */}
      {filteredProjects.length > 0 ? (
        <ProjectTable
          projects={filteredProjects}
          tasks={tasks}
          onCreateProject={onCreateProject}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onCreateTask={onCreateTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          onAddFollowUp={onAddFollowUp}
          onViewProject={handleEditProject}
        />
      ) : chartDateFilter ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">No projects found for selected date range</p>
              <p className="mb-4">No projects were active during {new Date(chartDateFilter.from).toLocaleDateString()} - {new Date(chartDateFilter.to).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
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

      {/* Task Form Modal - REMOVED, now redirects to Task Details */}

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
      </main>
    </div>
  );
};

export default ProjectsPage;
