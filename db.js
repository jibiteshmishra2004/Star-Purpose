/**
 * SQLite persistence for users and tasks.
 * Set SQLITE_PATH to override the default file location.
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DEFAULT_TASK_MINUTES = 60;

/** Default platform commission */
function defaultCommissionRate() {
  const row = db.prepare("SELECT value FROM platform_config WHERE key = 'PLATFORM_COMMISSION_PCT'").get();
  if (row && row.value) {
    const n = Number(row.value);
    if (Number.isFinite(n)) return Math.min(0.2, Math.max(0.1, n));
  }
  const raw = process.env.PLATFORM_COMMISSION_PCT;
  if (raw === undefined || raw === "") return 0.15;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0.15;
  return Math.min(0.2, Math.max(0.1, n));
}

function setPlatformConfig(key, value) {
  db.prepare("INSERT INTO platform_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "data", "star-purpose.db");

/** Local default admin (override with ADMIN_EMAIL / ADMIN_PASSWORD in .env). */
const DEFAULT_ADMIN_EMAIL = "jibiteshkumarmishra8027@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "jibitesh@2004";

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'seller', 'admin')),
    skills TEXT,
    balance REAL NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'suspended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS platform_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT NOT NULL,
    assigned_to TEXT,
    description TEXT NOT NULL DEFAULT '',
    time_estimate_minutes INTEGER NOT NULL DEFAULT ${DEFAULT_TASK_MINUTES},
    difficulty TEXT NOT NULL DEFAULT 'Medium',
    category TEXT NOT NULL DEFAULT 'General',
    posted_by TEXT NOT NULL DEFAULT '',
    seller_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (seller_id) REFERENCES users (id)
  );
