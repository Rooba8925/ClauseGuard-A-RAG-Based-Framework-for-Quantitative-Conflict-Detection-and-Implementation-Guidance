/**
 * ClauseGuard - PDF Parsing and Clause Extraction Service
 * Ingests engineering standards PDF documents, extracts text by page,
 * identifies clause sentences, and applies the spaCy NER model to extract
 * { PARAMETER, VALUE, UNIT, CONDITION } with exact page and clause citations.
 */

import { PDFParse } from "pdf-parse";
import { SpacyNerService } from "./spacyNerService.js";

export class PdfService {
  /**
   * Parses a PDF buffer and extracts text structured by page and clauses
   */
  static async extractFromPdfBuffer(buffer, filename = "document.pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      const pages = parsed.pages || [];
      const extractedClauses = [];
      const allEntities = [];

      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i].num || (i + 1);
        const pageText = (pages[i].text || "").trim();
        if (!pageText) continue;

        // Split page text into sentences/paragraphs
        const rawLines = pageText.split(/(?<=[.?!])\s+(?=[A-Z0-9])/);

        for (const line of rawLines) {
          const cleanLine = line.replace(/\s+/g, " ").trim();
          if (cleanLine.length < 15) continue;

          // Check if line contains numerical values, units, or standard keywords
          const hasNumericOrSpec = /\d+|inch|mm|clearance|height|depth|width|variation|tolerance|shall|must/i.test(cleanLine);
          if (!hasNumericOrSpec) continue;

          // Run spaCy Custom NER Parameter Extraction
          const entities = SpacyNerService.extractEntities(cleanLine);

          // If entities found or if it looks like an engineering clause/standard requirement
          if (entities.length > 0) {
            for (const ent of entities) {
              const enrichedEntity = {
                ...ent,
                sourceDocument: filename,
                pageNumber: `Page ${pageNum}`,
                clauseSnippet: cleanLine,
                citation: `${filename} (Page ${pageNum})`
              };
              allEntities.push(enrichedEntity);
            }

            extractedClauses.push({
              id: `pdf-clause-${pageNum}-${extractedClauses.length + 1}`,
              sourceDocument: filename,
              pageNumber: `Page ${pageNum}`,
              citation: `${filename} (Page ${pageNum})`,
              text: cleanLine,
              entities
            });
          } else if (cleanLine.toLowerCase().includes("clearance") || cleanLine.toLowerCase().includes("appropriate") || cleanLine.toLowerCase().includes("risk")) {
            // Vague/qualitative clause without clear numeric bounds -> Tag for Ambiguous/Review
            allEntities.push({
              parameter: cleanLine.includes("clearance") ? "Clearance Requirement" : "Installation Requirement",
              rawParameter: "clearance/risk",
              value: null,
              unit: "N/A",
              condition: "qualitative/vague",
              isVague: true,
              sourceDocument: filename,
              pageNumber: `Page ${pageNum}`,
              clauseSnippet: cleanLine,
              citation: `${filename} (Page ${pageNum})`,
              confidence: 0.75
            });
          }
        }
      }

      return {
        filename,
        totalPages: parsed.total || pages.length,
        fullTextSnippet: parsed.text ? parsed.text.slice(0, 500) + "..." : "",
        fullText: parsed.text || "",
        extractedClauses,
        entities: allEntities
      };
    } finally {
      await parser.destroy().catch(() => {});
    }
  }
}
