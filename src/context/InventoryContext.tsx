import { auth } from "@/config/firebase";
import { OrderStatus } from "@/data/catalog";
import { startOfDay } from "@/lib/format";
import { stockStatus } from "@/lib/stock";
import * as inv from "@/services/inventory";
import type { Activity, NewOrderInput, Order, Product, ProductInput, Result, StaffInput, StaffMember, Supplier, SupplierInput } from "@/services/inventory";
import { updateUserProfile } from "@/services/users";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "./PageContext";

export type { Activity, Order, Product, Result, StaffMember, Supplier };

export type AlertItem = {
  id: string;
  kind: "out" | "low" | "pending" | "unpaid";
  title: string;
  detail: string;
  route: string;
  ts: number;
};

export type DayTotal = { label: string; ts: number; total: number; orders: number };

type InventoryContextType = {
  /** first snapshots of products and orders have arrived */
  ready: boolean;
  productsReady: boolean;
  staffReady: boolean;
  suppliersReady: boolean;
  products: Product[];
  orders: Order[];
  staff: StaffMember[];
  suppliers: Supplier[];
  activity: Activity[];

  // derived
  stockValue: number;
  retailValue: number;
  unitsInStock: number;
  lowStock: Product[];
  outOfStock: Product[];
  openOrders: Order[];
  todaySales: number;
  yesterdaySales: number;
  ordersToday: number;
  last7: DayTotal[];
  topSellers: { productId: string; name: string; units: number; revenue: number }[];
  alerts: AlertItem[];

  // lookups
  getProduct: (id?: string) => Product | undefined;
  getOrder: (id?: string) => Order | undefined;
  getStaff: (id?: string) => StaffMember | undefined;
  getSupplier: (id?: string) => Supplier | undefined;

  // actions
  addProduct: (input: ProductInput) => Promise<Result>;
  editProduct: (id: string, patch: Partial<Omit<ProductInput, "qty">>) => Promise<Result>;
  removeProduct: (id: string) => Promise<Result>;
  changeStock: (productId: string, delta: number, reason: string) => Promise<Result>;
  placeOrder: (input: NewOrderInput) => Promise<Result>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<Result>;
  markPaid: (id: string, paid: boolean) => Promise<Result>;
  saveStaff: (id: string | null, input: StaffInput) => Promise<Result>;
  toggleStaffActive: (id: string, active: boolean) => Promise<Result>;
  removeStaff: (id: string) => Promise<Result>;
  saveSupplier: (id: string | null, input: SupplierInput) => Promise<Result>;
  removeSupplier: (id: string) => Promise<Result>;
  loadSampleData: () => Promise<Result>;
  setLowStockAlerts: (v: boolean) => void;
};

const Ctx = createContext<InventoryContextType | undefined>(undefined);

const NOT_SIGNED_IN: Result = { ok: false, error: "Please sign in again to continue." };
const DAY = 86_400_000;
const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];
type CollectionKey = "products" | "orders" | "staff" | "suppliers" | "activity";

type InventorySnapshot = {
  uid: string | null;
  products: Product[];
  orders: Order[];
  staff: StaffMember[];
  suppliers: Supplier[];
  activity: Activity[];
  loaded: Record<CollectionKey, boolean>;
};

const emptySnapshot = (uid: string | null): InventorySnapshot => ({
  uid,
  products: [],
  orders: [],
  staff: [],
  suppliers: [],
  activity: [],
  loaded: { products: false, orders: false, staff: false, suppliers: false, activity: false },
});

