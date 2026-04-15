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
      addresses: {
        Row: {
          address_id: number
          city: string | null
          street: string | null
          title: string | null
          user_id_fk: number
        }
        Insert: {
          address_id?: number
          city?: string | null
          street?: string | null
          title?: string | null
          user_id_fk: number
        }
        Update: {
          address_id?: number
          city?: string | null
          street?: string | null
          title?: string | null
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admins: {
        Row: {
          admin_id: number
          created_at: string | null
          email: string
          name: string
          password: string | null
          permissions: string | null
          role: string
        }
        Insert: {
          admin_id?: number
          created_at?: string | null
          email: string
          name: string
          password?: string | null
          permissions?: string | null
          role?: string
        }
        Update: {
          admin_id?: number
          created_at?: string | null
          email?: string
          name?: string
          password?: string | null
          permissions?: string | null
          role?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_id: number
          booking_price: number | null
          end_time: string | null
          location: string | null
          provider_id_fk: number | null
          service_id_fk: number
          start_time: string | null
          status: string | null
          user_id_fk: number
          vehicle_id_fk: number | null
        }
        Insert: {
          booking_date: string
          booking_id?: number
          booking_price?: number | null
          end_time?: string | null
          location?: string | null
          provider_id_fk?: number | null
          service_id_fk: number
          start_time?: string | null
          status?: string | null
          user_id_fk: number
          vehicle_id_fk?: number | null
        }
        Update: {
          booking_date?: string
          booking_id?: number
          booking_price?: number | null
          end_time?: string | null
          location?: string | null
          provider_id_fk?: number | null
          service_id_fk?: number
          start_time?: string | null
          status?: string | null
          user_id_fk?: number
          vehicle_id_fk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fk_fkey"
            columns: ["provider_id_fk"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fk_fkey"
            columns: ["service_id_fk"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "bookings_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fk_fkey"
            columns: ["vehicle_id_fk"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["vehicle_id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id_fk: number
          cart_item_id: number
          product_id_fk: number
          quantity: number
        }
        Insert: {
          cart_id_fk: number
          cart_item_id?: number
          product_id_fk: number
          quantity?: number
        }
        Update: {
          cart_id_fk?: number
          cart_item_id?: number
          product_id_fk?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fk_fkey"
            columns: ["cart_id_fk"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["cart_id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fk_fkey"
            columns: ["product_id_fk"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      carts: {
        Row: {
          cart_id: number
          created_at: string | null
          user_id_fk: number
        }
        Insert: {
          cart_id?: number
          created_at?: string | null
          user_id_fk: number
        }
        Update: {
          cart_id?: number
          created_at?: string | null
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deliveries: {
        Row: {
          delivery_id: number
          driver_id_fk: number | null
          estimated_time: string | null
          order_id_fk: number
          status: string | null
          tracking_number: string | null
        }
        Insert: {
          delivery_id?: number
          driver_id_fk?: number | null
          estimated_time?: string | null
          order_id_fk: number
          status?: string | null
          tracking_number?: string | null
        }
        Update: {
          delivery_id?: number
          driver_id_fk?: number | null
          estimated_time?: string | null
          order_id_fk?: number
          status?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fk_fkey"
            columns: ["driver_id_fk"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fk_fkey"
            columns: ["order_id_fk"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          delivery_id_fk: number
          location_detail: string | null
          status_update: string | null
          tracking_id: number
          updated_at: string | null
        }
        Insert: {
          delivery_id_fk: number
          location_detail?: string | null
          status_update?: string | null
          tracking_id?: number
          updated_at?: string | null
        }
        Update: {
          delivery_id_fk?: number
          location_detail?: string | null
          status_update?: string | null
          tracking_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_delivery_id_fk_fkey"
            columns: ["delivery_id_fk"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["delivery_id"]
          },
        ]
      }
      drivers: {
        Row: {
          driver_id: number
          email: string | null
          license_number: string | null
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          driver_id?: number
          email?: string | null
          license_number?: string | null
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          driver_id?: number
          email?: string | null
          license_number?: string | null
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      makes: {
        Row: {
          make_id: number
          name: string
        }
        Insert: {
          make_id?: number
          name: string
        }
        Update: {
          make_id?: number
          name?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          make_id_fk: number
          model_id: number
          name: string
          year: number | null
        }
        Insert: {
          make_id_fk: number
          model_id?: number
          name: string
          year?: number | null
        }
        Update: {
          make_id_fk?: number
          model_id?: number
          name?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "models_make_id_fk_fkey"
            columns: ["make_id_fk"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["make_id"]
          },
        ]
      }
      order_items: {
        Row: {
          order_id_fk: number
          order_item_id: number
          price_each: number
          product_id_fk: number
          quantity: number
        }
        Insert: {
          order_id_fk: number
          order_item_id?: number
          price_each: number
          product_id_fk: number
          quantity: number
        }
        Update: {
          order_id_fk?: number
          order_item_id?: number
          price_each?: number
          product_id_fk?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fk_fkey"
            columns: ["order_id_fk"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fk_fkey"
            columns: ["product_id_fk"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      orders: {
        Row: {
          order_date: string | null
          order_id: number
          shipping_address_fk: number | null
          status: string | null
          total_amount: number | null
          user_id_fk: number
        }
        Insert: {
          order_date?: string | null
          order_id?: number
          shipping_address_fk?: number | null
          status?: string | null
          total_amount?: number | null
          user_id_fk: number
        }
        Update: {
          order_date?: string | null
          order_id?: number
          shipping_address_fk?: number | null
          status?: string | null
          total_amount?: number | null
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_address_fk_fkey"
            columns: ["shipping_address_fk"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["address_id"]
          },
          {
            foreignKeyName: "orders_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id_fk: number | null
          created_at: string | null
          method: string | null
          order_id_fk: number | null
          payment_id: number
          status: string | null
          user_id_fk: number
        }
        Insert: {
          amount: number
          booking_id_fk?: number | null
          created_at?: string | null
          method?: string | null
          order_id_fk?: number | null
          payment_id?: number
          status?: string | null
          user_id_fk: number
        }
        Update: {
          amount?: number
          booking_id_fk?: number | null
          created_at?: string | null
          method?: string | null
          order_id_fk?: number | null
          payment_id?: number
          status?: string | null
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fk_fkey"
            columns: ["booking_id_fk"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_order_id_fk_fkey"
            columns: ["order_id_fk"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: number
          description: string | null
          name: string
        }
        Insert: {
          category_id?: number
          description?: string | null
          name: string
        }
        Update: {
          category_id?: number
          description?: string | null
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id_fk: number | null
          description: string | null
          image_url: string | null
          image_url_2: string | null
          image_url_3: string | null
          name: string
          price: number
          product_id: number
          stock: number | null
          vendor_id_fk: number | null
        }
        Insert: {
          category_id_fk?: number | null
          description?: string | null
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          name: string
          price: number
          product_id?: number
          stock?: number | null
          vendor_id_fk?: number | null
        }
        Update: {
          category_id_fk?: number | null
          description?: string | null
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          name?: string
          price?: number
          product_id?: number
          stock?: number | null
          vendor_id_fk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fk_fkey"
            columns: ["category_id_fk"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_vendor_id_fk_fkey"
            columns: ["vendor_id_fk"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          rating: number | null
          review_id: number
          user_id_fk: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          rating?: number | null
          review_id?: number
          user_id_fk: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          rating?: number | null
          review_id?: number
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_categories: {
        Row: {
          name: string
          service_category_id: number
        }
        Insert: {
          name: string
          service_category_id?: number
        }
        Update: {
          name?: string
          service_category_id?: number
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          contact_info: string | null
          document_1_url: string | null
          document_2_url: string | null
          document_3_url: string | null
          name: string
          provider_id: number
          user_id_fk: number | null
          verification_status: string | null
        }
        Insert: {
          contact_info?: string | null
          document_1_url?: string | null
          document_2_url?: string | null
          document_3_url?: string | null
          name: string
          provider_id?: number
          user_id_fk?: number | null
          verification_status?: string | null
        }
        Update: {
          contact_info?: string | null
          document_1_url?: string | null
          document_2_url?: string | null
          document_3_url?: string | null
          name?: string
          provider_id?: number
          user_id_fk?: number | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      services: {
        Row: {
          description: string | null
          duration: number | null
          image_url: string | null
          name: string
          price: number | null
          provider_id_fk: number | null
          service_cat_id_fk: number | null
          service_id: number
        }
        Insert: {
          description?: string | null
          duration?: number | null
          image_url?: string | null
          name: string
          price?: number | null
          provider_id_fk?: number | null
          service_cat_id_fk?: number | null
          service_id?: number
        }
        Update: {
          description?: string | null
          duration?: number | null
          image_url?: string | null
          name?: string
          price?: number | null
          provider_id_fk?: number | null
          service_cat_id_fk?: number | null
          service_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fk_fkey"
            columns: ["provider_id_fk"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "services_service_cat_id_fk_fkey"
            columns: ["service_cat_id_fk"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["service_category_id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_id_fk: number | null
          created_at: string | null
          description: string | null
          status: string | null
          subject: string | null
          ticket_id: number
          user_id_fk: number
        }
        Insert: {
          admin_id_fk?: number | null
          created_at?: string | null
          description?: string | null
          status?: string | null
          subject?: string | null
          ticket_id?: number
          user_id_fk: number
        }
        Update: {
          admin_id_fk?: number | null
          created_at?: string | null
          description?: string | null
          status?: string | null
          subject?: string | null
          ticket_id?: number
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_admin_id_fk_fkey"
            columns: ["admin_id_fk"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          name: string
          otp: string | null
          otp_expires_at: string | null
          password: string
          phone: string | null
          role: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          email: string
          name: string
          otp?: string | null
          otp_expires_at?: string | null
          password: string
          phone?: string | null
          role?: string | null
          user_id?: number
        }
        Update: {
          created_at?: string | null
          email?: string
          name?: string
          otp?: string | null
          otp_expires_at?: string | null
          password?: string
          phone?: string | null
          role?: string | null
          user_id?: number
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          model_id_fk: number
          nickname: string | null
          photo_url: string | null
          user_id_fk: number
          vehicle_id: number
          year: number | null
        }
        Insert: {
          color?: string | null
          model_id_fk: number
          nickname?: string | null
          photo_url?: string | null
          user_id_fk: number
          vehicle_id?: number
          year?: number | null
        }
        Update: {
          color?: string | null
          model_id_fk?: number
          nickname?: string | null
          photo_url?: string | null
          user_id_fk?: number
          vehicle_id?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_model_id_fk_fkey"
            columns: ["model_id_fk"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "vehicles_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_info: string | null
          document_1_url: string | null
          document_2_url: string | null
          document_3_url: string | null
          name: string
          user_id_fk: number | null
          vendor_id: number
          verification_status: string | null
        }
        Insert: {
          contact_info?: string | null
          document_1_url?: string | null
          document_2_url?: string | null
          document_3_url?: string | null
          name: string
          user_id_fk?: number | null
          vendor_id?: number
          verification_status?: string | null
        }
        Update: {
          contact_info?: string | null
          document_1_url?: string | null
          document_2_url?: string | null
          document_3_url?: string | null
          name?: string
          user_id_fk?: number | null
          vendor_id?: number
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fk_fkey"
            columns: ["user_id_fk"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
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

