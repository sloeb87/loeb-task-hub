import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/simple/DataTable';
import { useSimpleApp, SimpleFollowup } from '@/contexts/SimpleAppContext';
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

const followupSchema = z.object({
  task_id: z.string().min(1, 'Task is required'),
  content: z.string().min(1, 'Content is required'),
});

type FollowupFormData = z.infer<typeof followupSchema>;

const SimpleFollowups = () => {
  const { followups, tasks, createFollowup, deleteFollowup, loading } = useSimpleApp();
  const [showForm, setShowForm] = useState(false);
  const [deleteFollowup_State, setDeleteFollowup_State] = useState<SimpleFollowup | undefined>();

  const form = useForm<FollowupFormData>({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      task_id: '',
      content: '',
    },
  });

  const handleDelete = (followup: SimpleFollowup) => {
    setDeleteFollowup_State(followup);
  };

  const confirmDelete = async () => {
    if (deleteFollowup_State) {
      await deleteFollowup(deleteFollowup_State.id);
      setDeleteFollowup_State(undefined);
    }
  };

  const onSubmit = async (data: FollowupFormData) => {
    try {
      await createFollowup({
        task_id: data.task_id,
        content: data.content,
      });
      form.reset();
      setShowForm(false);
    } catch (error) {
      console.error('Error creating followup:', error);
    }
  };

  const columns: Column<SimpleFollowup>[] = [
    {
      key: 'task_title',
      header: 'Task',
      render: (value) => value || 'Unknown Task',
      sortable: true,
    },
    {
      key: 'content',
      header: 'Follow-up Content',
      render: (value) => (
        <div className="max-w-md truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Follow-ups</h1>
            <p className="text-muted-foreground">Track task follow-ups</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Follow-up</span>
          </Button>
        </div>

        {/* Follow-ups Table */}
        <DataTable
          data={followups}
          columns={columns}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No follow-ups found. Add your first follow-up to get started."
        />

        {/* Follow-up Form Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Follow-up</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="task_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title} {task.project_name && `(${task.project_name})`}
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
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter follow-up details..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Follow-up
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteFollowup_State} onOpenChange={() => setDeleteFollowup_State(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Follow-up</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this follow-up? This action cannot be undone.
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

export default SimpleFollowups;