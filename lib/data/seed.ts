// Demo data — illustrative only. Dishes, prices and labels must be replaced
// with the venue's real records (see the dish-to-product skill). Keep this in
// sync with supabase/seed.sql.
import type { BanquetEvent, InventoryLot, Location, Member, Product } from '@/types/domain';
import { defaultValidUntil } from '@/lib/events/rules';

export const WAREHOUSE_ID = 'wh-main';
export const STORE_ID = 'st-hall';

export const SEED_LOCATIONS: Location[] = [
  { id: WAREHOUSE_ID, type: 'warehouse', name: '中央冷凍倉' },
  { id: STORE_ID, type: 'store', name: '會館門市冷凍櫃' },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: '11111111-0000-4000-8000-000000000001',
    slug: 'fo-tiao-qiang',
    name: '佛跳牆',
    category: '湯品',
    description: '干貝、鮑魚、豬腳與芋頭慢燉，宴席上最先被舀空的那一甕。',
    price: 1280,
    servings: '4–6 人份',
    netWeightG: 1800,
    ingredients: ['豬腳', '芋頭', '干貝', '鮑魚', '香菇', '栗子', '排骨', '高湯'],
    allergens: ['甲殼類', '軟體動物'],
    storage: '冷凍 −18°C 以下保存',
    shelfLifeDays: 365,
    heating: ['冷藏解凍 12 小時，或連袋放入冷水 1 小時', '倒入鍋中，中火加熱至沸騰', '轉小火續煮 10 分鐘即可上桌'],
    tone: '#8E3B2A',
    imageUrl: null,
    status: 'ready',
    isActive: true,
  },
  {
    id: '11111111-0000-4000-8000-000000000002',
    slug: 'hong-xun-mi-gao',
    name: '紅蟳米糕',
    category: '主食',
    description: '整隻紅蟳鋪在油飯上蒸透，米粒吸滿蟹膏香。',
    price: 880,
    servings: '4 人份',
    netWeightG: 1200,
    ingredients: ['糯米', '紅蟳', '香菇', '蝦米', '油蔥酥', '醬油'],
    allergens: ['甲殼類', '大豆'],
    storage: '冷凍 −18°C 以下保存',
    shelfLifeDays: 180,
    heating: ['不需解凍，連盤放入電鍋', '外鍋加 2 杯水蒸至開關跳起', '燜 5 分鐘後開蓋'],
    tone: '#A0522D',
    imageUrl: null,
    status: 'ready',
    isActive: true,
  },
  {
    id: '11111111-0000-4000-8000-000000000003',
    slug: 'dong-po-rou',
    name: '東坡肉',
    category: '主菜',
    description: '五花肉滷到筷子一夾就開，醬汁可以拌兩碗飯。',
    price: 520,
    servings: '4 人份',
    netWeightG: 800,
    ingredients: ['豬五花', '醬油', '冰糖', '紹興酒', '蔥', '薑'],
    allergens: ['大豆', '小麥'],
    storage: '冷凍 −18°C 以下保存',
    shelfLifeDays: 180,
    heating: ['冷藏解凍 8 小時', '連汁倒入鍋中小火加熱 8 分鐘', '翻面再加熱 3 分鐘'],
    tone: '#6E3A26',
    imageUrl: null,
    status: 'ready',
    isActive: true,
  },
  {
    id: '11111111-0000-4000-8000-000000000004',
    slug: 'yu-chi-geng',
    name: '魚翅羹',
    category: '湯品',
    description: '高湯勾芡、蟹肉與蛋花，宴席開場的那一碗。',
    price: 680,
    servings: '4 人份',
    netWeightG: 1500,
    ingredients: ['高湯', '蟹肉', '筍絲', '香菇', '蛋', '太白粉'],
    allergens: ['甲殼類', '蛋'],
    storage: '冷凍 −18°C 以下保存',
    shelfLifeDays: 180,
    heating: ['冷藏解凍 8 小時', '倒入鍋中中火加熱並持續攪拌', '沸騰後轉小火 3 分鐘'],
    tone: '#7A5230',
    imageUrl: null,
    status: 'ready',
    isActive: true,
  },
  {
    id: '11111111-0000-4000-8000-000000000005',
    slug: 'wu-liu-ju',
    name: '五柳枝',
    category: '主菜',
    description: '炸魚淋上五色蔬菜糖醋醬，宴席上的壓軸魚料理。',
    price: 760,
    servings: '4 人份',
    netWeightG: null,
    ingredients: ['鱸魚', '紅蘿蔔', '木耳', '洋蔥', '青椒', '糖醋醬'],
    allergens: ['魚類'],
    storage: '',
    shelfLifeDays: null,
    heating: [],
    tone: '#9A4A2C',
    imageUrl: null,
    status: 'draft',
    isActive: false,
  },
];

