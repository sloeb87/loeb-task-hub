import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Task, Project, TaskType, TaskStatus, TaskPriority, ChecklistItem } from "@/types/task";
import { MessageSquarePlus, User, Calendar as CalendarLucide, Play, ChevronRight, ChevronLeft, ExternalLink, FileText, Users, Mail, File, X, Plus, Check, Trash2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParameters } from "@/hooks/useParameters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
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
  onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onDelete?: (taskId: string) => void;
  onAddFollowUp?: (taskId: string, followUpText: string) => void;
  onUpdateFollowUp?: (taskId: string, followUpId: string, text: string, timestamp?: string) => void;
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
  onFollowUpTask,
  task, 
  allTasks, 
  allProjects, 
  projectName, 
  onEditRelatedTask,
  onNavigateToProject,
  persistedFormData,
  onFormDataChange
}: TaskFormProps) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { parameters } = useParameters();
  const [projectScope, setProjectScope] = useState<string | null>(null);
  const [isTaskDetailsCollapsed, setIsTaskDetailsCollapsed] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
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
    console.log('TaskForm useEffect triggered - isOpen:', isOpen, 'task id:', task?.id, 'task environment:', task?.environment);
    if (!isOpen) return;

    if (task) {
      // Editing existing task
      console.log('TaskForm - Initializing form data with task:', task.id, 'environment:', task.environment);
      const newFormData: FormData = {
        title: task.title || "",
        project: task.project || "",
        scope: task.scope || [], // Changed to array
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
      setProjectScope(task.scope[0] || ''); // Use first scope as string for project scope state
    } else {
      // Creating new task - check for persisted form data first
      if (persistedFormData && !task) {
        console.log('TASK_FORM - Restoring persisted form data:', persistedFormData);
        setFormData(persistedFormData);
        setDate(persistedFormData.dueDate ? new Date(persistedFormData.dueDate) : new Date());
        setProjectScope(persistedFormData.scope || null);
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
    }
  }, [isOpen, task, projectName, persistedFormData]);

  // Persist form data for new tasks
  useEffect(() => {
    if (!task && onFormDataChange && isOpen) {
      const timeoutId = setTimeout(() => {
        onFormDataChange(formData);
      }, 500); // Debounce to avoid too frequent saves
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, task, onFormDataChange, isOpen]);

  // Auto-set project scope for new tasks
  useEffect(() => {
    if (!task && formData.project && allProjects.length > 0) {
      const project = allProjects.find(p => p.name === formData.project);
      if (project && JSON.stringify(project.scope) !== JSON.stringify([formData.scope])) {
        setProjectScope(project.scope[0] || ''); // Use first scope as default
        setFormData(prev => ({ ...prev, scope: project.scope || [] }));
      }
    }
  }, [formData.project, allProjects, task]);

  // Memoized related tasks
  const relatedTasks = useMemo(() => {
    if (!formData.dependencies.length) return [];
    return allTasks.filter(t => formData.dependencies.includes(t.id));
  }, [formData.dependencies, allTasks]);

  // Form field update handlers
  const updateField = useCallback((field: keyof FormData, value: any) => {
    if (field === 'taskType') {
      console.log('TaskForm - updateField called for taskType:', { field, value });
    }
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      return newFormData;
    });
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

    console.log('TaskForm handleSubmit called with formData.scope:', formData.scope);
    console.log('TaskForm projectScope:', projectScope);

    if (!formData.title.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please fill in the task title.",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      ...formData,
      dueDate: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      scope: formData.scope || [], // Always use formData.scope (user's selections)
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

    console.log('TaskForm saving taskData.scope:', taskData.scope);
    onSave(taskData);
    onClose();
  }, [formData, date, projectScope, task, onSave, onClose]);

  const handleRelatedTaskClick = useCallback((relatedTask: Task) => {
    if (onEditRelatedTask) {
      onEditRelatedTask(relatedTask);
      onClose();
    }
  }, [onEditRelatedTask, onClose]);

  const handleFollowUpAdd = async (text: string) => {
    if (!task || !onAddFollowUp) return;
    
    try {
      // Use the proper Supabase addFollowUp function and wait for completion
      await onAddFollowUp(task.id, text);
      // The parent component will receive the updated task through the database refresh
    } catch (error) {
      console.error('Error adding follow-up:', error);
    }
  };

  const handleFollowUpClick = (followUpId?: string) => {
    console.log('Follow-up clicked - using parent follow-up system');
    if (task && onFollowUpTask) {
      onFollowUpTask(task); // Use the parent's follow-up dialog system
    } else {
      console.error('onFollowUpTask not available');
    }
  };

  const handleStartTimer = () => {
    if (task) {
      startTimer(task.id, task.title, task.project, task.responsible);
      toast({
        title: "Timer Started",
        description: `Time tracking started for task: ${task.title}`,
      });
    }
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const handleNavigateToProject = () => {
    if (onNavigateToProject && formData.project) {
      onNavigateToProject(formData.project);
      onClose();
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
        timestamp: new Date().toISOString()
      };
      updateField('checklist', [...formData.checklist, newItem]);
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    updateField('checklist', formData.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeChecklistItem = (itemId: string) => {
    updateField('checklist', formData.checklist.filter(item => item.id !== itemId));
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for checklist reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      updateField('checklist', (items: ChecklistItem[]) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Add debugging for form state
  console.log('TaskForm render - isOpen:', isOpen, 'task:', task?.id || 'new task');

  // Sortable checklist item component
  const SortableChecklistItem = ({ item }: { item: ChecklistItem }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleChecklistItem(item.id)}
          className={cn(
            "h-6 w-6 p-0 border-2 rounded",
            item.completed 
              ? "bg-green-500 border-green-500 text-white hover:bg-green-600" 
              : "border-gray-300 dark:border-gray-500 hover:border-green-400"
          )}
        >
          {item.completed && <Check className="w-4 h-4" />}
        </Button>
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
          onClick={() => removeChecklistItem(item.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('TaskForm Dialog onOpenChange called:', { 
        open, 
        documentHasFocus: document.hasFocus(),
        documentVisibilityState: document.visibilityState,
        activeElement: document.activeElement?.tagName 
      });
      
      // Only allow closing if it's an explicit close action, not a focus loss
      if (!open && document.hasFocus()) {
        console.log('TaskForm Dialog - Allowing close (document has focus)');
        onClose();
      } else if (!open && !document.hasFocus()) {
        console.log('TaskForm Dialog - Preventing close (document lost focus)');
      }
    }}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col bg-background/95 backdrop-blur-sm border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-3">
            <span>{task ? `Edit Task: ${task.id} - ${task.title}` : 'Create New Task'}</span>
            {(projectName || formData.project) && (
              <span className="text-green-600 dark:text-green-400 font-semibold">
                {projectName || formData.project}
              </span>
            )}
          </DialogTitle>
          {(task || projectName) && formData.project && onNavigateToProject && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNavigateToProject}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
              title={`Go to ${formData.project} project details`}
            >
              <ExternalLink className="w-4 h-4" />
              Go to Project
            </Button>
          )}
          <DialogDescription>
            {task ? 'Edit task details, dependencies, and track progress.' : 'Create a new task with all necessary details and requirements.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="flex gap-6 min-h-full">
              
              {/* Left Side - Main Form */}
              {!isTaskDetailsCollapsed && (
                <div className="flex-[0.6]">
            <div className="space-y-6">
              {/* Task Details Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Task Details
                  </h3>
                  {task && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTaskDetailsCollapsed(!isTaskDetailsCollapsed)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                      title="Hide Task Details"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="Task title"
                      required
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="project" className="text-gray-700 dark:text-gray-300">Project</Label>
                    {task || projectName ? (
                      // Read-only when editing existing task or creating task from project context
                      <Input
                        id="project"
                        value={formData.project}
                        readOnly
                        className="dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                      />
                    ) : (
                      // Editable when creating new task from general context
                      <Select 
                        value={formData.project} 
                        onValueChange={(value) => updateField('project', value)}
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                          {allProjects.map((project) => (
                            <SelectItem 
                              key={project.id} 
                              value={project.name}
                              className="dark:text-white dark:focus:bg-gray-700"
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {(task || projectName) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task ? "Project cannot be changed when editing task" : "Project auto-selected from current project"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="scope" className="text-gray-700 dark:text-gray-300">Scope</Label>
                     <Select 
                       value="" 
                       onValueChange={(value) => {
                         if (value && !formData.scope.includes(value)) {
                           updateField('scope', [...formData.scope, value]);
                         }
                       }}
                     >
                       <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                         <SelectValue placeholder="Add scope" />
                       </SelectTrigger>
                       <SelectContent>
                         {parameters.scopes.map((scope) => (
                           <SelectItem 
                             key={scope.id} 
                             value={scope.name}
                             disabled={formData.scope.includes(scope.name)}
                           >
                             <div className="flex items-center">
                               <div 
                                 className="w-3 h-3 rounded-full mr-2" 
                                 style={{ backgroundColor: scope.color }}
                               ></div>
                               {scope.name}
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     
                     {/* Display selected scopes */}
                     {formData.scope.length > 0 && (
                       <div className="flex flex-wrap gap-2 mt-2">
                         {formData.scope.map((scopeName, index) => {
                           const scopeParam = parameters.scopes.find(s => s.name === scopeName);
                           return (
                             <Badge 
                               key={index}
                               variant="secondary"
                               className="flex items-center gap-1"
                               style={scopeParam ? { backgroundColor: scopeParam.color + '20', color: scopeParam.color, borderColor: scopeParam.color } : {}}
                             >
                               {scopeParam && (
                                 <div 
                                   className="w-2 h-2 rounded-full" 
                                   style={{ backgroundColor: scopeParam.color }}
                                 />
                               )}
                               {scopeName}
                               <button
                                 type="button"
                                 onClick={() => {
                                   const newScopes = formData.scope.filter((_, i) => i !== index);
                                   updateField('scope', newScopes);
                                 }}
                                 className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             </Badge>
                           );
                         })}
                       </div>
                     )}
                     
                     {/* Show project scopes as suggestions */}
                      {projectScope && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Project scopes: </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {projectScope.split(',').map(scope => scope.trim()).join(', ')}
                          </span>
                        </div>
                      )}
                   </div>

                  <div>
                    <Label htmlFor="environment" className="text-gray-700 dark:text-gray-300">Environment</Label>
                    <Select 
                      value={formData.environment} 
                      onValueChange={(value) => updateField('environment', value)}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {environments.map((env: string) => (
                          <SelectItem 
                            key={env} 
                            value={env}
                            className="dark:text-white dark:focus:bg-gray-700"
                          >
                            {env}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskType" className="text-gray-700 dark:text-gray-300">Type</Label>
                    <Select 
                      value={formData.taskType} 
                      onValueChange={(value) => updateField('taskType', value)}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {taskTypes.map((type: string) => (
                          <SelectItem 
                            key={type} 
                            value={type}
                            className="dark:text-white dark:focus:bg-gray-700"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => updateField('status', value)}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {statuses.map((status: string) => (
                          <SelectItem 
                            key={status} 
                            value={status}
                            className="dark:text-white dark:focus:bg-gray-700"
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-gray-700 dark:text-gray-300">Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => updateField('priority', value)}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {priorities.map((priority: string) => (
                          <SelectItem 
                            key={priority} 
                            value={priority}
                            className="dark:text-white dark:focus:bg-gray-700"
                          >
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="responsible" className="text-gray-700 dark:text-gray-300">Responsible</Label>
                    <Input
                      id="responsible"
                      value={formData.responsible}
                      onChange={(e) => updateField('responsible', e.target.value)}
                      placeholder="Person responsible"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-300">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                   <div>
                     <Label htmlFor="dueDate" className="text-gray-700 dark:text-gray-300">Due Date</Label>
                     <Input
                       id="dueDate"
                       type="date"
                       value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                       onChange={(e) => {
                         if (e.target.value) {
                           const selectedDate = new Date(e.target.value);
                           setDate(selectedDate);
                           setFormData(prev => ({ ...prev, dueDate: selectedDate }));
                         }
                       }}
                       required
                       className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                     />
                   </div>

                  {task?.completionDate && (
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Completion Date</Label>
                      <Input
                        value={new Date(task.completionDate).toLocaleDateString()}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Description & Details
                </h3>
                
                <div>
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Task description"
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="details" className="text-gray-700 dark:text-gray-300">Details</Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) => updateField('details', e.target.value)}
                    placeholder="Additional details"
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>


              {/* Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Links & Resources
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-gray-700 dark:text-gray-300">OneNote</Label>
                      {formData.links.oneNote && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          onClick={() => window.open(formData.links.oneNote, '_blank')}
                          title="Open OneNote link"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.links.oneNote}
                      onChange={(e) => updateLinkField('oneNote', e.target.value)}
                      placeholder="OneNote link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-gray-700 dark:text-gray-300">Teams</Label>
                      {formData.links.teams && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
                          onClick={() => window.open(formData.links.teams, '_blank')}
                          title="Open Teams link"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.links.teams}
                      onChange={(e) => updateLinkField('teams', e.target.value)}
                      placeholder="Teams link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                      {formData.links.email && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                          onClick={() => window.open(`mailto:${formData.links.email}`, '_blank')}
                          title="Open email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.links.email}
                      onChange={(e) => updateLinkField('email', e.target.value)}
                      placeholder="Email"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-gray-700 dark:text-gray-300">File</Label>
                      {formData.links.file && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
                          onClick={() => window.open(formData.links.file, '_blank')}
                          title="Open file link"
                        >
                          <File className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.links.file}
                      onChange={(e) => updateLinkField('file', e.target.value)}
                      placeholder="File link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Related Tasks Section */}
              {relatedTasks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Related Tasks
                  </h3>
                  <div className="space-y-2">
                    {relatedTasks.map((relatedTask) => (
                      <div 
                        key={relatedTask.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleRelatedTaskClick(relatedTask)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{relatedTask.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{relatedTask.id} - {relatedTask.status}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
                </div>
              )}

              {/* Collapsed state - Show button to expand Task Details */}
              {isTaskDetailsCollapsed && task && (
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTaskDetailsCollapsed(false)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                    title="Show Task Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Show Task Details
                  </Button>
                </div>
              )}

              {/* Right Side - Follow-ups Panel (only for existing tasks) */}
              {task && (
                <div className={cn(
                  "border-l border-gray-200 dark:border-gray-700 pl-6 flex flex-col flex-shrink-0 transition-all duration-300",
                  isTaskDetailsCollapsed ? "w-full border-l-0 pl-0 max-w-none" : "flex-[0.4]"
                )}>
                  <div className="mb-4">
                  <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Follow-ups
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleStartTimer}
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                      title="Start time tracking"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {task.followUps.length} follow-up{task.followUps.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUpClick()}
                      className="flex items-center gap-2"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      Add Follow-up
                    </Button>
                  </div>
                </div>

                 {/* Follow-ups content - directly under Follow-ups title */}
                <div className="mb-6 flex-1 flex flex-col">
                  {task.followUps.length > 0 ? (
                    <div className={cn(
                      "space-y-3 flex-1 overflow-y-auto",
                      task.followUps.length > 4 ? "max-h-[calc(50vh-8rem)]" : "max-h-none"
                    )}>
                      {task.followUps
                        .slice() // Create a copy to avoid mutating original
                        .reverse() // Show most recent first
                        .map((followUp) => (
                           <div 
                             key={followUp.id} 
                             className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer"
                             onClick={() => handleFollowUpClick(followUp.id)}
                             title="Click to edit this follow-up"
                           >
                             <div className="flex items-center gap-3">
                               <span className="text-sm font-semibold text-primary dark:text-primary bg-muted dark:bg-muted px-2 py-1 rounded-md">
                                 {new Date(followUp.timestamp).toLocaleDateString('en-US', { 
                                   month: '2-digit', 
                                   day: '2-digit', 
                                   year: '2-digit' 
                                 })}
                               </span>
                               <span className="text-sm text-foreground dark:text-foreground leading-relaxed">: {followUp.text}</span>
                             </div>
                           </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No follow-ups yet</p>
                      <p className="text-xs">Click "Add Follow-up" to start tracking progress</p>
                    </div>
                  )}
                </div>

                {/* Checklist Section */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Checklist
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.checklist.filter(item => item.completed).length}/{formData.checklist.length} completed
                    </span>
                  </div>

                  {/* Add new checklist item */}
                  <div className="flex gap-2">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add a new step/point to confirm..."
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
                      variant="outline"
                      size="sm"
                      onClick={addChecklistItem}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>

                  {/* Checklist items */}
                  <div className={cn(
                    "space-y-2 overflow-y-auto flex-1",
                    formData.checklist.length > 6 ? "max-h-[calc(50vh-8rem)]" : "max-h-none"
                  )}>
                    {formData.checklist.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext 
                          items={formData.checklist.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {formData.checklist.map((item) => (
                            <SortableChecklistItem key={item.id} item={item} />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No checklist items yet</p>
                        <p className="text-xs">Add steps or points that need to be confirmed when done</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {task && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
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
              <Button type="submit">
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

    </Dialog>
  );
});

TaskFormOptimized.displayName = 'TaskFormOptimized';