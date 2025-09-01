import React, { useEffect } from 'react';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { Task } from "@/types/task";
import ProjectsPage from "./Projects";

const ProjectsWrapper = () => {
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

  const { navigateToTaskEdit } = useTaskNavigation();

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
    navigateToTaskEdit(task.id);
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