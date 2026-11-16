# Firebase Firestore and Storage Security Specification

## 1. Purpose and scope

This document describes the Firebase data model and client behavior observed in the Stockroom Expo application. It is intended as input for designing application-specific Firestore and Storage Security Rules; it is not itself a rules file or a claim that the currently deployed Firebase rules match the repository.

The inspection covered the Expo Router screens, shared form and display components, contexts/hooks, Firebase services/configuration, TypeScript data types, Firebase configuration and checked-in rules. The local `.env` file was not inspected or copied. Firebase client configuration is read from `EXPO_PUBLIC_FIREBASE_*` variables in `src/config/firebase.ts`.

**Important distinction:** the app's client-side checks and transactions describe intended workflows, but any client can call Firebase directly. Only server-enforced rules (or trusted backend code) provide enforcement. The application currently has no Cloud Functions or other trusted Firebase backend.

## 2. Application purpose and implemented workflows

Stockroom is a single-business inventory and order-management app. Firebase Authentication identifies the business owner; Firestore stores the owner's account and business records. Live Firestore listeners synchronize the data displayed across screens.

| Area / route | Implemented behavior and data |
|---|---|
| Splash, onboarding (`/`, `/onboard`) | Reads/writes only local AsyncStorage for onboarding completion. Routes to sign-in or the app based on local state and Firebase Auth state. No Firestore onboarding records. |
| Authentication (`/auth/logIn`, `/auth/register`, `/auth/forgot`) | Email/password sign-up and sign-in; password-reset email. Registration creates an Auth user, sets the Auth display name and creates/repairs `users/{uid}`. Registration form checks required fields, an eight-character minimum, and matching passwords. Sign-in requires email/password. Password reset checks email shape. |
| Overview (`/(tabs)/home`) | Displays stock and sales summaries, recent activity/attention indicators, active staff and quick navigation. Values are calculated from the signed-in owner's loaded Firestore records. An owner can explicitly load sample shop data when the app is empty. |
| Inventory (`/(tabs)/inventory`, `/inventory/edit`, `/inventory/{id}`) | Lists and locally filters products by name/SKU, category and stock status. Create/edit/delete products; add/remove stock with a reason; display supplier relationship, valuation and activity history. Product quantity changes are intended to use stock adjustment or order transactions, not the edit form. |
| Orders (`/(tabs)/orders`, `/orders/new`, `/orders/{id}`) | Search/filter orders; create an order from in-stock products; optionally associate a customer, phone, channel, active staff member and note; mark paid/unpaid; advance status; cancel an order and return its stock. |
| Team (`/(tabs)/staff`, `/staff/edit`, `/staff/{id}`) | Create/edit/delete staff records, toggle active status, review shifts/contact details and view associated orders. Staff are records only and cannot sign in. |
| Suppliers (`/suppliers`, `/suppliers/edit`, `/suppliers/{id}`) | Create/edit/delete supplier records, contact suppliers by external phone/email apps and see products linked by supplier ID. Product records retain copied supplier name/ID values when the supplier is deleted. |
| Reports (`/reports`) | Client-side 7- and 30-day calculations from the available order snapshots: revenue, estimated gross profit, unpaid totals, top sellers and inventory value by category. |
| Alerts (`/alerts`) | Client-derived low/out-of-stock, long-pending and delivered-unpaid alerts. The profile's `lowStockAlerts` value hides stock alerts in this screen. |
| Activity (`/activity`) | Displays up to the latest 150 activity documents; entries with product/order IDs navigate to the corresponding record. |
| Account and support (`/account/edit-profile`, `/account/security`, `/account/privacy-policy`, `/support`) | Update owner/business profile; send password reset email; show privacy/support information. There is no account deletion or data-export workflow implemented in the app. |
| More (`/(tabs)/more`) | Sign out, theme preference (in-memory UI state), toggle low-stock preference, navigation to reports/alerts/suppliers/activity/security/support/privacy, and sample-data option when there are no products. |

Navigation uses Expo Router. `src/app/_layout.tsx` redirects unauthenticated visitors away from private routes; this is a UX guard, **not** a substitute for Firebase Rules. Forms use shared `Input`/`ChipField` components and perform some client-side validation; these checks can be bypassed by direct Firestore requests.

