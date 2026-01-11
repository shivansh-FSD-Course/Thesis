# Masters Thesis — Internal User Representations in LLMs
**Title:** Internal User Representations in Large Language Models: From Model Internals to Felt Understanding  
**Author:** Shivansh Singh (LUT University, Finland)  
**Start:** January 2026

## What this repo is
This repository contains the code, data, and analysis pipeline for my Master's thesis on whether *people’s feelings of being understood* by an LLM relate to *measurable internal user representations* inside the model.

The project follows a **replication → extension** strategy:
1) **Replication (technical validation):** reproduce persona localization results from prior work (baseline sanity check + generalization across models).
2) **Extension (HCI bridge):** move from static persona statements to **real user conversations** and test whether the quality of internal user representations correlates with **felt understanding**.

---

## Core research question
**Are people’s feelings of being understood grounded in measurable internal user representations inside the LLM, and if so, where and how do those representations behave during conversation?**

### Probes (the thesis “spine”)
1. **Does a user signal exist?** (hidden states encode user-relevant information beyond literal text)
2. **Where does the signal live?** (which transformer layers carry it most strongly)
3. **How does it evolve?** (stability vs update-sensitivity across turns)
4. **Is it concentrated or diffuse?** (few strong units vs many weak units)
5. **Does it predict human experience?** (correlate representation quality with felt understanding)

---

## What’s already done (repo status)
### Data ingestion (completed)
-  Added the **Anthropic evals persona dataset** (raw dump) for replication:
  - `data/raw/anthropic_evals/persona/`
  - Upstream license + readme stored in: `data/raw/anthropic_evals/_source/`

### Replication subset (completed)
-  Created a clean “paper-only” subset containing the **14 persona datasets** used for replication:
  - `data/selected/ibm_personas_llms_analysis/persona/`
  - `data/selected/ibm_personas_llms_analysis/README.md`

---

## Repository layout
```text
.
├── data/
│   ├── raw/
│   │   └── anthropic_evals/
│   │       ├── persona/                      # full persona dataset dump (raw)
│   │       └── _source/                      # upstream LICENSE + README for attribution
│   └── selected/
│       └── ibm_personas_llms_analysis/
│           ├── persona/                      # only the 14 persona datasets used in replication
│           └── README.md
│
├── src/                                      # (to be added) reusable library code
├── scripts/                                  # (to be added) CLI scripts to run experiments end-to-end
├── notebooks/                                # (to be added) exploration + debugging notebooks
├── configs/                                  # (to be added) YAML configs: model, layers, seeds, metrics, thresholds
└── outputs/                                  # (to be added) generated artifacts: embeddings, metrics, plots, logs
