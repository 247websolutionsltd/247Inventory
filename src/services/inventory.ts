import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { ActivityKind, CATEGORIES, CategoryId, Channel, OrderStatus, Shift, StaffRole } from "@/data/catalog";
import { db } from "../config/firebase";
import { userRef } from "./users";

/* --------------------------------- types --------------------------------- */

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: CategoryId;
  unit: string;
  price: number;
  cost: number;
  qty: number;
  reorderLevel: number;
  supplierId?: string;
  supplierName?: string;
  location?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export type OrderItem = { productId: string; name: string; sku: string; qty: number; price: number; cost: number };

export type Order = {
  id: string;
  number: string;
  customer: string;
  phone?: string;
  channel: Channel;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paid: boolean;
  assignedId?: string;
  assignedTo?: string;
  note?: string;
  ts: number;
  updatedAt: number;
};

export type NewOrderInput = {
  customer: string;
  phone?: string;
  channel: Channel;
  lines: { productId: string; qty: number }[];
  paid: boolean;
  note?: string;
  assignedId?: string;
  assignedTo?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email?: string;
  shift: Shift;
  active: boolean;
  note?: string;
  joined: number;
};
export type StaffInput = Omit<StaffMember, "id" | "joined">;

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};
export type SupplierInput = Omit<Supplier, "id">;

export type Activity = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  ts: number;
  actor?: string;
  productId?: string;
  orderId?: string;
  delta?: number;
};

export type Result = { ok: true; id: string } | { ok: false; error: string };

/* -------------------------------- helpers -------------------------------- */

/** Business-rule failure with a message that is safe to show to the user. */
export class InventoryError extends Error {}

const col = (uid: string, name: string) => collection(db, "users", uid, name);
const ref = (uid: string, name: string, id: string) => doc(db, "users", uid, name, id);

const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const opt = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

/** Firestore rejects `undefined`; drop those keys. */
const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
const validEmail = (email?: string) => !email || /^\S+@\S+\.\S+$/.test(email);

async function assertUniqueSku(uid: string, sku: string, excludeId?: string) {
  const matches = await getDocs(query(col(uid, "products"), where("sku", "==", sku), limit(2)));
  if (matches.docs.some((match) => match.id !== excludeId)) {
    throw new InventoryError(`SKU ${sku} is already in use.`);
  }
}

function validateProduct(input: ProductInput | Partial<Omit<ProductInput, "qty">>) {
  if ("name" in input && !input.name?.trim()) throw new InventoryError("Give the item a name.");
  if ("sku" in input && !input.sku?.trim()) throw new InventoryError("Enter a SKU.");
  if ("sku" in input && (input.sku?.trim().length ?? 0) > 64) throw new InventoryError("SKU must be 64 characters or fewer.");
  if ("price" in input && (typeof input.price !== "number" || !Number.isFinite(input.price) || input.price <= 0)) throw new InventoryError("Enter a selling price above zero.");
  if ("cost" in input && (typeof input.cost !== "number" || !Number.isFinite(input.cost) || input.cost < 0)) throw new InventoryError("Cost price can't be negative.");
  if ("qty" in input && (typeof input.qty !== "number" || !Number.isInteger(input.qty) || input.qty < 0)) throw new InventoryError("Opening stock must be a whole number of zero or more.");
  if ("reorderLevel" in input && (typeof input.reorderLevel !== "number" || !Number.isInteger(input.reorderLevel) || input.reorderLevel < 0)) {
    throw new InventoryError("Reorder level must be a whole number of zero or more.");
  }
}

function friendlyError(e: unknown): string {
  if (e instanceof InventoryError) return e.message;
  const code = (e as { code?: string })?.code ?? "";
  if (code === "permission-denied") return "Firebase denied access to your business data. Check that the Firestore rules are deployed to this app's Firebase project and that you're signed in to the right account.";
  if (code === "unavailable" || code === "deadline-exceeded") return "Can't reach the server. Check your connection and try again.";
  console.error("[inventory]", e);
  return "Something went wrong. Please try again.";
}

