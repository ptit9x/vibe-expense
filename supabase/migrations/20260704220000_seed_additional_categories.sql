-- ============================================================
-- Seed additional system categories (expense + income)
-- Adds new parent categories and subcategories.
-- Idempotent: uses ON CONFLICT / WHERE NOT EXISTS checks.
-- All new categories are system (user_id = NULL, is_system = true).
-- ============================================================

DO $$
DECLARE
  -- Existing parent IDs (looked up by slug)
  v_an_uong   UUID;
  v_di_lai    UUID;
  v_suc_khoe  UUID;
  v_huong_thu UUID;
  v_luong     UUID;
  -- New parent IDs
  v_pet       UUID := gen_random_uuid();
  v_sport     UUID := gen_random_uuid();
  v_insurance UUID := gen_random_uuid();
  v_tax       UUID := gen_random_uuid();
  v_tech      UUID := gen_random_uuid();
  v_rental    UUID := gen_random_uuid();
  v_pension   UUID := gen_random_uuid();
BEGIN
  -- Resolve existing parents by slug
  SELECT id INTO v_an_uong   FROM public.categories WHERE slug = 'food'          AND is_system = true;
  SELECT id INTO v_di_lai    FROM public.categories WHERE slug = 'transport'     AND is_system = true;
  SELECT id INTO v_suc_khoe  FROM public.categories WHERE slug = 'health'        AND is_system = true;
  SELECT id INTO v_huong_thu FROM public.categories WHERE slug = 'entertainment' AND is_system = true;
  SELECT id INTO v_luong     FROM public.categories WHERE slug = 'salary'        AND is_system = true;

  -- ============================================================
  -- 1. NEW PARENT CATEGORIES
  -- ============================================================

  -- 🐕 Thú cưng (expense)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_pet, NULL, '🐕 Thú cưng', 'expense', '🐕', '#D4A574', true, 'categories.pets', 'pets')
  ON CONFLICT DO NOTHING;

  -- ⚽ Thể thao & Fitness (expense)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_sport, NULL, '⚽ Thể thao & Fitness', 'expense', '⚽', '#22C55E', true, 'categories.sports', 'sports')
  ON CONFLICT DO NOTHING;

  -- 🛡️ Bảo hiểm (expense)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_insurance, NULL, '🛡️ Bảo hiểm', 'expense', '🛡️', '#1E40AF', true, 'categories.insurance', 'insurance')
  ON CONFLICT DO NOTHING;

  -- 🧾 Thuế & Phí (expense)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_tax, NULL, '🧾 Thuế & Phí', 'expense', '🧾', '#78716C', true, 'categories.taxes', 'taxes')
  ON CONFLICT DO NOTHING;

  -- 💻 Công nghệ (expense)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_tech, NULL, '💻 Công nghệ', 'expense', '💻', '#0EA5E9', true, 'categories.technology', 'technology')
  ON CONFLICT DO NOTHING;

  -- 🏘️ Cho thuê (income)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_rental, NULL, '🏘️ Cho thuê', 'income', '🏘️', '#8B5CF6', true, 'categories.rental', 'rental')
  ON CONFLICT DO NOTHING;

  -- 👴 Hưu trí & Trợ cấp (income)
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key, slug)
  VALUES (v_pension, NULL, '👴 Hưu trí & Trợ cấp', 'income', '👴', '#F59E0B', true, 'categories.pension', 'pension')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 2. SUBCATEGORIES — NEW PARENTS
  -- ============================================================

  -- 🐕 Thú cưng
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Thức ăn thú cưng', 'expense', '🍖', '#D4A574', v_pet, true, 'categories.petFood'),
    (NULL, 'Khám thú y', 'expense', '🏥', '#D4A574', v_pet, true, 'categories.petVet'),
    (NULL, 'Phụ kiện thú cưng', 'expense', '🎾', '#D4A574', v_pet, true, 'categories.petAccessories'),
    (NULL, 'Tắm tỉa lông', 'expense', '🛁', '#D4A574', v_pet, true, 'categories.petGrooming')
  ON CONFLICT DO NOTHING;

  -- ⚽ Thể thao & Fitness
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Gym/Yoga', 'expense', '🏋️', '#22C55E', v_sport, true, 'categories.gym'),
    (NULL, 'Đồ thể thao', 'expense', '🎽', '#22C55E', v_sport, true, 'categories.sportsGear'),
    (NULL, 'Thuê sân', 'expense', '🏟️', '#22C55E', v_sport, true, 'categories.courtRental'),
    (NULL, 'Bơi lội', 'expense', '🏊', '#22C55E', v_sport, true, 'categories.swimming')
  ON CONFLICT DO NOTHING;

  -- 🛡️ Bảo hiểm
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Bảo hiểm xe', 'expense', '🚗', '#1E40AF', v_insurance, true, 'categories.insuranceVehicle'),
    (NULL, 'Bảo hiểm nhà', 'expense', '🏠', '#1E40AF', v_insurance, true, 'categories.insuranceHome'),
    (NULL, 'Bảo hiểm nhân thọ', 'expense', '🧑', '#1E40AF', v_insurance, true, 'categories.insuranceLife'),
    (NULL, 'Bảo hiểm du lịch', 'expense', '✈️', '#1E40AF', v_insurance, true, 'categories.insuranceTravel')
  ON CONFLICT DO NOTHING;

  -- 🧾 Thuế & Phí
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Thuế thu nhập', 'expense', '💰', '#78716C', v_tax, true, 'categories.incomeTax'),
    (NULL, 'Phí đường bộ', 'expense', '🛣️', '#78716C', v_tax, true, 'categories.roadFee'),
    (NULL, 'Phạt vi phạm', 'expense', '🚨', '#78716C', v_tax, true, 'categories.fines'),
    (NULL, 'Phí giấy phép', 'expense', '📋', '#78716C', v_tax, true, 'categories.licenseFee')
  ON CONFLICT DO NOTHING;

  -- 💻 Công nghệ
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Điện thoại', 'expense', '📱', '#0EA5E9', v_tech, true, 'categories.techPhone'),
    (NULL, 'Laptop/Máy tính', 'expense', '💻', '#0EA5E9', v_tech, true, 'categories.techLaptop'),
    (NULL, 'Phụ kiện công nghệ', 'expense', '🔌', '#0EA5E9', v_tech, true, 'categories.techAccessories'),
    (NULL, 'Sửa chữa điện tử', 'expense', '🔧', '#0EA5E9', v_tech, true, 'categories.techRepair')
  ON CONFLICT DO NOTHING;

  -- 🏘️ Cho thuê (income)
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Cho thuê nhà', 'income', '🏠', '#8B5CF6', v_rental, true, 'categories.rentalHouse'),
    (NULL, 'Cho thuê xe', 'income', '🚗', '#8B5CF6', v_rental, true, 'categories.rentalVehicle'),
    (NULL, 'Cho thuê đồ', 'income', '📦', '#8B5CF6', v_rental, true, 'categories.rentalItems')
  ON CONFLICT DO NOTHING;

  -- 👴 Hưu trí & Trợ cấp (income)
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
  VALUES
    (NULL, 'Lương hưu', 'income', '🏦', '#F59E0B', v_pension, true, 'categories.pensionPay'),
    (NULL, 'Trợ cấp gia đình', 'income', '👨‍👩‍👧', '#F59E0B', v_pension, true, 'categories.familyAllowance'),
    (NULL, 'Trợ cấp xã hội', 'income', '🤝', '#F59E0B', v_pension, true, 'categories.socialWelfare')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 3. SUBCATEGORIES — EXISTING PARENTS (bổ sung)
  -- ============================================================

  -- 🍔 Ăn uống: sáng / trưa / tối + delivery + ăn vặt
  IF v_an_uong IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
    VALUES
      (NULL, 'Ăn sáng', 'expense', '🌅', '#EF4444', v_an_uong, true, 'categories.breakfast'),
      (NULL, 'Ăn trưa', 'expense', '☀️', '#EF4444', v_an_uong, true, 'categories.lunch'),
      (NULL, 'Ăn tối', 'expense', '🌙', '#EF4444', v_an_uong, true, 'categories.dinner'),
      (NULL, 'Đồ uống (trà sữa)', 'expense', '🧋', '#EF4444', v_an_uong, true, 'categories.drinks'),
      (NULL, 'Đặt đồ online', 'expense', '🛵', '#EF4444', v_an_uong, true, 'categories.foodDelivery'),
      (NULL, 'Ăn vặt', 'expense', '🍿', '#EF4444', v_an_uong, true, 'categories.snacks')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🚗 Đi lại: rửa xe, phạt GP, BH xe
  IF v_di_lai IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
    VALUES
      (NULL, 'Rửa xe', 'expense', '🧽', '#3B82F6', v_di_lai, true, 'categories.carWash'),
      (NULL, 'Phạt vi phạm giao thông', 'expense', '🚨', '#3B82F6', v_di_lai, true, 'categories.trafficFines'),
      (NULL, 'Bảo hiểm xe', 'expense', '🛡️', '#3B82F6', v_di_lai, true, 'categories.carInsurance')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 💊 Sức khỏe: nha khoa, mắt kính, khám tổng quát
  IF v_suc_khoe IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
    VALUES
      (NULL, 'Nha khoa', 'expense', '🦷', '#10B981', v_suc_khoe, true, 'categories.dental'),
      (NULL, 'Mắt kính', 'expense', '👓', '#10B981', v_suc_khoe, true, 'categories.eyecare'),
      (NULL, 'Khám tổng quát', 'expense', '🩺', '#10B981', v_suc_khoe, true, 'categories.checkup')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🎮 Hưởng thụ: karaoke, subscription
  IF v_huong_thu IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
    VALUES
      (NULL, 'Karaoke', 'expense', '🎤', '#8B5CF6', v_huong_thu, true, 'categories.karaoke'),
      (NULL, 'Đăng ký dịch vụ (Netflix/Spotify)', 'expense', '📺', '#8B5CF6', v_huong_thu, true, 'categories.subscription')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 💵 Lương (income): lương ngày, thù lao
  IF v_luong IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key)
    VALUES
      (NULL, 'Lương ngày', 'income', '📅', '#10B981', v_luong, true, 'categories.dailyWage'),
      (NULL, 'Thù lao', 'income', '🤝', '#10B981', v_luong, true, 'categories.fee')
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
