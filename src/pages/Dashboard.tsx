import React, { useEffect } from 'react';
import { KPIDashboard } from "@/components/KPIDashboard";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";

const Dashboard = () => {
  const { tasks, projects } = useSupabaseStorage();

  // SEO
  useEffect(() => {
    document.title = "KPI Dashboard | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Monitor your performance with comprehensive KPI metrics and analytics.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">KPI Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your performance and track key metrics
          </p>
        </header>

        <KPIDashboard tasks={tasks} projects={projects} />
      </main>
    </div>
  );
};

export default Dashboard;