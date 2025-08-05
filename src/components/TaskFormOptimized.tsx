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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Project, TaskType, TaskStatus, TaskPriority } from "@/types/task";
import { CalendarIcon, MessageSquarePlus, User, Calendar as CalendarLucide, Play, ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParameters } from "@/hooks/useParameters";
import { useTimeTracking } from "@/hooks/useTimeTracking";

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
}

interface FormData {
  title: string;
  project: string;
  scope: string;
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
  scope: "",
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
  onNavigateToProject
}: TaskFormProps) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { parameters } = useParameters();
  const [projectScope, setProjectScope] = useState<string | null>(null);
  const [isTaskDetailsCollapsed, setIsTaskDetailsCollapsed] = useState(false);
  const { startTimer } = useTimeTracking();

  // Debug: Check what functions are received
  console.log('TaskFormOptimized received props:', {
    hasOnAddFollowUp: !!onAddFollowUp,
    hasOnUpdateFollowUp: !!onUpdateFollowUp,
    onUpdateFollowUpType: typeof onUpdateFollowUp,
    taskId: task?.id
  });

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
      // Editing existing task
      const newFormData: FormData = {
        title: task.title || "",
        project: task.project || "",
        scope: task.scope || "",
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
      setProjectScope(task.scope || null);
    } else {
      // Creating new task
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

  // Auto-set project scope for new tasks
  useEffect(() => {
    if (!task && formData.project && allProjects.length > 0) {
      const project = allProjects.find(p => p.name === formData.project);
      if (project && project.scope !== formData.scope) {
        setProjectScope(project.scope);
        setFormData(prev => ({ ...prev, scope: project.scope }));
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

    const taskData = {
      ...formData,
      dueDate: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      scope: projectScope || formData.scope,
      taskType: formData.taskType as TaskType,
      status: formData.status as TaskStatus,
      priority: formData.priority as TaskPriority,
      ...(task && { 
        id: task.id, 
        creationDate: task.creationDate, 
        followUps: task.followUps 
      })
    };

    console.log('TaskForm - Form data being saved:', {
      originalTaskType: task?.taskType,
      formDataTaskType: formData.taskType,
      finalTaskType: taskData.taskType
    });

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] flex flex-col bg-background/95 backdrop-blur-sm border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-3">
            <span>{task ? `Edit Task: ${task.id} - ${task.title}` : 'Create New Task'}</span>
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
          </DialogTitle>
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
                    <Input
                      id="scope"
                      value={projectScope || formData.scope}
                      readOnly={!!projectScope || !!task}
                      onChange={(e) => !projectScope && !task && updateField('scope', e.target.value)}
                      placeholder={projectScope ? "Auto-filled from project" : task ? "Scope from original project" : "Task scope"}
                      className={`dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                        (projectScope || task)
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed' 
                          : ''
                      }`}
                    />
                    {(projectScope || task) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task ? "Scope cannot be changed when editing task" : "Scope automatically set from project"}
                      </p>
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
                     <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                       <PopoverTrigger asChild>
                         <Button
                           variant={"outline"}
                           className={cn(
                             "w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                             !date && "text-muted-foreground"
                           )}
                         >
                           {date ? format(date, "PPP") : <span>Pick a date</span>}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-600" align="start">
                         <Calendar
                           mode="single"
                           selected={date}
                           onSelect={(selectedDate) => {
                             if (selectedDate) {
                               setDate(selectedDate);
                               updateField('dueDate', selectedDate);
                               setIsCalendarOpen(false);
                             }
                           }}
                           disabled={(date) => date < new Date("1900-01-01")}
                           initialFocus
                           className="p-3 pointer-events-auto"
                         />
                       </PopoverContent>
                     </Popover>
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
                    <Label className="text-gray-700 dark:text-gray-300">OneNote</Label>
                    <Input
                      value={formData.links.oneNote}
                      onChange={(e) => updateLinkField('oneNote', e.target.value)}
                      placeholder="OneNote link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Teams</Label>
                    <Input
                      value={formData.links.teams}
                      onChange={(e) => updateLinkField('teams', e.target.value)}
                      placeholder="Teams link"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                    <Input
                      value={formData.links.email}
                      onChange={(e) => updateLinkField('email', e.target.value)}
                      placeholder="Email"
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">File</Label>
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

                <div className="flex-1">
                  {task.followUps.length > 0 ? (
                    <div className="space-y-3">
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