## 3. Principals, roles and permissions

### Implemented principals

| Principal | Identity / role | Intended permissions |
|---|---|---|
| Signed-out visitor | No `request.auth`; can view public onboarding/auth/support/privacy UI. | No access to private Firestore business data. |
| Business owner | One Firebase Auth account; the Auth UID is the owner ID and the root key in `users/{uid}`. | Read and manage that owner's profile, inventory, orders, staff, suppliers, SKU index and activity, subject to the intended workflows below. |
| Staff member | A document in `users/{uid}/staff/{staffId}` with a descriptive role label. | **No independent authentication or Firebase permissions exist.** Staff roles such as Manager, Cashier, Storekeeper, Packer, Dispatch and Sales are display/business labels, not authorization roles. |
| Supplier / customer | Contact data embedded in the owner's supplier, order and activity records. | No app account or direct access. |

There is no multi-tenant business membership, invitation, separate employee sign-in, custom-claims role, administrator role, public sharing, or cross-owner data access implemented. Do not infer access control from a staff role field. The UI and README describe a single-owner account.

### Intended access matrix

“Owner” below means `request.auth != null && request.auth.uid == {uid}` for the `users/{uid}` path. Every other user, including another authenticated owner, should be denied.

| Path | Read | Create | Update | Delete | App behavior |
|---|---:|---:|---:|---:|---|
| `users/{uid}` | Owner | Owner | Owner | No UI operation; current checked-in rules deny | Profile listener; profile setup/repair; profile edit; order-sequence counter update. |
| `users/{uid}/products/{productId}` | Owner | Owner | Owner | Owner | Product CRUD, stock adjustments and transactional order stock updates. |
| `users/{uid}/orders/{orderId}` | Owner | Owner | Owner | No delete UI operation | Create; update status/payment; cancellation/restock. |
| `users/{uid}/staff/{staffId}` | Owner | Owner | Owner | Owner | Staff CRUD and active flag update. |
| `users/{uid}/suppliers/{supplierId}` | Owner | Owner | Owner | Owner | Supplier CRUD. |
| `users/{uid}/activity/{activityId}` | Owner | Owner | No app update | No app delete | App appends audit/history entries and reads them. |
| `users/{uid}/skuIndex/{encodedSku}` | Owner | Owner | Owner | Owner | Internal SKU-to-product mapping; maintained by product create/edit/delete and sample-data batch. |

For private account data, an absent/invalid authentication context must not gain access. Rules should explicitly scope access to the UID in the document path; a route guard or a client-supplied `uid`, `actor`, staff ID, or email is not proof of identity.

## 4. Firestore data layout and schema

All application business records are directly below the owner's root document:

```text
users/{uid}
  products/{productId}
  orders/{orderId}
  staff/{staffId}
  suppliers/{supplierId}
  activity/{activityId}
  skuIndex/{encodedSku}
```

There are no additional nested subcollections in the inspected code. IDs for business records are generated Firestore document IDs, except SKU-index document IDs, which are `encodeURIComponent(uppercasedSku)`. No schema migration code or database-generated TypeScript models are present; data types are declared in `src/services/inventory.ts` and `src/services/users.ts`.

### Owner profile: `users/{uid}`

| Field | Stored type / presence | Meaning and notes |
|---|---|---|
| `uid` | string; set on initial creation | Must equal the `{uid}` path segment. |
| `email` | optional string | Copied from Firebase Auth when available; the document value is client-writable in the present implementation. |
| `displayName` | optional string | Owner name; also updated in Firebase Auth profile. |
| `photoURL` | optional string | Auth profile value may be copied, but the app does not upload or display profile images. |
| `phone` | string in new profiles; may be absent in older documents | Owner contact number. |
| `phoneNumber` | optional string, legacy compatibility | `toProfile` falls back to this value when `phone` is missing. |
| `businessName` | string in new profiles | Business name. |
| `businessType` | string in new profiles | UI choices: Retail shop, Supermarket, Wholesale, Pharmacy, Restaurant, Warehouse, Other. |
| `address` | string in new profiles | Business address. |
| `lowStockAlerts` | boolean in new profiles | Defaults to `true`; owner preference. |
| `orderSeq` | non-negative integer in new profiles | Counter used by the client to create display order numbers. Incremented transactionally with order creation; current client also writes it during sample-data loading. |
| `createdAt` | number (epoch milliseconds) | Set with `Date.now()` on initial profile creation. |
| `updatedAt` | Firestore Timestamp in account setup/repair/profile-edit writes | Uses `serverTimestamp()`; unlike inventory timestamps this is not a millisecond number. |

