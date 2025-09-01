import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { Task } from "@/types/task";
import ProjectsPage from "./Projects";

const ProjectsWrapper = () => {
  const navigate = useNavigate();
  const {
    tasks,
    projects,
    createTask,
    updateTask,
    deleteTask,
    addFollowUp,
    createProject,
    updateProject,
    deleteProject
  } = useSupabaseStorage();

  const { setNavigationCallback } = useTaskNavigation();

  // Set up navigation callback for task editing
  useEffect(() => {
    setNavigationCallback((projectName?: string, task?: Task) => {
      if (task) {
        console.log('Projects - Navigating to task edit:', task.id);
        navigate(`/tasks/${task.id}`);
      }
    });
  }, [navigate, setNavigationCallback]);

  // SEO
  useEffect(() => {
    document.title = "Projects | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Manage your projects and track progress effectively.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  const handleEditTask = (task: Task) => {
    console.log('ProjectsWrapper - Handling task edit:', task.id);
    navigate(`/tasks/${task.id}`);
  };

  return (
    <ProjectsPage
      tasks={tasks}
      projects={projects}
      onCreateProject={createProject}
      onUpdateProject={updateProject}
      onDeleteProject={deleteProject}
      onCreateTask={createTask}
      onUpdateTask={updateTask}
      onDeleteTask={deleteTask}
      onAddFollowUp={addFollowUp}
      onEditTask={handleEditTask}
    />
  );
};

export default ProjectsWrapper;