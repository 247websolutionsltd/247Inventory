import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/* ----------------------------- product categories ---------------------------- */

export const CATEGORIES = [
  { id: "beverages", label: "Beverages", icon: "cafe-outline", prefix: "BEV" },
  { id: "groceries", label: "Groceries", icon: "basket-outline", prefix: "GRO" },
  { id: "household", label: "Household", icon: "home-outline", prefix: "HOU" },
  { id: "beauty", label: "Health & Beauty", icon: "flower-outline", prefix: "HBT" },
  { id: "electronics", label: "Electronics", icon: "hardware-chip-outline", prefix: "ELE" },
  { id: "apparel", label: "Apparel", icon: "shirt-outline", prefix: "APP" },
  { id: "stationery", label: "Stationery", icon: "pencil-outline", prefix: "STA" },
  { id: "other", label: "Other", icon: "cube-outline", prefix: "OTH" },
] as const satisfies readonly { id: string; label: string; icon: IconName; prefix: string }[];

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const categoryOf = (id?: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const UNITS = ["pcs", "box", "pack", "carton", "bottle", "kg", "litre"] as const;

export const STOCK_REASONS = {
  in: ["Restock", "Customer return", "Count correction"],
  out: ["Damaged", "Expired", "Used in-house", "Count correction"],
} as const;

/* --------------------------------- orders ------------------------------------ */

export type OrderStatus = "pending" | "processing" | "ready" | "delivered" | "cancelled";

export const ORDER_FLOW: OrderStatus[] = ["pending", "processing", "ready", "delivered"];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; icon: IconName; next?: OrderStatus; action?: string }> = {
  pending: { label: "Pending", icon: "time-outline", next: "processing", action: "Start processing" },
  processing: { label: "Processing", icon: "construct-outline", next: "ready", action: "Mark as ready" },
  ready: { label: "Ready", icon: "bag-check-outline", next: "delivered", action: "Mark as delivered" },
  delivered: { label: "Delivered", icon: "checkmark-done-outline" },
  cancelled: { label: "Cancelled", icon: "close-circle-outline" },
};

export const CHANNELS = [
  { id: "walk-in", label: "Walk-in", icon: "storefront-outline" },
  { id: "phone", label: "Phone", icon: "call-outline" },
  { id: "online", label: "Online", icon: "globe-outline" },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type Channel = (typeof CHANNELS)[number]["id"];

/* ---------------------------------- staff ------------------------------------ */

export const STAFF_ROLES = ["Manager", "Cashier", "Storekeeper", "Packer", "Dispatch", "Sales"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const SHIFTS = ["Morning", "Afternoon", "Evening", "Full day"] as const;
export type Shift = (typeof SHIFTS)[number];

export const ROLE_ICON: Record<StaffRole, IconName> = {
  Manager: "ribbon-outline",
  Cashier: "receipt-outline",
  Storekeeper: "file-tray-stacked-outline",
  Packer: "cube-outline",
  Dispatch: "bicycle-outline",
  Sales: "pricetag-outline",
};

/* ------------------------------- business types ------------------------------ */

export const BUSINESS_TYPES = ["Retail shop", "Supermarket", "Wholesale", "Pharmacy", "Restaurant", "Warehouse", "Other"] as const;

/* -------------------------------- activity ----------------------------------- */

export type ActivityKind = "stock_in" | "stock_out" | "order" | "product" | "staff" | "supplier";

export const ACTIVITY_META: Record<ActivityKind, { icon: IconName; label: string }> = {
  stock_in: { icon: "arrow-down-circle-outline", label: "Stock in" },
  stock_out: { icon: "arrow-up-circle-outline", label: "Stock out" },
  order: { icon: "receipt-outline", label: "Order" },
  product: { icon: "cube-outline", label: "Item" },
  staff: { icon: "people-outline", label: "Team" },
  supplier: { icon: "business-outline", label: "Supplier" },
};
