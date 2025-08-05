import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@/types/task";
import { useParameterColors } from '@/hooks/useParameterColors';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, isSameDay, isToday } from "date-fns";
import { 
  Calendar, 
  ZoomIn, 
  ZoomOut, 
  Target, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Edit3,
  Plus
} from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  projectStartDate: string;
  projectEndDate: string;
  onEditTask?: (task: Task) => void;
}

interface TimelineUnit {
  date: Date;
  label: string;
  isToday: boolean;
  isWeekend: boolean;
}

const GanttChart = ({ tasks, onTasksChange, projectStartDate, projectEndDate, onEditTask }: GanttChartProps) => {
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.5 to 3 range
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [isResizing, setIsResizing] = useState<{ taskId: string; type: 'start' | 'end' } | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Get parameter colors
  const { getScopeStyle, getStatusStyle, getPriorityStyle, loading: parametersLoading } = useParameterColors();

  // Calculate date range
  const { startDate, endDate, duration } = useMemo(() => {
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);
    
    // Add some padding
    const paddedStart = addDays(start, -7);
    const paddedEnd = addDays(end, 7);
    
    return {
      startDate: paddedStart,
      endDate: paddedEnd,
      duration: differenceInDays(paddedEnd, paddedStart) + 1
    };
  }, [projectStartDate, projectEndDate]);

  // Generate timeline units
  const timelineUnits = useMemo(() => {
    const units: TimelineUnit[] = [];
    
    if (viewMode === 'days') {
      for (let i = 0; i < duration; i++) {
        const date = addDays(startDate, i);
        units.push({
          date,
          label: format(date, 'dd'),
          isToday: isToday(date),
          isWeekend: date.getDay() === 0 || date.getDay() === 6
        });
      }
    } else if (viewMode === 'weeks') {
      const weekStart = startOfWeek(startDate);
      const weekEnd = endOfWeek(endDate);
      const weekDuration = differenceInDays(weekEnd, weekStart) / 7;
      
      for (let i = 0; i <= weekDuration; i++) {
        const date = addDays(weekStart, i * 7);
        units.push({
          date,
          label: format(date, 'MMM dd'),
          isToday: false,
          isWeekend: false
        });
      }
    } else if (viewMode === 'months') {
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
      
      let currentDate = new Date(monthStart);
      while (currentDate <= monthEnd) {
        units.push({
          date: new Date(currentDate),
          label: format(currentDate, 'MMM yyyy'),
          isToday: false,
          isWeekend: false
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return units;
  }, [startDate, endDate, duration, viewMode]);

  // Calculate task position and width
  const getTaskDimensions = useCallback((task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    const taskDuration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
    
    let left, width;
    
    if (viewMode === 'weeks') {
      const weekStart = startOfWeek(startDate);
      const taskWeekStart = Math.floor(differenceInDays(taskStart, weekStart) / 7);
      const taskWeekDuration = Math.max(1, Math.ceil(taskDuration / 7));
      
      left = (taskWeekStart / timelineUnits.length) * 100;
      width = (taskWeekDuration / timelineUnits.length) * 100;
    } else if (viewMode === 'months') {
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const taskMonthStart = (taskStart.getFullYear() - monthStart.getFullYear()) * 12 + 
                             (taskStart.getMonth() - monthStart.getMonth());
      const taskMonthEnd = (taskEnd.getFullYear() - monthStart.getFullYear()) * 12 + 
                           (taskEnd.getMonth() - monthStart.getMonth());
      const taskMonthDuration = Math.max(1, taskMonthEnd - taskMonthStart + 1);
      
      left = (taskMonthStart / timelineUnits.length) * 100;
      width = (taskMonthDuration / timelineUnits.length) * 100;
    } else {
      const daysFromStart = Math.max(0, differenceInDays(taskStart, startDate));
      left = (daysFromStart / duration) * 100;
      width = (taskDuration / duration) * 100;
    }
    
    return {
      left: Math.max(0, left),
      width: Math.max(2, width),
      duration: taskDuration
    };
  }, [startDate, duration, timelineUnits.length, viewMode]);

  // Handle task drag
  const handleTaskMouseDown = useCallback((e: React.MouseEvent, task: Task) => {
    if (e.button !== 0) return; // Only left click
    
    setDraggedTask(task.id);
    setDragStartX(e.clientX);
    setDragStartDate(new Date(task.startDate));
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedTask || !dragStartDate || !ganttRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    const containerRect = ganttRef.current.getBoundingClientRect();
    const pixelsPerDay = containerRect.width / duration;
    const daysMoved = Math.round(deltaX / pixelsPerDay);
    
    // Update task position visually (you could add a preview here)
    console.log(`Moving task ${draggedTask} by ${daysMoved} days`);
  }, [draggedTask, dragStartX, dragStartDate, duration]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggedTask || !dragStartDate || !ganttRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    const containerRect = ganttRef.current.getBoundingClientRect();
    const pixelsPerDay = containerRect.width / duration;
    const daysMoved = Math.round(deltaX / pixelsPerDay);
    
    if (Math.abs(daysMoved) > 0) {
      const task = tasks.find(t => t.id === draggedTask);
      if (task) {
        const newStartDate = addDays(new Date(task.startDate), daysMoved);
        const newEndDate = addDays(new Date(task.dueDate), daysMoved);
        
        const updatedTasks = tasks.map(t => 
          t.id === draggedTask 
            ? { 
                ...t, 
                startDate: format(newStartDate, 'yyyy-MM-dd'), 
                dueDate: format(newEndDate, 'yyyy-MM-dd') 
              }
            : t
        );
        
        onTasksChange(updatedTasks);
      }
    }
    
    setDraggedTask(null);
    setDragStartX(0);
    setDragStartDate(null);
  }, [draggedTask, dragStartX, dragStartDate, duration, tasks, onTasksChange]);

  // Add mouse event listeners
  useEffect(() => {
    if (draggedTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, handleMouseMove, handleMouseUp]);

  // Track container width for responsive calculations
  useEffect(() => {
    const updateWidth = () => {
      if (ganttRef.current) {
        setContainerWidth(ganttRef.current.getBoundingClientRect().width);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Navigate timeline
  const navigateTimeline = (direction: 'prev' | 'next') => {
    // Implementation for timeline navigation
    console.log(`Navigate ${direction}`);
  };

  const goToToday = () => {
    // Implementation to center on today
    console.log('Go to today');
  };

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetView = () => {
    setViewMode('weeks');
    setZoomLevel(1);
    setSelectedTask(null);
  };

  // Show loading skeleton while parameters are loading
  if (parametersLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Project Gantt Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks to display</h3>
            <p className="text-muted-foreground mb-4">
              Create tasks to see them in the Gantt chart timeline.
            </p>
            <Button onClick={() => console.log('Create task')}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Task
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Interactive Gantt Chart
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click and drag tasks to reschedule. Click task bars to edit details.
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'days' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('days')}
                className="rounded-r-none"
              >
                Days
              </Button>
              <Button
                variant={viewMode === 'weeks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('weeks')}
                className="rounded-none"
              >
                Weeks
              </Button>
              <Button
                variant={viewMode === 'months' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('months')}
                className="rounded-l-none"
              >
                Months
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={() => navigateTimeline('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              <Target className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateTimeline('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t">
          {/* Timeline Header */}
          <div className="grid grid-cols-12 border-b bg-muted/50">
            <div className="col-span-3 p-3 border-r">
              <div className="font-medium text-sm">Task</div>
            </div>
            <div className="col-span-9 relative overflow-x-auto">
              <div 
                className="flex h-12 items-center transition-transform duration-200" 
                style={{ 
                  width: `${100 * zoomLevel}%`,
                  minWidth: '100%'
                }}
              >
                {timelineUnits.map((unit, index) => (
                  <div
                    key={index}
                    className={`flex-1 text-center text-sm border-r last:border-r-0 ${
                      unit.isToday ? 'bg-gantt-today text-gantt-today-foreground font-semibold' : ''
                    } ${unit.isWeekend ? 'bg-gantt-weekend text-gantt-weekend-foreground' : ''}`}
                    style={{ minWidth: `${100 / timelineUnits.length}%` }}
                  >
                    <div className="py-2">{unit.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <ScrollArea className="h-96">
            <div ref={ganttRef} className="relative">
              {tasks.map((task, index) => {
                const { left, width } = getTaskDimensions(task);
                const isSelected = selectedTask === task.id;
                const isDragging = draggedTask === task.id;
                
                return (
                  <div
                    key={task.id}
                    className={`grid grid-cols-12 border-b hover:bg-muted/30 transition-colors ${
                      isSelected ? 'bg-accent/50' : ''
                    }`}
                  >
                    {/* Task Info */}
                    <div className="col-span-3 p-3 border-r">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {task.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTask?.(task)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-1"
                            style={getScopeStyle(task.scope)}
                          >
                            {task.scope}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs px-1"
                            style={getStatusStyle(task.status)}
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.responsible}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="col-span-9 relative h-16 p-2 overflow-x-auto">
                      <div 
                        className="relative h-full transition-transform duration-200"
                        style={{ 
                          width: `${100 * zoomLevel}%`,
                          minWidth: '100%'
                        }}
                      >
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex">
                          {timelineUnits.map((_, unitIndex) => (
                            <div
                              key={unitIndex}
                              className="flex-1 border-r last:border-r-0 border-border"
                              style={{ minWidth: `${100 / timelineUnits.length}%` }}
                            />
                          ))}
                        </div>

                        {/* Task Bar */}
                        <div
                          className={`absolute top-0 bottom-0 rounded-md cursor-move transition-all group ${
                            isDragging ? 'opacity-80 shadow-lg z-10' : 'hover:shadow-md'
                          } ${
                            task.status === 'Completed' ? 'bg-green-500' :
                            task.status === 'In Progress' ? 'bg-blue-500' :
                            task.status === 'On Hold' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 2)}%`,
                          }}
                          onMouseDown={(e) => handleTaskMouseDown(e, task)}
                          onClick={() => setSelectedTask(isSelected ? null : task.id)}
                          title={`${task.title}\n${format(new Date(task.startDate), 'MMM dd')} - ${format(new Date(task.dueDate), 'MMM dd')}\nDuration: ${getTaskDimensions(task).duration} days`}
                        >
                          <div className="h-full flex items-center px-2 text-white text-xs font-medium">
                            <span className="truncate">
                              {task.id}: {task.title}
                            </span>
                          </div>
                          
                          {/* Progress indicator */}
                          {task.status === 'In Progress' && (
                            <div className="absolute bottom-0 left-0 h-1 bg-white/50 rounded-b-md" style={{ width: '60%' }} />
                          )}
                          
                          {/* Priority indicator */}
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            task.priority === 'Critical' ? 'bg-red-300' :
                            task.priority === 'High' ? 'bg-orange-300' :
                            task.priority === 'Medium' ? 'bg-blue-300' :
                            'bg-gray-300'
                          }`} />

                          {/* Follow-up indicator */}
                          {task.followUps && task.followUps.length > 0 && (
                            <div className="absolute top-1 left-1 text-white/80">
                              💬
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="border-t p-3 bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>On Hold</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span>Open</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Timeline: {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { GanttChart };