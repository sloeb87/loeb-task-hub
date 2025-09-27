import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { ProjectRow } from './ProjectRow';
import { TaskRow } from './TaskRow';
import { FollowUpRow } from './FollowUpRow';

interface FollowUpTableProps {
  groupedFollowUps: Record<string, Record<string, Record<string, Record<string, any[]>>>>;
  expandedProjects: Set<string>;
  expandedTasks: Set<string>;
  editingFollowUp: string | null;
  editingText: string;
  editingTimestamp: string;
  FilterableHeader: React.ComponentType<{ filterType: string; children: React.ReactNode }>;
  onToggleProjectExpansion: (projectName: string) => void;
  onToggleTaskExpansion: (projectName: string, taskTitle: string) => void;
  onRowClick: (followUp: any, event: React.MouseEvent) => void;
  onEditClick: (followUp: any, event: React.MouseEvent) => void;
  onSaveEdit: (event: React.MouseEvent) => void;
  onCancelEdit: (event: React.MouseEvent) => void;
  onEditingTextChange: (value: string) => void;
  onEditingTimestampChange: (value: string) => void;
  getScopeStyle: (scope: string) => object;
  getTaskTypeStyle: (type: string) => object;
  getEnvironmentStyle: (environment: string) => object;
  getStatusStyle: (status: string) => object;
}

export const FollowUpTable: React.FC<FollowUpTableProps> = ({
  groupedFollowUps,
  expandedProjects,
  expandedTasks,
  editingFollowUp,
  editingText,
  editingTimestamp,
  FilterableHeader,
  onToggleProjectExpansion,
  onToggleTaskExpansion,
  onRowClick,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onEditingTextChange,
  onEditingTimestampChange,
  getScopeStyle,
  getTaskTypeStyle,
  getEnvironmentStyle,
  getStatusStyle
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <FilterableHeader filterType="date">Date</FilterableHeader>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Follow-Up</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedFollowUps).map(([weekName, scopes]) => (
            <React.Fragment key={weekName}>
              {/* Week Header Row */}
              <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                <TableCell colSpan={4} className="py-3 px-4 text-lg">
                  📅 {weekName}
                </TableCell>
              </TableRow>
              
              {Object.entries(scopes).map(([scopeName, projects]) => (
                <React.Fragment key={`${weekName}-${scopeName}`}>
                  {/* Scope Header Row */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableCell colSpan={4} className="py-2 px-6">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={getScopeStyle(scopeName)}></span>
                        <span className="font-medium">{scopeName}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                  
                  {Object.entries(projects).map(([projectName, tasks]) => (
                    <React.Fragment key={`${weekName}-${scopeName}-${projectName}`}>
                      {/* Project Header Row */}
                      <ProjectRow
                        projectName={projectName}
                        isExpanded={expandedProjects.has(`${weekName}-${scopeName}-${projectName}`)}
                        firstFollowUpScope={scopeName}
                        onToggle={() => onToggleProjectExpansion(`${weekName}-${scopeName}-${projectName}`)}
                        getScopeStyle={getScopeStyle}
                      />
                      
                      {/* Task and Follow-up Rows - only show if project is expanded */}
                      {expandedProjects.has(`${weekName}-${scopeName}-${projectName}`) && 
                        Object.entries(tasks).map(([taskTitle, followUps]) => (
                          <React.Fragment key={`${weekName}-${scopeName}-${projectName}-${taskTitle}`}>
                            {/* Task Row with Condensed Follow-ups */}
                            <TableRow className="border-l-4 border-l-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900">
                              <TableCell colSpan={4} className="py-4 px-8">
                                <div className="space-y-3">
                                  {/* Task Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <button 
                                        onClick={() => onToggleTaskExpansion(`${weekName}-${scopeName}-${projectName}`, taskTitle)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {expandedTasks.has(`${weekName}-${scopeName}-${projectName}-${taskTitle}`) ? '▼' : '▶'}
                                      </button>
                                      <span className="font-medium text-gray-900 dark:text-white">{taskTitle}</span>
                                      <span className="px-2 py-1 text-xs rounded-full" style={getTaskTypeStyle(followUps[0].taskType)}>
                                        {followUps[0].taskType}
                                      </span>
                                      <span className="px-2 py-1 text-xs rounded-full" style={getEnvironmentStyle(followUps[0].taskEnvironment)}>
                                        {followUps[0].taskEnvironment}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-500">{followUps.length} follow-ups</span>
                                  </div>
                                  
                                  {/* Condensed Follow-ups - only show if task is expanded */}
                                  {expandedTasks.has(`${weekName}-${scopeName}-${projectName}-${taskTitle}`) && (
                                    <div className="ml-8 space-y-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                                      {followUps.map(followUp => (
                                        <div 
                                          key={`${followUp.taskId}-${followUp.id}`}
                                          className="flex items-start justify-between gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                                          onClick={(e) => onRowClick(followUp, e)}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs text-gray-500">
                                                {new Date(followUp.timestamp).toLocaleDateString()} {new Date(followUp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                              <span className="px-1.5 py-0.5 text-xs rounded-full" style={getStatusStyle(followUp.taskStatus)}>
                                                {followUp.taskStatus}
                                              </span>
                                            </div>
                                            {editingFollowUp === followUp.id ? (
                                              <div className="space-y-2">
                                                <textarea
                                                  value={editingText}
                                                  onChange={(e) => onEditingTextChange(e.target.value)}
                                                  className="w-full p-2 text-sm border rounded resize-none"
                                                  rows={3}
                                                />
                                                <input
                                                  type="datetime-local"
                                                  value={editingTimestamp}
                                                  onChange={(e) => onEditingTimestampChange(e.target.value)}
                                                  className="text-xs border rounded px-2 py-1"
                                                />
                                                <div className="flex gap-2">
                                                  <button onClick={onSaveEdit} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Save</button>
                                                  <button onClick={onCancelEdit} className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {followUp.text}
                                              </p>
                                            )}
                                          </div>
                                          {editingFollowUp !== followUp.id && (
                                            <button
                                              onClick={(e) => onEditClick(followUp, e)}
                                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))
                      }
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};