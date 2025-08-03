import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";
import { Calendar, User } from "lucide-react";

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFollowUp: (text: string) => void;
  task: Task;
}

export const FollowUpDialog = ({ isOpen, onClose, onAddFollowUp, task }: FollowUpDialogProps) => {
  const [followUpText, setFollowUpText] = useState('');

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Follow-Up for Task {task.id}</span>
            <Badge variant="outline">{task.status}</Badge>
          </DialogTitle>
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
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {task.followUps.map((followUp) => (
                  <div key={followUp.id} className="bg-blue-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        {followUp.author}
                      </span>
                      <span className="text-xs text-blue-600">
                        {formatDate(followUp.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{followUp.text}</p>
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