`toProfile` supplies defaults for several missing values. Account repair may fill missing fields on sign-in. Existing checked-in profile rules allow `phoneNumber` in the schema, but their profile update affected-key list does not permit changing that legacy field. The update allowlist also currently permits some fields (including `uid`/`email`) beyond what the profile-edit screen changes.

### Product: `users/{uid}/products/{productId}`

| Field | Stored type | Meaning / observed constraints |
|---|---|---|
| `name` | string | Required by product form/service; trimmed. |
| `sku` | string | Required after generation; uppercased by service; at most 64 characters in service validation; intended unique within one owner's products. |
| `category` | string enum | `beverages`, `groceries`, `household`, `beauty`, `electronics`, `apparel`, `stationery`, `other`. |
| `unit` | string | UI choices: `pcs`, `box`, `pack`, `carton`, `bottle`, `kg`, `litre`. |
| `price` | number | Selling price; client requires finite and greater than zero. |
| `cost` | number | Unit cost; client requires finite and non-negative. Sensitive business/financial data. |
| `qty` | integer number | Non-negative stock quantity in normal workflows. Product creation supports opening quantity; later changes are intended through stock/order transactions. |
| `reorderLevel` | non-negative integer number | Low-stock threshold. |
| `supplierId` | optional string (empty string also used during edit) | ID of an owner-scoped supplier document. |
| `supplierName` | optional string (empty string also used during edit) | Copied supplier display name, not a live join. |
| `location` | optional string (empty string also used during edit) | Shelf/warehouse location. |
| `notes` | optional string (empty string also used during edit) | Owner-entered product notes. |
| `createdAt` | number (epoch milliseconds) | Client `Date.now()`; sample rows use historical millisecond values. |
| `updatedAt` | number (epoch milliseconds) | Client `Date.now()`, changed on product edits, stock adjustments and order stock changes. |

The service's form-level validation checks names/SKU, positive finite price, non-negative finite cost and integer non-negative quantity/reorder level. It does not impose a declared string-length bound for most other fields.

### Order: `users/{uid}/orders/{orderId}`

| Field | Stored type | Meaning / observed constraints |
|---|---|---|
| `number` | string | Display identifier `ORD-${1000 + orderSeq}`; not the Firestore document ID. |
| `customer` | string | Trimmed name; blank input becomes `Walk-in customer`. |
| `phone` | optional string | Customer contact. |
| `channel` | string enum | `walk-in`, `phone`, `online`. |
| `items` | array of maps | Non-empty in normal order creation; line schema below. |
| `total` | number | Computed by client as sum of line `price * qty`. |
| `status` | string enum | `pending`, `processing`, `ready`, `delivered`, `cancelled`. New orders start `pending`. |
| `paid` | boolean | Initial payment state from form; can be toggled unless cancelled. |
| `assignedId` | optional string | Staff document ID; selected from active staff in the UI. |
| `assignedTo` | optional string | Copied staff name; may remain after staff deletion. |
| `note` | optional string | Owner-entered delivery/special instructions. |
| `ts` | number (epoch milliseconds) | Creation time; used for order sorting, ranges and order numbers in reports. |
| `updatedAt` | number (epoch milliseconds) | Client update time for status/payment changes. |

Each `items[]` map contains:

| Field | Stored type | Meaning |
|---|---|---|
| `productId` | string | Product document ID. |
| `name` | string | Snapshot of product name at time of order. |
| `sku` | string | Snapshot of product SKU. |
| `qty` | positive integer number | Quantity sold. Duplicate product lines are combined before normal creation. |
| `price` | number | Selling-price snapshot. |
| `cost` | number | Cost snapshot used for gross-profit calculations; sensitive financial data. |

Order totals, line values, status, payment flags, assignment fields and timestamps are generated or modified by client code and are therefore untrusted input at the rules boundary. The UI/client enforces status progression and stock effects; rules do not automatically inherit those checks.

