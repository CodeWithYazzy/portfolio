# Content audit for YasirLab 2.0

The portfolio checkout and every text/source file were reviewed before implementation, including deployment rules, the catalog and duplicate fallback, the demo controller, safe arithmetic parser, fixed Iris coefficients, and GitHub sandbox runner. Existing photographs and raster project assets remain available; the new gallery uses original decorative SVG studies.

The linked `CodeWithYazzy/projects` source was also inspected at commit [`2ff4ad16030c7b9dd298d2c2a273df4b7759a1a1`](https://github.com/CodeWithYazzy/projects/tree/2ff4ad16030c7b9dd298d2c2a273df4b7759a1a1). Inspection establishes code presence and scope, not execution results for those separate Python projects.

| Item | Evidence in the inspected source | Presentation in 2.0 |
| --- | --- | --- |
| Iris | Dataset split, scaler/logistic pipeline and training/evaluation modules; this site bundles fixed coefficients | Working browser inference example; no headline accuracy claim |
| Calculator | Desktop Tkinter program; independent browser parser in this site | Working browser demo; clearly separate from the Python implementation |
| Portfolio | This repository contains the real static site | Links to `CodeWithYazzy/portfolio`, with the current site as its preview |
| Sales dashboard | Generated 90-day dataset and a Matplotlib export | Synthetic-data learning exercise |
| Image classifier | CNN definition and one CIFAR-10 batch forward pass | Scaffold; no training/evaluation/checkpoint claim |
| House prices | Generated 200-row housing table and regression pipeline | Synthetic-data learning exercise |
| Sentiment | Six sentences repeated 20 times, then split | Toy exercise; duplicate leakage called out, no generalization claim |
| NumPy explorer | Seeded random table and summary statistics | Synthetic-data learning exercise |
| Matplotlib | Three chart exports from sample/generated inputs | Introductory chart exercise |
| PyTorch chatbot | Tiny vocabulary and GRU forward pass | Scaffold; no conversational product or training claim |
| Heart disease folder | Actually calls `load_breast_cancer` | Explicit dataset mismatch; not presented as a heart-disease or clinical model |
| Customer segmentation | K-Means on generated spend/visit features | Synthetic-data learning exercise |
| Digit classifier | CNN class only | Architecture scaffold; no trained digit recognizer claim |
| Stock predictor | Generated price-like series with previous-value regression | Synthetic-data baseline; no market forecasting claim |
| AI assistant | Hash-distance ranking of three strings | Retrieval sketch; no embeddings, LLM, or answer-generation claim |
| Six lab cards | Plans and unfilled results in the original page | Proposed concepts, with possible methods and evidence still to collect |
| Awards/certifications | No supporting artifacts in this checkout | Removed |
| Professional and aggregate claims | Unverified years, capabilities, deployments and job titles | Replaced by a personal learning practice; structured data omits job title |

The browser demo's probabilities remain visible because they are computed from the bundled model; these are labeled as model outputs rather than test accuracy. Proposed lab methods use conditional language and always state that no experiment has been run. The site does not claim credentials, commercial clients, clinical usefulness, or completed research.
