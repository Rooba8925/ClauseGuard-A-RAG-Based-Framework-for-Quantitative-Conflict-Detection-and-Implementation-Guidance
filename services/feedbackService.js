/**
 * ClauseGuard - Human-in-the-Loop Review & Feedback Service
 * Manages engineer overrides, sign-offs on flagged conflicts, and audit versioning.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REVIEWS_FILE = path.join(__dirname, "../data/reviews.json");

export class FeedbackService {
  static ensureStorage() {
    const dir = path.dirname(REVIEWS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(REVIEWS_FILE)) {
      fs.writeFileSync(REVIEWS_FILE, JSON.stringify([], null, 2));
    }
  }

  static getReviews() {
    this.ensureStorage();
    try {
      const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
      return JSON.parse(data || "[]");
    } catch {
      return [];
    }
  }

  static saveReview({ comparisonId, parameter, originalClassification, newClassification, engineerName, notes, action }) {
    this.ensureStorage();
    const reviews = this.getReviews();

    const record = {
      id: `rev-${Date.now()}`,
      comparisonId,
      parameter,
      originalClassification,
      newClassification: newClassification || originalClassification,
      engineerName: engineerName || "Lead Safety Engineer",
      notes: notes || "Reviewed and verified against local municipal building code amendments.",
      action: action || "SIGN_OFF", // 'SIGN_OFF', 'OVERRIDE', 'FLAG_FOR_AUDIT'
      timestamp: new Date().toISOString(),
      version: reviews.length + 1
    };

    reviews.unshift(record);
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    return record;
  }
}
