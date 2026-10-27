// Mirrors `supabase/migrations/*`. Regenerate with `pnpm db:types` after
// applying migrations; the generated output is a drop-in replacement.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      issues: {
        Row: {
          created_at: string;
          description_md: string;
          id: string;
          number: number | null;
          position: number;
          priority: Database["public"]["Enums"]["issue_priority"];
          project_id: string;
          status: Database["public"]["Enums"]["issue_status"];
          status_changed_at: string | null;
          title: string;
          type: Database["public"]["Enums"]["issue_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description_md?: string;
          id?: string;
          number?: number | null;
          position?: number;
          priority?: Database["public"]["Enums"]["issue_priority"];
          project_id: string;
          status?: Database["public"]["Enums"]["issue_status"];
          status_changed_at?: string | null;
          title: string;
          type?: Database["public"]["Enums"]["issue_type"];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description_md?: string;
          id?: string;
          number?: number | null;
          position?: number;
          priority?: Database["public"]["Enums"]["issue_priority"];
          project_id?: string;
          status?: Database["public"]["Enums"]["issue_status"];
          status_changed_at?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["issue_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issues_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      personal_task_tags: {
        Row: {
          tag_id: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          tag_id: string;
          task_id: string;
          user_id?: string;
        };
        Update: {
          tag_id?: string;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personal_task_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_task_tags_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "personal_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      personal_tasks: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          doing: boolean;
          due_date: string | null;
          id: string;
          notes: string;
          status_changed_at: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          doing?: boolean;
          due_date?: string | null;
          id?: string;
          notes?: string;
          status_changed_at?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          doing?: boolean;
          due_date?: string | null;
          id?: string;
          notes?: string;
          status_changed_at?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          archived: boolean;
          color: Database["public"]["Enums"]["tag_color"];
          created_at: string;
          description: string;
          id: string;
          key: string;
          name: string;
          priority: Database["public"]["Enums"]["issue_priority"];
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          color?: Database["public"]["Enums"]["tag_color"];
          created_at?: string;
          description?: string;
          id?: string;
          key: string;
          name: string;
          priority?: Database["public"]["Enums"]["issue_priority"];
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived?: boolean;
          color?: Database["public"]["Enums"]["tag_color"];
          created_at?: string;
          description?: string;
          id?: string;
          key?: string;
          name?: string;
          priority?: Database["public"]["Enums"]["issue_priority"];
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: Database["public"]["Enums"]["tag_color"];
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: Database["public"]["Enums"]["tag_color"];
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          color?: Database["public"]["Enums"]["tag_color"];
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      time_entries: {
        Row: {
          created_at: string;
          ended_at: string | null;
          id: string;
          issue_id: string | null;
          started_at: string;
          task_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          issue_id?: string | null;
          started_at: string;
          task_id?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          issue_id?: string | null;
          started_at?: string;
          task_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "personal_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          updated_at: string;
          user_id: string;
          work_schedule: Json;
        };
        Insert: {
          updated_at?: string;
          user_id?: string;
          work_schedule: Json;
        };
        Update: {
          updated_at?: string;
          user_id?: string;
          work_schedule?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_task_tags: {
        Args: { p_tag_ids: string[]; p_task_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      issue_priority: "low" | "medium" | "high" | "critical";
      issue_status: "backlog" | "todo" | "in_progress" | "done";
      issue_type: "feature" | "bug" | "chore" | "refactor";
      tag_color:
        | "slate"
        | "red"
        | "orange"
        | "amber"
        | "green"
        | "teal"
        | "blue"
        | "violet"
        | "pink";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
