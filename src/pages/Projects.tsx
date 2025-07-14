import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BarChart3, Clock, Plus } from "lucide-react";
import { Task, Project } from "@/types/task";

interface ProjectsPageProps {
  tasks: Task[];
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
}

const ProjectsPage = ({ tasks, projects, onCreateProject, onUpdateProject }: ProjectsPageProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks: projectTasks.filter(task => 
        task.status !== 'Completed' && new Date(task.dueDate) < new Date()
      ).length
    };
  };

  const getTimelineData = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));

    return projectTasks.map(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate);
      const startOffset = Math.max(0, Math.ceil((taskStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
      const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
      const leftPercent = (startOffset / totalDays) * 100;
      const widthPercent = (duration / totalDays) * 100;

      return {
        ...task,
        leftPercent: Math.min(leftPercent, 95),
        widthPercent: Math.min(widthPercent, 100 - leftPercent),
        startOffset,
        duration
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">Gantt charts and project timelines</p>
        </div>
        <Button onClick={() => {/* TODO: Add create project modal */}}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const stats = getProjectStats(project);
          return (
            <Card 
              key={project.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={
                    project.status === 'Active' ? 'default' :
                    project.status === 'Completed' ? 'secondary' : 'outline'
                  }>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{project.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{project.startDate} - {project.endDate}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{project.team.length} team members</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                  <span>{stats.completedTasks}/{stats.totalTasks} tasks completed</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{stats.completionRate.toFixed(0)}% Complete</span>
                  {stats.overdueTasks > 0 && (
                    <span className="text-red-600">{stats.overdueTasks} overdue</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Simple Timeline Chart */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>{selectedProject.name} - Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Timeline Header */}
              <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
                <span>Project: {selectedProject.startDate}</span>
                <span>to {selectedProject.endDate}</span>
              </div>
              
              {/* Timeline Tasks */}
              <div className="space-y-3">
                {getTimelineData(selectedProject).map(task => (
                  <div key={task.id} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          task.priority === 'Critical' ? 'destructive' :
                          task.priority === 'High' ? 'default' :
                          task.priority === 'Medium' ? 'secondary' : 'outline'
                        }>
                          {task.priority}
                        </Badge>
                        <span className="font-medium">{task.title}</span>
                      </div>
                      <span className="text-gray-500">{task.responsible}</span>
                    </div>
                    <div className="relative h-6 bg-gray-100 rounded">
                      <div 
                        className={`absolute h-full rounded ${
                          task.status === 'Completed' ? 'bg-green-500' :
                          task.status === 'In Progress' ? 'bg-blue-500' :
                          task.status === 'On Hold' ? 'bg-gray-500' : 'bg-orange-500'
                        }`}
                        style={{
                          left: `${task.leftPercent}%`,
                          width: `${task.widthPercent}%`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                        {task.startDate} - {task.dueDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Project Selected */}
      {!selectedProject && projects.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a project above to view its Gantt chart</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Projects */}
      {projects.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No projects yet</p>
              <p className="mb-4">Create your first project to start managing timelines</p>
              <Button onClick={() => {/* TODO: Add create project modal */}}>
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectsPage;