-- KM Zero — Schema MVP + Routing + CO2

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
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
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

-- Configurazione sistema (CO2, fee, etc.)
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Slot consegna
CREATE TABLE delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_point_id UUID REFERENCES pickup_points(id),
  delivery_date DATE NOT NULL,
  time_start TIME NOT NULL DEFAULT '08:00',
  time_end TIME NOT NULL DEFAULT '12:00',
  max_orders INT NOT NULL DEFAULT 20,
  current_orders INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pickup_point_id, delivery_date, time_start)
);

-- Ordini
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  pickup_point_id UUID REFERENCES pickup_points(id),
  status TEXT NOT NULL DEFAULT 'in_attesa',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  co2_kg DECIMAL(10,2),
  co2_cost DECIMAL(10,2),
  delivery_discount DECIMAL(10,2) DEFAULT 0,
  delivery_date DATE,
  delivery_slot_id UUID REFERENCES delivery_slots(id),
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

-- Waitlist
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  company_name TEXT,
  message TEXT,
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

INSERT INTO system_config (key, value, description) VALUES
  ('co2_kg_per_km', '0.15', 'Emissioni CO2 in kg per km percorso'),
  ('co2_cost_per_kg', '2.0', 'Costo EUR per kg di CO2'),
  ('delivery_base_fee', '3.0', 'Costo base consegna EUR'),
  ('delivery_fee_per_km', '0.50', 'Costo aggiuntivo per km oltre 5km');

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
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Admin manage config" ON system_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Public read config" ON system_config FOR SELECT USING (true);

CREATE POLICY "Public read active delivery slots" ON delivery_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage delivery slots" ON delivery_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Anyone insert waitlist" ON waitlist FOR INSERT WITH CHECK (true);
