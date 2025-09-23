import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Settings, 
  Save,
  RefreshCw,
  Check,
  X,
  Edit3,
  Palette,
  GripVertical,
  Tag
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ParametersProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColoredItem {
  id: string;
  name: string;
  color: string;
}

interface SortableItemProps {
  item: ColoredItem | string;
  index: number;
  type: string;
  isEditing: boolean;
  editingValue: string;
  editingColor?: string;
  onEdit: (type: string, index: number, value: string, color?: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: (type: string, index: number) => void;
  onEditChange: (value: string, color?: string) => void;
  predefinedColors: { name: string; value: string }[];
}

const predefinedColors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Orange", value: "#f97316" },
  { name: "Lime", value: "#84cc16" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

const defaultEnvironments: ColoredItem[] = [
  { id: "env-1", name: "Development", color: "#3b82f6" },
  { id: "env-2", name: "Testing", color: "#f59e0b" },
  { id: "env-3", name: "Staging", color: "#8b5cf6" },
  { id: "env-4", name: "Production", color: "#ef4444" },
  { id: "env-5", name: "Demo", color: "#10b981" }
];

const defaultTaskTypes: ColoredItem[] = [
  { id: "task-1", name: "Development", color: "#3b82f6" },
  { id: "task-2", name: "Testing", color: "#f59e0b" },
  { id: "task-3", name: "Documentation", color: "#10b981" },
  { id: "task-4", name: "Review", color: "#8b5cf6" },
  { id: "task-5", name: "Meeting", color: "#ec4899" },
  { id: "task-6", name: "Research", color: "#06b6d4" }
];

const defaultStatuses: ColoredItem[] = [
  { id: "status-1", name: "Open", color: "#6b7280" },
  { id: "status-2", name: "In Progress", color: "#3b82f6" },
  { id: "status-3", name: "Completed", color: "#10b981" },
  { id: "status-4", name: "On Hold", color: "#f59e0b" }
];

const defaultPriorities: ColoredItem[] = [
  { id: "priority-1", name: "Low", color: "#10b981" },
  { id: "priority-2", name: "Medium", color: "#f59e0b" },
  { id: "priority-3", name: "High", color: "#ef4444" },
  { id: "priority-4", name: "Critical", color: "#dc2626" }
];

const defaultScopes: ColoredItem[] = [
  { id: "scope-1", name: "Frontend", color: "#3b82f6" },
  { id: "scope-2", name: "Backend", color: "#10b981" },
  { id: "scope-3", name: "Database", color: "#f59e0b" },
  { id: "scope-4", name: "Infrastructure", color: "#ef4444" },
  { id: "scope-5", name: "Mobile", color: "#8b5cf6" },
  { id: "scope-6", name: "API", color: "#06b6d4" },
  { id: "scope-7", name: "UI/UX", color: "#ec4899" },
  { id: "scope-8", name: "DevOps", color: "#84cc16" }
];

const SortableItem = ({ 
  item, 
  index, 
  type, 
  isEditing, 
  editingValue, 
  editingColor, 
  onEdit, 
  onSave, 
  onCancel, 
  onRemove, 
  onEditChange, 
  predefinedColors 
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: typeof item === 'object' ? item.id : `item-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const coloredItem = typeof item === 'object' ? item : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      {isEditing ? (
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
          <Input
            value={editingValue}
            onChange={(e) => onEditChange(e.target.value, editingColor)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            autoFocus
            className="flex-1 border-primary/50 focus:border-primary focus:ring-primary/20"
          />
          {coloredItem && (
            <div className="flex items-center p-2 bg-muted/50 rounded-lg border">
              <Palette className="w-4 h-4 text-muted-foreground mr-2" />
              <div className="flex items-center gap-1">
                {predefinedColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.name}
                    className={`
                      relative w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-md
                      ${editingColor === color.value 
                        ? 'border-foreground shadow-md ring-2 ring-primary/50' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    onClick={() => onEditChange(editingValue, color.value)}
                  >
                    {editingColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white drop-shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onSave} className="h-8 px-3">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} className="h-8 px-3">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
            </div>
            {coloredItem ? (
              <Badge 
                className="text-sm font-medium px-4 py-1.5 text-white border-0 shadow-sm"
                style={{ backgroundColor: coloredItem.color }}
              >
                <Tag className="w-3 h-3 mr-2" />
                {coloredItem.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-sm font-medium px-4 py-1.5 bg-background border-border">
                {typeof item === 'string' ? item : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(type, index, coloredItem?.name || (typeof item === 'string' ? item : ''), coloredItem?.color)}
              className="h-8 px-3 hover:bg-muted"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(type, index)}
              className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export const Parameters = ({ isOpen, onClose }: ParametersProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Use default parameters initially, then load from database
  const [environments, setEnvironments] = useState<ColoredItem[]>(defaultEnvironments);
  const [taskTypes, setTaskTypes] = useState<ColoredItem[]>(defaultTaskTypes);
  const [statuses, setStatuses] = useState<ColoredItem[]>(defaultStatuses);
  const [priorities, setPriorities] = useState<ColoredItem[]>(defaultPriorities);
  const [scopes, setScopes] = useState<ColoredItem[]>(defaultScopes);

  const [newEnvironment, setNewEnvironment] = useState("");
  const [newTaskType, setNewTaskType] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  
  const [newStatusColor, setNewStatusColor] = useState(predefinedColors[0].value);
  const [newPriorityColor, setNewPriorityColor] = useState(predefinedColors[0].value);
  const [newScope, setNewScope] = useState("");

  const [newEnvironmentColor, setNewEnvironmentColor] = useState(predefinedColors[0].value);
  const [newTaskTypeColor, setNewTaskTypeColor] = useState(predefinedColors[0].value);
  const [newScopeColor, setNewScopeColor] = useState(predefinedColors[0].value);

  const [editingItem, setEditingItem] = useState<{type: string, index: number, value: string, color?: string} | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateId = () => {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  useEffect(() => {
    if (isOpen && user) {
      loadParameters();
    }
  }, [isOpen, user]);

  const handleAddItem = (type: string, value: string, setter: React.Dispatch<React.SetStateAction<any[]>>, resetInput: () => void, color?: string) => {
    if (value.trim()) {
      const newItem = color ? { id: generateId(), name: value.trim(), color } : value.trim();
      setter(prev => [...prev, newItem]);
      resetInput();
      toast({
        title: "Item Added",
        description: `"${value}" has been added to ${type}.`,
      });
    }
  };

  const handleRemoveItem = (type: string, index: number, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed", 
      description: `Item removed from ${type}.`,
    });
  };

  const handleEditItem = (type: string, index: number, currentValue: string, currentColor?: string) => {
    setEditingItem({ type, index, value: currentValue, color: currentColor });
  };

  const handleSaveEdit = (setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (editingItem && editingItem.value.trim()) {
      setter(prev => prev.map((item, i) => {
        if (i === editingItem.index) {
          if (editingItem.color !== undefined) {
            return { id: typeof item === 'object' ? item.id : generateId(), name: editingItem.value.trim(), color: editingItem.color };
          } else {
            return editingItem.value.trim();
          }
        }
        return item;
      }));
      setEditingItem(null);
      toast({
        title: "Item Updated",
        description: "Item has been updated successfully.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleResetToDefaults = () => {
    setEnvironments(defaultEnvironments);
    setTaskTypes(defaultTaskTypes);
    setStatuses(defaultStatuses);
    setPriorities(defaultPriorities);
    setScopes(defaultScopes);
    toast({
      title: "Reset Complete",
      description: "All parameters have been reset to default values.",
    });
  };

  const handleDragEnd = (event: any, setter: React.Dispatch<React.SetStateAction<ColoredItem[]>>) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setter((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const loadParameters = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parameters')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading parameters:', error);
        return;
      }

      if (data && data.length > 0) {
        // Group parameters by category
        const groupedParams = data.reduce((acc, param) => {
          if (!acc[param.category]) {
            acc[param.category] = [];
          }
          acc[param.category].push(param);
          return acc;
        }, {} as Record<string, any[]>);

        // Update state with loaded parameters
        if (groupedParams.scopes) {
          setScopes(groupedParams.scopes.map((p, index) => ({ id: `scope-${index}`, name: p.name, color: p.color })));
        }
        if (groupedParams.environments) {
          setEnvironments(groupedParams.environments.map((p, index) => ({ id: `env-${index}`, name: p.name, color: p.color })));
        }
        if (groupedParams.taskTypes) {
          setTaskTypes(groupedParams.taskTypes.map((p, index) => ({ id: `task-${index}`, name: p.name, color: p.color })));
        }
        if (groupedParams.statuses) {
          setStatuses(groupedParams.statuses.map((p, index) => ({ id: `status-${index}`, name: p.name, color: p.color })));
        }
        if (groupedParams.priorities) {
          setPriorities(groupedParams.priorities.map((p, index) => ({ id: `priority-${index}`, name: p.name, color: p.color })));
        }
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Delete existing parameters for this user
      await supabase
        .from('parameters')
        .delete()
        .eq('user_id', user.id);

      // Prepare new parameters data
      const allParameters = [
        ...scopes.map(scope => ({
          user_id: user.id,
          name: scope.name,
          color: scope.color,
          category: 'scopes'
        })),
        ...environments.map(env => ({
          user_id: user.id,
          name: env.name,
          color: env.color,
          category: 'environments'
        })),
        ...taskTypes.map(type => ({
          user_id: user.id,
          name: type.name,
          color: type.color,
          category: 'taskTypes'
        })),
        ...statuses.map(status => ({
          user_id: user.id,
          name: status.name,
          color: status.color,
          category: 'statuses'
        })),
        ...priorities.map(priority => ({
          user_id: user.id,
          name: priority.name,
          color: priority.color,
          category: 'priorities'
        }))
      ];

      // Insert new parameters
      const { error } = await supabase
        .from('parameters')
        .insert(allParameters);

      if (error) {
        console.error('Error saving parameters:', error);
        toast({
          title: "Error",
          description: "Failed to save parameters. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Parameters Saved",
        description: "All parameters have been saved successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving parameters:', error);
      toast({
        title: "Error",
        description: "Failed to save parameters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderColoredItemList = (
    items: ColoredItem[], 
    setter: React.Dispatch<React.SetStateAction<ColoredItem[]>>, 
    type: string,
    newValue: string,
    setNewValue: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string,
    newColor: string,
    setNewColor: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="space-y-6">
      {/* Add new item */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border">
        <div className="flex gap-3">
          <Input
            placeholder={placeholder}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddItem(type, newValue, setter, () => setNewValue(""), newColor);
              }
            }}
            className="flex-1 border-primary/30 focus:border-primary"
          />
          <div className="flex items-center p-2 bg-background rounded-lg border">
            <Palette className="w-4 h-4 text-muted-foreground mr-2" />
            <div className="flex items-center gap-1">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  className={`
                    relative w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-md
                    ${newColor === color.value 
                      ? 'border-foreground shadow-md ring-2 ring-primary/50' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setNewColor(color.value)}
                >
                  {newColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white drop-shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => handleAddItem(type, newValue, setter, () => setNewValue(""), newColor)}
            size="sm"
            className="px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Items list with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => handleDragEnd(event, setter)}
      >
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                type={type}
                isEditing={editingItem?.type === type && editingItem?.index === index}
                editingValue={editingItem?.value || ''}
                editingColor={editingItem?.color}
                onEdit={handleEditItem}
                onSave={() => handleSaveEdit(setter)}
                onCancel={handleCancelEdit}
                onRemove={(type, index) => handleRemoveItem(type, index, setter)}
                onEditChange={(value, color) => setEditingItem(prev => prev ? {...prev, value, color} : null)}
                predefinedColors={predefinedColors}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold">Parameter Management</DialogTitle>
              <p className="text-muted-foreground mt-1">Customize dropdown options used throughout the application</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <Tabs defaultValue="scopes" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="scopes" className="text-sm">Scopes</TabsTrigger>
              <TabsTrigger value="environments" className="text-sm">Environments</TabsTrigger>
              <TabsTrigger value="taskTypes" className="text-sm">Task Types</TabsTrigger>
              <TabsTrigger value="statuses" className="text-sm">Statuses</TabsTrigger>
              <TabsTrigger value="priorities" className="text-sm">Priorities</TabsTrigger>
            </TabsList>

            <TabsContent value="scopes" className="mt-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="w-5 h-5 text-primary" />
                    Scope Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderColoredItemList(
                    scopes,
                    setScopes,
                    "Scopes",
                    newScope,
                    setNewScope,
                    "Add new scope...",
                    newScopeColor,
                    setNewScopeColor
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="environments" className="mt-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-primary" />
                    Environment Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderColoredItemList(
                    environments,
                    setEnvironments,
                    "Environments",
                    newEnvironment,
                    setNewEnvironment,
                    "Add new environment...",
                    newEnvironmentColor,
                    setNewEnvironmentColor
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="taskTypes" className="mt-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="w-5 h-5 text-primary" />
                    Task Type Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderColoredItemList(
                    taskTypes,
                    setTaskTypes,
                    "Task Types",
                    newTaskType,
                    setNewTaskType,
                    "Add new task type...",
                    newTaskTypeColor,
                    setNewTaskTypeColor
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statuses" className="mt-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-primary" />
                    Status Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderColoredItemList(
                    statuses,
                    setStatuses,
                    "Statuses",
                    newStatus,
                    setNewStatus,
                    "Add new status...",
                    newStatusColor,
                    setNewStatusColor
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priorities" className="mt-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-primary" />
                    Priority Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderColoredItemList(
                    priorities,
                    setPriorities,
                    "Priorities",
                    newPriority,
                    setNewPriority,
                    "Add new priority...",
                    newPriorityColor,
                    setNewPriorityColor
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveAll} disabled={loading} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Parameters;