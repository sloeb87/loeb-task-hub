import { Task, Project, KPIMetrics } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "TSK-001",
    scope: "Frontend",
    project: "Customer Portal Redesign",
    environment: "Development",
    taskType: "Development",
    title: "Implement User Authentication",
    description: "Develop secure user login and registration functionality",
    status: "In Progress",
    priority: "High",
    responsible: "John Smith",
    creationDate: "2024-01-15",
    startDate: "2024-01-22",
    dueDate: "2024-02-05",
    completionDate: "2024-02-05",
    duration: 14,
    dependencies: [],
    followUps: [
      {
        id: "FU-001",
        text: "Discussed approach with Sarah",
        timestamp: "2024-01-22",
        author: "John Smith"
      }
    ],
    comments: [{ text: "Initial design review passed", timestamp: "2024-01-22" }],
    details: "Utilize OAuth 2.0 for secure authentication",
    links: {
      oneNote: "https://onenote.com/auth-spec",
      teams: "https://teams.microsoft.com/auth-channel",
      email: "john.smith@company.com",
      file: "https://sharepoint.com/auth-design.pdf",
      folder: "https://sharepoint.com/auth-docs"
    },
    stakeholders: ["Sarah Connor", "Emily Davis"]
  },
  {
    id: "TSK-002",
    scope: "Frontend",
    project: "Customer Portal Redesign",
    environment: "Testing",
    taskType: "Testing",
    title: "Test User Authentication",
    description: "Test secure user login and registration functionality",
    status: "Completed",
    priority: "High",
    responsible: "Emily Davis",
    creationDate: "2024-01-15",
    startDate: "2024-02-05",
    dueDate: "2024-02-12",
    completionDate: "2024-02-12",
    duration: 7,
    dependencies: ["TSK-001"],
    followUps: [
      {
        id: "FU-002",
        text: "Completed testing, no issues found",
        timestamp: "2024-02-12",
        author: "Emily Davis"
      }
    ],
    comments: [{ text: "All tests passed", timestamp: "2024-02-12" }],
    details: "Execute test cases for user authentication",
    links: {
      teams: "https://teams.microsoft.com/testing-channel",
      file: "https://sharepoint.com/test-results.xlsx"
    },
    stakeholders: ["Sarah Connor", "John Smith"]
  },
  {
    id: "TSK-003",
    scope: "Frontend",
    project: "Customer Portal Redesign",
    environment: "Development",
    taskType: "Development",
    title: "Implement Dashboard UI",
    description: "Develop the main dashboard interface with key metrics",
    status: "In Progress",
    priority: "Medium",
    responsible: "John Smith",
    creationDate: "2024-01-15",
    startDate: "2024-02-12",
    dueDate: "2024-02-26",
    duration: 14,
    dependencies: [],
    followUps: [
      {
        id: "FU-003",
        text: "Working on chart integrations",
        timestamp: "2024-02-19",
        author: "John Smith"
      }
    ],
    comments: [{ text: "UI design approved", timestamp: "2024-02-12" }],
    details: "Use React and Material-UI for the dashboard",
    links: {
      oneNote: "https://onenote.com/dashboard-spec",
      teams: "https://teams.microsoft.com/dashboard-channel",
      email: "john.smith@company.com",
      file: "https://sharepoint.com/dashboard-design.pdf",
      folder: "https://sharepoint.com/dashboard-components"
    },
    stakeholders: ["Sarah Connor", "Emily Davis"]
  },
  {
    id: "TSK-004",
    scope: "Frontend",
    project: "Customer Portal Redesign",
    environment: "Review",
    taskType: "Review",
    title: "Review Dashboard UI",
    description: "Review the main dashboard interface and provide feedback",
    status: "Open",
    priority: "Medium",
    responsible: "Emily Davis",
    creationDate: "2024-01-15",
    startDate: "2024-02-26",
    dueDate: "2024-03-05",
    duration: 7,
    dependencies: ["TSK-003"],
    followUps: [],
    comments: [],
    details: "Check for usability and visual consistency",
    links: {
      teams: "https://teams.microsoft.com/review-channel"
    },
    stakeholders: ["Sarah Connor", "John Smith"]
  },
  {
    id: "TSK-005",
    scope: "Backend",
    project: "API Integration Platform",
    environment: "Development",
    taskType: "Development",
    title: "Implement API Gateway",
    description: "Develop a secure API gateway for managing third-party integrations",
    status: "In Progress",
    priority: "High",
    responsible: "Lisa Wang",
    creationDate: "2024-02-01",
    startDate: "2024-02-08",
    dueDate: "2024-02-22",
    duration: 14,
    dependencies: [],
    followUps: [
      {
        id: "FU-004",
        text: "Configuring rate limiting",
        timestamp: "2024-02-15",
        author: "Lisa Wang"
      }
    ],
    comments: [{ text: "Security protocols defined", timestamp: "2024-02-08" }],
    details: "Use Kong API Gateway for security and rate limiting",
    links: {
      oneNote: "https://onenote.com/api-gateway-spec",
      teams: "https://teams.microsoft.com/api-gateway-channel",
      email: "lisa.wang@company.com",
      file: "https://sharepoint.com/api-gateway-design.pdf",
      folder: "https://sharepoint.com/api-gateway-docs"
    },
    stakeholders: ["Michael Rodriguez", "David Kim"]
  },
  {
    id: "TSK-006",
    scope: "Backend",
    project: "API Integration Platform",
    environment: "Testing",
    taskType: "Testing",
    title: "Test API Gateway",
    description: "Test the API gateway for security and performance",
    status: "Open",
    priority: "High",
    responsible: "David Kim",
    creationDate: "2024-02-01",
    startDate: "2024-02-22",
    dueDate: "2024-03-01",
    duration: 7,
    dependencies: ["TSK-005"],
    followUps: [],
    comments: [],
    details: "Execute performance and security tests",
    links: {
      teams: "https://teams.microsoft.com/testing-channel"
    },
    stakeholders: ["Michael Rodriguez", "Lisa Wang"]
  },
  {
    id: "TSK-007",
    scope: "Mobile",
    project: "Mobile App Launch",
    environment: "Development",
    taskType: "Development",
    title: "Develop iOS App",
    description: "Develop the native iOS application",
    status: "In Progress",
    priority: "High",
    responsible: "Alex Thompson",
    creationDate: "2024-03-01",
    startDate: "2024-03-08",
    dueDate: "2024-03-22",
    duration: 14,
    dependencies: [],
    followUps: [
      {
        id: "FU-005",
        text: "Implementing UI components",
        timestamp: "2024-03-15",
        author: "Alex Thompson"
      }
    ],
    comments: [{ text: "Initial setup complete", timestamp: "2024-03-08" }],
    details: "Use Swift and SwiftUI for the iOS app",
    links: {
      oneNote: "https://onenote.com/ios-app-spec",
      teams: "https://teams.microsoft.com/ios-app-channel",
      email: "alex.thompson@company.com",
      file: "https://sharepoint.com/ios-app-design.pdf",
      folder: "https://sharepoint.com/ios-app-components"
    },
    stakeholders: ["Jennifer Park", "Maria Gonzalez"]
  },
  {
    id: "TSK-008",
    scope: "Mobile",
    project: "Mobile App Launch",
    environment: "Development",
    taskType: "Development",
    title: "Develop Android App",
    description: "Develop the native Android application",
    status: "Open",
    priority: "High",
    responsible: "Maria Gonzalez",
    creationDate: "2024-03-01",
    startDate: "2024-03-22",
    dueDate: "2024-04-05",
    duration: 14,
    dependencies: [],
    followUps: [],
    comments: [],
    details: "Use Kotlin and Jetpack Compose for the Android app",
    links: {
      oneNote: "https://onenote.com/android-app-spec",
      teams: "https://teams.microsoft.com/android-app-channel",
      email: "maria.gonzalez@company.com",
      file: "https://sharepoint.com/android-app-design.pdf",
      folder: "https://sharepoint.com/android-app-components"
    },
    stakeholders: ["Jennifer Park", "Alex Thompson"]
  },
  {
    id: "TSK-009",
    scope: "Analytics",
    project: "Data Analytics Dashboard",
    environment: "Development",
    taskType: "Development",
    title: "Implement Data Ingestion",
    description: "Implement data ingestion from various sources",
    status: "In Progress",
    priority: "High",
    responsible: "Robert Chen",
    creationDate: "2024-04-01",
    startDate: "2024-04-08",
    dueDate: "2024-04-22",
    duration: 14,
    dependencies: [],
    followUps: [
      {
        id: "FU-006",
        text: "Connecting to database",
        timestamp: "2024-04-15",
        author: "Robert Chen"
      }
    ],
    comments: [{ text: "Data sources identified", timestamp: "2024-04-08" }],
    details: "Use Apache Kafka for data ingestion",
    links: {
      oneNote: "https://onenote.com/data-ingestion-spec",
      teams: "https://teams.microsoft.com/data-ingestion-channel",
      email: "robert.chen@company.com",
      file: "https://sharepoint.com/data-ingestion-design.pdf",
      folder: "https://sharepoint.com/data-ingestion-scripts"
    },
    stakeholders: ["Amanda White"]
  },
  {
    id: "TSK-010",
    scope: "Analytics",
    project: "Data Analytics Dashboard",
    environment: "Development",
    taskType: "Development",
    title: "Develop Dashboard Visualizations",
    description: "Develop interactive dashboard visualizations",
    status: "Open",
    priority: "High",
    responsible: "Amanda White",
    creationDate: "2024-04-01",
    startDate: "2024-04-22",
    dueDate: "2024-05-06",
    duration: 14,
    dependencies: [],
    followUps: [],
    comments: [],
    details: "Use Tableau for dashboard visualizations",
    links: {
      oneNote: "https://onenote.com/dashboard-viz-spec",
      teams: "https://teams.microsoft.com/dashboard-viz-channel",
      email: "amanda.white@company.com",
      file: "https://sharepoint.com/dashboard-viz-design.pdf",
      folder: "https://sharepoint.com/dashboard-viz-templates"
    },
    stakeholders: ["Robert Chen"]
  }
];

