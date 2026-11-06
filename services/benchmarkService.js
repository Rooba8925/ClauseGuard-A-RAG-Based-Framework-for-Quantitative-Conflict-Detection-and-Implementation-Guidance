/**
 * ClauseGuard - Benchmark & Ground Truth Evaluation Service
 * Evaluates the deterministic comparison engine against the labeled engineering standards dataset
 * conforming strictly to the 4-tier decision taxonomy:
 * 1. CONSISTENT: Both have applicable requirements and they can coexist -> Derive common constraint.
 * 2. CONFLICT: Both have applicable requirements but cannot coexist -> Flag conflict for engineer review.
 * 3. GAP: Requirement exists in one standard but corresponding applicable requirement is not found in the other -> Identify missing requirement for verification.
 * 4. FLAG FOR REVIEW: Information/conditions are ambiguous, so the engine cannot reliably classify it -> Human verification.
 */

import { ComparisonEngine } from "./comparisonEngine.js";
import { GeminiService } from "./geminiService.js";

export const GROUND_TRUTH_DATASET = [
  {
    id: "gt-1",
    parameter: "Max riser height",
    oshaValue: "9.5 inches maximum",
    oshaParsed: {
      value: 9.5,
      unit: "inches",
      condition: "maximum",
      raw: "OSHA 1910.25(c)(2): For standard fixed stairs, riser height shall not exceed 9.5 inches.",
      citation: "OSHA 1910.25(c)(2) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(c)(2) (Page 2)",
    ibcValue: "7 inches maximum",
    ibcParsed: {
      value: 7.0,
      unit: "inches",
      condition: "maximum",
      raw: "IBC 1011.5.2: Stair riser height shall be a maximum of 7 inches.",
      citation: "IBC 1011.5.2 (Page 2)"
    },
    ibcSource: "IBC 1011.5.2 (Page 2)",
    groundTruthClassification: "Consistent (Both applicable & coexist) / Combined constraint: X ≤ 7.0 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-2",
    parameter: "Min riser height",
    oshaValue: "Not specified",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "Not specified",
      raw: "OSHA 1910.25: General industrial stairs requirements (omitted).",
      citation: "OSHA 1910.25 (omitted)"
    },
    oshaSource: "OSHA 1910.25 (omitted)",
    ibcValue: "4 inches minimum",
    ibcParsed: {
      value: 4.0,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1011.5.2: Stair riser height shall be a minimum of 4 inches.",
      citation: "IBC 1011.5.2 (Page 2)"
    },
    ibcSource: "IBC 1011.5.2 (Page 2)",
    groundTruthClassification: "Gap (Present in IBC, missing in OSHA) / Identify missing requirement",
    expectedCategory: "Gap",
    expectedOutcome: "GAP"
  },
  {
    id: "gt-3",
    parameter: "Min tread depth",
    oshaValue: "9.5 inches minimum",
    oshaParsed: {
      value: 9.5,
      unit: "inches",
      condition: "minimum",
      raw: "OSHA 1910.25(c)(3): For standard fixed stairs, tread depth shall be a minimum of 9.5 inches.",
      citation: "OSHA 1910.25(c)(3) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(c)(3) (Page 2)",
    ibcValue: "11 inches minimum",
    ibcParsed: {
      value: 11.0,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1011.5.2: Stair tread depth shall be a minimum of 11 inches.",
      citation: "IBC 1011.5.2 (Page 2)"
    },
    ibcSource: "IBC 1011.5.2 (Page 2)",
    groundTruthClassification: "Consistent (Both applicable & coexist) / Combined constraint: X ≥ 11.0 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-4",
    parameter: "Riser uniformity tolerance",
    oshaValue: "no more than 3/16 inch variation between individual risers",
    oshaParsed: {
      value: 0.1875,
      valueDisplay: "3/16 inch (0.1875 in)",
      unit: "inch",
      condition: "maximum variation",
      raw: "OSHA 1910.25(c)(2): Riser height variation shall not exceed 0.1875 inch within a flight of stairs.",
      citation: "OSHA 1910.25(c)(2) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(c)(2) (Page 2)",
    ibcValue: "difference between largest and smallest riser cannot exceed 3/8 inch",
    ibcParsed: {
      value: 0.375,
      valueDisplay: "3/8 inch (0.375 in)",
      unit: "inch",
      condition: "maximum variation",
      raw: "IBC 1011.5.4: Difference between largest and smallest riser cannot exceed 3/8 inch.",
      citation: "IBC 1011.5.4 (Page 2)"
    },
    ibcSource: "IBC 1011.5.4 (Page 2)",
    groundTruthClassification: "Consistent (Both applicable & coexist) / Combined constraint: Variation ≤ 0.1875 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-5",
    parameter: "Handrail height",
    oshaValue: "Not covered in this excerpt",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "Not covered in this excerpt",
      raw: "OSHA 1910.25: General requirements (Handrail clause in 1910.28).",
      citation: "OSHA (excerpt absent)"
    },
    oshaSource: "OSHA (excerpt absent)",
    ibcValue: "not less than 34 inches and not more than 38 inches",
    ibcParsed: {
      value: [34, 38],
      valueDisplay: "34 - 38 inches",
      unit: "inches",
      condition: "range",
      raw: "IBC 1012.2: Handrail height shall not be less than 34 inches and not more than 38 inches.",
      citation: "IBC 1012.2 (Page 2)"
    },
    ibcSource: "IBC 1012.2 (Page 2)",
    groundTruthClassification: "Gap (Present in IBC, missing in OSHA excerpt) / Identify missing requirement",
    expectedCategory: "Gap",
    expectedOutcome: "GAP"
  },
  {
    id: "gt-6",
    parameter: "Opposing Boundary Clearance (Infeasible)",
    oshaValue: "10 mm maximum",
    oshaParsed: {
      value: 10,
      unit: "mm",
      condition: "maximum",
      raw: "STD-A 4.2.1: Enclosure clearance shall not exceed 10 mm.",
      citation: "Special_Enclosure_Standard_A.pdf (Page 1)"
    },
    oshaSource: "Standard A (Page 1)",
    ibcValue: "15 mm minimum",
    ibcParsed: {
      value: 15,
      unit: "mm",
      condition: "minimum",
      raw: "STD-B 6.1.4: Equipment clearance shall be a minimum of 15 mm.",
      citation: "Special_Enclosure_Standard_B.pdf (Page 1)"
    },
    ibcSource: "Standard B (Page 1)",
    groundTruthClassification: "Conflict (Cannot coexist: X ≤ 10 AND X ≥ 15) / Flag conflict for engineer review",
    expectedCategory: "Conflict",
    expectedOutcome: "CONFLICT"
  },
  {
    id: "gt-7",
    parameter: "Walking Clearance (Qualitative Vague)",
    oshaValue: "appropriate clearance (vague / no numeric value)",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "qualitative/vague",
      isVague: true,
      raw: "OSHA 1910.22(a)(1): Passageways should be maintained at an appropriate clearance.",
      citation: "OSHA_1910_Stairs_Standard.pdf (Page 1)"
    },
    oshaSource: "OSHA 1910.22 (Page 1)",
    ibcValue: "8 mm maximum",
    ibcParsed: {
      value: 8,
      unit: "mm",
      condition: "maximum",
      raw: "STD-B 6.1.5: Clearance shall not exceed 8 mm.",
      citation: "Special_Enclosure_Standard_B.pdf (Page 1)"
    },
    ibcSource: "Standard B (Page 1)",
    groundTruthClassification: "Flag for Review (No clear numeric constraint) / Human verification",
    expectedCategory: "Flag for Review",
    expectedOutcome: "FLAG FOR REVIEW"
  },
  {
    id: "gt-8",
    parameter: "Condition Ambiguity (Unclear Situation)",
    oshaValue: "10 mm max (High-risk installations)",
    oshaParsed: {
      value: 10,
      unit: "mm",
      condition: "High-risk installations",
      raw: "STD-A: X ≤ 10 mm under High-risk installations.",
      citation: "Standard A Clause 4.1"
    },
    oshaSource: "Standard A",
    ibcValue: "8 mm max ([condition unclear])",
    ibcParsed: {
      value: 8,
      unit: "mm",
      condition: "[condition unclear]",
      raw: "STD-B: X ≤ 8 mm under [condition unclear].",
      citation: "Standard B Clause 2.3"
    },
    ibcSource: "Standard B",
    groundTruthClassification: "Flag for Review (Operating conditions ambiguous) / Human verification",
    expectedCategory: "Flag for Review",
    expectedOutcome: "FLAG FOR REVIEW"
  },
  {
    id: "gt-9",
    parameter: "Condition-Specific Gap (Indoor)",
    oshaValue: "10 mm max (Indoor)",
    oshaParsed: {
      value: 10,
      unit: "mm",
      condition: "Indoor",
      raw: "STD-A: X ≤ 10 mm Condition: Indoor",
      citation: "Standard A Clause 5.2"
    },
    oshaSource: "Standard A",
    ibcValue: "No requirement found under Indoor condition",
    ibcParsed: {
      value: null,
      unit: "N/A",
      condition: "Indoor",
      isMissingUnderCondition: true,
      raw: "STD-B: No requirement found for X under Indoor condition",
      citation: "Standard B (Omitted)"
    },
    ibcSource: "Standard B",
    groundTruthClassification: "Gap (No corresponding Indoor requirement in STD-B) / Identify missing requirement",
    expectedCategory: "Gap",
    expectedOutcome: "GAP"
  },
  {
    id: "gt-10",
    parameter: "Stairway Clear Width",
    oshaValue: "28 inches minimum",
    oshaParsed: {
      value: 28,
      unit: "inches",
      condition: "minimum",
      raw: "OSHA 1910.25(c)(1): Standard stairs shall have a minimum width of 28 inches.",
      citation: "OSHA 1910.25(c)(1) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(c)(1) (Page 2)",
    ibcValue: "44 inches minimum",
    ibcParsed: {
      value: 44,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1011.2: Stairways serving an occupant load > 50 shall have a minimum width of 44 inches.",
      citation: "IBC 1011.2 (Page 1)"
    },
    ibcSource: "IBC 1011.2 (Page 1)",
    groundTruthClassification: "Consistent (Both applicable & coexist) / Combined constraint: X ≥ 44 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-11",
    parameter: "Stair Headroom Clearance",
    oshaValue: "80 inches (6 ft 8 in) minimum",
    oshaParsed: {
      value: 80,
      unit: "inches",
      condition: "minimum",
      raw: "OSHA 1910.25(c)(5): Headroom clearance shall be at least 80 inches measured vertically.",
      citation: "OSHA 1910.25(c)(5) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(c)(5) (Page 2)",
    ibcValue: "80 inches (6 ft 8 in) minimum",
    ibcParsed: {
      value: 80,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1011.3: Stairways shall have a headroom clearance of not less than 80 inches.",
      citation: "IBC 1011.3 (Page 1)"
    },
    ibcSource: "IBC 1011.3 (Page 1)",
    groundTruthClassification: "Consistent (Identical alignment across standards) / Combined constraint: X = 80 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-12",
    parameter: "Guardrail Height",
    oshaValue: "42 inches nominal",
    oshaParsed: {
      value: 42,
      unit: "inches",
      condition: "minimum",
      raw: "OSHA 1910.28(b)(1): Guardrail systems top rail height shall be 42 inches plus or minus 3 inches.",
      citation: "OSHA 1910.28(b)(1) (Page 3)"
    },
    oshaSource: "OSHA 1910.28(b)(1) (Page 3)",
    ibcValue: "42 inches minimum",
    ibcParsed: {
      value: 42,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1015.3: Required guards shall be not less than 42 inches in height.",
      citation: "IBC 1015.3 (Page 3)"
    },
    ibcSource: "IBC 1015.3 (Page 3)",
    groundTruthClassification: "Consistent (Both align quantitatively) / Combined constraint: X ≥ 42 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-13",
    parameter: "Stairway Landing Length",
    oshaValue: "30 inches minimum",
    oshaParsed: {
      value: 30,
      unit: "inches",
      condition: "minimum",
      raw: "OSHA 1910.25(b)(4): Landings shall be at least 30 inches in depth measured in the direction of travel.",
      citation: "OSHA 1910.25(b)(4) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(b)(4) (Page 2)",
    ibcValue: "36 inches minimum",
    ibcParsed: {
      value: 36,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1011.6: Landings shall have a dimension measured in the direction of travel of not less than 36 inches.",
      citation: "IBC 1011.6 (Page 2)"
    },
    ibcSource: "IBC 1011.6 (Page 2)",
    groundTruthClassification: "Consistent (Both applicable & coexist) / Combined constraint: X ≥ 36 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-14",
    parameter: "Guardrail Concentrated Load Resistance",
    oshaValue: "200 lbf minimum force",
    oshaParsed: {
      value: 200,
      unit: "lbf",
      condition: "minimum",
      raw: "OSHA 1910.29(b)(3): Guardrails must withstand a minimum force of 200 pounds applied within 2 inches of top edge.",
      citation: "OSHA 1910.29(b)(3) (Page 3)"
    },
    oshaSource: "OSHA 1910.29(b)(3) (Page 3)",
    ibcValue: "200 lbf minimum force",
    ibcParsed: {
      value: 200,
      unit: "lbf",
      condition: "minimum",
      raw: "IBC 1607.8.1: Guardrails shall be designed to resist a concentrated load of 200 lbf.",
      citation: "IBC 1607.8.1 (Page 4)"
    },
    ibcSource: "IBC 1607.8.1 (Page 4)",
    groundTruthClassification: "Consistent (Both standards enforce 200 lbf design load) / Combined constraint: X ≥ 200 lbf",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-15",
    parameter: "Stair Slope Angle",
    oshaValue: "50 degrees maximum",
    oshaParsed: {
      value: 50,
      unit: "degrees",
      condition: "maximum",
      raw: "OSHA 1910.25(c)(1): Standard stairs shall be installed at angles between 30 and 50 degrees from horizontal.",
      citation: "OSHA 1910.25(c)(1) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(c)(1) (Page 2)",
    ibcValue: "32.5 degrees maximum equivalent",
    ibcParsed: {
      value: 32.5,
      unit: "degrees",
      condition: "maximum",
      raw: "IBC 1011.5.2: Maximum 7-inch riser and 11-inch tread corresponds to a maximum stair angle of 32.5 degrees.",
      citation: "IBC 1011.5.2 (Page 2)"
    },
    ibcSource: "IBC 1011.5.2 (Page 2)",
    groundTruthClassification: "Consistent (Harmonized upper bound angle) / Combined constraint: X ≤ 32.5 degrees",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-16",
    parameter: "Intermediate Guard Railing Clear Opening",
    oshaValue: "19 inches maximum opening",
    oshaParsed: {
      value: 19,
      unit: "inches",
      condition: "maximum",
      raw: "OSHA 1910.29(b)(2)(iii): Intermediate vertical members shall not have openings greater than 19 inches.",
      citation: "OSHA 1910.29(b)(2) (Page 3)"
    },
    oshaSource: "OSHA 1910.29(b)(2) (Page 3)",
    ibcValue: "4 inches maximum opening",
    ibcParsed: {
      value: 4,
      unit: "inches",
      condition: "maximum",
      raw: "IBC 1015.4: Required guards shall not have openings that allow passage of a 4-inch sphere.",
      citation: "IBC 1015.4 (Page 3)"
    },
    ibcSource: "IBC 1015.4 (Page 3)",
    groundTruthClassification: "Consistent (Stricter upper bound applies) / Combined constraint: X ≤ 4 inches",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-17",
    parameter: "Spiral Stairway Tread Width at 12 inches from walkline",
    oshaValue: "7.5 inches minimum",
    oshaParsed: {
      value: 7.5,
      unit: "inches",
      condition: "minimum",
      raw: "OSHA 1910.25(d)(2): Spiral stairs shall have a minimum tread width of 7.5 inches at 12 inches from narrow end.",
      citation: "OSHA 1910.25(d)(2) (Page 2)"
    },
    oshaSource: "OSHA 1910.25(d)(2) (Page 2)",
    ibcValue: "7.5 inches minimum",
    ibcParsed: {
      value: 7.5,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1011.10: Spiral stairways shall have not less than a 7.5-inch tread depth at 12 inches from narrow edge.",
      citation: "IBC 1011.10 (Page 2)"
    },
    ibcSource: "IBC 1011.10 (Page 2)",
    groundTruthClassification: "Consistent (Direct statutory alignment) / Combined constraint: X ≥ 7.5 inches",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-18",
    parameter: "Alternating Tread Device Maximum Riser",
    oshaValue: "8.5 inches maximum",
    oshaParsed: {
      value: 8.5,
      unit: "inches",
      condition: "maximum",
      raw: "OSHA 1910.25(f)(3): Alternating tread-type stairs shall have a maximum riser height of 8.5 inches.",
      citation: "OSHA 1910.25(f)(3) (Page 3)"
    },
    oshaSource: "OSHA 1910.25(f)(3) (Page 3)",
    ibcValue: "9.5 inches maximum",
    ibcParsed: {
      value: 9.5,
      unit: "inches",
      condition: "maximum",
      raw: "IBC 1011.14: Alternating tread devices shall have a maximum riser height of 9.5 inches.",
      citation: "IBC 1011.14 (Page 3)"
    },
    ibcSource: "IBC 1011.14 (Page 3)",
    groundTruthClassification: "Consistent (Both establish upper bounds, stricter 8.5 in governs) / Combined constraint: X ≤ 8.5 in",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-19",
    parameter: "Pedestrian Ramp Maximum Incline Slope",
    oshaValue: "1:8 maximum ramp slope",
    oshaParsed: {
      value: 0.125,
      valueDisplay: "1:8 (12.5%)",
      unit: "ratio",
      condition: "maximum",
      raw: "OSHA 1910.22(b)(2): Industrial vehicle and pedestrian ramps shall not exceed a slope of 1:8.",
      citation: "OSHA 1910.22(b)(2) (Page 1)"
    },
    oshaSource: "OSHA 1910.22(b)(2) (Page 1)",
    ibcValue: "1:12 maximum ramp slope",
    ibcParsed: {
      value: 0.0833,
      valueDisplay: "1:12 (8.33%)",
      unit: "ratio",
      condition: "maximum",
      raw: "IBC 1012.2: Ramps used as part of a means of egress shall have a running slope not steeper than 1:12.",
      citation: "IBC 1012.2 (Page 2)"
    },
    ibcSource: "IBC 1012.2 (Page 2)",
    groundTruthClassification: "Consistent (Stricter allowable ramp incline applies) / Combined constraint: Slope ≤ 1:12 (0.0833)",
    expectedCategory: "Consistent",
    expectedOutcome: "CONSISTENT"
  },
  {
    id: "gt-20",
    parameter: "Structural Uniform Floor Live Load Capacity",
    oshaValue: "Not specified in stairs subsection",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "Not specified",
      raw: "OSHA 1910.25: Structural floor loads governed under general duty / building authority.",
      citation: "OSHA 1910.25 (omitted)"
    },
    oshaSource: "OSHA 1910.25 (omitted)",
    ibcValue: "100 psf minimum uniform live load",
    ibcParsed: {
      value: 100,
      unit: "psf",
      condition: "minimum",
      raw: "IBC 1607.1: Means of egress stairs and landings shall be designed for a uniform live load of 100 psf.",
      citation: "IBC Table 1607.1 (Page 4)"
    },
    ibcSource: "IBC Table 1607.1 (Page 4)",
    groundTruthClassification: "Gap (Present in IBC structural schedule, missing in OSHA excerpt) / Identify missing requirement",
    expectedCategory: "Gap",
    expectedOutcome: "GAP"
  },
  {
    id: "gt-21",
    parameter: "Exterior Stairway Frost Depth Foundation",
    oshaValue: "Not specified",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "Not specified",
      raw: "OSHA 1910.25: Exterior foundations not explicitly regulated in general industry standard.",
      citation: "OSHA 1910.25 (omitted)"
    },
    oshaSource: "OSHA 1910.25 (omitted)",
    ibcValue: "36 inches minimum frost footing depth",
    ibcParsed: {
      value: 36,
      unit: "inches",
      condition: "minimum",
      raw: "IBC 1809.5: Exterior stair footings shall extend below the frost line, not less than 36 inches.",
      citation: "IBC 1809.5 (Page 4)"
    },
    ibcSource: "IBC 1809.5 (Page 4)",
    groundTruthClassification: "Gap (Present in IBC geotechnical requirements, absent in OSHA) / Identify missing requirement",
    expectedCategory: "Gap",
    expectedOutcome: "GAP"
  },
  {
    id: "gt-22",
    parameter: "Emergency Egress Door Swing Stair Encroachment",
    oshaValue: "door swing shall not obstruct passage (vague/qualitative)",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "qualitative/vague",
      isVague: true,
      raw: "OSHA 1910.36(d)(2): Exit doors must not create an obstruction to stairway egress passage.",
      citation: "OSHA 1910.36(d)(2) (Page 1)"
    },
    oshaSource: "OSHA 1910.36(d)(2) (Page 1)",
    ibcValue: "7 inches maximum encroachment into path",
    ibcParsed: {
      value: 7,
      unit: "inches",
      condition: "maximum",
      raw: "IBC 1011.6: During its swing, any door shall not reduce landing width by more than 7 inches.",
      citation: "IBC 1011.6 (Page 2)"
    },
    ibcSource: "IBC 1011.6 (Page 2)",
    groundTruthClassification: "Flag for Review (Qualitative OSHA clause vs numeric IBC bound) / Human verification",
    expectedCategory: "Flag for Review",
    expectedOutcome: "FLAG FOR REVIEW"
  },
  {
    id: "gt-23",
    parameter: "Emergency Stairway Illumination Minimum Level",
    oshaValue: "adequate lighting (qualitative)",
    oshaParsed: {
      value: null,
      unit: "N/A",
      condition: "qualitative/vague",
      isVague: true,
      raw: "OSHA 1910.37(b)(1): Each exit route must be adequately lighted so an employee with normal vision can see along route.",
      citation: "OSHA 1910.37(b)(1) (Page 1)"
    },
    oshaSource: "OSHA 1910.37(b)(1) (Page 1)",
    ibcValue: "1 foot-candle (11 lux) minimum at walking surface",
    ibcParsed: {
      value: 1,
      unit: "foot-candle",
      condition: "minimum",
      raw: "IBC 1008.2.1: The means of egress illumination level shall not be less than 1 foot-candle along path.",
      citation: "IBC 1008.2.1 (Page 2)"
    },
    ibcSource: "IBC 1008.2.1 (Page 2)",
    groundTruthClassification: "Flag for Review (Qualitative lighting standard vs quantitative illuminance) / Human verification",
    expectedCategory: "Flag for Review",
    expectedOutcome: "FLAG FOR REVIEW"
  },
  {
    id: "gt-24",
    parameter: "Historic Structure Non-Standard Stair Incline Exception",
    oshaValue: "10 inches max riser (Historic Building Scope)",
    oshaParsed: {
      value: 10,
      unit: "inches",
      condition: "maximum",
      operatingCondition: "Historic preservation district building variance",
      raw: "OSHA 1910.25 Exemption: Existing historic structures may maintain up to 10-inch risers under certified variance.",
      citation: "OSHA 1910 Variance Section 4"
    },
    oshaSource: "OSHA Historic Variance Section 4",
    ibcValue: "8 inches max riser (General Municipal Code)",
    ibcParsed: {
      value: 8,
      unit: "inches",
      condition: "maximum",
      raw: "Municipal Building Code: Maximum riser height 8 inches without exception.",
      citation: "Municipal Code Sec 12"
    },
    ibcSource: "Municipal Code Sec 12",
    groundTruthClassification: "Flag for Review (Requires structural preservation engineer sign-off on historic exception applicability)",
    expectedCategory: "Flag for Review",
    expectedOutcome: "FLAG FOR REVIEW"
  }
];

export class BenchmarkService {
  static async runBenchmarkEvaluation() {
    const results = [];
    let correctMatches = 0;

    // Multi-class tracking: Consistent, Conflict, Gap, Flag for Review
    const classMetrics = {
      Consistent: { tp: 0, fp: 0, fn: 0 },
      Conflict: { tp: 0, fp: 0, fn: 0 },
      Gap: { tp: 0, fp: 0, fn: 0 },
      "Flag for Review": { tp: 0, fp: 0, fn: 0 }
    };

    for (const item of GROUND_TRUTH_DATASET) {
      const comp = ComparisonEngine.comparePair({
        paramA: item.oshaParsed.value !== null || item.oshaParsed.isVague || item.oshaParsed.isMissingUnderCondition ? item.oshaParsed : null,
        standardAName: item.oshaSource.includes("OSHA") ? "OSHA" : "Standard A",
        sourceA: item.oshaSource,
        citationA: item.oshaParsed.citation,
        snippetA: item.oshaParsed.raw,
        paramB: item.ibcParsed.value !== null || item.ibcParsed.isVague || item.ibcParsed.isMissingUnderCondition ? item.ibcParsed : null,
        standardBName: item.ibcSource.includes("IBC") ? "IBC" : "Standard B",
        sourceB: item.ibcSource,
        citationB: item.ibcParsed.citation,
        snippetB: item.ibcParsed.raw,
        parameterName: item.parameter
      });

      const guidance = await GeminiService.explainAndGuide(comp);

      // Predicted category & outcome
      const predictedCategory = comp.classification;
      const expectedCategory = item.expectedCategory;
      const isMatch = predictedCategory.toLowerCase() === expectedCategory.toLowerCase();

      if (isMatch) {
        correctMatches++;
        if (classMetrics[expectedCategory]) {
          classMetrics[expectedCategory].tp++;
        }
      } else {
        if (classMetrics[expectedCategory]) {
          classMetrics[expectedCategory].fn++;
        }
        if (classMetrics[predictedCategory]) {
          classMetrics[predictedCategory].fp++;
        }
      }

      results.push({
        id: item.id,
        parameter: item.parameter,
        oshaValue: item.oshaValue,
        ibcValue: item.ibcValue,
        groundTruthClassification: item.groundTruthClassification,
        expectedCategory,
        predictedCategory,
        outcome: comp.outcome,
        when: comp.when,
        action: comp.action,
        rulesTriggered: comp.rulesTriggered,
        flagForReview: comp.flagForReview,
        severity: comp.severity,
        combinedConstraint: comp.combinedConstraint,
        commonPermissibleSolution: comp.combinedConstraint,
        citations: comp.citations,
        isMatch,
        explanation: guidance.explanation,
        implementationGuidance: guidance.implementationGuidance,
        recommendedDesignValue: comp.combinedConstraint || guidance.recommendedDesignValue
      });
    }

    const total = GROUND_TRUTH_DATASET.length;
    const accuracy = ((correctMatches / total) * 100).toFixed(1);

    // Compute Macro Precision & Recall across classes
    let totalPrecision = 0;
    let totalRecall = 0;
    const classes = Object.keys(classMetrics);

    for (const cls of classes) {
      const { tp, fp, fn } = classMetrics[cls];
      const p = tp + fp > 0 ? tp / (tp + fp) : 1.0;
      const r = tp + fn > 0 ? tp / (tp + fn) : 1.0;
      totalPrecision += p;
      totalRecall += r;
    }

    const macroPrecision = (totalPrecision / classes.length).toFixed(2);
    const macroRecall = (totalRecall / classes.length).toFixed(2);
    const pNum = parseFloat(macroPrecision);
    const rNum = parseFloat(macroRecall);
    const f1Score = (2 * (pNum * rNum) / (pNum + rNum || 1)).toFixed(2);

    return {
      metrics: {
        totalEvaluated: total,
        correctMatches,
        accuracy: `${accuracy}%`,
        precision: macroPrecision,
        recall: macroRecall,
        f1Score,
        consistentCount: results.filter(r => r.predictedCategory === "Consistent").length,
        conflictCount: results.filter(r => r.predictedCategory === "Conflict").length,
        gapCount: results.filter(r => r.predictedCategory === "Gap").length,
        flaggedForReviewCount: results.filter(r => r.predictedCategory === "Flag for Review").length
      },
      decisionTable: [
        { outcome: "CONSISTENT", when: "Both have applicable requirements and they can coexist", action: "Derive common constraint" },
        { outcome: "CONFLICT", when: "Both have applicable requirements but cannot coexist", action: "Flag conflict for engineer review" },
        { outcome: "GAP", when: "Requirement exists in one standard but corresponding applicable requirement is not found in the other", action: "Identify missing requirement for verification" },
        { outcome: "FLAG FOR REVIEW", when: "Information/conditions are ambiguous, so the engine cannot reliably classify it", action: "Human verification" }
      ],
      results
    };
  }
}
