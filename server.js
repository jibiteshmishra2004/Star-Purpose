require("dotenv").config();
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const taskDb = require("./db");

const DEFAULT_TASK_MINUTES = taskDb.DEFAULT_TASK_MINUTES;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
/** @type {Map<string, { userId: number, expiresAt: number }>} */
const sessions = new Map();

/** In-memory listing payments (mock escrow / platform wallet). */
const platformPayments = [];
let platformWalletBalance = 0;

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json({ limit: "12mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);

function successResponse(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function errorResponse(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: u.role,
    skills: u.skills || [],
    balance: u.balance,
    tasksCompleted: u.tasksCompleted,
    rating: u.rating,
    status: u.status,
    joinedAt: u.joinedAt,
    avatar: u.avatar,
  };
}

function createSessionToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId: Number(userId), expiresAt: Date.now() + SESSION_MS });
  return token;
}

function getBearerToken(req) {
  const h = req.headers.authorization;
  if (!h || typeof h !== "string" || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

function authUserFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const s = sessions.get(token);
  if (!s || s.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return taskDb.getUserById(s.userId);
}

function requireAuth(req, res, next) {
  const u = authUserFromRequest(req);
  if (!u || u.status !== "active") {
    return errorResponse(res, "Authentication required.", 401);
  }
  req.authUser = u;
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.authUser) return errorResponse(res, "Authentication required.", 401);
    if (!roles.includes(req.authUser.role)) {
      return errorResponse(res, "You do not have access to this action.", 403);
    }
    next();
  };
}

function parseTaskId(value) {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeAssignedTo(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

/** @param {ReturnType<typeof taskDb.getAllTasks>[number][]} all */
function filterTasksForViewer(all, user) {
  if (!user) return all.filter((t) => t.status === "OPEN");
  if (user.role === "admin") return all;
  if (user.role === "seller") {
    const sid = Number(user.id);
    return all.filter((t) => t.status === "OPEN" || Number(t.sellerId) === sid);
  }
  return all.filter((t) => t.status === "OPEN");
}

function saveSubmissionFile(taskId, base64, originalName) {
  if (!base64 || !originalName) return null;
  const buf = Buffer.from(String(base64), "base64");
  if (buf.length > 2 * 1024 * 1024) {
    throw new Error("File too large (max 2MB).");
  }
  const safe = path.basename(String(originalName)).replace(/[^a-zA-Z0-9._-]/g, "_");
  const fn = `task-${taskId}-${Date.now()}-${safe}`;
  const full = path.join(uploadsDir, fn);
  fs.writeFileSync(full, buf);
  return `/uploads/${fn}`;
}

app.get("/", (req, res) => {
  return res.json({
    message: "Express + Socket.IO server is running.",
    db: taskDb.dbPath,
  });
});

app.get("/api/stats", (req, res) => {
  try {
    const users = taskDb.getAllUsers();
    const tasks = taskDb.getAllTasks();
    const paid = tasks.filter((t) => t.status === "PAID");
    const paidOutTotal = paid.reduce((s, t) => s + (Number(t.userEarning) || 0), 0);
    return successResponse(res, {
      userCount: users.length,
      taskCount: tasks.length,
      completedCount: paid.length,
      paidOutTotal: Math.round(paidOutTotal * 100) / 100,
    });
  } catch (e) {
    return errorResponse(res, "Unable to load stats.", 500);
  }
});

app.get("/api/config", (req, res) => {
  return successResponse(res, {
    commissionPct: Math.round(taskDb.defaultCommissionRate() * 100),
  });
});

app.post("/api/config", requireAuth, requireRoles("admin"), (req, res) => {
  try {
    const { commissionPct } = req.body || {};
    if (commissionPct !== undefined) {
      const rate = Number(commissionPct);
      if (!Number.isFinite(rate) || rate < 10 || rate > 20) {
        return errorResponse(res, "Commission must be between 10% and 20%", 400);
      }
      taskDb.setPlatformConfig("PLATFORM_COMMISSION_PCT", String(rate / 100));
    }
    return successResponse(res, { commissionPct: Math.round(taskDb.defaultCommissionRate() * 100) });
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to save config.", 500);
  }
});

app.post("/api/register", (req, res) => {
  try {
    const { email, name, password, role, skills } = req.body || {};
    if (!email || !name || !password || !role) {
      return errorResponse(res, "email, name, password, and role are required.", 400);
    }
    const allowed = ["user", "seller"];
    if (!allowed.includes(role)) {
      return errorResponse(res, "Invalid role.", 400);
    }
    const existing = taskDb.getUserByEmail(String(email).trim());
    if (existing) {
      return errorResponse(res, "An account with this email already exists.", 409);
    }
    const user = taskDb.createUser({
      email: String(email).trim(),
      name: String(name).trim(),
      password: String(password),
      role,
      skills: Array.isArray(skills) ? skills : undefined,
    });
    const token = createSessionToken(user.id);
    return successResponse(res, { ...publicUser(user), token }, 201);
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to register.", 500);
  }
});

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return errorResponse(res, "email and password are required.", 400);
    }
    const user = taskDb.verifyLogin(String(email).trim(), String(password));
    if (!user) {
      return errorResponse(res, "Invalid email or password.", 401);
    }
    if (user.status !== "active") {
      return errorResponse(res, "Account is not active.", 403);
    }
    const token = createSessionToken(user.id);
    return successResponse(res, { ...publicUser(user), token });
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to log in.", 500);
  }
});

