# Machine Learning Architecture & Integration

This project is a **Clinical NLP Platform** that integrates state-of-the-art Deep Learning models to analyze medical text. It is not just a UI; it connects to powerful Transformer-based models via the **Hugging Face Inference API**.

## 1. Real ML Models Used
We utilize specific, pre-trained Large Language Models (LLMs) for different tasks. These are not simple regex or rule-based systems; they are Neural Networks trained on massive biomedical datasets.

| Feature | Model Family | Specific Model Used | Task |
| :--- | :--- | :--- | :--- |
| **NER Analysis** | **BERT** | `d4data/biomedical-ner-all` | **Token Classification**: Detects 10+ clinical entity types (Symptoms, Meds, dosage). |
| **Summarization** | **BART** | `sshleifer/distilbart-cnn-12-6` | **Seq2Seq**: Generates abstractive summaries of long clinical notes. |
| **Q&A System** | **RoBERTa** | `deepset/roberta-base-squad2` | **Question Answering**: Extractive QA that finds precise answers in context. |

## 2. The pipeline
1.  **Input**: User enters text or uploads PDF/DOCX.
2.  **Preprocessing**: Frontend (React) cleans the text.
3.  **Transport**: Request sent to **Supabase Edge Function** (`clinical-nlp-analysis`).
4.  **Inference**: Edge Function calls **Hugging Face API**.
5.  **Post-processing**: Raw tensors/JSON from HF are formatted into structured JSON (Confidence scores, Entity offsets).
6.  **Storage**: Results are saved to **Supabase PostgreSQL** (with `pgvector` ready schema).

## 3. Key ML Features
### A. Named Entity Recognition (NER)
We don't just find keywords. The model understands *context*.
*   *Example*: "Patient denies fever" vs "Patient has fever".
*   A keyword search finds "fever" in both.
*   The ML model detects "fever" as a Symptom but can differentiate context (though simple NER detects entities; relationship extraction would handle the negation).

### B. Abstractive Summarization
The `distilbart` model reads 2000 characters and rewrites a summary. It does not just copy sentences; it generates *new* sentences that capture the meaning. This is a core NLP generation task.

### C. Fine-Tuning (Simulation)
The **Fine-Tune** tab demonstrates the MLOps workflow. While running a real training job requires GPUs (costing money/hour), the UI accurately modeled the configuration steps:
*   Dataset Validation (JSONL)
*   Hyperparameter Tuning (Epochs, Learning Rate)
*   Training Loop Visualization (Loss/Accuracy curves)

## 4. Why this is an "ML Project"
1.  **Integration**: It successfully bridges the gap between a user-friendly Web UI and backend Python/PyTorch models (via API).
2.  **Data Processing**: It handles real-world dirty data (PDFs) and prepares it for model consumption.
3.  **MLOps elements**: It includes feedback loops (Analytics dashboard tracking model confidence) and Batch Processing queues.
