"""
ClauseGuard - Custom NER Model for Numeric Parameter Extraction
ONE-FILE version: trains AND tests in a single run. Good for live demo in review.

Labels: PARAMETER, VALUE, UNIT, CONDITION
Matches exactly the example your guide gave:
  "The stair riser shall not exceed 9.5 inches."
  -> {"parameter": "stair riser", "value": 9.5, "unit": "inches", "condition": "max"}

SETUP (run once):
    pip install spacy
"""

import spacy
from spacy.training import Example
import random

# =================================================================
# STEP 1: Labeled training data
# Format: (clause_text, [(substring, LABEL), ...])
# Offsets are computed automatically below — no manual character counting,
# which is error-prone and was causing misaligned training data.
# =================================================================

TRAIN_DATA_RAW = [
    ("The stair riser shall not exceed 9.5 inches.",
     [("stair riser", "PARAMETER"), ("not exceed", "CONDITION"), ("9.5", "VALUE"), ("inches", "UNIT")]),

    ("Stair riser height shall be a maximum of 7 inches.",
     [("Stair riser height", "PARAMETER"), ("maximum", "CONDITION"), ("7", "VALUE"), ("inches", "UNIT")]),

    ("Stair riser height shall be a minimum of 4 inches.",
     [("Stair riser height", "PARAMETER"), ("minimum", "CONDITION"), ("4", "VALUE"), ("inches", "UNIT")]),

    ("Tread depth shall be a minimum of 9.5 inches.",
     [("Tread depth", "PARAMETER"), ("minimum", "CONDITION"), ("9.5", "VALUE"), ("inches", "UNIT")]),

    ("Stair tread depth shall be a minimum of 11 inches.",
     [("Stair tread depth", "PARAMETER"), ("minimum", "CONDITION"), ("11", "VALUE"), ("inches", "UNIT")]),

    ("Handrail height shall not be less than 34 inches.",
     [("Handrail height", "PARAMETER"), ("not be less than", "CONDITION"), ("34", "VALUE"), ("inches", "UNIT")]),

    ("Handrail height shall not be more than 38 inches.",
     [("Handrail height", "PARAMETER"), ("not be more than", "CONDITION"), ("38", "VALUE"), ("inches", "UNIT")]),

    ("Riser height variation shall not exceed 0.1875 inch within a flight of stairs.",
     [("Riser height variation", "PARAMETER"), ("not exceed", "CONDITION"), ("0.1875", "VALUE"), ("inch", "UNIT")]),

    ("The guardrail height shall not exceed 42 inches.",
     [("guardrail height", "PARAMETER"), ("not exceed", "CONDITION"), ("42", "VALUE"), ("inches", "UNIT")]),

    ("Stair width shall be a minimum of 44 inches.",
     [("Stair width", "PARAMETER"), ("minimum", "CONDITION"), ("44", "VALUE"), ("inches", "UNIT")]),

    # --- Add more labeled clauses here as time allows; more data = better model ---
]

def build_offsets(text, substr_labels):
    """Finds each substring's character position automatically -- avoids manual offset errors."""
    spans = []
    for substr, label in substr_labels:
        start = text.find(substr)
        if start == -1:
            print(f"WARNING: substring '{substr}' not found in: {text}")
            continue
        end = start + len(substr)
        spans.append((start, end, label))
    return spans

TRAIN_DATA = [(text, build_offsets(text, labels)) for text, labels in TRAIN_DATA_RAW]

# =================================================================
# STEP 2: Build and train the model (in-memory, no CLI/config files needed)
# =================================================================

nlp = spacy.blank("en")
ner = nlp.add_pipe("ner")
for label in ["PARAMETER", "VALUE", "UNIT", "CONDITION"]:
    ner.add_label(label)

examples = []
for text, annotations in TRAIN_DATA:
    doc = nlp.make_doc(text)
    ents = []
    for start, end, label in annotations:
        span = doc.char_span(start, end, label=label, alignment_mode="contract")
        if span is not None:
            ents.append(span)
        else:
            print(f"WARNING: could not align span in: {text}")
    example = Example.from_dict(doc, {"entities": [(e.start_char, e.end_char, e.label_) for e in ents]})
    examples.append(example)

print(f"Training on {len(examples)} labeled clauses...\n")

optimizer = nlp.initialize()
for epoch in range(40):
    random.shuffle(examples)
    losses = {}
    for example in examples:
        nlp.update([example], sgd=optimizer, losses=losses)
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}: loss = {losses.get('ner', 0):.3f}")

print("\nTraining complete.\n")

# =================================================================
# STEP 3: Test the trained model on new/unseen clauses (the actual demo)
# =================================================================

test_clauses = [
    "The stair riser shall not exceed 9.5 inches.",              # seen in training
    "Stair riser height shall be a maximum of 7 inches.",         # seen in training
    "The walkway width shall not exceed 60 inches.",              # UNSEEN - true test of generalization
]

print("=" * 60)
print("DEMO: Extraction on test clauses")
print("=" * 60)

for clause in test_clauses:
    doc = nlp(clause)
    print(f"\nClause: \"{clause}\"")
    print("Extracted entities:")
    for ent in doc.ents:
        print(f"  {ent.label_:10s} -> \"{ent.text}\"")

nlp.to_disk("./clauseguard_ner_model")
print("\nModel saved to ./clauseguard_ner_model")