const express = require("express");
const cors = require("cors");

const authMiddleware = require("../middleware/auth");
const chatRoutes = require("../routes/chat");
const uploadRoutes = require("../routes/upload");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;