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
