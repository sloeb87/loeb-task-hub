// Utility functions for handling multiple links
import { NamedLink } from "@/types/task";

export type LinkType = 'oneNote' | 'teams' | 'email' | 'file' | 'folder';

export interface MultiLinks {
  oneNote?: NamedLink[];
  teams?: NamedLink[];
  email?: NamedLink[];
  file?: NamedLink[];
  folder?: NamedLink[];
}

export interface SingleLinks {
  oneNote?: string;
  teams?: string;
  email?: string;
  file?: string;
  folder?: string;
}

// Convert from single links to multiple links (for migration)
export const convertSingleToMultipleLinks = (links: SingleLinks | null | undefined): MultiLinks => {
  if (!links) return {};
  
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const createNamedLink = (url: string, type: string): NamedLink => ({
    id: generateId(),
    name: type.charAt(0).toUpperCase() + type.slice(1),
    url
  });
  
  return {
    oneNote: links.oneNote ? [createNamedLink(links.oneNote, 'OneNote')] : [],
    teams: links.teams ? [createNamedLink(links.teams, 'Teams')] : [],
    email: links.email ? [createNamedLink(links.email, 'Email')] : [],
    file: links.file ? [createNamedLink(links.file, 'File')] : [],
    folder: links.folder ? [createNamedLink(links.folder, 'Folder')] : []
  };
};

// Get the first link from a link type (for display compatibility)
export const getFirstLink = (links: NamedLink[] | string[] | string | undefined): string => {
  if (!links) return '';
  if (typeof links === 'string') return links;
  if (Array.isArray(links) && links.length > 0) {
    // Handle both NamedLink[] and string[]
    const first = links[0];
    return typeof first === 'string' ? first : first.url;
  }
  return '';
};

// Get all links as an array
export const getLinksAsArray = (links: NamedLink[] | string[] | string | undefined): string[] => {
  if (!links) return [];
  if (typeof links === 'string') return links ? [links] : [];
  if (Array.isArray(links)) {
    return links.map(link => typeof link === 'string' ? link : link.url);
  }
  return [];
};

// Check if any links exist for a given type
export const hasLinks = (links: NamedLink[] | string[] | string | undefined): boolean => {
  if (!links) return false;
  if (typeof links === 'string') return links.length > 0;
  if (Array.isArray(links)) return links.length > 0 && links.some(link => {
    const url = typeof link === 'string' ? link : link.url;
    return url && url.length > 0;
  });
  return false;
};

// Open all links of a given type
export const openLinks = (links: NamedLink[] | string[] | string | undefined, linkType: LinkType = 'oneNote') => {
  const linkArray = getLinksAsArray(links);
  
  linkArray.forEach(link => {
    if (link.trim()) {
      if (linkType === 'email') {
        if (link.startsWith('http')) {
          window.open(link, '_blank');
        } else {
          window.open(`mailto:${link}`, '_blank');
        }
      } else {
        window.open(link, '_blank');
      }
    }
  });
};