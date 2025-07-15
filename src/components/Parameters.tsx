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
  Edit3,
  Palette
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParametersProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColoredItem {
  name: string;
  color: string;
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
  { name: "Development", color: "#3b82f6" },
  { name: "Testing", color: "#f59e0b" },
  { name: "Staging", color: "#8b5cf6" },
  { name: "Production", color: "#ef4444" },
  { name: "Demo", color: "#10b981" }
];

const defaultTaskTypes: ColoredItem[] = [
  { name: "Development", color: "#3b82f6" },
  { name: "Testing", color: "#f59e0b" },
  { name: "Documentation", color: "#10b981" },
  { name: "Review", color: "#8b5cf6" },
  { name: "Meeting", color: "#ec4899" },
  { name: "Research", color: "#06b6d4" }
];

const defaultStatuses = ["Open", "In Progress", "Completed", "On Hold"];
const defaultPriorities = ["Low", "Medium", "High", "Critical"];

const defaultScopes: ColoredItem[] = [
  { name: "Frontend", color: "#3b82f6" },
  { name: "Backend", color: "#10b981" },
  { name: "Database", color: "#f59e0b" },
  { name: "Infrastructure", color: "#ef4444" },
  { name: "Mobile", color: "#8b5cf6" },
  { name: "API", color: "#06b6d4" },
  { name: "UI/UX", color: "#ec4899" },
  { name: "DevOps", color: "#84cc16" }
];

export const Parameters = ({ isOpen, onClose }: ParametersProps) => {
  // Use default parameters
  const [environments, setEnvironments] = useState<ColoredItem[]>(defaultEnvironments);
  const [taskTypes, setTaskTypes] = useState<ColoredItem[]>(defaultTaskTypes);
  const [statuses, setStatuses] = useState<string[]>(defaultStatuses);
  const [priorities, setPriorities] = useState<string[]>(defaultPriorities);
  const [scopes, setScopes] = useState<ColoredItem[]>(defaultScopes);

  const [newEnvironment, setNewEnvironment] = useState("");
  const [newTaskType, setNewTaskType] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newScope, setNewScope] = useState("");

  const [newEnvironmentColor, setNewEnvironmentColor] = useState(predefinedColors[0].value);
  const [newTaskTypeColor, setNewTaskTypeColor] = useState(predefinedColors[0].value);
  const [newScopeColor, setNewScopeColor] = useState(predefinedColors[0].value);

  const [editingItem, setEditingItem] = useState<{type: string, index: number, value: string, color?: string} | null>(null);

  if (!isOpen) return null;

  const handleAddItem = (type: string, value: string, setter: React.Dispatch<React.SetStateAction<any[]>>, resetInput: () => void, color?: string) => {
    if (value.trim()) {
      if (color) {
        setter(prev => [...prev, { name: value.trim(), color }]);
      } else {
        setter(prev => [...prev, value.trim()]);
      }
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
            return { name: editingItem.value.trim(), color: editingItem.color };
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

  const handleSaveAll = () => {
    // Parameters are now managed in-memory only
    onClose();
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
    <div className="space-y-4">
      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddItem(type, newValue, setter, () => setNewValue(""), newColor);
            }
          }}
          className="flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
            <div className="flex items-center gap-1">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  className={`
                    relative w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg
                    ${newColor === color.value 
                      ? 'border-gray-900 dark:border-white shadow-md ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500' 
                      : 'border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setNewColor(color.value)}
                >
                  {newColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={() => handleAddItem(type, newValue, setter, () => setNewValue(""), newColor)}
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Items list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                  <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <div className="flex items-center gap-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        title={color.name}
                        className={`
                          relative w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg
                          ${editingItem.color === color.value 
                            ? 'border-gray-900 dark:border-white shadow-md ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500' 
                            : 'border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400'
                          }
                        `}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setEditingItem({...editingItem, color: color.value})}
                      >
                        {editingItem.color === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-sm" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleSaveEdit(setter)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Badge 
                    className="text-sm font-semibold px-3 py-1.5 shadow-sm text-white border-0"
                    style={{ 
                      backgroundColor: item.color
                    }}
                  >
                    {item.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditItem(type, index, item.name, item.color)}
                    className="dark:hover:bg-gray-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(type, index, setter)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
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
          className="dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                <Badge variant="outline" className="text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                  {item}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditItem(type, index, item)}
                    className="dark:hover:bg-gray-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(type, index, setter)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Parameters Management</h2>
              <p className="text-gray-600 dark:text-gray-300">Manage dropdown values used throughout the application</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <Tabs defaultValue="scopes" className="w-full">
            <TabsList className="grid w-full grid-cols-5 dark:bg-gray-800">
              <TabsTrigger value="scopes" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Scopes</TabsTrigger>
              <TabsTrigger value="environments" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Environments</TabsTrigger>
              <TabsTrigger value="taskTypes" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Task Types</TabsTrigger>
              <TabsTrigger value="statuses" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Statuses</TabsTrigger>
              <TabsTrigger value="priorities" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Priorities</TabsTrigger>
            </TabsList>

            <TabsContent value="scopes" className="mt-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Scope Options</CardTitle>
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

            <TabsContent value="environments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Environment Options</CardTitle>
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

            <TabsContent value="taskTypes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Type Options</CardTitle>
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

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
