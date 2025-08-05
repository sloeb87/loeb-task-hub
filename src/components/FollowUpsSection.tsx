
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface FollowUp {
  id: string;
  text: string;
  timestamp: string;
  taskId: string;
  taskTitle: string;
  project: string;
}

interface FollowUpsSectionProps {
  followUps: FollowUp[];
  selectedProject: string;
}

export const FollowUpsSection = ({ followUps, selectedProject }: FollowUpsSectionProps) => {
  // Group follow-ups by task
  const groupedFollowUps = followUps.reduce((acc, followUp) => {
    const taskKey = followUp.taskId;
    if (!acc[taskKey]) {
      acc[taskKey] = {
        taskTitle: followUp.taskTitle,
        project: followUp.project,
        followUps: []
      };
    }
    acc[taskKey].followUps.push(followUp);
    return acc;
  }, {} as Record<string, { taskTitle: string; project: string; followUps: FollowUp[] }>);

  // Sort tasks by most recent follow-up
  const sortedTasks = Object.entries(groupedFollowUps).sort(([, a], [, b]) => {
    const latestA = Math.max(...a.followUps.map(f => new Date(f.timestamp).getTime()));
    const latestB = Math.max(...b.followUps.map(f => new Date(f.timestamp).getTime()));
    return latestB - latestA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Follow-ups by Task</span>
          {selectedProject !== "all" && (
            <Badge variant="outline" className="ml-2">
              {selectedProject}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No follow-ups found for the selected filter.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedTasks.map(([taskId, taskData]) => (
              <div key={taskId} className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-lg">{taskData.taskTitle}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                      <span>({taskId})</span>
                      <span>•</span>
                      <span>{taskData.project}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {taskData.followUps.length} follow-up{taskData.followUps.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  {taskData.followUps
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((followUp) => (
                      <div key={followUp.id} className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                          <span className="font-medium text-sm">
                            {new Date(followUp.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">{followUp.text}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
