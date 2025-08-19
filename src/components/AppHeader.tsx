import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, FolderKanban, ListTodo, Moon, Sun, Settings, LogOut, Menu, X, Clock, MessageSquare, RotateCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
interface AppHeaderProps {
  activeView: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit";
  onViewChange: (view: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit") => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenParameters: () => void;
  onRefresh: () => void;
  onBack?: () => void; // Optional back function for project detail view
  selectedProjectName?: string; // Optional project name for project details tab
  editingTaskTitle?: string; // Optional task title for task edit tab
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
  editingTaskTitle
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
  const navigationSections = [
    // First Row: Project section
    {
      title: "Project",
      items: [
        {
          key: 'projects',
          label: 'Project',
          icon: FolderKanban,
          isMain: true
        },
        {
          key: 'project-details',
          label: selectedProjectName ? `Project Details` : 'Project Details',
          icon: FolderKanban,
          disabled: !selectedProjectName,
          isSubItem: true
        }
      ]
    },
    // Second Row: Task section
    {
      title: "Task",
      items: [
        {
          key: 'tasks',
          label: 'Task',
          icon: ListTodo,
          isMain: true
        },
        {
          key: 'task-edit',
          label: editingTaskTitle ? `Task Details` : 'Task Details',
          icon: ListTodo,
          disabled: !editingTaskTitle,
          isSubItem: true
        }
      ]
    },
    // Third Row: Follow Ups
    {
      title: "Follow Ups",
      items: [
        {
          key: 'followups',
          label: 'Follow Ups',
          icon: MessageSquare,
          isMain: true
        }
      ]
    },
    // Fourth Row: Time Tracking
    {
      title: "Time Tracking",
      items: [
        {
          key: 'timetracking',
          label: 'Time Tracking',
          icon: Clock,
          isMain: true
        }
      ]
    },
    // Fifth Row: KPI
    {
      title: "KPI",
      items: [
        {
          key: 'dashboard',
          label: 'KPI',
          icon: BarChart3,
          isMain: true
        }
      ]
    }
  ];

  const DesktopNavigation = () => <div className="hidden md:flex items-center space-x-4">
      {navigationSections.map((section, sectionIndex) => (
        <div key={section.title} className="flex flex-col space-y-1">
          {section.items.map((item, itemIndex) => (
            <Button 
              key={item.key} 
              variant={activeView === item.key ? "default" : "outline"} 
              onClick={() => onViewChange(item.key as any)} 
              size="sm"
              disabled={item.disabled}
              className={`
                ${item.disabled ? "opacity-50 cursor-not-allowed" : ""} 
                ${item.isSubItem ? "ml-4 bg-muted/50 text-muted-foreground" : ""}
                ${item.isMain && itemIndex === 0 ? "font-medium" : ""}
              `}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>
      ))}
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
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {section.items.map((item) => (
                <Button 
                  key={item.key} 
                  variant={activeView === item.key ? "default" : "ghost"} 
                  onClick={() => {
                    onViewChange(item.key as any);
                    setMobileMenuOpen(false);
                  }} 
                  disabled={item.disabled}
                  className={`
                    justify-start w-full
                    ${item.isSubItem ? "ml-4 bg-muted/30" : ""}
                    ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          ))}
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
            }} className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                PMTask
              </button>
              
              {user && <Badge variant="outline" className="text-xs mt-1 px-0 my-0">
                  {user.email}
                </Badge>}
            </div>
            
            <DesktopNavigation />
          </div>
          
          <div className="flex items-center space-x-2">
            <DesktopRightActions />
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>;
};