app.get("/api/users", requireAuth, requireRoles("admin"), (req, res) => {
  try {
    return successResponse(res, taskDb.getAllUsers().map(publicUser));
  } catch (e) {
    return errorResponse(res, "Unable to load users.", 500);
  }
});

app.get("/api/users/:id", requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return errorResponse(res, "Invalid user id.", 400);
    }
    const requester = req.authUser;
    const isAdmin = requester.role === "admin";
    const same = String(requester.id) === String(id);
    if (!isAdmin && !same) {
      return errorResponse(res, "Forbidden.", 403);
    }
    const user = taskDb.getUserById(id);
    if (!user) {
      return errorResponse(res, "User not found.", 404);
    }
    return successResponse(res, publicUser(user));
  } catch (e) {
    return errorResponse(res, "Unable to load user.", 500);
  }
});

app.patch("/api/users/:id", requireAuth, requireRoles("admin"), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return errorResponse(res, "Invalid user id.", 400);
    }
    const { status } = req.body || {};
    if (!status || !["active", "flagged", "suspended"].includes(status)) {
      return errorResponse(res, "Valid status is required.", 400);
    }
    const updated = taskDb.updateUserStatus(id, status);
    if (!updated) {
      return errorResponse(res, "User not found.", 404);
    }
    return successResponse(res, publicUser(updated));
  } catch (e) {
    return errorResponse(res, "Unable to update user.", 500);
  }
});

/** Task listing: OPEN tasks for everyone; sellers also see their own drafts and pipeline. */
app.get("/api/tasks", (req, res) => {
  try {
    const user = authUserFromRequest(req);
    const all = taskDb.getAllTasks();
    return successResponse(res, filterTasksForViewer(all, user));
  } catch (e) {
    return errorResponse(res, "Unable to load tasks.", 500);
  }
});

app.get("/api/admin/finance", requireAuth, requireRoles("admin"), (req, res) => {
  try {
    const tasks = taskDb.getAllTasks();
    const commissionTotal = tasks.reduce((s, t) => s + (Number(t.adminRevenue) || 0), 0);
    return successResponse(res, {
      platformWalletBalance: Math.round(platformWalletBalance * 100) / 100,
      listingPayments: platformPayments,
      commissionFromTasks: Math.round(commissionTotal * 100) / 100,
    });
  } catch (e) {
    return errorResponse(res, "Unable to load finance data.", 500);
  }
});

app.post("/api/tasks", requireAuth, requireRoles("seller"), (req, res) => {
  try {
    const seller = req.authUser;
    const {
      title,
      price,
      description,
      timeEstimate,
      timeEstimateMinutes,
      difficulty,
      category,
      postedBy,
      sellerId,
      contactInfo,
      requiresContact,
      commissionRate,
    } = req.body || {};

    if (!title || price === undefined) {
      return errorResponse(res, "title and price are required.", 400);
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return errorResponse(res, "price must be a positive number.", 400);
    }

    const sid = sellerId != null ? Number(sellerId) : Number(seller.id);
    if (Number(seller.id) !== sid) {
      return errorResponse(res, "sellerId must match your account.", 403);
    }

    const rawMin = Number(timeEstimateMinutes ?? timeEstimate);
    const minutes = Number.isFinite(rawMin) && rawMin > 0 ? rawMin : DEFAULT_TASK_MINUTES;

    const newTask = taskDb.createTask({
      title: String(title),
      price: numericPrice,
      description: description != null ? String(description) : "",
      timeEstimateMinutes: minutes,
      difficulty: difficulty != null ? String(difficulty) : "Medium",
      category: category != null ? String(category) : "General",
      postedBy: postedBy != null ? String(postedBy) : seller.name,
      sellerId: sid,
      contactInfo: contactInfo != null ? String(contactInfo) : "",
      requiresContact: Boolean(requiresContact),
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
    });
    io.emit("task:created", newTask);
    return successResponse(res, newTask, 201);
  } catch (error) {
    return errorResponse(res, "Unable to create task.", 500);
  }
});

