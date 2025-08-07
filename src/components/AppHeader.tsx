import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, FolderKanban, ListTodo, Moon, Sun, Settings, LogOut, Menu, X, Clock, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
interface AppHeaderProps {
  activeView: "tasks" | "dashboard" | "projects" | "timetracking" | "followups";
  onViewChange: (view: "tasks" | "dashboard" | "projects" | "timetracking" | "followups") => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenParameters: () => void;
  onBack?: () => void; // Optional back function for project detail view
}
export const AppHeader = ({
  activeView,
  onViewChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenParameters,
  onBack
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
  const DesktopNavigation = () => <div className="hidden md:flex items-center space-x-2">
      {navigationItems.map(item => <Button key={item.key} variant={activeView === item.key ? "default" : "outline"} onClick={() => onViewChange(item.key as any)} size="sm">
          <item.icon className="w-4 h-4 mr-2" />
          {item.label}
        </Button>)}
      <Button variant="outline" onClick={onOpenParameters} size="sm" className="flex items-center gap-2">
        <Settings className="w-4 h-4" />
        
      </Button>
      <Button variant="outline" onClick={onToggleDarkMode} size="sm" className="flex items-center gap-2">
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
      <Button variant="outline" onClick={handleSignOut} size="sm" className="flex items-center gap-2">
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
          {navigationItems.map(item => <Button key={item.key} variant={activeView === item.key ? "default" : "ghost"} onClick={() => {
          onViewChange(item.key as any);
          setMobileMenuOpen(false);
        }} className="justify-start">
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
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
          
          <div className="flex items-center space-x-2">
            <DesktopNavigation />
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>;
};