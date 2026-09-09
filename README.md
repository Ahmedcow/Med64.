# Med64 – Flexible Question Bank

## Professional GitHub question structure

```text
Med64/
├── index.html
├── README.md
└── questions/
    ├── index.json
    ├── cardiology.json
    ├── anatomy.json
    └── pharmacology.json
```

## Rename sections and categories without changing index.html

Edit only `questions/index.json`.

Each entry supports:
- `file`: JSON filename inside `questions/`
- `section`: the section name shown by the app
- `category`: the category name shown by the app

Example:

```json
{
  "files": [
    { "file": "lecture1.json", "section": "Medicine", "category": "Cardiology" },
    { "file": "lecture2.json", "section": "Medicine", "category": "Heart Failure" },
    { "file": "lecture3.json", "section": "Surgery", "category": "Cardiac Surgery" }
  ]
}
```

Multiple files can belong to the same section. There is no need to modify `index.html`.

If `category` is omitted, the category inside the question JSON is used. If `section` is omitted, the question's section/category is used.

The app also supports question files that are either a plain JSON array or an object containing a `questions` array.

## Important

After changing `questions/index.json` or any question file, commit the changes to GitHub. Vercel will deploy the update if your repository is connected to Vercel.
