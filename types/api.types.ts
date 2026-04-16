export type User = {
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  picture?: string;
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
  id: string;
  make: string;
  model: string;
  year: number;
  // Add other vehicle fields as necessary
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

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
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
