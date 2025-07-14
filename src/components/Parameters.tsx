
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Settings, 
  Save,
  RefreshCw,
  Check,
  X,
  Edit3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParametersProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultEnvironments = ["Development", "Testing", "Staging", "Production", "Demo"];
const defaultTaskTypes = ["Development", "Testing", "Documentation", "Review", "Meeting", "Research"];
const defaultStatuses = ["Open", "In Progress", "Completed", "On Hold"];
const defaultPriorities = ["Low", "Medium", "High", "Critical"];
const defaultScopes = ["Frontend", "Backend", "Database", "Infrastructure", "Mobile", "API", "UI/UX", "DevOps"];

export const Parameters = ({ isOpen, onClose }: ParametersProps) => {
  const [environments, setEnvironments] = useState<string[]>(defaultEnvironments);
  const [taskTypes, setTaskTypes] = useState<string[]>(defaultTaskTypes);
  const [statuses, setStatuses] = useState<string[]>(defaultStatuses);
  const [priorities, setPriorities] = useState<string[]>(defaultPriorities);
  const [scopes, setScopes] = useState<string[]>(defaultScopes);

  const [newEnvironment, setNewEnvironment] = useState("");
  const [newTaskType, setNewTaskType] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newScope, setNewScope] = useState("");

  const [editingItem, setEditingItem] = useState<{type: string, index: number, value: string} | null>(null);

  if (!isOpen) return null;

  const handleAddItem = (type: string, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, resetInput: () => void) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      resetInput();
      toast({
        title: "Item Added",
        description: `"${value}" has been added to ${type}.`,
      });
    }
  };

  const handleRemoveItem = (type: string, index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed", 
      description: `Item removed from ${type}.`,
    });
  };

  const handleEditItem = (type: string, index: number, currentValue: string) => {
    setEditingItem({ type, index, value: currentValue });
  };

  const handleSaveEdit = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (editingItem && editingItem.value.trim()) {
      setter(prev => prev.map((item, i) => i === editingItem.index ? editingItem.value.trim() : item));
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

  const handleSaveAll = () => {
    // Here you would typically save to localStorage or API
    localStorage.setItem('parameters', JSON.stringify({
      environments,
      taskTypes,
      statuses,
      priorities,
      scopes
    }));
    toast({
      title: "Parameters Saved",
      description: "All parameter changes have been saved successfully.",
    });
    onClose();
  };

  const renderItemList = (
    items: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    type: string,
    newValue: string,
    setNewValue: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string
  ) => (
    <div className="space-y-4">
      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddItem(type, newValue, setter, () => setNewValue(""));
            }
          }}
        />
        <Button
          onClick={() => handleAddItem(type, newValue, setter, () => setNewValue(""))}
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Items list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            {editingItem?.type === type && editingItem?.index === index ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingItem.value}
                  onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(setter);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => handleSaveEdit(setter)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Badge variant="outline" className="text-sm">
                  {item}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditItem(type, index, item)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(type, index, setter)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Parameters Management</h2>
              <p className="text-gray-600">Manage dropdown values used throughout the application</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <Tabs defaultValue="scopes" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="scopes">Scopes</TabsTrigger>
              <TabsTrigger value="environments">Environments</TabsTrigger>
              <TabsTrigger value="taskTypes">Task Types</TabsTrigger>
              <TabsTrigger value="statuses">Statuses</TabsTrigger>
              <TabsTrigger value="priorities">Priorities</TabsTrigger>
            </TabsList>

            <TabsContent value="scopes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scope Options</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderItemList(
                    scopes,
                    setScopes,
                    "Scopes",
                    newScope,
                    setNewScope,
                    "Add new scope..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="environments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Environment Options</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderItemList(
                    environments,
                    setEnvironments,
                    "Environments",
                    newEnvironment,
                    setNewEnvironment,
                    "Add new environment..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="taskTypes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Type Options</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderItemList(
                    taskTypes,
                    setTaskTypes,
                    "Task Types",
                    newTaskType,
                    setNewTaskType,
                    "Add new task type..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statuses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status Options</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderItemList(
                    statuses,
                    setStatuses,
                    "Statuses",
                    newStatus,
                    setNewStatus,
                    "Add new status..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priorities" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Priority Options</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderItemList(
                    priorities,
                    setPriorities,
                    "Priorities",
                    newPriority,
                    setNewPriority,
                    "Add new priority..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
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
            <Button onClick={handleSaveAll} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parameters;
