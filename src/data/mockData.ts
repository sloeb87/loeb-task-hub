import { Task, Project, KPIMetrics } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "T1",
    scope: "Development",
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
    followUps: [],
    details: "Create secure authentication system with JWT tokens and password encryption",
    links: {
      oneNote: "https://example.com/auth-notes",
      teams: "https://teams.microsoft.com/auth-team"
    },
    stakeholders: ["John Doe", "Jane Smith", "Security Team"]
  },
  {
    id: "T2",
    scope: "Development",
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
    followUps: [],
    details: "Implement CSS Grid and Flexbox for responsive design across all devices",
    links: {
      file: "https://example.com/design-mockups.pdf"
    },
    stakeholders: ["Sarah Wilson", "UX Team", "John Doe"]
  },
  {
    id: "T3",
    scope: "Testing",
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
    followUps: [],
    details: "Test on Chrome, Firefox, Safari, and Edge browsers",
    links: {
      teams: "https://teams.microsoft.com/testing-channel"
    },
    stakeholders: ["Mike Johnson", "QA Team"]
  },
  {
    id: "T4",
    scope: "Development",
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
    followUps: [],
    details: "Connect mobile app to backend services and handle API responses",
    links: {
      oneNote: "https://example.com/api-docs",
      file: "https://example.com/api-specs.json"
    },
    stakeholders: ["Jane Smith", "Backend Team", "Mobile Team"]
  },
  {
    id: "T5",
    scope: "Testing",
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
    followUps: [],
    details: "Test app performance, memory usage, and battery consumption",
    links: {
      folder: "https://sharepoint.com/performance-reports"
    },
    stakeholders: ["Alice Brown", "QA Team", "Performance Team"]
  },
  {
    id: "T6",
    scope: "Development",
    project: "Mobile App",
    environment: "Production",
    taskType: "Development",
    title: "Push notifications",
    description: "Implement push notification system",
    status: "On Hold",
    priority: "Low",
    responsible: "David Lee",
    creationDate: "2024-01-25",
    startDate: "2024-02-10",
    dueDate: "2024-02-25",
    duration: 15,
    followUps: [],
    details: "Set up Firebase Cloud Messaging for push notifications",
    links: {
      teams: "https://teams.microsoft.com/notifications"
    },
    stakeholders: ["David Lee", "Mobile Team"]
  },
  {
    id: "T7",
    scope: "Documentation",
    project: "Internal Tools",
    environment: "Production",
    taskType: "Documentation",
    title: "User manual creation",
    description: "Create comprehensive user documentation",
    status: "Completed",
    priority: "Medium",
    responsible: "Lisa Garcia",
    creationDate: "2024-01-08",
    startDate: "2024-01-10",
    dueDate: "2024-01-25",
    completionDate: "2024-01-23",
    duration: 13,
    followUps: [],
    details: "Step-by-step user guide with screenshots and video tutorials",
    links: {
      folder: "https://sharepoint.com/documentation",
      oneNote: "https://example.com/user-guide-notes"
    },
    stakeholders: ["Lisa Garcia", "Support Team", "End Users"]
  },
  {
    id: "T8",
    scope: "Development",
    project: "Internal Tools",
    environment: "Development",
    taskType: "Development",
    title: "Dashboard analytics",
    description: "Build analytics dashboard for internal metrics",
    status: "In Progress",
    priority: "High",
    responsible: "Tom Anderson",
    creationDate: "2024-01-12",
    startDate: "2024-01-15",
    dueDate: "2024-02-01",
    duration: 17,
    followUps: [],
    details: "Create interactive charts and KPI tracking dashboard",
    links: {
      file: "https://example.com/analytics-requirements.pdf"
    },
    stakeholders: ["Tom Anderson", "Management", "Analytics Team"]
  },
  {
    id: "T9",
    scope: "Testing",
    project: "Internal Tools",
    environment: "Staging",
    taskType: "Testing",
    title: "Security audit",
    description: "Conduct comprehensive security testing",
    status: "Open",
    priority: "Critical",
    responsible: "Security Team",
    creationDate: "2024-01-20",
    startDate: "2024-02-01",
    dueDate: "2024-02-14",
    duration: 13,
    followUps: [],
    details: "Penetration testing and vulnerability assessment",
    links: {
      teams: "https://teams.microsoft.com/security-channel"
    },
    stakeholders: ["Security Team", "Compliance", "IT Department"]
  },
  {
    id: "T10",
    scope: "Development",
    project: "E-commerce Platform",
    environment: "Development",
    taskType: "Development",
    title: "Payment gateway integration",
    description: "Integrate Stripe payment processing",
    status: "In Progress",
    priority: "Critical",
    responsible: "Emma Davis",
    creationDate: "2024-01-14",
    startDate: "2024-01-16",
    dueDate: "2024-02-08",
    duration: 23,
    followUps: [],
    details: "Secure payment processing with Stripe API and webhooks",
    links: {
      oneNote: "https://example.com/payment-integration",
      file: "https://example.com/stripe-docs.pdf"
    },
    stakeholders: ["Emma Davis", "Finance Team", "Security Team"]
  },
  {
    id: "T11",
    scope: "Development",
    project: "E-commerce Platform",
    environment: "Development",
    taskType: "Development",
    title: "Product catalog system",
    description: "Build dynamic product catalog with search and filters",
    status: "Open",
    priority: "High",
    responsible: "Chris Martin",
    creationDate: "2024-01-16",
    startDate: "2024-01-25",
    dueDate: "2024-02-15",
    duration: 21,
    followUps: [],
    details: "Implement product search, filtering, and categorization features",
    links: {
      teams: "https://teams.microsoft.com/ecommerce-dev"
    },
    stakeholders: ["Chris Martin", "Product Team", "Marketing"]
  },
  {
    id: "T12",
    scope: "Testing",
    project: "E-commerce Platform",
    environment: "Staging",
    taskType: "Testing",
    title: "Load testing",
    description: "Test platform performance under high traffic",
    status: "Open",
    priority: "High",
    responsible: "Quality Team",
    creationDate: "2024-01-24",
    startDate: "2024-02-10",
    dueDate: "2024-02-20",
    duration: 10,
    followUps: [],
    details: "Simulate high traffic scenarios and measure response times",
    links: {
      folder: "https://sharepoint.com/load-test-results"
    },
    stakeholders: ["Quality Team", "DevOps", "Performance Team"]
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
    scope: "Development",
    links: {
      oneNote: "https://example.com/website-project-notes",
      teams: "https://teams.microsoft.com/website-redesign",
      file: "https://example.com/website-requirements.pdf"
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
    tasks: ["T4", "T5", "T6"],
    scope: "Development",
    links: {
      teams: "https://teams.microsoft.com/mobile-dev",
      folder: "https://sharepoint.com/mobile-project"
    }
  },
  {
    id: "P3",
    name: "Internal Tools",
    description: "Suite of internal productivity and analytics tools for company operations",
    owner: "Tom Anderson",
    team: ["Tom Anderson", "Lisa Garcia", "Security Team"],
    startDate: "2024-01-08",
    endDate: "2024-03-01",
    status: "Active",
    tasks: ["T7", "T8", "T9"],
    scope: "Development",
    links: {
      oneNote: "https://example.com/internal-tools-notes",
      file: "https://example.com/tools-specifications.pdf"
    }
  },
  {
    id: "P4",
    name: "E-commerce Platform",
    description: "Full-featured e-commerce platform with payment processing and inventory management",
    owner: "Emma Davis",
    team: ["Emma Davis", "Chris Martin", "Quality Team"],
    startDate: "2024-01-14",
    endDate: "2024-05-15",
    status: "Active",
    tasks: ["T10", "T11", "T12"],
    scope: "Development",
    links: {
      teams: "https://teams.microsoft.com/ecommerce-platform",
      folder: "https://sharepoint.com/ecommerce-docs",
      oneNote: "https://example.com/ecommerce-planning"
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
