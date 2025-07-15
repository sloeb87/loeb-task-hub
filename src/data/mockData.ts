import { Task, Project, KPIMetrics } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "T1",
    scope: "Development",
    project: "Website Redesign",
    environment: "Production",
    taskType: "Development",
    title: "Implement user authentication",
    description: "Set up login and registration functionality",
    status: "In Progress",
    priority: "High",
    responsible: "John Doe",
    creationDate: "2024-01-15",
    startDate: "2024-01-16",
    dueDate: "2024-01-30",
    duration: 14,
    followUps: [],
    details: "Create secure authentication system with JWT tokens",
    links: {
      oneNote: "https://example.com/onenote",
      teams: "https://teams.microsoft.com/example"
    },
    stakeholders: ["John Doe", "Jane Smith"]
  },
  {
    id: "T2",
    scope: "Testing",
    project: "Mobile App",
    environment: "Staging",
    taskType: "Testing",
    title: "API integration testing",
    description: "Test all API endpoints for mobile app",
    status: "Open",
    priority: "Medium",
    responsible: "Jane Smith",
    creationDate: "2024-01-20",
    startDate: "2024-01-22",
    dueDate: "2024-02-05",
    duration: 10,
    followUps: [],
    details: "Comprehensive testing of REST API endpoints",
    links: {
      file: "https://example.com/test-plan.pdf"
    },
    stakeholders: ["Jane Smith", "Mike Johnson"]
  },
  {
    id: "T3",
    scope: "Documentation",
    project: "Internal Tools",
    environment: "Development",
    taskType: "Documentation",
    title: "User manual creation",
    description: "Create comprehensive user documentation",
    status: "Completed",
    priority: "Low",
    responsible: "Alice Brown",
    creationDate: "2024-01-10",
    startDate: "2024-01-12",
    dueDate: "2024-01-25",
    completionDate: "2024-01-24",
    duration: 12,
    followUps: [],
    details: "Step-by-step user guide with screenshots",
    links: {
      folder: "https://sharepoint.com/documentation"
    },
    stakeholders: ["Alice Brown", "Support Team"]
  }
];

export const mockProjects: Project[] = [
  {
    id: "P1",
    name: "Website Redesign",
    description: "Complete overhaul of company website",
    owner: "John Doe",
    team: ["John Doe", "Jane Smith", "Mike Johnson"],
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    status: "Active",
    tasks: ["T1"],
    scope: "Development",
    links: {
      oneNote: "https://example.com/project-notes",
      teams: "https://teams.microsoft.com/website-redesign"
    }
  },
  {
    id: "P2",
    name: "Mobile App",
    description: "Native mobile application development",
    owner: "Jane Smith",
    team: ["Jane Smith", "Mike Johnson", "Alice Brown"],
    startDate: "2024-01-20",
    endDate: "2024-04-20",
    status: "Active",
    tasks: ["T2"],
    scope: "Testing",
    links: {
      file: "https://example.com/mobile-specs.pdf"
    }
  }
];

export const kpiMetrics: KPIMetrics = {
  totalTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  completionRate: 0,
  averageTaskDuration: 0,
  tasksByStatus: { "Open": 0, "In Progress": 0, "Completed": 0, "On Hold": 0 },
  tasksByPriority: { "Low": 0, "Medium": 0, "High": 0, "Critical": 0 },
  tasksByUser: {}
};
