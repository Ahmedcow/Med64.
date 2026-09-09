# Med64 — Professional GitHub / Vercel Structure

```text
Med64/
├── index.html
├── questions/
│   ├── index.json
│   ├── anatomy.json
│   ├── cardiology.json
│   └── pharmacology.json
└── README.md
```

## How it works

- `index.html` is the exam application.
- `questions/index.json` is the manifest that tells the app which question files to load.
- Each subject has its own JSON file inside `questions/`.
- Add a new subject by creating a JSON file and adding it to `questions/index.json`.
- Vercel automatically serves the files after deployment.

### Question format

Each JSON file contains an array of questions using the same format as the app:

```json
{
  "id": "cardio_001",
  "category": "Cardiology",
  "section": "Cardiology",
  "question": "Your question",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Explanation shown after the answer."
}
```
