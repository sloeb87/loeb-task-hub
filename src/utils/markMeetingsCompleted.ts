import { supabase } from "@/integrations/supabase/client";

export async function markMeetingsCompletedUntilDate(untilDate: string, userId: string) {
  try {
    // First, get all meetings that need to be updated
    const { data: meetings, error: fetchError } = await supabase
      .from('tasks')
      .select('id, task_number, title, due_date')
      .eq('user_id', userId)
      .eq('is_meeting', true)
      .lte('due_date', untilDate)
      .neq('status', 'Completed');

    if (fetchError) {
      console.error('Error fetching meetings:', fetchError);
      return { success: false, error: fetchError.message, count: 0 };
    }

    if (!meetings || meetings.length === 0) {
      return { success: true, count: 0, message: 'No meetings to update' };
    }

    // Update each meeting individually to set completion_date to its due_date
    const updatePromises = meetings.map(meeting =>
      supabase
        .from('tasks')
        .update({
          status: 'Completed',
          completion_date: meeting.due_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', meeting.id)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some updates failed:', errors);
      return {
        success: false,
        error: `${errors.length} updates failed`,
        count: meetings.length - errors.length
      };
    }

    return {
      success: true,
      count: meetings.length,
      message: `Successfully marked ${meetings.length} meeting(s) as completed`,
      meetings: meetings.map(m => ({ id: m.id, title: m.title, taskNumber: m.task_number }))
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    };
  }
}
