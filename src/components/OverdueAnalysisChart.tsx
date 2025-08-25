
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle } from "lucide-react";

interface OverdueAnalysisChartProps {
  overdueCount: number;
  notOverdueCount: number;
}

export const OverdueAnalysisChart = React.memo(({ overdueCount, notOverdueCount }: OverdueAnalysisChartProps) => {
  const data = [
    { name: 'Overdue', value: overdueCount, color: 'hsl(var(--chart-8))' },
    { name: 'On Track', value: notOverdueCount, color: 'hsl(var(--chart-4))' }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Overdue Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <defs>
              <linearGradient id="overdueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-8))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--chart-8))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="onTrackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              fill="hsl(var(--chart-8))"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === 'Overdue' ? 'url(#overdueGradient)' : 'url(#onTrackGradient)'} 
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
