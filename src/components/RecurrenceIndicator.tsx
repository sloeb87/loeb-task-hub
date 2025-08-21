import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurrenceIndicatorProps {
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  recurrenceInterval?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const RecurrenceIndicator = ({ 
  isRecurring, 
  recurrenceType, 
  recurrenceInterval = 1,
  className,
  size = 'sm'
}: RecurrenceIndicatorProps) => {
  if (!isRecurring || !recurrenceType) {
    return null;
  }

  const getRecurrenceText = () => {
    const intervalText = recurrenceInterval === 1 ? '' : `${recurrenceInterval}`;
    const typeText = recurrenceType === 'daily' ? 'd' : 
                    recurrenceType === 'weekly' ? 'w' : 'm';
    
    return intervalText + typeText;
  };

  const getFullRecurrenceText = () => {
    const intervalText = recurrenceInterval === 1 ? '' : `${recurrenceInterval} `;
    const typeText = recurrenceType === 'daily' ? 'day' : 
                    recurrenceType === 'weekly' ? 'week' : 'month';
    const pluralText = recurrenceInterval === 1 ? typeText : `${typeText}s`;
    
    return `Every ${intervalText}${pluralText}`;
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20",
        size === 'sm' && "text-xs px-1.5 py-0.5",
        size === 'md' && "text-sm px-2 py-1",
        className
      )}
      title={getFullRecurrenceText()}
    >
      <Repeat className={cn(
        size === 'sm' ? "w-3 h-3" : "w-4 h-4"
      )} />
      {size === 'md' ? getFullRecurrenceText() : getRecurrenceText()}
    </Badge>
  );
};