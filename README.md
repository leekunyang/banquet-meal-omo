# 喜宴好味 OMO 電商（banquet-meal-omo）

把婚宴會館宴席上的暢銷菜色製成冷凍調理包，透過**線上商店**與**會館現場**（喜宴桌卡 QR code、門市自取、現場 POS）雙通路銷售，會員、點數、庫存與訂單線上線下整合。

## 技術堆疊
Next.js（App Router）· TypeScript · Tailwind CSS · shadcn/ui · Supabase · 綠界 ECPay · Vercel

## 快速開始

```bash
npm install
npm run dev          # http://localhost:3000
```

沒有設定 Supabase 時，網站會以**展示模式**執行：資料存在伺服器記憶體，重新啟動後還原；綠界付款改成「模擬付款成功／失敗」。驗證碼輸入任意 6 位數即可。

| 展示帳號 | 手機 | 可進入 |
| :--- | :--- | :--- |
| 會員 陳小美（120 點） | 0912 345 678 | 前台、會員中心 |
| 門市人員 王姐 | 0922 000 111 | `/store` 自取核銷、POS |
| 管理者 林經理 | 0933 000 222 | `/admin` 商品、庫存、訂單、宴席 |

建議展示路線：開 `/e/ajie-xiaowen`（喜宴桌卡落地頁）→ 加入佛跳牆 → 結帳選「會館門市自取」→ 模擬付款 → 會員中心看取貨 QR → 用王姐登入 `/store` 輸入取貨碼核銷 → 林經理在 `/admin/events` 看到這場喜宴帶動的訂單。

### 連接 Supabase（正式資料）

```bash
npx supabase start            # 需要 Docker；印出本機 URL 與金鑰
npx supabase db reset         # 套用 supabase/migrations 與 seed.sql
npm run db:types              # 產生 types/database.ts
```

把印出的 URL、anon key、service role key 填進 `.env.local`，重新執行 `npm run dev` 即切換為 Supabase。本機手機驗證使用 `supabase/config.toml` 的測試驗證碼 `123456`。

### 驗證指令

| 指令 | 內容 |
| :--- | :--- |
| `npm run lint`、`npm run typecheck` | ESLint、TypeScript strict |
| `npm run test:unit` | Vitest：金額、優惠、點數、CheckMacValue、防超賣、核銷 |
| `npm run test:e2e` | Playwright（375px 手機）：線上購買、喜宴 QR、門市自取、權限、手機版面 |
| `npx supabase test db` | pgTAP：RLS 權限、防超賣、回呼冪等、逾時釋放、重複核銷 |

### 待小組核准的新套件
依專案規則，新增套件需小組同意：`qrcode`（產生取貨 QR 與桌卡 QR，伺服器端輸出 SVG）。

## 專案文件
| 檔案 | 用途 |
| :--- | :--- |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | 專案憲法：每次與 Copilot 對話都會送出的精簡規則（10 行內） |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 使用者情境、技術堆疊、目錄結構、資料模型、領域鐵律、測試與用語規範 |
| [.github/skills/qa-workflow](.github/skills/qa-workflow/SKILL.md) | Lint、單元測試、E2E 測試與修正流程 |
| [.github/skills/scaffold-feature](.github/skills/scaffold-feature/SKILL.md) | 新功能模組的建立流程 |
| [.github/skills/supabase-migration](.github/skills/supabase-migration/SKILL.md) | 資料表、RLS 與庫存函式的異動流程 |
| [.github/skills/pr-preflight](.github/skills/pr-preflight/SKILL.md) | 推送與發 PR 前的檢查 |
| [.github/skills/dish-to-product](.github/skills/dish-to-product/SKILL.md) | 把菜色資料 / 包裝標示照片整理成 `data/products.json` 商品紀錄 |
| [.github/agents/product-copywriter.agent.md](.github/agents/product-copywriter.agent.md) | 自訂 Agent：依商品紀錄撰寫商品頁文案與食品標示 |
| [docs/PRD.md](docs/PRD.md) | 產品需求文件：問題、Persona、User Stories 與驗收條件、成功指標、MVP 範圍 |
| [docs/TEAM.md](docs/TEAM.md) | 四個角色與目錄、資料表的對應（與 `.github/CODEOWNERS` 一致） |
| [.env.example](.env.example) | 環境變數範本 |
