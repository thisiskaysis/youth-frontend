# youth-frontend

Mobile/web app for a church youth ministry, backed by the `youth-backend`
Django API. Social-feed-style Home screen, QR attendance, and a full set
of leader/admin management tools behind a Dashboard tab.

Stack: Expo SDK 57 + Expo Router (file-based routing) + TypeScript +
React 19 + TanStack Query + Axios. NativeTabs on iOS/Android, a custom
web tab bar on web (see `src/components/app-tabs.tsx` /
`app-tabs.web.tsx`).

> Expo changed significantly around SDK 52+. Read the versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ before making framework-level
> changes (see `AGENTS.md`).

## Getting started

```
npm install
npx expo start --web        # web (fastest loop for this project)
npx expo start --ios        # iOS Simulator (needs the platform downloaded in Xcode)
npx expo start              # then press i / a / w
```

The Django backend must be running separately (`youth-backend/`, default
`http://localhost:8000`). API base URL resolution lives in
`src/lib/config.ts` (`localhost:8000` for web/iOS, `10.0.2.2:8000` for
the Android emulator, override with `EXPO_PUBLIC_API_URL` for a physical
device on the same network).

```
npx tsc --noEmit             # typecheck (no test suite yet)
```

## Project structure

- `src/app/` - Expo Router routes.
  - `_layout.tsx` - QueryClientProvider + AuthProvider + auth-gated
    Protected Routes (`(app)` vs `login`/`register`).
  - `(app)/(tabs)/` - Home (newsfeed), Prayer, Profile, Dashboard
    (leader/admin only).
  - `(app)/` - Groups, Events, Inbox, Forms (youth-facing, all reachable
    via the hamburger menu, not tabs).
  - `(app)/manage/` - every leader/admin tool, linked from the Dashboard
    grid.
- `src/lib/api/endpoints.ts` + `types.ts` - all backend calls and their
  response shapes, grouped by domain (`usersApi`, `groupsApi`, ...).
- `src/lib/auth-context.tsx` - `useAuth()`: user, `isAuthenticated`,
  `isLeaderOrAdmin`, `isAdmin`, login/register/logout.
- `src/components/` - shared chrome: `ScreenContainer`, `AsyncState`,
  `Card`, `StatusBadge`, `ThemedText`/`ThemedView`, `HamburgerButton`.
- `src/constants/theme.ts` - colour palette + typography, inspired by
  thesend.org.au.

## Implemented

- **Auth** - login/register against SimpleJWT, auto-refresh on 401,
  SecureStore on native / localStorage on web.
- **Home newsfeed** - Instagram-style feed (image, title, body with
  tappable links) + a horizontal "stories" strip of upcoming events,
  pull-to-refresh.
- **Prayer** - public wall, submit a request, "I prayed" toggle, and a
  full leader **moderation queue** (`/manage/prayer`): approve / hide /
  escalate pending requests, reply privately (arrives as an Inbox
  message).
- **Profile** - own QR code for attendance check-in.
- **Groups** - youth-facing "My Groups", plus full leader/admin CRUD
  (`/manage/groups`): create a group, add/remove members, promote/demote
  a group leader.
- **Events** - list, leader create + publish.
- **Newsfeed CMS** (`/manage/content`) - create + publish posts that
  appear on Home.
- **Dynamic navigation CMS** (`/manage/navigation`) - create, publish,
  and reorder custom menu items that render in the hamburger menu
  (external links, internal screens).
- **Attendance** - full QR flow: open a session per event, scan sign-in/
  sign-out (native camera or webcam), manual search sign-in/out, a
  **walk-in visitor quick-add** for people with no account yet, live
  on-site stats, close-session with a force-close override.
- **Forms & consent** (`/manage/forms` + youth-facing `/forms`) - leader
  builds a form with a question schema (text / textarea / checkbox,
  required flags), activates it, assigns it to people; assignees see it
  under "My Forms" and fill in/submit answers.
- **Decisions & follow-up** (`/manage/decisions`) - record a decision,
  assign an accountable follow-up to a leader/admin, and cycle its
  status (outstanding → in progress → completed).
- **Volunteers** (`/manage/volunteers`) - create positions per team,
  build a roster (pick an event + position + person, with a
  not-on-the-team safety check), publish it to notify volunteers, then
  accept/decline/cancel assignments.
- **Rides** (`/manage/rides`) - view requests, cycle status
  (requested → arranging → confirmed → completed), cancel.
- **Inbox** - read messages/notifications, mark read, and (leader/admin
  only) **compose** a direct message to any person you're authorised to
  contact.
- **People** (`/manage/people`) - search, then open a full profile
  (contact/guardian/emergency-contact info, role, status) and edit it;
  role changes are admin-only.
- **Reporting** (`/manage/reporting`) - KPI dashboard plus drill-down
  lists: attendance trend, attendance log, first-time visitors,
  unassigned youth, decisions, outstanding follow-ups, outstanding
  consent, rides.

## Not built yet

- Google / Apple sign-in (backend doesn't have it either).
- Push notification registration (device token → backend) and a
  notification-preferences screen - backend endpoints exist, unused.
- Websocket/Channels realtime for the live attendance dashboard - REST
  polling only.
- Audience targeting UI (everyone vs. specific groups/school-years) on
  the Events/Content/Navigation create forms - always defaults to
  everyone.
- A real native date/time picker for the Event create form (plain text
  input parsed as a date string today).
- Per-event roster summary report (fill/pending/accepted/declined
  counts) - the other 8 reporting drill-downs are built, this one needs
  its own event picker.
- Volunteer position picker in "+ BUILD ROSTER" isn't scoped to the
  selected event's team yet (shows every position).
