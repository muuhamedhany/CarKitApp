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
