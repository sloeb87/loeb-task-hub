import React from 'react';

// Memoized Layout component
export const Layout = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
});

Layout.displayName = 'Layout';

// Memoized LoadingSpinner component
export const LoadingSpinner = React.memo(() => {
  const { Loader2 } = require('lucide-react');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Badge component wrapper
export const MemoizedBadge = React.memo(({ children, ...props }: any) => {
  const { Badge } = require('@/components/ui/badge');
  return <Badge {...props}>{children}</Badge>;
});

MemoizedBadge.displayName = 'MemoizedBadge';