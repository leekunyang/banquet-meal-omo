# 系統架構與工程規範 (ARCHITECTURE.md)

## 1. 專案簡介
**喜宴好味 OMO 電商**：把婚宴會館宴席上最受歡迎的菜色（例如佛跳牆、紅蟳米糕、東坡肉、魚翅羹）製成冷凍調理包，透過「線上商店 + 會館現場」雙通路銷售，並以 OMO（Online-Merge-Offline）整合會員、庫存與訂單。

### 目標使用者
| 角色 | 情境 |
| :--- | :--- |
| 喜宴賓客 | 吃完喜宴覺得好吃，掃桌卡 QR code 直接下單，或在會館櫃檯現場購買 |
| 一般消費者 | 在線上商店購買年菜、家常宴客菜，冷凍宅配到府 |
| 新人 | 訂購調理包禮盒作為喜宴伴手禮 / 謝卡回禮 |
| 會館門市人員 | 現場 POS 結帳、處理自取訂單、盤點冷凍櫃庫存 |
| 管理者 | 上架商品、管理庫存與批號、查看各通路與各場宴席的銷售成效 |

### OMO 核心情境
1. **線下導線上**：每場喜宴的桌卡印有專屬 QR code（帶 `event_id`），賓客掃碼進入商品頁，享當場限定優惠；訂單記錄來自哪一場宴席。
2. **線上導線下**：線上下單可選「會館門市自取」，到店出示取貨 QR code 由門市人員核銷。
3. **統一會員**：以手機號碼（或 LINE 登入）為唯一會員身分，線上與門市消費都累積同一個點數錢包。
4. **單一庫存**：線上與門市共用同一份庫存資料，依「倉庫 / 門市冷凍櫃」分別記錄，避免超賣。

---

## 2. 技術堆疊（小組討論結論）

| 層級 | 選擇 | 理由 |
| :--- | :--- | :--- |
| 框架 | Next.js（App Router，預設 React Server Components） | SEO 友善的商品頁；前後端同一個專案；部署容易 |
| 語言 | TypeScript（Strict，嚴禁 `any`） | 訂單、金額等資料結構需要嚴格型別 |
| UI | Tailwind CSS + shadcn/ui | 元件齊全、可自訂，手機版排版快速 |
| 資料庫 / 驗證 / 檔案 | Supabase（PostgreSQL、Auth、Storage） | 電商的訂單、庫存屬關聯式資料，需要交易（transaction）防止超賣；Row Level Security 控制權限 |
| 金流 | 綠界 ECPay（信用卡、ATM、超商代碼、LINE Pay） | 台灣常用，學生可申請測試環境 |
| 物流 | 冷凍宅配（黑貓 / 新竹物流冷凍）、會館門市自取 | 調理包需全程 -18°C 冷凍 |
| 登入 | Supabase Auth：手機 OTP + LINE Login | 喜宴賓客多半使用 LINE，降低註冊門檻 |
| 測試 | Vitest（單元）、Playwright（E2E） | 與 Next.js 整合良好 |
| 部署 | Vercel | 與 Next.js 原生整合、預覽環境自動建立 |

> 曾考慮 Firebase（Firestore），但 NoSQL 不易處理「扣庫存 + 建立訂單」的一致性與報表查詢，因此選 Supabase。

---

## 3. 目錄結構

