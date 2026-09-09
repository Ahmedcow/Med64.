MED64 NEW - STANDALONE VERSION

1. Open index.html in a browser.
2. Default login: admin / Med64@123
3. Add questions from Add Questions.
4. For bulk questions, use Import / Export and import a JSON array.
5. The exported questions.json can be kept as your master question bank.
6. Section and category are stored inside each question, so changing them updates Progress automatically.
7. Progress and mistakes are stored in the browser's localStorage.

IMPORTANT SECURITY NOTE:
This is a standalone HTML application. Its login is a local/browser gate, not server-side authentication. It is NOT suitable for protecting sensitive content or a production admin account. For real security, deploy with a backend authentication service (for example Supabase/Firebase/your own server) and move question administration behind server authorization.
