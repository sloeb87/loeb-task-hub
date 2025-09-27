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
import { Task, TaskType, TaskStatus, TaskPriority, FollowUp, ChecklistItem, NamedLink } from "@/types/task";
import { Project } from "@/types/task";
import { MessageSquarePlus, User, Calendar as CalendarLucide, Play, ChevronRight, ChevronLeft, ExternalLink, FileText, Users, Mail, File, X, Plus, Check, Trash2, GripVertical, Pencil, Repeat, Folder } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParameters } from "@/hooks/useParameters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { RecurrenceSelector } from "@/components/RecurrenceSelector";
import { MultiLinkInput } from "@/components/ui/multi-link-input";
import { NamedLinkInput } from "@/components/ui/named-link-input";
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

// Helper function to identify automatic follow-ups
const isAutomaticFollowUp = (text: string): boolean => {
  const automaticPatterns = [
    /^Task marked completed$/,
    /^Status changed from .+ to .+$/,
    /^Priority changed from .+ to .+$/,
    /^Task type changed from .+ to .+$/,
    /^Due date changed from .+ to .+$/,
    /^Task updated: Due date: .+ → .+$/
  ];
  
  return automaticPatterns.some(pattern => pattern.test(text));
};

// Sortable Link Item Component
interface SortableLinkProps {
  linkType: string;
  link: NamedLink;
  onDelete: () => void;
}