### Staff: `users/{uid}/staff/{staffId}`

| Field | Stored type | Meaning / observed constraints |
|---|---|---|
| `name` | string | Required, non-empty after trimming in the form/service. |
| `role` | string enum | `Manager`, `Cashier`, `Storekeeper`, `Packer`, `Dispatch`, `Sales`; descriptive only, not auth authorization. |
| `phone` | string | Contact detail; form supplies a string. |
| `email` | optional string | Contact detail; when non-empty, client checks a basic email pattern. |
| `shift` | string enum | `Morning`, `Afternoon`, `Evening`, `Full day`. |
| `active` | boolean | New staff default to `true`; inactive staff are hidden from order assignment choices. |
| `note` | optional string | Owner-entered notes. |
| `joined` | number (epoch milliseconds) | Set on creation; sample data uses historical values. |

`setStaffActive` updates only `active` and does not append an activity record. Staff deletion leaves order assignment snapshots intact.

### Supplier: `users/{uid}/suppliers/{supplierId}`

| Field | Stored type | Meaning / observed constraints |
|---|---|---|
| `name` | string | Required, non-empty after trimming. |
| `contact` | string | Contact person; supplied as an empty string if omitted. |
| `phone` | string | Phone number; supplied as a string, potentially empty. |
| `email` | string | Form permits blank; save writes empty string when omitted. If non-empty, client checks a basic email pattern. |
| `address` | string | Form permits blank; save writes empty string when omitted. |
| `notes` | string | Form permits blank; save writes empty string when omitted. |

Supplier removal does not cascade to products. Products retain their supplier ID/name values.

### Activity: `users/{uid}/activity/{activityId}`

| Field | Stored type | Meaning / observed constraints |
|---|---|---|
| `kind` | string enum | `stock_in`, `stock_out`, `order`, `product`, `staff`, `supplier`. |
| `title` | string | Display headline. |
| `detail` | string | Display detail/reason. |
| `ts` | number (epoch milliseconds) | Event time; normally client `Date.now()`, but sample entries can be historical. |
| `actor` | optional string | Display name passed by client (normally owner name or `Owner`); it is not an authenticated UID and must not be trusted as identity evidence. |
| `productId` | optional string | Related product ID. |
| `orderId` | optional string | Related order ID. |
| `delta` | optional number | Signed stock change (positive inbound, negative outbound); can be absent for non-stock events. |

Activity is an app audit/history feed, not a verified security audit log: the owner client creates it, and current app operations do not uniformly log every mutation (for example staff active toggles).

### SKU index: `users/{uid}/skuIndex/{encodedSku}`

| Field | Stored type | Meaning |
|---|---|---|
| `productId` | string | Product document ID associated with the SKU. |

Document ID is the URI-encoded, uppercased SKU. Creation, SKU edit, deletion and sample-data seeding write/delete index entries. A product query is also used as a preflight duplicate check. Do not assume the index remains consistent merely because the client normally maintains it.

## 5. Firestore reads, queries and synchronization

All data calls use the Firebase Web SDK from `src/services/users.ts` and `src/services/inventory.ts`; UI reads are exposed through `AuthProvider` and `InventoryProvider`.

| Target | Actual access pattern |
|---|---|
| `users/{uid}` | `onSnapshot` document listener for the authenticated owner's profile. A transaction reads it during profile ensure/repair and order creation. Profile edits use merge `setDoc`; order creation/sample seeding merge-write `orderSeq`. |
| `users/{uid}/products` | Live collection query ordered by `name`; full result set, no Firestore limit. SKU duplicate preflight query is `where("sku", "==", normalizedSku)` with `limit(2)`. Transactions read specific product docs. |
| `users/{uid}/orders` | Live collection query ordered by `ts` descending with `limit(300)`. Reports, dashboard and staff detail then filter/aggregate these snapshots client-side. |
| `users/{uid}/staff` | Live collection query ordered by `name`; full result set. Staff metrics/assignment lookup are client-side. |
| `users/{uid}/suppliers` | Live collection query ordered by `name`; full result set. Product associations are computed client-side. |
| `users/{uid}/activity` | Live collection query ordered by `ts` descending with `limit(150)`. Product detail filters this loaded window client-side. |
| `users/{uid}/skuIndex` | No list listener or query; transactions read exact SKU-index documents by known encoded ID. |

