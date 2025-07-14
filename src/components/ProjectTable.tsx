import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, ChevronUp, ChevronDown, Plus, Edit, FileBarChart } from "lucide-react";
import { Project, Task } from "@/types/task";


interface ProjectTableProps {
  projects: Project[];
  tasks: Task[];
  onEditProject: (project: Project) => void;
  onCreateTask: (projectId: string) => void;
  onAddTaskToProject: (projectId: string) => void;
  onGenerateReport?: (project: Project) => void;
}

type SortField = 'name' | 'owner' | 'startDate' | 'endDate' | 'status';
type SortDirection = 'asc' | 'desc';

export const ProjectTable = ({ projects, tasks, onEditProject, onCreateTask, onAddTaskToProject, onGenerateReport }: ProjectTableProps) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks: projectTasks.filter(task => 
        task.status !== 'Completed' && new Date(task.dueDate) < new Date()
      ).length,
      projectTasks
    };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];

    if (sortField === 'startDate' || sortField === 'endDate') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-3 h-3" /> : 
            <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const toggleExpanded = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const handleRowClick = (project: Project) => {
    onEditProject(project);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                {/* Expand/Collapse */}
              </th>
              <SortableHeader field="name">Project Name</SortableHeader>
              <SortableHeader field="owner">Owner & Team</SortableHeader>
              <SortableHeader field="status">Status & Progress</SortableHeader>
              <SortableHeader field="startDate">Timeline</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProjects.map((project) => {
              const stats = getProjectStats(project);
              const isExpanded = expandedProject === project.id;
              
              return (
                <React.Fragment key={project.id}>
                  <tr 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(project)}
                  >
                    <td className="px-4 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-6 w-6"
                        onClick={(e) => toggleExpanded(project.id, e)}
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                      </Button>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{project.description}</p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{project.owner}</span>
                        </div>
                        <p className="text-xs text-gray-500">{project.team.length} team members</p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={
                            project.status === 'Active' ? 'default' :
                            project.status === 'Completed' ? 'secondary' : 'outline'
                          }>
                            {project.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {stats.completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                        <div className="text-xs text-gray-500">
                          {stats.completedTasks}/{stats.totalTasks} tasks
                          {stats.overdueTasks > 0 && (
                            <span className="text-red-600 ml-1">({stats.overdueTasks} overdue)</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{project.startDate}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          to {project.endDate}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-blue-100"
                          onClick={(e) => handleActionClick(e, () => onCreateTask(project.id))}
                          title="Create New Task"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-6 w-6 hover:bg-green-100"
                          onClick={(e) => handleActionClick(e, () => onAddTaskToProject(project.id))}
                          title="Add Existing Task"
                        >
                          <Edit className="w-3 h-3 text-green-600" />
                        </Button>
                        {onGenerateReport && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1 h-6 w-6 hover:bg-purple-100"
                            onClick={(e) => handleActionClick(e, () => onGenerateReport(project))}
                            title="Generate Report"
                          >
                            <FileBarChart className="w-3 h-3 text-purple-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row - Task List */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Project Tasks</h4>
                            {stats.projectTasks.length > 0 ? (
                              <div className="space-y-2">
                                {stats.projectTasks.map(task => (
                                  <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <div className="flex items-center space-x-3">
                                      <Badge variant="outline" className="text-xs">
                                        {task.id}
                                      </Badge>
                                      <span className="text-sm">{task.title}</span>
                                      <Badge variant={
                                        task.status === 'Completed' ? 'secondary' :
                                        task.status === 'In Progress' ? 'default' : 'outline'
                                      } className="text-xs">
                                        {task.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <span>{task.responsible}</span>
                                      <span>Due: {task.dueDate}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No tasks assigned to this project yet.</p>
                            )}
                          </CardContent>
                        </Card>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};