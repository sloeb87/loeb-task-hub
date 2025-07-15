import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/task';
import { projectsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useProjectStorage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize projects from API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const loadedProjects = await projectsApi.getProjects();
        setProjects(loadedProjects);
        setError(null);
      } catch (err) {
        console.error('Failed to load projects from API:', err);
        setError('Failed to load projects from server');
        toast({
          title: "Error",
          description: "Failed to load projects from server",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [toast]);

  // Handle API errors
  const handleApiError = useCallback((error: any, action: string) => {
    console.error(`Failed to ${action}:`, error);
    const message = `Failed to ${action}`;
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  }, [toast]);

  // Create new project
  const createProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    try {
      setIsLoading(true);
      const newProject = await projectsApi.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setError(null);
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      
      return newProject;
    } catch (err) {
      handleApiError(err, 'create project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, toast]);

  // Update existing project
  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      setIsLoading(true);
      const updated = await projectsApi.updateProject(updatedProject);
      setProjects(prev => prev.map(project => 
        project.id === updated.id ? updated : project
      ));
      setError(null);
      
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    } catch (err) {
      handleApiError(err, 'update project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, toast]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      await projectsApi.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      setError(null);
      
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
    } catch (err) {
      handleApiError(err, 'delete project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, toast]);

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: () => setProjects([...projects]) // Force re-render if needed
  };
};