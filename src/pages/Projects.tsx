import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";
import { Task, Project } from "@/types/task";
import { ProjectTable } from "@/components/ProjectTable";
import { ProjectForm } from "@/components/ProjectForm";
import { TaskForm } from "@/components/TaskForm";
import { ProjectDetailView } from "@/components/ProjectDetailView";

interface ProjectsPageProps {
  tasks: Task[];
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onCreateTask: (task: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onUpdateTask: (task: Task) => void;
}

const ProjectsPage = ({ 
  tasks, 
  projects, 
  onCreateProject, 
  onUpdateProject,
  onCreateTask,
  onUpdateTask
}: ProjectsPageProps) => {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const handleEditProject = (project: Project) => {
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
    setSelectedTask(task);
    setIsTaskFormOpen(true);
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
    const projectTasks = tasks.filter(task => task.project === targetProject.name);
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const overdueTasks = projectTasks.filter(task => 
      task.status !== 'Completed' && new Date(task.dueDate) < new Date()
    ).length;

    const reportContent = `
PROJECT REPORT: ${targetProject.name}

Project Overview:
- Status: ${targetProject.status}
- Owner: ${targetProject.owner}
- Timeline: ${targetProject.startDate} to ${targetProject.endDate}
- Team: ${targetProject.team.join(', ')}

Task Summary:
- Total Tasks: ${totalTasks}
- Completed: ${completedTasks}
- Remaining: ${totalTasks - completedTasks}
- Overdue: ${overdueTasks}
- Completion Rate: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%

Task Details:
${projectTasks.map(task => `
- ${task.id}: ${task.title}
  Status: ${task.status}
  Priority: ${task.priority}
  Responsible: ${task.responsible}
  Due: ${task.dueDate}
`).join('')}

Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    // Create a downloadable report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetProject.name}_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (viewMode === 'detail' && detailProject) {
    return (
      <ProjectDetailView
        project={detailProject}
        tasks={tasks}
        allTasks={tasks}
        onBack={() => setViewMode('list')}
        onEditProject={handleEditProjectForm}
        onCreateTask={() => handleCreateTaskForProject()}
        onEditTask={handleEditTask}
        onGenerateReport={() => handleGenerateReport()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FolderKanban className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="text-gray-600 mt-1">Manage projects, assign tasks, and track progress</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsProjectFormOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'Active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Hold</p>
                <p className="text-2xl font-bold text-orange-600">
                  {projects.filter(p => p.status === 'On Hold').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
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
          onEditProject={handleEditProject}
          onCreateTask={handleCreateTaskForProject}
          onAddTaskToProject={handleAddTaskToProject}
          onGenerateReport={handleGenerateReport}
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No projects yet</p>
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
        project={selectedProject}
        allTasks={tasks}
        onUpdateTask={onUpdateTask}
      />

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setSelectedTask(null);
          setTaskProjectId(null);
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        allTasks={tasks}
        projectName={taskProjectId}
      />
    </div>
  );
};

export default ProjectsPage;