The app does not use collection-group queries, public queries, pagination beyond the order/activity limits, Cloud Storage APIs or callable functions. Firestore Rules are not query filters: each collection query must be scoped such that all returned documents satisfy the authorization policy.

## 6. CRUD operations and business invariants

These are intended client workflows, not all currently rule-enforced invariants.

### Products and stock

- **Create:** validates product form values, normalizes SKU, checks for duplicates, then transactionally creates the product, its SKU-index mapping and an activity row. Positive opening stock is represented as `stock_in`; zero opening stock creates a `product` event.
- **Edit:** edits product details without quantity. Transaction reads current product and relevant SKU-index docs, updates SKU mappings if SKU changes and writes product activity.
- **Delete:** transaction deletes product and its matching SKU-index doc, and appends activity. Historical order item snapshots are retained; there is no cascade through orders.
- **Adjust stock:** transaction reads product, applies signed non-zero integer `delta`, rejects a negative resulting quantity, updates `qty`/`updatedAt` and writes activity with reason and signed delta.
- Stock category, reason strings and item details are validated principally in client code. `STOCK_REASONS` options include inbound Restock/Customer return/Count correction and outbound Damaged/Expired/Used in-house/Count correction.

### Orders

- **Create:** merges duplicate product lines and rejects empty orders/non-positive or non-integer quantities. Transaction reads owner profile sequence and selected products, checks availability, snapshots product names/SKUs/prices/costs, computes total and atomically updates product quantities, `orderSeq`, new pending order and order/stock activity entries.
- **Transition:** intended flow is `pending -> processing -> ready -> delivered`; cancellation is allowed before delivered/cancelled. Cancelled and delivered orders cannot be changed through the status function. Cancelling updates status and returns each extant product's quantity in the same transaction, with activity entries. A deleted product is skipped during restocking.
- **Payment:** transaction changes `paid` and `updatedAt`, and appends an order activity event. Cancelled orders cannot be marked paid; delivered orders may be toggled paid/unpaid.
- **Delete:** no order deletion UI/service operation exists.
- There is no external payment gateway or payment-card data. `paid` is an owner-entered boolean, not a verified payment status.

### Staff and suppliers

- Staff create/edit uses a Firestore write batch with an activity row. Create assigns `joined`; edit does not alter it. Active/inactive toggles use `updateDoc` for `active` only, with no activity write. Delete batches a staff delete and activity record. Assignment options list active staff, but the client-provided `assignedId`/`assignedTo` values are not trusted by rules.
- Supplier create/edit uses a batch and activity row; delete batches removal and activity. There is no supplier authentication, payment or purchase-order workflow.

### Profile and sample records

- Firebase Auth `onAuthStateChanged` calls `ensureUserAccount` for the signed-in user and subscribes to the owner profile. Sign-up calls profile ensure explicitly as well. Profile repair may fill defaults and copy Auth email/display name/phone/business name.
- Profile edit updates the Auth display name and merge-writes allowed business fields plus a server `updatedAt` timestamp. Low-stock preference is stored in this profile document.
- Sample data is a user-triggered client batch that writes three suppliers, sixteen products, their SKU index docs, five staff, fourteen orders, the profile counter and five activity entries (about 60 document writes). The data contains illustrative example names/contact details and is not production data. The seed function itself does not verify that the account is empty or prevent repeated calls; UI visibility is conditional but can be bypassed.

## 7. Data ownership, validation and security requirements

