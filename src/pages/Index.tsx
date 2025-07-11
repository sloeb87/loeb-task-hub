
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { KPIDashboard } from "@/components/KPIDashboard";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { Plus, Filter, Search, BarChart3 } from "lucide-react";
import { Task, TaskStatus, TaskPriority, TaskType } from "@/types/task";
import { mockTasks } from "@/data/mockData";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [activeView, setActiveView] = useState<"tasks" | "dashboard">("tasks");

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

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
            </div>
            <div className="flex items-center space-x-2">
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
                <div className="flex flex-1 gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tasks, descriptions, or assignees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "ALL")}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <Button onClick={() => setIsTaskFormOpen(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </div>
            </div>

            {/* Task Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
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
              <Card>
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
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {tasks.filter(t => t.status === "Completed").length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-green-600 rounded-full"></div>
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
        ) : (
          <KPIDashboard tasks={tasks} />
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
