# Leaflet + OpenStreetMap Integration Plan — ZoneDrop

## 1. Codebase analysis (what exists today)

**Stack**
- Frontend: React 19 + Vite + TailwindCSS, React Router. No map library installed yet (`frontend/package.json` has no `leaflet`/`react-leaflet`).
- Backend: Node/Express + TypeScript + Prisma/PostgreSQL.

**Where addresses are handled today**
- `frontend/src/pages/NewOrderPage.tsx` — the order-creation form. Pickup and drop locations are **free-text fields only**:
  - `pickupAddress` / `dropAddress` (plain `<input>` text)
  - `pickupPincode` / `dropPincode` (plain `<input>` text, used to resolve a `Zone` server-side)
  - There is no coordinate capture anywhere in this form.
- `backend/src/routes/orders.ts` validates these with `zod` (`pickupAddress: z.string().min(5)`, etc.) and resolves `Zone` purely from **pincode → `PincodeZoneMap` → `Zone`**. Pricing (`rateEngine.ts`) depends only on that zone classification (INTRA/INTER), not on coordinates.
- `backend/prisma/schema.prisma`:
  - `Order` model stores `pickupAddress`, `dropAddress`, `pickupPincode`, `dropPincode`, `pickupZoneId`, `dropZoneId` — **no lat/lng columns**.
  - `AgentProfile` model already has `currentLat` / `currentLng` (`Float?`) — but **no API route reads or writes them**, and no UI uses them yet. This is unused scaffolding for a future live-agent-tracking feature.

**Where a map already appears (as a placeholder)**
- `frontend/src/pages/CustomerHome.tsx` — the customer dashboard has a "Map Area" block (`~line 137-155`) that is currently just a **static hard-coded `<img>` screenshot** of a Google Maps-style graphic, with an absolutely-positioned overlay card showing "Active Route" text. This is a mock, not a real map.
- `OrderDetailPage.tsx` and `AgentPage.tsx` have **no map at all** — only text/status timelines.

**Conclusion:** the app has no real mapping today. The most natural, highest-value place to start — matching your request — is the **pickup/drop location picker in `NewOrderPage.tsx`**, since that's literally where the user currently has to type an address.

---

## 2. Where the map should be added

