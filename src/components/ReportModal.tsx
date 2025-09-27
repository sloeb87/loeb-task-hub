import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Users, Target, Clock, AlertTriangle, CheckCircle, XCircle, FileText, MessageSquare, TrendingUp, BarChart3, Download, Moon, Sun, Mail } from "lucide-react";
import { Project, Task } from "@/types/task";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Helper function to identify automatic follow-ups
const isAutomaticFollowUp = (text: string): boolean => {
  const automaticPatterns = [
    /^Task marked completed$/,
    /^Status changed from .+ to .+$/,
    /^Priority changed from .+ to .+$/,
    /^Task type changed from .+ to .+$/,
    /^Due date changed from .+ to .+$/,
    /^Task updated: Due date: .+ → .+$/
  ];
  
  return automaticPatterns.some(pattern => pattern.test(text));
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tasks: Task[];
}

export const ReportModal = ({ isOpen, onClose, project, tasks }: ReportModalProps) => {
  const { theme, setTheme } = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);

  const projectTasks = tasks.filter(task => task.project === project.name);
  const completedTasks = projectTasks.filter(task => task.status === 'Completed');
  const inProgressTasks = projectTasks.filter(task => task.status === 'In Progress');
  const openTasks = projectTasks.filter(task => task.status === 'Open');
  const onHoldTasks = projectTasks.filter(task => task.status === 'On Hold');
  const overdueTasks = projectTasks.filter(task => 
    task.status !== 'Completed' && new Date(task.dueDate) < new Date()
  );

  const completionRate = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;

  const priorityBreakdown = {
    high: projectTasks.filter(task => task.priority === 'High').length,
    medium: projectTasks.filter(task => task.priority === 'Medium').length,
    low: projectTasks.filter(task => task.priority === 'Low').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600';
      case 'In Progress': return 'text-blue-600';
      case 'Open': return 'text-gray-600';
      case 'On Hold': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Open': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'On Hold': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLastThreeFollowUps = (task: Task) => {
    return task.followUps
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      // Dynamic import to avoid bundle size issues
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      pdf.save(`${project.name}_Report_${dateStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const sendEmailReport = async () => {
    const recipientEmail = prompt("Enter recipient email address:");
    
    if (!recipientEmail) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const emailData = {
        recipientEmail,
        project: {
          name: project.name,
          description: project.description || '',
          owner: project.owner || '',
          team: project.team || [],
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status,
        },
        tasks: projectTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          responsible: task.responsible,
          startDate: task.startDate,
          dueDate: task.dueDate,
          followUps: task.followUps || [],
        })),
        metrics: {
          totalTasks: projectTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          openTasks: openTasks.length,
          onHoldTasks: onHoldTasks.length,
          overdueTasks: overdueTasks.length,
          completionRate,
        },
      };

      const { error } = await supabase.functions.invoke('send-report-email', {
        body: emailData,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email Sent Successfully!",
        description: `Report has been sent to ${recipientEmail}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Send Failed",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6" />
            Project Report: {project.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendEmailReport}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div ref={reportRef} className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Project Status</p>
                  <Badge variant={project.status === 'Active' ? 'default' : project.status === 'Completed' ? 'secondary' : 'outline'}>
                    {project.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Project Owner</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{project.owner}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Team Size</p>
                  <span className="font-medium">{project.team.length} members</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Timeline</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{project.startDate} - {project.endDate}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-sm">{project.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Team Members</p>
                <div className="flex flex-wrap gap-2">
                  {project.team.map((member, index) => (
                    <Badge key={index} variant="outline">{member}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{projectTasks.length}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{inProgressTasks.length}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Priority Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="destructive">High Priority</Badge>
                    <span className="font-medium">{priorityBreakdown.high} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="default">Medium Priority</Badge>
                    <span className="font-medium">{priorityBreakdown.medium} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">Low Priority</Badge>
                    <span className="font-medium">{priorityBreakdown.low} tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Completed</span>
                    </div>
                    <span className="font-medium">{completedTasks.length} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>In Progress</span>
                    </div>
                    <span className="font-medium">{inProgressTasks.length} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-gray-600" />
                      <span>Open</span>
                    </div>
                    <span className="font-medium">{openTasks.length} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>On Hold</span>
                    </div>
                    <span className="font-medium">{onHoldTasks.length} tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Task List */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Task Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {projectTasks.length > 0 ? (
                <div className="space-y-4">
                  {projectTasks.map((task) => {
                    const lastThreeFollowUps = getLastThreeFollowUps(task);
                    
                    return (
                      <div key={task.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{task.id}</Badge>
                              <h4 className="font-medium">{task.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge 
                              variant={task.status === 'Completed' ? 'secondary' : task.status === 'In Progress' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Responsible:</span>
                            <div className="font-medium">{task.responsible}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Priority:</span>
                            <div>
                              <Badge 
                                variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Due Date:</span>
                            <div className={`font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'text-red-600' : ''}`}>
                              {task.dueDate}
                              {new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
                                <AlertTriangle className="inline w-3 h-3 ml-1" />
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Created:</span>
                            <div className="font-medium">{task.creationDate}</div>
                          </div>
                        </div>

                        {/* Last 3 Follow-ups */}
                        {lastThreeFollowUps.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Recent Follow-ups</span>
                            </div>
                            <div className="space-y-2">
                              {lastThreeFollowUps.map((followUp) => (
                                <div key={followUp.id} className="bg-blue-50 rounded-md p-3">
                                  <p className="text-xs text-gray-700">
                                    <span className="font-medium text-blue-600">
                                      {new Date(followUp.timestamp).toLocaleDateString()}
                                    </span>
                                    : <span className={isAutomaticFollowUp(followUp.text) ? 'text-blue-600 dark:text-blue-400' : ''}>{followUp.text}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No tasks assigned to this project yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Report Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-600">
                <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="mt-1">Project Management System - Professional Report</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