1. **Tenant boundary:** all Firestore paths are rooted at `users/{uid}`. A secure baseline must require an authenticated request and exact equality between `request.auth.uid` and the path UID for both the profile and every child collection. Never trust a client-supplied owner ID.
2. **No cross-account access:** deny access to another owner's profile and all descendant documents, even if a caller knows IDs. Deny unauthenticated reads/writes. There is no implementation evidence for sharing or admin exceptions.
3. **Field-level validation:** current client checks do not protect the database. Rules intended to support direct client writes should check allowed keys, required keys, exact primitive/map/list types, enum values, numeric bounds, array sizes and immutable-field behavior separately for create/update. Define limits for unbounded strings/lists if the product requirements provide them; the application does not specify those limits.
4. **Protect identity and counters:** tie profile `uid` to path UID. Treat `email` as sensitive and preferably require it to match a trusted Auth token claim if the app requires it. Do not permit a client to arbitrarily rewrite creation metadata. `orderSeq` is currently changed by the owner client, so an untrusted client can forge order numbers or reset/inflate the counter. Strong sequence integrity requires a trusted backend or carefully designed transactional rules; no backend exists today.
5. **Validate related IDs and denormalized fields:** product supplier references and order staff assignments should refer only to records under the same owner if they are required. The app copies supplier/staff names and product line values intentionally, so historical snapshots need not match current records after edits/deletes. The product/supplier and order/staff relationships are not enforced server-side in the current app.
6. **Protect business/financial data:** product costs, order cost snapshots, revenue, margins, customer contacts, staff/supplier contact details, owner phone/address, notes and stock quantities are private account data. All must remain owner-scoped. The client calculates reports; no server report endpoint exists.
7. **Do not trust activity provenance:** `actor`, `title`, `detail`, timestamps, IDs and `delta` are client-supplied. If an authoritative audit trail is required, create it in trusted backend code or tightly constrain writes in concert with business mutations.
8. **Enforce business invariants intentionally:** the client implements atomic transactions for SKU reservation, stock adjustment, order creation/cancellation and order/payment updates. Current broad client writes can bypass those workflows. Rules can validate individual writes and use transaction post-state checks, but complex multi-document consistency (including every order item, inventory change, sequence and matching activity) is difficult to guarantee comprehensively in rules. If tamper-resistant stock/order integrity is a requirement, move sensitive mutations into authenticated Cloud Functions/server code and restrict direct client writes to the corresponding data.
9. **Firestore Rules do not hide selected fields:** Firestore authorizes documents, not individual fields. Since the owner is the only current data reader, owner-only document access exposes every field in a record to that owner. If future staff accounts must see only selected fields (for example, hide product costs or customer data), separate the data or use a trusted backend; adding a staff `role` string alone cannot provide field-level filtering.
10. **Read-query compatibility:** the existing listeners are collection queries under the owner path, with `orderBy` and selected limits. Rules must allow the owner to read every document those queries may return; security rules do not remove unauthorized rows from a query.
11. **Delete/retention policy:** no in-app account deletion, Firestore account purge, export or retention process is implemented. Current checked-in rules deny profile deletion, but users can delete selected products/staff/suppliers and associated SKU index entries. Decide account closure and cascading-data behavior before adding it; do not assume deleting `users/{uid}` deletes subcollections.

## 8. Current repository rules vs. implemented data behavior

`firebase.json` points to `firestore.rules` and `storage.rules`. The checked-in Firestore rules currently:

- Require authentication and owner UID equality for paths under `users/{userId}`.
- Allow the owner to read the profile, create a profile whose keys/types match `validProfile`, and update a limited profile key set. Profile deletion is denied.
- Match one direct subcollection/document level. For `products`, `orders`, `staff`, `suppliers` and `skuIndex`, the owner is allowed to read/write any document with **no per-collection schema or business-state validation**.
- Allow owner read/create for `activity`, while denying its update/delete.
- Do not implement authorization roles for staff.

This is materially broader than the business logic in the client: a caller can directly create malformed products/orders/staff/suppliers/index docs, rewrite order state/payment or stock fields, and omit associated transactions/activity while still satisfying the current owner/path check. Owner scoping protects confidentiality between accounts, but the existing generic write rule does not enforce the application's intended data integrity.

Current profile rule checks include fields `uid`, `email`, `displayName`, `photoURL`, `phone`, `businessName`, `businessType`, `address`, `lowStockAlerts`, `orderSeq`, `createdAt`, `updatedAt`, and legacy `phoneNumber`. `createdAt` is checked as a number and `updatedAt` as a Firestore timestamp. Inventory/order/activity timestamps, by contrast, are written as epoch-millisecond numbers. A new rules design must preserve this observed distinction unless the app's data format is deliberately migrated.

The checked-in Storage rules deny all reads and writes. This is consistent with the currently implemented app because there is no file upload feature.

## 9. Storage and file handling