/** Mock listing payment — moves task to OPEN and credits platform wallet (in-memory). */
app.post("/api/tasks/:id/pay", requireAuth, requireRoles("seller"), (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }
    const seller = req.authUser;
    const result = taskDb.publishTaskAfterPayment(taskId, Number(seller.id));
    if (!result.ok) {
      if (result.reason === "not_found") return errorResponse(res, "Task not found.", 404);
      if (result.reason === "forbidden") return errorResponse(res, "Forbidden.", 403);
      return errorResponse(res, "Payment is only allowed for tasks awaiting listing payment.", 400);
    }
    const amount = Number(result.task.price) || 0;
    platformWalletBalance += amount;
    platformPayments.push({
      id: crypto.randomUUID(),
      taskId,
      amount,
      sellerEmail: seller.email,
      type: "listing",
      createdAt: new Date().toISOString(),
    });
    io.emit("task:published", result.task);
    return successResponse(res, result.task);
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to process payment.", 500);
  }
});

app.post("/api/tasks/:id/submit", requireAuth, requireRoles("user"), (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }
    const { text, link, fileName, fileBase64 } = req.body || {};
    const t = String(text ?? "").trim();
    const l = String(link ?? "").trim();
    let fileUrl = null;
    try {
      fileUrl = saveSubmissionFile(taskId, fileBase64, fileName);
    } catch (err) {
      return errorResponse(res, err.message || "Invalid file.", 400);
    }
    if (!t && !l && !fileUrl) {
      return errorResponse(res, "Provide work: description text, a link, and/or a file.", 400);
    }
    const authEmail = String(req.authUser.email).trim();
    const result = taskDb.submitTask(taskId, authEmail, {
      text: t,
      link: l,
      file: fileUrl,
    });
    if (!result.ok) {
      if (result.reason === "not_found") return errorResponse(res, "Task not found.", 404);
      if (result.reason === "not_assignee") {
        return errorResponse(res, "Only the assigned user can submit work.", 403);
      }
      return errorResponse(res, "Task must be assigned to you before submission.", 400);
    }
    io.emit("task:submitted", result.task);
    return successResponse(res, result.task);
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to submit work.", 500);
  }
});

app.post("/api/tasks/:id/approve", requireAuth, requireRoles("seller"), (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }
    const seller = req.authUser;
    const result = taskDb.approveTaskBySeller(taskId, Number(seller.id));
    if (!result.ok) {
      if (result.reason === "not_found") return errorResponse(res, "Task not found.", 404);
      if (result.reason === "forbidden") return errorResponse(res, "Forbidden.", 403);
      if (result.reason === "assignee_missing") {
        return errorResponse(res, "Assignee missing for this task.", 400);
      }
      return errorResponse(res, "Only submitted tasks can be approved.", 400);
    }
    io.emit("task:approved", result.task);
    return successResponse(res, result.task);
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to approve.", 500);
  }
});

app.post("/api/tasks/:id/reject", requireAuth, requireRoles("seller"), (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }
    const seller = req.authUser;
    const result = taskDb.rejectTaskBySeller(taskId, Number(seller.id));
    if (!result.ok) {
      if (result.reason === "not_found") return errorResponse(res, "Task not found.", 404);
      if (result.reason === "forbidden") return errorResponse(res, "Forbidden.", 403);
      return errorResponse(res, "Only submitted tasks can be rejected.", 400);
    }
    io.emit("task:rejected", result.task);
    return successResponse(res, result.task);
  } catch (e) {
    console.error(e);
    return errorResponse(res, "Unable to reject.", 500);
  }
});

app.post("/api/tasks/:id/accept", requireAuth, requireRoles("user"), (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    const assignedEmail =
      normalizeAssignedTo(req.body?.assignedTo) ||
      normalizeAssignedTo(req.body?.email);

    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }
    if (!assignedEmail) {
      return errorResponse(res, "assignedTo (user email) is required.", 400);
    }
    const authEmail = String(req.authUser.email).trim().toLowerCase();
    if (assignedEmail.trim().toLowerCase() !== authEmail) {
      return errorResponse(res, "You can only accept tasks for your own account.", 403);
    }

    const result = taskDb.acceptTask(taskId, assignedEmail);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return errorResponse(res, "Task not found.", 404);
      }
      return errorResponse(
        res,
        "Only tasks with status OPEN can be accepted.",
        400,
      );
    }

    io.emit("task:accepted", result.task);
    return successResponse(res, result.task);
  } catch (error) {
    return errorResponse(res, "Unable to accept task.", 500);
  }
});

// In production, serve the React frontend from the dist folder
app.use(express.static(path.join(__dirname, "dist")));

// For all other routes NOT caught by /api, return the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  return errorResponse(res, "Internal server error.", 500);
});

io.on("connection", (socket) => {
  socket.emit("message", "Welcome to Socket.IO!");
  socket.on("disconnect", () => {});
});

const PORT = Number(process.env.PORT) || 5000;

server
  .listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`SQLite database file: ${taskDb.dbPath}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${PORT} is already in use. Another instance of this server (or another app) is listening.\n` +
          "Stop it first, or run on a different port (PowerShell: $env:PORT=3001; npm run server)\n" +
          `Windows (find PID):  netstat -ano | findstr :${PORT}\n` +
          `Windows (kill):      taskkill /PID <pid> /F\n`,
      );
      process.exit(1);
    }
    throw err;
  });
