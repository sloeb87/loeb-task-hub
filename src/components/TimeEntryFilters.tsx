import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { TimeEntryFilters } from "@/types/timeEntry";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface TimeEntryFiltersProps {
  filters: TimeEntryFilters;
  onFiltersChange: (filters: TimeEntryFilters) => void;
  onClearFilters: () => void;
}

export const TimeEntryFiltersComponent = ({ filters, onFiltersChange, onClearFilters }: TimeEntryFiltersProps) => {
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

  const hasActiveFilters = filters.dateRange || filters.month || filters.year;

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range";
    if (!dateRange?.to) return format(dateRange.from, "MMM dd, yyyy");
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Filter className="w-5 h-5 mr-2" />
          Filter Time Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range
            </label>
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
          </div>

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