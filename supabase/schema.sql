-- KM Zero — Schema MVP

-- Enum ruoli
CREATE TYPE user_role AS ENUM ('cliente', 'produttore', 'admin');

-- Categorie prodotti
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Punti di ritiro
CREATE TABLE pickup_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profili utenti (estende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'cliente',
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  company_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prodotti
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price_per_kg DECIMAL(10,2) NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'kg',
  quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ordini
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  pickup_point_id UUID REFERENCES pickup_points(id),
  status TEXT NOT NULL DEFAULT 'in_attesa',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Item ordine
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dati demo
INSERT INTO categories (name, icon, display_order) VALUES
  ('Frutta', 'apple', 1),
  ('Verdura', 'carrot', 2),
  ('Formaggio', 'cheese', 3),
  ('Carne', 'beef', 4),
  ('Uova', 'egg', 5),
  ('Miele', 'honey', 6),
  ('Conserve', 'jar', 7),
  ('Prodotti da forno', 'bread', 8);

INSERT INTO pickup_points (name, address, lat, lng) VALUES
  ('Mercato Rionale Parma Centro', 'Via Garibaldi 15, Parma', 44.8015, 10.3280),
  ('Sede Cooperativa Il Noce', 'Strada della Repubblica 42, Collecchio', 44.7520, 10.2150),
  ('Parcheggio Centro Sportivo', 'Via delle Acacie 8, Montechiarugolo', 44.6950, 10.4150);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read pickup points" ON pickup_points FOR SELECT USING (is_active = true);

CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Producer CRUD own products" ON products FOR ALL USING (producer_id = auth.uid());
CREATE POLICY "Admin read all products" ON products FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Customer read own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admin read all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Customer insert own orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Related read order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.customer_id = auth.uid())
  OR EXISTS (SELECT 1 FROM products p WHERE p.id = order_items.product_id AND p.producer_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);
CREATE POLICY "Customer insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.customer_id = auth.uid())
);
