import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, Pause, Search, Edit3, Trash2, Filter } from "lucide-react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { Task } from "@/types/task";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";

interface TimeTrackingPageProps {
  tasks: Task[];
}

export const TimeTrackingPage = ({ tasks }: TimeTrackingPageProps) => {
  const { taskTimers, startTimer, stopTimer, getTaskTime, getTotalTimeForAllTasks } = useTimeTracking();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get all tasks with time data
  const tasksWithTime = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      timeData: getTaskTime(task.id)
    })).filter(task => 
      task.timeData.totalTime > 0 || task.timeData.isRunning
    );
  }, [tasks, taskTimers]);

  // Filter tasks based on search and status
  const filteredTasks = useMemo(() => {
    return tasksWithTime.filter(task => {
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "running" && task.timeData.isRunning) ||
        (statusFilter === "paused" && !task.timeData.isRunning && task.timeData.totalTime > 0);
      
      return matchesSearch && matchesStatus;
    });
  }, [tasksWithTime, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTime = getTotalTimeForAllTasks();
    const runningTasks = tasksWithTime.filter(t => t.timeData.isRunning).length;
    const tasksWithTimeLogged = tasksWithTime.filter(t => t.timeData.totalTime > 0).length;
    
    return {
      totalTime,
      runningTasks,
      tasksWithTimeLogged,
      avgTimePerTask: tasksWithTimeLogged > 0 ? totalTime / tasksWithTimeLogged : 0
    };
  }, [tasksWithTime, getTotalTimeForAllTasks]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDetailedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const days = Math.floor(hours / 8); // Assuming 8-hour workdays
    const remainingHours = hours % 8;
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleTimerToggle = (taskId: string) => {
    const taskTime = getTaskTime(taskId);
    if (taskTime.isRunning) {
      stopTimer(taskId);
    } else {
      startTimer(taskId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Open": return "bg-orange-100 text-orange-800";
      case "On Hold": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor and manage task time entries</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDetailedTime(stats.totalTime)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Running Timers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.runningTasks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks with Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.tasksWithTimeLogged}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time per Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatTime(Math.round(stats.avgTimePerTask))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>All tasks with logged time or active timers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="running">Running Timers</option>
                <option value="paused">Paused/Stopped</option>
              </select>
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Time Logged</TableHead>
                  <TableHead>Timer Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const currentSessionStart = task.timeData.currentSessionStart;
                  const sessionDate = currentSessionStart ? new Date(currentSessionStart) : new Date();
                  
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {task.id}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {task.project}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {task.responsible}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {sessionDate.toLocaleDateString()}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {currentSessionStart ? new Date(currentSessionStart).toLocaleTimeString() : '-'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {task.timeData.isRunning ? (
                            <span className="text-green-600 dark:text-green-400">In Progress</span>
                          ) : (
                            currentSessionStart ? new Date().toLocaleTimeString() : '-'
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDetailedTime(task.timeData.totalTime)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {task.timeData.isRunning ? (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
                              <span className="text-sm font-medium">Running</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Stopped</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={task.timeData.isRunning ? "destructive" : "outline"}
                            onClick={() => handleTimerToggle(task.id)}
                            title={task.timeData.isRunning ? "Stop Timer" : "Start Timer"}
                          >
                            {task.timeData.isRunning ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit Time Entry"
                            disabled
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete Time Entry"
                            disabled
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== "all" 
                  ? "No time entries found matching your filters."
                  : "No time entries yet. Start a timer on a task to begin tracking time."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTrackingPage;