import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { FollowUpDialog } from "@/components/FollowUpDialog";
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
import { CalendarIcon, MessageSquarePlus, User, Calendar as CalendarLucide } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParameters } from "@/hooks/useParameters";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  onDelete?: (taskId: string) => void;
  task?: Task | null;
  allTasks: Task[];
  allProjects: Project[];
  projectName?: string | null;
  onEditRelatedTask?: (task: Task) => void;
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
  task, 
  allTasks, 
  allProjects, 
  projectName, 
  onEditRelatedTask 
}: TaskFormProps) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [projectScope, setProjectScope] = useState<string | null>(null);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  
  // Get parameters from the useParameters hook
  const { parameters, loading: parametersLoading } = useParameters();

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

    onSave(taskData);
    onClose();
  }, [formData, date, projectScope, task, onSave, onClose]);

  const handleRelatedTaskClick = useCallback((relatedTask: Task) => {
    if (onEditRelatedTask) {
      onEditRelatedTask(relatedTask);
      onClose();
    }
  }, [onEditRelatedTask, onClose]);

  const handleFollowUpAdd = (text: string) => {
    if (!task) return;
    
    const newFollowUp = {
      id: `fu-${Date.now()}`,
      text: text,
      timestamp: new Date().toISOString(),
      author: 'Current User'
    };

    const updatedTask = {
      ...task,
      followUps: [...task.followUps, newFollowUp]
    };

    onSave(updatedTask);
    setFollowUpDialogOpen(false);
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {task ? `Edit Task: ${task.id} - ${task.title}` : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Task Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Task Details
                </h3>
                
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
                    {task ? (
                      // Read-only when editing existing task
                      <Input
                        id="project"
                        value={formData.project}
                        readOnly
                        className="dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                      />
                    ) : (
                      // Editable when creating new task
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
                    {task && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Project cannot be changed when editing task
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
                    <Popover>
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
                          onSelect={setDate}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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

              {/* Follow-ups Section (only for existing tasks) */}
              {task && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Follow-ups
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {task.followUps.length} follow-up{task.followUps.length !== 1 ? 's' : ''}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFollowUpDialogOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                        Add Follow-up
                      </Button>
                    </div>

                    {task.followUps.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {task.followUps
                          .slice(-5) // Show last 5 follow-ups in edit mode
                          .reverse()
                          .map((followUp) => (
                            <div key={followUp.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {followUp.author}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <CalendarLucide className="w-3 h-3" />
                                  {new Date(followUp.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{followUp.text}</p>
                            </div>
                          ))}
                        
                        {task.followUps.length > 5 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 italic text-center">
                            +{task.followUps.length - 5} more follow-ups...
                          </div>
                        )}
                      </div>
                    )}

                    {task.followUps.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No follow-ups yet</p>
                        <p className="text-xs">Click "Add Follow-up" to start tracking progress</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

      {/* Follow-up Dialog */}
      {task && (
        <FollowUpDialog
          isOpen={followUpDialogOpen}
          onClose={() => setFollowUpDialogOpen(false)}
          onAddFollowUp={handleFollowUpAdd}
          task={task}
        />
      )}
    </Dialog>
  );
});

TaskFormOptimized.displayName = 'TaskFormOptimized';