```
├── .github/
│   ├── copilot-instructions.md    # 專案憲法（10 行內）
│   ├── skills/<name>/SKILL.md     # Agent Skills：所有 agent 共用的 SOP
│   └── agents/<name>.agent.md     # 自訂 Agent：專屬角色（如 product-copywriter）
├── docs/
│   └── PRD.md                     # 產品需求文件
├── data/
│   └── products.json              # 商品資料草稿（建立資料庫前由 dish-to-product skill 維護）
├── app/
│   ├── (shop)/                    # 前台：首頁、商品列表、商品頁、購物車、結帳
│   │   ├── products/[slug]/
│   │   ├── cart/
│   │   └── checkout/
│   ├── (account)/                 # 會員中心：訂單、點數、取貨 QR code
│   ├── e/[eventId]/               # 喜宴 QR code 落地頁（記錄來源宴席與限定優惠）
│   ├── store/                     # 門市 POS 與自取核銷（限門市人員）
│   ├── admin/                     # 後台：商品、庫存、訂單、宴席活動、報表（限管理者）
│   ├── api/
│   │   └── ecpay/notify/          # 綠界付款結果回呼（Route Handler）
│   ├── actions/                   # Server Actions（下單、核銷、調整庫存）
│   ├── layout.tsx
│   └── globals.css                # Tailwind 與 CSS 變數（Design Tokens）
├── components/
│   ├── ui/                        # shadcn/ui 元件（CLI 安裝）
│   ├── common/                    # Header、Footer、購物車抽屜
│   └── features/[feature]/        # 依功能分類的展示元件（純展示）
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # 瀏覽器端 client（anon key）
│   │   └── server.ts              # 伺服器端 client（cookie session / service role）
│   ├── ecpay/                     # 金流參數組合與 CheckMacValue 驗證
│   ├── [feature]/                 # 商業邏輯與資料存取（cart、orders、inventory、loyalty…）
│   └── utils.ts                   # cn()、formatTWD() 等共用函式
├── types/                         # 資料模型（含 supabase gen types 產生的 database.ts）
├── supabase/
│   ├── migrations/                # 資料表、RLS、DB functions 的 SQL migration
│   └── seed.sql                   # 測試資料
└── tests/
    ├── unit/                      # Vitest
    └── e2e/                       # Playwright
```

### 架構原則
1. **元件純展示**：`components/` 只負責畫面，不直接查詢 Supabase；資料透過 props 或 `lib/` 的函式取得。
2. **Server / Client 邊界**：預設 Server Components；只有需要互動（購物車、表單）才加 `'use client'`。
3. **金鑰隔離**：`SUPABASE_SERVICE_ROLE_KEY`、ECPay `HashKey` / `HashIV` 只能在 Server Actions 與 Route Handlers 使用，嚴禁出現在 Client Components 或 `NEXT_PUBLIC_*` 變數。
4. **伺服器專用模組加上 `server-only` 防護**：`lib/supabase/server.ts`、`lib/ecpay/` 等只能在伺服器執行的檔案，第一行必須是 `import 'server-only';`。若被 Client Component 引入，build 時會直接報錯，避免金鑰或伺服器邏輯被打包進瀏覽器。

### 為什麼預設使用 Server Components
App Router 的元件預設就是 Server Component；本專案規定**只在需要互動時才加 `'use client'`**，原因如下：

| 理由 | 說明 |
| :--- | :--- |
| 手機載入速度 | 賓客在喜宴現場以行動網路掃 QR code 進站，Server Component 不把元件程式碼送到瀏覽器，JS 體積小、首屏快 |
| 安全 | 資料查詢與金鑰留在伺服器，呼應「價格以伺服器為準」與金鑰隔離原則 |
| SEO | 商品名稱、價格、成分直接輸出在 HTML，搜尋引擎可完整索引 |
| 程式簡潔 | 可直接 `await` 查詢資料庫，不需額外寫 API、`useEffect` 與 loading 狀態 |

**需要 `'use client'` 的情況**：使用 React Hooks（`useState`、`useEffect`）、瀏覽器事件（`onClick`、`onChange`）或瀏覽器 API（`localStorage`、相機）。本專案中主要是購物車、加入購物車按鈕、結帳表單、門市 QR 核銷掃描器。

**拆分方式**：頁面本身維持 Server Component 負責取資料，把需要互動的部分拆成小的 Client Component，以 props 傳入資料：

```tsx
// app/(shop)/products/[slug]/page.tsx — Server Component（預設）
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug); // 在伺服器查詢
  return (
    <>
      <ProductInfo product={product} />            {/* 純展示，留在伺服器 */}
      <AddToCartButton productId={product.id} />   {/* 需要互動，檔案內宣告 'use client' */}
    </>
  );
}
```

---

## 4. 資料模型（主要資料表）

| 資料表 | 主要欄位 | 說明 |
| :--- | :--- | :--- |
| `products` | `id`、`slug`、`name`、`price`（int）、`servings`、`ingredients`、`allergens`、`nutrition`、`storage_note`、`is_active` | 商品與食品標示資訊 |
| `inventory_lots` | `product_id`、`location_id`、`lot_no`、`expires_on`、`qty` | 依批號與效期管理庫存，出貨採先到期先出（FEFO） |
| `locations` | `id`、`type`（`warehouse` / `store`）、`name` | 中央倉庫與各會館門市冷凍櫃 |
| `members` | `id`（= auth user）、`phone`、`line_user_id`、`points` | 統一會員 |
| `orders` | `id`、`member_id`、`channel`（`online` / `qr` / `store`）、`event_id`、`fulfillment`（`delivery` / `pickup`）、`status`、`subtotal`、`shipping_fee`、`discount`、`total` | 金額皆為整數新台幣 |
| `order_items` | `order_id`、`product_id`、`qty`、`unit_price` | 下單當下的價格快照 |
| `events` | `id`、`venue`、`couple_name`、`event_date`、`coupon_code` | 喜宴場次，對應桌卡 QR code |
| `point_ledger` | `member_id`、`order_id`、`delta`、`reason` | 點數異動紀錄（不可直接改 `members.points`） |

