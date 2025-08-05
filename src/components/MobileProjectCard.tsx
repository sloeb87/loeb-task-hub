import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Edit,
  Trash2,
  Plus,
  FolderOpen
} from "lucide-react";
import { Project, Task } from "@/types/task";
import { useScopeColor } from '@/hooks/useParameterColors';

interface MobileProjectCardProps {
  project: Project;
  projectTasks: Task[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateTask: (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const MobileProjectCard = ({
  project,
  projectTasks,
  onEditProject,
  onDeleteProject,
  onCreateTask,
  onEditTask,
  onDeleteTask
}: MobileProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getScopeStyle } = useScopeColor();

  const getProjectStats = (project: Project) => {
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
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
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

  const stats = getProjectStats(project);

  return (
    <Card className="w-full mb-4 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-base truncate text-foreground">
                {project.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 ml-3">
            <Badge className={`${getStatusColor(project.status)} text-xs px-2 py-1`}>
              {project.status}
            </Badge>
            <Badge 
              className="text-xs border"
              style={getScopeStyle(project.scope)}
            >
              {project.scope}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Project Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Progress</span>
            </div>
            <div className="space-y-1">
              <Progress value={stats.completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.completedTasks}/{stats.totalTasks} tasks ({stats.completionRate}%)
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Due Date</span>
            </div>
            <p className="text-sm font-medium">
              {project.endDate || 'Not set'}
            </p>
          </div>
        </div>

        {/* Project Manager */}
        <div className="flex items-center text-sm">
          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground mr-2">Owner:</span>
          <span className="font-medium">{project.owner || 'Not assigned'}</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 py-2 bg-muted/30 rounded-lg px-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-sm font-semibold text-blue-600">{stats.inProgressTasks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-sm font-semibold text-green-600">{stats.completedTasks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-sm font-semibold text-red-600">{stats.overdueTasks}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {isExpanded ? 'Hide Tasks' : 'Show Tasks'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditProject(project)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeleteProject(project.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Expanded Tasks */}
        {isExpanded && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Project Tasks</h4>
              <Button
                size="sm"
                onClick={() => onCreateTask({
                  title: '',
                  description: '',
                  status: 'Open',
                  priority: 'Medium',
                  responsible: '',
                  project: project.name,
                  startDate: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  scope: project.scope,
                  taskType: 'Development' as const,
                  environment: 'Development',
                  details: '',
                  links: {},
                  stakeholders: []
                })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </div>
            
            {projectTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet. Add your first task to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {projectTasks.map(task => (
                  <div key={task.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">{task.title}</h5>
                        <p className="text-xs text-muted-foreground">{task.responsible}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditTask(task)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteTask(task.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusColor(task.status)} text-xs`}>
                        {task.status}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.dueDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};