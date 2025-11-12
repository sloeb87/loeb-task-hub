export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      follow_ups: {
        Row: {
          created_at: string
          id: string
          task_id: string
          task_status: string | null
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          task_status?: string | null
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          task_status?: string | null
          text?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parameters: {
        Row: {
          category: string
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cost_center: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          links: Json | null
          name: string
          owner: string | null
          scope: string[]
          start_date: string
          status: string
          team: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_center?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          links?: Json | null
          name: string
          owner?: string | null
          scope?: string[]
          start_date: string
          status?: string
          team?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_center?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          links?: Json | null
          name?: string
          owner?: string | null
          scope?: string[]
          start_date?: string
          status?: string
          team?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurrence_stats: {
        Row: {
          completed_count: number
          id: string
          next_occurrences: Json
          parent_task_id: string
          recurrence_days_of_week: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          remaining_count: number
          start_date: string | null
          total_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number
          id?: string
          next_occurrences?: Json
          parent_task_id: string
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          remaining_count?: number
          start_date?: string | null
          total_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number
          id?: string
          next_occurrences?: Json
          parent_task_id?: string
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          remaining_count?: number
          start_date?: string | null
          total_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simple_followups: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_followups_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "simple_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          owner: string | null
          project_url: string | null
          start_date: string | null
          status: string
          team_members: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner?: string | null
          project_url?: string | null
          start_date?: string | null
          status?: string
          team_members?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner?: string | null
          project_url?: string | null
          start_date?: string | null
          status?: string
          team_members?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simple_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          responsible: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          responsible?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          responsible?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "simple_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_time_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          duration_minutes: number
          id: string
          project_id: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "simple_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "simple_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_metrics: {
        Row: {
          actual_duration_days: number | null
          completion_percentage: number | null
          created_at: string
          days_overdue: number | null
          id: string
          last_time_entry: string | null
          planned_vs_actual_ratio: number | null
          task_id: string
          task_number: string
          total_sessions: number | null
          total_time_logged: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_days?: number | null
          completion_percentage?: number | null
          created_at?: string
          days_overdue?: number | null
          id?: string
          last_time_entry?: string | null
          planned_vs_actual_ratio?: number | null
          task_id: string
          task_number: string
          total_sessions?: number | null
          total_time_logged?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_days?: number | null
          completion_percentage?: number | null
          created_at?: string
          days_overdue?: number | null
          id?: string
          last_time_entry?: string | null
          planned_vs_actual_ratio?: number | null
          task_id?: string
          task_number?: string
          total_sessions?: number | null
          total_time_logged?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_metrics_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "meeting_tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_metrics_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "regular_tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_metrics_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          checklist: Json | null
          completion_date: string | null
          created_at: string
          creation_date: string
          dependencies: string[] | null
          description: string | null
          details: string | null
          due_date: string
          duration: number | null
          environment: string
          id: string
          is_favorite: boolean | null
          is_meeting: boolean
          is_recurring: boolean | null
          links: Json | null
          next_recurrence_date: string | null
          parent_task_id: string | null
          planned_time_hours: number | null
          priority: string
          project_id: string | null
          recurrence_days_of_week: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          responsible: string
          scope: string[]
          stakeholders: string[] | null
          start_date: string
          status: string
          task_number: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json | null
          completion_date?: string | null
          created_at?: string
          creation_date?: string
          dependencies?: string[] | null
          description?: string | null
          details?: string | null
          due_date: string
          duration?: number | null
          environment: string
          id?: string
          is_favorite?: boolean | null
          is_meeting?: boolean
          is_recurring?: boolean | null
          links?: Json | null
          next_recurrence_date?: string | null
          parent_task_id?: string | null
          planned_time_hours?: number | null
          priority?: string
          project_id?: string | null
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          responsible: string
          scope?: string[]
          stakeholders?: string[] | null
          start_date: string
          status?: string
          task_number: string
          task_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json | null
          completion_date?: string | null
          created_at?: string
          creation_date?: string
          dependencies?: string[] | null
          description?: string | null
          details?: string | null
          due_date?: string
          duration?: number | null
          environment?: string
          id?: string
          is_favorite?: boolean | null
          is_meeting?: boolean
          is_recurring?: boolean | null
          links?: Json | null
          next_recurrence_date?: string | null
          parent_task_id?: string | null
          planned_time_hours?: number | null
          priority?: string
          project_id?: string | null
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          responsible?: string
          scope?: string[]
          stakeholders?: string[] | null
          start_date?: string
          status?: string
          task_number?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          end_time: string | null
          environment: string | null
          id: string
          is_running: boolean
          project_name: string
          responsible: string
          scope: string[] | null
          start_time: string
          task_id: string
          task_title: string
          task_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          end_time?: string | null
          environment?: string | null
          id?: string
          is_running?: boolean
          project_name: string
          responsible: string
          scope?: string[] | null
          start_time: string
          task_id: string
          task_title: string
          task_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          end_time?: string | null
          environment?: string | null
          id?: string
          is_running?: boolean
          project_name?: string
          responsible?: string
          scope?: string[] | null
          start_time?: string
          task_id?: string
          task_title?: string
          task_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      meeting_tasks_view: {
        Row: {
          checklist: Json | null
          completion_date: string | null
          created_at: string | null
          creation_date: string | null
          dependencies: string[] | null
          description: string | null
          details: string | null
          due_date: string | null
          duration: number | null
          environment: string | null
          id: string | null
          is_favorite: boolean | null
          is_meeting: boolean | null
          is_recurring: boolean | null
          links: Json | null
          parent_task_id: string | null
          planned_time_hours: number | null
          priority: string | null
          project_id: string | null
          recurrence_days_of_week: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          responsible: string | null
          scope: string[] | null
          stakeholders: string[] | null
          start_date: string | null
          status: string | null
          task_number: string | null
          task_type: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      regular_tasks_view: {
        Row: {
          checklist: Json | null
          completion_date: string | null
          created_at: string | null
          creation_date: string | null
          dependencies: string[] | null
          description: string | null
          details: string | null
          due_date: string | null
          duration: number | null
          environment: string | null
          id: string | null
          is_favorite: boolean | null
          is_meeting: boolean | null
          is_recurring: boolean | null
          links: Json | null
          parent_task_id: string | null
          planned_time_hours: number | null
          priority: string | null
          project_id: string | null
          recurrence_days_of_week: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          responsible: string | null
          scope: string[] | null
          stakeholders: string[] | null
          start_date: string | null
          status: string | null
          task_number: string | null
          task_type: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      backfill_all_recurrence_stats: {
        Args: never
        Returns: {
          message: string
          processed_count: number
        }[]
      }
      calculate_task_metrics:
        | { Args: { p_task_number: string }; Returns: undefined }
        | { Args: { p_task_id: string }; Returns: undefined }
      generate_recurring_instances:
        | {
            Args: { task_number_param: string }
            Returns: {
              created_count: number
              message: string
            }[]
          }
        | {
            Args: { task_uuid: string }
            Returns: {
              created_count: number
              message: string
            }[]
          }
      get_current_user_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      recalculate_all_task_metrics: {
        Args: { p_user_id: string }
        Returns: number
      }
      refresh_recurrence_stats: {
        Args: { p_parent: string; p_user: string }
        Returns: undefined
      }
      refresh_task_views: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