/** Lots per product per location; expiry offsets keep FEFO meaningful in demos. */
export const SEED_LOTS: (Omit<InventoryLot, 'expiresOn'> & { expiresInDays: number })[] = [
  { id: 'lot-1', productId: SEED_PRODUCTS[0]!.id, locationId: WAREHOUSE_ID, lotNo: 'FTQ-A01', qty: 10, expiresInDays: 300 },
  { id: 'lot-2', productId: SEED_PRODUCTS[0]!.id, locationId: WAREHOUSE_ID, lotNo: 'FTQ-A02', qty: 4, expiresInDays: 200 },
  { id: 'lot-3', productId: SEED_PRODUCTS[0]!.id, locationId: STORE_ID, lotNo: 'FTQ-S01', qty: 4, expiresInDays: 180 },
  { id: 'lot-4', productId: SEED_PRODUCTS[1]!.id, locationId: WAREHOUSE_ID, lotNo: 'HXM-A01', qty: 9, expiresInDays: 150 },
  { id: 'lot-5', productId: SEED_PRODUCTS[1]!.id, locationId: STORE_ID, lotNo: 'HXM-S01', qty: 3, expiresInDays: 120 },
  { id: 'lot-6', productId: SEED_PRODUCTS[2]!.id, locationId: WAREHOUSE_ID, lotNo: 'DPR-A01', qty: 1, expiresInDays: 150 },
  { id: 'lot-7', productId: SEED_PRODUCTS[2]!.id, locationId: STORE_ID, lotNo: 'DPR-S01', qty: 1, expiresInDays: 140 },
  { id: 'lot-8', productId: SEED_PRODUCTS[3]!.id, locationId: WAREHOUSE_ID, lotNo: 'YCG-A01', qty: 12, expiresInDays: 160 },
  { id: 'lot-9', productId: SEED_PRODUCTS[3]!.id, locationId: STORE_ID, lotNo: 'YCG-S01', qty: 3, expiresInDays: 150 },
];

export const DEMO_MEMBERS: Member[] = [
  { id: '22222222-0000-4000-8000-000000000001', phone: '0912345678', displayName: '陳小美', role: 'customer', points: 120 },
  { id: '22222222-0000-4000-8000-000000000002', phone: '0922000111', displayName: '王姐', role: 'staff', points: 0 },
  { id: '22222222-0000-4000-8000-000000000003', phone: '0933000222', displayName: '林經理', role: 'admin', points: 0 },
];

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export function seedEvents(): BanquetEvent[] {
  const active = isoDate(-2);
  const expired = isoDate(-30);
  return [
    {
      id: 'ajie-xiaowen',
      venue: '[會館名稱]',
      coupleName: '阿傑 & 小雯',
      eventDate: active,
      discountAmount: 100,
      validUntil: defaultValidUntil(active),
      featuredSlugs: ['fo-tiao-qiang', 'hong-xun-mi-gao', 'dong-po-rou', 'yu-chi-geng'],
    },
    {
      id: 'zhihao-yijun',
      venue: '[會館名稱]',
      coupleName: '志豪 & 怡君',
      eventDate: expired,
      discountAmount: 100,
      validUntil: defaultValidUntil(expired),
      featuredSlugs: ['fo-tiao-qiang', 'yu-chi-geng'],
    },
  ];
}

export function seedLots(): InventoryLot[] {
  return SEED_LOTS.map(({ expiresInDays, ...lot }) => ({ ...lot, expiresOn: isoDate(expiresInDays) }));
}