`);

function columnExists(table, name) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === name);
}

function migrate() {
  const taskCols = [
    ["description", "ALTER TABLE tasks ADD COLUMN description TEXT NOT NULL DEFAULT ''"],
    [
      "time_estimate_minutes",
      `ALTER TABLE tasks ADD COLUMN time_estimate_minutes INTEGER NOT NULL DEFAULT ${DEFAULT_TASK_MINUTES}`,
    ],
    ["difficulty", "ALTER TABLE tasks ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'Medium'"],
    ["category", "ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'General'"],
    ["posted_by", "ALTER TABLE tasks ADD COLUMN posted_by TEXT NOT NULL DEFAULT ''"],
    ["seller_id", "ALTER TABLE tasks ADD COLUMN seller_id INTEGER"],
    ["created_at", "ALTER TABLE tasks ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))"],
    ["commission_rate", "ALTER TABLE tasks ADD COLUMN commission_rate REAL NOT NULL DEFAULT 0.15"],
    ["commission", "ALTER TABLE tasks ADD COLUMN commission REAL NOT NULL DEFAULT 0"],
    ["user_earning", "ALTER TABLE tasks ADD COLUMN user_earning REAL NOT NULL DEFAULT 0"],
    ["admin_revenue", "ALTER TABLE tasks ADD COLUMN admin_revenue REAL NOT NULL DEFAULT 0"],
    ["contact_info", "ALTER TABLE tasks ADD COLUMN contact_info TEXT NOT NULL DEFAULT ''"],
    ["requires_contact", "ALTER TABLE tasks ADD COLUMN requires_contact INTEGER NOT NULL DEFAULT 0"],
    ["submission_json", "ALTER TABLE tasks ADD COLUMN submission_json TEXT"],
  ];
  for (const [name, sql] of taskCols) {
    if (!columnExists("tasks", name)) {
      try {
        db.exec(sql);
      } catch (e) {
        console.warn(`Migration skip ${name}:`, e.message);
      }
    }
  }
  try {
    db.exec(`UPDATE tasks SET status = 'PAID' WHERE status = 'DONE'`);
  } catch (e) {
    console.warn("Migration skip DONE→PAID:", e.message);
  }
}

migrate();

function rowToUserPublic(row) {
  if (!row) return null;
  const parts = String(row.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const avatar =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0] || "?").slice(0, 2).toUpperCase();
  let skills = [];
  if (row.skills) {
    try {
      skills = JSON.parse(row.skills);
    } catch {
      skills = [];
    }
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    skills: Array.isArray(skills) ? skills : [],
    balance: row.balance,
    tasksCompleted: row.tasks_completed,
    rating: row.rating,
    status: row.status,
    joinedAt: row.created_at,
    avatar,
  };
}

function getUserById(id) {
  return rowToUserPublic(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
}

function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email);
}

function getAllUsers() {
  return db
    .prepare("SELECT * FROM users ORDER BY id ASC")
    .all()
    .map(rowToUserPublic);
}

function createUser({ email, name, password, role, skills }) {
  const info = db
    .prepare(
      "INSERT INTO users (email, name, password, role, skills) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      String(email).trim(),
      String(name).trim(),
      String(password),
      role,
      skills && skills.length ? JSON.stringify(skills) : null,
    );
  return getUserById(Number(info.lastInsertRowid));
}

function verifyLogin(email, password) {
  const row = getUserByEmail(email);
  if (!row || row.password !== password) return null;
  return rowToUserPublic(row);
}

function updateUserStatus(userId, status) {
  const r = db
    .prepare("UPDATE users SET status = ? WHERE id = ?")
    .run(status, userId);
  if (r.changes === 0) return null;
  return getUserById(userId);
}

function clampCommissionRate(rate) {
  const fallback = defaultCommissionRate();
  if (rate === undefined || rate === null) return fallback;
  const n = Number(rate);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(0.2, Math.max(0.1, n));
}

function rowToTask(row) {
  if (!row) return null;
  let submission = null;
  if (row.submission_json) {
    try {
      submission = JSON.parse(row.submission_json);
    } catch {
      submission = null;
    }
  }
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    status: row.status,
    assignedTo: row.assigned_to,
    description: row.description ?? "",
    timeEstimateMinutes: row.time_estimate_minutes ?? DEFAULT_TASK_MINUTES,
    difficulty: row.difficulty ?? "Medium",
    category: row.category ?? "General",
    postedBy: row.posted_by ?? "",
    sellerId: row.seller_id ?? null,
    createdAt: row.created_at ?? "",
    commissionRate: row.commission_rate != null ? Number(row.commission_rate) : defaultCommissionRate(),
    commission: row.commission != null ? Number(row.commission) : 0,
    userEarning: row.user_earning != null ? Number(row.user_earning) : 0,
    adminRevenue: row.admin_revenue != null ? Number(row.admin_revenue) : 0,
    contactInfo: row.contact_info ?? "",
    requiresContact: Boolean(row.requires_contact),
    submission,
  };
}

function getAllTasks() {
  return db
    .prepare("SELECT * FROM tasks ORDER BY id DESC")
    .all()
    .map(rowToTask);
}

function getTaskById(id) {
  return rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
}

function createTask({
  title,
  price,
  description,
  timeEstimateMinutes,
  difficulty,
  category,
  postedBy,
  sellerId,
  contactInfo,
  requiresContact,
  commissionRate,
}) {
  const rawMin = Number(timeEstimateMinutes);
  const mins = Number.isFinite(rawMin) && rawMin > 0 ? Math.floor(rawMin) : DEFAULT_TASK_MINUTES;
  const rate = clampCommissionRate(commissionRate);
  const reqContact = requiresContact ? 1 : 0;
  const info = db
    .prepare(
      `INSERT INTO tasks (
        title, price, status, assigned_to,
        description, time_estimate_minutes, difficulty, category, posted_by, seller_id,
        commission_rate, contact_info, requires_contact
      ) VALUES (?, ?, 'PENDING_PAYMENT', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      String(title),
      Number(price),
      String(description ?? ""),
      Math.max(1, mins),
      String(difficulty ?? "Medium"),
      String(category ?? "General"),
      String(postedBy ?? ""),
      sellerId != null ? Number(sellerId) : null,
      rate,
      String(contactInfo ?? "").trim(),
      reqContact,
    );
  return getTaskById(Number(info.lastInsertRowid));
}

