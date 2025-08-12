import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Filter, X } from "lucide-react";
import { TimeEntryFilters } from "@/types/timeEntry";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";
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

  const handleNativeDateChange = (which: 'from' | 'to', value: string) => {
    const date = value ? new Date(`${value}T00:00:00`) : undefined;
    const newRange: DateRange | undefined = {
      from: which === 'from' ? date : dateRange?.from,
      to: which === 'to' ? date : dateRange?.to,
    };

    if (newRange?.from || newRange?.to) {
      setDateRange(newRange);
    } else {
      setDateRange(undefined);
    }

    if (newRange?.from && newRange?.to) {
      onFiltersChange({
        ...filters,
        dateRange: { from: newRange.from, to: newRange.to },
        year: undefined,
        month: undefined,
      });
    } else if (!newRange?.from && !newRange?.to) {
      onFiltersChange({
        ...filters,
        dateRange: undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        dateRange: undefined,
      });
    }
  };

  const handlePresetSelection = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'yesterday':
        from = startOfDay(subDays(now, 1));
        to = endOfDay(subDays(now, 1));
        break;
      case 'thisWeek':
        from = startOfWeek(now);
        to = endOfWeek(now);
        break;
      case 'lastWeek':
        from = startOfWeek(subWeeks(now, 1));
        to = endOfWeek(subWeeks(now, 1));
        break;
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


  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From</span>
            <Input
              type="date"
              value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
              onChange={(e) => handleNativeDateChange('from', e.target.value)}
              className="w-[160px] h-9"
            />
            <span className="text-xs text-muted-foreground">To</span>
            <Input
              type="date"
              value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
              onChange={(e) => handleNativeDateChange('to', e.target.value)}
              className="w-[160px] h-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('today')}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('yesterday')}>Yesterday</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('thisWeek')}>This Week</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('lastWeek')}>Last Week</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('thisMonth')}>This Month</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('lastMonth')}>Last Month</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('thisYear')}>This Year</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('lastYear')}>Last Year</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('last30Days')}>Last 30 Days</Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetSelection('last90Days')}>Last 90 Days</Button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};