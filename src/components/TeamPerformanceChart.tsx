
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TeamPerformanceChartProps {
  userPerformanceData: Array<{
    user: string;
    fullName: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
}

export const TeamPerformanceChart = ({ userPerformanceData }: TeamPerformanceChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Team Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={userPerformanceData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="user" type="category" width={50} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'completionRate' ? `${value}%` : value,
                name === 'completionRate' ? 'Completion Rate' : 
                name === 'completed' ? 'Completed Tasks' : 'Total Tasks'
              ]}
              labelFormatter={(label) => {
                const user = userPerformanceData.find(u => u.user === label);
                return user ? user.fullName : label;
              }}
            />
            <Bar dataKey="completionRate" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
