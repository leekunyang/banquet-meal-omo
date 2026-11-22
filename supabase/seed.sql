-- Demo seed for local development (npx supabase db reset). Illustrative data
-- only; keep in sync with lib/data/seed.ts. Never run against production.

insert into public.locations (id, type, name) values
  ('wh-main', 'warehouse', '中央冷凍倉'),
  ('st-hall', 'store', '會館門市冷凍櫃');

insert into public.products (id, slug, name, category, description, price, servings, net_weight_g, ingredients, allergens, storage, shelf_life_days, heating, tone, status, is_active) values
  ('11111111-0000-4000-8000-000000000001', 'fo-tiao-qiang', '佛跳牆', '湯品', '干貝、鮑魚、豬腳與芋頭慢燉，宴席上最先被舀空的那一甕。', 1280, '4–6 人份', 1800,
   '{豬腳,芋頭,干貝,鮑魚,香菇,栗子,排骨,高湯}', '{甲殼類,軟體動物}', '冷凍 −18°C 以下保存', 365,
   '{"冷藏解凍 12 小時，或連袋放入冷水 1 小時","倒入鍋中，中火加熱至沸騰","轉小火續煮 10 分鐘即可上桌"}', '#8E3B2A', 'ready', true),
  ('11111111-0000-4000-8000-000000000002', 'hong-xun-mi-gao', '紅蟳米糕', '主食', '整隻紅蟳鋪在油飯上蒸透，米粒吸滿蟹膏香。', 880, '4 人份', 1200,
   '{糯米,紅蟳,香菇,蝦米,油蔥酥,醬油}', '{甲殼類,大豆}', '冷凍 −18°C 以下保存', 180,
   '{"不需解凍，連盤放入電鍋","外鍋加 2 杯水蒸至開關跳起","燜 5 分鐘後開蓋"}', '#A0522D', 'ready', true),
  ('11111111-0000-4000-8000-000000000003', 'dong-po-rou', '東坡肉', '主菜', '五花肉滷到筷子一夾就開，醬汁可以拌兩碗飯。', 520, '4 人份', 800,
   '{豬五花,醬油,冰糖,紹興酒,蔥,薑}', '{大豆,小麥}', '冷凍 −18°C 以下保存', 180,
   '{"冷藏解凍 8 小時","連汁倒入鍋中小火加熱 8 分鐘","翻面再加熱 3 分鐘"}', '#6E3A26', 'ready', true),
  ('11111111-0000-4000-8000-000000000004', 'yu-chi-geng', '魚翅羹', '湯品', '高湯勾芡、蟹肉與蛋花，宴席開場的那一碗。', 680, '4 人份', 1500,
   '{高湯,蟹肉,筍絲,香菇,蛋,太白粉}', '{甲殼類,蛋}', '冷凍 −18°C 以下保存', 180,
   '{"冷藏解凍 8 小時","倒入鍋中中火加熱並持續攪拌","沸騰後轉小火 3 分鐘"}', '#7A5230', 'ready', true),
  ('11111111-0000-4000-8000-000000000005', 'wu-liu-ju', '五柳枝', '主菜', '炸魚淋上五色蔬菜糖醋醬，宴席上的壓軸魚料理。', 760, '4 人份', null,
   '{鱸魚,紅蘿蔔,木耳,洋蔥,青椒,糖醋醬}', '{魚類}', '', null, '{}', '#9A4A2C', 'draft', false);

insert into public.inventory_lots (id, product_id, location_id, lot_no, expires_on, qty) values
  ('lot-1', '11111111-0000-4000-8000-000000000001', 'wh-main', 'FTQ-A01', current_date + 300, 10),
  ('lot-2', '11111111-0000-4000-8000-000000000001', 'wh-main', 'FTQ-A02', current_date + 200, 4),
  ('lot-3', '11111111-0000-4000-8000-000000000001', 'st-hall', 'FTQ-S01', current_date + 180, 4),
  ('lot-4', '11111111-0000-4000-8000-000000000002', 'wh-main', 'HXM-A01', current_date + 150, 9),
  ('lot-5', '11111111-0000-4000-8000-000000000002', 'st-hall', 'HXM-S01', current_date + 120, 3),
  ('lot-6', '11111111-0000-4000-8000-000000000003', 'wh-main', 'DPR-A01', current_date + 150, 1),
  ('lot-7', '11111111-0000-4000-8000-000000000003', 'st-hall', 'DPR-S01', current_date + 140, 1),
  ('lot-8', '11111111-0000-4000-8000-000000000004', 'wh-main', 'YCG-A01', current_date + 160, 12),
  ('lot-9', '11111111-0000-4000-8000-000000000004', 'st-hall', 'YCG-S01', current_date + 150, 3);

insert into public.events (id, venue, couple_name, event_date, discount_amount, valid_until, featured_slugs) values
  ('ajie-xiaowen', '[會館名稱]', '阿傑 & 小雯', current_date - 2, 100,
   ((current_date + 5)::timestamp + time '23:59:59') at time zone 'Asia/Taipei',
   '{fo-tiao-qiang,hong-xun-mi-gao,dong-po-rou,yu-chi-geng}'),
  ('zhihao-yijun', '[會館名稱]', '志豪 & 怡君', current_date - 30, 100,
   ((current_date - 23)::timestamp + time '23:59:59') at time zone 'Asia/Taipei',
   '{fo-tiao-qiang,yu-chi-geng}');

-- Demo accounts. supabase/config.toml maps these phones to the test OTP 123456.
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('22222222-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '886912345678', now(),
   '{"provider":"phone","providers":["phone"]}', '{"display_name":"陳小美"}', now(), now()),
  ('22222222-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '886922000111', now(),
   '{"provider":"phone","providers":["phone"]}', '{"display_name":"王姐"}', now(), now()),
  ('22222222-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '886933000222', now(),
   '{"provider":"phone","providers":["phone"]}', '{"display_name":"林經理"}', now(), now());

update public.members set role = 'staff' where phone = '0922000111';
update public.members set role = 'admin' where phone = '0933000222';
select public._add_points('22222222-0000-4000-8000-000000000001', 120, '門市消費累點', null);
