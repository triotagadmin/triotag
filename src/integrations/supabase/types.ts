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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_spaces: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          availability_status: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          media_urls: Json | null
          pricing: Json | null
          publisher_id: string
          rejection_reason: string | null
          specifications: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          media_urls?: Json | null
          pricing?: Json | null
          publisher_id: string
          rejection_reason?: string | null
          specifications?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          media_urls?: Json | null
          pricing?: Json | null
          publisher_id?: string
          rejection_reason?: string | null
          specifications?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_spaces_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone_number: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["admin_status"]
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          phone_number?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["admin_status"]
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone_number?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["admin_status"]
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      advertiser_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_description: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_description?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_description?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          advertiser_id: string
          approved_at: string | null
          approved_by: string | null
          budget_amount: number | null
          budget_currency: string | null
          campaign_description: string | null
          campaign_name: string
          created_at: string | null
          creative_assets: Json | null
          end_date: string | null
          id: string
          payment_status: string | null
          rejection_reason: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["approval_status"]
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id: string
          approved_at?: string | null
          approved_by?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_description?: string | null
          campaign_name: string
          created_at?: string | null
          creative_assets?: Json | null
          end_date?: string | null
          id?: string
          payment_status?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string
          approved_at?: string | null
          approved_by?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_description?: string | null
          campaign_name?: string
          created_at?: string | null
          creative_assets?: Json | null
          end_date?: string | null
          id?: string
          payment_status?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      publisher_profiles: {
        Row: {
          agent_role: Database["public"]["Enums"]["agent_role"] | null
          approved_at: string | null
          approved_by: string | null
          business_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          metrics: Json | null
          portfolio_media: Json | null
          publisher_type: Database["public"]["Enums"]["publisher_type"]
          rejection_reason: string | null
          social_media: Json | null
          updated_at: string | null
          user_id: string
          verification_status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          agent_role?: Database["public"]["Enums"]["agent_role"] | null
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          metrics?: Json | null
          portfolio_media?: Json | null
          publisher_type: Database["public"]["Enums"]["publisher_type"]
          rejection_reason?: string | null
          social_media?: Json | null
          updated_at?: string | null
          user_id: string
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          agent_role?: Database["public"]["Enums"]["agent_role"] | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          metrics?: Json | null
          portfolio_media?: Json | null
          publisher_type?: Database["public"]["Enums"]["publisher_type"]
          rejection_reason?: string | null
          social_media?: Json | null
          updated_at?: string | null
          user_id?: string
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          document_type: string
          file_name: string
          file_url: string
          id: string
          publisher_id: string
          uploaded_at: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_url: string
          id?: string
          publisher_id: string
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          publisher_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
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
      is_verified_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_status: "pending" | "verified" | "rejected"
      agent_role: "guerrilla" | "influencer" | "model" | "artist"
      app_role: "admin" | "publisher" | "advertiser"
      approval_status: "pending" | "approved" | "rejected"
      publisher_type: "venue" | "digital" | "agent"
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
    Enums: {
      admin_status: ["pending", "verified", "rejected"],
      agent_role: ["guerrilla", "influencer", "model", "artist"],
      app_role: ["admin", "publisher", "advertiser"],
      approval_status: ["pending", "approved", "rejected"],
      publisher_type: ["venue", "digital", "agent"],
    },
  },
} as const
