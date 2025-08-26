import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, X, Edit, FolderOpen, Mail, FileText } from "lucide-react";
import { NamedLink } from "@/types/task";

type LinkType = 'oneNote' | 'teams' | 'email' | 'file' | 'folder';

interface LinkManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkType: LinkType;
  links: NamedLink[];
  onLinksChange: (links: NamedLink[]) => void;
  onLinkClick: (url: string) => void;
}

const linkTypeConfig = {
  oneNote: { icon: ExternalLink, label: 'OneNote', color: 'text-orange-600' },
  teams: { icon: ExternalLink, label: 'Teams', color: 'text-indigo-600' },
  email: { icon: Mail, label: 'Email', color: 'text-green-600' },
  file: { icon: FileText, label: 'File', color: 'text-purple-600' },
  folder: { icon: FolderOpen, label: 'Folder', color: 'text-blue-600' },
};

export const LinkManagementDialog: React.FC<LinkManagementDialogProps> = ({
  open,
  onOpenChange,
  linkType,
  links,
  onLinksChange,
  onLinkClick
}) => {
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const config = linkTypeConfig[linkType];
  const Icon = config.icon;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    
    const newLink: NamedLink = {
      id: generateId(),
      name: newLinkName.trim(),
      url: newLinkUrl.trim()
    };
    
    onLinksChange([...links, newLink]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const removeLink = (id: string) => {
    onLinksChange(links.filter(link => link.id !== id));
    setEditingId(null);
  };

  const updateLink = (id: string, field: 'name' | 'url', value: string) => {
    const updatedLinks = links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    );
    onLinksChange(updatedLinks);
  };

  const handleLinkClick = (link: NamedLink) => {
    let url = link.url;
    if (linkType === 'email' && !url.startsWith('http') && !url.startsWith('mailto:')) {
      url = `mailto:${url}`;
    }
    onLinkClick(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            Manage {config.label} Links
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Existing Links */}
          {links.map((link) => (
            <div key={link.id} className="p-3 border rounded-lg bg-card">
              {editingId === link.id ? (
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={link.name}
                    onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                    placeholder="Link name"
                  />
                  <Input
                    type={linkType === 'email' ? 'email' : 'url'}
                    value={link.url}
                    onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                    placeholder={linkType === 'email' ? 'Email address' : 'URL'}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Done
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(link.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{link.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkClick(link)}
                      className="h-8 w-8 p-0 text-primary hover:text-primary"
                      title="Open link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(link.id)}
                      className="h-8 w-8 p-0"
                      title="Edit link"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(link.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete link"
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
            <Label className="text-sm font-medium">Add New {config.label} Link</Label>
            <Input
              type="text"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              placeholder={`Link name (e.g., "${config.label}")`}
            />
            <div className="flex items-center gap-2">
              <Input
                type={linkType === 'email' ? 'email' : 'url'}
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder={linkType === 'email' ? 'Email address' : 'URL'}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <Button
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
      </DialogContent>
    </Dialog>
  );
};
