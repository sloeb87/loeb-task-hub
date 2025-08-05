import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GanttChart } from "@/components/GanttChart";
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { 
  ArrowLeft, 
  Plus, 
  Filter, 
  Search, 
  Download, 
  Calendar,
  Target,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Clock,
  AlertTriangle,
  FullscreenIcon,
  Minimize2,
  Settings,
  BarChart3
} from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";

const GanttView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use Supabase storage
  const { tasks, projects, createTask, updateTask } = useSupabaseStorage();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Check if project is specified in URL params
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam) {
      setSelectedProject(projectParam);
    }
  }, [searchParams]);

  // Enhanced filtering logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectMatch = selectedProject === "all" || task.project === selectedProject;
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const searchMatch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return projectMatch && statusMatch && priorityMatch && searchMatch;
    });
  }, [tasks, selectedProject, statusFilter, priorityFilter, searchTerm]);

  // Get project date range for Gantt
  const projectDateRange = useMemo(() => {
    if (selectedProject !== "all") {
      const project = projects.find(p => p.name === selectedProject);
      if (project) {
        return { startDate: project.startDate, endDate: project.endDate };
      }
    }
    
    // Calculate from all filtered tasks
    if (filteredTasks.length === 0) {
      const today = new Date();
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    }

    const startDates = filteredTasks.map(t => new Date(t.startDate).getTime());
    const endDates = filteredTasks.map(t => new Date(t.dueDate).getTime());
    
    return {
      startDate: new Date(Math.min(...startDates)).toISOString().split('T')[0],
      endDate: new Date(Math.max(...endDates)).toISOString().split('T')[0]
    };
  }, [selectedProject, projects, filteredTasks]);

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    try {
      await createTask(taskData);
      setIsTaskFormOpen(false);
      toast({
        title: "Task Created",
        description: `Task "${taskData.title}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask);
      setSelectedTask(null);
      setIsTaskFormOpen(false);
      toast({
        title: "Task Updated",
        description: `Task "${updatedTask.title}" has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTasksChange = async (updatedTasks: Task[]) => {
    // Find which tasks changed and update them
    const tasksToUpdate = updatedTasks.filter(updatedTask => {
      const originalTask = tasks.find(t => t.id === updatedTask.id);
      return originalTask && (
        originalTask.startDate !== updatedTask.startDate ||
        originalTask.dueDate !== updatedTask.dueDate
      );
    });

    try {
      for (const task of tasksToUpdate) {
        await updateTask(task);
      }
      if (tasksToUpdate.length > 0) {
        toast({
          title: "Tasks Updated",
          description: `${tasksToUpdate.length} task(s) rescheduled successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const exportGantt = () => {
    toast({
      title: "Export Started",
      description: "Gantt chart export is being prepared...",
    });
    // Here you would implement actual export functionality
  };

  const clearFilters = () => {
    setSelectedProject("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchTerm("");
  };

  const getStatusStats = () => {
    const stats = {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status === 'Completed').length,
      inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
      open: filteredTasks.filter(t => t.status === 'Open').length,
      onHold: filteredTasks.filter(t => t.status === 'On Hold').length,
    };
    return stats;
  };

  const stats = getStatusStats();
  const hasActiveFilters = selectedProject !== "all" || statusFilter !== "all" || priorityFilter !== "all" || searchTerm !== "";

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Gantt Timeline
                </h1>
                <p className="text-sm text-gray-600">Interactive project timeline</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {[selectedProject !== "all", statusFilter !== "all", priorityFilter !== "all", searchTerm !== ""].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskFormOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportGantt}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-xl font-bold text-orange-600">{stats.open}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <PauseCircle className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">On Hold</p>
                <p className="text-xl font-bold text-gray-600">{stats.onHold}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Project Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.name}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Info */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredTasks.length} of {tasks.length} tasks
            {selectedProject !== "all" && (
              <Badge variant="outline" className="ml-2">
                {selectedProject}
              </Badge>
            )}
          </div>
          
          {filteredTasks.length === 0 && tasks.length > 0 && (
            <div className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              No tasks match the current filters
            </div>
          )}
        </div>

        {/* Gantt Chart */}
        {filteredTasks.length > 0 ? (
          <GanttChart
            tasks={filteredTasks}
            onTasksChange={handleTasksChange}
            projectStartDate={projectDateRange.startDate}
            projectEndDate={projectDateRange.endDate}
            onEditTask={handleEditTask}
          />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks to display</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {tasks.length === 0 
                    ? "Get started by creating your first task."
                    : "Try adjusting your filters to see tasks."
                  }
                </p>
                <Button
                  onClick={() => setIsTaskFormOpen(true)}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Form Dialog */}
        <TaskFormOptimized 
          isOpen={isTaskFormOpen} 
          onClose={() => {
            setIsTaskFormOpen(false);
            setSelectedTask(null);
          }} 
          onSave={selectedTask ? handleUpdateTask : handleCreateTask} 
          task={selectedTask} 
          allTasks={tasks} 
          allProjects={projects}
        />
      </div>
    </div>
  );
};

export default GanttView;