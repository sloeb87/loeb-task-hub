import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChart } from "@/components/GanttChart";
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { 
  ArrowLeft, 
  Plus, 
  Filter, 
  Search, 
  Download, 
  Calendar,
  Users,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Settings,
  FullscreenIcon,
  Minimize2
} from "lucide-react";
import { Task, TaskStatus, TaskPriority, Project } from "@/types/task";
import { mockProjects } from "@/data/mockData";
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
        task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    // Update tasks via Supabase storage
    try {
      for (const task of updatedTasks) {
        await updateTask(task);
      }
      toast({
        title: "Tasks Updated",
        description: "Tasks have been synchronized successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportGantt = () => {
    toast({
      title: "Export Started",
      description: "Gantt chart export is being prepared...",
    });
    // Here you would implement actual export functionality
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

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Enhanced Header */}
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
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Gantt Chart</h1>
                <p className="text-sm text-gray-600">Interactive timeline view</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
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
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Controls Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Tasks</label>
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
              </TabsContent>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Total Tasks</p>
                          <p className="text-xl font-bold">{stats.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">In Progress</p>
                          <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-sm text-gray-600">Open</p>
                          <p className="text-xl font-bold text-orange-600">{stats.open}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <PauseCircle className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">On Hold</p>
                          <p className="text-xl font-bold text-gray-600">{stats.onHold}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>• Click on any task to edit its details</p>
                  <p>• Drag tasks to move them in time</p>
                  <p>• Drag the edges to resize task duration</p>
                  <p>• Hover over tasks to see resize handles</p>
                  <p>• Use the dependency panel below to manage task relationships</p>
                  <p>• Click on comments in tasks to edit them</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredTasks.length} of {tasks.length} tasks
            {selectedProject !== "all" && (
              <Badge variant="outline" className="ml-2">
                Project: {selectedProject}
              </Badge>
            )}
          </div>
          
          {filteredTasks.length === 0 && (
            <div className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              No tasks match the current filters
            </div>
          )}
        </div>

        {/* Enhanced Gantt Chart */}
        {filteredTasks.length > 0 ? (
          <GanttChart
            tasks={filteredTasks}
            onTasksChange={handleTasksChange}
            projectStartDate={projectDateRange.startDate}
            projectEndDate={projectDateRange.endDate}
            onEditTask={setSelectedTask}
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
                  Create First Task
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Form Dialog */}
        {(isTaskFormOpen || selectedTask) && (
          <TaskFormOptimized
            isOpen={isTaskFormOpen || !!selectedTask}
            onClose={() => {
              setIsTaskFormOpen(false);
              setSelectedTask(null);
            }}
            onSave={selectedTask ? handleUpdateTask : handleCreateTask}
            task={selectedTask}
            allTasks={tasks}
            allProjects={projects}
          />
        )}
      </div>
    </div>
  );
};

export default GanttView;
