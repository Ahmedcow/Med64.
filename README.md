# Med 64 — Advanced Medical Examination Platform

A single-file medical exam website designed for GitHub + Vercel deployment.

## Easiest way to maintain built-in questions

Use **one file named `questions.json` in the repository root**, beside `index.html`.

Example:

```json
{
  "version": "1.0",
  "questions": [
    {
      "id": "cardio-001",
      "section": "Medicine",
      "category": "Cardiology",
      "question": "Which cardiac biomarker is most specific for myocardial infarction?",
      "options": ["CK-MB", "Troponin I", "Myoglobin", "LDH-1"],
      "correctIndex": 1,
      "explanation": "Optional explanation."
    }
  ]
}
```

You can also use a plain array instead of `{ "questions": [...] }`.

### Important
- `id` should be unique within the file.
- `correctIndex` is **zero-based**: `0` = first option, `1` = second option, etc.
- `section` and `category` are read directly from the JSON.
- Changing a section/category in GitHub and pressing **Refresh Built-in Bank** in the website updates the displayed groups without editing `index.html`.
- The website keeps learning history attached to the question's source file + ID, so changing a section/category does not erase that question's progress.

## Advanced multi-file mode

If you prefer separate files, remove/omit root `questions.json` and use:

```text
questions/
  index.json
  cardiology.json
  pharmacology.json
  anatomy.json
```

`questions/index.json`:

```json
{
  "version": "2.0",
  "files": [
    { "file": "cardiology.json", "section": "Medicine", "category": "Cardiology" },
    { "file": "pharmacology.json", "section": "Medicine", "category": "Pharmacology" },
    { "file": "anatomy.json", "section": "Basic Sciences", "category": "Anatomy" }
  ]
}
```

Manifest values override the section/category inside each question. Multiple files may belong to the same section.

## Exam features

- Quick and custom exams
- Section + category filtering
- Unlimited or timed exams
- Automatic submission when the timer reaches zero
- **Show answer immediately** or **Show answers after finishing**
- Final answer review with selected answer, correct answer, section/category, and explanation
- Per-question progress and accuracy
- Section → category progress dashboard
- Mistakes memory bank and re-exam
- Local browser persistence
- JSON import for local/browser question banks
- GitHub built-in bank with one-file easy mode or multi-file advanced mode
- Built-in bank refresh button
- GitHub-ready JSON template download
- Dark mode

## GitHub + Vercel

1. Upload `index.html` to the repository root.
2. For easiest maintenance, upload one `questions.json` beside it.
3. Push/save the changes.
4. Open the Vercel site.
5. In the website's Upload section, press **Refresh Built-in Bank** after the new deployment is available.

No database or login is required; progress is stored in the user's browser.
