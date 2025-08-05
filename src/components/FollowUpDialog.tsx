import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";
import { Calendar, User, Edit, Save, X } from "lucide-react";

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFollowUp: (text: string) => void;
  onUpdateFollowUp?: (taskId: string, followUpId: string, text: string, timestamp?: string) => void;
  task: Task;
}

export const FollowUpDialog = ({ isOpen, onClose, onAddFollowUp, onUpdateFollowUp, task }: FollowUpDialogProps) => {
  const [followUpText, setFollowUpText] = useState('');
  const [editingFollowUp, setEditingFollowUp] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTimestamp, setEditingTimestamp] = useState('');

  // Debug state changes
  React.useEffect(() => {
    console.log('editingFollowUp state changed to:', editingFollowUp);
  }, [editingFollowUp]);

  // Reset editing state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setEditingFollowUp(null);
      setEditingText('');
      setEditingTimestamp('');
    }
  }, [isOpen]);

  // Debug logging when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔍 FollowUpDialog opened with:', { 
        hasOnUpdateFollowUp: !!onUpdateFollowUp, 
        taskId: task?.id,
        followUpCount: task?.followUps?.length || 0,
        dialogSource: onUpdateFollowUp ? 'Index.tsx (CORRECT)' : 'Unknown/Wrong Source'
      });
    }
  }, [isOpen, onUpdateFollowUp, task?.id, task?.followUps?.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpText.trim()) {
      onAddFollowUp(followUpText.trim());
      setFollowUpText('');
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    // Format for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditFollowUp = (followUp: any) => {
    console.log('Edit button clicked for follow-up:', followUp.id, followUp.text);
    setEditingFollowUp(followUp.id);
    setEditingText(followUp.text);
    setEditingTimestamp(formatDateForInput(followUp.timestamp));
    console.log('Edit state set:', { id: followUp.id, text: followUp.text });
  };

  const handleSaveEdit = async () => {
    console.log('=== SAVE FUNCTION DEBUG ===');
    console.log('Save button clicked!');
    console.log('Current state values:');
    console.log('  editingFollowUp:', editingFollowUp);
    console.log('  editingText:', editingText);
    console.log('  editingTimestamp:', editingTimestamp);
    console.log('Function availability:');
    console.log('  onUpdateFollowUp exists:', !!onUpdateFollowUp);
    console.log('  onUpdateFollowUp type:', typeof onUpdateFollowUp);
    console.log('=== END DEBUG ===');
    
    if (!editingFollowUp) {
      console.error('SAVE FAILED: No editingFollowUp - cannot save!');
      return;
    }
    
    if (!onUpdateFollowUp) {
      console.error('SAVE FAILED: No onUpdateFollowUp function!');
      return;
    }
    
    try {
      const textToSave = editingText.trim() || 'No content';
      const newTimestamp = editingTimestamp ? new Date(editingTimestamp).toISOString() : undefined;
      
      console.log('Saving changes:', { text: textToSave, timestamp: newTimestamp });
      await onUpdateFollowUp(task.id, editingFollowUp, textToSave, newTimestamp);
      console.log('Save successful!');
      
      // Exit edit mode
      setEditingFollowUp(null);
      setEditingText('');
      setEditingTimestamp('');
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingFollowUp(null);
    setEditingText('');
    setEditingTimestamp('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[95vh] max-w-none border-2 shadow-2xl backdrop-blur-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Follow-Up for Task {task.id}</span>
            <Badge variant="outline">{task.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Add and view follow-up notes for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {task.responsible}
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Existing Follow-ups */}
          {task.followUps.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Previous Follow-ups</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {task.followUps.map((followUp) => (
                  <div key={followUp.id} className="bg-blue-50 rounded-lg p-3">
                    {editingFollowUp === followUp.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex justify-end items-start mb-2">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="default" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input
                            type="datetime-local"
                            value={editingTimestamp}
                            onChange={(e) => setEditingTimestamp(e.target.value)}
                            className="text-xs"
                          />
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="text-sm"
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-blue-600">
                            {formatDate(followUp.timestamp)}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditFollowUp(followUp)}
                            className="p-1 h-7 w-7 hover:bg-blue-100 border-blue-200 hover:border-blue-300"
                            title="Edit follow-up"
                          >
                            <Edit className="w-3 h-3 text-blue-600" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700">{followUp.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Follow-up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="followUpText" className="block text-sm font-medium text-gray-700 mb-2">
                Add Follow-up
              </label>
              <Textarea
                id="followUpText"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Enter your follow-up note..."
                rows={4}
                required
                className="w-full"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!followUpText.trim()}>
                Add Follow-up
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
