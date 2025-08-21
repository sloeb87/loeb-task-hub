import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface FollowUpFilters {
  dateRange?: { from: Date; to: Date };
  year?: number;
  month?: number;
  projects?: string[];
  scopes?: string[];
  taskTypes?: string[];
  environments?: string[];
}

interface FollowUpFiltersProps {
  filters: FollowUpFilters;
  onFiltersChange: (filters: FollowUpFilters) => void;
  onClearFilters: () => void;
  availableProjects?: string[];
  hideDateRange?: boolean;
}

export const FollowUpFiltersComponent = ({ filters, onFiltersChange, onClearFilters, availableProjects = [], hideDateRange = false }: FollowUpFiltersProps) => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined
  );

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        dateRange: { from: range.from, to: range.to },
        year: undefined,
        month: undefined
      });
    } else {
      onFiltersChange({
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

    const range = { from, to };
    setDateRange(range);
    onFiltersChange({
      ...filters,
      dateRange: range,
      year: undefined,
      month: undefined
    });
  };

  const hasActiveFilters =
    (!hideDateRange && (filters.dateRange || filters.month || filters.year)) ||
    filters.projects?.length || filters.scopes?.length || 
    filters.taskTypes?.length || filters.environments?.length;

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range";
    if (!dateRange?.to) return format(dateRange.from, "MMM dd, yyyy");
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range Picker and Project Filter */}
          {!hideDateRange && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <div className="flex gap-4 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateRange()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelection('thisMonth')}
                        >
                          This Month
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelection('lastMonth')}
                        >
                          Last Month
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelection('thisYear')}
                        >
                          This Year
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelection('lastYear')}
                        >
                          Last Year
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelection('last30Days')}
                        >
                          Last 30 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelection('last90Days')}
                        >
                          Last 90 Days
                        </Button>
                      </div>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Project Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-between"
                    >
                      {filters.projects?.length 
                        ? `${filters.projects.length} project(s) selected`
                        : "Select projects"
                      }
                      <Filter className="ml-2 h-4 w-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {availableProjects.map((project) => (
                        <div key={project} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project}`}
                            checked={filters.projects?.includes(project) || false}
                            onCheckedChange={(checked) => {
                              const currentProjects = filters.projects || [];
                              const updatedProjects = checked
                                ? [...currentProjects, project]
                                : currentProjects.filter(p => p !== project);
                              onFiltersChange({
                                ...filters,
                                projects: updatedProjects.length > 0 ? updatedProjects : undefined
                              });
                            }}
                          />
                          <label 
                            htmlFor={`project-${project}`}
                            className="text-sm cursor-pointer flex-1 truncate"
                            title={project}
                          >
                            {project}
                          </label>
                        </div>
                      ))}
                      {availableProjects.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No projects available
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};