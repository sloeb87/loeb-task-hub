import { Task, Project, KPIMetrics } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "T1",
    scope: ["Development"],
    project: "Website Redesign",
    environment: "Production",
    taskType: "Development",
    title: "Implement user authentication",
    description: "Set up login and registration functionality with JWT tokens",
    status: "In Progress",
    priority: "High",
    responsible: "John Doe",
    creationDate: "2024-01-15",
    startDate: "2024-01-16",
    dueDate: "2024-01-30",
    duration: 14,
    checklist: [],
    followUps: [],
    details: "Create secure authentication system with JWT tokens and password encryption",
    links: {
      oneNote: ["https://example.com/auth-notes"],
      teams: ["https://teams.microsoft.com/auth-team"],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["John Doe", "Jane Smith", "Security Team"]
  },
  {
    id: "T2",
    scope: ["Development"],
    project: "Website Redesign",
    environment: "Development",
    taskType: "Development",
    title: "Design responsive layout",
    description: "Create mobile-first responsive design for all pages",
    status: "Completed",
    priority: "High",
    responsible: "Sarah Wilson",
    creationDate: "2024-01-10",
    startDate: "2024-01-12",
    dueDate: "2024-01-25",
    completionDate: "2024-01-24",
    duration: 12,
    checklist: [],
    followUps: [],
    details: "Implement CSS Grid and Flexbox for responsive design across all devices",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: ["https://example.com/design-mockups.pdf"],
      folder: []
    },
    stakeholders: ["Sarah Wilson", "UX Team", "John Doe"]
  },
  {
    id: "T3",
    scope: ["Testing"],
    project: "Website Redesign",
    environment: "Staging",
    taskType: "Testing",
    title: "Cross-browser compatibility testing",
    description: "Test website functionality across different browsers",
    status: "Open",
    priority: "Medium",
    responsible: "Mike Johnson",
    creationDate: "2024-01-20",
    startDate: "2024-02-01",
    dueDate: "2024-02-10",
    duration: 9,
    checklist: [],
    followUps: [],
    details: "Test on Chrome, Firefox, Safari, and Edge browsers",
    links: {
      oneNote: [],
      teams: ["https://teams.microsoft.com/testing-channel"],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Mike Johnson", "QA Team"]
  },
  {
    id: "T4",
    scope: ["Development"],
    project: "Mobile App",
    environment: "Development",
    taskType: "Development",
    title: "API integration",
    description: "Integrate REST API endpoints for data fetching",
    status: "In Progress",
    priority: "High",
    responsible: "Jane Smith",
    creationDate: "2024-01-18",
    startDate: "2024-01-20",
    dueDate: "2024-02-05",
    duration: 16,
    checklist: [],
    followUps: [],
    details: "Connect mobile app to backend services and handle API responses",
    links: {
      oneNote: ["https://example.com/api-docs"],
      teams: [],
      email: [],
      file: ["https://example.com/api-specs.json"],
      folder: []
    },
    stakeholders: ["Jane Smith", "Backend Team", "Mobile Team"]
  },
  {
    id: "T5",
    scope: ["Testing"],
    project: "Mobile App",
    environment: "Staging",
    taskType: "Testing",
    title: "Performance testing",
    description: "Test app performance on different devices",
    status: "Open",
    priority: "Medium",
    responsible: "Alice Brown",
    creationDate: "2024-01-22",
    startDate: "2024-02-05",
    dueDate: "2024-02-15",
    duration: 10,
    checklist: [],
    followUps: [],
    details: "Test app performance, memory usage, and battery consumption",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: ["https://sharepoint.com/performance-reports"]
    },
    stakeholders: ["Alice Brown", "QA Team", "Performance Team"]
  }
];

export const mockProjects: Project[] = [
  {
    id: "P1",
    name: "Website Redesign",
    description: "Complete overhaul of company website with modern design and improved UX",
    owner: "John Doe",
    team: ["John Doe", "Sarah Wilson", "Mike Johnson"],
    startDate: "2024-01-10",
    endDate: "2024-03-15",
    status: "Active",
    tasks: ["T1", "T2", "T3"],
    scope: ["Development"],
    links: {
      oneNote: ["https://example.com/website-project-notes"],
      teams: ["https://teams.microsoft.com/website-redesign"],
      email: [],
      file: ["https://example.com/website-requirements.pdf"],
      folder: []
    }
  },
  {
    id: "P2",
    name: "Mobile App",
    description: "Native mobile application for iOS and Android platforms",
    owner: "Jane Smith",
    team: ["Jane Smith", "Alice Brown", "David Lee"],
    startDate: "2024-01-18",
    endDate: "2024-04-30",
    status: "Active",
    tasks: ["T4", "T5"],
    scope: ["Development"],
    links: {
      oneNote: [],
      teams: ["https://teams.microsoft.com/mobile-dev"],
      email: [],
      file: [],
      folder: ["https://sharepoint.com/mobile-project"]
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