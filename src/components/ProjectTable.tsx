
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Calendar, Users, ChevronUp, ChevronDown, Plus, Edit, FileBarChart, FolderOpen, Mail, FileText, ExternalLink, MessageSquare } from "lucide-react";
import { Project, Task } from "@/types/task";

interface ProjectTableProps {
  projects: Project[];
  tasks: Task[];
  onEditProject: (project: Project) => void;
  onCreateTask: (projectId: string) => void;
  onAddTaskToProject: (projectId: string) => void;
  onGenerateReport?: (project: Project) => void;
  filter?: 'all' | 'active' | 'on-hold' | 'completed';
}

type SortField = 'name' | 'owner' | 'startDate' | 'endDate' | 'status';
type SortDirection = 'asc' | 'desc';

export const ProjectTable = ({
  projects,
  tasks,
  onEditProject,
  onCreateTask,
  onAddTaskToProject,
  onGenerateReport,
  filter = 'all'
}: ProjectTableProps) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(task => task.project === project.name);
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks * 100 : 0;
    return {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks: projectTasks.filter(task => task.status !== 'Completed' && new Date(task.dueDate) < new Date()).length,
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

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.status === 'Active';
    if (filter === 'on-hold') return project.status === 'On Hold';
    if (filter === 'completed') return project.status === 'Completed';
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
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

  const SortableHeader = ({
    field,
    children
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <div className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort(field)}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </div>
    </div>
  );

  const toggleExpanded = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const handleRowClick = (project: Project) => {
    console.log('Row clicked:', project.name);
    onEditProject(project);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-border">
      <div className="overflow-x-auto">
        {/* Headers */}
        <ResizablePanelGroup direction="horizontal" className="min-w-full border-b border-gray-200 dark:border-gray-700">
          <ResizablePanel defaultSize={5} minSize={3} maxSize={8}>
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider h-full flex items-center">
              {/* Empty header for expand/collapse */}
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <SortableHeader field="name">Project Name</SortableHeader>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <SortableHeader field="owner">Owner & Team</SortableHeader>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <SortableHeader field="status">Status & Progress</SortableHeader>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <SortableHeader field="startDate">Timeline</SortableHeader>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={15} minSize={10} maxSize={20}>
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider h-full flex items-center">
              Actions
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Rows */}
        <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedProjects.map(project => {
            const stats = getProjectStats(project);
            const isExpanded = expandedProject === project.id;
            return (
              <React.Fragment key={project.id}>
                <ResizablePanelGroup direction="horizontal" className="min-w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* Expand/Collapse Column */}
                  <ResizablePanel defaultSize={5} minSize={3} maxSize={8}>
                    <div className="px-4 py-4 cursor-pointer h-full flex items-center" onClick={e => toggleExpanded(project.id, e)}>
                      <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />

                  {/* Project Name Column */}
                  <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                    <div className="px-4 py-4 cursor-pointer" onClick={() => handleRowClick(project)}>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
                        
                        {/* Project Links */}
                        <div className="flex items-center space-x-1 mt-2">
                          {project.links?.folder && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={(e) => handleLinkClick(project.links.folder!, e)}
                              title="Open Project Folder"
                            >
                              <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </Button>
                          )}
                          {project.links?.email && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-green-100 dark:hover:bg-green-900"
                              onClick={(e) => handleLinkClick(`mailto:${project.links.email}`, e)}
                              title="Send Project Email"
                            >
                              <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </Button>
                          )}
                          {project.links?.file && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
                              onClick={(e) => handleLinkClick(project.links.file!, e)}
                              title="Open Project File"
                            >
                              <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            </Button>
                          )}
                          {project.links?.oneNote && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
                              onClick={(e) => handleLinkClick(project.links.oneNote!, e)}
                              title="Open Project OneNote"
                            >
                              <ExternalLink className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                            </Button>
                          )}
                          {project.links?.teams && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-1 h-6 w-6 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                              onClick={(e) => handleLinkClick(project.links.teams!, e)}
                              title="Open Project Teams"
                            >
                              <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />

                  {/* Owner & Team Column */}
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <div className="px-4 py-4 cursor-pointer" onClick={() => handleRowClick(project)}>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{project.owner}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{project.team.length} team members</p>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />

                  {/* Status & Progress Column */}
                  <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                    <div className="px-4 py-4 cursor-pointer" onClick={() => handleRowClick(project)}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={project.status === 'Active' ? 'default' : project.status === 'Completed' ? 'secondary' : 'outline'}>
                            {project.status}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {stats.completedTasks}/{stats.totalTasks} tasks
                          {stats.overdueTasks > 0 && <span className="text-red-600 dark:text-red-400 ml-1">({stats.overdueTasks} overdue)</span>}
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />

                  {/* Timeline Column */}
                  <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                    <div className="px-4 py-4 cursor-pointer" onClick={() => handleRowClick(project)}>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="w-3 h-3" />
                          <span>{project.startDate}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          to {project.endDate}
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />

                  {/* Actions Column */}
                  <ResizablePanel defaultSize={15} minSize={10} maxSize={20}>
                    <div className="px-4 py-4">
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900" onClick={e => handleActionClick(e, () => onCreateTask(project.id))} title="Create New Task">
                          <Plus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </Button>
                        
                        {onGenerateReport && (
                          <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900" onClick={e => handleActionClick(e, () => onGenerateReport(project))} title="Generate Report">
                            <FileBarChart className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-gray-50 dark:bg-gray-900">
                    <ResizablePanelGroup direction="horizontal" className="min-w-full">
                      <ResizablePanel defaultSize={100}>
                        <div className="px-4 py-4">
                          <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <CardContent className="p-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Project Tasks</h4>
                              {stats.projectTasks.length > 0 ? (
                                <div className="space-y-2">
                                  {stats.projectTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                                      <div className="flex items-center space-x-3">
                                        <Badge variant="outline" className="text-xs">
                                          {task.id}
                                        </Badge>
                                        <span className="text-sm text-gray-900 dark:text-white">{task.title}</span>
                                        <Badge variant={task.status === 'Completed' ? 'secondary' : task.status === 'In Progress' ? 'default' : 'outline'} className="text-xs">
                                          {task.status}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span>{task.responsible}</span>
                                        <span>Due: {task.dueDate}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to this project yet.</p>
                              )}
                              
                              {/* Recent Comments Section */}
                              {stats.projectTasks.some(task => task.comments && task.comments.length > 0) && (
                                <div className="mt-6">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Recent Comments
                                  </h4>
                                  <div className="space-y-3">
                                    {stats.projectTasks
                                      .filter(task => task.comments && task.comments.length > 0)
                                      .slice(0, 3)
                                      .map(task => (
                                        <div key={task.id} className="bg-white dark:bg-gray-700 rounded border dark:border-gray-600 p-3">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <Badge variant="outline" className="text-xs">
                                              {task.id}
                                            </Badge>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</span>
                                          </div>
                                          <div className="space-y-2">
                                            {task.comments!
                                              .slice(-3)
                                              .reverse()
                                              .map((comment, index) => (
                                                <div key={index} className="border-l-2 border-blue-200 dark:border-blue-700 pl-3">
                                                  <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                    {comment.text}
                                                  </div>
                                                  <div className="text-xs text-gray-400 mt-1">
                                                    {new Date(comment.timestamp).toLocaleDateString()}
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
