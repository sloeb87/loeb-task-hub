
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Clock, Users } from "lucide-react";
import { KPIMetrics } from "@/types/task";

interface MetricsCardsProps {
  metrics: KPIMetrics;
}

export const MetricsCards = ({ metrics }: MetricsCardsProps) => {
  return (
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
  );
};
