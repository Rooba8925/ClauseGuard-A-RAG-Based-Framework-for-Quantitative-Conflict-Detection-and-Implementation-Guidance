/**
 * ClauseGuard - Backend Server Entry Point
 * REST API Layer for Numeric Extraction, Rule-Based Comparison Engine,
 * Gemini Explanation & Guidance, and Human-in-the-Loop Review.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import apiRouter from "./routes/api.js";
import { dbService } from "./services/dbService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database (Supported Standards Registry in MySQL with file fallback)
dbService.initialize().catch(err => {
  console.warn("[ClauseGuard Database] DB initialization notice:", err.message);
});

app.use(cors({ origin: "*" }));
app.use(express.json());

// Serve static PDF samples & uploads
app.use("/data/samples", express.static(path.resolve("./data/samples")));
app.use("/data/uploads", express.static(path.resolve("./data/uploads")));

// API Routes
app.use("/api", apiRouter);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    project: "ClauseGuard",
    system: "Quantitative Conflict Detection & Implementation Guidance Framework",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[ClauseGuard Backend] Running on http://localhost:${PORT}`);
  console.log(`[ClauseGuard Backend] Health check: http://localhost:${PORT}/health`);
  console.log(`[ClauseGuard Backend] Benchmark endpoint: http://localhost:${PORT}/api/benchmark`);
});
