import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, ListTodo } from "lucide-react";
import { Task, TaskStatus, TaskPriority, TaskType, Project } from "@/types/task";
import { mockTasks, mockProjects } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { KPIDashboard } from "@/components/KPIDashboard";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { TaskSummaryCards } from "@/components/TaskSummaryCards";
import { AppHeader } from "@/components/AppHeader";
import ProjectsPage from "./Projects";
import Parameters from "@/components/Parameters";

const Index = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dark-mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedDarkMode ? JSON.parse(savedDarkMode) : prefersDark;
    
    setIsDarkMode(shouldUseDark);
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('dark-mode', JSON.stringify(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getStoredTasks = (): Task[] => {
    try {
      const stored = localStorage.getItem('pmtask-tasks');
      return stored ? JSON.parse(stored) : mockTasks;
    } catch (error) {
      console.warn('Failed to load tasks from localStorage:', error);
      return mockTasks;
    }
  };

  const [tasks, setTasks] = useState<Task[]>(getStoredTasks());
  const [projects, setProjects] = useState<Project[]>(mockProjects.map(p => ({ ...p, scope: p.scope || 'Frontend' })));
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "inprogress" | "onhold" | "critical">("all");
  const [activeView, setActiveView] = useState<"tasks" | "dashboard" | "projects">("tasks");
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'on-hold' | 'completed'>('all');

  // Generate next sequential task ID
  const getNextTaskId = (): string => {
    const existingNumbers = tasks
      .map(task => task.id)
      .filter(id => id.startsWith('T'))
      .map(id => parseInt(id.substring(1)))
      .filter(num => !isNaN(num));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `T${maxNumber + 1}`;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      switch (activeFilter) {
        case "open":
          return task.status === "Open";
        case "inprogress":
          return task.status === "In Progress";
        case "onhold":
          return task.status === "On Hold";
        case "critical":
          return task.priority === "Critical" && task.status !== "Completed";
        case "all":
          return true; // Include ALL tasks, including completed ones
        default:
          return true;
      }
    });
  }, [tasks, activeFilter]);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    const newTask: Task = {
      ...taskData,
      id: getNextTaskId(),
      creationDate: new Date().toISOString().split('T')[0],
      followUps: []
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    try {
      localStorage.setItem('pmtask-tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.warn('Failed to save tasks to localStorage:', error);
    }
    setIsTaskFormOpen(false);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    console.log('Index - handleUpdateTask called with:', updatedTask.id, updatedTask.title);
    const updatedTasks = tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
    setTasks(updatedTasks);

    try {
      localStorage.setItem('pmtask-tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.warn('Failed to save tasks to localStorage:', error);
    }
    setSelectedTask(null);
    setIsTaskFormOpen(false);
  };

  const handleEditTask = (task: Task) => {
    console.log('Index - handleEditTask called with task:', task);
    console.log('Task object properties:', Object.keys(task));
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleAddFollowUp = (taskId: string, followUpText: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newFollowUp = {
          id: `${taskId}-F${task.followUps.length + 1}`,
          text: followUpText,
          timestamp: new Date().toISOString(),
          author: 'Current User'
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

  const handleFollowUpTask = (updatedTask: Task) => {
    console.log('Index - handleFollowUpTask called with:', updatedTask.id, updatedTask.title);
    const updatedTasks = tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
    setTasks(updatedTasks);

    try {
      localStorage.setItem('pmtask-tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.warn('Failed to save tasks to localStorage:', error);
    }
  };

  const handleCreateProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: `P${projects.length + 1}`
    };
    setProjects([...projects, newProject]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(project => project.id === updatedProject.id ? updatedProject : project));
  };

  const handleSaveTask = (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    console.log('Index - handleSaveTask called with:', taskData);
    if ('id' in taskData) {
      // Updating existing task
      handleUpdateTask(taskData as Task);
    } else {
      // Creating new task
      handleCreateTask(taskData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AppHeader 
        activeView={activeView}
        onViewChange={setActiveView}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenParameters={() => setIsParametersOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === "tasks" ? (
          <>
            {/* Task Management Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <ListTodo className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Create, assign, and track individual tasks</p>
                </div>
              </div>
              <Button onClick={() => setIsTaskFormOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </div>
              </div>
            </div>

            <TaskSummaryCards 
              tasks={tasks}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <TaskTable 
              tasks={filteredTasks} 
              onEditTask={handleEditTask} 
              onFollowUp={handleFollowUpTask} 
            />
          </>
        ) : activeView === "dashboard" ? (
          <KPIDashboard 
            tasks={tasks} 
            projects={projects} 
            onEditTask={handleEditTask} 
          />
        ) : (
          <ProjectsPage 
            tasks={tasks} 
            projects={projects} 
            onCreateProject={handleCreateProject} 
            onUpdateProject={handleUpdateProject} 
            onCreateTask={handleCreateTask} 
            onUpdateTask={handleUpdateTask} 
            projectFilter={projectFilter} 
            setProjectFilter={setProjectFilter} 
          />
        )}

        {/* Task Form Dialog */}
        <TaskForm 
          isOpen={isTaskFormOpen} 
          onClose={() => {
            setIsTaskFormOpen(false);
            setSelectedTask(null);
          }} 
          onSave={handleSaveTask} 
          task={selectedTask} 
          allTasks={tasks}
          allProjects={projects}
        />

        {/* Follow Up Dialog */}
        {followUpTask && (
          <FollowUpDialog 
            isOpen={!!followUpTask} 
            onClose={() => setFollowUpTask(null)} 
            onAddFollowUp={text => handleAddFollowUp(followUpTask.id, text)} 
            task={followUpTask} 
          />
        )}

        {/* Parameters Dialog */}
        <Parameters isOpen={isParametersOpen} onClose={() => setIsParametersOpen(false)} />
      </div>
    </div>
  );
};

export default Index;
