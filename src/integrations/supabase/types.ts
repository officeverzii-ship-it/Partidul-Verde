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
      articles: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          kind: string
          published_at: string | null
          slug: string
          status: string
          title: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          city: string
          coordinator: string | null
          county: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          city: string
          coordinator?: string | null
          county: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          city?: string
          coordinator?: string | null
          county?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          citizenship_confirmed: boolean
          city: string | null
          cnp: string | null
          county: string | null
          created_at: string
          donor_email: string
          donor_name: string
          ep_transaction_id: string | null
          id: string
          member_id: string | null
          method: string
          paid_at: string | null
          phone: string | null
          processor_message: string | null
          status: string
          street: string | null
          terms_accepted: boolean
        }
        Insert: {
          amount: number
          citizenship_confirmed?: boolean
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          donor_email: string
          donor_name: string
          ep_transaction_id?: string | null
          id?: string
          member_id?: string | null
          method?: string
          paid_at?: string | null
          phone?: string | null
          processor_message?: string | null
          status?: string
          street?: string | null
          terms_accepted?: boolean
        }
        Update: {
          amount?: number
          citizenship_confirmed?: boolean
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          donor_email?: string
          donor_name?: string
          ep_transaction_id?: string | null
          id?: string
          member_id?: string | null
          method?: string
          paid_at?: string | null
          phone?: string | null
          processor_message?: string | null
          status?: string
          street?: string | null
          terms_accepted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "donations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          branch_id: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          activity_type: string | null
          address: string | null
          birth_date: string | null
          branch_id: string | null
          city: string | null
          cnp: string | null
          county: string | null
          created_at: string
          dues_paid: number
          education: string | null
          email: string
          full_name: string
          gdpr_consent: boolean
          general_consent: boolean
          id: string
          joined_at: string
          mother_tongue: string | null
          motivation: string | null
          other_languages: string | null
          phone: string | null
          profession: string | null
          role: string
          status: string
          workplace: string | null
        }
        Insert: {
          activity_type?: string | null
          address?: string | null
          birth_date?: string | null
          branch_id?: string | null
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          dues_paid?: number
          education?: string | null
          email: string
          full_name: string
          gdpr_consent?: boolean
          general_consent?: boolean
          id?: string
          joined_at?: string
          mother_tongue?: string | null
          motivation?: string | null
          other_languages?: string | null
          phone?: string | null
          profession?: string | null
          role?: string
          status?: string
          workplace?: string | null
        }
        Update: {
          activity_type?: string | null
          address?: string | null
          birth_date?: string | null
          branch_id?: string | null
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          dues_paid?: number
          education?: string | null
          email?: string
          full_name?: string
          gdpr_consent?: boolean
          general_consent?: boolean
          id?: string
          joined_at?: string
          mother_tongue?: string | null
          motivation?: string | null
          other_languages?: string | null
          phone?: string | null
          profession?: string | null
          role?: string
          status?: string
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          slug: string
          status: string
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          slug: string
          status?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      site_submissions: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          kind: string
          message: string
          status: string
        }
        Insert: {
          consent: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          kind: string
          message?: string
          status?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          kind?: string
          message?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          availability: string | null
          branch_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          skills: string | null
          status: string
        }
        Insert: {
          availability?: string | null
          branch_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          skills?: string | null
          status?: string
        }
        Update: {
          availability?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          skills?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_branch: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin_national"
        | "admin_filiala"
        | "editor"
        | "coordonator_voluntari"
        | "membru"
        | "voluntar"
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
      app_role: [
        "admin_national",
        "admin_filiala",
        "editor",
        "coordonator_voluntari",
        "membru",
        "voluntar",
      ],
    },
  },
} as const
