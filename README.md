# PortSync Dashboard — Code Explanation

React + Vite SaaS frontend for the Smart Ocean Shipping Tracker (CS5224 Team 18).  
Deployed on AWS Amplify. Auth via AWS Cognito. Data from API Gateway + Lambda.

---

## Project Structure

```
src/
├── main.jsx                  Entry point — mounts App, configures Amplify
├── amplify-config.js         AWS Amplify / Cognito configuration
├── App.jsx                   Root component — routing tree
├── context/
│   └── AuthContext.jsx       Global auth state + Cognito API wrapper
├── components/
│   ├── ProtectedRoute.jsx    Route guard — redirects unauthenticated users
│   ├── Sidebar.jsx           Fixed navigation sidebar
│   └── UpgradeModal.jsx      Plan upgrade modal with feature comparison
└── pages/
    ├── DashboardLayout.jsx   Shell layout: sidebar + scrollable content area
    ├── LoginPage.jsx         Cognito sign-in form
    ├── RegisterPage.jsx      Cognito sign-up + email verification flow
    ├── HistoricalPage.jsx    4 analytics charts with role gating
    ├── LivePage.jsx          Live vessel tracking map (iframe embed)
    └── ProfilePage.jsx       Account info, plan features, subscription status
```

---

## Entry Point & Routing

**`main.jsx`** — Calls `Amplify.configure()` (via `amplify-config.js`) before rendering the React tree so Cognito is ready before any auth calls.

**`amplify-config.js`** — Sets the Cognito User Pool ID, App Client ID, and region (`ap-southeast-1`). This is the only file that needs updating if the Cognito pool changes.

**`App.jsx`** — Defines the full routing tree using React Router v6:

