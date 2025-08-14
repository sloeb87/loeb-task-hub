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
import { MessageSquarePlus, User, Calendar as CalendarLucide, Play, ChevronRight, ChevronLeft, ExternalLink, FileText, Users, Mail, File, X, Plus, Check, Trash2, GripVertical, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParameters } from "@/hooks/useParameters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
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

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  renderInline?: boolean; // New prop to control inline rendering
  onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onDelete?: (taskId: string) => void;
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
  stakeholders: []
};

export const TaskFormOptimized = React.memo(({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
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
        stakeholders: task.stakeholders || []
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

  // Return inline version if requested
  if (renderInline) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Main Form */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter task title"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={formData.project} onValueChange={(value) => updateField('project', value)}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={formData.environment} onValueChange={(value) => updateField('environment', value)}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsible">Responsible Person</Label>
                  <Input
                    id="responsible"
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => updateField('responsible', e.target.value)}
                    placeholder="Enter responsible person"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDate(new Date(e.target.value))}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Right Side - Follow-ups */}
            <div className="space-y-4">
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
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayedFollowUps.length > 0 ? (
                  displayedFollowUps.map((followUp) => (
                    <div key={followUp.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
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
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {task && onDelete && (
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