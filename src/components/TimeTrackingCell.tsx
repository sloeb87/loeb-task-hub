import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Repeat, FolderOpen, Mail, FileText, ExternalLink, MoreHorizontal } from "lucide-react";
import { Task, NamedLink } from "@/types/task";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useRecurringTaskTime } from "@/hooks/useRecurringTaskTime";
import { formatTime } from "@/utils/taskOperations";
import { LinkManagementDialog } from "@/components/ui/link-management-dialog";

interface TimeTrackingCellProps {
  task: Task;
  onTimerToggle: (task: Task, e: React.MouseEvent) => void;
  onLinkClick: (url: string, e: React.MouseEvent) => void;
  onTaskUpdate?: (task: Task) => void;
}

export const TimeTrackingCell: React.FC<TimeTrackingCellProps> = ({
  task,
  onTimerToggle,
  onLinkClick,
  onTaskUpdate
}) => {
  const { getTaskTime } = useTimeTracking();
  const { getRecurringTaskTime } = useRecurringTaskTime();
  const taskTime = getTaskTime(task.id);
  
  const [recurringTimeData, setRecurringTimeData] = useState<{totalTime: number, taskIds: string[]}>({
    totalTime: taskTime.totalTime, 
    taskIds: []
  });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [currentLinkType, setCurrentLinkType] = useState<'oneNote' | 'teams' | 'email' | 'file' | 'folder'>('oneNote');

  useEffect(() => {
    if (task.isRecurring || task.parentTaskId) {
      getRecurringTaskTime(task.id, task.parentTaskId, task.isRecurring).then(data => {
        setRecurringTimeData(data);
      });
    }
  }, [task.id, task.parentTaskId, task.isRecurring, taskTime.totalTime, getRecurringTaskTime]);

  const totalRecurringTime = (task.isRecurring || task.parentTaskId) ? recurringTimeData.totalTime : taskTime.totalTime;

  const handleLinkButtonClick = (linkType: 'oneNote' | 'teams' | 'email' | 'file' | 'folder', links: NamedLink[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (links.length === 1) {
      // If only one link, open it directly
      let url = links[0].url;
      if (linkType === 'email' && !url.startsWith('http') && !url.startsWith('mailto:')) {
        url = `mailto:${url}`;
      }
      onLinkClick(url, e);
    } else {
      // If multiple links, open dialog
      setCurrentLinkType(linkType);
      setLinkDialogOpen(true);
    }
  };

  const handleLinksChange = (linkType: 'oneNote' | 'teams' | 'email' | 'file' | 'folder', newLinks: NamedLink[]) => {
    if (!onTaskUpdate) return;
    
    const updatedTask = {
      ...task,
      links: {
        ...task.links,
        [linkType]: newLinks
      }
    };
    onTaskUpdate(updatedTask);
  };

  const handleDialogLinkClick = (url: string) => {
    onLinkClick(url, {} as React.MouseEvent);
  };

  const hasLinks = (links?: NamedLink[]) => links && links.length > 0;

  return (
    <div className="space-y-2">
      {/* Time Tracking Controls */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={taskTime.isRunning ? "destructive" : "outline"}
          onClick={(e) => onTimerToggle(task, e)}
          className="h-7 w-7 p-0"
          title={taskTime.isRunning ? "Stop Timer" : "Start Timer"}
        >
          {taskTime.isRunning ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </Button>
        {taskTime.isRunning && (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-1"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        )}
      </div>
      {totalRecurringTime > 0 && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatTime(totalRecurringTime)}</span>
          {(task.isRecurring || task.parentTaskId) && totalRecurringTime !== taskTime.totalTime && (
            <div title="Total time across all recurring instances">
              <Repeat className="w-3 h-3 ml-1 text-blue-500" />
            </div>
          )}
        </div>
      )}
      
      {/* Task Link Icons */}
      {task.links && Object.values(task.links).some(links => hasLinks(links)) && (
        <div className="flex items-center space-x-1">
          {hasLinks(task.links.folder) && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="relative p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
              onClick={(e) => handleLinkButtonClick('folder', task.links.folder!, e)}
              title={task.links.folder!.length === 1 ? task.links.folder![0].name : `${task.links.folder!.length} Folder links`}
            >
              <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              {task.links.folder!.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {task.links.folder!.length}
                </div>
              )}
            </Button>
          )}
          {hasLinks(task.links.email) && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="relative p-1 h-6 w-6 hover:bg-green-100 dark:hover:bg-green-900"
              onClick={(e) => handleLinkButtonClick('email', task.links.email!, e)}
              title={task.links.email!.length === 1 ? task.links.email![0].name : `${task.links.email!.length} Email links`}
            >
              <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
              {task.links.email!.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                  {task.links.email!.length}
                </div>
              )}
            </Button>
          )}
          {hasLinks(task.links.file) && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="relative p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
              onClick={(e) => handleLinkButtonClick('file', task.links.file!, e)}
              title={task.links.file!.length === 1 ? task.links.file![0].name : `${task.links.file!.length} File links`}
            >
              <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              {task.links.file!.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                  {task.links.file!.length}
                </div>
              )}
            </Button>
          )}
          {hasLinks(task.links.oneNote) && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="relative p-1 h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
              onClick={(e) => handleLinkButtonClick('oneNote', task.links.oneNote!, e)}
              title={task.links.oneNote!.length === 1 ? task.links.oneNote![0].name : `${task.links.oneNote!.length} OneNote links`}
            >
              <ExternalLink className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              {task.links.oneNote!.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center">
                  {task.links.oneNote!.length}
                </div>
              )}
            </Button>
          )}
          {hasLinks(task.links.teams) && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="relative p-1 h-6 w-6 hover:bg-indigo-100 dark:hover:bg-indigo-900"
              onClick={(e) => handleLinkButtonClick('teams', task.links.teams!, e)}
              title={task.links.teams!.length === 1 ? task.links.teams![0].name : `${task.links.teams!.length} Teams links`}
            >
              <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              {task.links.teams!.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                  {task.links.teams!.length}
                </div>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Link Management Dialog */}
      <LinkManagementDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        linkType={currentLinkType}
        links={task.links[currentLinkType] || []}
        onLinksChange={(newLinks) => handleLinksChange(currentLinkType, newLinks)}
        onLinkClick={handleDialogLinkClick}
      />
    </div>
  );
};