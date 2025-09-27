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
                            {/* Task Header Row */}
                            <TaskRow
                              projectName={`${weekName}-${scopeName}-${projectName}`}
                              taskTitle={taskTitle}
                              isExpanded={expandedTasks.has(`${weekName}-${scopeName}-${projectName}-${taskTitle}`)}
                              taskType={followUps[0].taskType}
                              taskEnvironment={followUps[0].taskEnvironment}
                              onToggle={() => onToggleTaskExpansion(`${weekName}-${scopeName}-${projectName}`, taskTitle)}
                              getTaskTypeStyle={getTaskTypeStyle}
                              getEnvironmentStyle={getEnvironmentStyle}
                            />
                            
                            {/* Follow-up Rows - only show if task is expanded */}
                            {expandedTasks.has(`${weekName}-${scopeName}-${projectName}-${taskTitle}`) && 
                              followUps.map(followUp => (
                                <FollowUpRow
                                  key={`${followUp.taskId}-${followUp.id}`}
                                  followUp={followUp}
                                  isEditing={editingFollowUp === followUp.id}
                                  editingText={editingText}
                                  editingTimestamp={editingTimestamp}
                                  onRowClick={onRowClick}
                                  onEditClick={onEditClick}
                                  onSaveEdit={onSaveEdit}
                                  onCancelEdit={onCancelEdit}
                                  onEditingTextChange={onEditingTextChange}
                                  onEditingTimestampChange={onEditingTimestampChange}
                                  getStatusStyle={getStatusStyle}
                                />
                              ))
                            }
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