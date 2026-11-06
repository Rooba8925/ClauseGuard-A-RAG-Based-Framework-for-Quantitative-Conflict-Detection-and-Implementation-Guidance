/**
 * ClauseGuard - Deterministic Rule-Based Comparison Engine
 *
 * Implements strict 4-Tier Engineering Decision Taxonomy:
 *
 * 1. CONSISTENT:
 *    - When: Both have applicable requirements and they can coexist.
 *    - Action: Derive common constraint.
 *    - Example: Standard A: X ≤ 10 mm, Standard B: X ≤ 8 mm -> CONSISTENT (Combined constraint: X ≤ 8 mm)
 *
 * 2. CONFLICT:
 *    - When: Both have applicable requirements but cannot coexist.
 *    - Action: Flag conflict for engineer review.
 *    - Example: Standard A: X ≤ 10 mm, Standard B: X ≥ 15 mm -> CONFLICT (No common permissible value exists -> Engineer review required)
 *
 * 3. GAP:
 *    - When: Requirement exists in one standard but corresponding applicable requirement is not found in the other.
 *    - Action: Identify missing requirement for verification.
 *    - Example: Standard A: X ≤ 10 mm (Condition: Indoor), Standard B: No requirement found for X under Indoor condition -> GAP
 *      Output: "Gap: No corresponding Indoor requirement for X was identified in Standard B. Verify whether such a requirement exists."
 *
 * 4. FLAG FOR REVIEW:
 *    - When: Information/conditions are ambiguous, so the engine cannot reliably classify it.
 *    - Action: Human verification.
 *    - Used ONLY when the system cannot confidently determine which of Consistent, Conflict, or Gap applies.
 *    - Example 1 (Qualitative / Vague): "X should be maintained at an appropriate clearance" vs "X ≤ 8 mm" -> Clause lacks clear numeric constraint.
 *    - Example 2 (Condition Ambiguity): Standard A: X ≤ 10 mm (High-risk installations) vs Standard B: X ≤ 8 mm (condition unclear).
 */

export const DECISION_TAXONOMY = {
  CONSISTENT: {
    outcome: "CONSISTENT",
    title: "Consistent",
    when: "Both have applicable requirements and they can coexist",
    action: "Derive common constraint",
    badgeColor: "#10b981"
  },
  CONFLICT: {
    outcome: "CONFLICT",
    title: "Conflict",
    when: "Both have applicable requirements but cannot coexist",
    action: "Flag conflict for engineer review",
    badgeColor: "#ef4444"
  },
  GAP: {
    outcome: "GAP",
    title: "Gap",
    when: "Requirement exists in one standard but corresponding applicable requirement is not found in the other",
    action: "Identify missing requirement for verification",
    badgeColor: "#f59e0b"
  },
  FLAG_FOR_REVIEW: {
    outcome: "FLAG FOR REVIEW",
    title: "Flag for Review",
    when: "Information/conditions are ambiguous, so the engine cannot reliably classify it",
    action: "Human verification",
    badgeColor: "#a855f7"
  }
};