/** Everything here is Firestore-backed and live: screens update the moment data changes. */
export function InventoryProvider({ children }: { children: ReactNode }) {
  const { uid, owner } = useAuth();
  const [snapshot, setSnapshot] = useState(() => emptySnapshot(null));
  const [now, setNow] = useState(0);
  const syncAlerted = useRef<string | null>(null);
  const current = snapshot.uid === uid ? snapshot : emptySnapshot(uid);

  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!uid) return;

    const updateRows = <K extends CollectionKey>(key: K, rows: InventorySnapshot[K]) => {
      setSnapshot((previous) => {
        const base = previous.uid === uid ? previous : emptySnapshot(uid);
        return { ...base, [key]: rows, loaded: { ...base.loaded, [key]: true } };
      });
    };

    const onError = (label: CollectionKey) => (error: unknown) => {
      if (!auth.currentUser) return; // signing out
      console.error(`[inventory] ${label} subscription failed`, error);
      setSnapshot((previous) => {
        const base = previous.uid === uid ? previous : emptySnapshot(uid);
        return { ...base, loaded: { ...base.loaded, [label]: true } };
      });
      if (syncAlerted.current !== uid) {
        syncAlerted.current = uid;
        const code = (error as { code?: string })?.code;
        Alert.alert(
          code === "permission-denied" ? "Firebase access denied" : "Sync problem",
          code === "permission-denied"
            ? "Firestore denied access to your business data. Deploy the app's Firestore rules to the configured Firebase project, then reopen the app."
            : "We couldn't load some of your data. Check your connection and reopen the app.",
        );
      }
    };

    const unsubs = [
      inv.subscribeProducts(uid, (r) => updateRows("products", r), onError("products")),
      inv.subscribeOrders(uid, (r) => updateRows("orders", r), onError("orders")),
      inv.subscribeStaff(uid, (r) => updateRows("staff", r), onError("staff")),
      inv.subscribeSuppliers(uid, (r) => updateRows("suppliers", r), onError("suppliers")),
      inv.subscribeActivity(uid, (r) => updateRows("activity", r), onError("activity")),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const { products, orders, staff, suppliers, activity, loaded } = current;
  const actor = owner.name || "Owner";

  /* ------------------------------ derived values ----------------------------- */
  const derived = useMemo(() => {
    const today = startOfDay(now);
    const live = orders.filter((o) => o.status !== "cancelled");

    const stockValue = products.reduce((s, p) => s + p.cost * p.qty, 0);
    const retailValue = products.reduce((s, p) => s + p.price * p.qty, 0);
    const unitsInStock = products.reduce((s, p) => s + p.qty, 0);
    const lowStock = products.filter((p) => stockStatus(p) === "low").sort((a, b) => a.qty / (a.reorderLevel || 1) - b.qty / (b.reorderLevel || 1));
    const outOfStock = products.filter((p) => stockStatus(p) === "out");
    const openOrders = orders.filter((o) => o.status === "pending" || o.status === "processing" || o.status === "ready");

    const sumFrom = (from: number, to: number) => live.filter((o) => o.ts >= from && o.ts < to).reduce((s, o) => s + o.total, 0);
    const todaySales = sumFrom(today, today + DAY);
    const yesterdaySales = sumFrom(today - DAY, today);
    const ordersToday = live.filter((o) => o.ts >= today).length;

    const last7: DayTotal[] = Array.from({ length: 7 }, (_, i) => {
      const start = today - (6 - i) * DAY;
      const day = live.filter((o) => o.ts >= start && o.ts < start + DAY);
      return { label: WEEKDAY[new Date(start).getDay()], ts: start, total: day.reduce((s, o) => s + o.total, 0), orders: day.length };
    });

    const sold = new Map<string, { productId: string; name: string; units: number; revenue: number }>();
    live
      .filter((o) => o.ts >= today - 6 * DAY)
      .forEach((o) =>
        o.items.forEach((i) => {
          const cur = sold.get(i.productId) ?? { productId: i.productId, name: i.name, units: 0, revenue: 0 };
          cur.units += i.qty;
          cur.revenue += i.qty * i.price;
          sold.set(i.productId, cur);
        }),
      );
    const topSellers = [...sold.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const alerts: AlertItem[] = [
      ...outOfStock.map<AlertItem>((p) => ({ id: `out-${p.id}`, kind: "out", title: `${p.name} is out of stock`, detail: `Reorder level is ${p.reorderLevel} ${p.unit}`, route: `/inventory/${p.id}`, ts: p.updatedAt })),
      ...lowStock.map<AlertItem>((p) => ({ id: `low-${p.id}`, kind: "low", title: `${p.name} is running low`, detail: `${p.qty} ${p.unit} left · reorder at ${p.reorderLevel}`, route: `/inventory/${p.id}`, ts: p.updatedAt })),
      ...orders
        .filter((o) => o.status === "pending" && now - o.ts > 60 * 60 * 1000)
        .map<AlertItem>((o) => ({ id: `pend-${o.id}`, kind: "pending", title: `${o.number} is still pending`, detail: `${o.customer} has been waiting a while`, route: `/orders/${o.id}`, ts: o.ts })),
      ...orders
        .filter((o) => o.status === "delivered" && !o.paid)
        .map<AlertItem>((o) => ({ id: `unpaid-${o.id}`, kind: "unpaid", title: `${o.number} delivered but unpaid`, detail: `${o.customer} owes ${o.total.toLocaleString("en-NG")}`, route: `/orders/${o.id}`, ts: o.ts })),
    ];

    return { stockValue, retailValue, unitsInStock, lowStock, outOfStock, openOrders, todaySales, yesterdaySales, ordersToday, last7, topSellers, alerts };
  }, [products, orders, now]);

  /* --------------------------------- actions -------------------------------- */
  const act = useCallback(
    <A extends unknown[]>(fn: (uid: string, ...args: A) => Promise<Result>) =>
      async (...args: A): Promise<Result> => (uid ? fn(uid, ...args) : NOT_SIGNED_IN),
    [uid],
  );

  const value: InventoryContextType = {
    ready: Object.values(loaded).every(Boolean),
    productsReady: loaded.products,
    staffReady: loaded.staff,
    suppliersReady: loaded.suppliers,
    products,
    orders,
    staff,
    suppliers,
    activity,
    ...derived,

    getProduct: (id) => products.find((p) => p.id === id),
    getOrder: (id) => orders.find((o) => o.id === id),
    getStaff: (id) => staff.find((s) => s.id === id),
    getSupplier: (id) => suppliers.find((s) => s.id === id),

    addProduct: (input) => act(inv.createProduct)(input, actor),
    editProduct: (id, patch) => act(inv.updateProduct)(id, patch, actor),
    removeProduct: async (id) => {
      const p = products.find((x) => x.id === id);
      return act(inv.deleteProduct)(id, p?.name ?? "item", actor);
    },
    changeStock: (productId, delta, reason) => act(inv.adjustStock)(productId, delta, reason, actor),
    placeOrder: (input) => act(inv.createOrder)(input, actor),
    updateOrderStatus: (id, status) => act(inv.setOrderStatus)(id, status, actor),
    markPaid: async (id, paid) => {
      const o = orders.find((x) => x.id === id);
      return act(inv.setOrderPaid)(id, paid, o?.number ?? "Order", actor);
    },
    saveStaff: (id, input) => act(inv.saveStaff)(id, input, actor),
    toggleStaffActive: (id, active) => act(inv.setStaffActive)(id, active),
    removeStaff: async (id) => {
      const s = staff.find((x) => x.id === id);
      return act(inv.removeStaff)(id, s?.name ?? "team member", actor);
    },
    saveSupplier: (id, input) => act(inv.saveSupplier)(id, input, actor),
    removeSupplier: async (id) => {
      const s = suppliers.find((x) => x.id === id);
      return act(inv.removeSupplier)(id, s?.name ?? "supplier", actor);
    },
    loadSampleData: () => act(inv.seedSampleData)(actor),
    setLowStockAlerts: (v) => {
      if (!uid) return;
      updateUserProfile(uid, { lowStockAlerts: v }).catch(() => Alert.alert("Couldn't save", "Your change wasn't saved. Please try again."));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInventory must be used inside an InventoryProvider");
  return ctx;
}
