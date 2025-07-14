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
import { Calendar as CalendarIcon, RotateCcw, Trash2, Plus, Edit3, Move, GripHorizontal, ExternalLink, ZoomIn, ZoomOut, Target, Play } from 'lucide-react';

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
  onTasksChange: (tasks: Task[]) => void;
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
  isDragging = false,
  onTasksChange 
}: DraggableTaskProps) => {
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
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
        <div className="px-2 py-1 text-xs text-white font-medium h-full flex flex-col justify-center">
          <div className="truncate">{task.id}: {task.title}</div>
          {task.comments && task.comments.length > 0 && (
            <div 
              className="text-xs text-white/80 truncate cursor-pointer hover:text-white mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentInput(true);
                setCommentText(task.comments?.[0]?.text || '');
              }}
              title={`Click to edit: ${task.comments[0]?.text}`}
            >
              💬 {task.comments[0]?.text}
            </div>
          )}
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

      {/* Comment Input */}
      {showCommentInput && (
        <div 
          className="absolute top-12 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-64"
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={task.comments && task.comments.length > 0 ? "Edit comment..." : "Add a comment..."}
            className="w-full p-2 border border-gray-200 rounded text-sm resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setShowCommentInput(false);
                setCommentText('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                 if (commentText.trim()) {
                   // Replace existing comment or add new one
                   const updatedTasks = allTasks.map(t => 
                     t.id === task.id 
                       ? { ...t, comments: [{ text: commentText.trim(), timestamp: new Date().toISOString() }] }
                       : t
                   );
                   onTasksChange(updatedTasks);
                 }
                setShowCommentInput(false);
                setCommentText('');
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {task.comments && task.comments.length > 0 ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Comment Button - only show if no comment exists */}
      {(!task.comments || task.comments.length === 0) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCommentInput(!showCommentInput);
          }}
          className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs px-2 py-1 rounded hover:bg-gray-800"
          title="Add comment"
        >
          💬
        </button>
      )}
      
      {/* Dependency Text Display - Single Line */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div 
          className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 shadow-sm z-20 whitespace-nowrap"
          style={{ minWidth: 'max-content' }}
        >
          <span className="font-medium text-blue-600">Depends on: </span>
          {task.dependencies.map((depId, index) => {
            const depTask = allTasks.find(t => t.id === depId);
            return (
              <span key={depId}>
                {index > 0 && ', '}
                <span 
                  className={`inline font-medium
                    ${depTask?.status === 'Completed' ? 'text-green-700' :
                      depTask?.status === 'In Progress' ? 'text-blue-700' :
                      depTask?.status === 'On Hold' ? 'text-yellow-700' :
                      depTask ? 'text-gray-700' : 'text-red-700'
                    }
                  `}
                  title={depTask ? `${depTask.title} (${depTask.status})` : `${depId} (missing)`}
                >
                  {depId}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Dependency Arrow Component (rendered outside of task containers)
const DependencyArrow = ({ 
  fromTask, 
  toTask, 
  allTasks, 
  ganttStartDate, 
  ganttDuration 
}: { 
  fromTask: Task; 
  toTask: Task; 
  allTasks: Task[]; 
  ganttStartDate: Date; 
  ganttDuration: number; 
}) => {
  const fromIndex = allTasks.findIndex(t => t.id === fromTask.id);
  const toIndex = allTasks.findIndex(t => t.id === toTask.id);
  
  // Debug logging
  console.log('DependencyArrow:', {
    fromTask: fromTask.id,
    toTask: toTask.id,
    fromIndex,
    toIndex,
    fromTaskStartDate: fromTask.startDate,
    fromTaskDueDate: fromTask.dueDate,
    toTaskStartDate: toTask.startDate,
    toTaskDueDate: toTask.dueDate
  });
  
  const fromEndDate = new Date(fromTask.dueDate);
  const toStartDate = new Date(toTask.startDate);
  
  const fromDaysFromStart = differenceInDays(fromEndDate, ganttStartDate);
  const toDaysFromStart = differenceInDays(toStartDate, ganttStartDate);
  
  // Calculate task duration for from task to get its width
  const fromTaskDuration = Math.max(1, differenceInDays(fromEndDate, new Date(fromTask.startDate)) + 1);
  const fromTaskWidth = (fromTaskDuration / ganttDuration) * 100;
  
  const fromLeft = (fromDaysFromStart / ganttDuration) * 100;
  const toLeft = (toDaysFromStart / ganttDuration) * 100;
  
  // Fixed Y positioning calculation
  const fromY = fromIndex * 60 + 30; // Center of task (task height 40px + 20px margin = 60px per task)
  const toY = toIndex * 60 + 30; // Center of task
  
  // Ensure we have valid positions
  if (fromIndex === -1 || toIndex === -1) {
    console.warn('Invalid task index for dependency:', { fromIndex, toIndex });
    return null;
  }
  
  // Get arrow color based on dependency task status
  const getArrowColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#22c55e'; // green-500
      case 'In Progress': return '#3b82f6'; // blue-500
      case 'On Hold': return '#eab308'; // yellow-500
      default: return '#6b7280'; // gray-500
    }
  };

  const arrowColor = getArrowColor(fromTask.status);
  
  // Calculate the path - from end of fromTask to start of toTask
  const fromX = fromLeft + fromTaskWidth;
  const toX = toLeft;
  
  // Create a curved path
  const midX = (fromX + toX) / 2;
  const curveOffset = Math.abs(fromY - toY) > 60 ? 30 : 15; // Larger curve for tasks far apart
  const midY = fromY < toY ? Math.min(fromY, toY) - curveOffset : Math.max(fromY, toY) + curveOffset;
  
  console.log('Arrow positioning:', {
    fromX: `${fromX}%`,
    toX: `${toX}%`,
    fromY,
    toY,
    midX: `${midX}%`,
    midY,
    arrowColor
  });
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 15,
        overflow: 'visible'
      }}
      viewBox="0 0 100 1000"
      preserveAspectRatio="none"
    >
      {/* Simple line without arrowhead */}
      <path
        d={`M ${fromX} ${fromY} 
            Q ${midX} ${midY} 
            ${toX} ${toY}`}
        stroke={arrowColor}
        strokeWidth="2"
        fill="none"
        strokeDasharray="none"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
        }}
      />
      
      {/* Small connection circles for better visibility */}
      <circle
        cx={fromX}
        cy={fromY}
        r="2"
        fill={arrowColor}
        opacity="0.8"
      />
      <circle
        cx={toX}
        cy={toY}
        r="2"
        fill={arrowColor}
        opacity="0.8"
      />
    </svg>
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
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal, 2 = zoom in, 0.5 = zoom out
  const [scrollOffset, setScrollOffset] = useState(0); // Track horizontal scroll position
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Remove this callback as we handle comments directly in the component
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px tolerance before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Use custom dates if set, otherwise use project dates with validation
  const parseDate = (dateString: string): Date => {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      console.warn(`Invalid date string: ${dateString}, using current date as fallback`);
      return new Date();
    }
    return parsed;
  };

  const baseStartDate = customStartDate ? customStartDate : parseDate(projectStartDate);
  const baseEndDate = customEndDate ? customEndDate : parseDate(projectEndDate);
  const baseDuration = Math.max(1, differenceInDays(baseEndDate, baseStartDate) + 1);
  
  // Create an extended timeline that's wider than the visible area for scrolling
  const extendedDuration = Math.max(baseDuration * 3, 90); // At least 3x the base duration or 90 days
  const extendedStartDate = new Date(baseStartDate.getTime() - (extendedDuration * 24 * 60 * 60 * 1000) / 3);
  const extendedEndDate = new Date(extendedStartDate.getTime() + (extendedDuration * 24 * 60 * 60 * 1000));
  
  // Apply zoom level to date range
  const centerDate = new Date(baseStartDate.getTime() + (baseDuration * 24 * 60 * 60 * 1000) / 2);
  const zoomedDuration = Math.max(7, Math.round(baseDuration / zoomLevel)); // Minimum 1 week view
  const ganttStartDate = new Date(centerDate.getTime() - (zoomedDuration * 24 * 60 * 60 * 1000) / 2);
  const ganttEndDate = new Date(centerDate.getTime() + (zoomedDuration * 24 * 60 * 60 * 1000) / 2);
  const ganttDuration = Math.max(1, differenceInDays(ganttEndDate, ganttStartDate) + 1);

  // Filter tasks that fall within the selected timeline
  const filteredTasks = tasks.filter(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    return taskStart <= ganttEndDate && taskEnd >= ganttStartDate;
  });

  // Calculate visible date range based on scroll position
  const visibleDateRange = useMemo(() => {
    const totalExtendedDuration = differenceInDays(extendedEndDate, extendedStartDate);
    const visibleStartOffset = scrollOffset * (totalExtendedDuration - ganttDuration);
    const visibleStartDate = addDays(extendedStartDate, Math.floor(visibleStartOffset));
    const visibleEndDate = addDays(visibleStartDate, ganttDuration);
    
    return { visibleStartDate, visibleEndDate };
  }, [extendedStartDate, extendedEndDate, ganttDuration, scrollOffset]);

  // Generate timeline markers that respond to scroll position
  const timelineMarkers = useMemo(() => {
    const markers = [];
    const { visibleStartDate } = visibleDateRange;
    
    // Validate visibleStartDate before proceeding
    if (!visibleStartDate || isNaN(visibleStartDate.getTime())) {
      console.warn('Invalid visibleStartDate, skipping timeline markers');
      return [];
    }
    
    const totalWeeks = Math.ceil(ganttDuration / 7);
    
    for (let week = 0; week <= totalWeeks; week++) {
      const date = addDays(visibleStartDate, week * 7);
      const position = (week * 7 / ganttDuration) * 100;
      
      // Validate the calculated date before formatting
      if (position <= 100 && !isNaN(date.getTime())) {
        markers.push({
          date: format(date, 'MMM dd'),
          position,
          fullDate: date
        });
      }
    }
    
    return markers;
  }, [visibleDateRange, ganttDuration]);

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

  const handleOpenInNewWindow = () => {
    // Get the current project if there's only one project in tasks
    const projectNames = [...new Set(tasks.map(task => task.project))];
    let ganttUrl = '/gantt';
    
    if (projectNames.length === 1) {
      ganttUrl += `?project=${encodeURIComponent(projectNames[0])}`;
    }
    
    window.open(ganttUrl, '_blank', 'width=1400,height=800,scrollbars=yes,resizable=yes');
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4)); // Max zoom 4x
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.25)); // Min zoom 0.25x
  };

  const handleGoToToday = () => {
    const today = new Date();
    const tenDaysBefore = new Date(today);
    tenDaysBefore.setDate(today.getDate() - 10);
    const tenDaysAfter = new Date(today);
    tenDaysAfter.setDate(today.getDate() + 10);
    
    setCustomStartDate(tenDaysBefore);
    setCustomEndDate(tenDaysAfter);
    setZoomLevel(1); // Reset zoom to normal when going to today
  };

  const handleGoToFirstTask = () => {
    if (filteredTasks.length === 0) return;
    
    // Sort tasks by start date and get the first one
    const sortedTasks = filteredTasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const firstTask = sortedTasks[0];
    
    // Center view on first task with some padding
    const taskStartDate = new Date(firstTask.startDate);
    const tenDaysBefore = new Date(taskStartDate);
    tenDaysBefore.setDate(taskStartDate.getDate() - 10);
    const tenDaysAfter = new Date(taskStartDate);
    tenDaysAfter.setDate(taskStartDate.getDate() + 20); // Show a bit more after to see the task
    
    setCustomStartDate(tenDaysBefore);
    setCustomEndDate(tenDaysAfter);
    setZoomLevel(1); // Reset zoom to normal when going to first task
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
                    {customStartDate ? format(customStartDate, "MMM dd") : (ganttStartDate && !isNaN(ganttStartDate.getTime()) ? format(ganttStartDate, "MMM dd") : "Invalid Date")}
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
                    {customEndDate ? format(customEndDate, "MMM dd") : (ganttEndDate && !isNaN(ganttEndDate.getTime()) ? format(ganttEndDate, "MMM dd") : "Invalid Date")}
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
              
              {/* Go to Today Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToToday}
                title="Center view on today (±10 days)"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Target className="h-4 w-4" />
              </Button>
              
              {/* Go to First Task Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToFirstTask}
                title="Center view on first task (±10 days)"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                disabled={filteredTasks.length === 0}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Open in New Window Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewWindow}
              title="Open Gantt chart in new window"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border-l pl-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                title="Zoom out (show more time)"
                disabled={zoomLevel <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-500 px-2">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                title="Zoom in (show less time)"
                disabled={zoomLevel >= 4}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
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
      <CardContent className="space-y-6">
        {/* Timeline Header - Fixed at top */}
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
              const { visibleStartDate } = visibleDateRange;
              const todayPos = ((differenceInDays(today, visibleStartDate) / ganttDuration) * 100);
              if (todayPos >= 0 && todayPos <= 100) {
                return (
                  <div
                    className="absolute top-0 h-full border-l-2 border-red-500 bg-red-500 bg-opacity-10"
                    style={{ left: `${todayPos}%` }}
                  >
                    <div className="text-xs text-red-700 mt-9 ml-1 whitespace-nowrap font-bold">
                      TODAY
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Interactive Gantt Timeline - Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          className="max-h-[400px] overflow-auto border border-gray-300 rounded-lg"
          onScroll={(e) => {
            const target = e.currentTarget;
            const scrollLeft = target.scrollLeft;
            const scrollWidth = target.scrollWidth;
            const clientWidth = target.clientWidth;
            const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
            setScrollOffset(scrollPercentage);
          }}
        >{/* Both vertical and horizontal scroll */}
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
                  minHeight: '300px',
                  minWidth: '1200px' // Enable horizontal scrolling
                }}
              >
                {/* Vertical Grid Lines for Date Separation */}
                {timelineMarkers.map((marker, index) => (
                  <div
                    key={`grid-${index}`}
                    className="absolute top-0 h-full border-l border-gray-200 pointer-events-none"
                    style={{ left: `${marker.position}%` }}
                  />
                ))}
                
                {/* Today Grid Line */}
                {(() => {
                  const today = new Date();
                  const { visibleStartDate } = visibleDateRange;
                  const todayPos = ((differenceInDays(today, visibleStartDate) / ganttDuration) * 100);
                  if (todayPos >= 0 && todayPos <= 100) {
                    return (
                      <div
                        className="absolute top-0 h-full border-l-2 border-red-400 pointer-events-none opacity-50"
                        style={{ left: `${todayPos}%` }}
                      />
                    );
                  }
                  return null;
                })()}

                {filteredTasks.map((task, index) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    ganttStartDate={visibleDateRange.visibleStartDate}
                    ganttDuration={ganttDuration}
                    onTaskUpdate={onTaskUpdate}
                    onEditTask={onEditTask}
                    onAddDependency={handleAddDependency}
                    onRemoveDependency={handleRemoveDependency}
                    allTasks={filteredTasks}
                    yPosition={index}
                    isDragging={draggedTask?.id === task.id}
                    onTasksChange={onTasksChange}
                  />
                ))}
                
                {/* Dependency Arrows/Lines - REMOVED - Now using text labels instead */}
                {/* The dependency visualization is now handled by text labels next to each task */}
                
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
        </div>

        {/* Color Legend - Moved Below */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Color Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Task Status Colors */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">Task Status</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600">Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-blue-500 rounded"></div>
                  <span className="text-xs text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-xs text-gray-600">On Hold</span>
                </div>
              </div>
            </div>

            {/* Priority Colors */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">Priority (Border)</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-gray-200 border-2 border-gray-400 rounded"></div>
                  <span className="text-xs text-gray-600">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-gray-200 border-2 border-yellow-500 rounded"></div>
                  <span className="text-xs text-gray-600">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-gray-200 border-2 border-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-gray-200 border-2 border-red-500 rounded"></div>
                  <span className="text-xs text-gray-600">Critical</span>
                </div>
              </div>
            </div>

            {/* Dependency Text Labels */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">Dependency Labels</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">T1</div>
                  <span className="text-xs text-gray-600">Completed Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">T2</div>
                  <span className="text-xs text-gray-600">In Progress Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">T3</div>
                  <span className="text-xs text-gray-600">On Hold Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-medium">T4</div>
                  <span className="text-xs text-gray-600">Open Task</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">Other Elements</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-xs text-gray-600">Overdue Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-600">Today Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gray-200 rounded"></div>
                  <span className="text-xs text-gray-600">Date Grid Lines</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};