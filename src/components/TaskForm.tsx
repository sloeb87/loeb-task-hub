import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
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
import { Task } from "@/types/task";
import { CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  task?: Task | null;
  allTasks: Task[];
  projectName?: string | null;
  onEditRelatedTask?: (task: Task) => void;
}

export const TaskForm = ({ isOpen, onClose, onSave, task, allTasks, projectName, onEditRelatedTask }: TaskFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    project: projectName || "",
    scope: "",
    environment: "",
    type: "",
    status: "",
    priority: "",
    dueDate: new Date(),
    description: "",
    relatedTasks: [] as string[],
  });
  const [date, setDate] = useState<Date | undefined>(formData.dueDate);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [availableEnvironments, setAvailableEnvironments] = useState<string[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);
  const [projectScope, setProjectScope] = useState<string | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Load parameters from localStorage
    const storedParameters = localStorage.getItem('parameters');
    if (storedParameters) {
      const params = JSON.parse(storedParameters);
      setAvailableEnvironments(params.environments || []);
      setAvailableTaskTypes(params.taskTypes || []);
      setAvailableStatuses(params.statuses || []);
      setAvailablePriorities(params.priorities || []);
    }

    // Load projects from localStorage
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      setAvailableProjects(projects.map((project: { name: any; }) => project.name) || []);
    }

    // Set initial form data if task exists
    if (task) {
      setFormData({
        title: task.title,
        project: task.project,
        scope: task.scope,
        environment: task.environment,
        type: task.type,
        status: task.status,
        priority: task.priority,
        dueDate: new Date(task.dueDate),
        description: task.description,
        relatedTasks: task.relatedTasks || [],
      });
      setDate(new Date(task.dueDate));
    } else {
      // Reset form data when creating a new task
      setFormData({
        title: "",
        project: projectName || "",
        scope: "",
        environment: "",
        type: "",
        status: "",
        priority: "",
        dueDate: new Date(),
        description: "",
        relatedTasks: [],
      });
      setDate(undefined);
    }
  }, [task, projectName]);

  useEffect(() => {
    // Set project scope if projectName is available
    if (projectName) {
      const storedProjects = localStorage.getItem('projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const project = projects.find((p: { name: string; }) => p.name === projectName);
        setProjectScope(project ? project.scope : null);
      }
    } else {
      setProjectScope(null);
    }
  }, [projectName]);

  useEffect(() => {
    // Load related tasks based on task IDs
    if (formData.relatedTasks && formData.relatedTasks.length > 0) {
      const loadedTasks = allTasks.filter(t => formData.relatedTasks.includes(t.id));
      setRelatedTasks(loadedTasks);
    } else {
      setRelatedTasks([]);
    }
  }, [formData.relatedTasks, allTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title) {
      toast({
        title: "Required Field Missing",
        description: "Please fill in the task title.",
        variant: "destructive",
      });
      return;
    }

    // Prepare task data for saving
    const taskData = {
      ...formData,
      dueDate: date ? date.toISOString() : new Date().toISOString(),
    };

    // Save the task and close the form
    onSave(taskData);
    onClose();
  };

  const handleRelatedTaskClick = (relatedTask: Task) => {
    if (onEditRelatedTask) {
      onEditRelatedTask(relatedTask);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'Create New Task'}
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
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Task title"
                      required
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="project" className="text-gray-700 dark:text-gray-300">Project</Label>
                    <Select 
                      value={formData.project} 
                      onValueChange={(value) => setFormData({...formData, project: value})}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {availableProjects.map((project) => (
                          <SelectItem 
                            key={project} 
                            value={project}
                            className="dark:text-white dark:focus:bg-gray-700"
                          >
                            {project}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scope" className="text-gray-700 dark:text-gray-300">Scope</Label>
                    <Input
                      id="scope"
                      value={projectScope || formData.scope}
                      readOnly={!!projectScope}
                      onChange={(e) => !projectScope && setFormData({...formData, scope: e.target.value})}
                      placeholder={projectScope ? "Auto-filled from project" : "Task scope"}
                      className={`dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                        projectScope 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed' 
                          : ''
                      }`}
                    />
                    {projectScope && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Scope automatically set from project
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="environment" className="text-gray-700 dark:text-gray-300">Environment</Label>
                    <Select 
                      value={formData.environment} 
                      onValueChange={(value) => setFormData({...formData, environment: value})}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {availableEnvironments.map((env) => (
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
                    <Label htmlFor="type" className="text-gray-700 dark:text-gray-300">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {availableTaskTypes.map((type) => (
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
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {availableStatuses.map((status) => (
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
                      onValueChange={(value) => setFormData({...formData, priority: value})}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                        {availablePriorities.map((priority) => (
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
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Task Description Section */}
              <div className="space-y-4">
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Task description"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Related Tasks Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Related Tasks
                </h3>
                {relatedTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {relatedTasks.map(relatedTask => (
                      <Button
                        key={relatedTask.id}
                        variant="outline"
                        className="justify-start text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => handleRelatedTaskClick(relatedTask)}
                      >
                        {relatedTask.title}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No related tasks selected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
};
