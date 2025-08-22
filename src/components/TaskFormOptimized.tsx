import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Project, TaskType, TaskStatus, TaskPriority, ChecklistItem, FollowUp } from "@/types/task";
import { MessageSquarePlus, User, Calendar as CalendarLucide, Play, ChevronRight, ChevronLeft, ExternalLink, FileText, Users, Mail, File, X, Plus, Check, Trash2, GripVertical, Pencil, Repeat } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParameters } from "@/hooks/useParameters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { RecurrenceSelector } from "@/components/RecurrenceSelector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import { Checkbox } from "@/components/ui/checkbox";

// Sortable Checklist Item Component
interface SortableChecklistItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SortableChecklistItem = ({ item, onToggle, onDelete }: SortableChecklistItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      
      <Checkbox
        checked={item.completed}
        onCheckedChange={() => onToggle(item.id)}
        className="flex-shrink-0"
      />
      
      <span 
        className={cn(
          "flex-1 text-sm",
          item.completed 
            ? "line-through text-gray-500 dark:text-gray-400" 
            : "text-gray-900 dark:text-white"
        )}
      >
        {item.text}
      </span>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  renderInline?: boolean; // New prop to control inline rendering
  onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onDelete?: (taskId: string) => void;
  onDeleteAllRecurring?: (taskId: string) => void;
  onUpdateAllRecurring?: (taskId: string, updateData: {
    environment?: string;
    taskType?: string;
    priority?: string;
    responsible?: string;
    description?: string;
    details?: string;
    plannedTimeHours?: number;
    occurrenceDate?: Date;
  }) => void;
  onAddFollowUp?: (taskId: string, followUpText: string) => void;
  onUpdateFollowUp?: (taskId: string, followUpId: string, text: string, timestamp?: string) => void;
  onDeleteFollowUp?: (followUpId: string) => void;
  onFollowUpTask?: (task: Task) => void; // Add this to open the main follow-up dialog
  task?: Task | null;
  allTasks: Task[];
  allProjects: Project[];
  projectName?: string | null;
  onEditRelatedTask?: (task: Task) => void;
  onNavigateToProject?: (projectName: string) => void;
  persistedFormData?: any;
  onFormDataChange?: (formData: any) => void;
}

interface FormData {
  title: string;
  project: string;
  scope: string[]; // Changed to array for multiple scopes
  environment: string;
  taskType: string;
  status: string;
  priority: string;
  responsible: string;
  startDate: string;
  dueDate: Date;
  plannedTimeHours?: number;
  description: string;
  details: string;
  dependencies: string[];
  checklist: ChecklistItem[];
  links: {
    oneNote: string;
    teams: string;
    email: string;
    file: string;
    folder: string;
  };
  stakeholders: string[];
  // Recurrence fields
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  recurrenceInterval: number;
  recurrenceEndDate?: string;
  recurrenceDaysOfWeek: number[];
  occurrenceDate?: Date; // For showing/editing current occurrence of recurring tasks
}

const DEFAULT_FORM_DATA: FormData = {
  title: "",
  project: "",
  scope: [], // Changed to array
  environment: "",
  taskType: "",
  status: "",
  priority: "",
  responsible: "",
  startDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(),
  plannedTimeHours: undefined,
  description: "",
  details: "",
  dependencies: [],
  checklist: [],
  links: {
    oneNote: "",
    teams: "",
    email: "",
    file: "",
    folder: ""
  },
  stakeholders: [],
  // Recurrence defaults
  isRecurring: false,
  recurrenceType: 'weekly',
  recurrenceInterval: 1,
  recurrenceEndDate: undefined,
  recurrenceDaysOfWeek: [],
  occurrenceDate: undefined
};

