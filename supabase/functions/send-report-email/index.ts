import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  project: {
    name: string;
    description: string;
    owner: string;
    team: string[];
    startDate: string;
    endDate: string;
    status: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    responsible: string;
    startDate: string;
    dueDate: string;
    followUps: Array<{
      text: string;
      timestamp: string;
      taskStatus?: string;
    }>;
  }>;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    openTasks: number;
    onHoldTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
}

const generateReportHTML = (data: ReportEmailRequest) => {
  const { project, tasks, metrics } = data;
  
  // Generate timeline/Gantt visualization
  const generateGanttTimeline = () => {
    const sortedTasks = tasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return sortedTasks.map(task => {
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.dueDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const statusColor = {
        'Completed': '#10b981',
        'In Progress': '#3b82f6',
        'Open': '#6b7280',
        'On Hold': '#f59e0b'
      }[task.status] || '#6b7280';

      return `
        <div class="gantt-row">
          <div class="gantt-task-info">
            <strong>${task.title}</strong>
            <small>${task.responsible}</small>
          </div>
          <div class="gantt-bar">
            <div class="gantt-timeline" style="background-color: ${statusColor};">
              ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()} (${duration}d)
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  // Get all follow-ups across all tasks
  const getAllFollowUps = () => {
    const allFollowUps: Array<{
      text: string;
      timestamp: string;
      taskStatus?: string;
      taskTitle: string;
      taskId: string;
    }> = [];
    tasks.forEach(task => {
      if (task.followUps && task.followUps.length > 0) {
        task.followUps.forEach(followUp => {
          allFollowUps.push({
            ...followUp,
            taskTitle: task.title,
            taskId: task.id
          });
        });
      }
    });
    return allFollowUps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const allFollowUps = getAllFollowUps();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Report: ${project.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.4;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 16px;
          background-color: #f8fafc;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .card {
          background: white;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card h2 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #1f2937;
        }
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .metric-card {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
        }
        .metric-value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        .metric-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .progress-bar {
          background: #e5e7eb;
          border-radius: 3px;
          height: 6px;
          margin: 8px 0;
        }
        .progress-fill {
          background: #10b981;
          border-radius: 3px;
          height: 100%;
        }
        .compact-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 14px;
        }
        .compact-info p {
          margin: 4px 0;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-inprogress { background: #dbeafe; color: #1e40af; }
        .status-open { background: #f3f4f6; color: #374151; }
        .status-onhold { background: #fef3c7; color: #92400e; }
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-medium { background: #fef3c7; color: #92400e; }
        .priority-low { background: #e0f2fe; color: #0369a1; }
        .gantt-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 12px;
          margin-bottom: 8px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
        }
        .gantt-task-info strong {
          display: block;
          font-size: 13px;
        }
        .gantt-task-info small {
          color: #6b7280;
        }
        .gantt-timeline {
          padding: 4px 8px;
          border-radius: 3px;
          color: white;
          font-weight: 500;
          font-size: 11px;
        }
        .task-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }
        .task-compact {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          font-size: 12px;
        }
        .task-compact h4 {
          margin: 0 0 6px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .task-compact p {
          margin: 2px 0;
        }
        .followup-item {
          background: #f9fafb;
          border-left: 3px solid #3b82f6;
          padding: 8px 12px;
          margin: 4px 0;
          border-radius: 0 4px 4px 0;
          font-size: 12px;
        }
        .followup-meta {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
        .footer {
          text-align: center;
          padding: 16px;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${project.name}</h1>
        <p>Project Report • ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}</p>
      </div>

      <div class="card">
        <h2>📋 Overview</h2>
        <div class="compact-info">
          <p><strong>Owner:</strong> ${project.owner || 'Not specified'}</p>
          <p><strong>Status:</strong> <span class="badge status-${project.status.toLowerCase().replace(' ', '')}">${project.status}</span></p>
          <p><strong>Timeline:</strong> ${project.startDate} → ${project.endDate}</p>
          <p><strong>Team:</strong> ${project.team.join(', ') || 'No team specified'}</p>
        </div>
        ${project.description ? `<p><strong>Description:</strong> ${project.description}</p>` : ''}
      </div>

      <div class="card">
        <h2>📊 Progress Metrics</h2>
        <div class="compact-grid">
          <div class="metric-card">
            <div class="metric-value">${metrics.totalTasks}</div>
            <div class="metric-label">Total</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.completedTasks}</div>
            <div class="metric-label">Done</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.inProgressTasks}</div>
            <div class="metric-label">Active</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.overdueTasks}</div>
            <div class="metric-label">Overdue</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.completionRate.toFixed(0)}%</div>
            <div class="metric-label">Complete</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${metrics.completionRate}%"></div>
        </div>
      </div>

      <div class="card">
        <h2>🗓️ Project Timeline</h2>
        ${generateGanttTimeline()}
      </div>

      <div class="card">
        <h2>📝 Tasks Summary</h2>
        <div class="task-grid">
          ${tasks.map(task => `
            <div class="task-compact">
              <h4>${task.title}</h4>
              <p><strong>ID:</strong> ${task.id} | <strong>Owner:</strong> ${task.responsible}</p>
              <p><strong>Due:</strong> ${task.dueDate}</p>
              <p><span class="badge status-${task.status.toLowerCase().replace(' ', '')}">${task.status}</span> <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></p>
              ${task.description ? `<p><em>${task.description}</em></p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      ${allFollowUps.length > 0 ? `
        <div class="card">
          <h2>💬 All Follow-ups (${allFollowUps.length})</h2>
          ${allFollowUps.map(followUp => `
            <div class="followup-item">
              <div>${followUp.text}</div>
              <div class="followup-meta">
                📌 ${followUp.taskTitle} • ${new Date(followUp.timestamp).toLocaleDateString()} ${followUp.taskStatus ? `• Status: ${followUp.taskStatus}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="footer">
        <p>📧 PMTask Project Management • Generated ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReportEmailRequest = await req.json();
    
    console.log('Sending report email to:', data.recipientEmail);

    const emailHTML = generateReportHTML(data);

    const emailResponse = await resend.emails.send({
      from: "PMTask Reports <s.loeb@loebconsulting.be>",
      to: [data.recipientEmail],
      subject: `📊 Project Report: ${data.project.name}`,
      html: emailHTML,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-report-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);