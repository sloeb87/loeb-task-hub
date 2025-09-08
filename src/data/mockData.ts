import { Task, Project } from "@/types/task";

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockTasks: Task[] = [
  {
    id: "T001", // Changed to task number as primary ID
    uuid: "550e8400-e29b-41d4-a716-446655440001", // Added UUID for database operations
    scope: ["User Management"], // Changed to array
    project: "Website Redesign",
    environment: "Production",
    taskType: "Development",
    title: "Implement user authentication system",
    description: "Create a secure login system with user registration, password reset, and session management",
    status: "In Progress",
    priority: "High",
    responsible: "John Doe",
    creationDate: "2024-01-15",
    startDate: "2024-01-16",
    dueDate: "2024-02-15",
    plannedTimeHours: 40,
    followUps: [],
    checklist: [],
    details: "Create secure authentication system with JWT tokens and password encryption",
    links: {
      oneNote: [{id: generateId(), name: 'Auth Notes', url: 'https://example.com/auth-notes'}],
      teams: [{id: generateId(), name: 'Auth Team', url: 'https://teams.microsoft.com/auth-team'}],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["John Doe", "Jane Smith", "Security Team"]
  },
  {
    id: "T002", // Changed to task number as primary ID
    uuid: "550e8400-e29b-41d4-a716-446655440002", // Added UUID for database operations
    scope: ["Database", "API"], // Changed to array
    project: "Website Redesign",
    environment: "Development",
    taskType: "Development",
    title: "Database schema optimization",
    description: "Optimize database queries and improve indexing for better performance",
    status: "Open",
    priority: "Medium",
    responsible: "Jane Smith",
    creationDate: "2024-01-20",
    startDate: "2024-01-22",
    dueDate: "2024-02-20",
    plannedTimeHours: 25,
    followUps: [],
    checklist: [],
    details: "Focus on query optimization and proper indexing strategies",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [{id: generateId(), name: 'DB Schema', url: 'https://example.com/db-schema'}],
      folder: []
    },
    stakeholders: ["Jane Smith", "Database Team"]
  },
  {
    id: "T003", // Changed to task number as primary ID
    uuid: "550e8400-e29b-41d4-a716-446655440003", // Added UUID for database operations
    scope: ["UI/UX"], // Changed to array
    project: "Mobile App",
    environment: "Design",
    taskType: "Development",
    title: "Mobile app wireframes",
    description: "Create comprehensive wireframes for all mobile app screens",
    status: "Completed",
    priority: "High",
    responsible: "Mike Johnson",
    creationDate: "2024-01-10",
    startDate: "2024-01-12",
    dueDate: "2024-01-30",
    completionDate: "2024-01-28",
    plannedTimeHours: 30,
    followUps: [],
    checklist: [],
    details: "Include user flow diagrams and interaction specifications",
    links: {
      oneNote: [],
      teams: [],
      email: [{id: generateId(), name: 'Design Review', url: 'mike@example.com'}],
      file: [],
      folder: []
    },
    stakeholders: ["Mike Johnson", "Design Team", "Product Manager"]
  },
  {
    id: "T004", // Changed to task number as primary ID
    uuid: "550e8400-e29b-41d4-a716-446655440004", // Added UUID for database operations
    scope: ["API", "Integration"], // Changed to array
    project: "API Integration",
    environment: "Testing",
    taskType: "Testing",
    title: "Third-party API integration testing",
    description: "Test integration with payment gateway and external services",
    status: "In Progress",
    priority: "Critical",
    responsible: "Sarah Wilson",
    creationDate: "2024-01-25",
    startDate: "2024-01-26",
    dueDate: "2024-02-10",
    plannedTimeHours: 35,
    followUps: [],
    checklist: [],
    details: "Test both success and failure scenarios thoroughly",
    links: {
      oneNote: [{id: generateId(), name: 'API Test Notes', url: 'https://example.com/api-tests'}],
      teams: [{id: generateId(), name: 'Integration Team', url: 'https://teams.microsoft.com/integration'}],
      email: [],
      file: [{id: generateId(), name: 'Test Cases', url: 'https://example.com/test-cases'}],
      folder: []
    },
    stakeholders: ["Sarah Wilson", "QA Team", "Backend Team"]
  },
  {
    id: "T005", // Changed to task number as primary ID
    uuid: "550e8400-e29b-41d4-a716-446655440005", // Added UUID for database operations
    scope: ["Documentation"], // Changed to array
    project: "Website Redesign",
    environment: "Documentation",
    taskType: "Documentation",
    title: "User manual creation",
    description: "Create comprehensive user documentation and help guides",
    status: "Open",
    priority: "Low",
    responsible: "Tom Brown",
    creationDate: "2024-02-01",
    startDate: "2024-02-05",
    dueDate: "2024-02-25",
    plannedTimeHours: 20,
    followUps: [],
    checklist: [],
    details: "Include screenshots and step-by-step instructions",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: [{id: generateId(), name: 'Documentation Folder', url: 'https://sharepoint.com/docs'}]
    },
    stakeholders: ["Tom Brown", "Technical Writing Team"]
  },
  {
    id: "6",
    scope: ["Security", "Testing"], // Changed to array
    project: "Mobile App",
    environment: "Security Testing",
    taskType: "Testing",
    title: "Security vulnerability assessment",
    description: "Conduct comprehensive security testing and vulnerability assessment",
    status: "On Hold",
    priority: "High",
    responsible: "Alice Green",
    creationDate: "2024-02-03",
    startDate: "2024-02-10",
    dueDate: "2024-02-28",
    plannedTimeHours: 45,
    followUps: [],
    checklist: [],
    details: "Include penetration testing and code review",
    links: {
      oneNote: [{id: generateId(), name: 'Security Report', url: 'https://example.com/security-report'}],
      teams: [{id: generateId(), name: 'Security Team', url: 'https://teams.microsoft.com/security'}],
      email: [{id: generateId(), name: 'Security Lead', url: 'alice@example.com'}],
      file: [{id: generateId(), name: 'Vulnerability Report', url: 'https://example.com/vuln-report'}],
      folder: []
    },
    stakeholders: ["Alice Green", "Security Team", "DevOps Team"]
  },
  {
    id: "7",
    scope: ["Performance"], // Changed to array
    project: "API Integration",
    environment: "Production",
    taskType: "Development",
    title: "Performance optimization",
    description: "Optimize application performance and reduce load times",
    status: "In Progress",
    priority: "Medium",
    responsible: "Bob Davis",
    creationDate: "2024-01-28",
    startDate: "2024-02-01",
    dueDate: "2024-02-18",
    plannedTimeHours: 32,
    followUps: [],
    checklist: [],
    details: "Focus on database queries and caching strategies",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Bob Davis", "Performance Team"]
  },
  {
    id: "8",
    scope: ["Analytics"], // Changed to array
    project: "Website Redesign",
    environment: "Production",
    taskType: "Development",
    title: "Analytics implementation",
    description: "Implement Google Analytics and custom tracking events",
    status: "Open",
    priority: "Medium",
    responsible: "Carol White",
    creationDate: "2024-02-05",
    startDate: "2024-02-12",
    dueDate: "2024-02-26",
    plannedTimeHours: 18,
    followUps: [],
    checklist: [],
    details: "Include conversion tracking and user behavior analysis",
    links: {
      oneNote: [{id: generateId(), name: 'Analytics Setup', url: 'https://example.com/analytics-setup'}],
      teams: [{id: generateId(), name: 'Analytics Team', url: 'https://teams.microsoft.com/analytics'}],
      email: [],
      file: [{id: generateId(), name: 'Tracking Plan', url: 'https://example.com/tracking-plan'}],
      folder: []
    },
    stakeholders: ["Carol White", "Marketing Team", "Data Team"]
  },
  {
    id: "9",
    scope: ["Deployment"], // Changed to array
    project: "Mobile App",
    environment: "Production",
    taskType: "Development",
    title: "CI/CD pipeline setup",
    description: "Set up continuous integration and deployment pipeline",
    status: "In Progress",
    priority: "High",
    responsible: "David Lee",
    creationDate: "2024-01-18",
    startDate: "2024-01-20",
    dueDate: "2024-02-08",
    plannedTimeHours: 28,
    followUps: [],
    checklist: [],
    details: "Include automated testing and deployment to staging/production",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["David Lee", "DevOps Team"]
  },
  {
    id: "10",
    scope: ["Monitoring"], // Changed to array
    project: "API Integration",
    environment: "Production",
    taskType: "Development",
    title: "Monitoring and alerting setup",
    description: "Implement comprehensive monitoring and alerting system",
    status: "Open",
    priority: "Medium",
    responsible: "Eva Martinez",
    creationDate: "2024-02-08",
    startDate: "2024-02-15",
    dueDate: "2024-03-01",
    plannedTimeHours: 22,
    followUps: [],
    checklist: [],
    details: "Include application metrics, logs, and infrastructure monitoring",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Eva Martinez", "SRE Team", "Operations Team"]
  },
  {
    id: "11",
    scope: ["User Experience"], // Changed to array
    project: "Website Redesign",
    environment: "Design",
    taskType: "Research",
    title: "User experience research",
    description: "Conduct user interviews and usability testing",
    status: "Completed",
    priority: "High",
    responsible: "Frank Taylor",
    creationDate: "2024-01-05",
    startDate: "2024-01-08",
    dueDate: "2024-01-25",
    completionDate: "2024-01-24",
    plannedTimeHours: 35,
    followUps: [],
    checklist: [],
    details: "Include both qualitative and quantitative research methods",
    links: {
      oneNote: [{id: generateId(), name: 'UX Research', url: 'https://example.com/ux-research'}],
      teams: [{id: generateId(), name: 'UX Team', url: 'https://teams.microsoft.com/ux'}],
      email: [{id: generateId(), name: 'Research Results', url: 'frank@example.com'}],
      file: [{id: generateId(), name: 'Research Report', url: 'https://example.com/research-report'}],
      folder: [{id: generateId(), name: 'UX Assets', url: 'https://sharepoint.com/ux'}]
    },
    stakeholders: ["Frank Taylor", "UX Team", "Product Manager"]
  },
  {
    id: "12",
    scope: ["Content"], // Changed to array
    project: "Mobile App",
    environment: "Content",
    taskType: "Documentation",
    title: "Content strategy development",
    description: "Develop comprehensive content strategy and guidelines",
    status: "In Progress",
    priority: "Medium",
    responsible: "Grace Kim",
    creationDate: "2024-01-30",
    startDate: "2024-02-02",
    dueDate: "2024-02-22",
    plannedTimeHours: 25,
    followUps: [],
    checklist: [],
    details: "Include tone of voice, style guide, and content calendar",
    links: {
      oneNote: [{id: generateId(), name: 'Content Strategy', url: 'https://example.com/content-strategy'}],
      teams: [{id: generateId(), name: 'Content Team', url: 'https://teams.microsoft.com/content'}],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Grace Kim", "Content Team", "Marketing Team"]
  },
  {
    id: "13",
    scope: ["Accessibility"], // Changed to array
    project: "Website Redesign",
    environment: "Testing",
    taskType: "Testing",
    title: "Accessibility compliance testing",
    description: "Ensure website meets WCAG 2.1 AA accessibility standards",
    status: "Open",
    priority: "Medium",
    responsible: "Henry Chen",
    creationDate: "2024-02-10",
    startDate: "2024-02-17",
    dueDate: "2024-03-05",
    plannedTimeHours: 30,
    followUps: [],
    checklist: [],
    details: "Include screen reader testing and keyboard navigation",
    links: {
      oneNote: [{id: generateId(), name: 'A11y Testing', url: 'https://example.com/a11y-testing'}],
      teams: [{id: generateId(), name: 'A11y Team', url: 'https://teams.microsoft.com/a11y'}],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Henry Chen", "QA Team", "Legal Team"]
  },
  {
    id: "14",
    scope: ["Localization"], // Changed to array
    project: "Mobile App",
    environment: "Development",
    taskType: "Development",
    title: "Multi-language support implementation",
    description: "Implement internationalization and localization features",
    status: "Open",
    priority: "Low",
    responsible: "Isabel Rodriguez",
    creationDate: "2024-02-12",
    startDate: "2024-02-20",
    dueDate: "2024-03-15",
    plannedTimeHours: 40,
    followUps: [],
    checklist: [],
    details: "Support for English, Spanish, French, and German",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Isabel Rodriguez", "Localization Team"]
  },
  {
    id: "15",
    scope: ["Backup"], // Changed to array
    project: "API Integration",
    environment: "Production",
    taskType: "Development",
    title: "Backup and disaster recovery",
    description: "Implement automated backup and disaster recovery procedures",
    status: "Open",
    priority: "High",
    responsible: "Jack Thompson",
    creationDate: "2024-02-14",
    startDate: "2024-02-21",
    dueDate: "2024-03-10",
    plannedTimeHours: 35,
    followUps: [],
    checklist: [],
    details: "Include both data backup and infrastructure recovery",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Jack Thompson", "Infrastructure Team", "Security Team"]
  },
  {
    id: "rec-1",
    scope: ["Daily Standup"], // Changed to array
    project: "Team Management",
    environment: "Meeting",
    taskType: "Meeting",
    title: "Daily Standup Meeting",
    description: "Daily team standup to discuss progress and blockers",
    status: "Open",
    priority: "Medium",
    responsible: "Team Lead",
    creationDate: "2024-02-01",
    startDate: "2024-02-01",
    dueDate: "2024-02-01",
    plannedTimeHours: 0.5,
    followUps: [],
    checklist: [],
    details: "15-minute daily sync meeting",
    links: {
      oneNote: [{id: generateId(), name: 'Meeting Notes', url: 'https://example.com/standup-notes'}],
      teams: [{id: generateId(), name: 'Standup Room', url: 'https://teams.microsoft.com/standup'}],
      email: [{id: generateId(), name: 'Team Email', url: 'team@example.com'}],
      file: [],
      folder: []
    },
    stakeholders: ["Development Team"],
    isRecurring: true,
    recurrenceType: 'daily',
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [1,2,3,4,5], // Monday-Friday
    recurrenceEndDate: "2024-12-31"
  },
  {
    id: "rec-2",
    scope: ["Sprint Planning"], // Changed to array
    project: "Team Management",
    environment: "Meeting",
    taskType: "Meeting",
    title: "Sprint Planning Meeting",
    description: "Biweekly sprint planning session",
    status: "Open",
    priority: "High",
    responsible: "Scrum Master",
    creationDate: "2024-02-01",
    startDate: "2024-02-01",
    dueDate: "2024-02-01",
    plannedTimeHours: 2,
    followUps: [],
    checklist: [],
    details: "Plan upcoming sprint backlog and capacity",
    links: {
      oneNote: [{id: generateId(), name: 'Sprint Plan', url: 'https://example.com/sprint-plan'}],
      teams: [{id: generateId(), name: 'Planning Room', url: 'https://teams.microsoft.com/planning'}],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Development Team", "Product Owner"],
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceInterval: 2,
    recurrenceEndDate: "2024-12-31"
  },
  {
    id: "rec-3",
    scope: ["Code Review"], // Changed to array
    project: "Code Quality",
    environment: "Development",
    taskType: "Review",
    title: "Weekly Code Review Session",
    description: "Weekly code review and knowledge sharing session",
    status: "Open",
    priority: "Medium",
    responsible: "Senior Developer",
    creationDate: "2024-02-01",
    startDate: "2024-02-01",
    dueDate: "2024-02-01",
    plannedTimeHours: 1,
    followUps: [],
    checklist: [],
    details: "Review recent code changes and share best practices",
    links: {
      oneNote: [{id: generateId(), name: 'Code Review Notes', url: 'https://example.com/code-review'}],
      teams: [{id: generateId(), name: 'Dev Room', url: 'https://teams.microsoft.com/dev'}],
      email: [],
      file: [],
      folder: []
    },
    stakeholders: ["Development Team"],
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [5], // Friday
    recurrenceEndDate: "2024-12-31"
  }
];

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX",
    owner: "Alice Johnson",
    team: ["John Doe", "Jane Smith", "Mike Johnson"],
    startDate: "2024-01-01",
    endDate: "2024-04-30",
    status: "Active",
    tasks: ["1", "5", "8", "11", "13"],
    scope: ["Frontend", "Backend", "Design"], // Changed to array
    cost_center: "Marketing",
    links: {
      oneNote: [{id: generateId(), name: 'Project Notes', url: 'https://example.com/project-notes'}],
      teams: [{id: generateId(), name: 'Project Team', url: 'https://teams.microsoft.com/project'}],
      email: [],
      file: [],
      folder: []
    }
  },
  {
    id: "2",
    name: "Mobile App",
    description: "Development of a new mobile application for iOS and Android",
    owner: "Bob Smith",
    team: ["Sarah Wilson", "Mike Johnson", "Alice Green"],
    startDate: "2024-02-01",
    endDate: "2024-07-31",
    status: "Active",
    tasks: ["3", "6", "9", "12", "14"],
    scope: ["Mobile Development", "UI/UX", "API"], // Changed to array
    cost_center: "Product Development",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    }
  },
  {
    id: "3",
    name: "API Integration",
    description: "Integration with third-party APIs and services",
    owner: "Carol Davis",
    team: ["Tom Brown", "Sarah Wilson", "Bob Davis"],
    startDate: "2024-01-15",
    endDate: "2024-05-15",
    status: "Active",
    tasks: ["4", "7", "10", "15"],
    scope: ["Backend", "API", "Integration"], // Changed to array
    cost_center: "Engineering",
    links: {
      oneNote: [],
      teams: [],
      email: [],
      file: [],
      folder: []
    }
  }
];