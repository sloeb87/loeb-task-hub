import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, Edit, Plus, FileBarChart } from "lucide-react";
import { Project, Task } from "@/types/task";
import { TaskTable } from "@/components/TaskTable";
import { GanttChart } from "@/components/GanttChart";

interface ProjectDetailViewProps {
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  onBack: () => void;
  onEditProject: () => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onGenerateReport: () => void;
  onUpdateTask?: (task: Task) => void;
}

export const ProjectDetailView = ({ 
  project, 
  tasks, 
  allTasks,
  onBack, 
  onEditProject, 
  onCreateTask, 
  onEditTask,
  onGenerateReport,
  onUpdateTask 
}: ProjectDetailViewProps) => {
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
          <Button variant="outline" onClick={onEditProject}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </Button>
          <Button variant="outline" onClick={onGenerateReport}>
            <FileBarChart className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
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
                  onEditTask={onEditTask}
                  onFollowUp={onEditTask}
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
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};