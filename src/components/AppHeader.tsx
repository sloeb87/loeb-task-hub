
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FolderKanban, ListTodo, Moon, Sun, Settings } from "lucide-react";

interface AppHeaderProps {
  activeView: "tasks" | "dashboard" | "projects";
  onViewChange: (view: "tasks" | "dashboard" | "projects") => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenParameters: () => void;
}

export const AppHeader = ({ 
  activeView, 
  onViewChange, 
  isDarkMode, 
  onToggleDarkMode, 
  onOpenParameters 
}: AppHeaderProps) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PMTask</h1>
            <Badge variant="secondary" className="text-xs">
              Loeb Consulting
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant={activeView === "projects" ? "default" : "outline"} 
              onClick={() => onViewChange("projects")} 
              size="sm"
            >
              <FolderKanban className="w-4 h-4 mr-2" />
              Projects
            </Button>
            <Button 
              variant={activeView === "tasks" ? "default" : "outline"} 
              onClick={() => onViewChange("tasks")} 
              size="sm"
            >
              <ListTodo className="w-4 h-4 mr-2" />
              Tasks
            </Button>
            <Button 
              variant={activeView === "dashboard" ? "default" : "outline"} 
              onClick={() => onViewChange("dashboard")} 
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              KPIs
            </Button>
            <Button 
              variant="outline" 
              onClick={onOpenParameters} 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={onToggleDarkMode} 
              size="sm" 
              className="flex items-center gap-2"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
