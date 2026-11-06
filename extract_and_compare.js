/**
 * ClauseGuard proof-of-concept script
 * Part A: Extract structured {parameter, value, unit, condition} from clause text using an LLM
 * Part B: Deterministic rule-based comparison across standards -> conflict / gap / consistent
 * Part C: Compare against your manually labeled ground truth and print precision/recall
 *
 * SETUP (run this on your own machine, not in a sandboxed environment):
 *   set GEMINI_API_KEY=your-key-here   (Windows cmd)
 *   node extract_and_compare.js
 *
 * Note: no need to install node-fetch — Node.js 18+ has fetch built in.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Step 1: your clause dataset (standard, clause number, raw text) ---
const clauses = [
  { id: "osha_riser_max", standard: "OSHA", clauseNo: "1910.25(c)(2)",
    text: "OSHA 1910.25(c)(2): For standard fixed stairs, riser height shall not exceed 9.5 inches." },
  { id: "ibc_riser", standard: "IBC", clauseNo: "1011.5.2",
    text: "IBC 1011.5.2: Stair riser height shall be a maximum of 7 inches and a minimum of 4 inches." },
  { id: "osha_tread_min", standard: "OSHA", clauseNo: "1910.25(c)(3)",
    text: "OSHA 1910.25(c)(3): For standard fixed stairs, tread depth shall be a minimum of 9.5 inches." },
  { id: "ibc_tread", standard: "IBC", clauseNo: "1011.5.2",
    text: "IBC 1011.5.2: Stair tread depth shall be a minimum of 11 inches." },
  { id: "osha_riser_uniformity", standard: "OSHA", clauseNo: "1910.25(c)(2)",
    text: "OSHA 1910.25(c)(2): Riser height shall be uniform, with no more than 3/16 inch variation within a flight of stairs." },
  { id: "ibc_handrail", standard: "IBC", clauseNo: "1012.2",
    text: "IBC 1012.2: Handrail height shall be not less than 34 inches and not more than 38 inches, measured above the tread nosing." },
];

// --- Step 2: your manually labeled ground truth (what YOU determined by hand) ---
// This is what you already built in the spreadsheet. Used only to score the pipeline.
const groundTruth = [
  { pair: ["osha_riser_max", "ibc_riser"], parameter: "riser height (max)", label: "conflict" },
  { pair: ["osha_riser_max", "ibc_riser"], parameter: "riser height (min)", label: "gap" }, // OSHA has no min
  { pair: ["osha_tread_min", "ibc_tread"], parameter: "tread depth (min)", label: "conflict" },
];

// --- Extraction prompt: forces structured JSON output ---
function buildExtractionPrompt(clauseText) {
  return `Extract every numeric requirement from this engineering/safety standard clause.
Return ONLY a JSON array, no other text, in this exact format:
[{"parameter": "short name", "value": number, "unit": "string", "condition": "min or max or exact, plus any qualifying condition"}]

Clause: "${clauseText}"`;
}

async function extractParameters(clauseText, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildExtractionPrompt(clauseText) }] }],
      }),
    });

    if (res.status === 503 && attempt < retries) {
      console.log(`  (model busy, retrying in 3s... attempt ${attempt}/${retries})`);
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`\nAPI request failed (status ${res.status}):`);
      console.error(errBody);
      return [];
    }

    const data = await res.json();

    if (!data.candidates) {
      console.error("\nNo candidates in response. Full response:");
      console.error(JSON.stringify(data, null, 2));
      return [];
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("\nFailed to parse extraction output. Raw text was:");
      console.error(raw);
      return [];
    }
  }
  return [];
}

// --- Step 3: deterministic rule-based comparison (NOT LLM judgment) ---
function compareParameters(paramsA, standardA, paramsB, standardB) {
  const results = [];
  for (const a of paramsA) {
    const na = normalize(a.parameter);
    const matches = paramsB.filter(b => {
      const nb = normalize(b.parameter);
      return na.includes(nb) || nb.includes(na); // fuzzy match, not exact
    });
    if (matches.length === 0) continue; // no overlapping parameter found

    for (const match of matches) {
      const condA = (a.condition || "").toLowerCase();
      const condB = (match.condition || "").toLowerCase();
      const bothMax = condA.includes("max") && condB.includes("max");
      const bothMin = condA.includes("min") && condB.includes("min");
      const sameCondition = bothMax || bothMin;

      let classification;
      if (sameCondition && a.value !== match.value) {
        classification = "conflict";
      } else if (sameCondition && a.value === match.value) {
        classification = "consistent";
      } else {
        classification = "gap"; // different condition scope -> likely one-sided requirement
      }
      results.push({
        parameter: `${a.parameter} <-> ${match.parameter}`,
        [standardA]: { value: a.value, unit: a.unit, condition: a.condition },
        [standardB]: { value: match.value, unit: match.unit, condition: match.condition },
        classification,
      });
    }
  }
  return results;
}

function normalize(str) {
  return (str || "").toLowerCase().replace(/[^a-z]/g, "");
}

// --- Step 4: run extraction across all clauses, then compare OSHA vs IBC pairs ---
async function main() {
  if (!GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set. Run this first in the same terminal:");
    console.error('  set GEMINI_API_KEY=your-key-here');
    process.exit(1);
  }
  console.log(`Using API key starting with: ${GEMINI_API_KEY.slice(0, 6)}...\n`);
  console.log("Extracting parameters from all clauses...\n");
  const extracted = {};
  for (const c of clauses) {
    extracted[c.id] = await extractParameters(c.text);
    console.log(`${c.id}:`, JSON.stringify(extracted[c.id]));
    await new Promise(r => setTimeout(r, 1500)); // small pause between requests
  }

  console.log("\nRunning rule-based comparison...\n");
  const comparisons = [
    ...compareParameters(extracted["osha_riser_max"], "OSHA", extracted["ibc_riser"], "IBC"),
    ...compareParameters(extracted["osha_tread_min"], "OSHA", extracted["ibc_tread"], "IBC"),
  ];
  console.log(JSON.stringify(comparisons, null, 2));

  console.log("\nCompare the 'classification' fields above against your ground truth spreadsheet");
  console.log("to compute precision/recall by hand, or extend this script to auto-score it.");
}

main();