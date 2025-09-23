import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, FolderKanban, ListTodo, Moon, Sun, Settings, LogOut, Menu, X, Clock, MessageSquare, RotateCw, Users, StickyNote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import { Task } from "@/types/task";
interface AppHeaderProps {
  activeView: "tasks" | "meetings" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit" | "meeting-edit" | "notes";
  onViewChange: (view: "tasks" | "meetings" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit" | "meeting-edit" | "notes") => void;
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
export const AppHeader = React.memo(({
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
  
  const handleSignOut = useCallback(async () => {
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
  }, [signOut, toast]);
  // Memoize navigation items to prevent recreation
  const navigationItems = useMemo(() => [{
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban
  }, {
    key: 'tasks',
    label: 'Tasks',
    icon: ListTodo
  }, {
    key: 'meetings',
    label: 'Meetings',
    icon: Users
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
  }], []);

  const allNavigationItems = useMemo(() => [{
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban
  }, {
    key: 'project-details',
    label: selectedProjectName ? `Project: ${selectedProjectName}` : 'Project Details',
    icon: FolderKanban,
    disabled: !selectedProjectName
  }, {
    key: 'tasks',
    label: 'Tasks',
    icon: ListTodo
  }, {
    key: 'meetings',
    label: 'Meetings',
    icon: Users
  }, {
    key: 'task-edit',
    label: editingTaskTitle && editingTaskId && tasks?.find(t => t.id === editingTaskId)?.taskType !== 'Meeting' ? `Task: ${editingTaskTitle.length > 20 ? editingTaskTitle.substring(0, 20) + '...' : editingTaskTitle}` : 'Task Details',
    icon: ListTodo,
    disabled: !editingTaskTitle || tasks?.find(t => t.id === editingTaskId)?.taskType === 'Meeting'
  }, {
    key: 'meeting-edit',
    label: editingTaskTitle && editingTaskId && tasks?.find(t => t.id === editingTaskId)?.taskType === 'Meeting' ? `Meeting: ${editingTaskTitle.length > 20 ? editingTaskTitle.substring(0, 20) + '...' : editingTaskTitle}` : 'Meeting Details',
    icon: Users,
    disabled: !editingTaskTitle || tasks?.find(t => t.id === editingTaskId)?.taskType !== 'Meeting'
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
  }], [selectedProjectName, editingTaskTitle, editingTaskId, tasks]);
  // Memoized components to prevent recreation
  const DesktopNavigation = useMemo(() => {
    return () => (
      <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
        {navigationItems.map(item => <Button
          key={item.key} 
          variant={activeView === item.key ? "default" : "outline"} 
          onClick={() => onViewChange(item.key as any)} 
          size="sm"
          className="text-xs md:text-sm px-1 md:px-2 lg:px-3"
        >
            <item.icon className="w-4 h-4 md:mr-1 lg:mr-2" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>)}
      </div>
    );
  }, [navigationItems, activeView, onViewChange]);

  const DesktopRightActions = useMemo(() => {
    return () => (
      <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
        <Button variant="outline" onClick={() => onViewChange('notes')} size="sm" className="flex items-center p-2" aria-label="Quick Notes">
          <StickyNote className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onRefresh} size="sm" className="flex items-center p-2" aria-label="Refresh">
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onOpenParameters} size="sm" className="flex items-center p-2" aria-label="Parameters">
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onToggleDarkMode} size="sm" className="flex items-center p-2" aria-label="Toggle theme">
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="outline" onClick={handleSignOut} size="sm" className="flex items-center p-2" aria-label="Logout">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }, [onRefresh, onOpenParameters, onToggleDarkMode, isDarkMode, handleSignOut, onViewChange]);
  const MobileNavigation = useMemo(() => {
    return () => (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
              onClick={() => {
                onViewChange(item.key as any);
                setMobileMenuOpen(false);
              }} 
              className="justify-start"
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
      </Sheet>
    );
  }, [mobileMenuOpen, setMobileMenuOpen, allNavigationItems, activeView, onViewChange, onOpenParameters, onToggleDarkMode, isDarkMode, handleSignOut]);
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
            
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Button 
                variant={activeView === 'project-details' ? "default" : "outline"} 
                onClick={() => onViewChange('project-details')} 
                size="sm"
                disabled={!selectedProjectName}
                className={`text-xs md:text-sm px-1 md:px-2 lg:px-3 ${!selectedProjectName ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FolderKanban className="w-4 h-4 md:mr-1 lg:mr-2" />
                <span className="hidden lg:inline">
                  {selectedProjectName ? `Project: ${selectedProjectName}` : 'Project Details'}
                </span>
              </Button>
              
              {editingTaskTitle && editingTaskId && tasks?.find(t => t.id === editingTaskId)?.taskType !== 'Meeting' && (
                <Button 
                  variant={activeView === 'task-edit' ? "default" : "outline"} 
                  onClick={() => onViewChange('task-edit')} 
                  size="sm"
                  className="text-xs md:text-sm px-1 md:px-2 lg:px-3"
                >
                  <ListTodo className="w-4 h-4 md:mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">
                    {`Task: ${editingTaskTitle.length > 20 ? editingTaskTitle.substring(0, 20) + '...' : editingTaskTitle}`}
                  </span>
                </Button>
              )}
              
              {editingTaskTitle && editingTaskId && tasks?.find(t => t.id === editingTaskId)?.taskType === 'Meeting' && (
                <Button 
                  variant={activeView === 'meeting-edit' ? "default" : "outline"} 
                  onClick={() => onViewChange('meeting-edit')} 
                  size="sm"
                  className="text-xs md:text-sm px-1 md:px-2 lg:px-3"
                >
                  <Users className="w-4 h-4 md:mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">
                    {`Meeting: ${editingTaskTitle.length > 20 ? editingTaskTitle.substring(0, 20) + '...' : editingTaskTitle}`}
                  </span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Running Timer Display on the extreme right */}
          <RunningTimerDisplay tasks={tasks} />
        </div>
      </div>
    </header>;
});