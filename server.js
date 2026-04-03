const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const taskDb = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (req, res) => {
  return res.json({
    message: "Express + Socket.IO server is running.",
    db: taskDb.dbPath,
  });
});

function successResponse(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function errorResponse(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

function parseTaskId(value) {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeAssignedTo(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return "user1";
}

app.get("/api/tasks", (req, res) => {
  return successResponse(res, taskDb.getAllTasks());
});

app.post("/api/tasks", (req, res) => {
  try {
    const { title, price } = req.body || {};

    if (!title || price === undefined) {
      return errorResponse(res, "title and price are required.", 400);
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return errorResponse(res, "price must be a valid number.", 400);
    }

    const newTask = taskDb.createTask({
      title: String(title),
      price: numericPrice,
    });
    io.emit("task:created", newTask);
    return successResponse(res, newTask, 201);
  } catch (error) {
    return errorResponse(res, "Unable to create task.", 500);
  }
});

app.post("/api/tasks/:id/accept", (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    const assignedTo = normalizeAssignedTo(req.body?.assignedTo);

    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }

    const result = taskDb.acceptTask(taskId, assignedTo);
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

app.post("/api/tasks/:id/complete", (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);

    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }

    const result = taskDb.completeTask(taskId);
    if (!result.ok) {
      return errorResponse(res, "Task not found.", 404);
    }

    io.emit("task:completed", result.task);
    return successResponse(res, result.task);
  } catch (error) {
    return errorResponse(res, "Unable to complete task.", 500);
  }
});

app.post("/api/accept-task", (req, res) => {
  try {
    const taskId = parseInt(req.body?.taskId, 10);
    const assignedTo = req.body?.assignedTo || "user1";

    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }

    const result = taskDb.acceptTask(taskId, assignedTo);
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

app.post("/task", (req, res) => {
  try {
    const { title, price } = req.body || {};

    if (!title || price === undefined) {
      return errorResponse(res, "title and price are required.", 400);
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return errorResponse(res, "price must be a valid number.", 400);
    }

    const newTask = taskDb.createTask({
      title: String(title),
      price: numericPrice,
    });
    io.emit("task:created", newTask);
    return successResponse(res, newTask, 201);
  } catch (error) {
    return errorResponse(res, "Unable to create task.", 500);
  }
});

app.get("/tasks", (req, res) => {
  return successResponse(res, taskDb.getAllTasks());
});

app.post("/task/:id/accept", (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const assignedTo = (req.body && req.body.assignedTo) || "user1";

    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }

    const result = taskDb.acceptTask(taskId, assignedTo);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return errorResponse(res, "Task not found.", 404);
      }
      return errorResponse(res, "Only tasks with status OPEN can be accepted.", 400);
    }

    io.emit("task:accepted", result.task);
    return successResponse(res, result.task);
  } catch (error) {
    return errorResponse(res, "Unable to accept task.", 500);
  }
});

app.post("/task/:id/complete", (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);

    if (Number.isNaN(taskId)) {
      return errorResponse(res, "Invalid task id.", 400);
    }

    const result = taskDb.completeTask(taskId);
    if (!result.ok) {
      return errorResponse(res, "Task not found.", 404);
    }

    io.emit("task:completed", result.task);
    return successResponse(res, result.task);
  } catch (error) {
    return errorResponse(res, "Unable to complete task.", 500);
  }
});

app.use((req, res) => {
  return errorResponse(res, "Route not found.", 404);
});

app.use((err, req, res, next) => {
  console.error(err);
  return errorResponse(res, "Internal server error.", 500);
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit("message", "Welcome to Socket.IO!");

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
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
