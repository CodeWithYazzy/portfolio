# Content audit

The portfolio checkout, project catalog, demo controller, arithmetic parser, Iris coefficients, and GitHub preview runner were reviewed before this redesign. The linked [`CodeWithYazzy/projects`](https://github.com/CodeWithYazzy/projects) source was inspected at commit [`2ff4ad16030c7b9dd298d2c2a273df4b7759a1a1`](https://github.com/CodeWithYazzy/projects/tree/2ff4ad16030c7b9dd298d2c2a273df4b7759a1a1). That inspection establishes what code exists, not that the separate Python projects have been trained or evaluated.

| Item | Evidence in the inspected source | Presentation on the site |
| --- | --- | --- |
| Iris | Dataset split, scaler/logistic pipeline, and training/evaluation modules; this site bundles fixed coefficients | Working browser inference; probabilities are labeled model output, not accuracy |
| Calculator | Desktop Tkinter program; an independent browser parser lives in this site | Working browser demo, clearly separate from the Python program |
| Portfolio | This repository contains the real static site | Linked from the project index and used as its own preview |
| Sales dashboard | Generated 90-day dataset and a Matplotlib export | Synthetic-data learning exercise |
| Image classifier | CNN definition and one CIFAR-10 batch forward pass | Scaffold; no training, checkpoint, or evaluation claim |
| House prices | Generated 200-row housing table and regression pipeline | Synthetic-data learning exercise |
| Sentiment | Six sentences repeated 20 times, then split | Toy exercise; duplicate leakage is stated, with no generalization claim |
| NumPy explorer | Seeded random table and summary statistics | Synthetic-data learning exercise |
| Matplotlib | Three chart exports from sample or generated inputs | Introductory chart exercise |
| PyTorch chatbot | Tiny vocabulary and a GRU forward pass | Scaffold; no conversational product or training claim |
| Heart disease folder | Actually calls `load_breast_cancer` | Dataset mismatch stated; not presented as a heart-disease or clinical model |
| Customer segmentation | K-Means on generated spend and visit features | Synthetic-data learning exercise |
| Digit classifier | CNN class only | Architecture scaffold; no trained digit-recognizer claim |
| Stock predictor | Generated price-like series with previous-value regression | Synthetic-data baseline; no market-forecasting claim |
| AI assistant | Hash-distance ranking of three strings | Retrieval sketch; no embeddings, LLM, or answer-generation claim |
| Former lab concepts | Six proposed experiments with unfilled results | Removed from the public page rather than presented as work |
| Contact form and modal layers | Not part of a static portfolio's core job | Replaced by a direct email link and copy button |
| Awards and certifications | No supporting artifacts in this checkout | Not claimed |
| Professional and aggregate claims | No supporting evidence for years, job titles, or deployment figures | Removed; structured data describes a person without a job title |

Project copy was shortened to say what each item is, what it uses, and whether it is finished. The former "YasirLab 2.0" identity and all proposed-lab language were removed. The portrait is derived from the owner's existing photograph. The social card was rebuilt around the current name and statement.

The browser Iris demo keeps its probabilities visible because they are computed from the bundled model. The site makes no claim about test accuracy, credentials, commercial clients, clinical usefulness, or completed research.
