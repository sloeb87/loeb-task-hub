import React, { Fragment } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectRow } from './ProjectRow';
import { TaskRow } from './TaskRow';
import { FollowUpRow } from './FollowUpRow';

interface FollowUpTableProps {
  groupedFollowUps: Record<string, Record<string, any[]>>;
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
          {Object.entries(groupedFollowUps).map(([projectName, tasks]) => (
            <Fragment key={projectName}>
              {/* Project Header Row */}
              <ProjectRow
                projectName={projectName}
                isExpanded={expandedProjects.has(projectName)}
                firstFollowUpScope={Object.values(tasks)[0][0].taskScope}
                onToggle={onToggleProjectExpansion}
                getScopeStyle={getScopeStyle}
              />
              
              {/* Task and Follow-up Rows - only show if project is expanded */}
              {expandedProjects.has(projectName) && 
                Object.entries(tasks).map(([taskTitle, followUps]) => (
                  <Fragment key={`${projectName}-${taskTitle}`}>
                    {/* Task Header Row */}
                    <TaskRow
                      projectName={projectName}
                      taskTitle={taskTitle}
                      isExpanded={expandedTasks.has(`${projectName}-${taskTitle}`)}
                      taskType={followUps[0].taskType}
                      taskEnvironment={followUps[0].taskEnvironment}
                      onToggle={onToggleTaskExpansion}
                      getTaskTypeStyle={getTaskTypeStyle}
                      getEnvironmentStyle={getEnvironmentStyle}
                    />
                    
                    {/* Follow-up Rows - only show if task is expanded */}
                    {expandedTasks.has(`${projectName}-${taskTitle}`) && 
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
                  </Fragment>
                ))
              }
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};