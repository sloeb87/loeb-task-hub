import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, FolderKanban, ListTodo, Moon, Sun, Settings, LogOut, Menu, X, Clock, MessageSquare, RotateCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { Task } from "@/types/task";
interface AppHeaderProps {
  activeView: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit";
  onViewChange: (view: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit") => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenParameters: () => void;
  onRefresh: () => void;
  onBack?: () => void; // Optional back function for project detail view
  selectedProjectName?: string; // Optional project name for project details tab
  selectedProjectId?: string; // Optional project ID for project details tab
  editingTaskTitle?: string; // Optional task title for task edit tab
  editingTaskId?: string; // Optional task ID for task edit tab
  tasks: Task[]; // Tasks for running timer display
}
export const AppHeader = ({
  activeView,
  onViewChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenParameters,
  onRefresh,
  onBack,
  selectedProjectName,
  selectedProjectId,
  editingTaskTitle,
  editingTaskId,
  tasks
}: AppHeaderProps) => {
  const {
    signOut,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out."
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };
  const navigationItems = [{
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban
  }, {
    key: 'tasks',
    label: 'Tasks',
    icon: ListTodo
  }, {
    key: 'followups',
    label: 'Follow-Ups',
    icon: MessageSquare
  }, {
    key: 'timetracking',
    label: 'Time Tracking',
    icon: Clock
  }, {
    key: 'dashboard',
    label: 'KPIs',
    icon: BarChart3
  }];

  const allNavigationItems = [{
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban
  }, {
    key: 'project-details',
    label: selectedProjectName ? `Project: ${selectedProjectName}` : 'Project Details',
    icon: FolderKanban,
    disabled: !selectedProjectName // Only disabled if no project is selected
  }, {
    key: 'tasks',
    label: 'Tasks',
    icon: ListTodo
  }, {
    key: 'followups',
    label: 'Follow-Ups',
    icon: MessageSquare
  }, {
    key: 'timetracking',
    label: 'Time Tracking',
    icon: Clock
  }, {
    key: 'task-edit',
    label: editingTaskTitle && editingTaskId ? `${editingTaskId}_${editingTaskTitle.length > 20 ? editingTaskTitle.substring(0, 20) + '...' : editingTaskTitle}` : 'Task Edit',
    icon: ListTodo,
    disabled: !editingTaskTitle // Only show if editing a task
  }, {
    key: 'dashboard',
    label: 'KPIs',
    icon: BarChart3
  }];
  const DesktopNavigation = () => <div className="hidden md:flex items-center space-x-2">
      {navigationItems.map(item => <Button
        key={item.key} 
        variant={activeView === item.key ? "default" : "outline"} 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`Navigating to: ${item.key}`);
          onViewChange(item.key as any);
        }} 
        size="sm"
        className="cursor-pointer"
      >
          <item.icon className="w-4 h-4 mr-2" />
          {item.label}
        </Button>)}
    </div>;

  const DesktopRightActions = () => <div className="hidden md:flex items-center space-x-2">
      <Button variant="outline" onClick={onRefresh} size="sm" className="flex items-center gap-2" aria-label="Refresh">
        <RotateCw className="w-4 h-4" />
      </Button>
      <Button variant="outline" onClick={onOpenParameters} size="sm" className="flex items-center gap-2" aria-label="Parameters">
        <Settings className="w-4 h-4" />
      </Button>
      <Button variant="outline" onClick={onToggleDarkMode} size="sm" className="flex items-center gap-2" aria-label="Toggle theme">
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
      <Button variant="outline" onClick={handleSignOut} size="sm" className="flex items-center gap-2" aria-label="Logout">
        <LogOut className="w-4 h-4" />
      </Button>
    </div>;
  const MobileNavigation = () => <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <div className="flex flex-col space-y-4 mt-6">
          {allNavigationItems.map(item => <Button 
            key={item.key} 
            variant={activeView === item.key ? "default" : "ghost"} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(`Mobile navigating to: ${item.key}`);
              onViewChange(item.key as any);
              setMobileMenuOpen(false);
            }} 
            className="justify-start cursor-pointer"
            disabled={item.disabled}
          >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>)}
          <div className="border-t pt-4 space-y-2">
            <Button variant="ghost" onClick={() => {
            onOpenParameters();
            setMobileMenuOpen(false);
          }} className="justify-start w-full">
              <Settings className="w-4 h-4 mr-2" />
              Parameters
            </Button>
            <Button variant="ghost" onClick={onToggleDarkMode} className="justify-start w-full">
              {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="justify-start w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>;
  return <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-border">
      {/* First Header Row */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-start">
              <button onClick={() => {
              if (onBack) {
                // If we're in project detail view, use the back function
                onBack();
              } else {
                // Otherwise, navigate to main page with projects view
                navigate('/');
                onViewChange('projects');
              }
            }} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                PMTask
              </button>
            </div>
            
            <DesktopNavigation />
          </div>
          
          <div className="flex items-center space-x-2">
            <DesktopRightActions />
            <MobileNavigation />
          </div>
        </div>
      </div>
      
      {/* Second Header Row - Project & Task Details */}
      <div className="px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-700 border-t border-border">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center">
            {/* Email badge aligned with PMTask */}
            {user && (
              <Badge variant="outline" className="text-xs">
                {user.email}
              </Badge>
            )}
            
            {/* Spacer to align Project Details with Projects from first row - matches space-x-6 */}
            <div className="w-6"></div>
            
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant={activeView === 'project-details' ? "default" : "outline"} 
                onClick={() => onViewChange('project-details')} 
                size="sm"
                disabled={!selectedProjectName}
                className={!selectedProjectName ? "opacity-50 cursor-not-allowed" : ""}
              >
                <FolderKanban className="w-4 h-4 mr-2" />
                {selectedProjectName && selectedProjectId ? `${selectedProjectId}_${selectedProjectName}` : 'Project Details'}
              </Button>
              
              <Button 
                variant={activeView === 'task-edit' ? "default" : "outline"} 
                onClick={() => onViewChange('task-edit')} 
                size="sm"
                disabled={!editingTaskTitle}
                className={!editingTaskTitle ? "opacity-50 cursor-not-allowed" : ""}
              >
                <ListTodo className="w-4 h-4 mr-2" />
                {editingTaskTitle && editingTaskId ? (
                  `${editingTaskId}_${editingTaskTitle.length > 20 ? editingTaskTitle.substring(0, 20) + '...' : editingTaskTitle}`
                ) : (
                  'Task Details'
                )}
              </Button>
            </div>
          </div>
          
          {/* Running Timer Display on the extreme right */}
          <RunningTimerDisplay tasks={tasks} />
        </div>
      </div>
    </header>;
};