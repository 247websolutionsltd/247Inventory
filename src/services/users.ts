import { doc, onSnapshot, runTransaction, serverTimestamp, setDoc, type DocumentSnapshot, type Unsubscribe } from "firebase/firestore";

import type { User } from "firebase/auth";
import { db } from "../config/firebase";

/**
 * users/{uid} is the business account: the signed-in user is the owner, and every inventory
 * collection (products, orders, staff, suppliers, activity) lives beneath it.
 */
export type UserProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  businessName: string;
  businessType: string;
  address: string;
  lowStockAlerts: boolean;
};

export const DEFAULT_BUSINESS_TYPE = "Retail shop";

export const userRef = (uid: string) => doc(db, "users", uid);

export function toProfile(snap: DocumentSnapshot): UserProfile | null {
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    email: d.email,
    displayName: d.displayName,
    photoURL: d.photoURL,
    phone: d.phone ?? d.phoneNumber ?? "",
    businessName: d.businessName ?? "",
    businessType: d.businessType ?? DEFAULT_BUSINESS_TYPE,
    address: d.address ?? "",
    lowStockAlerts: d.lowStockAlerts !== false,
  };
}

/**
 * Idempotent: creates the business document for a new user and fills in any fields that are
 * missing on older documents. Safe to call on every sign-in.
 */
export async function ensureUserAccount(
  user: User,
  extra: { displayName?: string; phone?: string; businessName?: string } = {},
): Promise<void> {
  const ref = userRef(user.uid);
  const displayName = extra.displayName?.trim() || user.displayName || undefined;

  await runTransaction(db, async (t) => {
    const snap = await t.get(ref);

    if (!snap.exists()) {
      t.set(ref, {
        uid: user.uid,
        ...(user.email ? { email: user.email } : {}),
        ...(displayName ? { displayName } : {}),
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        phone: extra.phone?.trim() ?? "",
        businessName: extra.businessName?.trim() ?? "",
        businessType: DEFAULT_BUSINESS_TYPE,
        address: "",
        lowStockAlerts: true,
        orderSeq: 0,
        createdAt: Date.now(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const d = snap.data();
    const patch: Record<string, unknown> = {};
    if (d.businessName === undefined) patch.businessName = extra.businessName?.trim() ?? "";
    if (extra.businessName?.trim() && !d.businessName) patch.businessName = extra.businessName.trim();
    if (!d.businessType) patch.businessType = DEFAULT_BUSINESS_TYPE;
    if (typeof d.lowStockAlerts !== "boolean") patch.lowStockAlerts = true;
    if (typeof d.orderSeq !== "number") patch.orderSeq = 0;
    if (!d.phone && d.phoneNumber) patch.phone = d.phoneNumber;
    if (extra.displayName?.trim() && d.displayName !== extra.displayName.trim()) patch.displayName = extra.displayName.trim();
    if (extra.phone?.trim() && d.phone !== extra.phone.trim()) patch.phone = extra.phone.trim();
    if (!d.email && user.email) patch.email = user.email;

    if (Object.keys(patch).length) t.set(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  });
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => onData(toProfile(snap)), onError);
}

/** Only the fields an owner may edit directly. The order counter is never written from here. */
export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "displayName" | "phone" | "businessName" | "businessType" | "address" | "lowStockAlerts">>,
) {
  await setDoc(userRef(uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}