export const TaskFormOptimized = React.memo(({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  onDeleteAllRecurring,
  onUpdateAllRecurring,
  onAddFollowUp,
  onUpdateFollowUp,
  onDeleteFollowUp,
  onFollowUpTask,
  task, 
  allTasks, 
  allProjects, 
  projectName, 
  onEditRelatedTask,
  onNavigateToProject,
  persistedFormData,
  onFormDataChange,
  renderInline = false
}: TaskFormProps) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formDataRef = useRef<FormData>(DEFAULT_FORM_DATA);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  const { parameters } = useParameters();
  const [projectScope, setProjectScope] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newFollowUpText, setNewFollowUpText] = useState('');
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [editingFollowUpText, setEditingFollowUpText] = useState('');
  const [displayedFollowUps, setDisplayedFollowUps] = useState<FollowUp[]>([]);
  const { startTimer } = useTimeTracking();

  // Dropdown options - now coming from the database
  const dropdownOptions = useMemo(() => ({
    scopes: parameters.scopes.map(scope => scope.name),
    environments: parameters.environments.map(env => env.name),
    taskTypes: parameters.taskTypes.map(type => type.name),
    statuses: parameters.statuses.map(status => status.name),
    priorities: parameters.priorities.map(priority => priority.name),
  }), [parameters]);

  const {
    environments = [],
    taskTypes = [],
    statuses = [],
    priorities = []
  } = dropdownOptions;

  // Initialize form data when task changes
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      const newFormData: FormData = {
        title: task.title || "",
        project: task.project || "",
        scope: task.scope || [],
        environment: task.environment || "",
        taskType: task.taskType || "",
        status: task.status || "",
        priority: task.priority || "",
        responsible: task.responsible || "",
        startDate: task.startDate || new Date().toISOString().split('T')[0],
        dueDate: new Date(task.dueDate),
        plannedTimeHours: task.plannedTimeHours || undefined,
        description: task.description || "",
        details: task.details || "",
        dependencies: task.dependencies || [],
        checklist: task.checklist || [],
        links: {
          oneNote: task.links?.oneNote || "",
          teams: task.links?.teams || "",
          email: task.links?.email || "",
          file: task.links?.file || "",
          folder: task.links?.folder || ""
        },
        stakeholders: task.stakeholders || [],
        // Recurrence fields
        isRecurring: task.isRecurring || false,
        recurrenceType: task.recurrenceType,
        recurrenceInterval: task.recurrenceInterval || 1,
        recurrenceEndDate: task.recurrenceEndDate,
        recurrenceDaysOfWeek: task.recurrenceDaysOfWeek || [],
        occurrenceDate: new Date(task.dueDate) // Current occurrence date for recurring tasks
      };
      
      setFormData(newFormData);
      setDate(new Date(task.dueDate));
      setProjectScope(task.scope[0] || '');
    } else {
      const newFormData = {
        ...DEFAULT_FORM_DATA,
        project: projectName || "",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date()
      };
      
      setFormData(newFormData);
      setDate(new Date());
      setProjectScope(null);
    }
  }, [isOpen, task, projectName]);

  // Sync displayed follow-ups with current task
  useEffect(() => {
    if (!isOpen || !task?.id) return;
    setDisplayedFollowUps(task.followUps || []);
  }, [isOpen, task?.id, task?.followUps]);

  // Form field update handlers
  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateLinkField = useCallback((linkType: keyof FormData['links'], value: string) => {
    setFormData(prev => ({
      ...prev,
      links: { ...prev.links, [linkType]: value }
    }));
  }, []);

  // Form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please fill in the task title.",
        variant: "destructive",
      });
      return;
    }

    if (!task && !formData.status) {
      toast({
        title: "Status required",
        description: "Please select a status before creating the task.",
        variant: "destructive",
      });
      return;
    }

    if (!task && !formData.priority) {
      toast({
        title: "Priority required",
        description: "Please select a priority before creating the task.",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      ...formData,
      dueDate: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      taskType: formData.taskType as TaskType,
      status: formData.status as TaskStatus,
      priority: formData.priority as TaskPriority,
      // Include recurrence fields
      isRecurring: formData.isRecurring,
      recurrenceType: formData.recurrenceType,
      recurrenceInterval: formData.recurrenceInterval,
      recurrenceEndDate: formData.recurrenceEndDate,
      recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
      ...(task && { 
        id: task.id, 
        creationDate: task.creationDate, 
        followUps: task.followUps,
        checklist: formData.checklist
      })
    };

    onSave(taskData);
    onClose();
  }, [formData, date, task, onSave, onClose]);

  const handleFollowUpAdd = async (text: string) => {
    if (!task || !onAddFollowUp) return;
    
    try {
      const optimistic: FollowUp = {
        id: 'temp-' + Date.now().toString(),
        text,
        timestamp: new Date().toISOString(),
        taskStatus: task.status,
      };
      setDisplayedFollowUps(prev => [...prev, optimistic]);
      await onAddFollowUp(task.id, text);
    } catch (error) {
      console.error('Failed to add follow-up:', error);
      toast({ title: 'Error', description: 'Failed to add follow-up', variant: 'destructive' });
    }
  };

  const addFollowUpInline = async () => {
    const text = newFollowUpText.trim();
    if (!text) return;
    await handleFollowUpAdd(text);
    setNewFollowUpText('');
  };

  // Checklist management
  const addChecklistItem = useCallback(() => {
    if (!newChecklistItem.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      completed: false,
      timestamp: new Date().toISOString()
    };
    
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
    setNewChecklistItem('');
  }, [newChecklistItem]);

  const toggleChecklistItem = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  }, []);

  const deleteChecklistItem = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.checklist.findIndex(item => item.id === active.id);
        const newIndex = prev.checklist.findIndex(item => item.id === over.id);

        return {
          ...prev,
          checklist: arrayMove(prev.checklist, oldIndex, newIndex)
        };
      });
    }
  }, []);

  // Return inline version if requested
  if (renderInline) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Main Form */}
            <div className="bg-gray-50 dark:bg-black/50 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-800">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter task title"
                    required
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={formData.project} onValueChange={(value) => updateField('project', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProjects.map((project) => (
                        <SelectItem key={project.name} value={project.name}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={formData.environment} onValueChange={(value) => updateField('environment', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.map((env) => (
                        <SelectItem key={env} value={env}>
                          {env}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select value={formData.taskType} onValueChange={(value) => updateField('taskType', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={formData.priority} onValueChange={(value) => updateField('priority', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <div className="space-y-2">
                    <Input
                      id="dueDate"
                      type="date"
                      value={date ? format(date, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDate(new Date(e.target.value))}
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <RecurrenceSelector
                      isRecurring={formData.isRecurring}
                      recurrenceType={formData.recurrenceType}
                      recurrenceInterval={formData.recurrenceInterval}
                      recurrenceEndDate={formData.recurrenceEndDate}
                      recurrenceDaysOfWeek={formData.recurrenceDaysOfWeek}
                      taskId={task?.id}  // Pass the task ID for the generate button
                      onRecurrenceChange={(recurrence) => {
                        setFormData(prev => ({
                          ...prev,
                          isRecurring: recurrence.isRecurring,
                          recurrenceType: recurrence.recurrenceType,
                          recurrenceInterval: recurrence.recurrenceInterval || 1,
                          recurrenceEndDate: recurrence.recurrenceEndDate,
                          recurrenceDaysOfWeek: recurrence.recurrenceDaysOfWeek || []
                        }));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="responsible">Responsible Person</Label>
                  <Input
                    id="responsible"
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => updateField('responsible', e.target.value)}
                    placeholder="Enter responsible person"
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Current Occurrence Section for Recurring Tasks */}
              {(formData.isRecurring || task?.isRecurring || task?.parentTaskId) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Repeat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-blue-800 dark:text-blue-200 font-medium">
                      Current Occurrence
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="occurrenceDate" className="text-sm text-blue-700 dark:text-blue-300">
                        This Occurrence Date
                      </Label>
                      <Input
                        id="occurrenceDate"
                        type="date"
                        value={formData.occurrenceDate ? format(formData.occurrenceDate, 'yyyy-MM-dd') : format(date || new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => updateField('occurrenceDate', new Date(e.target.value))}
                        className="dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        This will be applied to all recurring instances when using "Update All Recurring"
                      </p>
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {task?.parentTaskId ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Recurring Instance
                          </span>
                        ) : task?.isRecurring ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Parent Recurring Task
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Will Create Recurring Series
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="plannedTimeHours">Planned Time (hours)</Label>
                <Input
                  id="plannedTimeHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.plannedTimeHours || ''}
                  onChange={(e) => updateField('plannedTimeHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Enter planned time in hours"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => updateField('details', e.target.value)}
                  placeholder="Enter detailed information, requirements, or notes"
                  rows={4}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Links Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="oneNote" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        OneNote
                      </Label>
                      {formData.links.oneNote && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(formData.links.oneNote, '_blank')}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id="oneNote"
                      type="url"
                      value={formData.links.oneNote}
                      onChange={(e) => updateLinkField('oneNote', e.target.value)}
                      placeholder="OneNote link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="teams" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Teams
                      </Label>
                      {formData.links.teams && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(formData.links.teams, '_blank')}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id="teams"
                      type="url"
                      value={formData.links.teams}
                      onChange={(e) => updateLinkField('teams', e.target.value)}
                      placeholder="Teams link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      {formData.links.email && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`mailto:${formData.links.email}`, '_blank')}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.links.email}
                      onChange={(e) => updateLinkField('email', e.target.value)}
                      placeholder="Email address"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="file" className="flex items-center gap-2">
                        <File className="w-4 h-4" />
                        File
                      </Label>
                      {formData.links.file && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(formData.links.file, '_blank')}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id="file"
                      type="url"
                      value={formData.links.file}
                      onChange={(e) => updateLinkField('file', e.target.value)}
                      placeholder="File link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Follow-ups */}
            <div className="bg-gray-50 dark:bg-black/50 rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Follow-ups</h3>
                {task && onFollowUpTask && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => onFollowUpTask(task)}
                  >
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Add Follow-up
                  </Button>
                )}
              </div>

              {/* Add Follow-up inline (only for existing tasks) */}
              {task && (
                <div className="space-y-2">
                  <Textarea
                    value={newFollowUpText}
                    onChange={(e) => setNewFollowUpText(e.target.value)}
                    placeholder="Add a follow-up note..."
                    rows={2}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addFollowUpInline}
                    disabled={!newFollowUpText.trim()}
                    className="w-full"
                  >
                    Add Follow-up
                  </Button>
                </div>
              )}

              {/* Follow-ups List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {displayedFollowUps.length > 0 ? (
                  displayedFollowUps.map((followUp) => (
                    <div key={followUp.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {followUp.text}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(followUp.timestamp).toLocaleString()} • Status: {followUp.taskStatus}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No follow-ups yet</p>
                    <p className="text-xs">Add notes to track progress and updates</p>
                  </div>
                )}
              </div>

              {/* Checklist Section */}
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Checklist</h3>
                
                {/* Add Checklist Item */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add checklist item..."
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={addChecklistItem}
                      disabled={!newChecklistItem.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Checklist Items */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.checklist.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {formData.checklist.length > 0 ? (
                        formData.checklist.map((item) => (
                          <SortableChecklistItem
                            key={item.id}
                            item={item}
                            onToggle={toggleChecklistItem}
                            onDelete={deleteChecklistItem}
                          />
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                          <Check className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No checklist items yet</p>
                          <p className="text-xs">Add items to track task progress</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {task && onDelete && (
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this task?')) {
                      onDelete(task.id);
                    }
                  }}
                >
                  Delete Task
                </Button>
                {(task.isRecurring || task.parentTaskId) && onDeleteAllRecurring && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete ALL recurring instances of this task? This cannot be undone.')) {
                        onDeleteAllRecurring(task.id);
                      }
                    }}
                    className="bg-red-700 hover:bg-red-800"
                  >
                    Delete All Recurring
                  </Button>
                )}
                {(task.isRecurring || task.parentTaskId) && onUpdateAllRecurring && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (window.confirm('Update all recurring instances with current Environment, Task Type, Priority, Responsible Person, Description, Details, Planned Time, and Occurrence Date?')) {
                        onUpdateAllRecurring(task.id, {
                          environment: formData.environment,
                          taskType: formData.taskType,
                          priority: formData.priority,
                          responsible: formData.responsible,
                          description: formData.description,
                          details: formData.details,
                          plannedTimeHours: formData.plannedTimeHours,
                          occurrenceDate: formData.occurrenceDate
                        });
                      }
                    }}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    Update All Recurring
                  </Button>
                )}
              </div>
            )}
            <div className="flex space-x-2 ml-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!task && (!formData.status || !formData.priority)}>
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Return dialog version for modal usage
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {task ? `Edit Task: ${task.title}` : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Modify the task details below' : 'Fill in the details to create a new task'}
          </DialogDescription>
        </DialogHeader>
        <div className="text-center py-8 text-gray-500">
          Modal version simplified - use tab view for full editing
        </div>
      </DialogContent>
    </Dialog>
  );
});

TaskFormOptimized.displayName = 'TaskFormOptimized';