import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSimpleApp } from '@/contexts/SimpleAppContext';
import { 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  MessageCircle,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const SimpleDashboard = () => {
  const { projects, tasks, followups, timeEntries, loading } = useSimpleApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate metrics
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;
  
  const totalTimeMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
  const totalTimeHours = Math.round(totalTimeMinutes / 60 * 10) / 10;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Recent items
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  
  const recentFollowups = followups
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in_progress': return 'text-blue-500';
      case 'active': return 'text-blue-500';
      case 'todo': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your simplified task tracker</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {projects.length} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks} of {totalTasks} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTimeHours}h</div>
              <p className="text-xs text-muted-foreground">
                {timeEntries.length} time entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Recent Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tasks created yet</p>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-sm ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.project_name && (
                            <span className="text-sm text-muted-foreground">
                              • {task.project_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.due_date && (
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Follow-ups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Recent Follow-ups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentFollowups.length === 0 ? (
                <p className="text-muted-foreground text-sm">No follow-ups added yet</p>
              ) : (
                <div className="space-y-3">
                  {recentFollowups.map((followup) => (
                    <div key={followup.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{followup.content}</p>
                          {followup.task_title && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Task: {followup.task_title}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(followup.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Quick Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
                <div className="text-sm text-muted-foreground">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{followups.length}</div>
                <div className="text-sm text-muted-foreground">Follow-ups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{timeEntries.length}</div>
                <div className="text-sm text-muted-foreground">Time Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleDashboard;