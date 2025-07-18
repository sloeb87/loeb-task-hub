
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
  'Open': '#f97316',
  'In Progress': '#3b82f6',
  'Completed': '#10b981',
  'On Hold': '#6b7280'
};

const PRIORITY_COLORS = {
  'Low': '#10b981',
  'Medium': '#f59e0b',
  'High': '#f97316',
  'Critical': '#ef4444'
};

export const TaskCharts = ({ statusChartData, priorityChartData, tasks = [], onMetricClick }: TaskChartsProps) => {
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
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                onClick={handleStatusClick}
                style={{ cursor: onMetricClick ? 'pointer' : 'default' }}
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#3b82f6'} />
                ))}
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count" 
                onClick={handlePriorityClick}
                style={{ cursor: onMetricClick ? 'pointer' : 'default' }}
              >
                {priorityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
