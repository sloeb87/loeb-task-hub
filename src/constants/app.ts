/**
 * Application constants to reduce magic strings and improve maintainability
 */

// Task statuses
export const TASK_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress', 
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold'
} as const;

// Project statuses
export const PROJECT_STATUSES = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed'
} as const;

// Task priorities
export const TASK_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
} as const;

// View types
export const VIEW_TYPES = {
  TASKS: 'tasks',
  PROJECTS: 'projects',
  TIME_TRACKING: 'timetracking',
  FOLLOW_UPS: 'followups'
} as const;

// Filter types
export const FILTER_TYPES = {
  ALL: 'all',
  OPEN: 'open',
  IN_PROGRESS: 'inprogress',
  ACTIVE: 'active',
  ON_HOLD: 'onhold',
  CRITICAL: 'critical'
} as const;

// Project filter types
export const PROJECT_FILTER_TYPES = {
  ALL: 'all',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  COMPLETED: 'completed'
} as const;

// Color utilities
export const DEFAULT_COLOR = '#6b7280';

// Time constants
export const TIME_CONSTANTS = {
  DAYS_IN_WEEK: 7,
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_MINUTE: 60,
  MS_IN_SECOND: 1000,
  MS_IN_DAY: 1000 * 60 * 60 * 24
} as const;

// Date range constants
export const DATE_RANGES = {
  OVERDUE_THRESHOLD: 0,
  WARNING_THRESHOLD: 3,
  CAUTION_THRESHOLD: 7
} as const;

// UI constants
export const UI_CONSTANTS = {
  OPACITY_BACKGROUND: '20', // for 20% opacity
  DEFAULT_PAGE_SIZE: 50,
  MOBILE_BREAKPOINT: 768
} as const;