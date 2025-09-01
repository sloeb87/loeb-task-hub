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

const queryClient = new QueryClient();
// Lazy load heavy components
const Tasks = lazy(() => import("./pages/Tasks"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectsWrapper = lazy(() => import("./pages/ProjectsWrapper"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const TimeTrackingWrapper = lazy(() => import("./pages/TimeTrackingWrapper"));
const FollowUpsWrapper = lazy(() => import("./pages/FollowUpsWrapper"));
const TaskEdit = lazy(() => import("./pages/TaskEdit"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

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
}

export default App;