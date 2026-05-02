export type User = {
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  provider?: 'local' | 'google';
  role?: string;
  verification_status?: string;
  vendor_id?: number;
  provider_id?: number;
};

export type Category = {
  category_id: number;
  name: string;
  description?: string;
};

export type ServiceCategory = {
  service_category_id: number;
  name: string;
};

export type Product = {
  product_id: number;
  name: string;
  description?: string;
  price: string | number;
  stock?: number;
  category_id_fk?: number;
  category_name?: string;
  vendor_name?: string;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductFormInitialValues = {
  name?: string;
  description?: string;
  price?: string | number;
  stock?: string | number;
  categoryId?: number | null;
  imageUrls?: Array<string | null>;
};

export type ProductFormPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id_fk: number;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
};

export type Vehicle = {
  vehicle_id: number;
  user_id_fk: number;
  make: string;
  model: string;
  year: number;
  license_plate?: string | null;
  color?: string | null;
  photo_url?: string | null;
  engine_number?: string | null;
  vin?: string | null;
  created_at?: string;
};

export type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
};

export type Booking = {
  id: string;
  service: string;
  date: string;
  status: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaginationData = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationData;
};

export type VendorDashboardStats = {
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_orders: number;
  active_orders: number;
  revenue: string | number;
};

export type VendorDashboardOrder = {
  order_id: number;
  status: string;
  order_date: string;
  total_amount: string | number;
  customer_name: string;
  item_count: number;
};

export type VendorTopProduct = {
  product_id: number;
  name: string;
  price: string | number;
  stock: number;
  sold_units: number;
  image_url?: string | null;
};

export type VendorDashboardResponse = {
  stats: VendorDashboardStats;
  recent_orders: VendorDashboardOrder[];
  top_products: VendorTopProduct[];
};

export type VendorAnalyticsRange = 'weekly' | 'monthly' | 'yearly';

export type VendorAnalyticsMetric = {
  total: number;
  change_pct: number;
};

export type VendorAnalyticsTrendPoint = {
  label: string;
  value: number;
};

export type VendorAnalyticsTrend = {
  title: string;
  subtitle: string;
  summary_label: string;
  summary_value: number;
  points: VendorAnalyticsTrendPoint[];
};

export type VendorAnalyticsCategory = {
  category_id: number | null;
  name: string;
  revenue: number;
  percentage: number;
};

export type VendorAnalyticsTopProduct = {
  product_id: number;
  name: string;
  revenue: number;
  sold_units: number;
  change_pct: number;
};

export type VendorAnalyticsResponse = {
  range: VendorAnalyticsRange;
  revenue: VendorAnalyticsMetric;
  orders: VendorAnalyticsMetric;
  order_value: VendorAnalyticsMetric;
  trend: VendorAnalyticsTrend;
  categories: VendorAnalyticsCategory[];
  top_products: VendorAnalyticsTopProduct[];
};

export type VendorOrderItem = {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_each: string | number;
};

export type VendorOrder = {
  order_id: number;
  status: string;
  order_date: string;
  total_amount: string | number;
  preferred_delivery_date?: string | null;
  estimated_delivery_start?: string | null;
  estimated_delivery_end?: string | null;
  customer_name: string;
  customer_email: string;
  item_count: number;
  total_quantity: number;
  items: VendorOrderItem[];
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;

export type OrderAddressSummary = {
  address_id?: number | null;
  shipping_title?: string | null;
  shipping_street?: string | null;
  shipping_city?: string | null;
  shipping_apartment_floor?: string | null;
  shipping_building?: string | null;
  shipping_notes?: string | null;
  shipping_latitude?: number | null;
  shipping_longitude?: number | null;
};

export type OrderDetailItem = {
  order_item_id: number;
  product_id: number;
  quantity: number;
  price_each: string | number;
  product_name: string;
};

export type OrderDetail = {
  order_id: number;
  user_id_fk: number;
  shipping_address_fk: number | null;
  total_amount: string | number;
  status: OrderStatus;
  order_date: string;
  preferred_delivery_date?: string | null;
  estimated_delivery_start?: string | null;
  estimated_delivery_end?: string | null;
  items: OrderDetailItem[];
} & OrderAddressSummary;

// ─── Service (for provider management) ───────────────────────────────────────

export type Service = {
  service_id: number;
  name: string;
  description?: string;
  price: string | number;
  duration: number;
  is_active: boolean;
  status?: 'pending' | 'active' | 'rejected' | string;
  service_cat_id_fk?: number;
  category_name?: string;
  provider_id_fk?: number;
  provider_name?: string;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  location_type?: 'both' | 'mobile' | 'in-shop';
  available_times?: string[];
  created_at?: string;
};

export type ServiceFormPayload = {
  name: string;
  description: string;
  price: number;
  duration: number;
  service_cat_id_fk: number;
  is_active: boolean;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  location_type: 'both' | 'mobile' | 'in-shop';
  available_times: string[];
};

// ─── Provider Dashboard ───────────────────────────────────────────────────────

export type ProviderDashboardStats = {
  todays_bookings: number;
  total_customers: number;
  revenue: string | number;
  growth_pct: number;
};

export type ProviderAppointment = {
  booking_id: number;
  service_name: string;
  customer_name: string;
  booking_date: string;
  start_time: string;
  status: string;
  booking_price: string | number;
};

export type ProviderPopularService = {
  service_id: number;
  name: string;
  booking_count: number;
  revenue: string | number;
};

export type ProviderDashboardResponse = {
  stats: ProviderDashboardStats;
  todays_appointments: ProviderAppointment[];
  popular_services: ProviderPopularService[];
};

// ─── Provider Analytics ───────────────────────────────────────────────────────

export type ProviderAnalyticsRange = 'weekly' | 'monthly' | 'yearly';

export type ProviderAnalyticsMetric = {
  total: number;
  change_pct: number;
};

export type ProviderAnalyticsTrendPoint = {
  label: string;
  value: number;
};

export type ProviderAnalyticsTrend = {
  subtitle: string;
  points: ProviderAnalyticsTrendPoint[];
};

export type ProviderAnalyticsServiceRevenue = {
  name: string;
  revenue: number;
};

export type ProviderAnalyticsCustomerMix = {
  total: number;
  returning: number;
  new: number;
};

export type ProviderAnalyticsResponse = {
  range: ProviderAnalyticsRange;
  revenue: ProviderAnalyticsMetric;
  bookings: ProviderAnalyticsMetric;
  new_customers: ProviderAnalyticsMetric;
  trend: ProviderAnalyticsTrend;
  customer_mix: ProviderAnalyticsCustomerMix;
  service_revenue: ProviderAnalyticsServiceRevenue[];
};

// ─── Provider Bookings ────────────────────────────────────────────────────────

export type ProviderBookingStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | string;

export type ProviderBooking = {
  booking_id: number;
  status: ProviderBookingStatus;
  booking_date: string;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  booking_price: string | number;
  service_name: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_year?: number | null;
  model_name?: string | null;
  make_name?: string | null;
  street?: string | null;
  city?: string | null;
  building?: string | null;
  apartment_floor?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ProviderBookingDetail = ProviderBooking & {
  service_description?: string;
  service_duration?: number;
  notes?: string | null;
  address_title?: string | null;
};
