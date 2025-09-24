# 1. main process

## main/src/authStore.ts

#### 1. **Electron-store setup**

Your **`authStore.ts`** file is basically the **authentication and secure session storage layer** for your Electron app. It glues together:

- **`electron-store`** → for simple JSON-based key/value storage.
- **`better-sqlite3`** → for more structured, persistent storage (sessions in SQLite).
- **Electron IPC (`ipcMain`)** → so your React frontend (renderer process) can talk to this secure backend (main process).
- **`authApi`** → your own abstraction for hitting authentication APIs (register, login, logout, etc.).

---

### Step-by-step explanation

#### 1. **Electron-store setup**

```ts
const store = new Store();
```

- `electron-store` keeps small key/value pairs in a JSON file under `app.getPath("userData")`.
- Good for quick access and persistence, but not super robust.

---

#### 2. **SQLite setup**

```ts
const dbPath = path.join(app.getPath("userData"), "auth.db");
const db = new Database(dbPath);
```

- Creates (or opens) an SQLite database file called `auth.db` inside Electron’s user data directory.
- Ensures this table exists:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  value TEXT
)
```

- So you have a `sessions` table for token storage, etc.

---

#### 3. **Authentication API instance**

```ts
const authAPI = getAuthAPI();
```

- This presumably returns an object with functions like `.register()`, `.login()`, `.validateSession()` that talk to your backend REST API.

---

#### 4. **IPC Handlers for secure storage**

- These are the "bridges" between frontend (renderer) and backend (main process).
- When your React app calls `ipcRenderer.invoke("auth:set", key, value)`, it hits this:

```ts
ipcMain.handle("auth:set", (event, key: string, value: string) => {
  store.set(key, value);
  db.prepare("INSERT OR REPLACE INTO sessions (key, value) VALUES (?, ?)").run(key, value);
  return true;
});
```

So:

- Saves to both `electron-store` **and** SQLite (redundancy).
- You could store tokens, refresh tokens, user ID, etc.

Other storage-related handlers:

- **`auth:get`** → Reads from `electron-store`, then SQLite if missing.
- **`auth:delete`** → Deletes from both.

---

#### 5. **IPC Handlers for authentication API**

Each one just wraps your `authAPI` calls with error handling:

```ts
ipcMain.handle("auth:register", async (event, userData) => {
  return await authAPI.register(userData);
});
```

If anything goes wrong, returns a safe `{ success: false, message: ... }`.

Handlers include:

- `auth:register`
- `auth:login`
- `auth:validateSession`
- `auth:logout`
- `auth:getUserById`
- `auth:updateUser`

---

#### 6. **Session cleanup**

```ts
setInterval(async () => {
  await authAPI.cleanupExpiredSessions();
}, 60 * 60 * 1000);
```

- Every hour, calls your API’s cleanup logic (probably deletes old tokens or expired sessions).

---

### Why both **electron-store** and **SQLite**?

- `electron-store` is very convenient for quick reads/writes, but it’s just JSON under the hood (not great if corrupted).
- `SQLite` gives you structured, queryable storage that’s more robust.
- Using both means:

  - Fast access from store.
  - Redundancy and persistence in DB.

---

✅ **Summary in plain words:**
This file is the **auth hub** for your Electron app. The frontend never directly talks to the database or API — it always goes through IPC. Your main process stores tokens and session info securely in both `electron-store` and SQLite, and also proxies API calls like login/register/logout to your backend via `authAPI`.

---

# 🔑 Databases

## 1. pos_system.db

It is one of the **main POS database layer** (different from `authStore.ts` which just handled auth tokens/sessions).

- Creates & manages a **SQLite database** at:

  ```
  ~/Library/Application Support/nepstores-pos/pos_system.db
  ```

- Defines **tables** for:

  - `businesses`
  - `users`
  - `sessions`

- Bootstraps the system with a **default admin user** (`admin@store.com / admin123`) if the DB is empty.
- Provides a **class-based API** (`DatabaseManager`) to handle:

  - **Users** (CRUD, authentication, permissions)
  - **Businesses**
  - **Sessions** (create, validate, delete, cleanup)

It’s wrapped in a **singleton pattern** (`getDatabase`) so there’s always only one active connection.

---

## 🧩 Pos_system db| Step-by-step breakdown

### 1. Initialization

```ts
const dbPath = path.join(app.getPath("userData"), "pos_system.db");
this.db = new Database(dbPath);
this.initializeTables();
```

- Database is created at `pos_system.db` under Electron’s `userData` folder.
- `initializeTables()` sets up schema and inserts a default admin if needed.

---

### 2. Schema

- **Businesses**:

  ```sql
  id TEXT PRIMARY KEY,
  name TEXT,
  ownerId TEXT,
  createdAt TEXT,
  updatedAt TEXT
  ```

- **Users**:

  ```sql
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT (bcrypt-hash),
  firstName, lastName, businessName,
  role ('cashier' | 'manager' | 'admin'),
  businessId → FK to businesses.id,
  permissions JSON string,
  isActive BOOLEAN DEFAULT 1,
  createdAt, updatedAt
  ```

- **Sessions**:

  ```sql
  id TEXT PRIMARY KEY,
  userId → FK to users.id,
  token TEXT UNIQUE,
  expiresAt, createdAt
  ```

Also creates **indexes** for performance (email lookup, session token lookup, etc.).

---

### 3. Default admin

If no users exist:

- Creates a `businesses` row: `"Default Store"`.
- Creates a user:

  - **email:** `admin@store.com`
  - **password:** `admin123` (bcrypt hashed)
  - **role:** `admin`
  - **permissions:** `[{ action: "*", resource: "*" }]`

Logs a message:

```
Default admin user created: admin@store.com / admin123
```

---

### 4. User management

- **createUser()** → creates a business (if needed), hashes password, assigns role-based permissions.
- **getUserByEmail() / getUserById()** → fetch user + parse permissions.
- **authenticateUser()** → verify password via `bcrypt.compare()`, return user object without password.
- **updateUser()** → update fields, keeps `updatedAt`.
- **deleteUser()** → soft delete (sets `isActive = 0`).

---

### 5. Session management

- **createSession(userId)** → generates a UUID session + token, expires in 7 days, inserts into `sessions`.
- **getSessionByToken(token)** → validates session and expiry.
- **deleteSession(token)** → removes specific session.
- **deleteUserSessions(userId)** → logs out a user everywhere.
- **cleanupExpiredSessions()** → deletes expired tokens.

---

### 6. Business management

- **getBusinessById(id)** → returns business.
- **getUsersByBusiness(businessId)** → all active users of a business.

---

### 7. Singleton export

```ts
export async function getDatabase(): Promise<DatabaseManager>;
```

- Ensures only **one `DatabaseManager` instance** is active.
- Call `await getDatabase()` anywhere to access DB methods.

---

## 🔄 How it relates to `authStore.ts`

- `authStore.ts` handles **frontend IPC calls + API proxying + token storage**.
- `database.ts` handles **local persistent POS user & business data**.

So in practice:

- `authStore.ts` is more about **external authentication** (server + session tokens).
- `database.ts` is about **internal users, businesses, POS sessions**.

You now effectively have **two SQLite databases**:

1. `auth.db` → session storage (authStore.ts)
2. `pos_system.db` → full app database (users, businesses, sessions, etc.)

---

⚡ Question: do you want me to **map out the data flow** (like: login request → API → authStore → database.ts → session returned to frontend), so you can see how `auth.db` and `pos_system.db` interact?

# What `preload/index.ts` does

This file is the “bridge” between your secure Electron **main process** (where `authStore.ts` and `database.ts` run) and the **renderer process** (your React app).

### 1. Security with `contextBridge`

```ts
import { contextBridge, ipcRenderer } from "electron";
```

- By default, the renderer (React side) cannot access Node APIs for security reasons.
- `contextBridge.exposeInMainWorld()` safely exposes only what you choose under `window.<name>`.

---

### 2. Exposing `authStore`

```ts
contextBridge.exposeInMainWorld("authStore", {
  set: (key, value) => ipcRenderer.invoke("auth:set", key, value),
  get: (key) => ipcRenderer.invoke("auth:get", key),
  delete: (key) => ipcRenderer.invoke("auth:delete", key),
});
```

- Makes `window.authStore` available in React.
- Each method internally calls the corresponding IPC handlers you defined in **`authStore.ts`**.
- Example in React:

  ```ts
  await window.authStore.set("token", "abc123");
  const token = await window.authStore.get("token");
  ```

---

### 3. Exposing `authAPI`

```ts
contextBridge.exposeInMainWorld("authAPI", {
  register: (userData) => ipcRenderer.invoke("auth:register", userData),
  login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
  validateSession: (token) => ipcRenderer.invoke("auth:validateSession", token),
  logout: (token) => ipcRenderer.invoke("auth:logout", token),
  getUserById: (userId) => ipcRenderer.invoke("auth:getUserById", userId),
  updateUser: (userId, updates) => ipcRenderer.invoke("auth:updateUser", userId, updates),
});
```

- Makes `window.authAPI` available in React.
- Each method corresponds to your **auth API proxy** handlers in `authStore.ts`.
- Example in React:

  ```ts
  const response = await window.authAPI.login({
    email: "admin@store.com",
    password: "admin123",
  });
  ```

---

### 4. Extra utilities

```ts
import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";
export { sha256sum, versions };
```

- `sha256sum` → probably a small helper to hash strings (useful for file checks, secure comparisons).
- `versions` → probably exposes app/electron/node version info to React.

---

## 🧩 How it fits together

- **Renderer (React)** calls → `window.authStore.*` or `window.authAPI.*`
- **Preload** forwards those calls to → `ipcRenderer.invoke(channel, args...)`
- **Main process (`authStore.ts`)** handles those IPC requests → talks to `electron-store`, SQLite (`auth.db`), and external API (`authAPI`).
- **database.ts** handles the heavier POS database (`pos_system.db`).

So preload is **your app’s public API surface** for the frontend. React only ever sees `window.authStore` and `window.authAPI`.

---

✅ **In plain words:**
This preload file makes sure your React frontend doesn’t directly touch Electron internals. Instead, it gets a neat, safe API (`window.authStore` + `window.authAPI`) to call into the backend.

---

---

# So, the preload can send from renderer to main and main to renderer, it's bidirectional through IPC?

Great question 🔥 — you’ve nailed the core idea. Let’s break it down:

---

## 1. Renderer → Main

That’s what your **preload** is already doing:

- You expose safe functions (`window.authAPI.*`, `window.authStore.*`).
- Those functions use:

  ```ts
  ipcRenderer.invoke("channel", args...)
  ```

- On the main side, you registered:

  ```ts
  ipcMain.handle("channel", (event, ...args) => { ... })
  ```

- ✅ So renderer can **request something from main** and get a **promise back**.

Example (React side):

```ts
const token = await window.authStore.get("token");
```

---

## 2. Main → Renderer

Yes, this is possible too. But it works a bit differently:

- **Main process can send messages to renderer** with:

  ```ts
  event.sender.send("channel", data);
  ```

  or if you have a `BrowserWindow` reference:

  ```ts
  mainWindow.webContents.send("channel", data);
  ```

- **Renderer listens** with:

  ```ts
  ipcRenderer.on("channel", (event, data) => {
    console.log("Got data from main:", data);
  });
  ```

⚠️ Notice:

- `ipcMain.handle/ipcRenderer.invoke` = **request/response pattern** (like an async function call).
- `ipcMain.on/ipcRenderer.send` (or `.send/.on`) = **fire-and-forget messaging** (like events).
- `webContents.send` = **main → renderer push** (main proactively sends).

---

## 3. Your preload setup

Right now, you’ve only exposed **renderer → main (invoke/handle)**.
That’s fine for auth flow, because renderer always _asks_ something and main _replies_.

But if you wanted **real-time push** (e.g., “session expired, log user out immediately”), you’d:

- Add a listener in preload:

  ```ts
  contextBridge.exposeInMainWorld("events", {
    onSessionExpired: (callback: (data: any) => void) => {
      ipcRenderer.on("session-expired", (event, data) => callback(data));
    },
  });
  ```

- And in main:

  ```ts
  mainWindow.webContents.send("session-expired", { reason: "Token expired" });
  ```

Now React can subscribe like:

```ts
window.events.onSessionExpired((data) => {
  alert("Session expired: " + data.reason);
});
```

---

✅ **Summary**

- Renderer → Main = what you’re doing now (`ipcRenderer.invoke` + `ipcMain.handle`).
- Main → Renderer = possible via `webContents.send` + `ipcRenderer.on`.
- Together, yes: **IPC is bidirectional**.
- Your preload is the “gatekeeper” to expose only safe channels.

---

Do you want me to sketch a **bidirectional example** for your POS app (e.g., main pushes “user updated” event to React when DB changes)?
