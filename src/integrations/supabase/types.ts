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
          reviewed_at: string | null
          reviewer_id: string | null
          sensitive_theme_flag: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["activation_status"]
          submitted_at: string | null
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
          reviewed_at?: string | null
          reviewer_id?: string | null
          sensitive_theme_flag?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activation_status"]
          submitted_at?: string | null
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
          reviewed_at?: string | null
          reviewer_id?: string | null
          sensitive_theme_flag?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activation_status"]
          submitted_at?: string | null
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
      ad_material_pricing: {
        Row: {
          base_cost: number
          created_at: string
          currency: string
          default_size: string
          id: string
          is_active: boolean
          material_name: string
          prodigi_sku: string | null
          prodigi_variant_id: string | null
          selling_price: number
          updated_at: string
        }
        Insert: {
          base_cost?: number
          created_at?: string
          currency?: string
          default_size: string
          id?: string
          is_active?: boolean
          material_name: string
          prodigi_sku?: string | null
          prodigi_variant_id?: string | null
          selling_price?: number
          updated_at?: string
        }
        Update: {
          base_cost?: number
          created_at?: string
          currency?: string
          default_size?: string
          id?: string
          is_active?: boolean
          material_name?: string
          prodigi_sku?: string | null
          prodigi_variant_id?: string | null
          selling_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      ad_spaces: {
        Row: {
          activation_fee: number | null
          admin_notes: string | null
          advertiser_id: string | null
          agent_disconnected: boolean
          annual_subscription_fee: number | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          availability_status: string | null
          contact_verified_at: string | null
          created_at: string | null
          description: string | null
          external_ref_id: string | null
          has_pending_advertiser: boolean | null
          id: string
          latitude: number | null
          leased_advertiser_ids: string[]
          location: string | null
          longitude: number | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_types: Database["public"]["Enums"]["media_type"][]
          media_urls: Json | null
          monthly_subscription_fee: number | null
          pending_advertiser_email: string | null
          pricing: Json | null
          publisher_id: string
          rejection_reason: string | null
          specifications: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          activation_fee?: number | null
          admin_notes?: string | null
          advertiser_id?: string | null
          agent_disconnected?: boolean
          annual_subscription_fee?: number | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string | null
          contact_verified_at?: string | null
          created_at?: string | null
          description?: string | null
          external_ref_id?: string | null
          has_pending_advertiser?: boolean | null
          id?: string
          latitude?: number | null
          leased_advertiser_ids?: string[]
          location?: string | null
          longitude?: number | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_types?: Database["public"]["Enums"]["media_type"][]
          media_urls?: Json | null
          monthly_subscription_fee?: number | null
          pending_advertiser_email?: string | null
          pricing?: Json | null
          publisher_id: string
          rejection_reason?: string | null
          specifications?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          activation_fee?: number | null
          admin_notes?: string | null
          advertiser_id?: string | null
          agent_disconnected?: boolean
          annual_subscription_fee?: number | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string | null
          contact_verified_at?: string | null
          created_at?: string | null
          description?: string | null
          external_ref_id?: string | null
          has_pending_advertiser?: boolean | null
          id?: string
          latitude?: number | null
          leased_advertiser_ids?: string[]
          location?: string | null
          longitude?: number | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_types?: Database["public"]["Enums"]["media_type"][]
          media_urls?: Json | null
          monthly_subscription_fee?: number | null
          pending_advertiser_email?: string | null
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
      advertiser_branches: {
        Row: {
          advertiser_franchise_id: string | null
          advertiser_id: string
          branch_name: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          full_address: string
          id: string
          is_ad_space_listing: boolean
          latitude: number | null
          listing_id: string | null
          longitude: number | null
          updated_at: string
        }
        Insert: {
          advertiser_franchise_id?: string | null
          advertiser_id: string
          branch_name?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          full_address: string
          id?: string
          is_ad_space_listing?: boolean
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          updated_at?: string
        }
        Update: {
          advertiser_franchise_id?: string | null
          advertiser_id?: string
          branch_name?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          full_address?: string
          id?: string
          is_ad_space_listing?: boolean
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_branches_advertiser_franchise_id_fkey"
            columns: ["advertiser_franchise_id"]
            isOneToOne: false
            referencedRelation: "advertiser_franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_branches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_franchises: {
        Row: {
          advertiser_id: string
          created_at: string
          franchise_name: string
          id: string
          marketplace_status: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          franchise_name: string
          id?: string
          marketplace_status?: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          franchise_name?: string
          id?: string
          marketplace_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      advertiser_print_orders: {
        Row: {
          advertiser_id: string
          branch_ids: string[]
          created_at: string
          id: string
          materials: Json
          notes: string | null
          payment_status: string
          paymongo_checkout_session_id: string | null
          status: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          branch_ids?: string[]
          created_at?: string
          id?: string
          materials?: Json
          notes?: string | null
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          branch_ids?: string[]
          created_at?: string
          id?: string
          materials?: Json
          notes?: string | null
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
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
          latitude: number | null
          location: string | null
          longitude: number | null
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
          latitude?: number | null
          location?: string | null
          longitude?: number | null
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
          latitude?: number | null
          location?: string | null
          longitude?: number | null
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
      aooh_campaigns: {
        Row: {
          advertiser_id: string | null
          audio_duration_sec: number | null
          audio_file_name: string | null
          audio_file_url: string
          campaign_id: string | null
          campaign_name: string
          created_at: string
          dayparts: Json | null
          end_date: string | null
          id: string
          max_plays_per_day: number | null
          play_frequency_min: number | null
          rejection_reason: string | null
          script_notes: string | null
          spot_duration: string | null
          start_date: string | null
          status: string
          total_plays: number
          total_venues: number
          updated_at: string
        }
        Insert: {
          advertiser_id?: string | null
          audio_duration_sec?: number | null
          audio_file_name?: string | null
          audio_file_url: string
          campaign_id?: string | null
          campaign_name: string
          created_at?: string
          dayparts?: Json | null
          end_date?: string | null
          id?: string
          max_plays_per_day?: number | null
          play_frequency_min?: number | null
          rejection_reason?: string | null
          script_notes?: string | null
          spot_duration?: string | null
          start_date?: string | null
          status?: string
          total_plays?: number
          total_venues?: number
          updated_at?: string
        }
        Update: {
          advertiser_id?: string | null
          audio_duration_sec?: number | null
          audio_file_name?: string | null
          audio_file_url?: string
          campaign_id?: string | null
          campaign_name?: string
          created_at?: string
          dayparts?: Json | null
          end_date?: string | null
          id?: string
          max_plays_per_day?: number | null
          play_frequency_min?: number | null
          rejection_reason?: string | null
          script_notes?: string | null
          spot_duration?: string | null
          start_date?: string | null
          status?: string
          total_plays?: number
          total_venues?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aooh_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      aooh_play_logs: {
        Row: {
          ad_space_id: string | null
          aooh_campaign_id: string
          completed: boolean
          device_info: Json | null
          duration_sec: number | null
          id: string
          played_at: string
          player_session_id: string | null
          venue_id: string | null
        }
        Insert: {
          ad_space_id?: string | null
          aooh_campaign_id: string
          completed?: boolean
          device_info?: Json | null
          duration_sec?: number | null
          id?: string
          played_at?: string
          player_session_id?: string | null
          venue_id?: string | null
        }
        Update: {
          ad_space_id?: string | null
          aooh_campaign_id?: string
          completed?: boolean
          device_info?: Json | null
          duration_sec?: number | null
          id?: string
          played_at?: string
          player_session_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aooh_play_logs_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_play_logs_aooh_campaign_id_fkey"
            columns: ["aooh_campaign_id"]
            isOneToOne: false
            referencedRelation: "aooh_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_play_logs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_play_logs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      aooh_player_sessions: {
        Row: {
          access_token: string
          ad_space_id: string | null
          created_at: string
          id: string
          is_online: boolean
          label: string | null
          last_active_at: string | null
          venue_id: string | null
        }
        Insert: {
          access_token?: string
          ad_space_id?: string | null
          created_at?: string
          id?: string
          is_online?: boolean
          label?: string | null
          last_active_at?: string | null
          venue_id?: string | null
        }
        Update: {
          access_token?: string
          ad_space_id?: string | null
          created_at?: string
          id?: string
          is_online?: boolean
          label?: string | null
          last_active_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aooh_player_sessions_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_player_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_player_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      aooh_venue_assignments: {
        Row: {
          ad_space_id: string
          aooh_campaign_id: string
          assigned_at: string
          dayparts: Json | null
          id: string
          max_plays_per_day: number | null
          play_frequency_min: number | null
          status: string
          venue_id: string | null
        }
        Insert: {
          ad_space_id: string
          aooh_campaign_id: string
          assigned_at?: string
          dayparts?: Json | null
          id?: string
          max_plays_per_day?: number | null
          play_frequency_min?: number | null
          status?: string
          venue_id?: string | null
        }
        Update: {
          ad_space_id?: string
          aooh_campaign_id?: string
          assigned_at?: string
          dayparts?: Json | null
          id?: string
          max_plays_per_day?: number | null
          play_frequency_min?: number | null
          status?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aooh_venue_assignments_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_venue_assignments_aooh_campaign_id_fkey"
            columns: ["aooh_campaign_id"]
            isOneToOne: false
            referencedRelation: "aooh_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_venue_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aooh_venue_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          canonical_url: string | null
          category: string
          content: string
          created_at: string
          excerpt: string
          focus_keyword: string | null
          id: string
          image_alt_text: string | null
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          published_by: string | null
          read_time: string
          slug: string | null
          social_image_source_url: string | null
          social_image_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          canonical_url?: string | null
          category: string
          content: string
          created_at?: string
          excerpt: string
          focus_keyword?: string | null
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_by?: string | null
          read_time: string
          slug?: string | null
          social_image_source_url?: string | null
          social_image_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          canonical_url?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          focus_keyword?: string | null
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_by?: string | null
          read_time?: string
          slug?: string | null
          social_image_source_url?: string | null
          social_image_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      branch_materials: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          listing_id: string
          material_type: string
          quantity: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          listing_id: string
          material_type: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          material_type?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_materials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "franchise_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_materials_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_advertiser_profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          campaign_pillar: string | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          industry: string | null
          rejection_reason: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          verified: boolean | null
          website_domain: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          campaign_pillar?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          verified?: boolean | null
          website_domain?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          campaign_pillar?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          verified?: boolean | null
          website_domain?: string | null
        }
        Relationships: []
      }
      brand_campaign_changelog: {
        Row: {
          action: string
          brand_advertiser_id: string
          campaign_id: string | null
          campaign_name: string | null
          changed_by: string | null
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          action: string
          brand_advertiser_id: string
          campaign_id?: string | null
          campaign_name?: string | null
          changed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          action?: string
          brand_advertiser_id?: string
          campaign_id?: string | null
          campaign_name?: string | null
          changed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_campaign_changelog_brand_advertiser_id_fkey"
            columns: ["brand_advertiser_id"]
            isOneToOne: false
            referencedRelation: "brand_advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_campaign_changelog_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brand_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_campaigns: {
        Row: {
          brand_advertiser_id: string
          budget: number
          campaign_name: string
          countries: string[] | null
          created_at: string | null
          creative_format: string | null
          creative_set_id: string | null
          end_date: string | null
          environments: string[] | null
          id: string
          location_count: number | null
          location_types: string[] | null
          notes: string | null
          rejection_reason: string | null
          scope_name: string | null
          start_date: string | null
          status: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_gender: string | null
          updated_at: string | null
        }
        Insert: {
          brand_advertiser_id: string
          budget: number
          campaign_name: string
          countries?: string[] | null
          created_at?: string | null
          creative_format?: string | null
          creative_set_id?: string | null
          end_date?: string | null
          environments?: string[] | null
          id?: string
          location_count?: number | null
          location_types?: string[] | null
          notes?: string | null
          rejection_reason?: string | null
          scope_name?: string | null
          start_date?: string | null
          status?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_advertiser_id?: string
          budget?: number
          campaign_name?: string
          countries?: string[] | null
          created_at?: string | null
          creative_format?: string | null
          creative_set_id?: string | null
          end_date?: string | null
          environments?: string[] | null
          id?: string
          location_count?: number | null
          location_types?: string[] | null
          notes?: string | null
          rejection_reason?: string | null
          scope_name?: string | null
          start_date?: string | null
          status?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_campaigns_brand_advertiser_id_fkey"
            columns: ["brand_advertiser_id"]
            isOneToOne: false
            referencedRelation: "brand_advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_campaigns_creative_set_id_fkey"
            columns: ["creative_set_id"]
            isOneToOne: false
            referencedRelation: "brand_creative_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_creative_set_files: {
        Row: {
          created_at: string
          creative_set_id: string
          file_name: string
          file_size_bytes: number
          file_url: string
          id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          creative_set_id: string
          file_name: string
          file_size_bytes: number
          file_url: string
          id?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          creative_set_id?: string
          file_name?: string
          file_size_bytes?: number
          file_url?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_creative_set_files_creative_set_id_fkey"
            columns: ["creative_set_id"]
            isOneToOne: false
            referencedRelation: "brand_creative_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_creative_sets: {
        Row: {
          brand_advertiser_id: string
          created_at: string
          creative_count: number
          creative_format: string
          file_url: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brand_advertiser_id: string
          created_at?: string
          creative_count?: number
          creative_format: string
          file_url?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand_advertiser_id?: string
          created_at?: string
          creative_count?: number
          creative_format?: string
          file_url?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_creative_sets_brand_advertiser_id_fkey"
            columns: ["brand_advertiser_id"]
            isOneToOne: false
            referencedRelation: "brand_advertiser_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_prospects: {
        Row: {
          address: string | null
          assigned_to: string | null
          business_name: string
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          discovered_at: string
          google_maps_url: string | null
          google_place_id: string
          google_rating: number | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          opportunity_score: number
          phone: string | null
          prospect_status: string
          region: string | null
          review_count: number | null
          saved_at: string
          saved_by: string | null
          search_id: string | null
          source: string
          updated_at: string
          website_status: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          business_name: string
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          discovered_at?: string
          google_maps_url?: string | null
          google_place_id: string
          google_rating?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          opportunity_score?: number
          phone?: string | null
          prospect_status?: string
          region?: string | null
          review_count?: number | null
          saved_at?: string
          saved_by?: string | null
          search_id?: string | null
          source?: string
          updated_at?: string
          website_status?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          business_name?: string
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          discovered_at?: string
          google_maps_url?: string | null
          google_place_id?: string
          google_rating?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          opportunity_score?: number
          phone?: string | null
          prospect_status?: string
          region?: string | null
          review_count?: number | null
          saved_at?: string
          saved_by?: string | null
          search_id?: string | null
          source?: string
          updated_at?: string
          website_status?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_prospects_google_place_id_fkey"
            columns: ["google_place_id"]
            isOneToOne: true
            referencedRelation: "prospect_places"
            referencedColumns: ["google_place_id"]
          },
          {
            foreignKeyName: "business_prospects_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "prospect_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_ad_space_targets: {
        Row: {
          ad_space_id: string
          campaign_id: string
          created_at: string
          id: string
        }
        Insert: {
          ad_space_id: string
          campaign_id: string
          created_at?: string
          id?: string
        }
        Update: {
          ad_space_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ad_space_targets_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ad_space_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brand_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_spend_ledger: {
        Row: {
          ad_space_id: string
          amount: number
          bid_id: string
          campaign_id: string
          created_at: string
          event_type: string
          id: string
        }
        Insert: {
          ad_space_id: string
          amount: number
          bid_id: string
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
        }
        Update: {
          ad_space_id?: string
          amount?: number
          bid_id?: string
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_spend_ledger_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_spend_ledger_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brand_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_subscriptions: {
        Row: {
          campaign_id: string
          created_at: string
          email: string
          id: string
          subscribe_token: string
          subscribed: boolean
        }
        Insert: {
          campaign_id: string
          created_at?: string
          email: string
          id?: string
          subscribe_token: string
          subscribed?: boolean
        }
        Update: {
          campaign_id?: string
          created_at?: string
          email?: string
          id?: string
          subscribe_token?: string
          subscribed?: boolean
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          ad_unit_price: number | null
          ad_unit_type: string | null
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
          ad_unit_price?: number | null
          ad_unit_type?: string | null
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
          ad_unit_price?: number | null
          ad_unit_type?: string | null
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
      client_checkouts: {
        Row: {
          activation_id: string | null
          ad_space_id: string | null
          campaign_dates: string | null
          client_company: string | null
          client_email: string
          client_name: string
          created_at: string | null
          currency: string | null
          grand_total: number | null
          id: string
          lease_total: number | null
          line_items: Json
          listing_title: string | null
          material_total: number | null
          paid_at: string | null
          payment_method: string | null
          paymongo_checkout_session_id: string | null
          print_partner_id: string
          status: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          activation_id?: string | null
          ad_space_id?: string | null
          campaign_dates?: string | null
          client_company?: string | null
          client_email: string
          client_name: string
          created_at?: string | null
          currency?: string | null
          grand_total?: number | null
          id?: string
          lease_total?: number | null
          line_items?: Json
          listing_title?: string | null
          material_total?: number | null
          paid_at?: string | null
          payment_method?: string | null
          paymongo_checkout_session_id?: string | null
          print_partner_id: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Update: {
          activation_id?: string | null
          ad_space_id?: string | null
          campaign_dates?: string | null
          client_company?: string | null
          client_email?: string
          client_name?: string
          created_at?: string | null
          currency?: string | null
          grand_total?: number | null
          id?: string
          lease_total?: number | null
          line_items?: Json
          listing_title?: string | null
          material_total?: number | null
          paid_at?: string | null
          payment_method?: string | null
          paymongo_checkout_session_id?: string | null
          print_partner_id?: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_checkouts_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
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
      dooh_play_logs: {
        Row: {
          ad_space_id: string | null
          completed: boolean
          creative_source: string
          duration_sec: number | null
          id: string
          played_at: string
          player_session_id: string | null
          source_id: string | null
        }
        Insert: {
          ad_space_id?: string | null
          completed?: boolean
          creative_source?: string
          duration_sec?: number | null
          id?: string
          played_at?: string
          player_session_id?: string | null
          source_id?: string | null
        }
        Update: {
          ad_space_id?: string | null
          completed?: boolean
          creative_source?: string
          duration_sec?: number | null
          id?: string
          played_at?: string
          player_session_id?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dooh_play_logs_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dooh_play_logs_player_session_id_fkey"
            columns: ["player_session_id"]
            isOneToOne: false
            referencedRelation: "dooh_player_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dooh_player_sessions: {
        Row: {
          access_token: string
          ad_space_id: string | null
          created_at: string
          id: string
          is_online: boolean
          label: string | null
          last_active_at: string | null
          resolution: string | null
          venue_id: string | null
        }
        Insert: {
          access_token?: string
          ad_space_id?: string | null
          created_at?: string
          id?: string
          is_online?: boolean
          label?: string | null
          last_active_at?: string | null
          resolution?: string | null
          venue_id?: string | null
        }
        Update: {
          access_token?: string
          ad_space_id?: string | null
          created_at?: string
          id?: string
          is_online?: boolean
          label?: string | null
          last_active_at?: string | null
          resolution?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dooh_player_sessions_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dooh_player_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dooh_player_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      external_inventory: {
        Row: {
          added_by: string | null
          base_cpm: number | null
          contact_info: string | null
          contact_name: string | null
          created_at: string
          external_ref_id: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          max_spot_seconds: number | null
          media_type: string
          min_spot_seconds: number | null
          notes: string | null
          published_ad_space_id: string | null
          screen_count: number | null
          status: string
          supply_source: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          added_by?: string | null
          base_cpm?: number | null
          contact_info?: string | null
          contact_name?: string | null
          created_at?: string
          external_ref_id?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_spot_seconds?: number | null
          media_type: string
          min_spot_seconds?: number | null
          notes?: string | null
          published_ad_space_id?: string | null
          screen_count?: number | null
          status?: string
          supply_source: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          added_by?: string | null
          base_cpm?: number | null
          contact_info?: string | null
          contact_name?: string | null
          created_at?: string
          external_ref_id?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_spot_seconds?: number | null
          media_type?: string
          min_spot_seconds?: number | null
          notes?: string | null
          published_ad_space_id?: string | null
          screen_count?: number | null
          status?: string
          supply_source?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_inventory_published_ad_space_id_fkey"
            columns: ["published_ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_branches: {
        Row: {
          ad_unit_quantity: number | null
          branch_operating_hours: string | null
          branch_photos: Json | null
          created_at: string
          franchise_id: string
          full_address: string
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          place_name: string
          updated_at: string
        }
        Insert: {
          ad_unit_quantity?: number | null
          branch_operating_hours?: string | null
          branch_photos?: Json | null
          created_at?: string
          franchise_id: string
          full_address: string
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name: string
          updated_at?: string
        }
        Update: {
          ad_unit_quantity?: number | null
          branch_operating_hours?: string | null
          branch_photos?: Json | null
          created_at?: string
          franchise_id?: string
          full_address?: string
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_branches_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_booking_locations: {
        Row: {
          branch_address: string | null
          branch_id: string | null
          branch_name: string | null
          city: string | null
          created_at: string
          duration_weeks: number
          guest_booking_id: string
          id: string
          listing_id: string
          quantity: number
          subtotal: number
          unit_price: number
          unit_type: string | null
        }
        Insert: {
          branch_address?: string | null
          branch_id?: string | null
          branch_name?: string | null
          city?: string | null
          created_at?: string
          duration_weeks?: number
          guest_booking_id: string
          id?: string
          listing_id: string
          quantity?: number
          subtotal?: number
          unit_price?: number
          unit_type?: string | null
        }
        Update: {
          branch_address?: string | null
          branch_id?: string | null
          branch_name?: string | null
          city?: string | null
          created_at?: string
          duration_weeks?: number
          guest_booking_id?: string
          id?: string
          listing_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_booking_locations_guest_booking_id_fkey"
            columns: ["guest_booking_id"]
            isOneToOne: false
            referencedRelation: "guest_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_bookings: {
        Row: {
          booking_status: string
          brand_name: string | null
          created_at: string
          creative_url: string | null
          currency: string
          guest_email: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          payment_status: string
          paymongo_checkout_session_id: string | null
          total_locations: number
          total_price: number
          total_quantity: number
          updated_at: string
        }
        Insert: {
          booking_status?: string
          brand_name?: string | null
          created_at?: string
          creative_url?: string | null
          currency?: string
          guest_email: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          total_locations?: number
          total_price?: number
          total_quantity?: number
          updated_at?: string
        }
        Update: {
          booking_status?: string
          brand_name?: string | null
          created_at?: string
          creative_url?: string | null
          currency?: string
          guest_email?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          total_locations?: number
          total_price?: number
          total_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      guest_campaigns: {
        Row: {
          budget_amount: number | null
          budget_currency: string | null
          campaign_description: string | null
          campaign_name: string
          campaign_type: string
          created_at: string
          email: string
          email_verified: boolean
          end_date: string | null
          id: string
          location: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_description?: string | null
          campaign_name: string
          campaign_type: string
          created_at?: string
          email: string
          email_verified?: boolean
          end_date?: string | null
          id?: string
          location?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_description?: string | null
          campaign_name?: string
          campaign_type?: string
          created_at?: string
          email?: string
          email_verified?: boolean
          end_date?: string | null
          id?: string
          location?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      house_ad_schedules: {
        Row: {
          ad_space_id: string
          created_at: string
          creative_id: string
          dayparts: Json
          end_date: string | null
          id: string
          media_type: string
          play_count: number
          player_session_id: string | null
          priority: number
          publisher_id: string
          start_date: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          ad_space_id: string
          created_at?: string
          creative_id: string
          dayparts?: Json
          end_date?: string | null
          id?: string
          media_type: string
          play_count?: number
          player_session_id?: string | null
          priority?: number
          publisher_id: string
          start_date?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          ad_space_id?: string
          created_at?: string
          creative_id?: string
          dayparts?: Json
          end_date?: string | null
          id?: string
          media_type?: string
          play_count?: number
          player_session_id?: string | null
          priority?: number
          publisher_id?: string
          start_date?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_ad_schedules_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_ad_schedules_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "retailer_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_ad_schedules_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_ad_schedules_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
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
      listing_submissions: {
        Row: {
          address: string
          created_at: string
          id: string
          listing_status: string
          location_name: string
          notes: string | null
          payment_status: string
          paymongo_checkout_session_id: string | null
          photo_url: string | null
          size: string
          space_type: string
          submitter_email: string | null
          submitter_name: string | null
          submitter_phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          listing_status?: string
          location_name: string
          notes?: string | null
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          photo_url?: string | null
          size?: string
          space_type: string
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          listing_status?: string
          location_name?: string
          notes?: string | null
          payment_status?: string
          paymongo_checkout_session_id?: string | null
          photo_url?: string | null
          size?: string
          space_type?: string
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      local_listing_clients: {
        Row: {
          address: string | null
          assigned_admin_id: string | null
          business_hours: string | null
          business_name: string
          category: string | null
          created_at: string
          description: string | null
          gbp_status: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_admin_id?: string | null
          business_hours?: string | null
          business_name: string
          category?: string | null
          created_at?: string
          description?: string | null
          gbp_status?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_admin_id?: string | null
          business_hours?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          description?: string | null
          gbp_status?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      media_plan_requests: {
        Row: {
          advertiser_id: string | null
          aooh_units: number | null
          budget_confirmation: number | null
          campaign_name: string
          campaign_pillar: string | null
          campaign_type: string
          center_lat: number
          center_lng: number
          created_at: string
          dooh_units: number | null
          estimated_price: number
          id: string
          notes: string | null
          ooh_units: number | null
          paid_at: string | null
          paymongo_checkout_id: string | null
          preferred_start_date: string | null
          radius_meters: number
          requester_email: string | null
          selections: Json | null
          status: string
          updated_at: string
          venue_count: number
        }
        Insert: {
          advertiser_id?: string | null
          aooh_units?: number | null
          budget_confirmation?: number | null
          campaign_name: string
          campaign_pillar?: string | null
          campaign_type: string
          center_lat: number
          center_lng: number
          created_at?: string
          dooh_units?: number | null
          estimated_price: number
          id?: string
          notes?: string | null
          ooh_units?: number | null
          paid_at?: string | null
          paymongo_checkout_id?: string | null
          preferred_start_date?: string | null
          radius_meters: number
          requester_email?: string | null
          selections?: Json | null
          status?: string
          updated_at?: string
          venue_count: number
        }
        Update: {
          advertiser_id?: string | null
          aooh_units?: number | null
          budget_confirmation?: number | null
          campaign_name?: string
          campaign_pillar?: string | null
          campaign_type?: string
          center_lat?: number
          center_lng?: number
          created_at?: string
          dooh_units?: number | null
          estimated_price?: number
          id?: string
          notes?: string | null
          ooh_units?: number | null
          paid_at?: string | null
          paymongo_checkout_id?: string | null
          preferred_start_date?: string | null
          radius_meters?: number
          requester_email?: string | null
          selections?: Json | null
          status?: string
          updated_at?: string
          venue_count?: number
        }
        Relationships: []
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
      mobile_qr_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event_type: string
          id: string
          landing_page: string | null
          qr_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          landing_page?: string | null
          qr_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          landing_page?: string | null
          qr_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_qr_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_qr_events_qr_id_fkey"
            columns: ["qr_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_qr_leads: {
        Row: {
          advertiser_id: string | null
          campaign_id: string | null
          consent_marketing: boolean
          consent_timestamp: string | null
          created_at: string
          first_seen_at: string
          id: string
          last_seen_at: string
          mobile_number: string
          mobile_verified: boolean
          offer_redeemed_at: string | null
          otp_provider: string | null
          privacy_policy_version: string | null
          qr_id: string
          session_id: string | null
          source: string | null
          terms_version: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          advertiser_id?: string | null
          campaign_id?: string | null
          consent_marketing?: boolean
          consent_timestamp?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          mobile_number: string
          mobile_verified?: boolean
          offer_redeemed_at?: string | null
          otp_provider?: string | null
          privacy_policy_version?: string | null
          qr_id: string
          session_id?: string | null
          source?: string | null
          terms_version?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          advertiser_id?: string | null
          campaign_id?: string | null
          consent_marketing?: boolean
          consent_timestamp?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          mobile_number?: string
          mobile_verified?: boolean
          offer_redeemed_at?: string | null
          otp_provider?: string | null
          privacy_policy_version?: string | null
          qr_id?: string
          session_id?: string | null
          source?: string | null
          terms_version?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_qr_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_qr_leads_qr_id_fkey"
            columns: ["qr_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
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
      otp_verifications: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Relationships: []
      }
      partner_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      partner_portfolio_items: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          item_type: string
          mime_type: string | null
          partner_id: string
          platform: string | null
          sort_order: number
          title: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          item_type?: string
          mime_type?: string | null
          partner_id: string
          platform?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          item_type?: string
          mime_type?: string | null
          partner_id?: string
          platform?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_portfolio_items_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_specializations: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          kind: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_specializations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "partner_categories"
            referencedColumns: ["id"]
          },
        ]
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
      print_partner_branch_jobs: {
        Row: {
          branch_name: string | null
          created_at: string
          delivery_fee: number | null
          full_address: string | null
          id: string
          job_id: string
          location_id: string | null
          materials: Json | null
          quantities: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          branch_name?: string | null
          created_at?: string
          delivery_fee?: number | null
          full_address?: string | null
          id?: string
          job_id: string
          location_id?: string | null
          materials?: Json | null
          quantities?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          branch_name?: string | null
          created_at?: string
          delivery_fee?: number | null
          full_address?: string | null
          id?: string
          job_id?: string
          location_id?: string | null
          materials?: Json | null
          quantities?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_branch_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "print_partner_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_branch_jobs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "print_partner_campaign_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_campaign_locations: {
        Row: {
          branch_name: string
          campaign_id: string
          city: string | null
          contact_number: string | null
          created_at: string
          delivery_fee: number | null
          delivery_notes: string | null
          full_address: string
          id: string
          materials: Json | null
          quantities: Json | null
          recipient_name: string | null
          region: string | null
          status: string
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          branch_name: string
          campaign_id: string
          city?: string | null
          contact_number?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_notes?: string | null
          full_address: string
          id?: string
          materials?: Json | null
          quantities?: Json | null
          recipient_name?: string | null
          region?: string | null
          status?: string
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          branch_name?: string
          campaign_id?: string
          city?: string | null
          contact_number?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_notes?: string | null
          full_address?: string
          id?: string
          materials?: Json | null
          quantities?: Json | null
          recipient_name?: string | null
          region?: string | null
          status?: string
          subtotal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_campaign_locations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "print_partner_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_campaigns: {
        Row: {
          campaign_name: string
          client_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          internal_notes: string | null
          partner_id: string
          payment_status: string | null
          start_date: string | null
          status: string
          total_estimated_cost: number | null
          updated_at: string
        }
        Insert: {
          campaign_name: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          partner_id: string
          payment_status?: string | null
          start_date?: string | null
          status?: string
          total_estimated_cost?: number | null
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          partner_id?: string
          payment_status?: string | null
          start_date?: string | null
          status?: string
          total_estimated_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "print_partner_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_campaigns_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_checkout_links: {
        Row: {
          campaign_id: string
          created_at: string
          expires_at: string | null
          id: string
          partner_id: string
          paymongo_checkout_session_id: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          partner_id: string
          paymongo_checkout_session_id?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          partner_id?: string
          paymongo_checkout_session_id?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_checkout_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "print_partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_checkout_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_clients: {
        Row: {
          billing_address: string | null
          company_name: string
          completed_jobs: number | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          lifetime_spend: number | null
          notes: string | null
          partner_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          company_name: string
          completed_jobs?: number | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lifetime_spend?: number | null
          notes?: string | null
          partner_id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          company_name?: string
          completed_jobs?: number | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lifetime_spend?: number | null
          notes?: string | null
          partner_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_clients_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_files: {
        Row: {
          campaign_id: string | null
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          partner_id: string
          tags: string[] | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          partner_id: string
          tags?: string[] | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          partner_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_files_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "print_partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_files_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_jobs: {
        Row: {
          campaign_id: string
          client_id: string | null
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          partner_id: string
          payment_status: string | null
          priority: string | null
          status: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          payment_status?: string | null
          priority?: string | null
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          payment_status?: string | null
          priority?: string | null
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "print_partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "print_partner_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_jobs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_material_pricing: {
        Row: {
          base_price: number
          bulk_tiers: Json | null
          created_at: string
          currency: string
          default_size: string
          design_fee: number | null
          id: string
          is_active: boolean | null
          material_name: string
          min_quantity: number | null
          partner_id: string
          rush_fee: number | null
          selling_price: number
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          bulk_tiers?: Json | null
          created_at?: string
          currency?: string
          default_size?: string
          design_fee?: number | null
          id?: string
          is_active?: boolean | null
          material_name: string
          min_quantity?: number | null
          partner_id: string
          rush_fee?: number | null
          selling_price?: number
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          bulk_tiers?: Json | null
          created_at?: string
          currency?: string
          default_size?: string
          design_fee?: number | null
          id?: string
          is_active?: boolean | null
          material_name?: string
          min_quantity?: number | null
          partner_id?: string
          rush_fee?: number | null
          selling_price?: number
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_material_pricing_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_partner_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          availability: string[]
          blocked_reason: string | null
          business_address: string | null
          business_registration_name: string | null
          capabilities: string[]
          certifications: Json
          company_description: string | null
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone: string | null
          coverage_cities: string[]
          coverage_countries: string[]
          coverage_provinces: string[]
          coverage_regions: string[]
          created_at: string
          id: string
          industries_served: string[]
          is_blocked: boolean
          is_featured: boolean
          job_title: string | null
          logo_url: string | null
          notable_clients: string | null
          partner_category: string | null
          rejection_reason: string | null
          service_areas: string[] | null
          service_coverage: string | null
          social_links: Json
          specializations: string[]
          status: string
          team_size: string | null
          token_expires: string | null
          updated_at: string
          user_id: string
          verification_token: string | null
          verified: boolean | null
          website: string | null
          years_experience: number | null
          years_in_operation: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          availability?: string[]
          blocked_reason?: string | null
          business_address?: string | null
          business_registration_name?: string | null
          capabilities?: string[]
          certifications?: Json
          company_description?: string | null
          company_name?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string | null
          coverage_cities?: string[]
          coverage_countries?: string[]
          coverage_provinces?: string[]
          coverage_regions?: string[]
          created_at?: string
          id?: string
          industries_served?: string[]
          is_blocked?: boolean
          is_featured?: boolean
          job_title?: string | null
          logo_url?: string | null
          notable_clients?: string | null
          partner_category?: string | null
          rejection_reason?: string | null
          service_areas?: string[] | null
          service_coverage?: string | null
          social_links?: Json
          specializations?: string[]
          status?: string
          team_size?: string | null
          token_expires?: string | null
          updated_at?: string
          user_id: string
          verification_token?: string | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
          years_in_operation?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          availability?: string[]
          blocked_reason?: string | null
          business_address?: string | null
          business_registration_name?: string | null
          capabilities?: string[]
          certifications?: Json
          company_description?: string | null
          company_name?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string | null
          coverage_cities?: string[]
          coverage_countries?: string[]
          coverage_provinces?: string[]
          coverage_regions?: string[]
          created_at?: string
          id?: string
          industries_served?: string[]
          is_blocked?: boolean
          is_featured?: boolean
          job_title?: string | null
          logo_url?: string | null
          notable_clients?: string | null
          partner_category?: string | null
          rejection_reason?: string | null
          service_areas?: string[] | null
          service_coverage?: string | null
          social_links?: Json
          specializations?: string[]
          status?: string
          team_size?: string | null
          token_expires?: string | null
          updated_at?: string
          user_id?: string
          verification_token?: string | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
          years_in_operation?: number | null
        }
        Relationships: []
      }
      print_partner_proofs: {
        Row: {
          branch_job_id: string | null
          campaign_id: string | null
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          job_id: string | null
          notes: string | null
          partner_id: string
        }
        Insert: {
          branch_job_id?: string | null
          campaign_id?: string | null
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          job_id?: string | null
          notes?: string | null
          partner_id: string
        }
        Update: {
          branch_job_id?: string | null
          campaign_id?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_partner_proofs_branch_job_id_fkey"
            columns: ["branch_job_id"]
            isOneToOne: false
            referencedRelation: "print_partner_branch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_proofs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "print_partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_proofs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "print_partner_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_partner_proofs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "print_partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          provider: string
          role: string
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          provider?: string
          role?: string
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          provider?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospect_places: {
        Row: {
          address: string | null
          business_name: string
          business_status: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          details_fetched_at: string
          google_maps_url: string | null
          google_place_id: string
          google_rating: number | null
          latitude: number | null
          longitude: number | null
          opportunity_score: number
          phone: string | null
          region: string | null
          review_count: number | null
          updated_at: string
          website_status: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_status?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          details_fetched_at?: string
          google_maps_url?: string | null
          google_place_id: string
          google_rating?: number | null
          latitude?: number | null
          longitude?: number | null
          opportunity_score?: number
          phone?: string | null
          region?: string | null
          review_count?: number | null
          updated_at?: string
          website_status?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_status?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          details_fetched_at?: string
          google_maps_url?: string | null
          google_place_id?: string
          google_rating?: number | null
          latitude?: number | null
          longitude?: number | null
          opportunity_score?: number
          phone?: string | null
          region?: string | null
          review_count?: number | null
          updated_at?: string
          website_status?: string
          website_url?: string | null
        }
        Relationships: []
      }
      prospect_searches: {
        Row: {
          business_type: string | null
          created_at: string
          id: string
          keyword: string
          lat: number | null
          lng: number | null
          location_text: string
          min_rating: number | null
          min_reviews: number | null
          place_ids: string[]
          radius_km: number
          result_limit: number
          results_count: number
          search_key: string
          searched_by: string
          updated_at: string
          website_gap_count: number
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          id?: string
          keyword: string
          lat?: number | null
          lng?: number | null
          location_text: string
          min_rating?: number | null
          min_reviews?: number | null
          place_ids?: string[]
          radius_km?: number
          result_limit?: number
          results_count?: number
          search_key: string
          searched_by: string
          updated_at?: string
          website_gap_count?: number
        }
        Update: {
          business_type?: string | null
          created_at?: string
          id?: string
          keyword?: string
          lat?: number | null
          lng?: number | null
          location_text?: string
          min_rating?: number | null
          min_reviews?: number | null
          place_ids?: string[]
          radius_km?: number
          result_limit?: number
          results_count?: number
          search_key?: string
          searched_by?: string
          updated_at?: string
          website_gap_count?: number
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
          external_source_name: string | null
          id: string
          is_external_source: boolean
          is_house_account: boolean
          location: string | null
          managed_by_agent_id: string | null
          metrics: Json | null
          portfolio_media: Json | null
          publisher_type: Database["public"]["Enums"]["publisher_type"]
          rejection_reason: string | null
          social_media: Json | null
          token_expires: string | null
          updated_at: string | null
          user_id: string | null
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
          external_source_name?: string | null
          id?: string
          is_external_source?: boolean
          is_house_account?: boolean
          location?: string | null
          managed_by_agent_id?: string | null
          metrics?: Json | null
          portfolio_media?: Json | null
          publisher_type: Database["public"]["Enums"]["publisher_type"]
          rejection_reason?: string | null
          social_media?: Json | null
          token_expires?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          external_source_name?: string | null
          id?: string
          is_external_source?: boolean
          is_house_account?: boolean
          location?: string | null
          managed_by_agent_id?: string | null
          metrics?: Json | null
          portfolio_media?: Json | null
          publisher_type?: Database["public"]["Enums"]["publisher_type"]
          rejection_reason?: string | null
          social_media?: Json | null
          token_expires?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          ad_space_id: string | null
          advertiser_id: string | null
          background_url: string | null
          brand_name: string | null
          campaign_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          destination_url: string
          end_date: string | null
          id: string
          is_active: boolean | null
          landing_title: string | null
          logo_url: string | null
          name: string | null
          offer_cta: string | null
          placement_label: string | null
          privacy_policy_url: string | null
          privacy_policy_version: string | null
          qr_ref: string | null
          qr_type: string
          short_code: string
          start_date: string | null
          status: string
          terms_text: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          ad_space_id?: string | null
          advertiser_id?: string | null
          background_url?: string | null
          brand_name?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination_url: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          landing_title?: string | null
          logo_url?: string | null
          name?: string | null
          offer_cta?: string | null
          placement_label?: string | null
          privacy_policy_url?: string | null
          privacy_policy_version?: string | null
          qr_ref?: string | null
          qr_type?: string
          short_code: string
          start_date?: string | null
          status?: string
          terms_text?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          ad_space_id?: string | null
          advertiser_id?: string | null
          background_url?: string | null
          brand_name?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination_url?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          landing_title?: string | null
          logo_url?: string | null
          name?: string | null
          offer_cta?: string | null
          placement_label?: string | null
          privacy_policy_url?: string | null
          privacy_policy_version?: string | null
          qr_ref?: string | null
          qr_type?: string
          short_code?: string
          start_date?: string | null
          status?: string
          terms_text?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_audience_data: {
        Row: {
          age_ranges: Json
          created_at: string
          daily_visitors: number | null
          demographics: Json
          gender_split: Json
          id: string
          peak_hours: Json
          publisher_id: string
          updated_at: string
          visibility_score: number
        }
        Insert: {
          age_ranges?: Json
          created_at?: string
          daily_visitors?: number | null
          demographics?: Json
          gender_split?: Json
          id?: string
          peak_hours?: Json
          publisher_id: string
          updated_at?: string
          visibility_score?: number
        }
        Update: {
          age_ranges?: Json
          created_at?: string
          daily_visitors?: number | null
          demographics?: Json
          gender_split?: Json
          id?: string
          peak_hours?: Json
          publisher_id?: string
          updated_at?: string
          visibility_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "retailer_audience_data_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: true
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_audience_data_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: true
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_creatives: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          creative_type: string
          description: string | null
          duration_sec: number | null
          file_format: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_url: string
          height_px: number | null
          id: string
          last_deployed_at: string | null
          publisher_id: string
          status: string
          tags: Json
          thumbnail_url: string | null
          title: string
          updated_at: string
          used_in_count: number
          width_px: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          creative_type: string
          description?: string | null
          duration_sec?: number | null
          file_format?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url: string
          height_px?: number | null
          id?: string
          last_deployed_at?: string | null
          publisher_id: string
          status?: string
          tags?: Json
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          used_in_count?: number
          width_px?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          creative_type?: string
          description?: string | null
          duration_sec?: number | null
          file_format?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string
          height_px?: number | null
          id?: string
          last_deployed_at?: string | null
          publisher_id?: string
          status?: string
          tags?: Json
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          used_in_count?: number
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retailer_creatives_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_creatives_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_payout_details: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          publisher_id: string
          revenue_share_pct: number
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          publisher_id: string
          revenue_share_pct?: number
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          publisher_id?: string
          revenue_share_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_payout_details_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: true
            referencedRelation: "publisher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_payout_details_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: true
            referencedRelation: "publisher_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      talent_bookings: {
        Row: {
          advertiser_id: string
          campaign_type: string | null
          created_at: string
          duration: string | null
          end_date: string | null
          id: string
          notes: string | null
          proof_urls: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["booking_status"]
          talent_id: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          campaign_type?: string | null
          created_at?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          proof_urls?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          talent_id: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          campaign_type?: string | null
          created_at?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          proof_urls?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_bookings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          availability: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          location: string
          portfolio_urls: Json | null
          rejection_reason: string | null
          skill_type: Database["public"]["Enums"]["skill_type"]
          status: Database["public"]["Enums"]["talent_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          availability?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          location: string
          portfolio_urls?: Json | null
          rejection_reason?: string | null
          skill_type: Database["public"]["Enums"]["skill_type"]
          status?: Database["public"]["Enums"]["talent_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          availability?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          location?: string
          portfolio_urls?: Json | null
          rejection_reason?: string | null
          skill_type?: Database["public"]["Enums"]["skill_type"]
          status?: Database["public"]["Enums"]["talent_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      talent_reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          talent_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          talent_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "talent_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_reviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      venue_subscription_messages: {
        Row: {
          agent_id: string
          clicks: number
          created_at: string
          delivered: boolean
          first_clicked_at: string | null
          first_opened_at: string | null
          id: string
          last_clicked_at: string | null
          last_opened_at: string | null
          message: string
          message_type: string
          metadata: Json
          opens: number
          sent_at: string
          subject: string
          subscription_id: string
          tracking_token: string
        }
        Insert: {
          agent_id: string
          clicks?: number
          created_at?: string
          delivered?: boolean
          first_clicked_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_clicked_at?: string | null
          last_opened_at?: string | null
          message: string
          message_type?: string
          metadata?: Json
          opens?: number
          sent_at?: string
          subject: string
          subscription_id: string
          tracking_token: string
        }
        Update: {
          agent_id?: string
          clicks?: number
          created_at?: string
          delivered?: boolean
          first_clicked_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_clicked_at?: string | null
          last_opened_at?: string | null
          message?: string
          message_type?: string
          metadata?: Json
          opens?: number
          sent_at?: string
          subject?: string
          subscription_id?: string
          tracking_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_subscription_messages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "venue_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_subscriptions: {
        Row: {
          ad_space_id: string | null
          agent_id: string
          campaign_status: string | null
          contact_person: string | null
          created_at: string
          email: string
          email_verified: boolean
          id: string
          last_contacted_at: string | null
          subscription_status: Database["public"]["Enums"]["venue_subscription_status"]
          updated_at: string
          venue_name: string | null
          verification_expiry: string
          verification_sent_at: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          ad_space_id?: string | null
          agent_id: string
          campaign_status?: string | null
          contact_person?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          id?: string
          last_contacted_at?: string | null
          subscription_status?: Database["public"]["Enums"]["venue_subscription_status"]
          updated_at?: string
          venue_name?: string | null
          verification_expiry?: string
          verification_sent_at?: string
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          ad_space_id?: string | null
          agent_id?: string
          campaign_status?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          last_contacted_at?: string | null
          subscription_status?: Database["public"]["Enums"]["venue_subscription_status"]
          updated_at?: string
          venue_name?: string | null
          verification_expiry?: string
          verification_sent_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_subscriptions_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
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
      ad_space_owner_exists: {
        Args: { _advertiser_id: string; _publisher_id: string }
        Returns: boolean
      }
      check_cross_branch_duplicate: {
        Args: { _full_address: string; _user_id: string }
        Returns: {
          branch_id: string
          exists_in: string
          listing_title: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_active_inventory_all: {
        Args: never
        Returns: {
          activation_fee: number | null
          admin_notes: string | null
          advertiser_id: string | null
          agent_disconnected: boolean
          annual_subscription_fee: number | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          availability_status: string | null
          contact_verified_at: string | null
          created_at: string | null
          description: string | null
          external_ref_id: string | null
          has_pending_advertiser: boolean | null
          id: string
          latitude: number | null
          leased_advertiser_ids: string[]
          location: string | null
          longitude: number | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_types: Database["public"]["Enums"]["media_type"][]
          media_urls: Json | null
          monthly_subscription_fee: number | null
          pending_advertiser_email: string | null
          pricing: Json | null
          publisher_id: string
          rejection_reason: string | null
          specifications: Json | null
          title: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "ad_spaces"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_auth_email: { Args: never; Returns: string }
      get_client_checkout_by_token: {
        Args: { _token: string }
        Returns: {
          activation_id: string | null
          ad_space_id: string | null
          campaign_dates: string | null
          client_company: string | null
          client_email: string
          client_name: string
          created_at: string | null
          currency: string | null
          grand_total: number | null
          id: string
          lease_total: number | null
          line_items: Json
          listing_title: string | null
          material_total: number | null
          paid_at: string | null
          payment_method: string | null
          paymongo_checkout_session_id: string | null
          print_partner_id: string
          status: string | null
          token: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "client_checkouts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_listing_branch_cities: {
        Args: { _listing_ids: string[] }
        Returns: {
          branch_count: number
          city: string
          country: string
          listing_id: string
        }[]
      }
      get_listing_branch_counts: {
        Args: { _listing_ids: string[] }
        Returns: {
          branch_count: number
          listing_id: string
        }[]
      }
      get_mobile_qr_public: {
        Args: { _qr_ref: string }
        Returns: {
          background_url: string
          brand_name: string
          description: string
          destination_url: string
          id: string
          landing_title: string
          logo_url: string
          name: string
          offer_cta: string
          privacy_policy_url: string
          privacy_policy_version: string
          qr_ref: string
          status: string
          terms_text: string
          terms_version: string
        }[]
      }
      get_venue_ticket_by_code: {
        Args: { _unique_code: string }
        Returns: {
          created_at: string
          customer_email: string
          customer_name: string
          event_id: string
          event_title: string
          id: string
          scanned_at: string
          scanned_by: string
          status: string
          unique_code: string
          venue_owner_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_advertiser_for_listing: {
        Args: { _ad_space_id: string; _user_id: string }
        Returns: boolean
      }
      is_verified_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      next_mobile_qr_ref: { Args: never; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      search_nearby_listings: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          activation_fee: number
          annual_subscription_fee: number
          category: string
          created_at: string
          description: string
          distance_km: number
          id: string
          latitude: number
          location: string
          longitude: number
          media_urls: Json
          monthly_subscription_fee: number
          pricing: Json
          publisher_business_name: string
          service_type: string
          specifications: Json
          title: string
        }[]
      }
      set_guest_booking_session: {
        Args: { _booking_id: string; _session_id: string }
        Returns: undefined
      }
      set_own_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      upsert_advertiser_branch: {
        Args: {
          _advertiser_id: string
          _branch_name?: string
          _contact_email?: string
          _contact_name?: string
          _contact_phone?: string
          _full_address: string
        }
        Returns: string
      }
      upsert_franchise_branch: {
        Args: {
          _ad_unit_quantity?: number
          _branch_operating_hours?: string
          _franchise_id: string
          _full_address: string
          _latitude?: number
          _longitude?: number
          _notes?: string
          _place_name: string
        }
        Returns: string
      }
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
        | "pending_submission"
        | "under_review"
        | "cancelled"
      activation_type:
        | "sticker"
        | "table_tent"
        | "poster"
        | "flyer"
        | "banner"
        | "other"
      admin_status: "pending" | "verified" | "rejected"
      agent_role: "guerrilla" | "influencer" | "model" | "artist"
      app_role:
        | "admin"
        | "publisher"
        | "advertiser"
        | "talent"
        | "print_partner"
        | "agent"
        | "brand_advertiser"
      approval_status: "pending" | "approved" | "rejected"
      booking_status:
        | "pending"
        | "accepted"
        | "declined"
        | "completed"
        | "cancelled"
      media_type: "OOH" | "DOOH" | "AOOH"
      print_order_status:
        | "pending_admin"
        | "in_production"
        | "shipped"
        | "delivered"
      publisher_ticket_status: "active" | "used"
      publisher_type: "venue" | "digital" | "agent"
      skill_type: "promoter" | "artist" | "creator"
      talent_status: "pending" | "approved" | "rejected"
      venue_subscription_status:
        | "pending"
        | "active"
        | "unsubscribed"
        | "expired"
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
        "pending_submission",
        "under_review",
        "cancelled",
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
      app_role: [
        "admin",
        "publisher",
        "advertiser",
        "talent",
        "print_partner",
        "agent",
        "brand_advertiser",
      ],
      approval_status: ["pending", "approved", "rejected"],
      booking_status: [
        "pending",
        "accepted",
        "declined",
        "completed",
        "cancelled",
      ],
      media_type: ["OOH", "DOOH", "AOOH"],
      print_order_status: [
        "pending_admin",
        "in_production",
        "shipped",
        "delivered",
      ],
      publisher_ticket_status: ["active", "used"],
      publisher_type: ["venue", "digital", "agent"],
      skill_type: ["promoter", "artist", "creator"],
      talent_status: ["pending", "approved", "rejected"],
      venue_subscription_status: [
        "pending",
        "active",
        "unsubscribed",
        "expired",
      ],
      venue_ticket_status: ["valid", "used"],
    },
  },
} as const
