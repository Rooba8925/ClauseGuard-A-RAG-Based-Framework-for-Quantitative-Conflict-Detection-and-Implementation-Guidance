/**
 * ClauseGuard Frontend API Client
 */

export const api = {
  // Get preloaded clauses
  async getClauses() {
    const res = await fetch("/api/clauses");
    if (!res.ok) throw new Error("Failed to load clauses");
    return res.json();
  },

  // Get available pre-generated sample PDFs
  async getSamplePdfs() {
    const res = await fetch("/api/sample-pdfs");
    if (!res.ok) throw new Error("Failed to load sample PDFs");
    return res.json();
  },

  // Load and parse a built-in sample PDF
  async loadSamplePdf(filename, slot = "A", manualOverride = null) {
    const res = await fetch("/api/load-sample-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, slot, manualOverride })
    });
    if (!res.ok) throw new Error("Failed to load sample PDF content");
    return res.json();
  },

  // Upload custom PDF document
  async uploadPdf(file, slot = "A", manualOverride = null) {
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("slot", slot);
    if (manualOverride) {
      formData.append("manualOverride", JSON.stringify(manualOverride));
    }
    const res = await fetch("/api/upload-pdf", {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to parse PDF document");
    }
    return res.json();
  },

  // Get Supported Standards Registry from MySQL
  async getStandardsRegistry() {
    const res = await fetch("/api/standards-registry");
    if (!res.ok) throw new Error("Failed to load standards registry");
    return res.json();
  },

  // Manually confirm or override standard and version
  async confirmStandard({ filename, slot, standardCode, version, text }) {
    const res = await fetch("/api/confirm-standard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, slot, standardCode, version, text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to confirm standard specification");
    }
    return res.json();
  },

  // Identify document content and metadata on demand
  async identifyStandard({ text, filename, slot, expectedStandard, manualOverride }) {
    const res = await fetch("/api/identify-standard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, filename, slot, expectedStandard, manualOverride })
    });
    if (!res.ok) throw new Error("Failed to identify document standard");
    return res.json();
  },

  // Run full 3-stage pipeline (spaCy NER -> Rule-Based Engine -> Gemini Guidance)
  async compareClauses(clauseA, clauseB) {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clauseA, clauseB })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Comparison failed");
    }
    return res.json();
  },

  // Run Ground Truth Benchmark Evaluation
  async getBenchmark() {
    const res = await fetch("/api/benchmark");
    if (!res.ok) throw new Error("Failed to load benchmark evaluation");
    return res.json();
  },

  // Get Engineer Sign-off & Audit Log records
  async getReviews() {
    const res = await fetch("/api/reviews");
    if (!res.ok) throw new Error("Failed to load audit logs");
    return res.json();
  },

  // Submit engineer sign-off / override
  async submitReview(reviewData) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewData)
    });
    if (!res.ok) throw new Error("Failed to save audit record");
    return res.json();
  },

  // Chat-driven comparison: query against two uploaded PDFs
  async chatCompare({ query, clausesA, clausesB, filenameA, filenameB }) {
    const res = await fetch("/api/chat-compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, clausesA, clausesB, filenameA, filenameB })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Chat comparison failed");
    }
    return res.json();
  },

  // Get chat sessions (admin sees all, employee sees own)
  async getChatSessions(username, role) {
    const res = await fetch(`/api/chat-sessions?user=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`);
    if (!res.ok) throw new Error("Failed to load chat sessions");
    return res.json();
  },

  // Save a chat session to backend
  async saveChatSession(session) {
    const res = await fetch("/api/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error("Failed to save chat session");
    return res.json();
  }
};
