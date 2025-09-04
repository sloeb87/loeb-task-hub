import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable, Column } from '@/components/simple/DataTable';
import { useSimpleApp, SimpleTimeEntry } from '@/contexts/SimpleAppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const timeEntrySchema = z.object({
  task_id: z.string().optional(),
  project_id: z.string().optional(),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
  date: z.string().min(1, 'Date is required'),
});

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

export const SimpleTimeTracking = () => {
  const { timeEntries, tasks, projects, createTimeEntry, updateTimeEntry, deleteTimeEntry, loading } = useSimpleApp();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SimpleTimeEntry | undefined>();
  const [deleteEntry_State, setDeleteEntry_State] = useState<SimpleTimeEntry | undefined>();

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      task_id: '',
      project_id: '',
      description: '',
      duration_minutes: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleEdit = (entry: SimpleTimeEntry) => {
    setEditingEntry(entry);
    form.reset({
      task_id: entry.task_id || '',
      project_id: entry.project_id || '',
      description: entry.description || '',
      duration_minutes: entry.duration_minutes,
      date: entry.date,
    });
    setShowForm(true);
  };

  const handleDelete = (entry: SimpleTimeEntry) => {
    setDeleteEntry_State(entry);
  };

  const confirmDelete = async () => {
    if (deleteEntry_State) {
      await deleteTimeEntry(deleteEntry_State.id);
      setDeleteEntry_State(undefined);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEntry(undefined);
    form.reset();
  };

  const onSubmit = async (data: TimeEntryFormData) => {
    try {
      const entryData = {
        task_id: data.task_id || undefined,
        project_id: data.project_id || undefined,
        description: data.description || undefined,
        duration_minutes: data.duration_minutes,
        date: data.date,
      };

      if (editingEntry) {
        await updateTimeEntry(editingEntry.id, entryData);
      } else {
        await createTimeEntry(entryData);
      }

      closeForm();
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const columns: Column<SimpleTimeEntry>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
    {
      key: 'task_title',
      header: 'Task',
      render: (value) => value || 'No Task',
      sortable: true,
    },
    {
      key: 'project_name',
      header: 'Project',
      render: (value) => value || 'No Project',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div className="max-w-md truncate" title={value || ''}>
          {value || 'No description'}
        </div>
      ),
    },
    {
      key: 'duration_minutes',
      header: 'Duration',
      render: (value) => formatDuration(value),
      sortable: true,
    },
  ];

  // Calculate total time
  const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
            <p className="text-muted-foreground">
              Track your time • Total: {totalHours}h ({timeEntries.length} entries)
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Time Entry</span>
          </Button>
        </div>

        {/* Time Entries Table */}
        <DataTable
          data={timeEntries}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No time entries found. Add your first time entry to get started."
        />

        {/* Time Entry Form Modal */}
        <Dialog open={showForm} onOpenChange={closeForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="task_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select task" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No Task</SelectItem>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No Project</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What did you work on?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEntry ? 'Update' : 'Add'} Entry
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteEntry_State} onOpenChange={() => setDeleteEntry_State(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this time entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};