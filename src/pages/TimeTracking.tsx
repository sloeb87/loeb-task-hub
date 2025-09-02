import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Play, Pause, Search, Edit3, Trash2, Filter, Building2 } from "lucide-react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { TimeEntryFiltersComponent } from "@/components/TimeEntryFilters";
import { TimeEntryExport } from "@/components/TimeEntryExport";
import { useScopeColor, useTaskTypeColor, useEnvironmentColor } from "@/hooks/useParameterColors";
import { Task } from "@/types/task";
import { Project } from "@/types/task";
import { TimeEntry, TimeEntryFilters } from "@/types/timeEntry";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, BarChart, Bar, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { toast } from "@/hooks/use-toast";
import { startOfDay, endOfDay } from "date-fns";

interface MultiSelectFilters {
  task: string[];
  project: string[];
  scope: string[];
  type: string[];
  environment: string[];
  date: string[];
}

interface TimeTrackingPageProps {
  tasks: Task[];
  projects: Project[];
  onEditTask?: (task: Task) => void; // Add callback to redirect to Task Details
}

export const TimeTrackingPage = ({ tasks, projects, onEditTask }: TimeTrackingPageProps) => {
  const { timeEntries, startTimer, stopTimer, getTaskTime, getFilteredTimeEntries, getTimeEntryStats, deleteTimeEntry, taskTimers } = useTimeTracking();
  const { getScopeStyle, getScopeColor } = useScopeColor();
  const { getTaskTypeStyle, getTaskTypeColor } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TimeEntryFilters>(() => {
    const now = new Date();
    return { dateRange: { from: startOfDay(now), to: endOfDay(now) } };
  });

  // Modal state for detailed pie chart view
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState<{
    title: string;
    data: Array<{name: string, value: number, percent: number}>;
    total: number;
    type: 'project' | 'taskType' | 'scope';
  } | null>(null);

  // Multi-select filters
  const [multiSelectFilters, setMultiSelectFilters] = useState<MultiSelectFilters>({
    task: [],
    project: [],
    scope: [],
    type: [],
    environment: [],
    date: []
  });
  
  const [showFilters, setShowFilters] = useState<Record<keyof MultiSelectFilters, boolean>>({
    task: false,
    project: false,
    scope: false,
    type: false,
    environment: false,
    date: false
  });
  
  const filterRefs = useRef<Record<keyof MultiSelectFilters, HTMLDivElement | null>>({
    task: null,
    project: null,
    scope: null,
    type: null,
    environment: null,
    date: null
  });

  // Task editing state - REMOVED, now redirects to Task Details
  // const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  // const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    totalMinutes: 0
  });

  // Memoized task lookup map for performance (using taskId from time entries)
  const taskLookup = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {} as Record<string, Task>);
  }, [tasks]);

  // Optimized unique values calculation with task lookup
  const getUniqueValues = useCallback((filterType: keyof MultiSelectFilters): string[] => {
    const baseEntries = getFilteredTimeEntries(filters);
    
    switch (filterType) {
      case 'task':
        return [...new Set(baseEntries.map(e => e.taskTitle))].sort();
      case 'project':
        return [...new Set(baseEntries.map(e => e.projectName))].sort();
      case 'scope':
        return [...new Set(baseEntries.flatMap(e => {
          const task = taskLookup[e.taskId];
          return task?.scope || [];
        }).filter(Boolean))].sort();
      case 'type':
        return [...new Set(baseEntries.map(e => {
          const task = taskLookup[e.taskId];
          return task?.taskType || '';
        }).filter(Boolean))].sort();
      case 'environment':
        return [...new Set(baseEntries.map(e => {
          const task = taskLookup[e.taskId];
          return task?.environment || '';
        }).filter(Boolean))].sort();
      case 'date':
        return [...new Set(baseEntries.map(e => new Date(e.startTime).toLocaleDateString()))].sort();
      default:
        return [];
    }
  }, [getFilteredTimeEntries, filters, taskLookup]);

  // Multi-select filter handlers
  const handleFilterChange = (filterType: keyof MultiSelectFilters, value: string, checked: boolean) => {
    setMultiSelectFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearFilter = (filterType: keyof MultiSelectFilters) => {
    setMultiSelectFilters(prev => ({
      ...prev,
      [filterType]: []
    }));
  };

  const toggleFilterDropdown = (filterType: keyof MultiSelectFilters, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowFilters(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof MultiSelectFilters, boolean>),
      [filterType]: !prev[filterType]
    }));
  };

  // Filter component for table headers
  const FilterableHeader = ({ 
    filterType, 
    children 
  }: { 
    filterType: keyof MultiSelectFilters; 
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between min-w-0">
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <div className="relative" ref={el => filterRefs.current[filterType] = el}>
          <Button
            size="sm"
            variant="ghost"
            className={`p-1 h-6 w-6 shrink-0 ${multiSelectFilters[filterType].length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
            onClick={(e) => toggleFilterDropdown(filterType, e)}
          >
            <Filter className="w-3 h-3" />
          </Button>
          {multiSelectFilters[filterType].length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {multiSelectFilters[filterType].length}
            </span>
          )}
          {showFilters[filterType] && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-w-xs">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getUniqueValues(filterType).map(value => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterType}-${value}`}
                      checked={multiSelectFilters[filterType].includes(value)}
                      onCheckedChange={(checked) => 
                        handleFilterChange(filterType, value, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`${filterType}-${value}`}
                      className="text-base cursor-pointer flex-1 text-gray-900 dark:text-white truncate"
                      title={value}
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
              {multiSelectFilters[filterType].length > 0 && (
                <div className="mt-2 pt-2 border-t dark:border-gray-600">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clearFilter(filterType)}
                    className="w-full"
                  >
                    Clear All ({multiSelectFilters[filterType].length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Get filtered entries based on search and filters
  const filteredEntries = useMemo(() => {
    let filtered = getFilteredTimeEntries(filters);
    
    // Apply multi-select filters
    if (multiSelectFilters.task.length > 0) {
      filtered = filtered.filter(e => multiSelectFilters.task.includes(e.taskTitle));
    }
    if (multiSelectFilters.project.length > 0) {
      filtered = filtered.filter(e => multiSelectFilters.project.includes(e.projectName));
    }
    if (multiSelectFilters.scope.length > 0) {
      filtered = filtered.filter(e => {
        const task = tasks.find(t => t.id === e.taskId);
        return task && task.scope && task.scope.some(scope => multiSelectFilters.scope.includes(scope));
      });
    }
    if (multiSelectFilters.type.length > 0) {
      filtered = filtered.filter(e => {
        const task = tasks.find(t => t.id === e.taskId);
        return task && multiSelectFilters.type.includes(task.taskType);
      });
    }
    if (multiSelectFilters.environment.length > 0) {
      filtered = filtered.filter(e => {
        const task = tasks.find(t => t.id === e.taskId);
        return task && multiSelectFilters.environment.includes(task.environment);
      });
    }
    if (multiSelectFilters.date.length > 0) {
      filtered = filtered.filter(e => multiSelectFilters.date.includes(new Date(e.startTime).toLocaleDateString()));
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.responsible.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [getFilteredTimeEntries, filters, multiSelectFilters, searchTerm, tasks]);

  // Calculate statistics for filtered entries (for table display)
  const sortedEntries = useMemo(() => (
    [...filteredEntries].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  ), [filteredEntries]);
  const filteredStats = useMemo(() => getTimeEntryStats(filteredEntries), [getTimeEntryStats, filteredEntries]);
  
  // Calculate total statistics from all entries (for header cards)
  const allTimeEntries = getFilteredTimeEntries({});
  const totalStats = useMemo(() => getTimeEntryStats(allTimeEntries), [getTimeEntryStats, allTimeEntries]);

  // Pareto transformation - groups items with less than 5% into "Others"
  const applyParetoLogic = useCallback((data: Array<{name: string, value: number, percent: number}>) => {
    if (data.length === 0) return data;
    
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);
    
    console.log('5% Threshold Analysis:', {
      totalItems: sortedData.length,
      totalValue: total,
      items: sortedData.map(item => ({ name: item.name, value: item.value, percent: ((item.value / total) * 100).toFixed(1) }))
    });
    
    // If we have 4 or fewer items, show all
    if (sortedData.length <= 4) {
      console.log('Too few items, showing all');
      return sortedData;
    }
    
    // Separate items with 5% or more from those with less than 5%
    const mainItems: Array<{name: string, value: number, percent: number}> = [];
    const othersItems: Array<{name: string, value: number, percent: number}> = [];
    
    sortedData.forEach(item => {
      const itemPercent = total ? (item.value / total) * 100 : 0;
      
      console.log(`Item: ${item.name}, percent: ${itemPercent.toFixed(1)}%`);
      
      if (itemPercent >= 5) {
        mainItems.push(item);
      } else {
        othersItems.push(item);
      }
    });
    
    console.log('Main items (≥5%):', mainItems.length);
    console.log('Others items (<5%):', othersItems.length);
    
    // If no items are less than 5%, return original data
    if (othersItems.length === 0) {
      console.log('No items under 5%, showing all items');
      return sortedData;
    }
    
    // Create result with "Others" category
    const result = [...mainItems];
    
    if (othersItems.length > 0) {
      const othersValue = othersItems.reduce((sum, item) => sum + item.value, 0);
      const othersPercent = total ? Math.round((othersValue / total) * 1000) / 10 : 0;
      
      result.push({
        name: `Others (${othersItems.length})`,
        value: othersValue,
        percent: othersPercent
      });
      
      console.log('Created Others category:', {
        count: othersItems.length,
        value: othersValue,
        percent: othersPercent,
        items: othersItems.map(item => item.name)
      });
    }
    
    console.log('Final 5% Threshold Result:', result.map(item => ({ name: item.name, percent: ((item.value / total) * 100).toFixed(1) })));
    
    return result;
  }, []);

  // Project distribution for Pie Chart (% by project) based on filtered entries - with Pareto logic
  const projectPieData = useMemo(() => {
    const totals: Record<string, number> = {};
    const now = new Date();
    filteredEntries.forEach((e) => {
      const key = e.projectName || 'Unassigned';
      const mins = typeof e.duration === 'number' && !isNaN(e.duration)
        ? e.duration
        : e.endTime
          ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000))
          : e.isRunning
            ? Math.max(0, Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 60000))
            : 0;
      // Add 10% to each value and round to whole minutes
      totals[key] = (totals[key] || 0) + Math.round(mins * 1.10);
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    const rawData = Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    
    return applyParetoLogic(rawData);
  }, [filteredEntries]);

  const projectChartConfig = useMemo<ChartConfig>(() => {
    return projectPieData.reduce((acc, item) => {
      acc[item.name] = { label: item.name };
      return acc;
    }, {} as ChartConfig);
  }, [projectPieData]);

  // Raw project data (without Pareto logic) for detailed modal
  const projectRawData = useMemo(() => {
    const totals: Record<string, number> = {};
    const now = new Date();
    filteredEntries.forEach((e) => {
      const key = e.projectName || 'Unassigned';
      const mins = typeof e.duration === 'number' && !isNaN(e.duration)
        ? e.duration
        : e.endTime
          ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000))
          : e.isRunning
            ? Math.max(0, Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 60000))
            : 0;
      totals[key] = (totals[key] || 0) + Math.round(mins * 1.10);
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  const chartColors = useMemo(() => [
    'hsl(var(--chart-1) / 0.7)',   // neon cyan
    'hsl(var(--chart-2) / 0.7)',   // electric violet
    'hsl(var(--chart-3) / 0.7)',   // neon green
    'hsl(var(--chart-4) / 0.7)',   // tech blue
    'hsl(var(--chart-5) / 0.7)',   // neon magenta
    'hsl(var(--chart-6) / 0.7)',   // neon amber
    'hsl(var(--chart-7) / 0.7)',   // neon pink-red
    'hsl(var(--chart-8) / 0.7)',   // azure glow
    'hsl(var(--chart-9) / 0.7)',   // laser lime
    'hsl(var(--chart-10) / 0.7)',  // ultraviolet
    'hsl(var(--chart-11) / 0.7)',  // neon orange
    'hsl(var(--chart-12) / 0.7)',  // neon red
  ], []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDetailedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPercentComma = (num: number) => num.toFixed(2).replace('.', ',');
  const formatPercentCeil = (num: number) => String(Math.min(100, Math.ceil(num)));

  const abbreviate = (text: string, max = 18) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text);
  // Outside multi-line label positioned near its slice; computes % from dataset total
  const makePieLabelOutside = (total: number) => (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    const RADIAN = Math.PI / 180;
    const r = (outerRadius || 0) + 18;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    const alignRight = x > cx;
    const minutesVal = typeof value === 'number' ? value : 0;
    const pctNum = total > 0 ? (minutesVal / total) * 100 : 0;
    const pct = formatPercentCeil(pctNum);

    return (
      <text x={x} y={y} textAnchor={alignRight ? "start" : "end"} dominantBaseline="central" className="fill-current text-foreground">
        <tspan x={x} dy="-0.5em">{name}</tspan>
        <tspan x={x} dy="1.1em">{`${pct}% • ${formatDetailedTime(minutesVal)}`}</tspan>
      </text>
    );
  };
  const taskTypePieData = useMemo(() => {
    const totals: Record<string, number> = {};
    const now = new Date();
    filteredEntries.forEach((e) => {
      const task = tasks.find(t => t.id === e.taskId);
      const type = task?.taskType || 'Unassigned';
      const mins = typeof e.duration === 'number' && !isNaN(e.duration)
        ? e.duration
        : e.endTime
          ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000))
          : e.isRunning
            ? Math.max(0, Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 60000))
            : 0;
      // Add 10% to each value and round to whole minutes
      totals[type] = (totals[type] || 0) + Math.round(mins * 1.10);
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    const rawData = Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    
    return applyParetoLogic(rawData);
  }, [filteredEntries, tasks]);

  const taskTypeChartConfig = useMemo<ChartConfig>(() => {
    return taskTypePieData.reduce((acc, item) => {
      acc[item.name] = { label: item.name };
      return acc;
    }, {} as ChartConfig);
  }, [taskTypePieData]);

  // Raw task type data (without Pareto logic) for detailed modal
  const taskTypeRawData = useMemo(() => {
    const totals: Record<string, number> = {};
    const now = new Date();
    filteredEntries.forEach((e) => {
      const task = tasks.find(t => t.id === e.taskId);
      const type = task?.taskType || 'Unassigned';
      const mins = typeof e.duration === 'number' && !isNaN(e.duration)
        ? e.duration
        : e.endTime
          ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000))
          : e.isRunning
            ? Math.max(0, Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 60000))
            : 0;
      totals[type] = (totals[type] || 0) + Math.round(mins * 1.10);
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredEntries, tasks]);

  const projectColors = useMemo(
    () => projectPieData.map((_, i) => chartColors[i % chartColors.length]),
    [projectPieData, chartColors]
  );

  const taskTypeColors = useMemo(
    () => taskTypePieData.map((_, i) => chartColors[i % chartColors.length]),
    [taskTypePieData, chartColors]
  );

  // Scope distribution for Pie Chart (% by scope) based on filtered entries - with Pareto logic
  const scopePieData = useMemo(() => {
    const totals: Record<string, number> = {};
    const now = new Date();
    filteredEntries.forEach((e) => {
      const task = tasks.find(t => t.id === e.taskId);
      // Only use task scope, skip entries without task or task scope
      if (!task || !task.scope || task.scope.length === 0) {
        return; // Skip this entry
      }
      
      const scopes = task.scope;
      const mins = typeof e.duration === 'number' && !isNaN(e.duration)
        ? e.duration
        : e.endTime
          ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000))
          : e.isRunning
            ? Math.max(0, Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 60000))
            : 0;
      // Add 10% to each value and round to whole minutes
      const share = Math.round(mins * 1.10) / scopes.length;
      scopes.forEach((s) => {
        totals[s] = (totals[s] || 0) + share;
      });
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    const rawData = Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    
    return applyParetoLogic(rawData);
  }, [filteredEntries, tasks]);

  const scopeChartConfig = useMemo<ChartConfig>(() => {
    return scopePieData.reduce((acc, item) => {
      acc[item.name] = { label: item.name };
      return acc;
    }, {} as ChartConfig);
  }, [scopePieData]);

  // Raw scope data (without Pareto logic) for detailed modal
  const scopeRawData = useMemo(() => {
    const totals: Record<string, number> = {};
    const now = new Date();
    filteredEntries.forEach((e) => {
      const task = tasks.find(t => t.id === e.taskId);
      // Only use task scope, skip entries without task or task scope
      if (!task || !task.scope || task.scope.length === 0) {
        return; // Skip this entry
      }
      
      const scopes = task.scope;
      const mins = typeof e.duration === 'number' && !isNaN(e.duration)
        ? e.duration
        : e.endTime
          ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000))
          : e.isRunning
            ? Math.max(0, Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 60000))
            : 0;
      const share = Math.round(mins * 1.10) / scopes.length;
      scopes.forEach((s) => {
        totals[s] = (totals[s] || 0) + share;
      });
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredEntries, tasks]);

  const scopeColors = useMemo(
    () => scopePieData.map((_, i) => chartColors[i % chartColors.length]),
    [scopePieData, chartColors]
  );

  // Totals for consistent percent formatting
  const projectTotal = useMemo(() => projectRawData.reduce((sum, d) => sum + (d.value || 0), 0), [projectRawData]);
  const taskTypeTotal = useMemo(() => taskTypeRawData.reduce((sum, d) => sum + (d.value || 0), 0), [taskTypeRawData]);
  const scopeTotal = useMemo(() => scopeRawData.reduce((sum, d) => sum + (d.value || 0), 0), [scopeRawData]);

  // Click handlers to open detailed modal
  const handleProjectChartClick = useCallback(() => {
    setDetailModalData({
      title: 'Time by Project - Full Details',
      data: projectRawData,
      total: projectTotal,
      type: 'project'
    });
    setDetailModalOpen(true);
  }, [projectRawData, projectTotal]);

  const handleTaskTypeChartClick = useCallback(() => {
    setDetailModalData({
      title: 'Time by Task Type - Full Details',
      data: taskTypeRawData,
      total: taskTypeTotal,
      type: 'taskType'
    });
    setDetailModalOpen(true);
  }, [taskTypeRawData, taskTypeTotal]);

  const handleScopeChartClick = useCallback(() => {
    setDetailModalData({
      title: 'Time by Scope - Full Details',
      data: scopeRawData,
      total: scopeTotal,
      type: 'scope'
    });
    setDetailModalOpen(true);
  }, [scopeRawData, scopeTotal]);

  // Historical daily totals (last 30 days, ending today)
  const dailyHistoryData = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const days: Date[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      return d;
    });
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Initialize all days with 0 minutes to ensure all dates are included
    const totals: Record<string, number> = {};
    days.forEach(d => { totals[key(d)] = 0; });

    // Add actual time entries
    timeEntries.forEach(e => {
      const start = new Date(e.startTime);
      const k = key(start);
      if (totals.hasOwnProperty(k)) { // Use hasOwnProperty to include days with 0 minutes
        const minutes = typeof e.duration === 'number' && !isNaN(e.duration)
          ? e.duration
          : e.endTime
            ? Math.max(0, Math.floor((new Date(e.endTime).getTime() - start.getTime()) / 60000))
            : e.isRunning
              ? Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000))
              : 0;
        // Add 10% to each value and round to whole minutes
        totals[k] += Math.round(minutes * 1.10);
      }
    });

    // Return all days, including those with 0 minutes
    return days.map(d => ({
      dateISO: key(d),
      dateLabel: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      minutes: totals[key(d)],
    }));
  }, [timeEntries]);

  // Average minutes excluding zero days (for reference line)
  const avgMinutesExcludingZero = useMemo(() => {
    const nonZero = dailyHistoryData.filter(d => d.minutes > 0);
    if (nonZero.length === 0) return 0;
    const total = nonZero.reduce((sum, d) => sum + d.minutes, 0);
    return Math.round(total / nonZero.length);
  }, [dailyHistoryData]);

  // Map legacy project names to the updated display name (UI-only)
  const normalizeProjectName = (name?: string) => {
    if (!name) return "";
    return name.toUpperCase() === "SAP4GENESIS" ? "SAP4Genesis" : name;
  };
  const handleTimerToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const runningEntry = filteredEntries.find(entry => entry.taskId === taskId && entry.isRunning);
    if (runningEntry) {
      stopTimer(taskId);
    } else {
      startTimer(taskId, task.title, task.project, task.responsible);
    }
  };

  const handleEditTimeEntry = (entry: TimeEntry) => {
    const startDate = new Date(entry.startTime);
    
    setEditingEntry(entry);
    setEditFormData({
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: entry.endTime ? new Date(entry.endTime).toTimeString().slice(0, 5) : "",
      totalMinutes: entry.duration || 0
    });
    setEditDialogOpen(true);
  };

  const handleSaveTimeEntry = async () => {
    if (!editingEntry) return;

    try {
      // Create updated time entry with new values
      const updatedStartTime = new Date(`${editFormData.date}T${editFormData.startTime}`);
      const updatedEndTime = editFormData.endTime ? new Date(`${editFormData.date}T${editFormData.endTime}`) : null;
      const duration = editFormData.totalMinutes;

      // Update the entry in Supabase
      const { error } = await supabase
        .from('time_entries')
        .update({
          start_time: updatedStartTime.toISOString(),
          end_time: updatedEndTime?.toISOString(),
          duration: duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Close dialog and refresh data
      setEditDialogOpen(false);
      setEditingEntry(null);
      
      // Trigger a proper data reload from the useTimeTracking hook
      window.dispatchEvent(new CustomEvent('timeEntriesUpdated'));
    } catch (error) {
      console.error('Failed to update time entry:', error);
      // You could add a toast notification here
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (end <= start) {
      // Handle next day scenario
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...editFormData, [field]: value };
    
    // Auto-calculate duration when both start and end times are set
    if (field === 'startTime' || field === 'endTime') {
      if (newFormData.startTime && newFormData.endTime) {
        newFormData.totalMinutes = calculateDuration(newFormData.startTime, newFormData.endTime);
      }
    }
    
    setEditFormData(newFormData);
  };

  const handleRowClick = (entry: TimeEntry) => {
    const task = tasks.find(t => t.id === entry.taskId);
    if (task && onEditTask) {
      onEditTask(task); // Redirect to Task Details page
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Open": return "bg-orange-100 text-orange-800";
      case "On Hold": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Non-Project timer constants and handlers
  const NON_PROJECT_TASK_ID = 'non_project_time';
  const NON_PROJECT_TASK_TITLE = 'Non-Project-Task';
  const NON_PROJECT_PROJECT_NAME = 'Non Project';

  const nonProjectTimer = getTaskTime(NON_PROJECT_TASK_ID);
  const isNonProjectRunning = nonProjectTimer.isRunning;

  const handleStartNonProject = () => {
    startTimer(NON_PROJECT_TASK_ID, NON_PROJECT_TASK_TITLE, NON_PROJECT_PROJECT_NAME, "Unknown");
    toast({ title: "Started Non-Project Timer" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex items-center space-x-3">
          <Clock className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor and manage task time entries</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Debug Timer Button */}
          <Button
            variant="outline"
            onClick={() => {
              console.log('=== TIMER DEBUG INFO ===');
              console.log('taskTimers:', taskTimers);
              console.log('taskTimers size:', taskTimers.size);
              const runningEntries = Array.from(taskTimers.entries()).filter(([_, data]) => data.isRunning);
              console.log('running timers:', runningEntries);
              console.log('tasks count:', tasks.length);
              
              // Show alert with timer info
              const runningCount = runningEntries.length;
              const totalTimers = taskTimers.size;
              alert(`Timer Debug Info:\n- Total Timers: ${totalTimers}\n- Running Timers: ${runningCount}\n- Tasks Available: ${tasks.length}\n\nCheck console for detailed info.`);
            }}
            className="text-xs"
          >
            Debug Timers
          </Button>
          
          {!isNonProjectRunning && (
            <Button
              variant="secondary"
              onClick={handleStartNonProject}
              aria-label="Start Non-Project Timer"
            >
              <Play className="w-4 h-4" />
              Start Non-Project
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Total Time Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDetailedTime(Math.round(filteredStats.totalTime * 1.10))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Total Time Logged in Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(Math.round(filteredStats.totalTime * 1.10) / 480).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Tasks with Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {filteredStats.totalEntries}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">Avg. Time per Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatTime(Math.round(filteredStats.averageEntryDuration))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TimeEntryFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({})}
      />

      {/* Charts - 3-column responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Project Distribution Pie Chart */}
      {projectPieData.length > 0 ? (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleProjectChartClick}>
          <CardHeader className="pb-2">
            <CardTitle>Project</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 gap-6 items-center justify-items-center">
                  <ChartContainer config={projectChartConfig} className="h-72 w-full">
                    <PieChart>
                      <defs>
                        {projectPieData.map((entry, index) => {
                          // Find the project and use its scope color
                          const project = projects.find(p => p.name === entry.name);
                          const projectScope = Array.isArray(project?.scope) 
                            ? project?.scope[0] || 'Unassigned'
                            : project?.scope || 'Unassigned';
                          const color = getScopeColor(projectScope);
                          return (
                            <linearGradient key={`projectGradient-${index}`} id={`projectGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: number, name: string) => {
                              const minutes = Number(value) || 0;
                               const pct = projectTotal > 0 ? formatPercentCeil((minutes / projectTotal) * 100) : '0';
                               return [`${formatDetailedTime(minutes)} • ${pct}%`, name];

                            }}
                          />
                        }
                      />
                       <Pie
                         data={projectPieData}
                         dataKey="value"
                         nameKey="name"
                         startAngle={90}
                         endAngle={-270}
                         innerRadius={70}
                         outerRadius={110}
                         strokeWidth={3}
                         stroke="hsl(var(--background))"
                         label={makePieLabelOutside(projectTotal)}
                         labelLine={true}
                       >
                         {projectPieData.map((entry, index) => {
                           // Find the project and use its scope color for stroke
                           const project = projects.find(p => p.name === entry.name);
                           const projectScope = Array.isArray(project?.scope) 
                             ? project?.scope[0] || 'Unassigned'
                             : project?.scope || 'Unassigned';
                           const color = getScopeColor(projectScope);
                           return (
                             <Cell 
                               key={`project-${entry.name}-${index}`} 
                               fill={`url(#projectGradient-${index})`}
                               stroke={color}
                               strokeWidth={1.5}
                             />
                           );
                         })}
                       </Pie>
                  </PieChart>
                </ChartContainer>

              </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Project</CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Additional Charts: Task Type and Scope */}
      <div className="contents">
        {/* Task Type Pie Chart */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleTaskTypeChartClick}>
          <CardHeader className="pb-2">
            <CardTitle>Task Type</CardTitle>
          </CardHeader>
          <CardContent>
            {taskTypePieData.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 items-center">
                  <ChartContainer config={taskTypeChartConfig} className="h-72 w-full">
                    <PieChart>
                      <defs>
                        {taskTypePieData.map((entry, index) => {
                          const color = getTaskTypeColor(entry.name);
                          return (
                            <linearGradient key={`taskTypeGradient-${index}`} id={`taskTypeGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: number, name: string) => {
                              const minutes = Number(value) || 0;
                               const pct = taskTypeTotal > 0 ? formatPercentCeil((minutes / taskTypeTotal) * 100) : '0';
                               return [`${formatDetailedTime(minutes)} • ${pct}%`, name];

                            }}
                          />
                        }
                      />
                      <Pie
                        data={taskTypePieData}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={70}
                        outerRadius={110}
                        strokeWidth={3}
                        stroke="hsl(var(--background))"
                        label={makePieLabelOutside(taskTypeTotal)}
                        labelLine={true}
                      >
                        {taskTypePieData.map((entry, index) => {
                          const color = getTaskTypeColor(entry.name);
                          return (
                            <Cell 
                              key={`type-${entry.name}-${index}`} 
                              fill={`url(#taskTypeGradient-${index})`}
                              stroke={color}
                              strokeWidth={1.5}
                            />
                          );
                        })}
                      </Pie>
                  </PieChart>
                </ChartContainer>

              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No time data in current range</div>
            )}
          </CardContent>
        </Card>

        {/* Scope Pie Chart */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleScopeChartClick}>
          <CardHeader className="pb-2">
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent>
            {scopePieData.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 items-center">
                  <ChartContainer config={scopeChartConfig} className="h-72 w-full">
                    <PieChart>
                      <defs>
                        {scopePieData.map((entry, index) => {
                          const color = getScopeColor(entry.name);
                          return (
                            <linearGradient key={`scopeGradient-${index}`} id={`scopeGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: number, name: string) => {
                              const minutes = Number(value) || 0;
                               const pct = scopeTotal > 0 ? formatPercentCeil((minutes / scopeTotal) * 100) : '0';
                               return [`${formatDetailedTime(minutes)} • ${pct}%`, name];

                            }}
                          />
                        }
                      />
                      <Pie
                        data={scopePieData}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={70}
                        outerRadius={110}
                        strokeWidth={3}
                        stroke="hsl(var(--background))"
                        label={makePieLabelOutside(scopeTotal)}
                        labelLine={true}
                      >
                        {scopePieData.map((entry, index) => {
                          const color = getScopeColor(entry.name);
                          return (
                            <Cell 
                              key={`scope-${entry.name}-${index}`} 
                              fill={`url(#scopeGradient-${index})`}
                              stroke={color}
                              strokeWidth={1.5}
                            />
                          );
                        })}
                      </Pie>
                    
                  </PieChart>
                </ChartContainer>

              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No time data in current range</div>
            )}
          </CardContent>
        </Card>
      </div>

      </div>

      {/* Daily Hours History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Daily Hours (Last 30 Days)</CardTitle>
          <CardDescription>Total hours per day. Ends today.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-80 w-full">
            <BarChart data={dailyHistoryData}>
              <defs>
                <linearGradient id="dailyMinutesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" tickMargin={8} />
              <YAxis tickFormatter={(v) => `${(Number(v) / 60).toFixed(1)}h`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: number) => [`${(Number(value) / 60).toFixed(2)}h`, 'Total']}
                  />
                }
              />
              
              <ReferenceLine y={480} stroke="hsl(var(--chart-2))" strokeDasharray="2 2" label={{ value: "8h target", position: "top" }} />
              <Bar dataKey="minutes" fill="url(#dailyMinutesGradient)" stroke="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Export */}
      <TimeEntryExport
        entries={filteredEntries}
        filters={filters}
        onExport={() => console.log('Export functionality')}
      />

      {/* Detailed Chart Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {detailModalData?.title}
            </DialogTitle>
          </DialogHeader>
          
          {detailModalData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Full Pie Chart */}
              <div className="space-y-4">
                <ChartContainer config={{}} className="h-96 w-full">
                  <PieChart>
                    <defs>
                      {detailModalData.data.map((entry, index) => {
                        let color;
                        // Use appropriate color based on chart type
                        if (detailModalData.type === 'project') {
                          // Find the project and use its scope color
                          const project = projects.find(p => p.name === entry.name);
                          const projectScope = Array.isArray(project?.scope) 
                            ? project?.scope[0] || 'Unassigned'
                            : project?.scope || 'Unassigned';
                          color = getScopeColor(projectScope);
                        } else if (detailModalData.type === 'taskType') {
                          color = getTaskTypeColor(entry.name);
                        } else if (detailModalData.type === 'scope') {
                          color = getScopeColor(entry.name);
                        } else {
                          color = `hsl(var(--chart-${(index % 12) + 1}))`;
                        }
                        return (
                          <linearGradient key={`modalGradient-${index}`} id={`modalGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                          </linearGradient>
                        );
                      })}
                    </defs>
                     <ChartTooltip
                       content={
                         <ChartTooltipContent
                           formatter={(value: number, name: string) => {
                             const minutes = Number(value) || 0;
                             const pct = detailModalData.total > 0 ? formatPercentCeil((minutes / detailModalData.total) * 100) : '0';
                             return [`${formatDetailedTime(minutes)} • ${pct}%`, name];
                           }}
                         />
                       }
                     />
                      <Pie
                        data={detailModalData.data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        outerRadius={120}
                        stroke="hsl(var(--background))"
                        strokeWidth={1}
                      >
                        {detailModalData.data.map((entry, index) => {
                          let color;
                          // Use appropriate color based on chart type
                          if (detailModalData.type === 'project') {
                            // Find the project and use its scope color
                            const project = projects.find(p => p.name === entry.name);
                            const projectScope = Array.isArray(project?.scope) 
                              ? project?.scope[0] || 'Unassigned'
                              : project?.scope || 'Unassigned';
                            color = getScopeColor(projectScope);
                          } else if (detailModalData.type === 'taskType') {
                            color = getTaskTypeColor(entry.name);
                          } else if (detailModalData.type === 'scope') {
                            color = getScopeColor(entry.name);
                          } else {
                            color = `hsl(var(--chart-${(index % 12) + 1}))`;
                          }
                          return (
                            <Cell 
                              key={`modal-${entry.name}-${index}`} 
                              fill={`url(#modalGradient-${index})`}
                              stroke={color}
                              strokeWidth={1.5}
                            />
                          );
                        })}
                      </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              {/* Detailed Table */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total: {formatDetailedTime(detailModalData.total)} • {detailModalData.data.length} items
                </div>
                
                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailModalData.data.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  background: (() => {
                                    if (detailModalData.type === 'project') {
                                      // Find the project and use its scope color
                                      const project = projects.find(p => p.name === item.name);
                                      const projectScope = Array.isArray(project?.scope) 
                                        ? project?.scope[0] || 'Unassigned'
                                        : project?.scope || 'Unassigned';
                                      return getScopeColor(projectScope);
                                    } else if (detailModalData.type === 'taskType') {
                                      return getTaskTypeColor(item.name);
                                    } else if (detailModalData.type === 'scope') {
                                      return getScopeColor(item.name);
                                    }
                                    return `hsl(var(--chart-${(index % 12) + 1}))`;
                                  })(),
                                  opacity: 0.7
                                }}
                              />
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDetailedTime(item.value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {formatPercentCeil((item.value / detailModalData.total) * 100)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Time Entries</CardTitle>
          <CardDescription>Each timer session as a separate entry with unique ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <FilterableHeader filterType="task">Task</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="project">Project</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="scope">Scope</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="type">Type</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="environment">Environment</FilterableHeader>
                  </TableHead>
                  <TableHead>
                    <FilterableHeader filterType="date">Date</FilterableHeader>
                  </TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {sortedEntries.map((entry) => {
                    const startDate = new Date(entry.startTime);
                    const endDate = entry.endTime ? new Date(entry.endTime) : null;
                    const task = tasks.find(t => t.id === entry.taskId);
                    
                    return (
                      <TableRow key={entry.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => handleRowClick(entry)}>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {entry.taskId === NON_PROJECT_TASK_ID ? 'Non_Project_Task' : `${entry.taskId}_${entry.taskTitle}`}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                           <div className="text-base text-gray-900 dark:text-white truncate">
                             {normalizeProjectName(entry.projectName)}
                           </div>
                        </TableCell>
                        
                         <TableCell>
                            <div className="flex items-center flex-wrap gap-1">
                              {(() => {
                                if (!task) {
                                  return <span className="text-muted-foreground">No task</span>;
                                }
                                
                                if (!task.scope || task.scope.length === 0) {
                                  return <span className="text-muted-foreground">No scope</span>;
                                }
                                
                                return task.scope.map((scopeName, index) => (
                                  <Badge 
                                    key={index}
                                    style={getScopeStyle(scopeName)}
                                    className="text-sm"
                                  >
                                    {scopeName}
                                  </Badge>
                                ));
                              })()}
                            </div>
                         </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center">
                            <Badge 
                              style={getTaskTypeStyle(task?.taskType || '')}
                              className="text-sm border"
                            >
                              {task?.taskType || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center">
                            <Badge 
                              style={getEnvironmentStyle(task?.environment || '')}
                              className="text-sm border"
                            >
                              {task?.environment || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                       
                       <TableCell>
                          <div className="text-base text-gray-900 dark:text-white">
                            {startDate.toLocaleDateString()}
                          </div>
                       </TableCell>
                       
                       <TableCell>
                          <div className="text-base text-gray-900 dark:text-white">
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </TableCell>
                       
                       <TableCell>
                         <div className="text-base text-gray-900 dark:text-white">
                           {entry.isRunning ? (
                             <span className="text-green-600 dark:text-green-400">In Progress</span>
                           ) : (
                             endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
                           )}
                         </div>
                       </TableCell>
                       
                       <TableCell>
                         <div className="text-base font-medium text-gray-900 dark:text-white">
                           {entry.duration ? formatDetailedTime(entry.duration) : '-'}
                         </div>
                       </TableCell>
                      
                       <TableCell>
                         <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTimeEntry(entry)}
                            title="Edit Time Entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTimeEntry(entry.id)}
                            title="Delete Time Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || Object.keys(filters).length > 1
                  ? "No time entries found matching your filters."
                  : "No time entries yet. Start a timer on a task to begin tracking time."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Time Entry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Modify the time entry: {editingEntry?.id}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={editFormData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-time" className="text-right">
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={editFormData.startTime}
                onChange={(e) => handleFormChange('startTime', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-time" className="text-right">
                End Time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={editFormData.endTime}
                onChange={(e) => handleFormChange('endTime', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <div className="col-span-3 text-base text-gray-600 dark:text-gray-400 py-2">
                {formatDetailedTime(editFormData.totalMinutes)}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTimeEntry}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeTrackingPage;