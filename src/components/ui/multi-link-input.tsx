import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiLinkInputProps {
  label: string;
  icon: React.ReactNode;
  links: string[];
  placeholder: string;
  type?: 'url' | 'text' | 'email';
  onChange: (links: string[]) => void;
  className?: string;
}

export const MultiLinkInput: React.FC<MultiLinkInputProps> = ({
  label,
  icon,
  links,
  placeholder,
  type = 'url',
  onChange,
  className
}) => {
  const [newLink, setNewLink] = useState('');

  const addLink = () => {
    if (!newLink.trim()) return;
    onChange([...links, newLink.trim()]);
    setNewLink('');
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    onChange(updatedLinks);
  };

  const openLink = (link: string) => {
    if (type === 'email') {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        window.open(`mailto:${link}`, '_blank');
      }
    } else {
      window.open(link, '_blank');
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
        <div key={index} className="flex items-center gap-2">
          <Input
            type={type}
            value={link}
            onChange={(e) => updateLink(index, e.target.value)}
            placeholder={placeholder}
            className="dark:bg-gray-800 dark:border-gray-600 dark:text-white flex-1"
          />
          {link && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => openLink(link)}
              className="h-9 w-9 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeLink(index)}
            className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      
      {/* Add New Link */}
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="dark:bg-gray-800 dark:border-gray-600 dark:text-white flex-1"
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
          disabled={!newLink.trim()}
          className="h-9 w-9 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