### 訂單狀態流程
```
pending_payment → paid → preparing → shipped → delivered
                      └→ ready_for_pickup → picked_up
pending_payment → cancelled（逾時未付款，釋放保留庫存）
paid → refunded
```

---

## 5. 領域鐵律（Domain Rules）
1. **金額一律整數**：新台幣沒有小數，所有金額以 `integer` 儲存與計算，嚴禁浮點數；顯示時用 `formatTWD()`。
2. **庫存只能透過 DB function 異動**：下單時呼叫 `reserve_stock()`，付款成功呼叫 `commit_stock()`，逾時呼叫 `release_stock()`；全部在 Postgres transaction 內執行，防止超賣。
3. **價格以伺服器為準**：結帳時由伺服器重新計算金額，絕不採信前端傳來的價格。
4. **付款結果以綠界回呼為準**：`/api/ecpay/notify` 必須驗證 `CheckMacValue`，且需冪等（同一筆通知重複送達只處理一次）。
5. **冷凍配送限制**：調理包只能選冷凍宅配或門市自取，不提供常溫超商取貨。
6. **食品標示必填**：商品上架前必須填寫成分、過敏原、營養標示、保存方式與有效期限（依《食品安全衛生管理法》）。
7. **QR 來源追蹤**：從 `/e/[eventId]` 進入的工作階段，下單時 `channel = 'qr'` 並寫入 `event_id`。
8. **個資保護**：會員手機、地址只有本人與管理者可讀取（RLS），日誌不得記錄完整個資。

---

## 6. UI 與設計系統規範
- 顏色、間距、圓角使用 `globals.css` 的 CSS 變數（`bg-background`、`text-foreground`、`border-border`）；品牌主色為喜氣紅與金色，定義在 `--primary` 與 `--accent`。
- 條件式 class 一律使用 `@/lib/utils` 的 `cn()`。
- 需要新元件時執行 `npx shadcn@latest add <component>`。
- **手機優先**：QR code 掃碼一定是手機進入，所有前台頁面以 375px 寬度設計，再往上擴充。

---

## 7. 測試與驗收標準
所有 Pull Request 合併前必須通過：
1. **Lint / 型別**：`npm run lint`、`npx tsc --noEmit`
2. **單元測試（Vitest）**：`npm run test:unit`，範圍為 `lib/` 中的金額計算、優惠與點數規則、ECPay CheckMacValue。
3. **E2E 測試（Playwright）**：`npx playwright test`，至少涵蓋：
   - 線上購買：瀏覽 → 加入購物車 → 結帳（ECPay 測試環境）→ 訂單成立
   - 喜宴 QR：從 `/e/[eventId]` 進入 → 套用限定優惠 → 訂單 `channel = 'qr'`
   - 門市自取：下單選自取 → 門市人員核銷 → 狀態變為 `picked_up`
4. **RLS 測試**：未登入或非本人無法讀取他人訂單與會員資料。

---

## 8. 在地化與繁體中文（台灣）用語規範
所有使用者看得到的文字一律使用**繁體中文（台灣慣用詞）**。

| 必須使用 | 禁止使用 |
| :--- | :--- |
| 使用者 / 會員 | 用戶 |
| 登入 / 登出 | 登錄 / 退出 |
| 購物車 | 購物籃 |
| 結帳 | 結算 |
| 宅配 | 快遞 |
| 訂單 | 訂單號（單獨使用時寫「訂單編號」） |
| 設定 | 設置 |
| 預設 | 默認 |
| 資訊 | 信息 |
| 建立 | 創建 |
| 優惠券 | 優惠卷 |
| 調理包 | 料理包、預製菜 |

> 寫給 Agent 的工程規則（instructions、skills）維持英文；寫給人看的文件與 UI 文字使用繁體中文。
