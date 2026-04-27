export type UserRole = "cliente" | "produttore" | "admin";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  company_description: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  display_order: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface Product {
  id: string;
  producer_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_per_kg: number;
  unit_type: string;
  quantity_available: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  profiles?: { full_name: string | null; company_name: string | null } | null;
  categories?: { name: string } | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_kg: number;
  subtotal: number;
  products?: { name: string } | null;
}

export interface Order {
  id: string;
  customer_id: string;
  pickup_point_id: string | null;
  status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_date: string | null;
  created_at: string;
  pickup_points?: { name: string } | null;
}
