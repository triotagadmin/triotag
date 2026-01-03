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
      activations: {
        Row: {
          activation_type: Database["public"]["Enums"]["activation_type"] | null
          ad_design_url: string | null
          ad_space_id: string
          ad_unit_sku: string | null
          advertiser_id: string
          brand_category: string | null
          campaign_manager_email: string | null
          campaign_manager_name: string | null
          campaign_manager_phone: string | null
          campaign_objective: string | null
          competitive_conflict_declaration: string | null
          compliance_completed: boolean | null
          created_at: string | null
          creative_compliance_confirmed: boolean | null
          emergency_contact: string | null
          end_date: string | null
          estimated_publisher_payout: number | null
          id: string
          legal_permissions_urls: string[] | null
          onsite_installation_contact: string | null
          print_order_id: string | null
          publisher_id: string
          quantity: number | null
          rejection_reason: string | null
          reporting_frequency: string | null
          require_installation_photos: boolean | null
          require_proof_of_play: boolean | null
          restricted_content: string[] | null
          sensitive_theme_flag: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["activation_status"]
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          activation_type?:
            | Database["public"]["Enums"]["activation_type"]
            | null
          ad_design_url?: string | null
          ad_space_id: string
          ad_unit_sku?: string | null
          advertiser_id: string
          brand_category?: string | null
          campaign_manager_email?: string | null
          campaign_manager_name?: string | null
          campaign_manager_phone?: string | null
          campaign_objective?: string | null
          competitive_conflict_declaration?: string | null
          compliance_completed?: boolean | null
          created_at?: string | null
          creative_compliance_confirmed?: boolean | null
          emergency_contact?: string | null
          end_date?: string | null
          estimated_publisher_payout?: number | null
          id?: string
          legal_permissions_urls?: string[] | null
          onsite_installation_contact?: string | null
          print_order_id?: string | null
          publisher_id: string
          quantity?: number | null
          rejection_reason?: string | null
          reporting_frequency?: string | null
          require_installation_photos?: boolean | null
          require_proof_of_play?: boolean | null
          restricted_content?: string[] | null
          sensitive_theme_flag?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activation_status"]
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          activation_type?:
            | Database["public"]["Enums"]["activation_type"]
            | null
          ad_design_url?: string | null
          ad_space_id?: string
          ad_unit_sku?: string | null
          advertiser_id?: string
          brand_category?: string | null
          campaign_manager_email?: string | null
          campaign_manager_name?: string | null
          campaign_manager_phone?: string | null
          campaign_objective?: string | null
          competitive_conflict_declaration?: string | null
          compliance_completed?: boolean | null
          created_at?: string | null
          creative_compliance_confirmed?: boolean | null
          emergency_contact?: string | null
          end_date?: string | null
          estimated_publisher_payout?: number | null
          id?: string
          legal_permissions_urls?: string[] | null
          onsite_installation_contact?: string | null
          print_order_id?: string | null
          publisher_id?: string
          quantity?: number | null
          rejection_reason?: string | null
          reporting_frequency?: string | null
          require_installation_photos?: boolean | null
          require_proof_of_play?: boolean | null
          restricted_content?: string[] | null
          sensitive_theme_flag?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activation_status"]
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activations_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_spaces: {
        Row: {
          activation_fee: number | null
          annual_subscription_fee: number | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          availability_status: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          media_urls: Json | null
          monthly_subscription_fee: number | null
          pricing: Json | null
          publisher_id: string
          rejection_reason: string | null
          specifications: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          activation_fee?: number | null
          annual_subscription_fee?: number | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          media_urls?: Json | null
          monthly_subscription_fee?: number | null
          pricing?: Json | null
          publisher_id: string
          rejection_reason?: string | null
          specifications?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          activation_fee?: number | null
          annual_subscription_fee?: number | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          media_urls?: Json | null
          monthly_subscription_fee?: number | null
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
          {
            foreignKeyName: "ad_spaces_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
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
          token_expires: string | null
          updated_at: string | null
          user_id: string
          verification_token: string | null
          verified: boolean | null
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
          token_expires?: string | null
          updated_at?: string | null
          user_id: string
          verification_token?: string | null
          verified?: boolean | null
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
          token_expires?: string | null
          updated_at?: string | null
          user_id?: string
          verification_token?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      agent_service_files: {
        Row: {
          file_path: string
          file_type: string
          file_url: string
          id: string
          owner_id: string
          uploaded_at: string
        }
        Insert: {
          file_path: string
          file_type: string
          file_url: string
          id?: string
          owner_id: string
          uploaded_at?: string
        }
        Update: {
          file_path?: string
          file_type?: string
          file_url?: string
          id?: string
          owner_id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      agent_services: {
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
          service_type: string
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
          service_type: string
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
          service_type?: string
          specifications?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_services_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_services_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          published_by: string | null
          read_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          image_url?: string | null
          published_by?: string | null
          read_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          published_by?: string | null
          read_time?: string
          status?: string
          title?: string
          updated_at?: string
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
          campaign_type: string | null
          created_at: string | null
          creative_assets: Json | null
          end_date: string | null
          id: string
          location: string | null
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
          campaign_type?: string | null
          created_at?: string | null
          creative_assets?: Json | null
          end_date?: string | null
          id?: string
          location?: string | null
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
          campaign_type?: string | null
          created_at?: string | null
          creative_assets?: Json | null
          end_date?: string | null
          id?: string
          location?: string | null
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
          {
            foreignKeyName: "campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          notification_reference_id: string | null
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          notification_reference_id?: string | null
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          notification_reference_id?: string | null
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_purchases: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          checked_in_at: string | null
          created_at: string
          event_ticket_id: string
          id: string
          order_code: string
          payment_method: string
          payment_proof_url: string | null
          payment_status: string
          qr_code: string | null
          quantity: number
          ticket_status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_ticket_id: string
          id?: string
          order_code?: string
          payment_method?: string
          payment_proof_url?: string | null
          payment_status?: string
          qr_code?: string | null
          quantity?: number
          ticket_status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_ticket_id?: string
          id?: string
          order_code?: string
          payment_method?: string
          payment_proof_url?: string | null
          payment_status?: string
          qr_code?: string | null
          quantity?: number
          ticket_status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_purchases_event_ticket_id_fkey"
            columns: ["event_ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string
          event_id: string
          id: string
          quantity_available: number
          quantity_sold: number
          sale_end_date: string | null
          sale_start_date: string | null
          ticket_name: string
          ticket_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          quantity_available?: number
          quantity_sold?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          ticket_name: string
          ticket_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          quantity_available?: number
          quantity_sold?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          ticket_name?: string
          ticket_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          advertiser_id: string
          banner_image_url: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string
          organizer_name: string
          status: string
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          advertiser_id: string
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location: string
          organizer_name: string
          status?: string
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          advertiser_id?: string
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string
          organizer_name?: string
          status?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          notification_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          notification_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          notification_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_reports_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          listing_id: string | null
          listing_type: string | null
          read: boolean | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          listing_type?: string | null
          read?: boolean | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          listing_type?: string | null
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: []
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
      print_orders: {
        Row: {
          activation_id: string | null
          admin_notes: string | null
          advertiser_id: string
          approved_at: string | null
          created_at: string
          design_url: string
          id: string
          order_status: Database["public"]["Enums"]["print_order_status"]
          product_name: string
          product_sku: string
          product_specs: Json | null
          quantity: number
          rejected_at: string | null
          shipping_address: Json
          shipping_country: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          activation_id?: string | null
          admin_notes?: string | null
          advertiser_id: string
          approved_at?: string | null
          created_at?: string
          design_url: string
          id?: string
          order_status?: Database["public"]["Enums"]["print_order_status"]
          product_name: string
          product_sku: string
          product_specs?: Json | null
          quantity?: number
          rejected_at?: string | null
          shipping_address: Json
          shipping_country?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          activation_id?: string | null
          admin_notes?: string | null
          advertiser_id?: string
          approved_at?: string | null
          created_at?: string
          design_url?: string
          id?: string
          order_status?: Database["public"]["Enums"]["print_order_status"]
          product_name?: string
          product_sku?: string
          product_specs?: Json | null
          quantity?: number
          rejected_at?: string | null
          shipping_address?: Json
          shipping_country?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_orders_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
        ]
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
          token_expires: string | null
          updated_at: string | null
          user_id: string
          verification_status: Database["public"]["Enums"]["approval_status"]
          verification_token: string | null
          verified: boolean | null
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
          token_expires?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: Database["public"]["Enums"]["approval_status"]
          verification_token?: string | null
          verified?: boolean | null
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
          token_expires?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: Database["public"]["Enums"]["approval_status"]
          verification_token?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      publisher_tickets: {
        Row: {
          created_at: string
          creator_id: string
          event_name: string
          id: string
          price: number
          scanned_at: string | null
          scanned_by_ip: string | null
          secret_token: string
          status: Database["public"]["Enums"]["publisher_ticket_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_name: string
          id?: string
          price?: number
          scanned_at?: string | null
          scanned_by_ip?: string | null
          secret_token?: string
          status?: Database["public"]["Enums"]["publisher_ticket_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_name?: string
          id?: string
          price?: number
          scanned_at?: string | null
          scanned_by_ip?: string | null
          secret_token?: string
          status?: Database["public"]["Enums"]["publisher_ticket_status"]
          updated_at?: string
        }
        Relationships: []
      }
      qr_code_scans: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          id: string
          ip_hash: string | null
          operating_system: string | null
          qr_code_id: string
          referrer: string | null
          scanned_at: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          operating_system?: string | null
          qr_code_id: string
          referrer?: string | null
          scanned_at?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          operating_system?: string | null
          qr_code_id?: string
          referrer?: string | null
          scanned_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          created_by: string | null
          destination_url: string
          id: string
          is_active: boolean | null
          name: string | null
          short_code: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          destination_url: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          short_code: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          destination_url?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          short_code?: string
        }
        Relationships: []
      }
      ticket_orders: {
        Row: {
          buyer_email: string
          buyer_name: string | null
          created_at: string
          id: string
          order_code: string
          payment_status: string
          quantity: number
          ticket_id: string
          total_price: number
        }
        Insert: {
          buyer_email: string
          buyer_name?: string | null
          created_at?: string
          id?: string
          order_code?: string
          payment_status?: string
          quantity?: number
          ticket_id: string
          total_price: number
        }
        Update: {
          buyer_email?: string
          buyer_name?: string | null
          created_at?: string
          id?: string
          order_code?: string
          payment_status?: string
          quantity?: number
          ticket_id?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sales: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          currency: string
          id: string
          payment_method: string
          payment_status: string
          paymongo_checkout_session_id: string | null
          paymongo_payment_id: string | null
          qr_code: string | null
          quantity: number
          serial_number: string | null
          ticket_id: string
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          paymongo_payment_id?: string | null
          qr_code?: string | null
          quantity?: number
          serial_number?: string | null
          ticket_id: string
          total_amount: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          paymongo_payment_id?: string | null
          qr_code?: string | null
          quantity?: number
          serial_number?: string | null
          ticket_id?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sales_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          currency: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          location: string
          owner_id: string
          owner_type: string
          price: number
          quantity_available: number
          quantity_sold: number
          status: string
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          location: string
          owner_id: string
          owner_type: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
          status?: string
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          location?: string
          owner_id?: string
          owner_type?: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
          status?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
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
      venue_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          status: string
          ticket_price: number
          tickets_sold: number
          title: string
          total_tickets: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          status?: string
          ticket_price?: number
          tickets_sold?: number
          title: string
          total_tickets?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          status?: string
          ticket_price?: number
          tickets_sold?: number
          title?: string
          total_tickets?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tickets: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          event_id: string
          id: string
          scanned_at: string | null
          scanned_by: string | null
          status: Database["public"]["Enums"]["venue_ticket_status"]
          unique_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          event_id: string
          id?: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["venue_ticket_status"]
          unique_code?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          event_id?: string
          id?: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["venue_ticket_status"]
          unique_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "venue_events"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          owner_id?: string
          updated_at?: string
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
          {
            foreignKeyName: "verification_documents_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      advertiser_profiles_public: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string | null
          id: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      publisher_profiles_public: {
        Row: {
          agent_role: Database["public"]["Enums"]["agent_role"] | null
          business_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          metrics: Json | null
          portfolio_media: Json | null
          publisher_type: Database["public"]["Enums"]["publisher_type"] | null
          social_media: Json | null
          updated_at: string | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["approval_status"]
            | null
        }
        Insert: {
          agent_role?: Database["public"]["Enums"]["agent_role"] | null
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          metrics?: Json | null
          portfolio_media?: Json | null
          publisher_type?: Database["public"]["Enums"]["publisher_type"] | null
          social_media?: Json | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
        }
        Update: {
          agent_role?: Database["public"]["Enums"]["agent_role"] | null
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          metrics?: Json | null
          portfolio_media?: Json | null
          publisher_type?: Database["public"]["Enums"]["publisher_type"] | null
          social_media?: Json | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
        }
        Relationships: []
      }
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
      validate_publisher_ticket: {
        Args: {
          p_scanner_ip?: string
          p_secret_token: string
          p_ticket_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      activation_status:
        | "design"
        | "pending_approval"
        | "approved"
        | "printing"
        | "payment_pending"
        | "completed"
        | "rejected"
      activation_type:
        | "sticker"
        | "table_tent"
        | "poster"
        | "flyer"
        | "banner"
        | "other"
      admin_status: "pending" | "verified" | "rejected"
      agent_role: "guerrilla" | "influencer" | "model" | "artist"
      app_role: "admin" | "publisher" | "advertiser"
      approval_status: "pending" | "approved" | "rejected"
      print_order_status:
        | "pending_admin"
        | "in_production"
        | "shipped"
        | "delivered"
      publisher_ticket_status: "active" | "used"
      publisher_type: "venue" | "digital" | "agent"
      venue_ticket_status: "valid" | "used"
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
      activation_status: [
        "design",
        "pending_approval",
        "approved",
        "printing",
        "payment_pending",
        "completed",
        "rejected",
      ],
      activation_type: [
        "sticker",
        "table_tent",
        "poster",
        "flyer",
        "banner",
        "other",
      ],
      admin_status: ["pending", "verified", "rejected"],
      agent_role: ["guerrilla", "influencer", "model", "artist"],
      app_role: ["admin", "publisher", "advertiser"],
      approval_status: ["pending", "approved", "rejected"],
      print_order_status: [
        "pending_admin",
        "in_production",
        "shipped",
        "delivered",
      ],
      publisher_ticket_status: ["active", "used"],
      publisher_type: ["venue", "digital", "agent"],
      venue_ticket_status: ["valid", "used"],
    },
  },
} as const
