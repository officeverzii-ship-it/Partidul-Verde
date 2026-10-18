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
      app_secrets: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
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
          pdf_url: string | null
          published_at: string | null
          slug: string
          status: string
          tags: string[]
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
          pdf_url?: string | null
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[]
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
          pdf_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      branch_messages: {
        Row: {
          author_id: string
          author_name: string
          body: string
          branch_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          author_name?: string
          body: string
          branch_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          branch_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_messages_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      contact_notes: {
        Row: {
          author_id: string | null
          contact_id: string
          created_at: string
          id: string
          note: string
        }
        Insert: {
          author_id?: string | null
          contact_id: string
          created_at?: string
          id?: string
          note: string
        }
        Update: {
          author_id?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          branch_id: string | null
          city: string | null
          county: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          member_id: string | null
          newsletter_confirm_token: string | null
          newsletter_confirmed: boolean
          phone: string | null
          source: string
          tags: string[]
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          member_id?: string | null
          newsletter_confirm_token?: string | null
          newsletter_confirmed?: boolean
          phone?: string | null
          source?: string
          tags?: string[]
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          member_id?: string | null
          newsletter_confirm_token?: string | null
          newsletter_confirmed?: boolean
          phone?: string | null
          source?: string
          tags?: string[]
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          citizenship_confirmed: boolean
          city: string | null
          cnp: string | null
          county: string | null
          created_at: string
          currency: string
          donation_type: string
          donor_email: string
          donor_name: string
          environment: string
          ep_transaction_id: string | null
          id: string
          member_id: string | null
          method: string
          paid_at: string | null
          phone: string | null
          processor_message: string | null
          status: string
          street: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          terms_accepted: boolean
        }
        Insert: {
          amount: number
          citizenship_confirmed?: boolean
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          currency?: string
          donation_type?: string
          donor_email: string
          donor_name: string
          environment?: string
          ep_transaction_id?: string | null
          id?: string
          member_id?: string | null
          method?: string
          paid_at?: string | null
          phone?: string | null
          processor_message?: string | null
          status?: string
          street?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          terms_accepted?: boolean
        }
        Update: {
          amount?: number
          citizenship_confirmed?: boolean
          city?: string | null
          cnp?: string | null
          county?: string | null
          created_at?: string
          currency?: string
          donation_type?: string
          donor_email?: string
          donor_name?: string
          environment?: string
          ep_transaction_id?: string | null
          id?: string
          member_id?: string | null
          method?: string
          paid_at?: string | null
          phone?: string | null
          processor_message?: string | null
          status?: string
          street?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
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
      dues: {
        Row: {
          amount: number
          created_at: string
          id: string
          member_id: string
          paid_at: string | null
          status: string
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          member_id: string
          paid_at?: string | null
          status?: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          paid_at?: string | null
          status?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "dues_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          segment_id: string | null
          sent_count: number
          status: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          segment_id?: string | null
          sent_count?: number
          status?: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          segment_id?: string | null
          sent_count?: number
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "email_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          campaign_id: string | null
          contact_id: string | null
          created_at: string
          email: string
          error: string | null
          id: string
          resend_id: string | null
          status: string
          subject: string | null
          template_name: string | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string
          email: string
          error?: string | null
          id?: string
          resend_id?: string | null
          status?: string
          subject?: string | null
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          resend_id?: string | null
          status?: string
          subject?: string | null
          template_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_segments: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string
          event_id: string
          full_name: string
          gdpr_consent: boolean
          id: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          full_name: string
          gdpr_consent?: boolean
          id?: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          gdpr_consent?: boolean
          id?: string
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      forum_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hidden: boolean
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          locked: boolean
          title: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          locked?: boolean
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          locked?: boolean
          title?: string
        }
        Relationships: []
      }
      internal_events: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_events_branch_id_fkey"
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
          address_encrypted: string | null
          birth_date: string | null
          branch_id: string | null
          city: string | null
          cnp: string | null
          cnp_encrypted: string | null
          confirm_token: string | null
          county: string | null
          created_at: string
          dues_paid: number
          education: string | null
          email: string
          email_confirmed: boolean
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
          rejection_reason: string | null
          role: string
          status: string
          workplace: string | null
        }
        Insert: {
          activity_type?: string | null
          address?: string | null
          address_encrypted?: string | null
          birth_date?: string | null
          branch_id?: string | null
          city?: string | null
          cnp?: string | null
          cnp_encrypted?: string | null
          confirm_token?: string | null
          county?: string | null
          created_at?: string
          dues_paid?: number
          education?: string | null
          email: string
          email_confirmed?: boolean
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
          rejection_reason?: string | null
          role?: string
          status?: string
          workplace?: string | null
        }
        Update: {
          activity_type?: string | null
          address?: string | null
          address_encrypted?: string | null
          birth_date?: string | null
          branch_id?: string | null
          city?: string | null
          cnp?: string | null
          cnp_encrypted?: string | null
          confirm_token?: string | null
          county?: string | null
          created_at?: string
          dues_paid?: number
          education?: string | null
          email?: string
          email_confirmed?: boolean
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
          rejection_reason?: string | null
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
      portal_documents: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string
          id: string
          min_role: string
          title: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url: string
          id?: string
          min_role?: string
          title: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string
          id?: string
          min_role?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_documents_branch_id_fkey"
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
          og_image: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          og_image?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          og_image?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
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
      tasks: {
        Row: {
          assignee: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          assignee?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          assignee?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      admin_access_change: {
        Args: {
          _branch_id?: string
          _email: string
          _remove?: boolean
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      admin_access_list: {
        Args: { _page?: number; _search?: string }
        Returns: Json
      }
      confirm_newsletter: { Args: { _token: string }; Returns: boolean }
      decrypt_sensitive: { Args: { p_cipher: string }; Returns: string }
      encrypt_sensitive: { Args: { p_text: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      portal_access: { Args: { _user_id: string }; Returns: boolean }
      start_newsletter_signup: { Args: { _email: string }; Returns: string }
      unsubscribe_email: { Args: { _token: string }; Returns: boolean }
      upsert_contact: {
        Args: {
          _branch_id?: string
          _county?: string
          _email: string
          _full_name: string
          _member_id?: string
          _phone?: string
          _source?: string
        }
        Returns: string
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
