// Utility functions for handling multiple links
export type LinkType = 'oneNote' | 'teams' | 'email' | 'file' | 'folder';

export interface MultiLinks {
  oneNote?: string[];
  teams?: string[];
  email?: string[];
  file?: string[];
  folder?: string[];
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
  
  return {
    oneNote: links.oneNote ? [links.oneNote] : [],
    teams: links.teams ? [links.teams] : [],
    email: links.email ? [links.email] : [],
    file: links.file ? [links.file] : [],
    folder: links.folder ? [links.folder] : []
  };
};

// Get the first link from a link type (for display compatibility)
export const getFirstLink = (links: string[] | string | undefined): string => {
  if (!links) return '';
  if (typeof links === 'string') return links;
  if (Array.isArray(links) && links.length > 0) return links[0];
  return '';
};

// Get all links as an array
export const getLinksAsArray = (links: string[] | string | undefined): string[] => {
  if (!links) return [];
  if (typeof links === 'string') return links ? [links] : [];
  if (Array.isArray(links)) return links;
  return [];
};

// Check if any links exist for a given type
export const hasLinks = (links: string[] | string | undefined): boolean => {
  if (!links) return false;
  if (typeof links === 'string') return links.length > 0;
  if (Array.isArray(links)) return links.length > 0 && links.some(link => link.length > 0);
  return false;
};

// Open all links of a given type
export const openLinks = (links: string[] | string | undefined, linkType: LinkType = 'oneNote') => {
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