| Path | Component | Access |
|------|-----------|--------|
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/dashboard` | `DashboardLayout` | Protected |
| `/dashboard/live` | `LivePage` | Protected |
| `/dashboard/historical` | `HistoricalPage` | Protected |
| `/dashboard/profile` | `ProfilePage` | Protected |
| `*` (catch-all) | Redirect → `/login` | — |

`DashboardLayout` is the parent route for all `/dashboard/*` children. `ProtectedRoute` wraps `DashboardLayout` and blocks unauthenticated access. The default `/dashboard` index redirects to `/dashboard/historical`.

---

## Auth System

### `amplify-config.js`
Configures `aws-amplify` with the Cognito User Pool. Called once at app startup in `main.jsx`.

### `AuthContext.jsx`
A React Context that wraps the entire app and exposes auth state and actions to all components via the `useAuth()` hook.

**Session restore on load:**  
On mount, `buildUserFromSession()` calls Amplify's `fetchAuthSession()` and `getCurrentUser()` in parallel. It reads the `idToken` payload to extract `cognito:groups`. If the user belongs to the `Premium` group, `role` is set to `"Premium"`, otherwise `"Free"`. The `idToken` string is stored in context so pages can attach it as a `Bearer` token in API calls.

**`register(email, password)`**  
Calls Amplify `signUp()`. If Cognito requires email verification, returns `{ needsConfirm: true }` so the UI can switch to the verification code step.

**`confirmRegistration(email, code)`**  
Calls Amplify `confirmSignUp()` to complete the email verification step.

**`login(email, password)`**  
Signs out any stale session first (avoids Amplify state conflicts), then calls `signIn()`. After success, rebuilds the user object from the new session. Returns `{ error }` on failure.

**`logout()`**  
Calls Amplify `signOut()` and clears the user state.

**`upgrade()` / `renew()`**  
Local session overrides for demo purposes only — they update the in-memory user object. Real role assignment is done in Cognito by an admin adding the user to the `Premium` group.

**`updateUsername(newUsername)`**  
Display name is stored in `localStorage` keyed by email (`displayName:<email>`). Cognito is the source of truth for authentication; the display name is purely cosmetic.

---

## Components

### `ProtectedRoute.jsx`
Reads `{ user, loading }` from `AuthContext`. While loading (session restore in progress), renders nothing to avoid a flash redirect. Once loaded, redirects to `/login` if no user, otherwise renders children.

### `Sidebar.jsx`
Fixed navigation panel shown on all dashboard pages. Displays the user's email and role badge (`Free` or `Premium`) from `AuthContext`. Uses React Router's `NavLink` to auto-apply the `active` CSS class to the current page link. The logout button calls `logout()` then navigates to `/login`.

### `UpgradeModal.jsx`
Overlay modal listing features available on the Gov/Commercial plan. Triggered from `HistoricalPage` and `ProfilePage` whenever a Free user tries to access a gated feature.

---

## Pages

### `LoginPage.jsx`
Form with email + password fields and a show/hide password toggle. On submit, calls `login()` from `AuthContext`. On success, navigates to `/dashboard/historical`. Displays any session-expired message passed via React Router's location state (set when `HistoricalPage` detects a 401 response).

### `RegisterPage.jsx`
Two-step form managed by a `step` state variable (`'form'` → `'confirm'` → `'done'`):
1. **form** — collects email and password, validates length/match, calls `register()`.
2. **confirm** — shown when Cognito requires email verification; collects the 6-digit code, calls `confirmRegistration()`.
3. **done** — shows success message, redirects to `/login` after 1.5 seconds.

### `DashboardLayout.jsx`
Shell layout that renders the fixed `Sidebar` on the left and an `<Outlet />` (React Router) for the current child page on the right. All protected pages are rendered inside this layout.

### `HistoricalPage.jsx`
The core analytics page. Key design decisions:

**`useFetch(url, idToken)` hook**  
A reusable data-fetching hook. Re-fetches whenever `url` or `idToken` changes. Attaches `Authorization: Bearer <idToken>` if a token is present. Returns `{ data, loading, error, status }`.

**Four charts, four fetch calls**  
Each chart gets its own `useFetch` call. URLs are built by `buildUrl(path)` which appends `?from=` and `?to=` query params for Premium users when date filters are set.

**Role gating (Free vs Premium)**  
- Free users: `applyFilter()` slices the data array to the last 3 entries (last 3 months). Date filter controls are hidden. Each chart shows an upgrade strip.
- Premium users: full data returned by the API (filtered server-side via `?from=&to=`). Date range filter bar is shown. CSV export button appears on each chart.

**`filterByRange(data, from, to)`**  
Client-side fallback filter (unused in current flow — server handles it). Kept as a utility.

**`exportCSV(data, filename)`**  
Converts an array of objects to CSV text, creates a `Blob`, generates a temporary object URL, triggers an `<a>` click to download, then revokes the URL.

**`flattenBreakdown()` / `flattenVesselCalls()`**  
The API returns nested arrays (e.g. `breakdown: [{secondary, throughput}]`). These functions pivot the nested structure into flat objects keyed by category name, which is the format Recharts expects.

**401 detection**  
A `useEffect` watches the HTTP status codes from all four fetches. If any returns 401, it calls `logout()` and redirects to `/login` with a session-expired message.

**Charts used (Recharts):**
| Chart | Type | Data key |
|-------|------|----------|
| Cargo Throughput | `LineChart` | `cargo_throughput` |
| Cargo Breakdown by Type | `BarChart` (stacked) | `Containerised`, `Conventional`, `Oil`, `Non-Oil Bulk` |
| Container TEU | `BarChart` | `container_throughput` |
| Vessel Calls by Purpose | `BarChart` (grouped) | `Cargo`, `Bunkers`, `Supplies`, `Repairs`, `Others` |

### `LivePage.jsx`
Embeds real-time AIS vessel tracking map via an `<iframe>`. The iframe points to a separate Amplify deployment. An "Open in new tab" link is always visible as a fallback.

### `ProfilePage.jsx`
Displays account information and subscription status.

**`daysRemaining(upgradeDate)`**  
Computes days until expiry by adding 30 days to the stored `upgradeDate` and diffing against today.

**Subscription expiry UI:**
- `daysLeft > 5` — shows days remaining badge (blue).
- `daysLeft <= 5` — badge turns red, expiry warning banner appears with a Renew button.
- `daysLeft === 0` — shows "has expired" message.

**Feature comparison table** — Statically defined `FEATURES` array. Rows are styled differently depending on whether the user is Free or Premium (`row-locked` dims inaccessible features for Free users, `row-unlocked` highlights newly available features for Premium users).

**Username editing** — Inline edit mode toggled by an Edit button. Saves to `localStorage` via `updateUsername()` in `AuthContext`. Pressing Enter saves; Escape cancels.

---

## API Integration

**Base URL:** `https://wa8v5iats6.execute-api.ap-southeast-1.amazonaws.com/prod`

All API calls attach `Authorization: Bearer <idToken>` where the `idToken` is the Cognito ID token (not access token). The ID token carries the `cognito:groups` claim used for role checking.

| Endpoint | Chart |
|----------|-------|
| `GET /api/historical/cargo/total` | Cargo Throughput Line Chart |
| `GET /api/historical/cargo/breakdown` | Cargo Breakdown Stacked Bar |
| `GET /api/historical/container` | Container TEU Bar Chart |
| `GET /api/historical/vessel-calls` | Vessel Calls Grouped Bar |

Query params `?from=YYYY-MM&to=YYYY-MM` are appended for Premium users when date filters are active.

**HTTP error handling:**

| Status | Behaviour |
|--------|-----------|
| 401 | `logout()` + redirect to `/login` with session-expired message |
| 403 | Chart shows "requires Gov/Commercial plan" with upgrade button |
| Other errors | Chart shows generic error message |

---

## Role Gating Logic

Roles come from `cognito:groups` in the Cognito ID token, read during session restore in `AuthContext`. The app uses two roles:

- **Free** — default for all new users. Last 3 months of data, no date filter, no CSV export.
- **Premium** — users in the `Premium` Cognito group. Full history, date range filter, CSV export on all charts.

Role assignment is managed in AWS Cognito (admin adds user to the `Premium` group). The `upgrade()` and `renew()` functions in `AuthContext` are local in-memory overrides used for demo/testing purposes only — they do not persist across page refreshes.
