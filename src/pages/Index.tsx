
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { KPIDashboard } from "@/components/KPIDashboard";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { Plus, Filter, Search, BarChart3, FolderKanban } from "lucide-react";
import { Task, TaskStatus, TaskPriority, TaskType, Project } from "@/types/task";
import { mockTasks, mockProjects } from "@/data/mockData";
import ProjectsPage from "./Projects";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "inprogress" | "onhold" | "critical">("all");
  const [activeView, setActiveView] = useState<"tasks" | "dashboard" | "projects">("tasks");

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      switch (activeFilter) {
        case "open": return task.status === "Open";
        case "inprogress": return task.status === "In Progress";
        case "onhold": return task.status === "On Hold";
        case "critical": return task.priority === "Critical";
        case "all": return task.status === "Open" || task.status === "In Progress" || task.status === "On Hold";
        default: return true;
      }
    });
  }, [tasks, activeFilter]);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    const newTask: Task = {
      ...taskData,
      id: `T${tasks.length + 1}`,
      creationDate: new Date().toISOString().split('T')[0],
      followUps: []
    };
    setTasks([...tasks, newTask]);
    setIsTaskFormOpen(false);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setSelectedTask(null);
  };

  const handleAddFollowUp = (taskId: string, followUpText: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newFollowUp = {
          id: `${taskId}-F${task.followUps.length + 1}`,
          text: followUpText,
          timestamp: new Date().toISOString(),
          author: 'Current User' // In real app, this would be the logged-in user
        };
        return {
          ...task,
          followUps: [...task.followUps, newFollowUp]
        };
      }
      return task;
    }));
    setFollowUpTask(null);
  };

  const handleCreateProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: `P${projects.length + 1}`,
    };
    setProjects([...projects, newProject]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(project => project.id === updatedProject.id ? updatedProject : project));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">PMTask</h1>
              <Badge variant="secondary" className="text-xs">
                Loeb Consulting
              </Badge>
              <Button onClick={() => setIsTaskFormOpen(true)} className="flex items-center gap-2 ml-4">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={activeView === "projects" ? "default" : "outline"}
                onClick={() => setActiveView("projects")}
                size="sm"
              >
                <FolderKanban className="w-4 h-4 mr-2" />
                Projects
              </Button>
              <Button
                variant={activeView === "tasks" ? "default" : "outline"}
                onClick={() => setActiveView("tasks")}
                size="sm"
              >
                Tasks
              </Button>
              <Button
                variant={activeView === "dashboard" ? "default" : "outline"}
                onClick={() => setActiveView("dashboard")}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                KPIs
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === "tasks" ? (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </div>
              </div>
            </div>

            {/* ... keep existing task summary cards and table code ... */}

            {/* Task Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "all" ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {tasks.filter(t => t.status === "Open" || t.status === "In Progress" || t.status === "On Hold").length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "open" ? "ring-2 ring-orange-500" : ""}`}
                onClick={() => setActiveFilter("open")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {tasks.filter(t => t.status === "Open").length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-orange-600 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "inprogress" ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setActiveFilter("inprogress")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {tasks.filter(t => t.status === "In Progress").length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "onhold" ? "ring-2 ring-gray-500" : ""}`}
                onClick={() => setActiveFilter("onhold")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">On Hold</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {tasks.filter(t => t.status === "On Hold").length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "critical" ? "ring-2 ring-red-500" : ""}`}
                onClick={() => setActiveFilter("critical")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Critical</p>
                      <p className="text-2xl font-bold text-red-600">
                        {tasks.filter(t => t.priority === "Critical").length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Table */}
            <TaskTable
              tasks={filteredTasks}
              onEditTask={setSelectedTask}
              onFollowUp={setFollowUpTask}
            />
          </>
        ) : activeView === "dashboard" ? (
          <KPIDashboard tasks={tasks} projects={projects} />
        ) : (
          <ProjectsPage 
            tasks={tasks} 
            projects={projects}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {/* Task Form Dialog */}
        {(isTaskFormOpen || selectedTask) && (
          <TaskForm
            isOpen={isTaskFormOpen || !!selectedTask}
            onClose={() => {
              setIsTaskFormOpen(false);
              setSelectedTask(null);
            }}
            onSave={selectedTask ? handleUpdateTask : handleCreateTask}
            task={selectedTask}
          />
        )}

        {/* Follow Up Dialog */}
        {followUpTask && (
          <FollowUpDialog
            isOpen={!!followUpTask}
            onClose={() => setFollowUpTask(null)}
            onAddFollowUp={(text) => handleAddFollowUp(followUpTask.id, text)}
            task={followUpTask}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
