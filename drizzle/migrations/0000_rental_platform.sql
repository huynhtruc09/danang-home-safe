
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('landlord', 'tenant');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own roles delete" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'tro',
  deal text NOT NULL DEFAULT 'rent',
  price bigint NOT NULL,
  area_m2 numeric NOT NULL DEFAULT 20,
  district text NOT NULL,
  address text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  panorama_url text,
  notes text,
  electricity_price int NOT NULL DEFAULT 3500,
  water_price int NOT NULL DEFAULT 100000,
  internet_price int NOT NULL DEFAULT 100000,
  parking_price int NOT NULL DEFAULT 0,
  contact_phone text,
  status text NOT NULL DEFAULT 'available',
  rented_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings public read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "landlord insert" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(),'landlord'));
CREATE POLICY "owner update" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner delete" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.book_listing(_listing_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.listings SET status = 'rented', rented_by = auth.uid()
   WHERE id = _listing_id AND status = 'available' AND (owner_id IS NULL OR owner_id <> auth.uid());
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;
REVOKE EXECUTE ON FUNCTION public.book_listing(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.book_listing(uuid) TO authenticated;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL DEFAULT 'Người thuê',
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews delete own" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart own" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages read own" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages send" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.roommate_profiles (
  user_id uuid PRIMARY KEY,
  display_name text NOT NULL,
  gender text NOT NULL DEFAULT 'khac',
  age int NOT NULL DEFAULT 22,
  budget bigint NOT NULL DEFAULT 2000000,
  district text NOT NULL,
  occupation text NOT NULL DEFAULT 'sinh_vien',
  sleep text NOT NULL DEFAULT 'binh_thuong',
  clean int NOT NULL DEFAULT 3,
  smoking boolean NOT NULL DEFAULT false,
  pets boolean NOT NULL DEFAULT false,
  bio text NOT NULL DEFAULT '',
  contact text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.roommate_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roommate_profiles TO authenticated;
GRANT ALL ON public.roommate_profiles TO service_role;
ALTER TABLE public.roommate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roommates read" ON public.roommate_profiles FOR SELECT USING (true);
CREATE POLICY "roommates own write" ON public.roommate_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listing images read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "listing images upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.listings (title, description, kind, deal, price, area_m2, district, address, lat, lng, images, panorama_url, notes, electricity_price, water_price, internet_price, parking_price, contact_phone, status) VALUES
('Phòng trọ mới gần ĐH Bách Khoa', 'Phòng sạch sẽ, có gác lửng, cửa sổ thoáng, giờ giấc tự do.', 'tro', 'rent', 2200000, 22, 'Liên Chiểu', 'Kiệt 54 Nguyễn Lương Bằng, Hòa Khánh Bắc', 16.0738, 108.1499, ARRAY['/images/room-1.jpg'], '/images/pano-1.jpg', 'Đặt cọc 1 tháng. Không nuôi thú cưng.', 3500, 100000, 100000, 50000, '0905 000 111', 'available'),
('Phòng trọ khép kín Hòa Minh', 'Có máy lạnh, nóng lạnh, kệ bếp riêng.', 'tro', 'rent', 1800000, 18, 'Liên Chiểu', 'Kiệt 120 Tôn Đức Thắng, Hòa Minh', 16.0612, 108.1702, ARRAY['/images/room-2.jpg'], '/images/pano-1.jpg', 'Khu vực trũng, mùa mưa nên kê đồ lên cao.', 3800, 80000, 100000, 0, '0905 000 222', 'available'),
('Phòng trọ kiệt Thanh Khê Tây', 'Giá rẻ, gần chợ Thanh Khê.', 'tro', 'rent', 1500000, 16, 'Thanh Khê', 'Kiệt 31 Hà Huy Tập, Thanh Khê Tây', 16.0660, 108.1885, ARRAY['/images/room-2.jpg'], NULL, 'Đặt cọc 500.000đ.', 3500, 70000, 80000, 0, '0905 000 333', 'rented'),
('Căn hộ studio view biển Mỹ Khê', 'Full nội thất, ban công nhìn ra biển, có hồ bơi.', 'chung_cu', 'rent', 7500000, 40, 'Sơn Trà', '45 Võ Nguyên Giáp, Phước Mỹ', 16.0640, 108.2455, ARRAY['/images/apt-1.jpg'], '/images/pano-1.jpg', 'Hợp đồng tối thiểu 6 tháng.', 3500, 100000, 0, 150000, '0905 000 444', 'available'),
('Chung cư 2PN trung tâm Hải Châu', 'Gần cầu Rồng, tiện ích đầy đủ, bảo vệ 24/7.', 'chung_cu', 'rent', 11000000, 68, 'Hải Châu', '02 Trần Phú, Thạch Thang', 16.0750, 108.2240, ARRAY['/images/apt-1.jpg'], '/images/pano-1.jpg', 'Phí quản lý 8.000đ/m².', 3500, 120000, 0, 200000, '0905 000 555', 'available'),
('Nhà nguyên căn 3 tầng Ngũ Hành Sơn', 'Nhà mới, 3 phòng ngủ, sân để ô tô.', 'nha', 'rent', 14000000, 90, 'Ngũ Hành Sơn', '18 An Thượng 2, Mỹ An', 16.0480, 108.2440, ARRAY['/images/house-1.jpg'], NULL, 'Cọc 2 tháng, thanh toán theo quý.', 3500, 150000, 0, 0, '0905 000 666', 'available'),
('Nhà phố bán khu Hòa Xuân', 'Nhà 2 tầng sổ hồng chính chủ, đường 7m5.', 'nha', 'sale', 4900000000, 100, 'Cẩm Lệ', 'Đường Nguyễn Phước Lan, Hòa Xuân', 16.0010, 108.2190, ARRAY['/images/house-1.jpg'], NULL, 'Khu vực ven sông, kiểm tra cao độ nền.', 0, 0, 0, 0, '0905 000 777', 'available'),
('Căn hộ bán view sông Hàn', 'Căn 1PN view sông Hàn, bàn giao full nội thất.', 'chung_cu', 'sale', 2650000000, 52, 'Sơn Trà', 'Trần Hưng Đạo, An Hải Tây', 16.0705, 108.2310, ARRAY['/images/apt-1.jpg'], '/images/pano-1.jpg', 'Đã có sổ hồng.', 0, 0, 0, 0, '0905 000 888', 'rented'),
('Phòng trọ gần ĐH Kinh Tế', 'Phòng có ban công, wifi mạnh, khu yên tĩnh.', 'tro', 'rent', 2500000, 25, 'Ngũ Hành Sơn', 'Kiệt 12 Lê Văn Hiến, Khuê Mỹ', 16.0365, 108.2405, ARRAY['/images/room-1.jpg'], NULL, 'Ưu tiên sinh viên nữ.', 3500, 100000, 100000, 50000, '0905 000 999', 'available'),
('Phòng trọ Hòa Khánh Nam giá sinh viên', 'Gần KCN Hòa Khánh, có chỗ phơi đồ.', 'tro', 'rent', 1300000, 15, 'Liên Chiểu', 'Kiệt 88 Âu Cơ, Hòa Khánh Nam', 16.0580, 108.1550, ARRAY['/images/room-2.jpg'], NULL, 'Kiệt thấp, dễ ngập khi mưa lớn.', 3500, 60000, 80000, 0, '0905 000 101', 'available');

INSERT INTO public.reviews (listing_id, author_name, rating, comment)
SELECT id, 'Minh Anh', 5, 'Chủ nhà thân thiện, phòng đúng như hình.' FROM public.listings WHERE title = 'Phòng trọ mới gần ĐH Bách Khoa';
INSERT INTO public.reviews (listing_id, author_name, rating, comment)
SELECT id, 'Quốc Huy', 3, 'Phòng ổn nhưng mùa mưa năm 2022 nước vào tới gối.' FROM public.listings WHERE title = 'Phòng trọ khép kín Hòa Minh';
INSERT INTO public.reviews (listing_id, author_name, rating, comment)
SELECT id, 'Thu Trang', 5, 'View đẹp, an ninh tốt.' FROM public.listings WHERE title = 'Căn hộ studio view biển Mỹ Khê';
INSERT INTO public.reviews (listing_id, author_name, rating, comment)
SELECT id, 'Hoàng Nam', 4, 'Trung tâm, đi lại tiện, hơi ồn buổi tối.' FROM public.listings WHERE title = 'Chung cư 2PN trung tâm Hải Châu';

INSERT INTO public.roommate_profiles (user_id, display_name, gender, age, budget, district, occupation, sleep, clean, smoking, pets, bio, contact) VALUES
(gen_random_uuid(), 'Lan Phương', 'nu', 21, 1500000, 'Liên Chiểu', 'sinh_vien', 'som', 5, false, false, 'SV năm 3 Bách Khoa, thích nấu ăn, gọn gàng.', 'Zalo 0905 111 222'),
(gen_random_uuid(), 'Đức Thịnh', 'nam', 24, 2500000, 'Hải Châu', 'di_lam', 'binh_thuong', 4, false, true, 'Dev IT, làm hybrid, có nuôi 1 bé mèo.', 'Zalo 0905 333 444'),
(gen_random_uuid(), 'Bảo Ngọc', 'nu', 23, 3000000, 'Sơn Trà', 'di_lam', 'muon', 3, false, false, 'Làm khách sạn ca tối, thích biển.', 'Zalo 0905 555 666'),
(gen_random_uuid(), 'Văn Khoa', 'nam', 20, 1200000, 'Ngũ Hành Sơn', 'sinh_vien', 'muon', 3, true, false, 'SV Kinh Tế, hay chơi thể thao.', 'Zalo 0905 777 888');
