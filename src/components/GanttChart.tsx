import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  projectStartDate: string;
  projectEndDate: string;
  onEditTask?: (task: Task) => void;
}

interface SortableTaskProps {
  task: Task;
  style?: React.CSSProperties;
  onAddDependency: (taskId: string, dependencyId: string) => void;
  onRemoveDependency: (taskId: string, dependencyId: string) => void;
  allTasks: Task[];
  ganttDuration: number;
  ganttStartDate: Date;
  onEditTask?: (task: Task) => void;
}

const SortableTask = ({ 
  task, 
  style, 
  onAddDependency, 
  onRemoveDependency, 
  allTasks, 
  ganttDuration, 
  ganttStartDate,
  onEditTask,
  yPosition = 0
}: SortableTaskProps & { yPosition?: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const taskStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  };

  // Calculate task position and width
  const taskStartDate = new Date(task.startDate);
  const taskEndDate = new Date(task.dueDate);
  const taskDuration = Math.max(1, Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysFromStart = Math.max(0, Math.ceil((taskStartDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const taskLeft = (daysFromStart / ganttDuration) * 100;
  const taskWidth = (taskDuration / ganttDuration) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'On Hold': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'border-red-500 border-2';
      case 'High': return 'border-orange-500 border-2';
      case 'Medium': return 'border-blue-500 border';
      case 'Low': return 'border-gray-300 border';
      default: return 'border-gray-300 border';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={taskStyle}
      className="absolute"
      title={`${task.title} (${task.responsible}) - ${task.status}`}
    >
      {/* Task Box on Timeline */}
      <div
        className={`absolute rounded ${getStatusColor(task.status)} ${getPriorityBorder(task.priority)} opacity-90 cursor-pointer hover:opacity-100 transition-all shadow-md hover:shadow-lg`}
        style={{
          left: `${taskLeft}%`,
          width: `${Math.max(3, taskWidth)}%`,
          height: '40px',
          top: `${yPosition * 50}px`,
          zIndex: 10,
        }}
        onClick={(e) => {
          console.log('Gantt task box clicked:', task.title);
          e.stopPropagation();
          onEditTask?.(task);
        }}
        {...attributes}
        {...listeners}
      >
        <div className="px-2 py-1 text-xs text-white font-medium truncate h-full flex items-center">
          <span className="truncate">{task.id}: {task.title}</span>
        </div>
        
        {/* Priority indicator */}
        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
          task.priority === 'Critical' ? 'bg-red-600' :
          task.priority === 'High' ? 'bg-orange-500' :
          task.priority === 'Medium' ? 'bg-blue-500' :
          'bg-gray-400'
        }`} />
      </div>

      {/* Dependency Lines */}
      {task.dependencies?.map(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        if (!depTask) return null;
        
        const depEndDate = new Date(depTask.dueDate);
        const depDaysFromStart = Math.ceil((depEndDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const depLeft = (depDaysFromStart / ganttDuration) * 100;
        const depYPosition = allTasks.findIndex(t => t.id === depId) * 50;
        const currentYPosition = yPosition * 50;
        
        return (
          <svg
            key={depId}
            className="absolute pointer-events-none"
            style={{
              left: `${depLeft}%`,
              top: `${Math.min(depYPosition, currentYPosition)}px`,
              width: `${Math.abs(taskLeft - depLeft)}%`,
              height: `${Math.abs(currentYPosition - depYPosition) + 40}px`,
              zIndex: 5,
            }}
          >
            <defs>
              <marker
                id={`arrowhead-${task.id}-${depId}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#ef4444"
                />
              </marker>
            </defs>
            <path
              d={`M 0 ${depYPosition === currentYPosition ? 20 : (depYPosition < currentYPosition ? 0 : Math.abs(currentYPosition - depYPosition))} 
                  L ${Math.abs(taskLeft - depLeft)}% ${currentYPosition === depYPosition ? 20 : (currentYPosition < depYPosition ? Math.abs(currentYPosition - depYPosition) : 0)}`}
              stroke="#ef4444"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              markerEnd={`url(#arrowhead-${task.id}-${depId})`}
            />
          </svg>
        );
      })}
    </div>
  );
};

