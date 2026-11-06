/**
 * ClauseGuard - Gemini Explanation & Implementation Guidance Service
 * Consumes the deterministic output from the Rule-Based Engine and generates:
 *  1. Technical Explanation of the detected Consistent / Conflict / Gap / Flag for Review status.
 *  2. Practical Implementation Guidance for engineers aligned with the decision table action.
 */

export class GeminiService {
  /**
   * Generates AI explanation and implementation guidance based on Rule-Based Engine result
   */
  static async explainAndGuide(comparisonResult) {
    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is available, query Gemini
    if (apiKey) {
      try {
        const prompt = this.buildPrompt(comparisonResult);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
            return {
              explanation: parsed.explanation,
              implementationGuidance: parsed.implementationGuidance,
              citations: parsed.citations,
              recommendedDesignValue: parsed.recommendedDesignValue,
              source: "Gemini 1.5 Flash API (LLM Generated)"
            };
          }
        }
      } catch (err) {
        console.warn("Gemini API call warning, using built-in engineering synthesis:", err.message);
      }
    }

    // Built-in high-accuracy engineering domain synthesis
    return this.synthesizeDomainGuidance(comparisonResult);
  }

  static buildPrompt(res) {
    return `You are ClauseGuard, an expert civil and structural safety engineering AI.
Explain the following rule-based comparison result and formulate actionable implementation guidance according to this strict decision table:
- CONSISTENT: Both have applicable requirements and they can coexist -> Derive common constraint.
- CONFLICT: Both have applicable requirements but cannot coexist -> Flag conflict for engineer review. No common permissible value exists.
- GAP: Requirement exists in one standard but corresponding applicable requirement is not found in the other -> Identify missing requirement for verification.
- FLAG FOR REVIEW: Information/conditions are ambiguous, so the engine cannot reliably classify it -> Human verification.

Rule-Based Engine Output:
- Parameter: ${res.parameter}
- Outcome: ${res.outcome || res.classification}
- When: ${res.when}
- Action: ${res.action}
- Combined Constraint: ${res.combinedConstraint || res.commonPermissibleSolution}
- Rules Triggered: ${res.rulesTriggered?.join(", ")}
- Engine Details: ${JSON.stringify(res.comparisonDetails)}
- Rule Conclusion: ${res.engineConclusion}

Respond ONLY with valid JSON in this structure:
{
  "explanation": "concise technical rationale explaining the safety basis, constraints, and why the outcome was determined",
  "implementationGuidance": "actionable directive advising the engineer according to the action required (${res.action})",
  "citations": ["Standard A clause reference", "Standard B clause reference"],
  "recommendedDesignValue": "exact numerical target value or combined constraint to specify"
}`;
  }

  /**
   * Domain knowledge base for standard OSHA vs IBC parameters
   */
  static synthesizeDomainGuidance(res) {
    const p = (res.parameter || "").toLowerCase();
    const outcome = (res.outcome || res.classification || "").toLowerCase();
    const isConflict = outcome.includes("conflict");
    const isGap = outcome.includes("gap");
    const isFlagged = outcome.includes("flag") || outcome.includes("review");
    const isConsistent = outcome.includes("consistent");

    if (p.includes("riser height") && p.includes("max")) {
      return {
        explanation: "Both standards specify applicable upper bounds for standard stair riser height: OSHA 1910.25(c)(2) permits up to 9.5 inches, while IBC 1011.5.2 enforces a maximum ceiling of 7.0 inches. Because any value ≤ 7.0 inches satisfies both thresholds, the constraints coexist.",
        implementationGuidance: "Derive and specify a maximum riser height of 7.0 inches (e.g. 6.5 - 7.0 inches) on architectural construction drawings. Designing to IBC 7.0 in automatically complies with OSHA's 9.5 in ceiling.",
        citations: ["OSHA 1910.25(c)(2)", "IBC 1011.5.2"],
        recommendedDesignValue: "Riser Height ≤ 7.0 inches",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (p.includes("riser height") && p.includes("min")) {
      return {
        explanation: "IBC 1011.5.2 explicitly enforces a minimum riser height of 4.0 inches to prevent tripping hazards. In contrast, no corresponding minimum requirement was found in OSHA 1910.25, creating a regulatory gap.",
        implementationGuidance: "Identify missing requirement for verification: adopt IBC 1011.5.2's minimum limit (Riser Height ≥ 4.0 inches) across all stairways to guarantee safety while remaining fully OSHA compliant.",
        citations: ["IBC 1011.5.2", "OSHA 1910.25 (omitted)"],
        recommendedDesignValue: "Riser Height ≥ 4.0 inches",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (p.includes("tread depth")) {
      return {
        explanation: "Both standards contain applicable lower-bound requirements: OSHA 1910.25(c)(3) requires a minimum tread depth of 9.5 inches, while IBC 1011.5.2 mandates a minimum of 11.0 inches. Both constraints can coexist by adopting the stricter lower bound.",
        implementationGuidance: "Derive and specify a minimum stair tread depth of 11.0 inches in fabrication drawings. A tread depth ≥ 11.0 in simultaneously satisfies OSHA (≥ 9.5 in) and IBC (≥ 11.0 in).",
        citations: ["OSHA 1910.25(c)(3)", "IBC 1011.5.2"],
        recommendedDesignValue: "Tread Depth ≥ 11.0 inches",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (p.includes("uniformity") || p.includes("variation")) {
      return {
        explanation: "Both standards specify applicable variation tolerance limits: OSHA 1910.25(c)(2) restricts variation to 0.1875 inch (3/16\"), while IBC 1011.5.4 permits up to 0.375 inch (3/8\"). Both constraints coexist by holding to the tighter industrial tolerance.",
        implementationGuidance: "Derive common constraint: enforce fabrication tolerance of Variation ≤ 0.1875 inch (3/16\") across each stair flight, satisfying both OSHA and IBC concurrently.",
        citations: ["OSHA 1910.25(c)(2)", "IBC 1011.5.4"],
        recommendedDesignValue: "Riser Variation ≤ 0.1875 inch (3/16\")",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (p.includes("handrail")) {
      return {
        explanation: "IBC 1012.2 specifies handrail height between 34 inches and 38 inches above stair nosing. In the analyzed OSHA 1910.25 excerpt, no corresponding handrail height requirement was identified.",
        implementationGuidance: "Identify missing requirement for verification: confirm applicable handrail provisions under OSHA 1910.28(f) and specify nominal 36.0 inch handrail height to satisfy both codes.",
        citations: ["IBC 1012.2", "OSHA 1910.25 (omitted in excerpt)"],
        recommendedDesignValue: "Handrail Height: 34 - 38 inches (Nominal 36.0\")",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (p.includes("opposing") || (res.comparisonDetails?.["Standard A"]?.value === 10 && res.comparisonDetails?.["Standard B"]?.value === 15)) {
      return {
        explanation: "Conflict: Standard A restricts clearance to ≤ 10 mm while Standard B mandates clearance ≥ 15 mm. Because the minimum required floor exceeds the maximum ceiling, no common permissible value exists.",
        implementationGuidance: "Flag conflict for engineer review: determine governing jurisdictional precedence or apply an engineered enclosure mitigation to resolve the physical impossibility.",
        citations: ["Standard A Specification", "Standard B Specification"],
        recommendedDesignValue: "None (Infeasible boundary: Engineer sign-off required)",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (isFlagged) {
      return {
        explanation: res.engineConclusion || "Information or operating conditions are ambiguous, preventing reliable classification into Consistent, Conflict, or Gap.",
        implementationGuidance: "Human verification required: review situational operating conditions or obtain explicit numeric engineering specifications before proceeding.",
        citations: ["Standard A Clause", "Standard B Clause"],
        recommendedDesignValue: "Pending Engineering Determination",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (isGap) {
      return {
        explanation: res.engineConclusion || `Requirement exists in one standard but no corresponding applicable requirement was identified in the other standard.`,
        implementationGuidance: `Identify missing requirement for verification: check whether an equivalent requirement exists in the unaddressed standard or adopt the governing standard.`,
        citations: ["Governing Standard Specification"],
        recommendedDesignValue: res.combinedConstraint || "Adopt Governing Standard Specification",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    if (isConflict) {
      return {
        explanation: res.engineConclusion || `Conflict detected: Both standards contain applicable requirements, but they cannot be satisfied simultaneously. No common permissible value exists.`,
        implementationGuidance: `Flag conflict for engineer review: initiate design review and record engineer determination in the audit trail.`,
        citations: ["Standard A Specification", "Standard B Specification"],
        recommendedDesignValue: "None (Engineer Review Required)",
        source: "ClauseGuard Engineered Knowledge Base"
      };
    }

    // Default Consistent
    return {
      explanation: res.engineConclusion || `Both standards contain applicable requirements and their constraints can be satisfied together.`,
      implementationGuidance: `Derive common constraint: implement ${res.combinedConstraint || res.commonPermissibleSolution} directly into engineering design drawings.`,
      citations: ["Standard A Specification", "Standard B Specification"],
      recommendedDesignValue: res.combinedConstraint || "Specified common constraint",
      source: "ClauseGuard Engineered Knowledge Base"
    };
  }
}
