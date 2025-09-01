import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Tasks from "./pages/Tasks";
import Dashboard from "./pages/Dashboard";
import ProjectsWrapper from "./pages/ProjectsWrapper";
import ProjectDetails from "./pages/ProjectDetails";
import TimeTrackingWrapper from "./pages/TimeTrackingWrapper";
import FollowUpsWrapper from "./pages/FollowUpsWrapper";
import TaskEdit from "./pages/TaskEdit";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";
import { TaskFormProvider } from "./contexts/TaskFormContext";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('ProtectedRoute check:', { isAuthenticated, loading, userId: user?.id });

  if (loading) {
    console.log('ProtectedRoute: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('ProtectedRoute: Authenticated, rendering protected content');
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <TaskFormProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }>
                  <Route index element={<Tasks />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<ProjectsWrapper />} />
                  <Route path="projects/:projectName" element={<ProjectDetails />} />
                  <Route path="time-tracking" element={<TimeTrackingWrapper />} />
                  <Route path="follow-ups" element={<FollowUpsWrapper />} />
                  <Route path="tasks/:id" element={<TaskEdit />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TaskFormProvider>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;