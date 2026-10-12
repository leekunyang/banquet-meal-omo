---
name: dish-to-product
description: When the user gives a banquet dish's info, recipe card, or packaging/label photo, extract product fields and add or update the record in data/products.json.
---

# Dish to Product Record

## Inputs
- Dish information as text, a recipe/spec sheet, or photos of the packaging and nutrition label (photos preferred for labeling data).

## Steps
1. **Check inputs.** Food-labeling fields must come from the user's material. If ingredients, allergens, net weight, storage, or shelf life are missing or unreadable, list them and ask the user (in zh-TW) for the label photo or data. Never guess them.
2. **Extract fields** into the record format below. `slug` is lowercase kebab-case pinyin or English (e.g. `fo-tiao-qiang`). `price` is an integer in TWD; use `null` if not provided.
3. **Deduplicate** by `slug`: update the existing record instead of adding a duplicate.
4. **Write** the array back to `data/products.json` (2-space indentation, UTF-8, valid JSON).
5. **Report** the saved record and list any `null` fields that still need data.

## Record format
```json
{
  "slug": "fo-tiao-qiang",
  "name": "佛跳牆",
  "category": "湯品",
  "price": null,
  "netWeightG": null,
  "servings": null,
  "ingredients": [],
  "allergens": [],
  "storage": "冷凍 -18°C 以下保存",
  "shelfLifeDays": null,
  "heating": [],
  "bestSellerAtVenue": true,
  "status": "draft"
}
```

`status` stays `draft` until every food-labeling field is filled; then set it to `ready`.
