import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, Pause, Search, Edit3, Trash2, Filter } from "lucide-react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { TimeEntryFiltersComponent } from "@/components/TimeEntryFilters";
import { TimeEntryExport } from "@/components/TimeEntryExport";
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { useScopeColor } from "@/hooks/useScopeColor";
import { useTaskTypeColor } from "@/hooks/useTaskTypeColor";
import { useEnvironmentColor } from "@/hooks/useEnvironmentColor";
import { Task } from "@/types/task";
import { Project } from "@/types/task";
import { TimeEntry, TimeEntryFilters } from "@/types/timeEntry";

interface TimeTrackingPageProps {
  tasks: Task[];
  projects: Project[];
}

export const TimeTrackingPage = ({ tasks, projects }: TimeTrackingPageProps) => {
  const { timeEntries, startTimer, stopTimer, getFilteredTimeEntries, getTimeEntryStats, deleteTimeEntry } = useTimeTracking();
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TimeEntryFilters>({
    year: new Date().getFullYear()
  });

  // Task editing state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    totalMinutes: 0
  });

  // Get filtered entries based on search and filters
  const filteredEntries = useMemo(() => {
    const filtered = getFilteredTimeEntries(filters);
    
    if (!searchTerm) return filtered;
    
    return filtered.filter(entry => 
      entry.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.responsible.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [getFilteredTimeEntries, filters, searchTerm]);

  // Calculate statistics for filtered entries
  const stats = useMemo(() => getTimeEntryStats(filteredEntries), [getTimeEntryStats, filteredEntries]);

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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const runningEntry = filteredEntries.find(entry => entry.taskId === taskId && entry.isRunning);
    if (runningEntry) {
      stopTimer(taskId);
    } else {
      startTimer(taskId, task.title, task.project, task.responsible);
    }
  };

  const handleEditTimeEntry = (entry: TimeEntry) => {
    const startDate = new Date(entry.startTime);
    
    setEditingEntry(entry);
    setEditFormData({
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: entry.endTime ? new Date(entry.endTime).toTimeString().slice(0, 5) : "",
      totalMinutes: entry.duration || 0
    });
    setEditDialogOpen(true);
  };

  const handleSaveTimeEntry = () => {
    // For now, just close the dialog
    // In a full implementation, this would save the changes to the database
    console.log('Saving time entry:', editFormData);
    setEditDialogOpen(false);
    setEditingEntry(null);
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (end <= start) {
      // Handle next day scenario
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...editFormData, [field]: value };
    
    // Auto-calculate duration when both start and end times are set
    if (field === 'startTime' || field === 'endTime') {
      if (newFormData.startTime && newFormData.endTime) {
        newFormData.totalMinutes = calculateDuration(newFormData.startTime, newFormData.endTime);
      }
    }
    
    setEditFormData(newFormData);
  };

  const handleRowClick = (entry: TimeEntry) => {
    const task = tasks.find(t => t.id === entry.taskId);
    if (task) {
      setSelectedTask(task);
      setIsTaskFormOpen(true);
    }
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setSelectedTask(null);
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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex items-center space-x-3">
          <Clock className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor and manage task time entries</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <RunningTimerDisplay tasks={tasks} />
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
              {stats.runningEntries}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks with Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalEntries}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time per Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatTime(Math.round(stats.averageEntryDuration))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TimeEntryFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({})}
      />

      {/* Export */}
      <TimeEntryExport
        entries={filteredEntries}
        filters={filters}
        onExport={() => console.log('Export functionality')}
      />

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Time Entries</CardTitle>
          <CardDescription>Each timer session as a separate entry with unique ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredEntries.map((entry) => {
                   const startDate = new Date(entry.startTime);
                   const endDate = entry.endTime ? new Date(entry.endTime) : null;
                   const task = tasks.find(t => t.id === entry.taskId);
                   
                   return (
                     <TableRow key={entry.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => handleRowClick(entry)}>
                       <TableCell>
                         <div className="font-medium text-gray-900 dark:text-white truncate">
                           {entry.taskId}_{entry.taskTitle}
                         </div>
                       </TableCell>
                       
                       <TableCell>
                         <div className="text-sm text-gray-900 dark:text-white truncate">
                           {entry.projectName}
                         </div>
                       </TableCell>
                       
                        <TableCell>
                          <div className="flex items-center">
                            <Badge 
                              style={getScopeStyle(task?.scope || '')}
                              className="text-xs"
                            >
                              {task?.scope || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center">
                            <Badge 
                              style={getTaskTypeStyle(task?.taskType || '')}
                              className="text-xs border"
                            >
                              {task?.taskType || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center">
                            <Badge 
                              style={getEnvironmentStyle(task?.environment || '')}
                              className="text-xs border"
                            >
                              {task?.environment || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                       
                       <TableCell>
                         <div className="text-sm text-gray-900 dark:text-white">
                           {startDate.toLocaleDateString()}
                         </div>
                       </TableCell>
                       
                       <TableCell>
                         <div className="text-sm text-gray-900 dark:text-white">
                           {startDate.toLocaleTimeString()}
                         </div>
                       </TableCell>
                       
                       <TableCell>
                         <div className="text-sm text-gray-900 dark:text-white">
                           {entry.isRunning ? (
                             <span className="text-green-600 dark:text-green-400">In Progress</span>
                           ) : (
                             endDate ? endDate.toLocaleTimeString() : '-'
                           )}
                         </div>
                       </TableCell>
                       
                       <TableCell>
                         <div className="text-sm font-medium text-gray-900 dark:text-white">
                           {entry.duration ? formatDetailedTime(entry.duration) : '-'}
                         </div>
                       </TableCell>
                      
                       <TableCell>
                         <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTimeEntry(entry)}
                            title="Edit Time Entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTimeEntry(entry.id)}
                            title="Delete Time Entry"
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

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || Object.keys(filters).length > 1
                  ? "No time entries found matching your filters."
                  : "No time entries yet. Start a timer on a task to begin tracking time."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Time Entry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Modify the time entry: {editingEntry?.id}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={editFormData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-time" className="text-right">
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={editFormData.startTime}
                onChange={(e) => handleFormChange('startTime', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-time" className="text-right">
                End Time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={editFormData.endTime}
                onChange={(e) => handleFormChange('endTime', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400 py-2">
                {formatDetailedTime(editFormData.totalMinutes)}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTimeEntry}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Edit Dialog */}
      <TaskFormOptimized
        task={selectedTask}
        isOpen={isTaskFormOpen}
        onClose={handleTaskFormClose}
        onSave={() => {
          // Task save logic would be handled by the TaskFormOptimized component
          setIsTaskFormOpen(false);
          setSelectedTask(null);
        }}
        allTasks={tasks}
        allProjects={projects}
      />
    </div>
  );
};

export default TimeTrackingPage;