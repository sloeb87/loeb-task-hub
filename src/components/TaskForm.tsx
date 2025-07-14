import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskStatus, TaskPriority, TaskType } from "@/types/task";
import { X, Plus, Clock, FolderOpen, ExternalLink, Edit, Calendar, MessageSquare } from "lucide-react";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void;
  task?: Task | null;
  allTasks?: Task[];
  projectName?: string;
  onEditRelatedTask?: (task: Task) => void;
}

export const TaskForm = ({ isOpen, onClose, onSave, task, allTasks = [], projectName, onEditRelatedTask }: TaskFormProps) => {
  console.log('TaskForm render - isOpen:', isOpen, 'task:', task?.title);
  const [formData, setFormData] = useState({
    scope: task?.scope || '',
    project: task?.project || projectName || '',
    environment: task?.environment || 'Production',
    taskType: task?.taskType || 'Development' as TaskType,
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Open' as TaskStatus,
    priority: task?.priority || 'Medium' as TaskPriority,
    responsible: task?.responsible || '',
    startDate: task?.startDate || new Date().toISOString().split('T')[0],
    dueDate: task?.dueDate || '',
    completionDate: task?.completionDate || '',
    details: task?.details || '',
    links: {
      oneNote: task?.links?.oneNote || '',
      teams: task?.links?.teams || '',
      email: task?.links?.email || '',
      file: task?.links?.file || '',
      folder: task?.links?.folder || '',
    },
    stakeholders: task?.stakeholders || []
  });

  // Get related tasks from the same project
  const relatedTasks = allTasks.filter(t => 
    t.project === formData.project && t.id !== task?.id
  );

  const [newStakeholder, setNewStakeholder] = useState('');
  const [newFollowUp, setNewFollowUp] = useState('');
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLinkChange = (linkType: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [linkType]: value
      }
    }));
  };

  const addStakeholder = () => {
    if (newStakeholder.trim()) {
      setFormData(prev => ({
        ...prev,
        stakeholders: [...prev.stakeholders, newStakeholder.trim()]
      }));
      setNewStakeholder('');
    }
  };

  const removeStakeholder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index)
    }));
  };

  const addFollowUp = () => {
    if (newFollowUp.trim() && task) {
      const updatedTask = {
        ...task,
        followUps: [
          ...task.followUps,
          {
            id: `${task.id}-F${task.followUps.length + 1}`,
            text: newFollowUp.trim(),
            timestamp: new Date().toISOString(),
            author: 'Current User'
          }
        ]
      };
      onSave(updatedTask);
      setNewFollowUp('');
      setShowFollowUpInput(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSave({
        ...task,
        ...formData
      });
    } else {
      onSave(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('Dialog onOpenChange called with:', open);
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          console.log('Dialog auto focus');
          // Don't prevent default, let it focus properly
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {task ? `Edit Task ${task.id}` : 'Create New Task'}
            </DialogTitle>
            {task && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(task.creationDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                value={formData.scope}
                onChange={(e) => handleInputChange('scope', e.target.value)}
                placeholder="Project scope..."
                required
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) => handleInputChange('project', e.target.value)}
                placeholder="Project name..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="environment">Environment</Label>
              <select
                id="environment"
                value={formData.environment}
                onChange={(e) => handleInputChange('environment', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>
            <div>
              <Label htmlFor="taskType">Task Type</Label>
              <select
                id="taskType"
                value={formData.taskType}
                onChange={(e) => handleInputChange('taskType', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Documentation">Documentation</option>
                <option value="Review">Review</option>
                <option value="Meeting">Meeting</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>

          {/* Title and Description */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Task title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed task description..."
              rows={3}
              required
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <Label htmlFor="responsible">Responsible</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
                placeholder="Assignee name..."
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
            {formData.status === 'Completed' && (
              <div>
                <Label htmlFor="completionDate">Completion Date</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => handleInputChange('completionDate', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="Additional context and details..."
              rows={3}
            />
          </div>

          {/* Follow-ups Section */}
          {task && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Follow-ups
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFollowUpInput(!showFollowUpInput)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Follow-up
                </Button>
              </div>

              {/* Existing Follow-ups */}
              {task.followUps.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {task.followUps.map((followUp) => (
                    <div key={followUp.id} className="bg-muted/30 rounded-lg p-3 border">
                      <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                        <span className="font-medium text-sm">
                          {new Date(followUp.timestamp).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="text-sm">{followUp.author}</span>
                      </div>
                      <p className="text-foreground text-sm leading-relaxed">{followUp.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Follow-up Input */}
              {showFollowUpInput && (
                <div className="space-y-2">
                  <Textarea
                    value={newFollowUp}
                    onChange={(e) => setNewFollowUp(e.target.value)}
                    placeholder="Enter your follow-up note..."
                    rows={3}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={addFollowUp}
                      disabled={!newFollowUp.trim()}
                    >
                      Add Follow-up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowFollowUpInput(false);
                        setNewFollowUp('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {task.followUps.length === 0 && !showFollowUpInput && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No follow-ups yet. Click "Add Follow-up" to get started.
                </p>
              )}
            </div>
          )}

          {/* Links */}
          <div className="space-y-3">
            <Label>Links</Label>
            <div className="grid grid-cols-1 gap-2">
              <Input
                placeholder="OneNote link..."
                value={formData.links.oneNote}
                onChange={(e) => handleLinkChange('oneNote', e.target.value)}
              />
              <Input
                placeholder="Teams link..."
                value={formData.links.teams}
                onChange={(e) => handleLinkChange('teams', e.target.value)}
              />
              <Input
                placeholder="Email link..."
                value={formData.links.email}
                onChange={(e) => handleLinkChange('email', e.target.value)}
              />
              <Input
                placeholder="File link..."
                value={formData.links.file}
                onChange={(e) => handleLinkChange('file', e.target.value)}
              />
              <Input
                placeholder="Folder link..."
                value={formData.links.folder}
                onChange={(e) => handleLinkChange('folder', e.target.value)}
              />
            </div>
          </div>

          {/* Stakeholders */}
          <div>
            <Label>Stakeholders</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newStakeholder}
                onChange={(e) => setNewStakeholder(e.target.value)}
                placeholder="Add stakeholder..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStakeholder())}
              />
              <Button type="button" onClick={addStakeholder} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.stakeholders.map((stakeholder, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                  {stakeholder}
                  <button
                    type="button"
                    onClick={() => removeStakeholder(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Related Tasks */}
          {relatedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Related Tasks in {formData.project}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {relatedTasks.map(relatedTask => (
                    <div 
                      key={relatedTask.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border text-sm hover:bg-gray-100 transition-colors cursor-pointer group"
                      onClick={() => onEditRelatedTask?.(relatedTask)}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <Badge variant="outline" className="text-xs">
                          {relatedTask.id}
                        </Badge>
                        <span className="font-medium group-hover:text-blue-600">{relatedTask.title}</span>
                        <Badge variant={
                          relatedTask.status === 'Completed' ? 'secondary' :
                          relatedTask.status === 'In Progress' ? 'default' : 'outline'
                        } className="text-xs">
                          {relatedTask.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{relatedTask.dueDate}</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRelatedTask?.(relatedTask);
                          }}
                          title="Edit Related Task"
                        >
                          <Edit className="w-3 h-3 text-blue-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
