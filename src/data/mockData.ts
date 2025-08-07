import { Task, Project, KPIMetrics } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "T1",
    scope: ["Development"], // Changed to array
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
      oneNote: "https://example.com/auth-notes",
      teams: "https://teams.microsoft.com/auth-team"
    },
    stakeholders: ["John Doe", "Jane Smith", "Security Team"]
  },
  {
    id: "T2",
    scope: ["Development"], // Changed to array
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
      file: "https://example.com/design-mockups.pdf"
    },
    stakeholders: ["Sarah Wilson", "UX Team", "John Doe"]
  },
  {
    id: "T3",
    scope: ["Testing"], // Changed to array
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
      teams: "https://teams.microsoft.com/testing-channel"
    },
    stakeholders: ["Mike Johnson", "QA Team"]
  },
  {
    id: "T4",
    scope: ["Development"], // Changed to array
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
      oneNote: "https://example.com/api-docs",
      file: "https://example.com/api-specs.json"
    },
    stakeholders: ["Jane Smith", "Backend Team", "Mobile Team"]
  },
  {
    id: "T5",
    scope: ["Testing"], // Changed to array
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
      folder: "https://sharepoint.com/performance-reports"
    },
    stakeholders: ["Alice Brown", "QA Team", "Performance Team"]
  },
  {
    id: "T6",
    scope: ["Development"], // Changed to array
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
    checklist: [],
    followUps: [],
    details: "Set up Firebase Cloud Messaging for push notifications",
    links: {
      teams: "https://teams.microsoft.com/notifications"
    },
    stakeholders: ["David Lee", "Mobile Team"]
  },
  {
    id: "T7",
    scope: ["Documentation"], // Changed to array
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
    checklist: [],
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
    scope: ["Development"], // Changed to array
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
    checklist: [],
    followUps: [],
    details: "Create interactive charts and KPI tracking dashboard",
    links: {
      file: "https://example.com/analytics-requirements.pdf"
    },
    stakeholders: ["Tom Anderson", "Management", "Analytics Team"]
  },
  {
    id: "T9",
    scope: ["Testing"], // Changed to array
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
    checklist: [],
    followUps: [],
    details: "Penetration testing and vulnerability assessment",
    links: {
      teams: "https://teams.microsoft.com/security-channel"
    },
    stakeholders: ["Security Team", "Compliance", "IT Department"]
  },
  {
    id: "T10",
    scope: ["Development"], // Changed to array
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
    checklist: [],
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
    scope: ["Development"], // Changed to array
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
    checklist: [],
    followUps: [],
    details: "Implement product search, filtering, and categorization features",
    links: {
      teams: "https://teams.microsoft.com/ecommerce-dev"
    },
    stakeholders: ["Chris Martin", "Product Team", "Marketing"]
  },
  {
    id: "T12",
    scope: ["Testing"], // Changed to array
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
    checklist: [],
    followUps: [],
    details: "Simulate high traffic scenarios and measure response times",
    links: {
      folder: "https://sharepoint.com/load-test-results"
    },
    stakeholders: ["Quality Team", "DevOps", "Performance Team"]
  },
  {
    id: "T13",
    scope: ["Development"], // Changed to array
    project: "Website Redesign",
    environment: "Development",
    taskType: "Development",
    title: "SEO optimization",
    description: "Implement SEO best practices and meta tags",
    status: "Open",
    priority: "Medium",
    responsible: "Sarah Wilson",
    creationDate: "2024-01-25",
    startDate: "2024-02-05",
    dueDate: "2024-02-18",
    duration: 13,
    checklist: [],
    followUps: [],
    details: "Add structured data, optimize page titles, and improve site performance",
    links: {
      file: "https://example.com/seo-guidelines.pdf"
    },
    stakeholders: ["Sarah Wilson", "Marketing Team", "Content Team"]
  },
  {
    id: "T14",
    scope: ["Testing"], // Changed to array
    project: "Website Redesign",
    environment: "Production",
    taskType: "Review",
    title: "Content review and approval",
    description: "Review all website content for accuracy and brand compliance",
    status: "Open",
    priority: "Medium",
    responsible: "Content Team",
    creationDate: "2024-01-28",
    startDate: "2024-02-10",
    dueDate: "2024-02-20",
    duration: 10,
    checklist: [],
    followUps: [],
    details: "Review copy, images, and brand messaging across all pages",
    links: {
      teams: "https://teams.microsoft.com/content-review"
    },
    stakeholders: ["Content Team", "Marketing", "Legal"]
  },
  {
    id: "T15",
    scope: ["Development"], // Changed to array
    project: "Mobile App",
    environment: "Development",
    taskType: "Development",
    title: "Offline functionality",
    description: "Implement offline data caching and sync",
    status: "Open",
    priority: "High",
    responsible: "David Lee",
    creationDate: "2024-01-26",
    startDate: "2024-02-08",
    dueDate: "2024-02-28",
    duration: 20,
    checklist: [],
    followUps: [],
    details: "Enable app functionality without internet connection",
    links: {
      oneNote: "https://example.com/offline-specs"
    },
    stakeholders: ["David Lee", "Mobile Team", "Backend Team"]
  },
  {
    id: "T16",
    scope: ["Documentation"], // Changed to array
    project: "Mobile App",
    environment: "Production",
    taskType: "Documentation",
    title: "App store submission prep",
    description: "Prepare documentation and assets for app store submission",
    status: "On Hold",
    priority: "Low",
    responsible: "Jane Smith",
    creationDate: "2024-01-29",
    startDate: "2024-03-01",
    dueDate: "2024-03-15",
    duration: 14,
    checklist: [],
    followUps: [],
    details: "Screenshots, descriptions, and compliance documentation",
    links: {
      folder: "https://sharepoint.com/app-store-assets"
    },
    stakeholders: ["Jane Smith", "Marketing", "Legal"]
  },
  {
    id: "T17",
    scope: ["Development"], // Changed to array
    project: "Internal Tools",
    environment: "Development",
    taskType: "Development",
    title: "Report generation system",
    description: "Build automated report generation for management",
    status: "In Progress",
    priority: "Medium",
    responsible: "Tom Anderson",
    creationDate: "2024-01-24",
    startDate: "2024-01-30",
    dueDate: "2024-02-22",
    duration: 23,
    checklist: [],
    followUps: [],
    details: "Generate PDF and Excel reports with charts and KPIs",
    links: {
      teams: "https://teams.microsoft.com/reporting-system"
    },
    stakeholders: ["Tom Anderson", "Management", "Finance"]
  },
  {
    id: "T18",
    scope: ["Testing"], // Changed to array
    project: "Internal Tools",
    environment: "Staging",
    taskType: "Testing",
    title: "User acceptance testing",
    description: "Conduct UAT with end users",
    status: "Open",
    priority: "High",
    responsible: "Lisa Garcia",
    creationDate: "2024-01-30",
    startDate: "2024-02-15",
    dueDate: "2024-02-28",
    duration: 13,
    checklist: [],
    followUps: [],
    details: "Test with actual users and gather feedback",
    links: {
      oneNote: "https://example.com/uat-feedback"
    },
    stakeholders: ["Lisa Garcia", "End Users", "Product Team"]
  },
  {
    id: "T19",
    scope: ["Development"], // Changed to array
    project: "E-commerce Platform",
    environment: "Development",
    taskType: "Development",
    title: "Inventory management",
    description: "Build inventory tracking and management system",
    status: "Open",
    priority: "High",
    responsible: "Chris Martin",
    creationDate: "2024-01-28",
    startDate: "2024-02-12",
    dueDate: "2024-03-05",
    duration: 21,
    checklist: [],
    followUps: [],
    details: "Track stock levels, manage suppliers, and automate reordering",
    links: {
      file: "https://example.com/inventory-requirements.pdf"
    },
    stakeholders: ["Chris Martin", "Operations", "Supply Chain"]
  },
  {
    id: "T20",
    scope: ["Development"], // Changed to array
    project: "E-commerce Platform",
    environment: "Production",
    taskType: "Development",
    title: "Customer support chat",
    description: "Integrate live chat support system",
    status: "Open",
    priority: "Medium",
    responsible: "Emma Davis",
    creationDate: "2024-02-01",
    startDate: "2024-02-18",
    dueDate: "2024-03-08",
    duration: 18,
    checklist: [],
    followUps: [],
    details: "Real-time customer support with chat history and file sharing",
    links: {
      teams: "https://teams.microsoft.com/support-integration"
    },
    stakeholders: ["Emma Davis", "Customer Support", "UX Team"]
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
    tasks: ["T1", "T2", "T3", "T13", "T14"],
    scope: ["Development"],
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
    tasks: ["T4", "T5", "T6", "T15", "T16"],
    scope: ["Development"],
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
    tasks: ["T7", "T8", "T9", "T17", "T18"],
    scope: ["Development"],
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
    tasks: ["T10", "T11", "T12", "T19", "T20"],
    scope: ["Development"],
    links: {
      teams: "https://teams.microsoft.com/ecommerce-platform",
      folder: "https://sharepoint.com/ecommerce-docs",
      oneNote: "https://example.com/ecommerce-planning"
    }
  },
  {
    id: "P5",
    name: "Customer Portal Redesign",
    description: "Redesign of the customer portal with enhanced user experience and security",
    owner: "Sarah Connor",
    team: ["John Smith", "Emily Davis", "Sarah Connor"],
    startDate: "2024-01-15",
    endDate: "2024-03-31",
    status: "Active",
    tasks: [],
    scope: ["Frontend"],
    links: {
      oneNote: "https://onenote.com/customer-portal",
      teams: "https://teams.microsoft.com/portal-redesign"
    }
  },
  {
    id: "P6",
    name: "API Integration Platform",
    description: "Secure API gateway and integration platform for third-party services",
    owner: "Michael Rodriguez",
    team: ["Lisa Wang", "David Kim", "Michael Rodriguez"],
    startDate: "2024-02-01",
    endDate: "2024-04-30",
    status: "Active",
    tasks: [],
    scope: ["Backend"],
    links: {
      oneNote: "https://onenote.com/api-platform",
      teams: "https://teams.microsoft.com/api-integration"
    }
  },
  {
    id: "P7",
    name: "Mobile App Launch",
    description: "Native mobile applications for iOS and Android platforms",
    owner: "Jennifer Park",
    team: ["Alex Thompson", "Maria Gonzalez", "Jennifer Park"],
    startDate: "2024-03-01",
    endDate: "2024-06-30",
    status: "Active",
    tasks: [],
    scope: ["Mobile"],
    links: {
      oneNote: "https://onenote.com/mobile-launch",
      teams: "https://teams.microsoft.com/mobile-launch"
    }
  },
  {
    id: "P8",
    name: "Data Analytics Dashboard",
    description: "Advanced analytics dashboard with data ingestion and visualization",
    owner: "Robert Chen",
    team: ["Robert Chen", "Amanda White"],
    startDate: "2024-04-01",
    endDate: "2024-07-31",
    status: "Active",
    tasks: [],
    scope: ["Analytics"],
    links: {
      oneNote: "https://onenote.com/analytics-dashboard",
      teams: "https://teams.microsoft.com/analytics"
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
