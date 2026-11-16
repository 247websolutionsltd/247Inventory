import type { Product } from "@/services/inventory";

export type StockStatus = "in" | "low" | "out";

export const stockStatus = (p: Pick<Product, "qty" | "reorderLevel">): StockStatus =>
  p.qty <= 0 ? "out" : p.qty <= p.reorderLevel ? "low" : "in";

export const STOCK_LABEL: Record<StockStatus, string> = { in: "In stock", low: "Low stock", out: "Out of stock" };

export const margin = (price: number, cost: number) => (price > 0 ? ((price - cost) / price) * 100 : 0);
