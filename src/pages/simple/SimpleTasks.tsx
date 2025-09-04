import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { DataTable, Column } from '@/components/simple/DataTable';
import { SimpleTaskForm } from '@/components/simple/SimpleTaskForm';
import { useSimpleApp, SimpleTask } from '@/contexts/SimpleAppContext';
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

const SimpleTasks = () => {
  const { tasks, deleteTask, loading } = useSimpleApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<SimpleTask | undefined>();
  const [deleteTask_State, setDeleteTask_State] = useState<SimpleTask | undefined>();

  const handleEdit = (task: SimpleTask) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (task: SimpleTask) => {
    setDeleteTask_State(task);
  };

  const confirmDelete = async () => {
    if (deleteTask_State) {
      await deleteTask(deleteTask_State.id);
      setDeleteTask_State(undefined);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'secondary';
      case 'in_progress': return 'default';
      case 'todo': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const columns: Column<SimpleTask>[] = [
    {
      key: 'title',
      header: 'Task Title',
      sortable: true,
    },
    {
      key: 'project_name',
      header: 'Project',
      render: (value) => value || 'No Project',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={getStatusColor(value)}>
          {value.replace('_', ' ')}
        </Badge>
      ),
      filterType: 'select',
      filterOptions: [
        { value: 'todo', label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (value) => (
        <Badge variant={getPriorityColor(value)}>
          {value}
        </Badge>
      ),
      filterType: 'select',
      filterOptions: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
    },
    {
      key: 'responsible',
      header: 'Responsible',
      render: (value) => value || 'Unassigned',
      sortable: true,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (value, item) => {
        if (!value) return '';
        const date = new Date(value);
        const isOverdue = date < new Date() && item.status !== 'completed';
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {date.toLocaleDateString()}
          </span>
        );
      },
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>

        {/* Tasks Table */}
        <DataTable
          data={tasks}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No tasks found. Create your first task to get started."
        />

        {/* Task Form Modal */}
        <SimpleTaskForm
          open={showForm}
          onClose={closeForm}
          task={editingTask}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTask_State} onOpenChange={() => setDeleteTask_State(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTask_State?.title}"? This action cannot be undone.
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

export default SimpleTasks;