export const mockProjects: Project[] = [
  {
    id: "PRJ-001",
    name: "Customer Portal Redesign",
    description: "Complete overhaul of the customer-facing portal interface with modern UI/UX",
    owner: "Sarah Connor",
    team: ["Sarah Connor", "John Smith", "Emily Davis"],
    startDate: "2024-01-15",
    endDate: "2024-04-30",
    status: "Active",
    scope: "Frontend",
    tasks: ["TSK-001", "TSK-002", "TSK-003", "TSK-004"],
    links: {
      oneNote: "https://onenote.com/customer-portal",
      teams: "https://teams.microsoft.com/customer-portal",
      email: "sarah.connor@company.com",
      file: "https://sharepoint.com/customer-portal-specs.docx",
      folder: "https://sharepoint.com/sites/customer-portal"
    }
  },
  {
    id: "PRJ-002",
    name: "API Integration Platform",
    description: "Development of a unified API platform for third-party integrations",
    owner: "Michael Rodriguez",
    team: ["Michael Rodriguez", "Lisa Wang", "David Kim"],
    startDate: "2024-02-01",
    endDate: "2024-06-15",
    status: "Active",
    scope: "Backend",
    tasks: ["TSK-005", "TSK-006"],
    links: {
      teams: "https://teams.microsoft.com/api-platform",
      folder: "https://sharepoint.com/sites/api-platform"
    }
  },
  {
    id: "PRJ-003",
    name: "Mobile App Launch",
    description: "Native mobile application for iOS and Android platforms",
    owner: "Jennifer Park",
    team: ["Jennifer Park", "Alex Thompson", "Maria Gonzalez"],
    startDate: "2024-03-01",
    endDate: "2024-08-30",
    status: "Active",
    scope: "Mobile",
    tasks: ["TSK-007", "TSK-008"],
    links: {
      oneNote: "https://onenote.com/mobile-app",
      email: "jennifer.park@company.com"
    }
  },
  {
    id: "PRJ-004",
    name: "Data Analytics Dashboard",
    description: "Business intelligence dashboard for real-time analytics",
    owner: "Robert Chen",
    team: ["Robert Chen", "Amanda White"],
    startDate: "2024-04-01",
    endDate: "2024-07-31",
    status: "Active",
    scope: "Analytics",
    tasks: ["TSK-009", "TSK-010"]
  },
  {
    id: "PRJ-005",
    name: "Security Audit & Compliance",
    description: "Comprehensive security review and compliance implementation",
    owner: "Thomas Anderson",
    team: ["Thomas Anderson", "Linda Johnson"],
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    status: "On Hold",
    scope: "Security",
    tasks: []
  },
  {
    id: "PRJ-006",
    name: "Database Migration",
    description: "Migration from legacy database to modern cloud solution",
    owner: "Kevin Liu",
    team: ["Kevin Liu", "Susan Brown"],
    startDate: "2024-05-01",
    endDate: "2024-09-30",
    status: "Active",
    scope: "Infrastructure",
    tasks: []
  }
];

export const kpiMetrics: KPIMetrics = {
  totalTasks: mockTasks.length,
  completedTasks: mockTasks.filter(task => task.status === "Completed").length,
  overdueTasks: mockTasks.filter(task => task.status !== "Completed" && new Date(task.dueDate) < new Date()).length,
  completionRate: (mockTasks.filter(task => task.status === "Completed").length / mockTasks.length) * 100,
  averageTaskDuration: mockTasks.reduce((acc, task) => acc + (task.duration || 0), 0) / mockTasks.length,
  tasksByStatus: mockTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, { "Open": 0, "In Progress": 0, "Completed": 0, "On Hold": 0 }),
  tasksByPriority: mockTasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, { "Low": 0, "Medium": 0, "High": 0, "Critical": 0 }),
  tasksByUser: mockTasks.reduce((acc, task) => {
    acc[task.responsible] = (acc[task.responsible] || 0) + 1;
    return acc;
  }, {})
};