export const GanttChart = ({ tasks, onTasksChange, projectStartDate, projectEndDate, onEditTask }: GanttChartProps) => {
  const [taskOrder, setTaskOrder] = useState(tasks.map(t => t.id));
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate timeline
  const ganttStartDate = new Date(projectStartDate);
  const ganttEndDate = new Date(projectEndDate);
  const ganttDuration = Math.max(1, Math.ceil((ganttEndDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Generate timeline markers
  const timelineMarkers = useMemo(() => {
    const markers = [];
    const totalWeeks = Math.ceil(ganttDuration / 7);
    
    for (let week = 0; week <= totalWeeks; week++) {
      const date = new Date(ganttStartDate);
      date.setDate(date.getDate() + (week * 7));
      const position = (week * 7 / ganttDuration) * 100;
      
      if (position <= 100) {
        markers.push({
          date: date.toLocaleDateString(),
          position
        });
      }
    }
    
    return markers;
  }, [ganttStartDate, ganttDuration]);

  const orderedTasks = taskOrder.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = taskOrder.indexOf(active.id as string);
      const newIndex = taskOrder.indexOf(over.id as string);
      
      const newTaskOrder = arrayMove(taskOrder, oldIndex, newIndex);
      setTaskOrder(newTaskOrder);
    }
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

  // Calculate task positions to avoid overlaps
  const getTaskYPosition = (taskIndex: number, startDate: string, endDate: string) => {
    let yPos = 0;
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    
    for (let i = 0; i < taskIndex; i++) {
      const otherTask = orderedTasks[i];
      const otherStart = new Date(otherTask.startDate);
      const otherEnd = new Date(otherTask.dueDate);
      
      // Check for overlap
      if (currentStart < otherEnd && currentEnd > otherStart) {
        yPos = Math.max(yPos, i + 1);
      }
    }
    return yPos;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gantt Chart</CardTitle>
        <p className="text-sm text-gray-600">
          Single timeline view with dependencies. Drag tasks to reorder, click to edit.
        </p>
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        <div className="mb-6">
          <div className="relative h-12 bg-gray-50 rounded border">
            {timelineMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-300"
                style={{ left: `${marker.position}%` }}
              >
                <div className="text-xs text-gray-600 mt-1 ml-1 whitespace-nowrap">
                  {marker.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Single Timeline with All Tasks */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={taskOrder}
            strategy={verticalListSortingStrategy}
          >
            <div 
              className="relative bg-gray-50 rounded border p-4"
              style={{ 
                height: `${Math.max(200, (orderedTasks.length * 50) + 100)}px`,
                minHeight: '200px' 
              }}
            >
              {orderedTasks.map((task, index) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onAddDependency={handleAddDependency}
                  onRemoveDependency={handleRemoveDependency}
                  allTasks={tasks}
                  ganttDuration={ganttDuration}
                  ganttStartDate={ganttStartDate}
                  onEditTask={onEditTask}
                  yPosition={getTaskYPosition(index, task.startDate, task.dueDate)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Task List Panel */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Task Dependencies</h4>
          <div className="space-y-2">
            {orderedTasks.map(task => {
              const availableDependencies = tasks.filter(t => 
                t.id !== task.id && !task.dependencies?.includes(t.id)
              );
              
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {task.id}
                    </Badge>
                    <span className="font-medium text-sm">{task.title}</span>
                    <Badge variant={
                      task.status === 'Completed' ? 'secondary' :
                      task.status === 'In Progress' ? 'default' : 'outline'
                    } className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Current Dependencies */}
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Depends on:</span>
                        {task.dependencies.map(depId => {
                          const depTask = tasks.find(t => t.id === depId);
                          return depTask ? (
                            <Badge 
                              key={depId} 
                              variant="secondary" 
                              className="text-xs flex items-center gap-1"
                            >
                              {depTask.title.substring(0, 10)}...
                              <button
                                onClick={() => handleRemoveDependency(task.id, depId)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
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
                        className="text-xs border rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="">Add dependency...</option>
                        {availableDependencies.map(dep => (
                          <option key={dep.id} value={dep.id}>
                            {dep.title}
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