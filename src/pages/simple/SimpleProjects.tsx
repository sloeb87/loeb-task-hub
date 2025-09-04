import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { DataTable, Column } from '@/components/simple/DataTable';
import { SimpleProjectForm } from '@/components/simple/SimpleProjectForm';
import { useSimpleApp, SimpleProject } from '@/contexts/SimpleAppContext';
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

const SimpleProjects = () => {
  const { projects, deleteProject, loading } = useSimpleApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<SimpleProject | undefined>();
  const [deleteProject_State, setDeleteProject_State] = useState<SimpleProject | undefined>();

  const handleEdit = (project: SimpleProject) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = (project: SimpleProject) => {
    setDeleteProject_State(project);
  };

  const confirmDelete = async () => {
    if (deleteProject_State) {
      await deleteProject(deleteProject_State.id);
      setDeleteProject_State(undefined);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProject(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'outline';
      default: return 'secondary';
    }
  };

  const columns: Column<SimpleProject>[] = [
    {
      key: 'name',
      header: 'Project Name',
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
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'on_hold', label: 'On Hold' },
      ],
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true,
    },
    {
      key: 'start_date',
      header: 'Start Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '',
      sortable: true,
    },
    {
      key: 'end_date',
      header: 'End Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '',
      sortable: true,
    },
    {
      key: 'team_members',
      header: 'Team',
      render: (value) => value ? (
        <div className="text-sm">
          {value.split(',').length} member{value.split(',').length !== 1 ? 's' : ''}
        </div>
      ) : '',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">Manage your projects</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>

        {/* Projects Table */}
        <DataTable
          data={projects}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No projects found. Create your first project to get started."
        />

        {/* Project Form Modal */}
        <SimpleProjectForm
          open={showForm}
          onClose={closeForm}
          project={editingProject}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteProject_State} onOpenChange={() => setDeleteProject_State(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteProject_State?.name}"? This action cannot be undone.
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

export default SimpleProjects;