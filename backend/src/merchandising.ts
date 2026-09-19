// Use the same database clock and price rule for browsing, baskets and checkout.
export const activeSaleSql = `(p.sale_kind IS NOT NULL AND p.sale_price_minor < p.price_minor AND now() >= p.sale_starts_at AND now() < p.sale_ends_at)`;
export const sellingPriceSql = `(CASE WHEN ${activeSaleSql} THEN p.sale_price_minor ELSE p.price_minor END)`;
export function merchandisingJSON(row:any) {
 return {featured:row.featured,basePriceMinor:Number(row.price_minor),saleKind:row.sale_kind,
 salePriceMinor:row.sale_price_minor===null?null:Number(row.sale_price_minor),saleStartsAt:row.sale_starts_at,saleEndsAt:row.sale_ends_at,
 onSale:!!row.on_sale};
}
