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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          assessment_type: string
          created_at: string
          id: string
          input_data: Json
          recommendations: Json | null
          risk_level: string
          risk_score: number | null
          user_id: string
        }
        Insert: {
          assessment_type: string
          created_at?: string
          id?: string
          input_data: Json
          recommendations?: Json | null
          risk_level: string
          risk_score?: number | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          id?: string
          input_data?: Json
          recommendations?: Json | null
          risk_level?: string
          risk_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          assessment_id: string | null
          created_at: string
          id: string
          plan_content: string
          risk_type: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          id?: string
          plan_content: string
          risk_type: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          id?: string
          plan_content?: string
          risk_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_recommendations: {
        Row: {
          address: string | null
          assessment_id: string | null
          created_at: string
          estimated_cost: number | null
          hospital_name: string
          id: string
          latitude: number | null
          longitude: number | null
          specialty: string
          user_id: string
        }
        Insert: {
          address?: string | null
          assessment_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          hospital_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          specialty: string
          user_id: string
        }
        Update: {
          address?: string | null
          assessment_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          hospital_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          specialty?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      lifestyle_analyses: {
        Row: {
          analysis_content: string
          created_at: string
          id: string
          suggestions: Json | null
          user_id: string
        }
        Insert: {
          analysis_content: string
          created_at?: string
          id?: string
          suggestions?: Json | null
          user_id: string
        }
        Update: {
          analysis_content?: string
          created_at?: string
          id?: string
          suggestions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          dark_mode: boolean | null
          full_name: string | null
          gender: string | null
          id: string
          medical_notes: string | null
          reminders_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          dark_mode?: boolean | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          reminders_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          dark_mode?: boolean | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          reminders_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          interval_minutes: number
          is_active: boolean | null
          last_triggered_at: string | null
          reminder_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean | null
          last_triggered_at?: string | null
          reminder_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean | null
          last_triggered_at?: string | null
          reminder_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
