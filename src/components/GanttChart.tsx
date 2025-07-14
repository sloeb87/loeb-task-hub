import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Task } from "@/types/task";
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { Calendar as CalendarIcon, RotateCcw, Trash2, Plus, Edit3, Move, GripHorizontal } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  projectStartDate: string;
  projectEndDate: string;
  onEditTask?: (task: Task) => void;
}

interface DraggableTaskProps {
  task: Task;
  ganttStartDate: Date;
  ganttDuration: number;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onEditTask?: (task: Task) => void;
  onAddDependency: (taskId: string, dependencyId: string) => void;
  onRemoveDependency: (taskId: string, dependencyId: string) => void;
  allTasks: Task[];
  yPosition: number;
  isDragging?: boolean;
}

const DraggableTask = ({ 
  task, 
  ganttStartDate, 
  ganttDuration, 
  onTaskUpdate, 
  onEditTask, 
  onAddDependency, 
  onRemoveDependency, 
  allTasks, 
  yPosition,
  isDragging = false 
}: DraggableTaskProps) => {
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const taskRef = useRef<HTMLDivElement>(null);
  
  // Calculate task position and width
  const taskStartDate = new Date(task.startDate);
  const taskEndDate = new Date(task.dueDate);
  const taskDuration = Math.max(1, differenceInDays(taskEndDate, taskStartDate) + 1);
  const daysFromStart = Math.max(0, differenceInDays(taskStartDate, ganttStartDate));
  
  const taskLeft = (daysFromStart / ganttDuration) * 100;
  const taskWidth = (taskDuration / ganttDuration) * 100;

  const {
    attributes: moveAttributes,
    listeners: moveListeners,
    setNodeRef: setMoveRef,
    transform: moveTransform,
  } = useDraggable({
    id: `move-${task.id}`,
    data: { type: 'move', task }
  });

  const {
    attributes: resizeStartAttributes,
    listeners: resizeStartListeners,
    setNodeRef: setResizeStartRef,
  } = useDraggable({
    id: `resize-start-${task.id}`,
    data: { type: 'resize-start', task }
  });

  const {
    attributes: resizeEndAttributes,
    listeners: resizeEndListeners,
    setNodeRef: setResizeEndRef,
  } = useDraggable({
    id: `resize-end-${task.id}`,
    data: { type: 'resize-end', task }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500 border-green-600';
      case 'In Progress': return 'bg-blue-500 border-blue-600';
      case 'On Hold': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'border-red-500 border-4';
      case 'High': return 'border-orange-500 border-2';
      case 'Medium': return 'border-blue-500 border';
      case 'Low': return 'border-gray-300 border';
      default: return 'border-gray-300 border';
    }
  };

  const moveTransformStyle = moveTransform ? {
    transform: `translate(${moveTransform.x}px, ${moveTransform.y}px)`,
  } : undefined;

  return (
    <div
      className="absolute group"
      style={{
        left: `${taskLeft}%`,
        width: `${Math.max(3, taskWidth)}%`,
        top: `${yPosition * 60 + 10}px`,
        height: '40px',
        zIndex: isDragging ? 1000 : 10,
        ...moveTransformStyle,
      }}
    >
      {/* Main Task Bar */}
      <div
        ref={setMoveRef}
        className={`
          relative h-full rounded-md shadow-md cursor-move transition-all duration-200
          ${getStatusColor(task.status)} ${getPriorityBorder(task.priority)}
          ${isDragging ? 'opacity-80 scale-105 shadow-lg' : 'hover:shadow-lg hover:scale-105'}
          group-hover:brightness-110
        `}
        {...moveAttributes}
        {...moveListeners}
        onClick={(e) => {
          e.stopPropagation();
          onEditTask?.(task);
        }}
        title={`${task.title} (${task.responsible})\n${format(taskStartDate, 'MMM dd')} - ${format(taskEndDate, 'MMM dd')}\nStatus: ${task.status}\nPriority: ${task.priority}`}
      >
        {/* Task Content */}
        <div className="px-2 py-1 text-xs text-white font-medium truncate h-full flex items-center">
          <span className="truncate">{task.id}: {task.title}</span>
        </div>
        
        {/* Priority Indicator */}
        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
          task.priority === 'Critical' ? 'bg-red-200' :
          task.priority === 'High' ? 'bg-orange-200' :
          task.priority === 'Medium' ? 'bg-blue-200' :
          'bg-gray-200'
        }`} />

        {/* Progress Indicator for In Progress tasks */}
        {task.status === 'In Progress' && (
          <div className="absolute bottom-0 left-0 h-1 bg-white opacity-50 rounded-b-md" style={{ width: '60%' }} />
        )}

        {/* Resize Handles */}
        <div
          ref={setResizeStartRef}
          className="absolute left-0 top-0 w-2 h-full bg-white bg-opacity-0 hover:bg-opacity-30 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
          {...resizeStartAttributes}
          {...resizeStartListeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to change start date"
        >
          <div className="w-1 h-full bg-white rounded-l-md opacity-70" />
        </div>
        
        <div
          ref={setResizeEndRef}
          className="absolute right-0 top-0 w-2 h-full bg-white bg-opacity-0 hover:bg-opacity-30 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
          {...resizeEndAttributes}
          {...resizeEndListeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to change end date"
        >
          <div className="w-1 h-full bg-white rounded-r-md opacity-70 ml-auto" />
        </div>

        {/* Move Handle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Move className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      </div>

      {/* Dependency Lines */}
      {task.dependencies?.map(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        if (!depTask) return null;
        
        const depEndDate = new Date(depTask.dueDate);
        const depDaysFromStart = differenceInDays(depEndDate, ganttStartDate);
        const depLeft = (depDaysFromStart / ganttDuration) * 100;
        const depYPosition = allTasks.findIndex(t => t.id === depId) * 60;
        const currentYPosition = yPosition * 60;
        
        // Get arrow color based on dependency task status
        const getArrowColor = (status: string) => {
          switch (status) {
            case 'Completed': return '#22c55e'; // green-500
            case 'In Progress': return '#3b82f6'; // blue-500
            case 'On Hold': return '#eab308'; // yellow-500
            default: return '#6b7280'; // gray-500
          }
        };

        const arrowColor = getArrowColor(depTask.status);
        
        return (
          <svg
            key={depId}
            className="absolute pointer-events-none"
            style={{
              left: `${depLeft - taskLeft}%`,
              top: `${Math.min(depYPosition, currentYPosition) - currentYPosition}px`,
              width: `${Math.abs(taskLeft - depLeft) + 5}%`,
              height: `${Math.abs(currentYPosition - depYPosition) + 50}px`,
              zIndex: 5,
            }}
          >
            <defs>
              <marker
                id={`arrowhead-${task.id}-${depId}`}
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
                fill={arrowColor}
              >
                <polygon points="0 0, 10 4, 0 8" />
              </marker>
            </defs>
            <path
              d={`M 0 ${depYPosition === currentYPosition ? 20 : (depYPosition < currentYPosition ? 0 : Math.abs(currentYPosition - depYPosition) + 20)} 
                  Q ${Math.abs(taskLeft - depLeft) * 0.3}% ${depYPosition === currentYPosition ? 20 : (depYPosition < currentYPosition ? 10 : Math.abs(currentYPosition - depYPosition) + 10)}
                  ${Math.abs(taskLeft - depLeft)}% ${currentYPosition === depYPosition ? 20 : (currentYPosition < depYPosition ? Math.abs(currentYPosition - depYPosition) + 20 : 20)}`}
              stroke={arrowColor}
              strokeWidth="2.5"
              fill="none"
              markerEnd={`url(#arrowhead-${task.id}-${depId})`}
              className="drop-shadow-sm"
            />
          </svg>
        );
      })}
    </div>
  );
};

