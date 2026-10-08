# Restaurant Loyalty App

The customer-facing loyalty app for a MenuDock restaurant. Each restaurant gets their
own branded build; the **theme, logo and menu all come from the restaurant's MenuDock
config** (the same `restaurants/{id}` record that drives the website and tablet dashboard).

Built with Expo (React Native) + Firebase, on the shared **menudock-platform** project.

## Phase 1 (this build)
- Customers sign up / sign in (Firebase Auth) and see their restaurant's live menu.
- Menu, restaurant details & theme come from Firestore — when the restaurant edits them
  on the tablet dashboard, the app reflects it.
- Buying menu items earns loyalty points (**placeholder: 1 pt / £1**).
- Rich, **reusable theme driven by config** (`theme/defaultTheme.js` → `buildTheme`).
- Two screens reachable from the burger menu: **Menu** and **My Account**.

## Phase 2 (next)
- Offers & deals pushed from the dashboard into the app.
- The real **loyalty points system**: earn rates, tiers, redemption, expiry.

## Which restaurant does a build serve?
Set `EXPO_PUBLIC_RESTAURANT_SLUG` per client build (see `.env.example`). The app resolves
that slug to a `restaurants/{id}` record and themes itself from it.

## Data model (per restaurant, scoped)
```
restaurants/{id}/menu/{categoryId}          ← menu (shared with website)
restaurants/{id}/customers/{uid}            ← { name, email, points, lifetimePoints }
restaurants/{id}/offers/{offerId}           ← Phase 2
```

## Run locally
```bash
cp .env.example .env     # set EXPO_PUBLIC_RESTAURANT_SLUG + Firebase (defaults to menudock-platform)
npm install
npm start                # Expo dev server; press w for web, or scan for a device
```

## ⚠️ Points integrity (read before production)
In Phase 1 the client writes points to its own `customers/{uid}` doc for simplicity.
That means a determined user could tamper with their balance. **Before launch, move
points-awarding to the server** — award on the Stripe payment webhook (reuse the
website's Cloud Function) and make `customers/{uid}.points` writable only by the Admin
SDK. The earn logic already lives in one place (`lib/points.js`) to make that swap easy.