export class ComparisonEngine {
  /**
   * Normalizes parameter strings for matching
   */
  static normalizeParam(name) {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/max|min|stair|fixed/g, "");
  }

  /**
   * Checks whether a condition description is ambiguous or unclear
   */
  static isAmbiguousCondition(condition) {
    if (!condition) return false;
    const clean = condition.toLowerCase().trim();
    return (
      clean.includes("unclear") ||
      clean.includes("ambiguous") ||
      clean.includes("[condition unclear]") ||
      clean.includes("unspecified condition") ||
      clean.includes("unknown condition") ||
      clean === "[condition unclear]"
    );
  }

  /**
   * Evaluates two standard parameters using strict 4-tier decision taxonomy
   */
  static comparePair({
    paramA,
    standardAName = "Standard A",
    sourceA = "Standard A Document",
    citationA = null,
    snippetA = null,
    paramB,
    standardBName = "Standard B",
    sourceB = "Standard B Document",
    citationB = null,
    snippetB = null,
    parameterName = "Design Parameter"
  }) {
    const rulesTriggered = [];
    let outcome = DECISION_TAXONOMY.CONSISTENT.outcome;
    let classification = DECISION_TAXONOMY.CONSISTENT.title;
    let when = DECISION_TAXONOMY.CONSISTENT.when;
    let action = DECISION_TAXONOMY.CONSISTENT.action;
    let explanation = "";
    let flagForReview = false;
    let severity = "None"; // 'Critical', 'High', 'Medium', 'Low', 'None'
    let combinedConstraint = null;

    // Citations & Document Sources
    const docCitationA = citationA || paramA?.citation || sourceA || `${standardAName} Specification`;
    const docCitationB = citationB || paramB?.citation || sourceB || `${standardBName} Specification`;
    const clauseSnippetA = snippetA || paramA?.clauseSnippet || paramA?.raw || "Requirement excerpt from document";
    const clauseSnippetB = snippetB || paramB?.clauseSnippet || paramB?.raw || "Requirement excerpt from document";

    const opCondA = paramA?.operatingCondition || (paramA?.condition && !/^(maximum|minimum|variation|bound|range|specified|qualitative|absent)$/i.test(paramA.condition) ? paramA.condition : null);
    const opCondB = paramB?.operatingCondition || (paramB?.condition && !/^(maximum|minimum|variation|bound|range|specified|qualitative|absent)$/i.test(paramB.condition) ? paramB.condition : null);

    // =========================================================================
    // CASE 4: FLAG FOR REVIEW
    // Use Flag for Review ONLY when the system cannot confidently determine
    // which of the other three cases (Consistent, Conflict, Gap) applies.
    // =========================================================================

    // Case 4A: Qualitative / Vague Requirement (No clear numeric constraint provided)
    const isVagueA = Boolean(paramA?.isVague || (paramA && paramA.value === null && /qualitative|vague|appropriate/i.test(paramA.condition || "")));
    const isVagueB = Boolean(paramB?.isVague || (paramB && paramB.value === null && /qualitative|vague|appropriate/i.test(paramB.condition || "")));

    if (isVagueA || isVagueB) {
      outcome = DECISION_TAXONOMY.FLAG_FOR_REVIEW.outcome;
      classification = DECISION_TAXONOMY.FLAG_FOR_REVIEW.title;
      when = DECISION_TAXONOMY.FLAG_FOR_REVIEW.when;
      action = DECISION_TAXONOMY.FLAG_FOR_REVIEW.action;
      flagForReview = true;
      severity = "Medium";
      rulesTriggered.push("RULE_QUALITATIVE_VAGUE_REQUIREMENT");

      const vagueStandard = isVagueA ? standardAName : standardBName;
      const vagueSnippet = isVagueA ? clauseSnippetA : clauseSnippetB;

      explanation = `The requirement in ${vagueStandard} ("${vagueSnippet.slice(0, 90)}...") does not provide a clear numeric constraint (e.g. qualitative phrase like 'appropriate clearance'). The system cannot confidently classify it as Consistent, Conflict, or Gap. Human verification required.`;
      combinedConstraint = "Undefined (Qualitative wording requires human specification)";

      return {
        parameter: parameterName,
        outcome,
        classification,
        when,
        action,
        rawCategory: "Flagged for Review",
        flagForReview,
        severity,
        rulesTriggered,
        ruleSummary: "Information Ambiguity: Qualitative / Vague Clause",
        combinedConstraint,
        commonPermissibleSolution: combinedConstraint,
        citations: {
          [standardAName]: { citation: docCitationA, snippet: clauseSnippetA },
          [standardBName]: { citation: docCitationB, snippet: clauseSnippetB }
        },
        comparisonDetails: {
          [standardAName]: {
            value: paramA?.valueDisplay || paramA?.value || "Qualitative (Vague)",
            unit: paramA?.unit || "N/A",
            condition: opCondA || paramA?.condition || "Unspecified",
            citation: docCitationA
          },
          [standardBName]: {
            value: paramB?.valueDisplay || paramB?.value || "Qualitative (Vague)",
            unit: paramB?.unit || "N/A",
            condition: opCondB || paramB?.condition || "Unspecified",
            citation: docCitationB
          }
        },
        engineConclusion: explanation
      };
    }

    // Case 4B: Condition Ambiguity / Unclear Situation
    // Example: Standard A: X ≤ 10 mm (High-risk installations) vs Standard B: X ≤ 8 mm (condition unclear)
    // The system cannot establish whether the two requirements apply to the same situation.
    const isAmbiguousCondA = this.isAmbiguousCondition(opCondA);
    const isAmbiguousCondB = this.isAmbiguousCondition(opCondB);

    if (
      (isAmbiguousCondA || isAmbiguousCondB) ||
      (opCondA && opCondB && opCondA.toLowerCase() !== opCondB.toLowerCase() && !paramA?.isMissingUnderCondition && !paramB?.isMissingUnderCondition)
    ) {
      outcome = DECISION_TAXONOMY.FLAG_FOR_REVIEW.outcome;
      classification = DECISION_TAXONOMY.FLAG_FOR_REVIEW.title;
      when = DECISION_TAXONOMY.FLAG_FOR_REVIEW.when;
      action = DECISION_TAXONOMY.FLAG_FOR_REVIEW.action;
      flagForReview = true;
      severity = "Medium";
      rulesTriggered.push("RULE_AMBIGUOUS_OPERATING_CONDITION");

      explanation = `Operational conditions are ambiguous (${standardAName}: "${opCondA || 'unclear'}" vs ${standardBName}: "${opCondB || 'unclear'}"). The system cannot establish whether the two requirements apply to the same situation, preventing reliable classification into Consistent, Conflict, or Gap. Human verification required.`;
      combinedConstraint = "Undefined (Operating condition applicability unclear)";

      return {
        parameter: parameterName,
        outcome,
        classification,
        when,
        action,
        rawCategory: "Flagged for Review",
        flagForReview,
        severity,
        rulesTriggered,
        ruleSummary: "Condition Ambiguity: Cannot Establish Situational Equivalence",
        combinedConstraint,
        commonPermissibleSolution: combinedConstraint,
        citations: {
          [standardAName]: { citation: docCitationA, snippet: clauseSnippetA },
          [standardBName]: { citation: docCitationB, snippet: clauseSnippetB }
        },
        comparisonDetails: {
          [standardAName]: {
            value: paramA?.valueDisplay || paramA?.value,
            unit: paramA?.unit || "N/A",
            condition: opCondA || paramA?.condition,
            citation: docCitationA
          },
          [standardBName]: {
            value: paramB?.valueDisplay || paramB?.value,
            unit: paramB?.unit || "N/A",
            condition: opCondB || paramB?.condition,
            citation: docCitationB
          }
        },
        engineConclusion: explanation
      };
    }

    // =========================================================================
    // CASE 1: GAP
    // A parameter/requirement is present in one standard, but no corresponding
    // applicable requirement is found in the other standard.
    // =========================================================================

    // Case 1A: Missing or omitted requirement in Standard A
    const isMissingA =
      !paramA ||
      paramA.value === undefined ||
      paramA.value === null ||
      paramA.value === "Not specified" ||
      paramA.isMissingUnderCondition;

    if (isMissingA) {
      outcome = DECISION_TAXONOMY.GAP.outcome;
      classification = DECISION_TAXONOMY.GAP.title;
      when = DECISION_TAXONOMY.GAP.when;
      action = DECISION_TAXONOMY.GAP.action;
      flagForReview = false;
      severity = "Low";
      rulesTriggered.push("RULE_GAP_STANDARD_A_OMISSION");

      const condDesc = opCondB || (paramB?.condition && !/^(maximum|minimum|variation|bound|range|specified|absent)$/i.test(paramB.condition) ? paramB.condition : "");
      const formattedCond = condDesc ? `${condDesc} ` : "";

      explanation = `Gap: No corresponding ${formattedCond}requirement for ${parameterName} was identified in ${standardAName}. Verify whether such a requirement exists.`;
      combinedConstraint = `Verify/Adopt ${standardBName} Requirement: ${paramB?.valueDisplay || paramB?.value} ${paramB?.unit || ""}`;

      return {
        parameter: parameterName,
        outcome,
        classification,
        when,
        action,
        rawCategory: "Gap",
        flagForReview,
        severity,
        rulesTriggered,
        ruleSummary: "GAP: Missing Requirement in Standard A",
        combinedConstraint,
        commonPermissibleSolution: combinedConstraint,
        citations: {
          [standardAName]: { citation: docCitationA, snippet: clauseSnippetA },
          [standardBName]: { citation: docCitationB, snippet: clauseSnippetB }
        },
        comparisonDetails: {
          [standardAName]: { value: "Not specified", unit: "N/A", condition: "Absent / No requirement found", citation: docCitationA },
          [standardBName]: { value: paramB?.valueDisplay || paramB?.value, unit: paramB?.unit, condition: opCondB || paramB?.condition, citation: docCitationB }
        },
        engineConclusion: explanation
      };
    }

    // Case 1B: Missing or omitted requirement in Standard B
    const isMissingB =
      !paramB ||
      paramB.value === undefined ||
      paramB.value === null ||
      paramB.value === "Not specified" ||
      paramB.isMissingUnderCondition;

    if (isMissingB) {
      outcome = DECISION_TAXONOMY.GAP.outcome;
      classification = DECISION_TAXONOMY.GAP.title;
      when = DECISION_TAXONOMY.GAP.when;
      action = DECISION_TAXONOMY.GAP.action;
      flagForReview = false;
      severity = "Low";
      rulesTriggered.push("RULE_GAP_STANDARD_B_OMISSION");

      const condDesc = opCondA || (paramA?.condition && !/^(maximum|minimum|variation|bound|range|specified|absent)$/i.test(paramA.condition) ? paramA.condition : "");
      const formattedCond = condDesc ? `${condDesc} ` : "";

      explanation = `Gap: No corresponding ${formattedCond}requirement for ${parameterName} was identified in ${standardBName}. Verify whether such a requirement exists.`;
      combinedConstraint = `Verify/Adopt ${standardAName} Requirement: ${paramA?.valueDisplay || paramA?.value} ${paramA?.unit || ""}`;

      return {
        parameter: parameterName,
        outcome,
        classification,
        when,
        action,
        rawCategory: "Gap",
        flagForReview,
        severity,
        rulesTriggered,
        ruleSummary: "GAP: Missing Requirement in Standard B",
        combinedConstraint,
        commonPermissibleSolution: combinedConstraint,
        citations: {
          [standardAName]: { citation: docCitationA, snippet: clauseSnippetA },
          [standardBName]: { citation: docCitationB, snippet: clauseSnippetB }
        },
        comparisonDetails: {
          [standardAName]: { value: paramA?.valueDisplay || paramA?.value, unit: paramA?.unit, condition: opCondA || paramA?.condition, citation: docCitationA },
          [standardBName]: { value: "Not specified", unit: "N/A", condition: "Absent / No requirement found", citation: docCitationB }
        },
        engineConclusion: explanation
      };
    }

    // =========================================================================
    // BOTH STANDARDS CONTAIN APPLICABLE NUMERIC REQUIREMENTS
    // Check if constraints can be satisfied together (CONSISTENT) or not (CONFLICT)
    // =========================================================================

    const boundA = (paramA?.boundType || paramA?.condition || "").toLowerCase();
    const boundB = (paramB?.boundType || paramB?.condition || "").toLowerCase();

    const isMaxA = boundA.includes("max") || boundA.includes("not exceed") || boundA.includes("maximum") || boundA.includes("≤") || boundA.includes("<=");
    const isMaxB = boundB.includes("max") || boundB.includes("not exceed") || boundB.includes("maximum") || boundB.includes("≤") || boundB.includes("<=");

    const isMinA = boundA.includes("min") || boundA.includes("not less") || boundA.includes("minimum") || boundA.includes("≥") || boundA.includes(">=");
    const isMinB = boundB.includes("min") || boundB.includes("not less") || boundB.includes("minimum") || boundB.includes("≥") || boundB.includes(">=");

    const isUniformityA = boundA.includes("variation") || boundA.includes("uniformity") || boundA.includes("tolerance");
    const isUniformityB = boundB.includes("variation") || boundB.includes("uniformity") || boundB.includes("tolerance");

    const valA = typeof paramA.value === "number" ? paramA.value : parseFloat(paramA.value);
    const valB = typeof paramB.value === "number" ? paramB.value : parseFloat(paramB.value);
    const unit = paramA.unit || paramB.unit || "";

    // =========================================================================
    // CASE 3: CONFLICT
    // Both standards contain applicable requirements, but the requirements
    // cannot be satisfied simultaneously (cannot coexist).
    // Example: A: X ≤ 10 mm, B: X ≥ 15 mm -> CONFLICT (No common permissible value exists)
    // =========================================================================
    if ((isMaxA && isMinB && valA < valB) || (isMinA && isMaxB && valA > valB)) {
      const maxVal = isMaxA ? valA : valB;
      const minVal = isMinA ? valA : valB;
      const maxStandard = isMaxA ? standardAName : standardBName;
      const minStandard = isMinA ? standardAName : standardBName;

      outcome = DECISION_TAXONOMY.CONFLICT.outcome;
      classification = DECISION_TAXONOMY.CONFLICT.title;
      when = DECISION_TAXONOMY.CONFLICT.when;
      action = DECISION_TAXONOMY.CONFLICT.action;
      flagForReview = true; // Flagged for engineer review
      severity = "Critical";
      rulesTriggered.push("RULE_INFEASIBLE_BOUNDS_CONFLICT");

      explanation = `Conflict: Both standards contain applicable requirements (${minStandard}: X ≥ ${minVal} ${unit}, ${maxStandard}: X ≤ ${maxVal} ${unit}), but the requirements cannot be satisfied simultaneously. No common permissible value exists. Engineer review required.`;
      combinedConstraint = "None (No common permissible value exists)";
    }

    // =========================================================================
    // CASE 2: CONSISTENT
    // Both standards contain applicable requirements, and their constraints
    // can be satisfied together. Action: Derive common constraint.
    // =========================================================================

    // 2A: Both Upper Bounds (X ≤ 10 mm and X ≤ 8 mm -> X ≤ 8 mm)
    else if (isMaxA && isMaxB) {
      outcome = DECISION_TAXONOMY.CONSISTENT.outcome;
      classification = DECISION_TAXONOMY.CONSISTENT.title;
      when = DECISION_TAXONOMY.CONSISTENT.when;
      action = DECISION_TAXONOMY.CONSISTENT.action;
      flagForReview = false;
      severity = "None";
      rulesTriggered.push("RULE_MAX_CONSTRAINT_HARMONIZATION");

      const stricterMax = Math.min(valA, valB);
      combinedConstraint = `X ≤ ${stricterMax} ${unit}`;
      explanation = `Consistent: Both standards contain applicable requirements (${standardAName}: X ≤ ${valA} ${unit}, ${standardBName}: X ≤ ${valB} ${unit}), and their constraints can be satisfied together. Combined constraint: ${combinedConstraint}.`;
    }

    // 2B: Both Lower Bounds (X ≥ 9.5 in and X ≥ 11 in -> X ≥ 11 in)
    else if (isMinA && isMinB) {
      outcome = DECISION_TAXONOMY.CONSISTENT.outcome;
      classification = DECISION_TAXONOMY.CONSISTENT.title;
      when = DECISION_TAXONOMY.CONSISTENT.when;
      action = DECISION_TAXONOMY.CONSISTENT.action;
      flagForReview = false;
      severity = "None";
      rulesTriggered.push("RULE_MIN_CONSTRAINT_HARMONIZATION");

      const stricterMin = Math.max(valA, valB);
      combinedConstraint = `X ≥ ${stricterMin} ${unit}`;
      explanation = `Consistent: Both standards contain applicable requirements (${standardAName}: X ≥ ${valA} ${unit}, ${standardBName}: X ≥ ${valB} ${unit}), and their constraints can be satisfied together. Combined constraint: ${combinedConstraint}.`;
    }

    // 2C: Variation / Uniformity Tolerance (e.g. Var ≤ 0.1875 in vs Var ≤ 0.375 in)
    else if (isUniformityA || isUniformityB) {
      outcome = DECISION_TAXONOMY.CONSISTENT.outcome;
      classification = DECISION_TAXONOMY.CONSISTENT.title;
      when = DECISION_TAXONOMY.CONSISTENT.when;
      action = DECISION_TAXONOMY.CONSISTENT.action;
      flagForReview = false;
      severity = "None";
      rulesTriggered.push("RULE_TOLERANCE_HARMONIZATION");

      const stricterTol = Math.min(valA, valB);
      combinedConstraint = `Variation ≤ ${stricterTol} ${unit}`;
      explanation = `Consistent: Both standards contain applicable tolerance constraints and can be satisfied together. Combined constraint: ${combinedConstraint}.`;
    }

    // 2D: Overlapping Allowable Operational Envelope (e.g. Min 4 in and Max 7 in)
    else if ((isMinA && isMaxB && valA <= valB) || (isMaxA && isMinB && valB <= valA)) {
      outcome = DECISION_TAXONOMY.CONSISTENT.outcome;
      classification = DECISION_TAXONOMY.CONSISTENT.title;
      when = DECISION_TAXONOMY.CONSISTENT.when;
      action = DECISION_TAXONOMY.CONSISTENT.action;
      flagForReview = false;
      severity = "None";
      rulesTriggered.push("RULE_PERMISSIBLE_ENVELOPE");

      const minVal = isMinA ? valA : valB;
      const maxVal = isMaxA ? valA : valB;
      combinedConstraint = `${minVal} ${unit} ≤ X ≤ ${maxVal} ${unit}`;
      explanation = `Consistent: Both standards contain applicable requirements establishing an allowable operational envelope. Combined constraint: ${combinedConstraint}.`;
    }

    // 2E / 3B: Exact Values or General Thresholds
    else {
      if (Math.abs(valA - valB) > 0.001) {
        outcome = DECISION_TAXONOMY.CONFLICT.outcome;
        classification = DECISION_TAXONOMY.CONFLICT.title;
        when = DECISION_TAXONOMY.CONFLICT.when;
        action = DECISION_TAXONOMY.CONFLICT.action;
        flagForReview = true;
        severity = "High";
        rulesTriggered.push("RULE_NUMERICAL_VALUE_CONFLICT");

        explanation = `Conflict: Both standards contain applicable requirements (${standardAName}: ${valA} ${unit}, ${standardBName}: ${valB} ${unit}), but cannot coexist without an overlapping permissible envelope. No common permissible value exists. Engineer review required.`;
        combinedConstraint = "None (No common permissible value exists)";
      } else {
        outcome = DECISION_TAXONOMY.CONSISTENT.outcome;
        classification = DECISION_TAXONOMY.CONSISTENT.title;
        when = DECISION_TAXONOMY.CONSISTENT.when;
        action = DECISION_TAXONOMY.CONSISTENT.action;
        flagForReview = false;
        severity = "None";
        rulesTriggered.push("RULE_IDENTICAL_ALIGNMENT");

        combinedConstraint = `X = ${valA} ${unit}`;
        explanation = `Consistent: Requirements align quantitatively across both standards. Combined constraint: ${combinedConstraint}.`;
      }
    }

    return {
      parameter: parameterName,
      outcome,
      classification,
      when,
      action,
      rawCategory: classification,
      flagForReview,
      severity,
      rulesTriggered,
      ruleSummary: rulesTriggered.join(" & "),
      combinedConstraint,
      commonPermissibleSolution: combinedConstraint,
      citations: {
        [standardAName]: { citation: docCitationA, snippet: clauseSnippetA },
        [standardBName]: { citation: docCitationB, snippet: clauseSnippetB }
      },
      comparisonDetails: {
        [standardAName]: {
          value: paramA.valueDisplay || paramA.value,
          unit: paramA.unit,
          condition: opCondA || paramA.condition,
          citation: docCitationA,
          snippet: clauseSnippetA
        },
        [standardBName]: {
          value: paramB.valueDisplay || paramB.value,
          unit: paramB.unit,
          condition: opCondB || paramB.condition,
          citation: docCitationB,
          snippet: clauseSnippetB
        }
      },
      engineConclusion: explanation
    };
  }
}
