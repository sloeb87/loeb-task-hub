import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Project } from "@/types/task";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project | Omit<Project, 'id'>) => void;
  project?: Project | null;
}

export const ProjectForm = ({ isOpen, onClose, onSave, project }: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    owner: project?.owner || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    status: project?.status || 'Active' as Project['status'],
    team: project?.team || [] as string[],
    tasks: project?.tasks || [] as string[]
  });

  const [newTeamMember, setNewTeamMember] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update project details and team members.' : 'Create a new project with team members and timeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="owner">Project Owner</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="Project owner name..."
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Project description..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Timeline</h4>
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
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Team Members</h4>
            
            <div className="flex gap-2">
              <Input
                value={newTeamMember}
                onChange={(e) => setNewTeamMember(e.target.value)}
                placeholder="Add team member..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
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
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};