/**
 * SQLite persistence for tasks (file-based, no separate database server).
 * Set SQLITE_PATH to override the default file location.
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "data", "star-purpose.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT NOT NULL,
    assigned_to TEXT
  );
`);

function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    status: row.status,
    assignedTo: row.assigned_to,
  };
}

function seedIfEmpty() {
  const { c } = db.prepare("SELECT COUNT(*) AS c FROM tasks").get();
  if (c > 0) return;
  const insert = db.prepare(
    "INSERT INTO tasks (title, price, status, assigned_to) VALUES (?, ?, ?, ?)",
  );
  insert.run("Set up project structure", 100, "OPEN", null);
  insert.run("Build socket events", 200, "ASSIGNED", "Bob");
}

seedIfEmpty();

function getAllTasks() {
  return db
    .prepare("SELECT * FROM tasks ORDER BY id ASC")
    .all()
    .map(rowToTask);
}

function getTaskById(id) {
  return rowToTask(
    db.prepare("SELECT * FROM tasks WHERE id = ?").get(id),
  );
}

function createTask({ title, price }) {
  const info = db
    .prepare(
      "INSERT INTO tasks (title, price, status, assigned_to) VALUES (?, ?, 'OPEN', NULL)",
    )
    .run(String(title), Number(price));
  return getTaskById(Number(info.lastInsertRowid));
}

function acceptTask(taskId, assignedTo) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  if (task.status !== "OPEN") return { ok: false, reason: "not_open" };
  db.prepare(
    "UPDATE tasks SET status = 'ASSIGNED', assigned_to = ? WHERE id = ?",
  ).run(assignedTo, taskId);
  return { ok: true, task: getTaskById(taskId) };
}

function completeTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: "not_found" };
  db.prepare("UPDATE tasks SET status = 'DONE' WHERE id = ?").run(taskId);
  return { ok: true, task: getTaskById(taskId) };
}

module.exports = {
  dbPath,
  getAllTasks,
  getTaskById,
  createTask,
  acceptTask,
  completeTask,
};
