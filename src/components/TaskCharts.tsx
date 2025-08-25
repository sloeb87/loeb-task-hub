
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Task } from "@/types/task";

interface TaskChartsProps {
  statusChartData: Array<{ status: string; count: number; percentage: string }>;
  priorityChartData: Array<{ priority: string; count: number; percentage: string }>;
  tasks?: Task[];
  onMetricClick?: (metricType: string, title: string, tasks: Task[]) => void;
}

const STATUS_COLORS = {
  'Open': 'hsl(var(--chart-8))',
  'In Progress': 'hsl(var(--chart-4))',
  'Completed': 'hsl(var(--chart-1))',
  'On Hold': 'hsl(var(--chart-10))'
};

const PRIORITY_COLORS = {
  'Low': 'hsl(var(--chart-8))',
  'Medium': 'hsl(var(--chart-4))',
  'High': 'hsl(var(--chart-1))',
  'Critical': 'hsl(var(--chart-10))'
};

export const TaskCharts = React.memo(({ statusChartData, priorityChartData, tasks = [], onMetricClick }: TaskChartsProps) => {
  const handleStatusClick = (data: any) => {
    if (!onMetricClick || !tasks.length) return;
    const status = data.status;
    const filteredTasks = tasks.filter(task => task.status === status);
    const metricType = status.toLowerCase().replace(' ', '');
    onMetricClick(metricType, `${status} Tasks`, filteredTasks);
  };

  const handlePriorityClick = (data: any) => {
    if (!onMetricClick || !tasks.length) return;
    const priority = data.priority;
    const filteredTasks = tasks.filter(task => task.priority === priority);
    const metricType = priority.toLowerCase();
    onMetricClick(metricType, `${priority} Priority Tasks`, filteredTasks);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Tasks by Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                <linearGradient id="statusOpenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-8))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--chart-8))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="statusInProgressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="statusCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="statusOnHoldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-10))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--chart-10))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status}: ${percentage}%`}
                outerRadius={80}
                fill="hsl(var(--chart-8))"
                dataKey="count"
                onClick={handleStatusClick}
                style={{ cursor: onMetricClick ? 'pointer' : 'default' }}
              >
                {statusChartData.map((entry, index) => {
                  const gradientMap = {
                    'Open': 'url(#statusOpenGradient)',
                    'In Progress': 'url(#statusInProgressGradient)',
                    'Completed': 'url(#statusCompletedGradient)',
                    'On Hold': 'url(#statusOnHoldGradient)'
                  };
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={gradientMap[entry.status as keyof typeof gradientMap] || 'url(#statusInProgressGradient)'} 
                    />
                  );
                })}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityChartData} onClick={handlePriorityClick}>
              <defs>
                <linearGradient id="kpiBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count" 
                onClick={handlePriorityClick}
                style={{ cursor: onMetricClick ? 'pointer' : 'default' }}
                fill="url(#kpiBarGradient)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={1.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});
