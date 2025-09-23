import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { TaskFormProvider } from "./contexts/TaskFormContext";

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    },
  },
});

// Lazy load heavy components
const Tasks = lazy(() => import("./pages/Tasks"));
const Meetings = lazy(() => import("./pages/Meetings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectsWrapper = lazy(() => import("./pages/ProjectsWrapper"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const TimeTrackingWrapper = lazy(() => import("./pages/TimeTrackingWrapper"));
const FollowUpsWrapper = lazy(() => import("./pages/FollowUpsWrapper"));
const TaskEdit = lazy(() => import("./pages/TaskEdit"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingSpinner = React.memo(() => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
));

const ProtectedRoute = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Remove excessive logging that causes performance issues
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
});

// Memoize the main App component to prevent unnecessary re-renders
const App = React.memo(() => {
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
                  <Route index element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Tasks />
                    </Suspense>
                  } />
                  <Route path="tasks" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Tasks />
                    </Suspense>
                  } />
                  <Route path="meetings" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Meetings />
                    </Suspense>
                  } />
                  <Route path="dashboard" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  <Route path="projects" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProjectsWrapper />
                    </Suspense>
                  } />
                  <Route path="projects/:projectId" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProjectDetails />
                    </Suspense>
                  } />
                  <Route path="time-tracking" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <TimeTrackingWrapper />
                    </Suspense>
                  } />
                  <Route path="follow-ups" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <FollowUpsWrapper />
                    </Suspense>
                  } />
                  <Route path="tasks/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <TaskEdit />
                    </Suspense>
                  } />
                </Route>
                <Route path="*" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </BrowserRouter>
          </TaskFormProvider>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
});

export default App;