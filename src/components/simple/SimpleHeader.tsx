import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  MessageCircle, 
  Clock,
  LogOut,
  Moon,
  ArrowLeft
} from 'lucide-react';

export const SimpleHeader = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/simple', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/simple/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/simple/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/simple/followups', icon: MessageCircle, label: 'Follow-ups' },
    { path: '/simple/time', icon: Clock, label: 'Time Tracking' },
  ];

  return (
    <header className="border-b border-border bg-card">
      <nav className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Moon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Simple Tracker</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Full App</span>
            </Button>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};