# Gymmer Sales Tracker

Internal gym sales outreach tracker for the Gymmer team (4 users). **Standalone** — no connection to the Gymmer app or its database.

## Stack

- **Backend**: Node.js + Express + `node:sqlite` (built-in, no native deps)
- **Frontend**: React + Vite (dev server)
- **Auth**: bcrypt passwords + JWT in httpOnly cookie (8h session)

## Setup

```bash
# From the project root — installs concurrently at root level
npm install
```

### Development (one command, one terminal)

```bash
npm run dev
# Backend  → http://localhost:3001
# Frontend → http://localhost:5173  (Vite dev server with HMR)
```

### Production Build & Run

```bash
npm run build          # builds React into backend/public/
npm start              # serves everything from http://localhost:3001
```

The built frontend is served as static files by Express — no separate frontend server needed in production.

### Deploy (e.g. Render / Railway / Fly.io)

1. Push the repo — the `backend/public/` folder is git-ignored (built at deploy time).
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Set `PORT` env var if needed (defaults to `3001`).

Then open **http://localhost:5173** in dev, or **http://localhost:3001** after `npm start`.


## Login Credentials

| Username   | Display Name | Password               |
|------------|--------------|------------------------|
| `shaurya`  | Shaurya      | `Shaurya@FitOps#2026`  |
| `tanish`   | Tanish       | `Tanish@LeadForce#2026`|
| `daksh`    | Daksh        | `Daksh@GymMaster#2026` |

Passwords are bcrypt-hashed in the DB. To change a password manually:

```bash
# In the backend directory:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('newpassword', 10));"
# Then update in SQLite:
# UPDATE users SET password_hash = '<hash>' WHERE username = 'shaurya';
```

Or use any SQLite browser (e.g. [DB Browser for SQLite](https://sqlitebrowser.org/)).

## Data

The SQLite database is at `backend/data/gymmer.db`. Back this file up to preserve your data.

## Features

- Login with active team accounts (Shaurya, Tanish, Daksh)
- Dashboard with summary counts (total, by status)
- Add leads via "+ Add Lead" modal
- Inline edit any row (click ✏️)
- Delete a lead (click ✕, confirms before deleting)
- **Lead Age Tracking**: Displays elapsed days since each lead was captured with color-coded urgency badges (Fresh, Warm, Hot, Urgent) so overdue leads can be prioritized and pushed
- Filter by Status dropdown
- Filter by Area (text search)
- Sort by any column, including Days / Date Added

## No Features (by design)

No notifications, no charts, no export, no roles, no self-registration, no password reset UI.
