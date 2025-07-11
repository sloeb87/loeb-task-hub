
import { Task } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "T1",
    scope: "Customer Portal",
    project: "E-Commerce Platform",
    environment: "Production",
    taskType: "Development",
    title: "Implement User Authentication System",
    description: "Design and implement secure user authentication with multi-factor authentication support",
    status: "In Progress",
    priority: "High",
    responsible: "John Smith",
    creationDate: "2024-01-15",
    dueDate: "2024-02-15",
    followUps: [
      {
        id: "T1-F1",
        text: "Initial research completed. OAuth2 integration preferred approach.",
        timestamp: "2024-01-20T10:30:00Z",
        author: "John Smith"
      },
      {
        id: "T1-F2",
        text: "Need to clarify MFA requirements with security team.",
        timestamp: "2024-01-22T14:15:00Z",
        author: "Jane Doe"
      }
    ],
    details: "This task involves implementing a comprehensive authentication system including social login options, password reset functionality, and session management.",
    links: {
      oneNote: "https://onenote.com/auth-specs",
      teams: "https://teams.microsoft.com/auth-channel",
      email: "mailto:team@company.com?subject=Auth%20Task",
      file: "https://sharepoint.com/auth-requirements.pdf",
      folder: "https://sharepoint.com/projects/auth"
    },
    stakeholders: ["Security Team", "UX Design", "Product Manager"]
  },
  {
    id: "T2",
    scope: "Admin Dashboard",
    project: "E-Commerce Platform",
    environment: "Testing",
    taskType: "Testing",
    title: "Performance Testing for Dashboard",
    description: "Conduct comprehensive performance testing for the admin dashboard under various load conditions",
    status: "Open",
    priority: "Medium",
    responsible: "Alice Johnson",
    creationDate: "2024-01-18",
    dueDate: "2024-02-01",
    followUps: [],
    details: "Focus on response times, memory usage, and concurrent user handling. Test with up to 1000 concurrent users.",
    links: {
      folder: "https://sharepoint.com/testing/performance"
    },
    stakeholders: ["DevOps Team", "Product Manager"]
  },
  {
    id: "T3",
    scope: "API Integration",
    project: "Mobile App",
    environment: "Development",
    taskType: "Development",
    title: "Integrate Payment Gateway API",
    description: "Integrate Stripe payment gateway for mobile app purchases",
    status: "Completed",
    priority: "Critical",
    responsible: "Mike Wilson",
    creationDate: "2024-01-10",
    dueDate: "2024-01-25",
    completionDate: "2024-01-24",
    followUps: [
      {
        id: "T3-F1",
        text: "Integration completed successfully. All tests passing.",
        timestamp: "2024-01-24T16:00:00Z",
        author: "Mike Wilson"
      }
    ],
    details: "Implementation includes error handling, webhook processing, and refund capabilities.",
    links: {
      teams: "https://teams.microsoft.com/payments-channel",
      file: "https://sharepoint.com/stripe-integration-guide.pdf"
    },
    stakeholders: ["Finance Team", "Mobile Team Lead"]
  },
  {
    id: "T4",
    scope: "User Experience",
    project: "Website Redesign",
    environment: "Staging",
    taskType: "Review",
    title: "UX Review for Homepage",
    description: "Conduct comprehensive UX review of the new homepage design",
    status: "Open",
    priority: "High",
    responsible: "Sarah Davis",
    creationDate: "2024-01-20",
    dueDate: "2024-01-30",
    followUps: [],
    details: "Review should cover accessibility, mobile responsiveness, and conversion optimization.",
    links: {
      oneNote: "https://onenote.com/ux-review-notes"
    },
    stakeholders: ["Design Team", "Marketing Team", "Accessibility Expert"]
  },
  {
    id: "T5",
    scope: "Documentation",
    project: "API Platform",
    environment: "Production",
    taskType: "Documentation",
    title: "Update API Documentation",
    description: "Update REST API documentation with new endpoints and authentication changes",
    status: "In Progress",
    priority: "Medium",
    responsible: "David Brown",
    creationDate: "2024-01-12",
    dueDate: "2024-02-10",
    followUps: [
      {
        id: "T5-F1",
        text: "Started documenting new authentication endpoints. 60% complete.",
        timestamp: "2024-01-25T11:00:00Z",
        author: "David Brown"
      }
    ],
    details: "Include code examples, error responses, and rate limiting information.",
    links: {
      file: "https://sharepoint.com/api-docs-template.docx",
      folder: "https://sharepoint.com/documentation"
    },
    stakeholders: ["Developer Relations", "Support Team"]
  },
  {
    id: "T6",
    scope: "Infrastructure",
    project: "Cloud Migration",
    environment: "Production",
    taskType: "Development",
    title: "Database Migration to Cloud",
    description: "Migrate on-premise database to AWS RDS with minimal downtime",
    status: "On Hold",
    priority: "Critical",
    responsible: "Robert Garcia",
    creationDate: "2024-01-05",
    dueDate: "2024-01-28",
    followUps: [
      {
        id: "T6-F1",
        text: "Waiting for budget approval and security clearance.",
        timestamp: "2024-01-26T09:00:00Z",
        author: "Robert Garcia"
      }
    ],
    details: "Requires careful planning for data synchronization and rollback procedures.",
    links: {
      teams: "https://teams.microsoft.com/cloud-migration",
      folder: "https://sharepoint.com/migration-plans"
    },
    stakeholders: ["DevOps Team", "Database Admin", "Security Team", "Finance"]
  },
  {
    id: "T7",
    scope: "Bug Fix",
    project: "Mobile App",
    environment: "Production",
    taskType: "Development",
    title: "Fix Cart Calculation Bug",
    description: "Resolve issue where tax calculations are incorrect for international orders",
    status: "Completed",
    priority: "Critical",
    responsible: "Lisa Anderson",
    creationDate: "2024-01-22",
    dueDate: "2024-01-25",
    completionDate: "2024-01-25",
    followUps: [
      {
        id: "T7-F1",
        text: "Bug identified in tax calculation logic for non-US addresses.",
        timestamp: "2024-01-23T13:30:00Z",
        author: "Lisa Anderson"
      },
      {
        id: "T7-F2",
        text: "Fix deployed and verified in production. All tests passing.",
        timestamp: "2024-01-25T17:45:00Z",
        author: "Lisa Anderson"
      }
    ],
    details: "Critical bug affecting international customers during checkout process.",
    links: {
      email: "mailto:support@company.com?subject=Cart%20Bug%20Update"
    },
    stakeholders: ["Support Team", "International Sales"]
  },
  {
    id: "T8",
    scope: "Feature Development",
    project: "CRM System",
    environment: "Development",
    taskType: "Development",
    title: "Implement Lead Scoring Algorithm",
    description: "Develop automated lead scoring system based on customer behavior and demographics",
    status: "Open",
    priority: "Medium",
    responsible: "James Taylor",
    creationDate: "2024-01-25",
    dueDate: "2024-03-15",
    followUps: [],
    details: "Algorithm should consider website activity, email engagement, and company size factors.",
    links: {
      oneNote: "https://onenote.com/lead-scoring-requirements",
      teams: "https://teams.microsoft.com/crm-development"
    },
    stakeholders: ["Sales Team", "Marketing Team", "Data Science Team"]
  }
];
