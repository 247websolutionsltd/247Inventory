# Stockroom

Stockroom is an Expo Router inventory app for a single business owner. Firebase Authentication manages owner accounts; each owner's profile, inventory, orders, staff, suppliers, and activity are stored under `users/{uid}` in Firestore and synchronized with live listeners.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set the Firebase web app values.
3. Enable **Email/Password** in Firebase Authentication.
4. Start Expo with `npx expo start`.

The Firebase client configuration is read from `EXPO_PUBLIC_FIREBASE_*` variables in `src/config/firebase.ts`. These client values are not server secrets. Never put Admin SDK credentials or private keys in an Expo environment variable.

## Deploy Firebase security rules

The app's Firebase project ID is `inventory-7b4c2`. Sign in to the Firebase CLI with a Google account that has access to that project, then deploy the Firestore rules:

```sh
firebase login --reauth
firebase deploy --only firestore:rules --project inventory-7b4c2
```

Firestore documents are owner-scoped by authenticated UID. Order placement, stock adjustment, cancellation/restocking, and SKU reservation use atomic Firestore transactions. Staff records are not separate sign-in accounts. The current app has no file-upload flow, so Storage rules deny all object access until a specific upload feature is introduced. No Cloud Function is needed for the current single-owner workflows.

If authenticated profile and collection reads report `permission-denied`, verify that this deployment completed against the same project ID shown in the app's Firebase configuration. The Firebase CLI account must have permission to deploy rules. The Firebase Console's currently deployed Firestore rules are separate from the checked-in `firestore.rules` file.

The support contacts and user-provided privacy policy URL are configured in `src/constants/brand.ts`. Add an approved Terms of Service before public launch; the app does not invent or claim terms that have not been supplied.

## Checks

```sh
npx tsc --noEmit
npm run lint
npx expo export --platform web
```
