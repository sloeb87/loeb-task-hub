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
}

interface SortableTaskProps {
  task: Task;
  style?: React.CSSProperties;
  onAddDependency: (taskId: string, dependencyId: string) => void;
  onRemoveDependency: (taskId: string, dependencyId: string) => void;
  allTasks: Task[];
  ganttDuration: number;
  ganttStartDate: Date;
}

const SortableTask = ({ 
  task, 
  style, 
  onAddDependency, 
  onRemoveDependency, 
  allTasks, 
  ganttDuration, 
  ganttStartDate 
}: SortableTaskProps) => {
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

  const availableDependencies = allTasks.filter(t => 
    t.id !== task.id && !task.dependencies?.includes(t.id)
  );

  return (
    <div ref={setNodeRef} style={taskStyle} className="space-y-2 border-b pb-4">
      {/* Task Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-[200px]">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-sm">{task.title}</div>
            <div className="text-xs text-gray-500">{task.responsible}</div>
          </div>
          <Badge variant="outline" className="text-xs">
            {task.status}
          </Badge>
        </div>
        
        {/* Dependencies */}
        <div className="flex items-center space-x-2">
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Dependencies:</span>
              {task.dependencies.map(depId => {
                const depTask = allTasks.find(t => t.id === depId);
                return depTask ? (
                  <Badge 
                    key={depId} 
                    variant="secondary" 
                    className="text-xs flex items-center gap-1"
                  >
                    {depTask.title.substring(0, 10)}...
                    <button
                      onClick={() => onRemoveDependency(task.id, depId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
          
          {availableDependencies.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onAddDependency(task.id, e.target.value);
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

      {/* Gantt Bar */}
      <div className="relative h-6 bg-gray-100 rounded">
        <div
          className={`absolute h-full rounded ${getStatusColor(task.status)} opacity-80`}
          style={{
            left: `${taskLeft}%`,
            width: `${Math.max(2, taskWidth)}%`,
          }}
        >
          <div className="px-2 py-1 text-xs text-white truncate">
            {task.title}
          </div>
        </div>
        
        {/* Dependency lines */}
        {task.dependencies?.map(depId => {
          const depTask = allTasks.find(t => t.id === depId);
          if (!depTask) return null;
          
          const depEndDate = new Date(depTask.dueDate);
          const depDaysFromStart = Math.ceil((depEndDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24));
          const depLeft = (depDaysFromStart / ganttDuration) * 100;
          
          return (
            <div
              key={depId}
              className="absolute top-0 h-full border-l-2 border-red-400 border-dashed opacity-60"
              style={{ left: `${depLeft}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const GanttChart = ({ tasks, onTasksChange, projectStartDate, projectEndDate }: GanttChartProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gantt Chart</CardTitle>
        <p className="text-sm text-gray-600">
          Drag and drop tasks to reorder them. Use the dropdown to add dependencies between tasks.
        </p>
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        <div className="mb-4">
          <div className="relative h-8 bg-gray-50 rounded border">
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

        {/* Tasks */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={taskOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {orderedTasks.map(task => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onAddDependency={handleAddDependency}
                  onRemoveDependency={handleRemoveDependency}
                  allTasks={tasks}
                  ganttDuration={ganttDuration}
                  ganttStartDate={ganttStartDate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};