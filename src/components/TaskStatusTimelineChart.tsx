
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from "lucide-react";

interface TaskStatusTimelineChartProps {
  data: Array<{
    date: string;
    opened: number;
    closed: number;
    wip: number;
  }>;
}

export const TaskStatusTimelineChart = ({ data }: TaskStatusTimelineChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Task Status Timeline (Weekly)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="opened" fill="#3b82f6" name="Opened Tasks" />
            <Bar dataKey="closed" fill="#10b981" name="Closed Tasks" />
            <Line 
              type="monotone" 
              dataKey="wip" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="WIP Tasks"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