const SortableLink: React.FC<SortableLinkProps> = ({ linkType, link, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-gray-800 rounded border"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        {linkType === 'oneNote' && <FileText className="w-4 h-4" />}
        {linkType === 'teams' && <Users className="w-4 h-4" />}
        {linkType === 'email' && <Mail className="w-4 h-4" />}
        {linkType === 'file' && <File className="w-4 h-4" />}
        {linkType === 'folder' && <Folder className="w-4 h-4" />}
        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize min-w-[60px]">
          {linkType}
        </span>
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
        >
          {link.name}
        </a>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 p-1"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

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
    title?: string;
    environment?: string;
    taskType?: string;
    status?: string;
    priority?: string;
    responsible?: string;
    description?: string;
    details?: string;
    plannedTimeHours?: number;
    links?: {
      oneNote?: NamedLink[];
      teams?: NamedLink[];
      email?: NamedLink[];
      file?: NamedLink[];
      folder?: NamedLink[];
    };
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
  getRelatedRecurringTasks?: (taskId: string) => Promise<Task[]>;
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
    oneNote: NamedLink[];
    teams: NamedLink[];
    email: NamedLink[];
    file: NamedLink[];
    folder: NamedLink[];
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
    oneNote: [],
    teams: [],
    email: [],
    file: [],
    folder: []
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
  getRelatedRecurringTasks,
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
  const [relatedRecurringTasks, setRelatedRecurringTasks] = useState<Task[]>([]);
  const [newLinkType, setNewLinkType] = useState<keyof FormData['links']>('oneNote');
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const { startTimer } = useTimeTracking();

  // Dropdown options - now coming from the database
  const dropdownOptions = useMemo(() => {
    console.log('TaskForm - parameters loaded:', parameters);
    console.log('TaskForm - environments count:', parameters.environments.length);
    console.log('TaskForm - taskTypes count:', parameters.taskTypes.length);
    
    const options = {
      scopes: parameters.scopes.map(scope => scope.name),
      environments: parameters.environments.map(env => env.name),
      taskTypes: parameters.taskTypes.map(type => type.name),
      statuses: parameters.statuses.map(status => status.name),
      priorities: parameters.priorities.map(priority => priority.name),
    };
    
    console.log('TaskForm - Dropdown options created:', {
      environments: options.environments,
      taskTypes: options.taskTypes
    });
    
    return options;
  }, [parameters]);

  const {
    scopes = [],
    environments = [],
    taskTypes = [],
    statuses = [],
    priorities = []
  } = dropdownOptions;

  // Initialize form data when task changes
  useEffect(() => {
    if (!isOpen) return;
    
    // Wait for parameters to be loaded before setting form data
    if (parameters.environments.length === 0) return;

    if (task) {
      console.log('TaskForm - Loading task data:', task);
      console.log('TaskForm - task.environment:', task.environment);
      console.log('TaskForm - task.taskType:', task.taskType);
      console.log('TaskForm - Available environments:', parameters.environments.map(e => e.name));
      console.log('TaskForm - Available taskTypes:', parameters.taskTypes.map(t => t.name));
      
      // Only update form data if it's a different task or if formData is still at default
      const isNewTask = !formData.title || formData.title === DEFAULT_FORM_DATA.title || task.id !== formDataRef.current.title;
      
      if (isNewTask || formData.title !== task.title) {
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
          // Preserve existing checklist if it has content, otherwise use task data
          checklist: formData.checklist && formData.checklist.length > 0 ? formData.checklist : (task.checklist || []),
          // Preserve existing links if they have content, otherwise convert from task data
          links: formData.links && (
            formData.links.oneNote.length > 0 || 
            formData.links.teams.length > 0 || 
            formData.links.email.length > 0 || 
            formData.links.file.length > 0 || 
            formData.links.folder.length > 0
          ) ? formData.links : {
            oneNote: Array.isArray(task.links?.oneNote) ? task.links.oneNote : (task.links?.oneNote ? [{id: Math.random().toString(36).substr(2, 9), name: 'OneNote', url: task.links.oneNote}] : []),
            teams: Array.isArray(task.links?.teams) ? task.links.teams : (task.links?.teams ? [{id: Math.random().toString(36).substr(2, 9), name: 'Teams', url: task.links.teams}] : []),
            email: Array.isArray(task.links?.email) ? task.links.email : (task.links?.email ? [{id: Math.random().toString(36).substr(2, 9), name: 'Email', url: task.links.email}] : []),
            file: Array.isArray(task.links?.file) ? task.links.file : (task.links?.file ? [{id: Math.random().toString(36).substr(2, 9), name: 'File', url: task.links.file}] : []),
            folder: Array.isArray(task.links?.folder) ? task.links.folder : (task.links?.folder ? [{id: Math.random().toString(36).substr(2, 9), name: 'Folder', url: task.links.folder}] : [])
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
        
        console.log('TaskForm - Setting form data:', newFormData);
        console.log('TaskForm - newFormData.environment:', newFormData.environment);
        console.log('TaskForm - newFormData.taskType:', newFormData.taskType);
        
        setFormData(newFormData);
        setDate(new Date(task.dueDate));
        setProjectScope(task.scope[0] || '');
      }
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
  }, [isOpen, task, projectName, parameters]);

  // Restore form data from persistedFormData when available (for unsaved drafts)
  useEffect(() => {
    if (!isOpen || !persistedFormData || task) return; // Only restore for new tasks, not existing ones
    
    console.log('TaskForm - Restoring from persistedFormData:', persistedFormData);
    setFormData(prev => ({
      ...prev,
      ...persistedFormData,
      dueDate: persistedFormData.dueDate ? new Date(persistedFormData.dueDate) : prev.dueDate
    }));
    
    if (persistedFormData.dueDate) {
      setDate(new Date(persistedFormData.dueDate));
    }
  }, [isOpen, persistedFormData, task]);

  // Save form data changes for persistence
  useEffect(() => {
    if (!isOpen || !onFormDataChange) return;
    
    onFormDataChange(formData);
  }, [isOpen, formData, onFormDataChange]);

  // Sync displayed follow-ups with current task
  useEffect(() => {
    if (!isOpen || !task?.id) return;
    setDisplayedFollowUps(task.followUps || []);
  }, [isOpen, task?.id, task?.followUps]);

  // Fetch related recurring tasks when task changes
  useEffect(() => {
    const fetchRelatedTasks = async () => {
      if (!task?.id || !getRelatedRecurringTasks) {
        setRelatedRecurringTasks([]);
        return;
      }

      try {
        const related = await getRelatedRecurringTasks(task.id);
        setRelatedRecurringTasks(related);
      } catch (error) {
        console.error('Error fetching related recurring tasks:', error);
        setRelatedRecurringTasks([]);
      }
    };

    fetchRelatedTasks();
  }, [task?.id, getRelatedRecurringTasks]);

  // Form field update handlers
  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateLinkField = useCallback((linkType: keyof FormData['links'], links: NamedLink[]) => {
    setFormData(prev => ({
      ...prev,
      links: { ...prev.links, [linkType]: links }
    }));
  }, []);

  // Auto-save function for immediate updates
  const autoSave = useCallback(() => {
    if (!task || !formData.title.trim()) return; // Only auto-save for existing tasks with valid title
    
    const taskData = {
      ...formData,
      dueDate: date ? date.toISOString().split('T')[0] : task.dueDate,
      taskType: formData.taskType as TaskType,
      status: formData.status as TaskStatus,
      priority: formData.priority as TaskPriority,
      // Include recurrence fields
      isRecurring: formData.isRecurring,
      recurrenceType: formData.recurrenceType,
      recurrenceInterval: formData.recurrenceInterval,
      recurrenceEndDate: formData.recurrenceEndDate,
      recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
      id: task.id, 
      creationDate: task.creationDate, 
      followUps: task.followUps,
      checklist: formData.checklist
    };

    try {
      onSave(taskData);
    } catch (error) {
      console.error('ERROR in auto-save:', error);
    }
  }, [formData, date, task, onSave]);

  // Form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    console.log('=== Form Submit Started ===');
    e.preventDefault();
    
    console.log('DEBUG: Form data before validation:', formData);
    console.log('DEBUG: Task prop:', task);
    console.log('DEBUG: onSave prop type:', typeof onSave);
    
    if (!formData.title.trim()) {
      console.log('Title validation failed');
      toast({
        title: "Required Field Missing",
        description: "Please fill in the task title.",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating task data object...');

    // Only require environment and taskType for new tasks
    if (!task && !formData.environment) {
      toast({
        title: "Environment required",
        description: "Please select an environment before creating the task.",
        variant: "destructive",
      });
      return;
    }

    if (!task && !formData.taskType) {
      toast({
        title: "Task Type required",
        description: "Please select a task type before creating the task.",
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

    console.log('Task data created:', taskData);
    console.log('DEBUG: About to call onSave...');
    
    try {
      onSave(taskData);
      console.log('onSave called successfully');
    } catch (error) {
      console.error('ERROR in onSave call:', error);
      throw error;
    }
    
    // Show success message
    toast({
      title: task ? "Task Updated" : "Task Created",
      description: task ? `${taskData.title} has been updated successfully.` : `${taskData.title} has been created successfully.`,
    });
    
    // Don't close immediately - let parent handle success
    // onClose();
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
      
      // Auto-save the task after adding follow-up
      autoSave();
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
    
    // Auto-save the task after adding checklist item
    setTimeout(() => autoSave(), 100); // Small delay to ensure state is updated
  }, [newChecklistItem, autoSave]);

  const toggleChecklistItem = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
    
    // Auto-save the task after toggling checklist item
    setTimeout(() => autoSave(), 100); // Small delay to ensure state is updated
  }, [autoSave]);

  const deleteChecklistItem = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
    
    // Auto-save the task after deleting checklist item
    setTimeout(() => autoSave(), 100); // Small delay to ensure state is updated
  }, [autoSave]);

  const addNewLink = useCallback(() => {
    if (!newLinkType || !newLinkName.trim() || !newLinkUrl.trim()) return;
    
    const newLink = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLinkName.trim(),
      url: newLinkUrl.trim()
    };
    
    const updatedLinks = [...formData.links[newLinkType], newLink];
    updateLinkField(newLinkType, updatedLinks);
    
    // Reset form
    setNewLinkName('');
    setNewLinkUrl('');
    setNewLinkType('oneNote');
    
    // Auto-save the task after adding link
    setTimeout(() => autoSave(), 100); // Small delay to ensure state is updated
  }, [newLinkType, newLinkName, newLinkUrl, formData.links, updateLinkField, autoSave]);

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
                  {task && task.project ? (
                    // Read-only display when task is already linked to a project
                    <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md text-sm">
                      <span className="text-muted-foreground">{task.project}</span>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Scope and Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="scope">Scope</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                      {formData.scope.map((scopeItem, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {scopeItem}
                          <button
                            type="button"
                            onClick={() => {
                              const newScope = formData.scope.filter((_, i) => i !== index);
                              updateField('scope', newScope);
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {formData.scope.length === 0 && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No scopes selected</span>
                      )}
                    </div>
                    <Select onValueChange={(value) => {
                      if (!formData.scope.includes(value)) {
                        updateField('scope', [...formData.scope, value]);
                      }
                    }}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Add scope" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                        {scopes.filter(scope => !formData.scope.includes(scope)).map((scope) => (
                          <SelectItem key={scope} value={scope} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                            {scope}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="environment">Environment *</Label>
                  <Select value={formData.environment} onValueChange={(value) => updateField('environment', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                      {environments.map((env) => (
                        <SelectItem key={env} value={env} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          {env}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taskType">Task Type *</Label>
                  <Select value={formData.taskType} onValueChange={(value) => updateField('taskType', value)}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                      {taskTypes.map((type) => (
                        <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-gray-700">
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
                    <SelectContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status} className="hover:bg-gray-100 dark:hover:bg-gray-700">
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
                    <SelectContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority} className="hover:bg-gray-100 dark:hover:bg-gray-700">
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
                       taskId={task?.uuid}  // Pass the UUID for database operations
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
                      Recurring Task
                    </Label>
                  </div>
                  <div className="mb-4">
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
                  
                  {/* Next Occurrences */}
                  {(() => {
                    // Find related recurring tasks from database
                    const currentTaskId = task?.id;
                    const parentId = task?.parentTaskId ?? (task?.isRecurring ? task.id : null);
                    
                    if (!parentId || !currentTaskId) return null;
                    
                    // Filter related tasks (excluding current task) and get next 3
                    const nextOccurrences = relatedRecurringTasks
                      .filter(t => t.id !== currentTaskId && t.status === 'Open')
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .filter(t => new Date(t.dueDate) > new Date(task?.dueDate || ''))
                      .slice(0, 3);
                    
                    if (nextOccurrences.length === 0) return null;
                    
                    return (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <Label className="text-sm text-blue-700 dark:text-blue-300 mb-2 block">
                          Next Occurrences
                        </Label>
                        <div className="space-y-2">
                          {nextOccurrences.map((occurrence) => (
                            <div
                              key={occurrence.id}
                              onClick={() => onEditRelatedTask?.(occurrence)}
                              className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 rounded cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {format(new Date(occurrence.dueDate), 'EEE, MMM d, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {occurrence.id.slice(0, 8)}
                                </span>
                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
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
                
                {/* All Links Display */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    
                    if (active.id !== over?.id) {
                      // Get all links as a flat array with their types
                      const allLinks = Object.entries(formData.links).flatMap(([linkType, links]) =>
                        links.map(link => ({ ...link, linkType }))
                      );
                      
                      const oldIndex = allLinks.findIndex(link => link.id === active.id);
                      const newIndex = allLinks.findIndex(link => link.id === over?.id);
                      
                      if (oldIndex !== -1 && newIndex !== -1) {
                        const reorderedLinks = arrayMove(allLinks, oldIndex, newIndex);
                        
                        // Rebuild the links object
                        const newLinks = {
                          oneNote: [],
                          teams: [],
                          email: [],
                          file: [],
                          folder: []
                        } as any;
                        
                        reorderedLinks.forEach(link => {
                          const { linkType, ...linkData } = link;
                          newLinks[linkType].push(linkData);
                        });
                        
                        updateField('links', newLinks);
                      }
                    }
                  }}
                >
                  <SortableContext
                    items={Object.entries(formData.links).flatMap(([linkType, links]) =>
                      links.map(link => link.id)
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {Object.entries(formData.links).map(([linkType, links]) =>
                        links.map((link) => (
                          <SortableLink
                            key={link.id}
                            linkType={linkType}
                            link={link}
                            onDelete={() => {
                              const updatedLinks = formData.links[linkType as keyof typeof formData.links]
                                .filter(l => l.id !== link.id);
                              updateLinkField(linkType as keyof typeof formData.links, updatedLinks);
                              
                              // Auto-save the task after deleting link
                              setTimeout(() => autoSave(), 100); // Small delay to ensure state is updated
                            }}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add New Link */}
                <div className="flex gap-2">
                  <Select 
                    value={newLinkType} 
                    onValueChange={(value) => setNewLinkType(value as keyof FormData['links'])}
                  >
                    <SelectTrigger className="w-32 dark:bg-gray-800 dark:border-gray-600">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oneNote">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          OneNote
                        </div>
                      </SelectItem>
                      <SelectItem value="teams">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Teams
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="file">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4" />
                          File
                        </div>
                      </SelectItem>
                      <SelectItem value="folder">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          Folder
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="Link name..."
                    className="w-40 text-sm dark:bg-gray-800 dark:border-gray-600"
                  />
                  
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="URL..."
                    className="w-32 text-sm dark:bg-gray-800 dark:border-gray-600"
                  />
                  
                  <Button
                    type="button"
                    size="sm"
                    onClick={addNewLink}
                    disabled={!newLinkType || !newLinkName.trim() || !newLinkUrl.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
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
                    Edit Follow-up
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
              <div className="space-y-3">
                {displayedFollowUps.length > 0 ? (
                  displayedFollowUps.map((followUp) => (
                    <div key={followUp.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className={`text-sm whitespace-pre-wrap ${isAutomaticFollowUp(followUp.text) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
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
                    <div className="space-y-2">
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
                      if (window.confirm('Update all recurring instances with current Task Title, Environment, Task Type, Priority, Responsible Person, Description, Details, Planned Time, and Links? Status and dates will not be changed.')) {
                         onUpdateAllRecurring(task.id, {
                           title: formData.title,
                           environment: formData.environment,
                           taskType: formData.taskType,
                           priority: formData.priority,
                           responsible: formData.responsible,
                           description: formData.description,
                           details: formData.details,
                           plannedTimeHours: formData.plannedTimeHours,
                           links: formData.links
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
              <Button 
                type="submit" 
                disabled={!formData.title.trim()}
              >
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
            {task ? `Edit Task: ${task.id}_${task.title}` : 'Create New Task'}
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