async function run(fn: () => Promise<string>): Promise<Result> {
  try {
    return { ok: true, id: await fn() };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

type Writer = { set: (r: DocumentReference, data: DocumentData) => unknown };

function logActivity(w: Writer, uid: string, a: Omit<Activity, "id" | "ts"> & { ts?: number }) {
  w.set(doc(col(uid, "activity")), clean({ ...a, ts: a.ts ?? Date.now() }));
}

/* -------------------------------- mappers -------------------------------- */

const toProduct = (id: string, d: DocumentData): Product => ({
  id,
  name: str(d.name, "Untitled item"),
  sku: str(d.sku),
  category: (CATEGORIES.some((c) => c.id === d.category) ? d.category : "other") as CategoryId,
  unit: str(d.unit, "pcs"),
  price: num(d.price),
  cost: num(d.cost),
  qty: num(d.qty),
  reorderLevel: num(d.reorderLevel),
  supplierId: opt(d.supplierId),
  supplierName: opt(d.supplierName),
  location: opt(d.location),
  notes: opt(d.notes),
  createdAt: num(d.createdAt),
  updatedAt: num(d.updatedAt),
});

const toOrder = (id: string, d: DocumentData): Order => ({
  id,
  number: str(d.number, "ORD"),
  customer: str(d.customer, "Walk-in customer"),
  phone: opt(d.phone),
  channel: (d.channel ?? "walk-in") as Channel,
  items: Array.isArray(d.items)
    ? d.items.map((i: DocumentData) => ({
        productId: str(i.productId),
        name: str(i.name),
        sku: str(i.sku),
        qty: num(i.qty),
        price: num(i.price),
        cost: num(i.cost),
      }))
    : [],
  total: num(d.total),
  status: (d.status ?? "pending") as OrderStatus,
  paid: d.paid === true,
  assignedId: opt(d.assignedId),
  assignedTo: opt(d.assignedTo),
  note: opt(d.note),
  ts: num(d.ts),
  updatedAt: num(d.updatedAt, num(d.ts)),
});

const toStaff = (id: string, d: DocumentData): StaffMember => ({
  id,
  name: str(d.name, "Team member"),
  role: (d.role ?? "Sales") as StaffRole,
  phone: str(d.phone),
  email: opt(d.email),
  shift: (d.shift ?? "Full day") as Shift,
  active: d.active !== false,
  note: opt(d.note),
  joined: num(d.joined),
});

const toSupplier = (id: string, d: DocumentData): Supplier => ({
  id,
  name: str(d.name, "Supplier"),
  contact: str(d.contact),
  phone: str(d.phone),
  email: opt(d.email),
  address: opt(d.address),
  notes: opt(d.notes),
});

const toActivity = (id: string, d: DocumentData): Activity => ({
  id,
  kind: (d.kind ?? "product") as ActivityKind,
  title: str(d.title),
  detail: str(d.detail),
  ts: num(d.ts),
  actor: opt(d.actor),
  productId: opt(d.productId),
  orderId: opt(d.orderId),
  delta: typeof d.delta === "number" ? d.delta : undefined,
});

/* ------------------------------ subscriptions ----------------------------- */

function sub<T>(
  uid: string,
  name: string,
  constraints: QueryConstraint[],
  map: (id: string, d: DocumentData) => T,
  onData: (rows: T[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(query(col(uid, name), ...constraints), (snap) => onData(snap.docs.map((d) => map(d.id, d.data()))), onError);
}

export const subscribeProducts = (uid: string, cb: (r: Product[]) => void, err: (e: unknown) => void) =>
  sub(uid, "products", [orderBy("name")], toProduct, cb, err);
export const subscribeOrders = (uid: string, cb: (r: Order[]) => void, err: (e: unknown) => void) =>
  sub(uid, "orders", [orderBy("ts", "desc"), limit(300)], toOrder, cb, err);
export const subscribeStaff = (uid: string, cb: (r: StaffMember[]) => void, err: (e: unknown) => void) =>
  sub(uid, "staff", [orderBy("name")], toStaff, cb, err);
export const subscribeSuppliers = (uid: string, cb: (r: Supplier[]) => void, err: (e: unknown) => void) =>
  sub(uid, "suppliers", [orderBy("name")], toSupplier, cb, err);
export const subscribeActivity = (uid: string, cb: (r: Activity[]) => void, err: (e: unknown) => void) =>
  sub(uid, "activity", [orderBy("ts", "desc"), limit(150)], toActivity, cb, err);

/* -------------------------------- products -------------------------------- */

export const generateSku = (category: CategoryId) => {
  const prefix = CATEGORIES.find((c) => c.id === category)?.prefix ?? "SKU";
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export function createProduct(uid: string, input: ProductInput, actor: string): Promise<Result> {
  return run(async () => {
    validateProduct(input);
    const sku = input.sku.trim().toUpperCase();
    await assertUniqueSku(uid, sku);
    const r = doc(col(uid, "products"));
    const skuRef = ref(uid, "skuIndex", encodeURIComponent(sku));
    const now = Date.now();
    await runTransaction(db, async (t) => {
      const skuSnap = await t.get(skuRef);
      if (skuSnap.exists()) throw new InventoryError(`SKU ${sku} is already in use.`);
      t.set(r, clean({ ...input, sku, createdAt: now, updatedAt: now }));
      t.set(skuRef, { productId: r.id });
      logActivity(t, uid, {
        kind: input.qty > 0 ? "stock_in" : "product",
        title: `Added ${input.name}`,
        detail: input.qty > 0 ? `Opening stock of ${input.qty} ${input.unit}` : "New item created",
        actor,
        productId: r.id,
        delta: input.qty > 0 ? input.qty : undefined,
      });
    });
    return r.id;
  });
}

/** Edits item details. Quantity changes go through `adjustStock` so they're always logged. */
export function updateProduct(uid: string, id: string, patch: Partial<Omit<ProductInput, "qty">>, actor: string): Promise<Result> {
  return run(async () => {
    validateProduct(patch);
    const sku = patch.sku?.trim().toUpperCase();
    if (sku) await assertUniqueSku(uid, sku, id);
    await runTransaction(db, async (t) => {
      const productRef = ref(uid, "products", id);
      const current = await t.get(productRef);
      if (!current.exists()) throw new InventoryError("That item no longer exists.");
      const oldSku = str(current.data().sku).trim().toUpperCase();
      const oldSkuRef = sku && oldSku ? ref(uid, "skuIndex", encodeURIComponent(oldSku)) : undefined;
      const newSkuRef = sku ? ref(uid, "skuIndex", encodeURIComponent(sku)) : undefined;
      const [oldSkuSnap, newSkuSnap] = await Promise.all([
        oldSkuRef ? t.get(oldSkuRef) : Promise.resolve(null),
        newSkuRef ? t.get(newSkuRef) : Promise.resolve(null),
      ]);
      if (newSkuSnap?.exists() && newSkuSnap.data()?.productId !== id) {
        throw new InventoryError(`SKU ${sku} is already in use.`);
      }
      t.update(productRef, { ...clean({ ...patch, sku }), updatedAt: Date.now() });
      if (newSkuRef) t.set(newSkuRef, { productId: id });
      if (oldSkuRef && oldSku !== sku && oldSkuSnap?.data()?.productId === id) t.delete(oldSkuRef);
      logActivity(t, uid, { kind: "product", title: `Updated ${patch.name ?? "item"}`, detail: "Item details edited", actor, productId: id });
    });
    return id;
  });
}

export function deleteProduct(uid: string, id: string, name: string, actor: string): Promise<Result> {
  return run(async () => {
    await runTransaction(db, async (t) => {
      const productRef = ref(uid, "products", id);
      const product = await t.get(productRef);
      if (!product.exists()) throw new InventoryError("That item no longer exists.");
      const sku = str(product.data().sku).trim().toUpperCase();
      const skuRef = sku ? ref(uid, "skuIndex", encodeURIComponent(sku)) : undefined;
      const skuSnap = skuRef ? await t.get(skuRef) : null;
      t.delete(productRef);
      if (skuRef && skuSnap?.data()?.productId === id) t.delete(skuRef);
      logActivity(t, uid, { kind: "product", title: `Removed ${name}`, detail: "Item deleted from inventory", actor });
    });
    return id;
  });
}

/** Adds (`delta` > 0) or removes (`delta` < 0) stock atomically and writes a history entry. */
export function adjustStock(uid: string, productId: string, delta: number, reason: string, actor: string): Promise<Result> {
  return run(async () => {
    if (!Number.isInteger(delta) || delta === 0) throw new InventoryError("Enter a whole quantity greater than zero.");
    await runTransaction(db, async (t) => {
      const pr = ref(uid, "products", productId);
      const snap = await t.get(pr);
      if (!snap.exists()) throw new InventoryError("That item no longer exists.");
      const p = toProduct(snap.id, snap.data());
      const next = p.qty + delta;
      if (next < 0) throw new InventoryError(`Only ${p.qty} ${p.unit} in stock. You can't remove ${Math.abs(delta)}.`);
      t.update(pr, { qty: next, updatedAt: Date.now() });
      logActivity(t, uid, {
        kind: delta > 0 ? "stock_in" : "stock_out",
        title: `${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} ${p.unit} · ${p.name}`,
        detail: `${reason} · now ${next} ${p.unit}`,
        actor,
        productId: productId,
        delta,
      });
    });
    return productId;
  });
}

/* --------------------------------- orders --------------------------------- */

export function createOrder(uid: string, input: NewOrderInput, actor: string): Promise<Result> {
  return run(async () => {
    // merge duplicate lines
    const wanted = new Map<string, number>();
    input.lines.forEach((l) => wanted.set(l.productId, (wanted.get(l.productId) ?? 0) + l.qty));
    if (!wanted.size) throw new InventoryError("Add at least one item to the order.");
    if ([...wanted.values()].some((qty) => !Number.isInteger(qty) || qty <= 0)) {
      throw new InventoryError("Order quantities must be whole numbers greater than zero.");
    }

    const orderRef = doc(col(uid, "orders"));
    let number = "";

    await runTransaction(db, async (t) => {
      const uSnap = await t.get(userRef(uid));
      const seq = num(uSnap.data()?.orderSeq) + 1;
      number = `ORD-${1000 + seq}`;

      const entries = [...wanted.entries()];
      const snaps = await Promise.all(entries.map(([id]) => t.get(ref(uid, "products", id))));

      const items: OrderItem[] = [];
      const updates: { r: DocumentReference; qty: number }[] = [];
      snaps.forEach((s, i) => {
        const qty = entries[i][1];
        if (!s.exists()) throw new InventoryError("One of the items is no longer in your inventory.");
        const p = toProduct(s.id, s.data());
        if (qty <= 0) throw new InventoryError(`Enter a valid quantity for ${p.name}.`);
        if (p.qty < qty) throw new InventoryError(`Only ${p.qty} ${p.unit} of ${p.name} in stock.`);
        items.push({ productId: p.id, name: p.name, sku: p.sku, qty, price: p.price, cost: p.cost });
        updates.push({ r: s.ref, qty: p.qty - qty });
      });

      const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const now = Date.now();

      updates.forEach((u) => t.update(u.r, { qty: u.qty, updatedAt: now }));
      t.set(userRef(uid), { orderSeq: seq }, { merge: true });
      t.set(
        orderRef,
        clean({
          number,
          customer: input.customer.trim() || "Walk-in customer",
          phone: input.phone?.trim() || undefined,
          channel: input.channel,
          items,
          total,
          status: "pending",
          paid: input.paid,
          assignedId: input.assignedId,
          assignedTo: input.assignedTo,
          note: input.note?.trim() || undefined,
          ts: now,
          updatedAt: now,
        }),
      );
      logActivity(t, uid, {
        kind: "order",
        title: `New order ${number}`,
        detail: `${input.customer.trim() || "Walk-in customer"} · ${items.length} item${items.length === 1 ? "" : "s"}`,
        actor,
        orderId: orderRef.id,
      });
      items.forEach((i) =>
        logActivity(t, uid, {
          kind: "stock_out",
          title: `Sold ${i.qty} · ${i.name}`,
          detail: `Order ${number}`,
          actor,
          productId: i.productId,
          orderId: orderRef.id,
          delta: -i.qty,
        }),
      );
    });
    return orderRef.id;
  });
}

/** Moves an order along its flow. Cancelling puts the stock back on the shelf. */
export function setOrderStatus(uid: string, orderId: string, status: OrderStatus, actor: string): Promise<Result> {
  return run(async () => {
    await runTransaction(db, async (t) => {
      const or = ref(uid, "orders", orderId);
      const snap = await t.get(or);
      if (!snap.exists()) throw new InventoryError("That order no longer exists.");
      const order = toOrder(snap.id, snap.data());
      if (order.status === status) return;
      if (order.status === "cancelled") throw new InventoryError("Cancelled orders can't be changed.");
      if (order.status === "delivered") throw new InventoryError("Delivered orders can't be changed.");
      const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { pending: "processing", processing: "ready", ready: "delivered" };
      if (status !== "cancelled" && status !== nextStatus[order.status]) {
        throw new InventoryError("Orders must move through each step in order.");
      }

      const now = Date.now();
      if (status === "cancelled") {
        const pSnaps = await Promise.all(order.items.map((i) => t.get(ref(uid, "products", i.productId))));
        pSnaps.forEach((ps, idx) => {
          if (!ps.exists()) return; // item was deleted since; nothing to restock
          const item = order.items[idx];
          t.update(ps.ref, { qty: num(ps.data().qty) + item.qty, updatedAt: now });
          logActivity(t, uid, {
            kind: "stock_in",
            title: `Returned ${item.qty} · ${item.name}`,
            detail: `Order ${order.number} cancelled`,
            actor,
            productId: item.productId,
            orderId,
            delta: item.qty,
          });
        });
      }
      t.update(or, { status, updatedAt: now });
      logActivity(t, uid, {
        kind: "order",
        title: `${order.number} ${status === "cancelled" ? "cancelled" : "marked " + status}`,
        detail: order.customer,
        actor,
        orderId,
      });
    });
    return orderId;
  });
}

export function setOrderPaid(uid: string, orderId: string, paid: boolean, number: string, actor: string): Promise<Result> {
  return run(async () => {
    await runTransaction(db, async (t) => {
      const orderRef = ref(uid, "orders", orderId);
      const snap = await t.get(orderRef);
      if (!snap.exists()) throw new InventoryError("That order no longer exists.");
      if (snap.data().status === "cancelled") throw new InventoryError("Cancelled orders can't be paid.");
      t.update(orderRef, { paid, updatedAt: Date.now() });
      logActivity(t, uid, { kind: "order", title: `${number} ${paid ? "paid" : "marked unpaid"}`, detail: "Payment updated", actor, orderId });
    });
    return orderId;
  });
}

/* ---------------------------------- staff --------------------------------- */

export function saveStaff(uid: string, id: string | null, input: StaffInput, actor: string): Promise<Result> {
  return run(async () => {
    if (!input.name.trim()) throw new InventoryError("Enter the team member's name.");
    if (!validEmail(input.email)) throw new InventoryError("Enter a valid email address.");
    const r = id ? ref(uid, "staff", id) : doc(col(uid, "staff"));
    const batch = writeBatch(db);
    if (id) batch.update(r, clean({ ...input, email: input.email?.trim() || "", note: input.note?.trim() || "" }));
    else batch.set(r, clean({ ...input, joined: Date.now() }));
    logActivity(batch, uid, { kind: "staff", title: `${id ? "Updated" : "Added"} ${input.name}`, detail: `${input.role} · ${input.shift} shift`, actor });
    await batch.commit();
    return r.id;
  });
}

export function setStaffActive(uid: string, id: string, active: boolean): Promise<Result> {
  return run(async () => {
    await updateDoc(ref(uid, "staff", id), { active });
    return id;
  });
}

export function removeStaff(uid: string, id: string, name: string, actor: string): Promise<Result> {
  return run(async () => {
    const batch = writeBatch(db);
    batch.delete(ref(uid, "staff", id));
    logActivity(batch, uid, { kind: "staff", title: `Removed ${name}`, detail: "Team member deleted", actor });
    await batch.commit();
    return id;
  });
}

/* -------------------------------- suppliers ------------------------------- */

export function saveSupplier(uid: string, id: string | null, input: SupplierInput, actor: string): Promise<Result> {
  return run(async () => {
    if (!input.name.trim()) throw new InventoryError("Enter the supplier's name.");
    if (!validEmail(input.email)) throw new InventoryError("Enter a valid email address.");
    const r = id ? ref(uid, "suppliers", id) : doc(col(uid, "suppliers"));
    const batch = writeBatch(db);
    batch.set(r, clean({ ...input, email: input.email?.trim() || "", address: input.address?.trim() || "", notes: input.notes?.trim() || "" }));
    logActivity(batch, uid, { kind: "supplier", title: `${id ? "Updated" : "Added"} ${input.name}`, detail: "Supplier saved", actor });
    await batch.commit();
    return r.id;
  });
}

export function removeSupplier(uid: string, id: string, name: string, actor: string): Promise<Result> {
  return run(async () => {
    const batch = writeBatch(db);
    batch.delete(ref(uid, "suppliers", id));
    logActivity(batch, uid, { kind: "supplier", title: `Removed ${name}`, detail: "Supplier deleted", actor });
    await batch.commit();
    return id;
  });
}

/* ------------------------------- sample data ------------------------------ */

const DAY = 86_400_000;

/** Fills an empty account with a believable shop so every screen has something to show. */
export function seedSampleData(uid: string, actor: string): Promise<Result> {
  return run(async () => {
    const now = Date.now();
    const batch = writeBatch(db);

    const suppliers = [
      { name: "Lagos Fresh Distributors", contact: "Ifeanyi Okoro", phone: "0803 555 0142", email: "orders@lagosfresh.example", address: "Ikeja, Lagos", notes: "Delivers Tuesdays and Fridays" },
      { name: "Prime Household Supplies", contact: "Hauwa Sani", phone: "0805 555 0177", email: "sales@primehousehold.example", address: "Apapa, Lagos", notes: "Net 14 payment terms" },
      { name: "Techpoint Wholesale", contact: "Emeka Dike", phone: "0807 555 0119", email: "hello@techpoint.example", address: "Computer Village, Ikeja", notes: "Minimum order of 20 units" },
    ].map((s) => ({ ...s, ref: doc(col(uid, "suppliers")) }));
    suppliers.forEach(({ ref: r, ...s }) => batch.set(r, s));
    const [fresh, house, tech] = suppliers;

    type Seed = [string, string, CategoryId, string, number, number, number, number, typeof fresh, string];
    const seeds: Seed[] = [
      ["Instant Coffee 200g", "BEV-1001", "beverages", "pack", 3800, 2900, 46, 15, fresh, "A1"],
      ["Bottled Water 75cl (12-pack)", "BEV-1002", "beverages", "pack", 2400, 1800, 9, 20, fresh, "A2"],
      ["Orange Juice 1L", "BEV-1003", "beverages", "bottle", 1900, 1350, 0, 12, fresh, "A3"],
      ["Basmati Rice 5kg", "GRO-2001", "groceries", "pack", 9800, 8200, 38, 12, fresh, "B1"],
      ["Spaghetti 500g", "GRO-2002", "groceries", "pack", 1250, 900, 120, 40, fresh, "B2"],
      ["Vegetable Oil 3L", "GRO-2003", "groceries", "bottle", 7600, 6400, 7, 15, fresh, "B3"],
      ["Granulated Sugar 1kg", "GRO-2004", "groceries", "pack", 1700, 1300, 64, 25, fresh, "B4"],
      ["Tomato Paste 400g", "GRO-2005", "groceries", "pcs", 1100, 780, 85, 30, fresh, "B5"],
      ["Dish Soap 750ml", "HOU-3001", "household", "bottle", 2100, 1500, 33, 15, house, "C1"],
      ["Laundry Detergent 2kg", "HOU-3002", "household", "pack", 4300, 3300, 5, 10, house, "C2"],
      ["Tissue Rolls (10-pack)", "HOU-3003", "household", "pack", 3200, 2400, 52, 20, house, "C3"],
      ["Shea Body Butter 250g", "HBT-4001", "beauty", "pcs", 4500, 2800, 26, 10, house, "D1"],
      ["Toothpaste 120g", "HBT-4002", "beauty", "pcs", 1400, 950, 70, 30, house, "D2"],
      ["USB-C Cable 1m", "ELE-5001", "electronics", "pcs", 3500, 1900, 18, 10, tech, "E1"],
      ["Power Bank 10,000mAh", "ELE-5002", "electronics", "pcs", 14500, 10800, 4, 6, tech, "E2"],
      ["A4 Notebook 80pg", "STA-6001", "stationery", "pcs", 900, 520, 140, 50, tech, "F1"],
    ];
    const products = seeds.map(([name, sku, category, unit, price, cost, qty, reorderLevel, sup, location], i) => {
      const r = doc(col(uid, "products"));
      batch.set(ref(uid, "skuIndex", encodeURIComponent(sku)), { productId: r.id });
      batch.set(
        r,
        clean({
          name, sku, category, unit, price, cost, qty, reorderLevel, location,
          supplierId: sup.ref.id,
          supplierName: sup.name,
          createdAt: now - (30 - i) * DAY,
          updatedAt: now - (i % 6) * DAY,
        }),
      );
      return { id: r.id, name, sku, price, cost };
    });

    const staffSeed: [string, StaffRole, string, string, Shift, boolean][] = [
      ["Amaka Obi", "Manager", "0802 555 0101", "amaka@example.com", "Full day", true],
      ["Tunde Bello", "Cashier", "0803 555 0102", "tunde@example.com", "Morning", true],
      ["Ngozi Eze", "Storekeeper", "0805 555 0103", "ngozi@example.com", "Afternoon", true],
      ["Musa Ibrahim", "Dispatch", "0806 555 0104", "", "Full day", true],
      ["Sola Adeyemi", "Packer", "0809 555 0105", "", "Evening", false],
    ];
    const staff = staffSeed.map(([name, role, phone, email, shift, active], i) => {
      const r = doc(col(uid, "staff"));
      batch.set(r, clean({ name, role, phone, email: email || undefined, shift, active, joined: now - (200 - i * 30) * DAY }));
      return { id: r.id, name };
    });

    // [daysAgo, hour, customer, channel, status, paid, staffIdx, [productIdx, qty][]]
    type OrderSeed = [number, number, string, Channel, OrderStatus, boolean, number, [number, number][]];
    const orderSeeds: OrderSeed[] = [
      [6, 11, "Chinedu Okafor", "walk-in", "delivered", true, 1, [[0, 2], [4, 6], [6, 3]]],
      [6, 15, "Mama Put Kitchen", "phone", "delivered", true, 3, [[3, 4], [5, 2], [7, 10]]],
      [5, 10, "Walk-in customer", "walk-in", "delivered", true, 1, [[8, 1], [12, 2]]],
      [4, 13, "Bisi Adewale", "online", "delivered", true, 3, [[11, 2], [10, 1], [12, 3]]],
      [3, 9, "Prime Mini-Mart", "phone", "delivered", true, 0, [[3, 6], [4, 24], [6, 12], [10, 6]]],
      [3, 16, "Walk-in customer", "walk-in", "cancelled", false, 1, [[13, 1]]],
      [2, 12, "Kunle Martins", "online", "delivered", true, 3, [[14, 1], [13, 2]]],
      [2, 17, "Walk-in customer", "walk-in", "delivered", true, 1, [[15, 4], [2, 2]]],
      [1, 10, "Grace Nwosu", "phone", "delivered", false, 3, [[0, 3], [8, 2], [9, 1]]],
      [1, 14, "Hope Academy", "phone", "delivered", true, 0, [[15, 30], [13, 5]]],
      [0, 8, "Walk-in customer", "walk-in", "delivered", true, 1, [[1, 3], [6, 2]]],
      [0, 9, "Tola Bakare", "online", "processing", true, 2, [[3, 2], [5, 1], [8, 1]]],
      [0, 10, "Sunrise Pharmacy", "phone", "pending", false, 3, [[11, 6], [12, 12]]],
      [0, 11, "Walk-in customer", "walk-in", "pending", true, 1, [[14, 1], [13, 1]]],
    ];
    orderSeeds.forEach(([daysAgo, hour, customer, channel, status, paid, si, lines], idx) => {
      const d = new Date(now - daysAgo * DAY);
      d.setHours(hour, 15, 0, 0);
      const ts = Math.min(d.getTime(), now - 60_000 * (orderSeeds.length - idx));
      const items: OrderItem[] = lines.map(([pi, qty]) => ({ productId: products[pi].id, name: products[pi].name, sku: products[pi].sku, qty, price: products[pi].price, cost: products[pi].cost }));
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      const r = doc(col(uid, "orders"));
      batch.set(r, clean({ number: `ORD-${1001 + idx}`, customer, channel, items, total, status, paid, assignedId: staff[si].id, assignedTo: staff[si].name, ts, updatedAt: ts }));
    });
    batch.set(userRef(uid), { orderSeq: orderSeeds.length }, { merge: true });

    const log: [ActivityKind, string, string, number][] = [
      ["order", "New order ORD-1014", "Walk-in customer · 2 items", 0.01],
      ["stock_in", "Added 40 pack · Spaghetti 500g", "Restock · now 120 pack", 0.4],
      ["stock_out", "Removed 3 bottle · Orange Juice 1L", "Damaged · now 0 bottle", 1.1],
      ["staff", "Added Sola Adeyemi", "Packer · Evening shift", 2.2],
      ["supplier", "Added Techpoint Wholesale", "Supplier saved", 3.3],
    ];
    log.forEach(([kind, title, detail, d]) => logActivity(batch, uid, { kind, title, detail, actor, ts: now - d * DAY }));

    await batch.commit();
    return uid;
  });
}
