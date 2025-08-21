import React from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  onRecurrenceChange: (recurrence: {
    isRecurring: boolean;
    recurrenceType?: 'daily' | 'weekly' | 'monthly';
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
  }) => void;
}

export const RecurrenceSelector = ({
  isRecurring,
  recurrenceType,
  recurrenceInterval = 1,
  recurrenceEndDate,
  onRecurrenceChange
}: RecurrenceSelectorProps) => {
  const handleToggleRecurrence = () => {
    if (isRecurring) {
      onRecurrenceChange({ isRecurring: false });
    } else {
      onRecurrenceChange({
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceInterval: 1
      });
    }
  };

  const handleRecurrenceUpdate = (updates: Partial<{
    recurrenceType: 'daily' | 'weekly' | 'monthly';
    recurrenceInterval: number;
    recurrenceEndDate: string;
  }>) => {
    onRecurrenceChange({
      isRecurring: true,
      recurrenceType,
      recurrenceInterval,
      recurrenceEndDate,
      ...updates
    });
  };

  const getRecurrenceLabel = () => {
    if (!isRecurring || !recurrenceType) return '';
    
    const intervalText = recurrenceInterval === 1 ? '' : `${recurrenceInterval} `;
    const typeText = recurrenceType === 'daily' ? 'weekday' : 
                     recurrenceType === 'weekly' ? 'week' : 'month';
    const pluralText = recurrenceInterval === 1 ? typeText : `${typeText}s`;
    
    return `Every ${intervalText}${pluralText}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Button */}
      <Button
        type="button"
        variant={isRecurring ? "default" : "outline"}
        size="sm"
        onClick={handleToggleRecurrence}
        className="flex items-center gap-2"
      >
        <Repeat className="w-4 h-4" />
        {isRecurring ? "Recurring" : "Repeat"}
      </Button>

      {/* Recurrence Settings */}
      {isRecurring && (
        <>
          <Badge variant="secondary" className="text-xs">
            {getRecurrenceLabel()}
          </Badge>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Recurrence Settings</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleRecurrence}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Repeat every</label>
                    <Select
                      value={recurrenceInterval?.toString() || "1"}
                      onValueChange={(value) => 
                        handleRecurrenceUpdate({ recurrenceInterval: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Period</label>
                    <Select
                      value={recurrenceType || "weekly"}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                        handleRecurrenceUpdate({ recurrenceType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Weekday(s)</SelectItem>
                        <SelectItem value="weekly">Week(s)</SelectItem>
                        <SelectItem value="monthly">Month(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">End recurrence *</label>
                  <input
                    type="date"
                    value={recurrenceEndDate || ''}
                    onChange={(e) => handleRecurrenceUpdate({ recurrenceEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
};