"""
ClauseGuard - Custom spaCy NER Training Script
Trains a custom Named Entity Recognition model to extract:
  - PARAMETER (e.g., 'stair riser height', 'tread depth', 'guardrail height')
  - VALUE     (e.g., '9.5', '7', '4', '11', '0.1875', '34')
  - UNIT      (e.g., 'inches', 'inch')
  - CONDITION (e.g., 'not exceed', 'maximum', 'minimum', 'not less than', 'not more than')

Outputs the trained model to ./models/clauseguard_ner_model
"""

import sys
import json
import random
from pathlib import Path

# Ground-truth labeled clauses for engineering standards
TRAIN_DATA_RAW = [
    (
        "OSHA 1910.25(c)(2): For standard fixed stairs, riser height shall not exceed 9.5 inches.",
        [("riser height", "PARAMETER"), ("not exceed", "CONDITION"), ("9.5", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1011.5.2: Stair riser height shall be a maximum of 7 inches.",
        [("Stair riser height", "PARAMETER"), ("maximum", "CONDITION"), ("7", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1011.5.2: Stair riser height shall be a minimum of 4 inches.",
        [("Stair riser height", "PARAMETER"), ("minimum", "CONDITION"), ("4", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "OSHA 1910.25(c)(3): For standard fixed stairs, tread depth shall be a minimum of 9.5 inches.",
        [("tread depth", "PARAMETER"), ("minimum", "CONDITION"), ("9.5", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1011.5.2: Stair tread depth shall be a minimum of 11 inches.",
        [("Stair tread depth", "PARAMETER"), ("minimum", "CONDITION"), ("11", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1012.2: Handrail height shall not be less than 34 inches.",
        [("Handrail height", "PARAMETER"), ("not be less than", "CONDITION"), ("34", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1012.2: Handrail height shall not be more than 38 inches.",
        [("Handrail height", "PARAMETER"), ("not be more than", "CONDITION"), ("38", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "OSHA 1910.25(c)(2): Riser height variation shall not exceed 0.1875 inch within a flight of stairs.",
        [("Riser height variation", "PARAMETER"), ("not exceed", "CONDITION"), ("0.1875", "VALUE"), ("inch", "UNIT")]
    ),
    (
        "IBC 1011.5.4: The greatest riser height within any flight of stairs shall not exceed the smallest by more than 0.375 inch.",
        [("riser height", "PARAMETER"), ("not exceed", "CONDITION"), ("0.375", "VALUE"), ("inch", "UNIT")]
    ),
    (
        "OSHA 1910.28(b)(1): Top edge height of top rails shall be 42 inches plus or minus 3 inches.",
        [("top rails", "PARAMETER"), ("42", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1015.3: Required guards shall not be less than 42 inches high.",
        [("guards", "PARAMETER"), ("not be less than", "CONDITION"), ("42", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "OSHA 1910.25(c)(4): Fixed stairs shall have a minimum width of 22 inches.",
        [("Fixed stairs", "PARAMETER"), ("minimum width", "CONDITION"), ("22", "VALUE"), ("inches", "UNIT")]
    ),
    (
        "IBC 1011.2: Stairways shall have a minimum width of 44 inches.",
        [("Stairways", "PARAMETER"), ("minimum width", "CONDITION"), ("44", "VALUE"), ("inches", "UNIT")]
    )
]

def build_offsets(text, substr_labels):
    spans = []
    for substr, label in substr_labels:
        start = text.find(substr)
        if start != -1:
            end = start + len(substr)
            spans.append((start, end, label))
    return spans

def train_and_export():
    try:
        import spacy
        from spacy.training import Example
    except Exception as err:
        print(f"Notice: spaCy native load status: {err}")
        return False

    nlp = spacy.blank("en")
    ner = nlp.add_pipe("ner")
    for label in ["PARAMETER", "VALUE", "UNIT", "CONDITION"]:
        ner.add_label(label)

    train_data = [(text, build_offsets(text, labels)) for text, labels in TRAIN_DATA_RAW]
    examples = []
    for text, annotations in train_data:
        doc = nlp.make_doc(text)
        ents = []
        for start, end, label in annotations:
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span:
                ents.append(span)
        example = Example.from_dict(doc, {"entities": [(e.start_char, e.end_char, e.label_) for e in ents]})
        examples.append(example)

    print(f"Training custom spaCy NER on {len(examples)} labeled engineering clauses...")
    optimizer = nlp.initialize()
    for epoch in range(40):
        random.shuffle(examples)
        losses = {}
        for ex in examples:
            nlp.update([ex], sgd=optimizer, losses=losses)
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1:02d}: loss = {losses.get('ner', 0):.4f}")

    out_dir = Path("./models/clauseguard_ner_model")
    out_dir.mkdir(parents=True, exist_ok=True)
    nlp.to_disk(out_dir)
    print(f"Successfully exported custom spaCy model to: {out_dir.resolve()}")
    return True

if __name__ == "__main__":
    train_and_export()
