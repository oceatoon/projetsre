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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          milestone_id: string | null
          needs_peer_validation: boolean
          project_id: string
          status: string
          title: string
          validated_by: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          milestone_id?: string | null
          needs_peer_validation?: boolean
          project_id: string
          status?: string
          title: string
          validated_by?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          milestone_id?: string | null
          needs_peer_validation?: boolean
          project_id?: string
          status?: string
          title?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          answers: Json
          author_id: string | null
          call_id: string
          created_at: string
          granted_amount: number | null
          id: string
          project_id: string
          selected_sections: string[]
          status: string
        }
        Insert: {
          answers?: Json
          author_id?: string | null
          call_id: string
          created_at?: string
          granted_amount?: number | null
          id?: string
          project_id: string
          selected_sections?: string[]
          status?: string
        }
        Update: {
          answers?: Json
          author_id?: string | null
          call_id?: string
          created_at?: string
          granted_amount?: number | null
          id?: string
          project_id?: string
          selected_sections?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          budget_max: number | null
          created_at: string
          criteria: string[]
          deadline: string | null
          description: string
          extra_questions: Json
          id: string
          institution: string
          is_open: boolean
          need_types: string[]
          owner_id: string | null
          slug: string
          themes: string[]
          title: string
        }
        Insert: {
          budget_max?: number | null
          created_at?: string
          criteria?: string[]
          deadline?: string | null
          description?: string
          extra_questions?: Json
          id?: string
          institution: string
          is_open?: boolean
          need_types?: string[]
          owner_id?: string | null
          slug: string
          themes?: string[]
          title: string
        }
        Update: {
          budget_max?: number | null
          created_at?: string
          criteria?: string[]
          deadline?: string | null
          description?: string
          extra_questions?: Json
          id?: string
          institution?: string
          is_open?: boolean
          need_types?: string[]
          owner_id?: string | null
          slug?: string
          themes?: string[]
          title?: string
        }
        Relationships: []
      }
      campaign_messages: {
        Row: {
          audience: string
          body: string
          campaign_id: string
          channel: string
          created_at: string
          id: string
          position: number
          recipients: number
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body?: string
          campaign_id: string
          channel?: string
          created_at?: string
          id?: string
          position?: number
          recipients?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          campaign_id?: string
          channel?: string
          created_at?: string
          id?: string
          position?: number
          recipients?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_volunteers: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          motivation: string
          notes: string
          person_name: string
          stage: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          motivation?: string
          notes?: string
          person_name?: string
          stage?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          motivation?: string
          notes?: string
          person_name?: string
          stage?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_volunteers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          author_id: string | null
          cadence: string
          created_at: string
          ends_on: string | null
          goal: string
          id: string
          is_public: boolean
          kind: string
          project_id: string
          report: string
          starts_on: string
          status: string
          target_amount: number | null
          target_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          cadence?: string
          created_at?: string
          ends_on?: string | null
          goal?: string
          id?: string
          is_public?: boolean
          kind?: string
          project_id: string
          report?: string
          starts_on?: string
          status?: string
          target_amount?: number | null
          target_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          cadence?: string
          created_at?: string
          ends_on?: string | null
          goal?: string
          id?: string
          is_public?: boolean
          kind?: string
          project_id?: string
          report?: string
          starts_on?: string
          status?: string
          target_amount?: number | null
          target_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperation_messages: {
        Row: {
          author_id: string | null
          author_name: string
          body: string
          cooperation_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          body: string
          cooperation_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          body?: string
          cooperation_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperation_messages_cooperation_id_fkey"
            columns: ["cooperation_id"]
            isOneToOne: false
            referencedRelation: "cooperations"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperation_steps: {
        Row: {
          author_id: string | null
          cooperation_id: string
          created_at: string
          deliverable: string
          due_date: string | null
          id: string
          owner_name: string
          position: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          cooperation_id: string
          created_at?: string
          deliverable?: string
          due_date?: string | null
          id?: string
          owner_name?: string
          position?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          cooperation_id?: string
          created_at?: string
          deliverable?: string
          due_date?: string | null
          id?: string
          owner_name?: string
          position?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperation_steps_cooperation_id_fkey"
            columns: ["cooperation_id"]
            isOneToOne: false
            referencedRelation: "cooperations"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperations: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          kind: string
          project_a_id: string
          project_b_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          project_a_id: string
          project_b_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          project_a_id?: string
          project_b_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperations_project_a_id_fkey"
            columns: ["project_a_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperations_project_b_id_fkey"
            columns: ["project_b_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          location: string
          project_id: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string
          project_id: string
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          project_id?: string
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          label: string
          project_id: string
          spent_on: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          label: string
          project_id: string
          spent_on?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          label?: string
          project_id?: string
          spent_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          author_id: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          kind: string
          project_id: string
          rating: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          body: string
          created_at?: string
          id?: string
          kind?: string
          project_id: string
          rating?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          kind?: string
          project_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      funders: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          name: string
          project_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          name: string
          project_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      maturation_questions: {
        Row: {
          answer: string
          asked_by: string
          author_id: string | null
          created_at: string
          id: string
          project_id: string
          question: string
        }
        Insert: {
          answer?: string
          asked_by?: string
          author_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          question: string
        }
        Update: {
          answer?: string
          asked_by?: string
          author_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "maturation_questions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          author_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          position: number
          project_id: string
          status: string
          title: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          position?: number
          project_id: string
          status?: string
          title: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          position?: number
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body: string
          id: string
          project_id: string
          published_at: string
          title: string
        }
        Insert: {
          body?: string
          id?: string
          project_id: string
          published_at?: string
          title: string
        }
        Update: {
          body?: string
          id?: string
          project_id?: string
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          commune: string
          created_at: string
          display_name: string
          handle: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          commune?: string
          created_at?: string
          display_name?: string
          handle: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          commune?: string
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      project_followers: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_followers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_needed: number
          budget_secured: number
          carrier_name: string
          commune: string
          community_size: number
          contact_email: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          impact: Json
          is_published: boolean
          name: string
          need_types: string[]
          needs_answered: string
          objectives: string[]
          owner_id: string | null
          slug: string
          stage: string
          tagline: string
          theme: string
          value_added: string
        }
        Insert: {
          budget_needed?: number
          budget_secured?: number
          carrier_name?: string
          commune?: string
          community_size?: number
          contact_email?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          impact?: Json
          is_published?: boolean
          name: string
          need_types?: string[]
          needs_answered?: string
          objectives?: string[]
          owner_id?: string | null
          slug: string
          stage?: string
          tagline?: string
          theme?: string
          value_added?: string
        }
        Update: {
          budget_needed?: number
          budget_secured?: number
          carrier_name?: string
          commune?: string
          community_size?: number
          contact_email?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          impact?: Json
          is_published?: boolean
          name?: string
          need_types?: string[]
          needs_answered?: string
          objectives?: string[]
          owner_id?: string | null
          slug?: string
          stage?: string
          tagline?: string
          theme?: string
          value_added?: string
        }
        Relationships: []
      }
      supports: {
        Row: {
          amount: number | null
          author_id: string | null
          contact: string | null
          created_at: string
          id: string
          kind: string
          message: string
          project_id: string
          supporter_name: string
        }
        Insert: {
          amount?: number | null
          author_id?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          kind: string
          message?: string
          project_id: string
          supporter_name?: string
        }
        Update: {
          amount?: number | null
          author_id?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          project_id?: string
          supporter_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "supports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      campaign_owned: { Args: { _campaign_id: string }; Returns: boolean }
      campaign_public_stats: { Args: { _campaign_id: string }; Returns: Json }
      campaign_visible: { Args: { _campaign_id: string }; Returns: boolean }
      follower_count: { Args: { _project_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_owner: { Args: { _project_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "citoyen" | "porteur" | "institution" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["citoyen", "porteur", "institution", "admin"],
    },
  },
} as const