function publishTaskAfterPayment(taskId, sellerId) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  if (task.status !== "PENDING_PAYMENT") return { ok: false, reason: "not_pending" };
  if (Number(task.sellerId) !== Number(sellerId)) return { ok: false, reason: "forbidden" };
  db.prepare("UPDATE tasks SET status = 'OPEN' WHERE id = ?").run(taskId);
  return { ok: true, task: getTaskById(taskId) };
}

function acceptTask(taskId, assignedToEmail) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  if (task.status !== "OPEN") return { ok: false, reason: "not_open" };
  db.prepare(
    "UPDATE tasks SET status = 'ASSIGNED', assigned_to = ? WHERE id = ?",
  ).run(String(assignedToEmail).trim(), taskId);
  return { ok: true, task: getTaskById(taskId) };
}

function submitTask(taskId, assignedToEmail, submission) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  if (task.status !== "ASSIGNED") return { ok: false, reason: "not_assigned" };
  const want = String(assignedToEmail).trim().toLowerCase();
  const got = task.assignedTo ? String(task.assignedTo).trim().toLowerCase() : "";
  if (!got || got !== want) return { ok: false, reason: "not_assignee" };
  const payload = {
    text: submission?.text != null ? String(submission.text) : "",
    link: submission?.link != null ? String(submission.link) : "",
    file: submission?.file != null ? String(submission.file) : null,
  };
  db.prepare("UPDATE tasks SET status = 'SUBMITTED', submission_json = ? WHERE id = ?").run(
    JSON.stringify(payload),
    taskId,
  );
  return { ok: true, task: getTaskById(taskId) };
}

function approveTaskBySeller(taskId, sellerId) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  if (task.status !== "SUBMITTED") return { ok: false, reason: "not_submitted" };
  if (Number(task.sellerId) !== Number(sellerId)) return { ok: false, reason: "forbidden" };
  const price = Number(task.price) || 0;
  const rate = clampCommissionRate(task.commissionRate);
  const commission = Math.round(price * rate * 100) / 100;
  const userEarning = Math.round((price - commission) * 100) / 100;

  const assignee = task.assignedTo ? getUserByEmail(String(task.assignedTo).trim()) : null;
  if (!assignee) return { ok: false, reason: "assignee_missing" };

  db.prepare(
    "UPDATE users SET balance = balance + ?, tasks_completed = tasks_completed + 1 WHERE id = ?",
  ).run(userEarning, assignee.id);

  const adminEmail = String(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim();
  const adminRow = getUserByEmail(adminEmail);
  if (adminRow) {
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(commission, adminRow.id);
  }

  db.prepare(
    "UPDATE tasks SET status = 'PAID', commission = ?, user_earning = ?, admin_revenue = ? WHERE id = ?",
  ).run(commission, userEarning, commission, taskId);

  return { ok: true, task: getTaskById(taskId) };
}

function rejectTaskBySeller(taskId, sellerId) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  if (task.status !== "SUBMITTED") return { ok: false, reason: "not_submitted" };
  if (Number(task.sellerId) !== Number(sellerId)) return { ok: false, reason: "forbidden" };
  db.prepare("UPDATE tasks SET status = 'REJECTED' WHERE id = ?").run(taskId);
  return { ok: true, task: getTaskById(taskId) };
}

/** Create or upgrade the configured admin email (role + password). Public signup cannot create admin. */
function ensureAdminAccount() {
  const email = String(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  if (!email || !password) return;
  const row = getUserByEmail(email);
  if (!row) {
    createUser({
      email,
      name: process.env.ADMIN_NAME || "Admin",
      password,
      role: "admin",
      skills: null,
    });
    console.log(`Admin account created: ${email}`);
    return;
  }
  db.prepare(
    "UPDATE users SET role = 'admin', password = ? WHERE lower(email) = lower(?)",
  ).run(password, email);
  console.log(`Admin account ensured: ${email}`);
}

ensureAdminAccount();

module.exports = {
  dbPath,
  db,
  DEFAULT_TASK_MINUTES,
  defaultCommissionRate,
  getAllTasks,
  getTaskById,
  createTask,
  acceptTask,
  publishTaskAfterPayment,
  submitTask,
  approveTaskBySeller,
  rejectTaskBySeller,
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  verifyLogin,
  updateUserStatus,
  setPlatformConfig,
};
