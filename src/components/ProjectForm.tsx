
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Project, Task } from "@/types/task";
import { GanttChart } from "./GanttChart";
import { useParameters } from "@/hooks/useParameters";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project | Omit<Project, 'id'>) => void;
  onDelete?: (projectId: string) => void;
  project?: Project | null;
  allTasks?: Task[];
  onUpdateTask?: (task: Task) => void;
}

export const ProjectForm = ({ isOpen, onClose, onSave, onDelete, project, allTasks = [], onUpdateTask }: ProjectFormProps) => {
  const { parameters } = useParameters();
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    owner: project?.owner || '',
    cost_center: project?.cost_center || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    status: project?.status || 'Active' as Project['status'],
    team: project?.team || [] as string[],
    tasks: project?.tasks || [] as string[],
    scope: project?.scope || '',
    links: {
      oneNote: project?.links?.oneNote || '',
      teams: project?.links?.teams || '',
      email: project?.links?.email || '',
      file: project?.links?.file || '',
      folder: project?.links?.folder || '',
    }
  });

  const [newTeamMember, setNewTeamMember] = useState('');
  const availableScopes = parameters.scopes.map(scope => scope.name);
  
  // Get project tasks
  const projectTasks = allTasks.filter(task => 
    project?.name && task.project === project.name
  );

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

  const addTeamMember = () => {
    if (newTeamMember.trim() && !formData.team.includes(newTeamMember.trim())) {
      setFormData(prev => ({
        ...prev,
        team: [...prev.team, newTeamMember.trim()]
      }));
      setNewTeamMember('');
    }
  };

  const removeTeamMember = (member: string) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter(m => m !== member)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (project) {
      onSave({
        ...project,
        ...formData
      });
    } else {
      onSave(formData);
    }
  };

  const handleDelete = () => {
    if (project && onDelete && window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      onDelete(project.id);
      onClose();
    }
  };

  const handleTasksChange = (updatedTasks: Task[]) => {
    if (onUpdateTask) {
      updatedTasks.forEach(task => {
        const originalTask = allTasks.find(t => t.id === task.id);
        if (originalTask && JSON.stringify(originalTask) !== JSON.stringify(task)) {
          onUpdateTask(task);
        }
      });
    }
  };

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        owner: project.owner,
        cost_center: project.cost_center || '',
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        team: project.team,
        tasks: project.tasks,
        scope: project.scope || '',
        links: {
          oneNote: project.links?.oneNote || '',
          teams: project.links?.teams || '',
          email: project.links?.email || '',
          file: project.links?.file || '',
          folder: project.links?.folder || '',
        }
      });
    }
  }, [project]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            {project ? 'Update project details, team members, and manage task dependencies.' : 'Create a new project with team members and timeline.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="dark:bg-gray-800 dark:border-gray-700">
            <TabsTrigger value="details" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Project Details</TabsTrigger>
            {project && projectTasks.length > 0 && (
              <TabsTrigger value="gantt" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Gantt & Dependencies</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name..."
                  required
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="owner" className="text-gray-700 dark:text-gray-300">Project Owner</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="Project owner name..."
                  required
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scope" className="text-gray-700 dark:text-gray-300">Scope</Label>
                <Select value={formData.scope} onValueChange={(value) => handleInputChange('scope', value)}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select project scope" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                    {availableScopes.map((scope) => (
                      <SelectItem key={scope} value={scope} className="dark:text-white dark:focus:bg-gray-700">{scope}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost_center" className="text-gray-700 dark:text-gray-300">Cost Center</Label>
                <Input
                  id="cost_center"
                  value={formData.cost_center}
                  onChange={(e) => handleInputChange('cost_center', e.target.value)}
                  placeholder="Enter cost center..."
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Project description..."
                rows={3}
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">Timeline</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-300">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-gray-700 dark:text-gray-300">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                    <SelectItem value="Active" className="dark:text-white dark:focus:bg-gray-700">Active</SelectItem>
                    <SelectItem value="On Hold" className="dark:text-white dark:focus:bg-gray-700">On Hold</SelectItem>
                    <SelectItem value="Completed" className="dark:text-white dark:focus:bg-gray-700">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">Team Members</h4>
            
            <div className="flex gap-2">
              <Input
                value={newTeamMember}
                onChange={(e) => setNewTeamMember(e.target.value)}
                placeholder="Add team member..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <Button type="button" onClick={addTeamMember} size="sm">
                Add
              </Button>
            </div>

            {formData.team.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.team.map((member, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {member}
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member)}
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Project Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">Project Links</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="oneNote" className="text-gray-700 dark:text-gray-300">OneNote</Label>
                <Input
                  id="oneNote"
                  value={formData.links.oneNote}
                  onChange={(e) => handleLinkChange('oneNote', e.target.value)}
                  placeholder="OneNote link..."
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="teams" className="text-gray-700 dark:text-gray-300">Teams</Label>
                <Input
                  id="teams"
                  value={formData.links.teams}
                  onChange={(e) => handleLinkChange('teams', e.target.value)}
                  placeholder="Teams link..."
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  value={formData.links.email}
                  onChange={(e) => handleLinkChange('email', e.target.value)}
                  placeholder="project@example.com"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="file" className="text-gray-700 dark:text-gray-300">File</Label>
                <Input
                  id="file"
                  value={formData.links.file}
                  onChange={(e) => handleLinkChange('file', e.target.value)}
                  placeholder="File link..."
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="folder" className="text-gray-700 dark:text-gray-300">Folder</Label>
              <Input
                id="folder"
                value={formData.links.folder}
                onChange={(e) => handleLinkChange('folder', e.target.value)}
                placeholder="Folder/SharePoint link..."
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

              {/* Form Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                {project && onDelete && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete Project
                  </Button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {project ? 'Update Project' : 'Create Project'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          {project && projectTasks.length > 0 && (
            <TabsContent value="gantt">
              <GanttChart
                tasks={projectTasks}
                onTasksChange={handleTasksChange}
                projectStartDate={formData.startDate}
                projectEndDate={formData.endDate}
                onEditTask={onUpdateTask}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
