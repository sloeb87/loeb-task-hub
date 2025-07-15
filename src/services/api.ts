import axios from 'axios';
import { Task, Project } from '@/types/task';

const BASE_URL = 'https://loebconsulting.be/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tasks API
export const tasksApi = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks.php');
    return response.data;
  },

  // Create new task
  createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
    const response = await api.post('/tasks.php', task);
    return response.data;
  },

  // Update existing task
  updateTask: async (task: Task): Promise<Task> => {
    const response = await api.put(`/tasks.php`, task);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks.php?id=${taskId}`);
  },
};

// Projects API
export const projectsApi = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects.php');
    return response.data;
  },

  // Create new project
  createProject: async (project: Omit<Project, 'id'>): Promise<Project> => {
    const response = await api.post('/projects.php', project);
    return response.data;
  },

  // Update existing project
  updateProject: async (project: Project): Promise<Project> => {
    const response = await api.put('/projects.php', project);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects.php?id=${projectId}`);
  },
};

export default api;