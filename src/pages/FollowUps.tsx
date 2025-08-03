import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { MessageSquare, Search, Calendar as CalendarIcon, Filter, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Task, FollowUp } from "@/types/task";
import { useScopeColor } from "@/hooks/useScopeColor";
import { useTaskTypeColor } from "@/hooks/useTaskTypeColor";
import { useEnvironmentColor } from "@/hooks/useEnvironmentColor";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface FollowUpsPageProps {
  tasks: Task[];
}

interface FollowUpFilters {
  dateRange?: { from: Date; to: Date };
  year?: number;
  month?: number;
  projects?: string[];
  scopes?: string[];
  taskTypes?: string[];
  environments?: string[];
}

interface FollowUpWithTask extends FollowUp {
  taskId: string;
  taskTitle: string;
  taskScope: string;
  taskType: string;
  taskEnvironment: string;
  projectName: string;
}

export const FollowUpsPage = ({ tasks }: FollowUpsPageProps) => {
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FollowUpFilters>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Get all follow-ups with task information
  const allFollowUps = useMemo(() => {
    const followUps: FollowUpWithTask[] = [];
    
    tasks.forEach(task => {
      task.followUps.forEach(followUp => {
        followUps.push({
          ...followUp,
          taskId: task.id,
          taskTitle: task.title,
          taskScope: task.scope,
          taskType: task.taskType,
          taskEnvironment: task.environment,
          projectName: task.project
        });
      });
    });

    return followUps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tasks]);

  // Apply date and column filters
  const dateFilteredFollowUps = useMemo(() => {
    let filtered = allFollowUps;

    // Apply date filters
    if (filters.dateRange || filters.year || filters.month) {
      filtered = filtered.filter(followUp => {
        const followUpDate = new Date(followUp.timestamp);
        
        if (filters.dateRange) {
          return followUpDate >= filters.dateRange.from && followUpDate <= filters.dateRange.to;
        }
        
        if (filters.year && filters.month) {
          return followUpDate.getFullYear() === filters.year && followUpDate.getMonth() === filters.month - 1;
        }
        
        if (filters.year) {
          return followUpDate.getFullYear() === filters.year;
        }
        
        return true;
      });
    }

    // Apply column filters
    if (filters.projects && filters.projects.length > 0) {
      filtered = filtered.filter(followUp => filters.projects!.includes(followUp.projectName));
    }

    if (filters.scopes && filters.scopes.length > 0) {
      filtered = filtered.filter(followUp => filters.scopes!.includes(followUp.taskScope));
    }

    if (filters.taskTypes && filters.taskTypes.length > 0) {
      filtered = filtered.filter(followUp => filters.taskTypes!.includes(followUp.taskType));
    }

    if (filters.environments && filters.environments.length > 0) {
      filtered = filtered.filter(followUp => filters.environments!.includes(followUp.taskEnvironment));
    }

    return filtered;
  }, [allFollowUps, filters]);

  // Filter follow-ups based on search term
  const filteredFollowUps = useMemo(() => {
    if (!searchTerm) return dateFilteredFollowUps;
    
    return dateFilteredFollowUps.filter(followUp => 
      followUp.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.taskEnvironment.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dateFilteredFollowUps, searchTerm]);

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    return {
      projects: [...new Set(allFollowUps.map(f => f.projectName))].sort(),
      scopes: [...new Set(allFollowUps.map(f => f.taskScope))].sort(),
      taskTypes: [...new Set(allFollowUps.map(f => f.taskType))].sort(),
      environments: [...new Set(allFollowUps.map(f => f.taskEnvironment))].sort()
    };
  }, [allFollowUps]);

  // Calculate statistics
  const stats = useMemo(() => {
    const uniqueTasks = new Set(filteredFollowUps.map(f => f.taskId));
    const recentFollowUps = filteredFollowUps.filter(f => {
      const followUpDate = new Date(f.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return followUpDate >= sevenDaysAgo;
    });

    return {
      totalFollowUps: filteredFollowUps.length,
      tasksWithFollowUps: uniqueTasks.size,
      recentFollowUps: recentFollowUps.length
    };
  }, [filteredFollowUps]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setFilters({
        ...filters,
        dateRange: { from: range.from, to: range.to },
        year: undefined,
        month: undefined
      });
    } else {
      setFilters({
        ...filters,
        dateRange: undefined
      });
    }
  };

  const handlePresetSelection = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'thisYear':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case 'lastYear':
        from = startOfYear(subYears(now, 1));
        to = endOfYear(subYears(now, 1));
        break;
      case 'last30Days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case 'last90Days':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      default:
        return;
    }

    setDateRange({ from, to });
    setFilters({
      ...filters,
      dateRange: { from, to },
      year: undefined,
      month: undefined
    });
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange(undefined);
  };

  const updateColumnFilter = (column: keyof Pick<FollowUpFilters, 'projects' | 'scopes' | 'taskTypes' | 'environments'>, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [column]: values.length > 0 ? values : undefined
    }));
  };

  const MultiSelectFilter = ({ 
    title, 
    options, 
    selectedValues = [], 
    onSelectionChange,
    colorFunction 
  }: {
    title: string;
    options: string[];
    selectedValues: string[];
    onSelectionChange: (values: string[]) => void;
    colorFunction?: (value: string) => any;
  }) => {
    const [open, setOpen] = useState(false);

    const toggleSelection = (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newValues);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 border-dashed border border-gray-300 dark:border-gray-600"
          >
            <Filter className="mr-2 h-3 w-3" />
            {title}
            {selectedValues.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                {selectedValues.length}
              </Badge>
            )}
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
            <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => toggleSelection(option)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Checkbox
                      checked={selectedValues.includes(option)}
                      onChange={() => toggleSelection(option)}
                    />
                    {colorFunction ? (
                      <Badge 
                        style={colorFunction(option)}
                        className="text-xs"
                      >
                        {option}
                      </Badge>
                    ) : (
                      <span>{option}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and manage all task follow-ups</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalFollowUps}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks with Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.tasksWithFollowUps}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.recentFollowUps}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Period Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetSelection('thisMonth')}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetSelection('lastMonth')}
            >
              Last Month
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetSelection('thisYear')}
            >
              This Year
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetSelection('lastYear')}
            >
              Last Year
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetSelection('last30Days')}
            >
              Last 30 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetSelection('last90Days')}
            >
              Last 90 Days
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {(filters.dateRange || filters.year || filters.month || 
              filters.projects?.length || filters.scopes?.length || 
              filters.taskTypes?.length || filters.environments?.length) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Follow-Ups Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Follow-Ups</CardTitle>
          <CardDescription>
            Complete history of task follow-ups and comments
            {(filters.projects?.length || filters.scopes?.length || filters.taskTypes?.length || filters.environments?.length) && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (Filtered by column selections)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <span>Project</span>
                      <MultiSelectFilter
                        title="Filter"
                        options={uniqueValues.projects}
                        selectedValues={filters.projects || []}
                        onSelectionChange={(values) => updateColumnFilter('projects', values)}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <span>Scope</span>
                      <MultiSelectFilter
                        title="Filter"
                        options={uniqueValues.scopes}
                        selectedValues={filters.scopes || []}
                        onSelectionChange={(values) => updateColumnFilter('scopes', values)}
                        colorFunction={getScopeStyle}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <span>Type</span>
                      <MultiSelectFilter
                        title="Filter"
                        options={uniqueValues.taskTypes}
                        selectedValues={filters.taskTypes || []}
                        onSelectionChange={(values) => updateColumnFilter('taskTypes', values)}
                        colorFunction={getTaskTypeStyle}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <span>Environment</span>
                      <MultiSelectFilter
                        title="Filter"
                        options={uniqueValues.environments}
                        selectedValues={filters.environments || []}
                        onSelectionChange={(values) => updateColumnFilter('environments', values)}
                        colorFunction={getEnvironmentStyle}
                      />
                    </div>
                  </TableHead>
                  <TableHead>Follow-Up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowUps.map((followUp) => (
                  <TableRow key={`${followUp.taskId}-${followUp.id}`} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(followUp.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {followUp.taskId}_{followUp.taskTitle}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {followUp.projectName}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getScopeStyle(followUp.taskScope)}
                          className="text-xs"
                        >
                          {followUp.taskScope}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getTaskTypeStyle(followUp.taskType)}
                          className="text-xs border"
                        >
                          {followUp.taskType}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <Badge 
                          style={getEnvironmentStyle(followUp.taskEnvironment)}
                          className="text-xs border"
                        >
                          {followUp.taskEnvironment}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white max-w-xs">
                        <p className="line-clamp-2">{followUp.text}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredFollowUps.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No follow-ups found matching your search."
                  : "No follow-ups yet. Add follow-ups to tasks to track progress and discussions."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};