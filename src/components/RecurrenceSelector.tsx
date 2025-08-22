import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Repeat, X, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  recurrenceDaysOfWeek?: number[];
  taskId?: string;  // Task ID for generating instances
  onRecurrenceChange: (recurrence: {
    isRecurring: boolean;
    recurrenceType?: 'daily' | 'weekly' | 'monthly';
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
    recurrenceDaysOfWeek?: number[];
  }) => void;
}

export const RecurrenceSelector = ({
  isRecurring,
  recurrenceType,
  recurrenceInterval = 1,
  recurrenceEndDate,
  recurrenceDaysOfWeek = [],
  taskId,
  onRecurrenceChange
}: RecurrenceSelectorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const daysOfWeek = [
    { value: 1, label: 'Mon', fullLabel: 'Monday' },
    { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
    { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
    { value: 4, label: 'Thu', fullLabel: 'Thursday' },
    { value: 5, label: 'Fri', fullLabel: 'Friday' },
    { value: 6, label: 'Sat', fullLabel: 'Saturday' },
    { value: 0, label: 'Sun', fullLabel: 'Sunday' }
  ];

  // Calculate number of instances that will be created
  const calculateInstanceCount = (): number => {
    if (!recurrenceType || !recurrenceEndDate || !recurrenceInterval) return 0;

    const startDate = new Date();
    const endDate = new Date(recurrenceEndDate);
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate && count < 1000) { // Safety limit
      switch (recurrenceType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrenceInterval);
          // Skip weekends for daily recurrence
          if (recurrenceInterval === 1) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
              continue;
            }
          }
          break;
        case 'weekly':
          // For weekly recurrence with specific days, calculate differently
          if (recurrenceDaysOfWeek && recurrenceDaysOfWeek.length > 0) {
            // Skip to next occurrence within the week pattern
            let foundNextDay = false;
            let daysToAdd = 1;
            while (!foundNextDay && daysToAdd <= 7 * recurrenceInterval) {
              const nextDate = new Date(currentDate);
              nextDate.setDate(nextDate.getDate() + daysToAdd);
              const dayOfWeek = nextDate.getDay();
              if (recurrenceDaysOfWeek.includes(dayOfWeek)) {
                currentDate = nextDate;
                foundNextDay = true;
              } else {
                daysToAdd++;
              }
            }
            if (!foundNextDay) {
              currentDate.setDate(currentDate.getDate() + (recurrenceInterval * 7));
            }
          } else {
            currentDate.setDate(currentDate.getDate() + (recurrenceInterval * 7));
          }
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrenceInterval);
          break;
      }
      
      if (currentDate <= endDate) {
        count++;
      }
    }
    
    return count;
  };

  const handleShowConfirmDialog = () => {
    if (!taskId) {
      toast.error("Task ID is required to generate recurring instances");
      return;
    }

    if (!isRecurring || !recurrenceType || !recurrenceEndDate) {
      toast.error("Please configure all recurrence settings first");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleGenerateInstances = async () => {
    setShowConfirmDialog(false);
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.rpc('generate_recurring_instances', {
        task_uuid: taskId
      });

      if (error) {
        console.error('Error generating recurring instances:', error);
        toast.error("Failed to generate recurring instances: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.created_count > 0) {
          toast.success(result.message);
        } else {
          toast.warning(result.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while generating recurring instances");
    } finally {
      setIsGenerating(false);
    }
  };
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
    recurrenceDaysOfWeek: number[];
  }>) => {
    onRecurrenceChange({
      isRecurring: true,
      recurrenceType,
      recurrenceInterval,
      recurrenceEndDate,
      recurrenceDaysOfWeek,
      ...updates
    });
  };

  const handleDayToggle = (dayValue: number) => {
    const currentDays = recurrenceDaysOfWeek || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort();
    
    handleRecurrenceUpdate({ recurrenceDaysOfWeek: newDays });
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
    <div className="flex items-center gap-2 flex-wrap">
      {/* Toggle Button */}
      <Button
        type="button"
        variant={isRecurring ? "default" : "outline"}
        size="sm"
        onClick={handleToggleRecurrence}
        className="flex items-center gap-1 h-8 px-3"
      >
        <Repeat className="w-3 h-3" />
        {isRecurring ? "Recurring" : "Repeat"}
      </Button>

      {/* Inline Controls when recurring is enabled */}
      {isRecurring && (
        <>
          <span className="text-sm text-muted-foreground">every</span>
          
          <Select
            value={recurrenceInterval?.toString() || "1"}
            onValueChange={(value) => 
              handleRecurrenceUpdate({ recurrenceInterval: parseInt(value) })
            }
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurrenceType || "weekly"}
            onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
              handleRecurrenceUpdate({ recurrenceType: value })
            }
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">day(s)</SelectItem>
              <SelectItem value="weekly">week(s)</SelectItem>
              <SelectItem value="monthly">month(s)</SelectItem>
            </SelectContent>
          </Select>

          {/* Days of Week Selection for Weekly Recurrence */}
          {recurrenceType === 'weekly' && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">on</span>
              <div className="flex gap-1">
                {daysOfWeek.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={recurrenceDaysOfWeek?.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                    className="h-8 w-10 px-0 text-xs"
                    title={day.fullLabel}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <span className="text-sm text-muted-foreground">until</span>

          <input
            type="date"
            value={recurrenceEndDate || ''}
            onChange={(e) => handleRecurrenceUpdate({ recurrenceEndDate: e.target.value })}
            className="h-8 px-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            required
          />

          {/* Generate Button - now inline */}
          {taskId && recurrenceType && recurrenceEndDate && (
            <Button
              type="button"
              onClick={handleShowConfirmDialog}
              disabled={isGenerating}
              size="sm"
              className="h-8 px-3"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Calendar className="w-3 h-3 mr-1" />
              )}
              Generate ({calculateInstanceCount()})
            </Button>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Recurring Task Instances</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to generate recurring task instances with the following settings:</p>
              
              <div className="bg-muted p-3 rounded-md space-y-1">
                <p><strong>Frequency:</strong> {getRecurrenceLabel()}</p>
                <p><strong>End Date:</strong> {recurrenceEndDate}</p>
                <p><strong>Estimated Tasks to Create:</strong> <span className="font-bold text-primary">{calculateInstanceCount()}</span></p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                This will create individual tasks for each occurrence. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateInstances}>
              Generate Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};