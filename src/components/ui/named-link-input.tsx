import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { NamedLink } from "@/types/task";

interface NamedLinkInputProps {
  label: string;
  icon: React.ReactNode;
  links: NamedLink[];
  placeholder: string;
  type?: 'url' | 'text' | 'email';
  onChange: (links: NamedLink[]) => void;
  className?: string;
}

export const NamedLinkInput: React.FC<NamedLinkInputProps> = ({
  label,
  icon,
  links,
  placeholder,
  type = 'url',
  onChange,
  className
}) => {
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    
    const newLink: NamedLink = {
      id: generateId(),
      name: newLinkName.trim(),
      url: newLinkUrl.trim()
    };
    
    onChange([...links, newLink]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const updateLink = (index: number, field: 'name' | 'url', value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    onChange(updatedLinks);
  };

  const openLink = (link: NamedLink) => {
    if (type === 'email') {
      if (link.url.startsWith('http')) {
        window.open(link.url, '_blank');
      } else {
        window.open(`mailto:${link.url}`, '_blank');
      }
    } else {
      window.open(link.url, '_blank');
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
      </div>
      
      {/* Existing Links */}
      {links.map((link, index) => (
        <div key={link.id} className="space-y-2 p-3 border rounded-lg bg-card">
          {editingIndex === index ? (
            <div className="space-y-2">
              <Input
                type="text"
                value={link.name}
                onChange={(e) => updateLink(index, 'name', e.target.value)}
                placeholder="Link name"
                className="flex-1"
              />
              <Input
                type={type}
                value={link.url}
                onChange={(e) => updateLink(index, 'url', e.target.value)}
                placeholder={placeholder}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingIndex(null)}
                >
                  Done
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">{link.name}</div>
              </div>
              <div className="flex gap-1">
                {link.url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openLink(link)}
                    className="h-8 w-8 p-0 text-primary hover:text-primary"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingIndex(index)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Add New Link */}
      <div className="space-y-2 p-3 border border-dashed rounded-lg">
        <Input
          type="text"
          value={newLinkName}
          onChange={(e) => setNewLinkName(e.target.value)}
          placeholder={`${label} name (e.g., "${label}")`}
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLink}
            disabled={!newLinkName.trim() || !newLinkUrl.trim()}
            className="h-9 w-9 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
