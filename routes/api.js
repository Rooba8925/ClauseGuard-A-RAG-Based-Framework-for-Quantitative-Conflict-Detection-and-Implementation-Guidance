/**
 * ClauseGuard - Express API Router
 * Endpoints for PDF upload, extraction, deterministic rule-based comparison,
 * guidance, benchmark, and engineer sign-off audit log.
 */

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { SpacyNerService } from "../services/spacyNerService.js";
import { ComparisonEngine } from "../services/comparisonEngine.js";
import { GeminiService } from "../services/geminiService.js";
import { BenchmarkService } from "../services/benchmarkService.js";
import { FeedbackService } from "../services/feedbackService.js";
import { PdfService } from "../services/pdfService.js";
import { DEFAULT_CLAUSES } from "../config/defaultClauses.js";
import { dbService } from "../services/dbService.js";
import { StandardIdentificationService } from "../services/standardIdentificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSamplesDir() {
  const candidates = [
    path.join(__dirname, "..", "data", "samples"),
    path.resolve("./backend/data/samples"),
    path.resolve("./data/samples")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

function getUploadsDir() {
  const candidates = [
    path.join(__dirname, "..", "data", "uploads"),
    path.resolve("./backend/data/uploads"),
    path.resolve("./data/uploads")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  fs.mkdirSync(candidates[0], { recursive: true });
  return candidates[0];
}

function getSessionsFile() {
  const candidates = [
    path.join(__dirname, "..", "data", "chat_sessions.json"),
    path.resolve("./backend/data/chat_sessions.json"),
    path.resolve("./data/chat_sessions.json")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

/**
 * GET /api/clauses
 * Returns preloaded active engineering clauses
 */
router.get("/clauses", (req, res) => {
  res.json({ clauses: DEFAULT_CLAUSES });
});

/**
 * GET /api/pdf/:filename
 * Streams the PDF document inline so browser / PDF modal can display it at specific pages
 */
router.get("/pdf/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const samplesDir = getSamplesDir();
    const uploadsDir = getUploadsDir();

    let filePath = path.join(samplesDir, filename);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(uploadsDir, filename);
    }

    if (!fs.existsSync(filePath)) {
      // Also try matching without extension or case-insensitively
      const sampleFiles = fs.existsSync(samplesDir) ? fs.readdirSync(samplesDir) : [];
      const match = sampleFiles.find(f => f.toLowerCase() === filename.toLowerCase() || f.toLowerCase().includes(filename.toLowerCase()));
      if (match) {
        filePath = path.join(samplesDir, match);
      } else {
        return res.status(404).json({ error: `PDF document '${filename}' not found` });
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("PDF stream error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sample-pdfs
 * Returns list of pre-generated sample standards PDFs available for testing
 */
router.get("/sample-pdfs", (req, res) => {
  try {
    const samplesDir = getSamplesDir();
    if (!fs.existsSync(samplesDir)) {
      return res.json({ samples: [] });
    }
    const files = fs.readdirSync(samplesDir).filter(f => f.endsWith(".pdf"));
    res.json({
      samples: files.map(f => ({
        filename: f,
        name: f.replace(".pdf", "").replace(/_/g, " "),
        sizeBytes: fs.statSync(path.join(samplesDir, f)).size
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/standards-registry
 * Returns the Supported Standards Registry maintained in MySQL
 */
router.get("/standards-registry", async (req, res) => {
  try {
    const registry = await dbService.getStandardsRegistry();
    res.json({
      success: true,
      count: registry.length,
      isMySQLConnected: dbService.isMySQLConnected,
      registry
    });
  } catch (err) {
    console.error("Standards registry retrieval error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/identify-standard
 * Pre-extraction / On-demand Standard Identification & Version Validation
 */
router.post("/identify-standard", async (req, res) => {
  try {
    const { text = "", filename = "", slot = "A", expectedStandard = null, manualOverride = null } = req.body;
    const validation = await StandardIdentificationService.identifyAndValidate({
      text,
      filename,
      slot,
      expectedStandard,
      manualOverride
    });
    res.json({ success: true, ...validation });
  } catch (err) {
    console.error("Standard identification error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/confirm-standard
 * User manual fallback confirmation with publisher audit disclaimer
 */
router.post("/confirm-standard", async (req, res) => {
  try {
    const { filename = "", slot = "A", standardCode, version, text = "" } = req.body;
    if (!standardCode) {
      return res.status(400).json({ error: "standardCode is required for manual confirmation" });
    }
    const validation = await StandardIdentificationService.identifyAndValidate({
      text,
      filename,
      slot,
      manualOverride: { standardCode, version }
    });
    res.json({ success: true, ...validation });
  } catch (err) {
    console.error("Manual standard confirmation error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/document-validation-logs
 * Retrieves audit logs of validated documents from MySQL
 */
router.get("/document-validation-logs", async (req, res) => {
  try {
    const logs = await dbService.getValidationLogs(parseInt(req.query.limit || "50", 10));
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/load-sample-pdf
 * Parses a built-in sample PDF, performs Standard & Version Validation, and extracts spaCy NER entities
 */
router.post("/load-sample-pdf", async (req, res) => {
  try {
    const { filename, slot = "A", expectedStandard = null, manualOverride = null } = req.body;
    if (!filename) return res.status(400).json({ error: "filename is required" });

    const samplesDir = getSamplesDir();
    const filePath = path.join(samplesDir, path.basename(filename));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Sample PDF not found" });
    }

    const buffer = fs.readFileSync(filePath);
    const result = await PdfService.extractFromPdfBuffer(buffer, filename);

    // Standard Identification and Version Validation step (Integrated before NER comparison)
    const standardValidation = await StandardIdentificationService.identifyAndValidate({
      text: result.fullText || "",
      filename,
      slot,
      expectedStandard,
      manualOverride
    });

    res.json({
      success: true,
      ...result,
      standardValidation
    });
  } catch (err) {
    console.error("Load sample PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/upload-pdf
 * Accepts PDF file upload, validates standard & version against MySQL registry,
 * saves to data/uploads, extracts text page-by-page, and extracts spaCy NER entities.
 */
router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const uploadsDir = getUploadsDir();
    const filename = req.file.originalname || `uploaded_${Date.now()}.pdf`;
    const savedPath = path.join(uploadsDir, filename);
    fs.writeFileSync(savedPath, req.file.buffer);

    const result = await PdfService.extractFromPdfBuffer(req.file.buffer, filename);

    const slot = req.body.slot || "A";
    const expectedStandard = req.body.expectedStandard || null;
    let manualOverride = null;
    if (req.body.manualOverride) {
      try {
        manualOverride = typeof req.body.manualOverride === "string"
          ? JSON.parse(req.body.manualOverride)
          : req.body.manualOverride;
      } catch (e) {
        manualOverride = null;
      }
    }

    // Standard Identification & Version Validation step before spaCy pipeline
    const standardValidation = await StandardIdentificationService.identifyAndValidate({
      text: result.fullText || "",
      filename,
      slot,
      expectedStandard,
      manualOverride
    });

    res.json({
      success: true,
      filename,
      totalPages: result.totalPages,
      extractedClausesCount: result.extractedClauses.length,
      entitiesCount: result.entities.length,
      extractedClauses: result.extractedClauses,
      entities: result.entities,
      standardValidation
    });
  } catch (err) {
    console.error("PDF upload extraction error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/extract
 * Stage 1: Numeric Parameter Extraction via custom spaCy NER model
 */
router.post("/extract", (req, res) => {
  try {
    const { clauseText } = req.body;
    if (!clauseText) {
      return res.status(400).json({ error: "clauseText is required" });
    }
    const entities = SpacyNerService.extractEntities(clauseText);
    res.json({ success: true, entities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/compare
 * Full 3-Stage Pipeline with PDF Citations and Strict Classification:
 *  1. Custom spaCy NER parameter extraction from both clauses
 *  2. Multi-rule deterministic rule-based engine comparison
 *  3. Citations attached to each finding
 *  4. Gemini explanation and implementation guidance
 */
router.post("/compare", async (req, res) => {
  try {
    const {
      clauseA, // { standard, clauseNo, text, citation, snippet }
      clauseB  // { standard, clauseNo, text, citation, snippet }
    } = req.body;

    if (!clauseA?.text || !clauseB?.text) {
      return res.status(400).json({ error: "Both clauseA and clauseB with text are required" });
    }

    const standardA = clauseA.standard || "Standard A";
    const standardB = clauseB.standard || "Standard B";

    // STAGE 1: Extract numeric parameters using spaCy NER model
    const paramsA = SpacyNerService.extractEntities(clauseA.text);
    const paramsB = SpacyNerService.extractEntities(clauseB.text);

    // Check for vague qualitative wording
    if (paramsA.length === 0 && (clauseA.text.toLowerCase().includes("clearance") || clauseA.text.toLowerCase().includes("appropriate"))) {
      paramsA.push({
        parameter: "Clearance Requirement",
        rawParameter: "clearance",
        value: null,
        unit: "N/A",
        condition: "qualitative/vague",
        isVague: true,
        citation: clauseA.citation || `${standardA} Specification`,
        clauseSnippet: clauseA.text
      });
    }

    if (paramsB.length === 0 && (clauseB.text.toLowerCase().includes("clearance") || clauseB.text.toLowerCase().includes("appropriate"))) {
      paramsB.push({
        parameter: "Clearance Requirement",
        rawParameter: "clearance",
        value: null,
        unit: "N/A",
        condition: "qualitative/vague",
        isVague: true,
        citation: clauseB.citation || `${standardB} Specification`,
        clauseSnippet: clauseB.text
      });
    }

    const comparisons = [];

    // Match parameters between Standard A and Standard B
    const allParamNames = new Set([
      ...paramsA.map(p => p.parameter),
      ...paramsB.map(p => p.parameter)
    ]);

    for (const paramName of allParamNames) {
      const matchA = paramsA.find(p => p.parameter === paramName);
      const matchB = paramsB.find(p => p.parameter === paramName);

      // STAGE 2: Deterministic Rule-Based Comparison Engine
      const ruleResult = ComparisonEngine.comparePair({
        paramA: matchA,
        standardAName: standardA,
        sourceA: clauseA.citation || `${clauseA.clauseNo || ""} (${clauseA.standard})`,
        citationA: clauseA.citation,
        snippetA: clauseA.text,
        paramB: matchB,
        standardBName: standardB,
        sourceB: clauseB.citation || `${clauseB.clauseNo || ""} (${clauseB.standard})`,
        citationB: clauseB.citation,
        snippetB: clauseB.text,
        parameterName: paramName
      });

      // STAGE 3: Gemini API Explanation and Implementation Guidance
      const guidance = await GeminiService.explainAndGuide(ruleResult);

      comparisons.push({
        id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        parameter: paramName,
        outcome: ruleResult.outcome,
        classification: ruleResult.classification,
        when: ruleResult.when,
        action: ruleResult.action,
        rawCategory: ruleResult.classification,
        flagForReview: ruleResult.flagForReview,
        severity: ruleResult.severity,
        rulesTriggered: ruleResult.rulesTriggered,
        ruleSummary: ruleResult.ruleSummary,
        combinedConstraint: ruleResult.combinedConstraint,
        commonPermissibleSolution: ruleResult.combinedConstraint,
        citations: ruleResult.citations,
        comparisonDetails: ruleResult.comparisonDetails,
        engineConclusion: ruleResult.engineConclusion,
        explanation: guidance.explanation,
        implementationGuidance: guidance.implementationGuidance,
        recommendedDesignValue: ruleResult.combinedConstraint || guidance.recommendedDesignValue,
        guidanceSource: guidance.source,
        extractedA: matchA || null,
        extractedB: matchB || null,
        timestamp: new Date().toISOString()
      });
    }

    // If maximum constraint satisfies and results in CONSISTENT, omit secondary minimum condition
    const hasConsistentMax = comparisons.some(c => 
      (c.outcome === "CONSISTENT" || c.classification === "Consistent") &&
      (c.parameter.toLowerCase().includes("max") || c.parameter.toLowerCase().includes("riser"))
    );

    const finalComparisons = hasConsistentMax
      ? comparisons.filter(c => !c.parameter.toLowerCase().includes("min riser"))
      : comparisons;

    res.json({
      success: true,
      standardA,
      standardB,
      extractedA: paramsA,
      extractedB: paramsB,
      comparisons: finalComparisons,
      summary: {
        totalParameters: finalComparisons.length,
        consistent: finalComparisons.filter(c => c.classification === "Consistent" || c.outcome === "CONSISTENT").length,
        conflicts: finalComparisons.filter(c => c.classification === "Conflict" || c.outcome === "CONFLICT").length,
        gaps: finalComparisons.filter(c => c.classification === "Gap" || c.outcome === "GAP").length,
        flaggedForReview: finalComparisons.filter(c => c.classification === "Flag for Review" || c.outcome === "FLAG FOR REVIEW" || c.flagForReview).length
      }
    });
  } catch (err) {
    console.error("Comparison pipeline error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/benchmark
 * Runs Ground Truth Evaluation against the project's labeled dataset
 */
router.get("/benchmark", async (req, res) => {
  try {
    const report = await BenchmarkService.runBenchmarkEvaluation();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reviews
 * Human-in-the-loop engineer audit log records
 */
router.get("/reviews", (req, res) => {
  try {
    const reviews = FeedbackService.getReviews();
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reviews
 * Human-in-the-loop override / engineer sign-off
 */
router.post("/reviews", (req, res) => {
  try {
    const record = FeedbackService.saveReview(req.body);
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat-compare
 * Chat-driven comparison: finds best matching clause from each uploaded PDF
 * based on the user's query, then runs the full 3-stage pipeline.
 */
router.post("/chat-compare", async (req, res) => {
  try {
    const {
      query,
      clausesA = [],   // extracted clauses from PDF A
      clausesB = [],   // extracted clauses from PDF B
      filenameA = "Standard A",
      filenameB = "Standard B"
    } = req.body;

    if (!query) return res.status(400).json({ error: "query is required" });
    if (!clausesA.length || !clausesB.length) {
      return res.status(400).json({ error: "Both Standard A and Standard B clauses are required" });
    }

    const queryLower = query.toLowerCase();
    const engKeywords = ["riser", "stair", "clearance", "height", "width", "depth",
      "shall", "must", "maximum", "minimum", "not exceed", "at least",
      "tread", "load", "pressure", "diameter", "thickness", "temperature"];

    // Score a clause against the query
    const scoreClause = (clause) => {
      const text = (clause.text || "").toLowerCase();
      const words = queryLower.split(/\s+/).filter(w => w.length > 2);
      let score = 0;
      for (const word of words) {
        if (text.includes(word)) score += word.length > 5 ? 2 : 1;
      }
      for (const kw of engKeywords) {
        if (queryLower.includes(kw) && text.includes(kw)) score += 3;
      }
      return score;
    };

    // Pick best matching clause from each PDF
    const bestA = clausesA.map(c => ({ clause: c, score: scoreClause(c) })).sort((a, b) => b.score - a.score)[0];
    const bestB = clausesB.map(c => ({ clause: c, score: scoreClause(c) })).sort((a, b) => b.score - a.score)[0];

    if (!bestA || bestA.score === 0) {
      return res.json({
        found: false,
        flagForReview: true,
        answer: `No relevant clause found in "${filenameA}" matching your query.`,
        recommendation: "FLAG FOR HUMAN REVIEW — Could not locate a matching requirement in Standard A."
      });
    }
    if (!bestB || bestB.score === 0) {
      return res.json({
        found: false,
        flagForReview: true,
        answer: `No relevant clause found in "${filenameB}" matching your query.`,
        recommendation: "FLAG FOR HUMAN REVIEW — Could not locate a matching requirement in Standard B."
      });
    }

    const clauseA = {
      standard: filenameA.replace(".pdf", ""),
      text: bestA.clause.text,
      citation: bestA.clause.citation
    };
    const clauseB = {
      standard: filenameB.replace(".pdf", ""),
      text: bestB.clause.text,
      citation: bestB.clause.citation
    };

    const standardA = clauseA.standard;
    const standardB = clauseB.standard;

    // STAGE 1: spaCy NER extraction
    const paramsA = SpacyNerService.extractEntities(clauseA.text);
    const paramsB = SpacyNerService.extractEntities(clauseB.text);

    // Handle vague clauses
    const addVague = (params, clause, standard) => {
      if (params.length === 0 && /clearance|appropriate|suitable|adequate/i.test(clause.text)) {
        params.push({ parameter: "Clearance Requirement", value: null, unit: "N/A", condition: "qualitative/vague", isVague: true });
      }
    };
    addVague(paramsA, clauseA, standardA);
    addVague(paramsB, clauseB, standardB);

    // Filter by user condition (min/max):
    // If user asked specifically for max, only evaluate max.
    // If user asked specifically for min, only evaluate min.
    // Otherwise (general query like "riser height"), evaluate both.
    const wantsMax = /\b(max|maximum|ceiling|upper)\b/i.test(queryLower);
    const wantsMin = /\b(min|minimum|floor|lower)\b/i.test(queryLower);

    const isMaxParam = (p) => /max|maximum|ceiling|upper|not exceed|≤/i.test(p.parameter || "") ||
                              /max|maximum|ceiling|upper|not exceed|≤/i.test(p.condition || "") ||
                              /max|maximum|ceiling|upper|not exceed|≤/i.test(p.boundType || "");

    const isMinParam = (p) => /min|minimum|floor|lower|not less|≥/i.test(p.parameter || "") ||
                              /min|minimum|floor|lower|not less|≥/i.test(p.condition || "") ||
                              /min|minimum|floor|lower|not less|≥/i.test(p.boundType || "");

    let activeParamsA = paramsA;
    let activeParamsB = paramsB;

    if (wantsMax && !wantsMin) {
      const filteredA = paramsA.filter(isMaxParam);
      const filteredB = paramsB.filter(isMaxParam);
      if (filteredA.length > 0 || filteredB.length > 0) {
        activeParamsA = filteredA;
        activeParamsB = filteredB;
      }
    } else if (wantsMin && !wantsMax) {
      const filteredA = paramsA.filter(isMinParam);
      const filteredB = paramsB.filter(isMinParam);
      if (filteredA.length > 0 || filteredB.length > 0) {
        activeParamsA = filteredA;
        activeParamsB = filteredB;
      }
    }

    const comparisons = [];
    const allParamNames = new Set([...activeParamsA.map(p => p.parameter), ...activeParamsB.map(p => p.parameter)]);

    for (const paramName of allParamNames) {
      const matchA = activeParamsA.find(p => p.parameter === paramName);
      const matchB = activeParamsB.find(p => p.parameter === paramName);

      // STAGE 2: Rule-based comparison
      const ruleResult = ComparisonEngine.comparePair({
        paramA: matchA, standardAName: standardA, citationA: clauseA.citation, snippetA: clauseA.text,
        paramB: matchB, standardBName: standardB, citationB: clauseB.citation, snippetB: clauseB.text,
        parameterName: paramName
      });

      // STAGE 3: Gemini explanation
      const guidance = await GeminiService.explainAndGuide(ruleResult);

      comparisons.push({
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        parameter: paramName,
        outcome: ruleResult.outcome,
        classification: ruleResult.classification,
        flagForReview: ruleResult.flagForReview,
        ruleSummary: ruleResult.ruleSummary,
        engineConclusion: ruleResult.engineConclusion,
        combinedConstraint: ruleResult.combinedConstraint,
        citations: ruleResult.citations,
        comparisonDetails: ruleResult.comparisonDetails,
        explanation: guidance.explanation,
        implementationGuidance: guidance.implementationGuidance,
        guidanceSource: guidance.source,
        action: ruleResult.action
      });
    }

    res.json({
      found: true,
      query,
      standardA,
      standardB,
      matchedClauseA: { text: clauseA.text, citation: clauseA.citation, score: bestA.score },
      matchedClauseB: { text: clauseB.text, citation: clauseB.citation, score: bestB.score },
      extractedA: activeParamsA,
      extractedB: activeParamsB,
      comparisons,
      summary: {
        consistent: comparisons.filter(c => c.outcome === "CONSISTENT").length,
        conflicts: comparisons.filter(c => c.outcome === "CONFLICT").length,
        gaps: comparisons.filter(c => c.outcome === "GAP").length,
        flaggedForReview: comparisons.filter(c => c.flagForReview).length
      }
    });

  } catch (err) {
    console.error("Chat compare error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Chat Session Storage ─────────────────────────────────────────────────
const SESSIONS_FILE = path.resolve("./data/chat_sessions.json");

function readSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
  } catch (_) {}
  return [];
}

function writeSessions(sessions) {
  const dir = path.dirname(SESSIONS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

/**
 * GET /api/chat-sessions?user=<username>&role=<role>
 * Admin gets all sessions; employee gets only their own.
 */
router.get("/chat-sessions", (req, res) => {
  try {
    const { user, role } = req.query;
    let sessions = readSessions();
    if (role !== "admin" && user) {
      sessions = sessions.filter(s => s.username === user);
    }
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat-sessions
 * Save or update a chat session.
 */
router.post("/chat-sessions", (req, res) => {
  try {
    const session = req.body;
    if (!session || !session.username) {
      return res.status(400).json({ error: "session with username is required" });
    }
    const sessions = readSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = { ...sessions[idx], ...session, updatedAt: new Date().toISOString() };
    } else {
      sessions.unshift({ ...session, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeSessions(sessions.slice(0, 200));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