const TimelineDropZone = ({ 
  children, 
  ganttStartDate, 
  ganttDuration, 
  onTaskUpdate 
}: { 
  children: React.ReactNode;
  ganttStartDate: Date;
  ganttDuration: number;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'timeline-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-colors duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-gray-50'
      }`}
      style={{ minHeight: '400px' }}
    >
      {children}
    </div>
  );
};

export const GanttChart = ({ tasks, onTasksChange, projectStartDate, projectEndDate, onEditTask }: GanttChartProps) => {
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px tolerance before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Use custom dates if set, otherwise use project dates
  const ganttStartDate = customStartDate ? customStartDate : new Date(projectStartDate);
  const ganttEndDate = customEndDate ? customEndDate : new Date(projectEndDate);
  const ganttDuration = Math.max(1, differenceInDays(ganttEndDate, ganttStartDate) + 1);

  // Filter tasks that fall within the selected timeline
  const filteredTasks = tasks.filter(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    return taskStart <= ganttEndDate && taskEnd >= ganttStartDate;
  });

  // Generate timeline markers
  const timelineMarkers = useMemo(() => {
    const markers = [];
    const totalWeeks = Math.ceil(ganttDuration / 7);
    
    for (let week = 0; week <= totalWeeks; week++) {
      const date = addDays(ganttStartDate, week * 7);
      const position = (week * 7 / ganttDuration) * 100;
      
      if (position <= 100) {
        markers.push({
          date: format(date, 'MMM dd'),
          position,
          fullDate: date
        });
      }
    }
    
    return markers;
  }, [ganttStartDate, ganttDuration]);

  const onTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    onTasksChange(updatedTasks);
  }, [tasks, onTasksChange]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    
    if (data?.task) {
      setDraggedTask(data.task);
      setDragType(data.type);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const data = active.data.current;
    
    if (!data?.task || !over) {
      setDraggedTask(null);
      setDragType(null);
      return;
    }

    const task = data.task as Task;
    const pixelsToDays = ganttDuration / 100; // Convert percentage to days
    const daysMoved = Math.round((delta.x / window.innerWidth) * 100 * pixelsToDays);

    if (data.type === 'move') {
      // Move entire task
      const currentStart = new Date(task.startDate);
      const currentEnd = new Date(task.dueDate);
      const newStart = addDays(currentStart, daysMoved);
      const newEnd = addDays(currentEnd, daysMoved);
      
      onTaskUpdate(task.id, {
        startDate: format(newStart, 'yyyy-MM-dd'),
        dueDate: format(newEnd, 'yyyy-MM-dd')
      });
    } else if (data.type === 'resize-start') {
      // Resize start date
      const currentStart = new Date(task.startDate);
      const newStart = addDays(currentStart, daysMoved);
      const currentEnd = new Date(task.dueDate);
      
      // Ensure start date doesn't go past end date
      if (newStart < currentEnd) {
        onTaskUpdate(task.id, {
          startDate: format(newStart, 'yyyy-MM-dd')
        });
      }
    } else if (data.type === 'resize-end') {
      // Resize end date
      const currentEnd = new Date(task.dueDate);
      const newEnd = addDays(currentEnd, daysMoved);
      const currentStart = new Date(task.startDate);
      
      // Ensure end date doesn't go before start date
      if (newEnd > currentStart) {
        onTaskUpdate(task.id, {
          dueDate: format(newEnd, 'yyyy-MM-dd')
        });
      }
    }

    setDraggedTask(null);
    setDragType(null);
  };

  const handleAddDependency = (taskId: string, dependencyId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, dependencies: [...(task.dependencies || []), dependencyId] }
        : task
    );
    onTasksChange(updatedTasks);
  };

  const handleRemoveDependency = (taskId: string, dependencyId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, dependencies: task.dependencies?.filter(id => id !== dependencyId) }
        : task
    );
    onTasksChange(updatedTasks);
  };

  const resetTimelineFilter = () => {
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No tasks available. Add tasks to see the Gantt chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interactive Project Gantt Chart</CardTitle>
            <p className="text-sm text-gray-600">
              Drag tasks to move or resize them. Click to edit. Hover to see resize handles.
            </p>
          </div>
          
          {/* Timeline Filter Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Timeline:</span>
              
              {/* Start Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "MMM dd") : format(ganttStartDate, "MMM dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate || ganttStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-gray-400">to</span>
              
              {/* End Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "MMM dd") : format(ganttEndDate, "MMM dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate || ganttEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Reset Button */}
              {(customStartDate || customEndDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTimelineFilter}
                  title="Reset to project timeline"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Timeline Info */}
        {filteredTasks.length !== tasks.length && (
          <div className="mt-2 text-sm text-amber-600">
            Showing {filteredTasks.length} of {tasks.length} tasks in selected timeline
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        <div className="mb-6">
          <div className="relative h-16 bg-gray-100 rounded border">
            {/* Date markers */}
            {timelineMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-400"
                style={{ left: `${marker.position}%` }}
              >
                <div className="text-xs text-gray-700 mt-1 ml-1 whitespace-nowrap font-medium">
                  {marker.date}
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-1 whitespace-nowrap">
                  {format(marker.fullDate, 'yyyy')}
                </div>
              </div>
            ))}
            
            {/* Today indicator */}
            {(() => {
              const today = new Date();
              const todayPos = ((differenceInDays(today, ganttStartDate) / ganttDuration) * 100);
              if (todayPos >= 0 && todayPos <= 100) {
                return (
                  <div
                    className="absolute top-0 h-full border-l-2 border-red-500 bg-red-500 bg-opacity-10"
                    style={{ left: `${todayPos}%` }}
                  >
                    <div className="text-xs text-red-700 mt-1 ml-1 whitespace-nowrap font-bold">
                      TODAY
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Interactive Gantt Timeline */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <TimelineDropZone
            ganttStartDate={ganttStartDate}
            ganttDuration={ganttDuration}
            onTaskUpdate={onTaskUpdate}
          >
            <div 
              className="relative border border-gray-200 rounded-lg"
              style={{ 
                height: `${Math.max(300, (filteredTasks.length * 60) + 100)}px`,
                minHeight: '300px' 
              }}
            >
              {filteredTasks.map((task, index) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  ganttStartDate={ganttStartDate}
                  ganttDuration={ganttDuration}
                  onTaskUpdate={onTaskUpdate}
                  onEditTask={onEditTask}
                  onAddDependency={handleAddDependency}
                  onRemoveDependency={handleRemoveDependency}
                  allTasks={filteredTasks}
                  yPosition={index}
                  isDragging={draggedTask?.id === task.id}
                />
              ))}
              
              {/* Drag feedback overlay */}
              {draggedTask && (
                <div className="absolute inset-0 bg-blue-50 bg-opacity-50 pointer-events-none flex items-center justify-center">
                  <div className="text-blue-600 font-medium">
                    {dragType === 'move' && 'Moving task...'}
                    {dragType === 'resize-start' && 'Adjusting start date...'}
                    {dragType === 'resize-end' && 'Adjusting end date...'}
                  </div>
                </div>
              )}
            </div>
          </TimelineDropZone>
        </DndContext>

        {/* Task Dependencies Panel */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Task Dependencies
          </h4>
          <div className="grid gap-3">
            {filteredTasks.map(task => {
              const availableDependencies = filteredTasks.filter(t => 
                t.id !== task.id && !task.dependencies?.includes(t.id)
              );
              
              return (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-sm font-mono">
                      {task.id}
                    </Badge>
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={
                      task.status === 'Completed' ? 'secondary' :
                      task.status === 'In Progress' ? 'default' : 'outline'
                    } className="text-xs">
                      {task.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {format(new Date(task.startDate), 'MMM dd')} - {format(new Date(task.dueDate), 'MMM dd')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Current Dependencies */}
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Depends on:</span>
                        <div className="flex gap-1">
                          {task.dependencies.map(depId => {
                            const depTask = filteredTasks.find(t => t.id === depId);
                            return depTask ? (
                              <Badge 
                                key={depId} 
                                variant="secondary" 
                                className="text-xs flex items-center gap-1 hover:bg-red-100 transition-colors group cursor-pointer"
                                onClick={() => handleRemoveDependency(task.id, depId)}
                                title={`Remove dependency on ${depTask.title}`}
                              >
                                {depTask.id}
                                <Trash2 className="w-3 h-3 text-red-500 group-hover:text-red-700" />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Add Dependency */}
                    {availableDependencies.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddDependency(task.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-sm border border-gray-300 rounded px-3 py-1 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                        defaultValue=""
                      >
                        <option value="">+ Add dependency</option>
                        {availableDependencies.map(dep => (
                          <option key={dep.id} value={dep.id}>
                            {dep.id}: {dep.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};