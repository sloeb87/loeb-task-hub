import React from 'react';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import ProjectsPage from './Projects';

const ProjectsStandalone = () => {
  const {
    tasks,
    projects,
    createTask,
    updateTask,
    addFollowUp,
    deleteTask,
    createProject,
    updateProject,
    deleteProject,
  } = useSupabaseStorage();

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
    />
  );
};

export default ProjectsStandalone;