import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #1f2937;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .metric-card {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        .metric-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .progress-bar {
          background: #e5e7eb;
          border-radius: 4px;
          height: 8px;
          margin: 12px 0;
        }
        .progress-fill {
          background: #10b981;
          border-radius: 4px;
          height: 100%;
          transition: width 0.3s ease;
        }
        .task-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .task-title {
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-left: 8px;
        }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-progress { background: #dbeafe; color: #1e40af; }
        .status-open { background: #f3f4f6; color: #374151; }
        .status-hold { background: #fef3c7; color: #92400e; }
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-medium { background: #fef3c7; color: #92400e; }
        .priority-low { background: #e0f2fe; color: #0369a1; }
        .follow-ups {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .follow-up-item {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
          padding-left: 16px;
          position: relative;
        }
        .follow-up-item:before {
          content: "💬";
          position: absolute;
          left: 0;
        }
        .footer {
          text-align: center;
          padding: 24px;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Project Report: ${project.name}</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      <div class="card">
        <h2>📋 Project Overview</h2>
        <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
        <p><strong>Owner:</strong> ${project.owner || 'Not specified'}</p>
        <p><strong>Status:</strong> <span class="badge status-${project.status.toLowerCase().replace(' ', '')}">${project.status}</span></p>
        <p><strong>Timeline:</strong> ${project.startDate} → ${project.endDate}</p>
        <p><strong>Team:</strong> ${project.team.join(', ') || 'No team members specified'}</p>
      </div>

      <div class="card">
        <h2>📊 Progress Summary</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${metrics.totalTasks}</div>
            <div class="metric-label">Total Tasks</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.completedTasks}</div>
            <div class="metric-label">Completed</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.inProgressTasks}</div>
            <div class="metric-label">In Progress</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.overdueTasks}</div>
            <div class="metric-label">Overdue</div>
          </div>
        </div>
        
        <div>
          <p><strong>Completion Rate: ${metrics.completionRate.toFixed(1)}%</strong></p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.completionRate}%"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>📝 Task Details</h2>
        ${tasks.map(task => `
          <div class="task-item">
            <div class="task-header">
              <h3 class="task-title">${task.title}</h3>
              <div>
                <span class="badge status-${task.status.toLowerCase().replace(' ', '')}">${task.status}</span>
                <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
              </div>
            </div>
            <p><strong>ID:</strong> ${task.id}</p>
            <p><strong>Description:</strong> ${task.description || 'No description'}</p>
            <p><strong>Responsible:</strong> ${task.responsible}</p>
            <p><strong>Due Date:</strong> ${task.dueDate}</p>
            
            ${task.followUps && task.followUps.length > 0 ? `
              <div class="follow-ups">
                <strong>Recent Follow-ups:</strong>
                ${task.followUps.slice(0, 3).map(followUp => `
                  <div class="follow-up-item">
                    ${followUp.text} (${new Date(followUp.timestamp).toLocaleDateString()})
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>This report was generated by PMTask Project Management System</p>
        <p>📧 Report generated and sent on ${new Date().toLocaleString()}</p>
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
      from: "PMTask Reports <reports@yourdomain.com>",
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