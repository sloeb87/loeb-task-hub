
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
    { name: 'Overdue', value: overdueCount, color: 'hsl(200, 100%, 60%)' },
    { name: 'On Track', value: notOverdueCount, color: 'hsl(180, 100%, 70%)' }
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
        fill="hsl(200, 100%, 80%)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={16}
        fontWeight="600"
        style={{
          filter: 'drop-shadow(0 0 4px hsl(200, 100%, 60%))',
          fontFamily: 'monospace'
        }}
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
      <CardContent className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-lg"></div>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <defs>
              <linearGradient id="overdueGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(0, 80%, 60%)" stopOpacity={0.8} />
                <stop offset="50%" stopColor="hsl(340, 100%, 70%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(200, 100%, 60%)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="onTrackGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(200, 100%, 60%)" stopOpacity={0.8} />
                <stop offset="50%" stopColor="hsl(180, 100%, 70%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(200, 100%, 80%)" stopOpacity={0.1} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={140}
              fill="hsl(200, 100%, 60%)"
              dataKey="value"
              stroke="hsl(200, 100%, 60%)"
              strokeWidth={2}
              filter="url(#glow)"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === 'Overdue' ? 'url(#overdueGradient)' : 'url(#onTrackGradient)'} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(220, 30%, 10%)',
                border: '1px solid hsl(200, 100%, 60%)',
                borderRadius: '8px',
                boxShadow: '0 0 20px hsl(200, 100%, 60%, 0.3)',
                color: 'hsl(200, 100%, 80%)',
                fontFamily: 'monospace'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: 'hsl(200, 100%, 80%)',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
