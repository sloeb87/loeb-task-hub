
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task, KPIMetrics } from "@/types/task";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";

interface KPIDashboardProps {
  tasks: Task[];
}

export const KPIDashboard = ({ tasks }: KPIDashboardProps) => {
  // Calculate KPI metrics
  const calculateMetrics = (): KPIMetrics => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const overdueTasks = tasks.filter(t => {
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return t.status !== "Completed" && dueDate < today;
    }).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average task duration for completed tasks
    const completedTasksWithDuration = tasks.filter(t => t.status === "Completed" && t.completionDate);
    const totalDuration = completedTasksWithDuration.reduce((sum, task) => {
      const created = new Date(task.creationDate);
      const completed = new Date(task.completionDate!);
      return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
    }, 0);
    const averageTaskDuration = completedTasksWithDuration.length > 0 ? totalDuration / completedTasksWithDuration.length : 0;

    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByUser = tasks.reduce((acc, task) => {
      acc[task.responsible] = (acc[task.responsible] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      averageTaskDuration,
      tasksByStatus,
      tasksByPriority,
      tasksByUser
    };
  };

  const metrics = calculateMetrics();

  const getProjectStats = () => {
    const projectStats = tasks.reduce((acc, task) => {
      if (!acc[task.project]) {
        acc[task.project] = {
          total: 0,
          completed: 0,
          overdue: 0,
          inProgress: 0
        };
      }
      acc[task.project].total++;
      if (task.status === "Completed") acc[task.project].completed++;
      if (task.status === "In Progress") acc[task.project].inProgress++;
      
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      if (task.status !== "Completed" && dueDate < today) {
        acc[task.project].overdue++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(projectStats).map(([name, stats]) => ({
      name,
      ...stats,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }));
  };

  const projectStats = getProjectStats();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.completedTasks} of {metrics.totalTasks} tasks
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-3xl font-bold text-red-600">
                  {metrics.overdueTasks}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((metrics.overdueTasks / metrics.totalTasks) * 100).toFixed(1)}% of total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Task Duration</p>
                <p className="text-3xl font-bold text-blue-600">
                  {metrics.averageTaskDuration.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">days to complete</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Object.keys(metrics.tasksByUser).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">team members</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Tasks by Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.tasksByStatus).map(([status, count]) => {
                const percentage = (count / metrics.totalTasks) * 100;
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "Completed": return "bg-green-500";
                    case "In Progress": return "bg-blue-500";
                    case "Open": return "bg-orange-500";
                    case "On Hold": return "bg-gray-500";
                    default: return "bg-gray-400";
                  }
                };

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                      <span className="text-sm font-medium">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(status)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Tasks by Priority</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.tasksByPriority).map(([priority, count]) => {
                const percentage = (count / metrics.totalTasks) * 100;
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case "Critical": return "bg-red-500";
                    case "High": return "bg-orange-500";
                    case "Medium": return "bg-yellow-500";
                    case "Low": return "bg-green-500";
                    default: return "bg-gray-400";
                  }
                };

                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
                      <span className="text-sm font-medium">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectStats.map((project) => (
              <div key={project.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <Badge variant={project.completionRate === 100 ? "default" : "secondary"}>
                    {project.completionRate.toFixed(0)}% Complete
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total</span>
                    <p className="font-medium">{project.total}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed</span>
                    <p className="font-medium text-green-600">{project.completed}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">In Progress</span>
                    <p className="font-medium text-blue-600">{project.inProgress}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Overdue</span>
                    <p className="font-medium text-red-600">{project.overdue}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.tasksByUser)
              .sort(([,a], [,b]) => b - a)
              .map(([user, count]) => {
                const userTasks = tasks.filter(t => t.responsible === user);
                const completedTasks = userTasks.filter(t => t.status === "Completed").length;
                const completionRate = count > 0 ? (completedTasks / count) * 100 : 0;

                return (
                  <div key={user} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">
                          {user.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{user}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        {completedTasks}/{count} tasks
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">
                          {completionRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
