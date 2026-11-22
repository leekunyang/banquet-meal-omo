# 團隊分工與目錄對應

完整版（工作包、33 則 User Story、四關 PR 審查、檢核卡）見小組的分工文件；本檔與 `.github/CODEOWNERS` 保持一致。

| 角色 | 成員 | 負責目錄／資料表 |
| :--- | :--- | :--- |
| 產品規格與脈絡架構師 | 楊承穎 | `docs/`、`ARCHITECTURE.md`、`.github/copilot-instructions.md`、`types/`（交會合約）、`supabase/migrations/` 必審 |
| 領域 A：交易與庫存 | 黃鳴翌 | 商品、購物車、結帳、綠界（`lib/pricing.ts`、`lib/ecpay/`、`app/(shop)/{products,cart,checkout}`、`app/api/`、後台商品／庫存／訂單）；`products`、`inventory_lots`、`stock_reservations`、`orders`、`order_items`、`payments` |
| 領域 B：會員與現場 OMO | 陳宇澔 | 登入、會員中心、喜宴 QR、門市（`app/(account)/`、`app/e/`、`app/store/`、`lib/auth/`、`lib/events/`、後台宴席）；`members`、`point_ledger`、`events`、`notifications` |
| 系統整合與體驗防禦者 | 李昆陽 | `tests/e2e/`、`supabase/tests/`、`.github/workflows/`、`app/globals.css`、`components/ui/`、`components/common/`；PR 合併裁決 |

## 交會合約（`types/contracts.ts`）
| 合約 | 實作 | 呼叫 |
| :--- | :--- | :--- |
| `createOrder(CreateOrderInput) → CreateOrderResult` | A | B（喜宴 QR 帶 `eventId`、點數折抵） |
| 付款成功後累點與通知（`commit_payment` 內） | A | B 讀取 `point_ledger`、`notifications` |
| `redeemPickup(token) → RedeemResult` | B | A 的訂單狀態因此變為 `picked_up` |