| Priority | Location | Purpose |
|---|---|---|
| **P0 (this request)** | `NewOrderPage.tsx` — Step 1 "Pickup & Drop Locations" card | Let the user click a point on a Leaflet/OSM map instead of typing the address. Reverse-geocode the click to auto-fill the existing `pickupAddress`/`dropAddress` and `pickupPincode`/`dropPincode` text inputs, **and also persist the picked `lat`/`lng` coordinates** on the order (new nullable `Order` columns — see Step 4). Two small map pickers (or one map with a toggle for "Pickup"/"Drop" pin), each with a "Use map" / "Type manually" switch since some users may not want it. |
| P1 (nice-to-have follow-up) | `CustomerHome.tsx` map area | Replace the static `<img>` placeholder with a real Leaflet map showing the pickup/drop markers of the active order (and later the agent's live position, once `currentLat/currentLng` is wired to an API). |
| P1 (nice-to-have follow-up) | `OrderDetailPage.tsx` | Add a small Leaflet map showing pickup marker, drop marker, and a straight line between them for the order being viewed. |
| P2 (optional, bigger scope) | `AgentPage.tsx` | Let an agent set/update their live location by tapping the map, wiring up the already-existing but unused `AgentProfile.currentLat/currentLng` fields with a new PATCH endpoint. |

This plan focuses on **P0** in detail (what you asked for) and sketches P1/P2 so it's easy to pick up later.

---

## 3. Library choice

- `leaflet` (core) + `react-leaflet` (React bindings) — lightweight, no API key needed, works directly with OpenStreetMap tiles.
- Geocoding: **Nominatim** (OSM's free geocoding/reverse-geocoding API, `https://nominatim.openstreetmap.org`) for:
  - Reverse geocoding: map click (lat/lng) → human-readable address + postcode, to auto-fill the existing text fields.
  - Forward geocoding (optional, P0-stretch): typed address → move the map/pin there, for users who start by typing and want to fine-tune on the map.
  - Note: Nominatim's public endpoint has a usage policy (max ~1 request/sec, needs a `User-Agent`/referer, no heavy production traffic) — fine for dev/small usage, but flag to the user that a production deployment should either self-host Nominatim or use a provider like LocationIQ/Mapbox/Geoapify (same OSM data, better rate limits) if traffic grows.

---

## 4. Step-by-step implementation plan

### Step 1 — Install dependencies
```bash
cd frontend
npm install leaflet react-leaflet
npm install -D @types/leaflet
```
Import Leaflet's CSS once, globally, in `frontend/src/main.tsx`:
```ts
import "leaflet/dist/leaflet.css";
```
Leaflet's default marker icons need an explicit fix under Vite bundling (known issue: broken marker image paths). Handle this once in a small `frontend/src/lib/leafletIcons.ts` helper that re-points `L.Icon.Default` to the bundled marker images.

### Step 2 — Build a reusable `LocationPickerMap` component
New file: `frontend/src/components/LocationPickerMap.tsx`
- Props: `label`, `initialAddressText` (for the default center, roughly geocoded or a sane India-wide default), `onSelect(result: { lat, lng, address, pincode })`.
- Renders a `MapContainer` (react-leaflet) with an OSM `TileLayer` (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, with the required attribution).
- Uses a `useMapEvents({ click })` handler to drop/move a `Marker` where the user clicks.
- On marker placement, calls Nominatim reverse geocode (`/reverse?format=jsonv2&lat=..&lon=..`) and returns `{ lat, lng, address, pincode }` via `onSelect`.
- Include a small "🔍 Search address" text input inside the widget (optional, forward-geocode via Nominatim `/search`) that recenters the map — useful for people who know the area name but want to fine-tune the pin.
- Keep this component dumb/presentational: it doesn't know about the order form, it just emits picked-location data.

### Step 3 — Wire it into `NewOrderPage.tsx`
In the "Pickup & Drop Locations" card (`Step 1`):
- Add a small toggle per field-group: **"Type address" / "Pick on map"** (default can stay "Type address" so nothing breaks for existing users).
- When "Pick on map" is active, render `<LocationPickerMap label="Pickup Location" onSelect={...} />` above (or instead of) the pickup inputs; on `onSelect`, do:
  ```ts
  setForm(f => ({ ...f, pickupAddress: result.address, pickupPincode: result.pincode }));
  ```
  and keep the text inputs visible but populated/read-only-ish (still editable, in case Nominatim's reverse geocode is imprecise about the exact pincode — the user should be able to correct it before quoting).
- Repeat identically for the drop location.
- The text inputs (`pickupAddress/pickupPincode/dropAddress/dropPincode`) still work exactly as the backend already expects — nothing breaks for users who keep typing manually.
- In addition to filling those text fields, also stash the raw `{ lat, lng }` in form state (new `pickupLat/pickupLng/dropLat/dropLng` fields in the `NewOrderPage` form object) so Step 4 can send them to the backend.

### Step 4 — Persist the picked coordinates on the `Order`
Store the actual `lat`/`lng` the user picked, not just the derived address text, so later features (live tracking, "distance as the crow flies", map redraws on the order-detail/dashboard pages) have real coordinates instead of having to re-geocode stored text every time.

- Add nullable columns to `Order` in `backend/prisma/schema.prisma`:
  ```prisma
  pickupLat  Float?
  pickupLng  Float?
  dropLat    Float?
  dropLng    Float?
  ```
- Generate a migration:
  ```bash
  cd backend
  npm run prisma:generate
  npm run prisma:migrate
  ```
- Extend the `zod` schema(s) in `backend/src/routes/orders.ts` (both `quoteSchema` and the order-creation schema) with optional fields:
  ```ts
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropLat: z.number().optional(),
  dropLng: z.number().optional(),
  ```
- Pass them through when creating the `Order` record (alongside the existing `pickupAddress`, `dropAddress`, etc. in the `prisma.order.create(...)` call).
- In `frontend/src/pages/NewOrderPage.tsx`, include them in `getPayload()`:
  ```ts
  pickupLat: form.pickupLat ?? undefined,
  pickupLng: form.pickupLng ?? undefined,
  dropLat: form.dropLat ?? undefined,
  dropLng: form.dropLng ?? undefined,
  ```
- Fully backward-compatible: orders created by typing the address manually simply omit these fields (`undefined`), and the columns stay `null` in the DB — no impact on the pricing engine or existing zone-lookup logic, which continues to run off pincode alone.

### Step 5 — (P1) Replace the static map image in `CustomerHome.tsx`
- Swap the `<img src="https://lh3.googleusercontent.com/...">` block for a small read-only Leaflet map (`MapContainer` with `scrollWheelZoom={false}` so it doesn't hijack page scrolling) showing:
  - Pickup marker + drop marker of `latestActive` order (needs Step 4's lat/lng, or a one-off geocode of the stored address as a fallback).
  - Keep the existing "Active Route" overlay card as-is, just floating over the real map instead of the static image.

### Step 6 — (P1) Add a map to `OrderDetailPage.tsx`
- Same `LocationPickerMap`-style component, but a read-only variant (`OrderRouteMap`) that just plots two fixed markers + a `Polyline` between them, no click handling.

### Step 7 — (P2, bigger scope, only if you want it) Live agent location
- Add `PATCH /api/agents/me/location { lat, lng }` backend route that updates `AgentProfile.currentLat/currentLng` (fields already exist, just unused).
- In `AgentPage.tsx`, add a small "Update my location" map (agent taps their position, or use `navigator.geolocation.getCurrentPosition` for one-tap auto-detect, with the map as a manual-correction fallback).
- Feed that into the P1 maps above as a live "agent" marker (poll every ~10–15s, similar to the existing 5s order-polling pattern already used in `CustomerHome.tsx`).

---

## 5. Suggested file changes summary

| File | Change |
|---|---|
| `frontend/package.json` | add `leaflet`, `react-leaflet`, dev dep `@types/leaflet` |
| `frontend/src/main.tsx` | import `leaflet/dist/leaflet.css`, apply marker-icon fix |
| `frontend/src/lib/leafletIcons.ts` (new) | fixes default marker icon paths under Vite |
| `frontend/src/lib/geocode.ts` (new) | thin wrapper around Nominatim `/reverse` and `/search` |
| `frontend/src/components/LocationPickerMap.tsx` (new) | reusable click-to-pick map + reverse geocode |
| `frontend/src/pages/NewOrderPage.tsx` | add "Type address / Pick on map" toggle for pickup & drop, wire `LocationPickerMap` → form state (address, pincode, **and lat/lng**) |
| `backend/prisma/schema.prisma` | add `pickupLat/pickupLng/dropLat/dropLng` (nullable) to `Order`, run migration |
| `backend/src/routes/orders.ts` | accept the new optional lat/lng fields in `zod` schemas, save them on `Order` creation |
| `frontend/src/pages/CustomerHome.tsx` *(P1)* | replace static map `<img>` with real Leaflet map |
| `frontend/src/pages/OrderDetailPage.tsx` *(P1)* | add read-only route map |
| `frontend/src/components/OrderRouteMap.tsx` (new, P1) | read-only two-marker + polyline map |
| `backend/src/routes/agents.ts` (new, P2) | `PATCH` endpoint for agent live location |

---

## 6. Confirmed scope for the first pass

Both of these are now part of the same first pass (Steps 1–4 above), not deferred:
1. **Map picker UI** in `NewOrderPage.tsx` (click-to-pick, reverse-geocode into the existing address/pincode fields).
2. **Persisting the picked coordinates** — new `pickupLat/pickupLng/dropLat/dropLng` columns on `Order`, migration, backend schema + route updates, and sending them from the frontend payload.

P1 (dashboard/order-detail read-only maps) and P2 (live agent location) remain later follow-ups, not part of this pass.

## 7. Notes / things to decide with you before coding

1. **Geocoding provider for production**: fine to start with Nominatim's public endpoint for development; flag before shipping to production traffic.
2. **Default map center**: since existing seed/demo data is Delhi-based (`12 Connaught Place, New Delhi`), default the map view to New Delhi unless you'd prefer geolocation-based centering (`navigator.geolocation`) or a different city.

---

## 8. Engineering Constraints & Requirements (Added by Eng Review)

1. **Failure States for Nominatim:** The UI must gracefully handle instances where the public API fails to return a valid pincode or address (very common in India). If this happens, we must present an alert to the user: *"Pin dropped successfully, but please manually confirm your Pincode for accurate pricing"* rather than crashing the `rateEngine`.
2. **Debounce Forward Geocoding:** If adding a search bar (Step 2), we must heavily debounce the keystrokes (e.g., 800ms) before hitting Nominatim to avoid IP bans.
3. **Automated Testing Requirements:**
   - **Backend:** Add Vitest unit tests for the `POST /api/orders` route to ensure it correctly accepts and persists the new optional `pickupLat`/`dropLat` fields without regression to existing logic.
   - **Frontend:** Add mock tests for the `react-leaflet` component to ensure the fallback "Type Manually" text inputs continue to work smoothly if the map fails to load.
