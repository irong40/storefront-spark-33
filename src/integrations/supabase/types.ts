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
      business_settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_name: string
          city: string | null
          created_at: string | null
          delivery_fee: number | null
          delivery_free_threshold: number | null
          delivery_windows: Json | null
          description: string | null
          email: string | null
          favicon_url: string | null
          hours: Json | null
          id: string
          logo_url: string | null
          phone: string | null
          social_links: Json | null
          state: string | null
          tagline: string | null
          tax_rate: number
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_name: string
          city?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_free_threshold?: number | null
          delivery_windows?: Json | null
          description?: string | null
          email?: string | null
          favicon_url?: string | null
          hours?: Json | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          social_links?: Json | null
          state?: string | null
          tagline?: string | null
          tax_rate?: number
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_name?: string
          city?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_free_threshold?: number | null
          delivery_windows?: Json | null
          description?: string | null
          email?: string | null
          favicon_url?: string | null
          hours?: Json | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          social_links?: Json | null
          state?: string | null
          tagline?: string | null
          tax_rate?: number
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          addon_ids: string[] | null
          cart_id: string | null
          created_at: string | null
          gift_card_data: Json | null
          id: string
          is_subscription: boolean | null
          product_id: string | null
          quantity: number
          selected_flavor_ids: string[] | null
          size_id: string | null
          size_override_id: string | null
          updated_at: string | null
        }
        Insert: {
          addon_ids?: string[] | null
          cart_id?: string | null
          created_at?: string | null
          gift_card_data?: Json | null
          id?: string
          is_subscription?: boolean | null
          product_id?: string | null
          quantity?: number
          selected_flavor_ids?: string[] | null
          size_id?: string | null
          size_override_id?: string | null
          updated_at?: string | null
        }
        Update: {
          addon_ids?: string[] | null
          cart_id?: string | null
          created_at?: string | null
          gift_card_data?: Json | null
          id?: string
          is_subscription?: boolean | null
          product_id?: string | null
          quantity?: number
          selected_flavor_ids?: string[] | null
          size_id?: string | null
          size_override_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_size_override_id_fkey"
            columns: ["size_override_id"]
            isOneToOne: false
            referencedRelation: "product_size_overrides"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number | null
          square_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          square_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          square_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          created_at: string | null
          default_billing_address: Json | null
          default_shipping_address: Json | null
          email: string
          full_name: string | null
          id: string
          marketing_opt_in: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_billing_address?: Json | null
          default_shipping_address?: Json | null
          email: string
          full_name?: string | null
          id: string
          marketing_opt_in?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_billing_address?: Json | null
          default_shipping_address?: Json | null
          email?: string
          full_name?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          amount: number
          balance: number
          code: string
          created_at: string | null
          delivered: boolean | null
          delivered_at: string | null
          delivery_date: string | null
          expires_at: string | null
          id: string
          is_for_self: boolean | null
          order_id: string | null
          personal_message: string | null
          purchaser_email: string
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          balance: number
          code: string
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          delivery_date?: string | null
          expires_at?: string | null
          id?: string
          is_for_self?: boolean | null
          order_id?: string | null
          personal_message?: string | null
          purchaser_email: string
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance?: number
          code?: string
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          delivery_date?: string | null
          expires_at?: string | null
          id?: string
          is_for_self?: boolean | null
          order_id?: string | null
          personal_message?: string | null
          purchaser_email?: string
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          products_updated: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          products_updated?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          products_updated?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      loyalty_members: {
        Row: {
          id: string
          joined_at: string | null
          lifetime_points: number | null
          points_balance: number | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          lifetime_points?: number | null
          points_balance?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          lifetime_points?: number | null
          points_balance?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_redemptions: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          member_id: string
          order_id: string | null
          points_spent: number
          reward_id: string
          status: string | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          member_id: string
          order_id?: string | null
          points_spent: number
          reward_id: string
          status?: string | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          member_id?: string
          order_id?: string | null
          points_spent?: number
          reward_id?: string
          status?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "loyalty_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          min_order_amount: number | null
          name: string
          points_required: number
          product_id: string | null
          reward_type: string
          reward_value: number | null
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_order_amount?: number | null
          name: string
          points_required: number
          product_id?: string | null
          reward_type: string
          reward_value?: number | null
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_order_amount?: number | null
          name?: string
          points_required?: number
          product_id?: string | null
          reward_type?: string
          reward_value?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          member_id: string
          order_id: string | null
          points: number
          type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          member_id: string
          order_id?: string | null
          points: number
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          member_id?: string
          order_id?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "loyalty_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons: Json | null
          created_at: string | null
          id: string
          is_subscription: boolean | null
          order_id: string | null
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          selected_flavors: Json | null
          size_name: string | null
          size_price: number | null
          total: number
        }
        Insert: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          is_subscription?: boolean | null
          order_id?: string | null
          product_id?: string | null
          product_name: string
          product_price: number
          quantity: number
          selected_flavors?: Json | null
          size_name?: string | null
          size_price?: number | null
          total: number
        }
        Update: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          is_subscription?: boolean | null
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          selected_flavors?: Json | null
          size_name?: string | null
          size_price?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          billing_address: Json | null
          created_at: string | null
          customer_name: string | null
          delivery_date: string | null
          delivery_time_window: string | null
          email: string
          fulfillment_type: string | null
          id: string
          notes: string | null
          order_number: string
          owner_acknowledged_at: string | null
          payment_id: string | null
          payment_status: string | null
          phone: string | null
          pickup_date: string | null
          pickup_time: string | null
          ready_notified_at: string | null
          shipping: number | null
          shipping_address: Json | null
          status: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          billing_address?: Json | null
          created_at?: string | null
          customer_name?: string | null
          delivery_time_window?: string | null
          email: string
          fulfillment_type?: string | null
          id?: string
          notes?: string | null
          order_number: string
          owner_acknowledged_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          ready_notified_at?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string | null
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          billing_address?: Json | null
          created_at?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          delivery_time_window?: string | null
          email?: string
          fulfillment_type?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          owner_acknowledged_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          ready_notified_at?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_addons: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_name: string
          id: string
          name: string
          price: number | null
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_name: string
          id?: string
          name: string
          price?: number | null
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_name?: string
          id?: string
          name?: string
          price?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      product_size_overrides: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          image_url: string | null
          is_subscription: boolean | null
          price: number
          product_id: string
          size_name: string
          size_oz: number | null
          sort_order: number | null
          subscription_interval: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_subscription?: boolean | null
          price: number
          product_id: string
          size_name: string
          size_oz?: number | null
          sort_order?: number | null
          subscription_interval?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_subscription?: boolean | null
          price?: number
          product_id?: string
          size_name?: string
          size_oz?: number | null
          sort_order?: number | null
          subscription_interval?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_size_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          price: number
          size_oz: number | null
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          price: number
          size_oz?: number | null
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          size_oz?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          images: string[] | null
          ingredients: string | null
          is_available: boolean | null
          is_featured: boolean | null
          last_synced_at: string | null
          low_stock_threshold: number | null
          name: string
          nutrition_info: Json | null
          price: number
          short_description: string | null
          sku: string | null
          slug: string
          sort_order: number | null
          square_catalog_id: string | null
          square_variation_id: string | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          ingredients?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          last_synced_at?: string | null
          low_stock_threshold?: number | null
          name: string
          nutrition_info?: Json | null
          price: number
          short_description?: string | null
          sku?: string | null
          slug: string
          sort_order?: number | null
          square_catalog_id?: string | null
          square_variation_id?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          ingredients?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          last_synced_at?: string | null
          low_stock_threshold?: number | null
          name?: string
          nutrition_info?: Json | null
          price?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          sort_order?: number | null
          square_catalog_id?: string | null
          square_variation_id?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          loyalty_points: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          loyalty_points?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      square_merchant_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          is_sandbox: boolean
          location_id: string | null
          merchant_id: string
          refresh_token: string
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean
          location_id?: string | null
          merchant_id: string
          refresh_token: string
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean
          location_id?: string | null
          merchant_id?: string
          refresh_token?: string
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      sales_monthly: {
        Row: {
          avg_order_value: number | null
          order_count: number | null
          period: string | null
          revenue: number | null
        }
        Relationships: []
      }
      sales_quarterly: {
        Row: {
          avg_order_value: number | null
          order_count: number | null
          period: string | null
          revenue: number | null
        }
        Relationships: []
      }
      sales_weekly: {
        Row: {
          avg_order_value: number | null
          order_count: number | null
          period: string | null
          revenue: number | null
        }
        Relationships: []
      }
      sales_yearly: {
        Row: {
          avg_order_value: number | null
          order_count: number | null
          period: string | null
          revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_gift_card_balance: {
        Args: { gift_card_code: string }
        Returns: {
          balance: number
          code: string
          expires_at: string
          id: string
          status: string
        }[]
      }
      cleanup_old_sync_logs: { Args: never; Returns: undefined }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_reward_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_loyalty_reward: {
        Args: { p_member_id: string; p_reward_id: string }
        Returns: {
          code: string
          message: string
          success: boolean
        }[]
      }
      trigger_inventory_sync: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