- `storageBucket` is included in client Firebase configuration, but source code has no `firebase/storage` import, Storage SDK call, upload/download operation or Storage URL use.
- `src/components/avatar.tsx` creates a monogram from a name; it does not display or upload an image.
- No Storage path, file type, size bound, ownership mapping or user-visible file access requirement can be established from the code. Do **not** invent an avatar, receipt, product-image or document path.
- Recommended current policy is to keep Storage fully denied until a concrete feature and path convention are specified. If uploads are added later, define owner-scoped paths, create/read/update/delete needs, MIME/size constraints, metadata handling, deletion behavior and URL-sharing policy before allowing access. Storage authorization must bind the path owner to `request.auth.uid`.

## 10. Firebase Auth, backend and incomplete functionality

### Implemented

- Firebase Auth email/password sign-up, sign-in, sign-out and password-reset email.
- React Native Auth persistence uses AsyncStorage; web uses Firebase's web Auth instance.
- Auth state restoration and private-route redirection.
- Owner profile bootstrap/repair and live profile synchronization.
- Firestore live listeners and client SDK CRUD/transactions described above.
- UI loading/error feedback for many forms and synchronization failures.

### Not implemented / uncertainties

- No Cloud Functions, Admin SDK, server API or trusted mutation backend is present in `firebase.json`, `src/` or package dependencies.
- No Auth email-verification requirement, MFA, social sign-in, custom claims, staff invitations or staff login is implemented.
- No account deletion, record export, retention policy, restore/backup workflow or media upload exists.
- Staff `role` values have no authorization meaning. Requirements for future sharing, role-specific access, or multi-user businesses are unknown.
- Validation bounds beyond those stated (such as maximum notes length, phone format, maximum order item count, permitted monetary precision/ranges) are not specified.
- The app uses epoch-millisecond numeric timestamps for operational records but a Firestore `Timestamp` for profile `updatedAt`; a future schema migration would require coordinated client/rules changes.
- Order payment state is manually set by the owner; it does not prove payment receipt.
- The account's registered email is represented both in Firebase Auth and a mutable Firestore profile field; rules should not treat the latter as an independent identity credential.

## 11. Source map

Key evidence in the repository:

- Firebase initialization and environment-variable names: [`src/config/firebase.ts`](./src/config/firebase.ts)
- Authentication API and error mapping: [`src/services/auth.ts`](./src/services/auth.ts)
- Profile model, bootstrap, listener and update: [`src/services/users.ts`](./src/services/users.ts)
- Product/order/staff/supplier/activity types, all Firestore queries and writes, transactions and sample seeding: [`src/services/inventory.ts`](./src/services/inventory.ts)
- Auth/profile state, route auth state and owner profile updates: [`src/context/PageContext.tsx`](./src/context/PageContext.tsx)
- Firestore subscriptions, derived inventory/report values and UI actions: [`src/context/InventoryContext.tsx`](./src/context/InventoryContext.tsx)
- Status/category/role enums and stock reasons: [`src/data/catalog.ts`](./src/data/catalog.ts)
- Navigation and private-route guard: [`src/app/_layout.tsx`](./src/app/_layout.tsx), [`src/lib/nav.ts`](./src/lib/nav.ts)
- Existing Firestore policy: [`firestore.rules`](./firestore.rules)
- Existing Storage policy: [`storage.rules`](./storage.rules)
- Firebase CLI configuration: [`firebase.json`](./firebase.json)
- App purpose and setup notes: [`README.md`](./README.md)

## 12. Questions to resolve before finalizing production rules

1. Will the product remain strictly single-owner, or will staff/other business users sign in and share data?
2. Should all signed-in owner clients be allowed to make every data change, or must stock/order/payment changes be tamper-resistant and mediated by trusted backend code?
3. Should profile email be required to match a verified Auth email, and will email changes be supported?
4. Are activity entries intended as an authoritative audit trail or only as a best-effort UI history?
5. What string-size, item-count, monetary precision/range and other resource limits are required?
6. What is the intended account closure, export, backup and data-retention policy?
7. Is any Storage feature planned? If so, define exact file purposes, paths, read/write access, size/type limits and lifecycle first.
8. Should the optional sample-data feature remain enabled in production, and should it be prevented from running once any business records exist?

