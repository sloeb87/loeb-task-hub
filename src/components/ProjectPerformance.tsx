
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectStats {
  name: string;
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
  completionRate: number;
}

interface ProjectPerformanceProps {
  projectStats: ProjectStats[];
}

export const ProjectPerformance = ({ projectStats }: ProjectPerformanceProps) => {
  return (
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
  );
};
