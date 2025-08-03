import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Search, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Task, FollowUp } from "@/types/task";
import { useScopeColor } from "@/hooks/useScopeColor";
import { useTaskTypeColor } from "@/hooks/useTaskTypeColor";
import { useEnvironmentColor } from "@/hooks/useEnvironmentColor";

interface FollowUpsPageProps {
  tasks: Task[];
}

interface FollowUpWithTask extends FollowUp {
  taskId: string;
  taskTitle: string;
  taskScope: string;
  taskType: string;
  taskEnvironment: string;
  projectName: string;
}

export const FollowUpsPage = ({ tasks }: FollowUpsPageProps) => {
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  const [searchTerm, setSearchTerm] = useState("");

  // Get all follow-ups with task information
  const allFollowUps = useMemo(() => {
    const followUps: FollowUpWithTask[] = [];
    
    tasks.forEach(task => {
      task.followUps.forEach(followUp => {
        followUps.push({
          ...followUp,
          taskId: task.id,
          taskTitle: task.title,
          taskScope: task.scope,
          taskType: task.taskType,
          taskEnvironment: task.environment,
          projectName: task.project
        });
      });
    });

    return followUps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tasks]);

  // Filter follow-ups based on search term
  const filteredFollowUps = useMemo(() => {
    if (!searchTerm) return allFollowUps;
    
    return allFollowUps.filter(followUp => 
      followUp.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskEnvironment.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFollowUps, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const uniqueTasks = new Set(allFollowUps.map(f => f.taskId));
    const uniqueAuthors = new Set(allFollowUps.map(f => f.author));
    const recentFollowUps = allFollowUps.filter(f => {
      const followUpDate = new Date(f.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return followUpDate >= sevenDaysAgo;
    });

    return {
      totalFollowUps: allFollowUps.length,
      tasksWithFollowUps: uniqueTasks.size,
      contributors: uniqueAuthors.size,
      recentFollowUps: recentFollowUps.length
    };
  }, [allFollowUps]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and manage all task follow-ups</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalFollowUps}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks with Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.tasksWithFollowUps}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.contributors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.recentFollowUps}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-Ups Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Follow-Ups</CardTitle>
          <CardDescription>Complete history of task follow-ups and comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Follow-Up</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowUps.map((followUp) => (
                  <TableRow key={`${followUp.taskId}-${followUp.id}`} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white max-w-xs">
                        <p className="line-clamp-2">{followUp.text}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {followUp.taskId}_{followUp.taskTitle}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {followUp.projectName}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getScopeStyle(followUp.taskScope)}
                          className="text-xs"
                        >
                          {followUp.taskScope}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getTaskTypeStyle(followUp.taskType)}
                          className="text-xs border"
                        >
                          {followUp.taskType}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getEnvironmentStyle(followUp.taskEnvironment)}
                          className="text-xs border"
                        >
                          {followUp.taskEnvironment}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {followUp.author}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(followUp.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredFollowUps.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No follow-ups found matching your search."
                  : "No follow-ups yet. Add follow-ups to tasks to track progress and discussions."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};