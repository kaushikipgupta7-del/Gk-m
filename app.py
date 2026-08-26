from flask import Flask, render_template, jsonify, request, session
import json, random, os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-secret-key")

with open("questions.json", "r", encoding="utf-8") as f:
    QUESTIONS = json.load(f)

@app.get("/")
def home():
    categories = sorted({q["category"] for q in QUESTIONS})
    return render_template("index.html", categories=categories, total=len(QUESTIONS))

@app.get("/api/quiz")
def quiz():
    category = request.args.get("category", "All")
    try:
        amount = max(1, min(int(request.args.get("amount", 10)), 30))
    except ValueError:
        amount = 10

    pool = QUESTIONS if category == "All" else [q for q in QUESTIONS if q["category"] == category]
    selected = random.sample(pool, min(amount, len(pool)))

    # Keep answers on the server/session instead of exposing them to the browser.
    session["quiz_answers"] = [q["answer"] for q in selected]
    session["quiz_questions"] = [q["q"] for q in selected]

    public = [{"q": q["q"], "options": q["options"], "category": q["category"]} for q in selected]
    return jsonify({"questions": public, "count": len(public)})

@app.post("/api/submit")
def submit():
    data = request.get_json(silent=True) or {}
    answers = data.get("answers", [])
    correct = session.get("quiz_answers", [])

    score = sum(
        1 for i, answer in enumerate(answers)
        if i < len(correct) and answer == correct[i]
    )
    total = len(correct)
    percentage = round((score / total) * 100) if total else 0

    session.pop("quiz_answers", None)
    session.pop("quiz_questions", None)

    return jsonify({
        "score": score,
        "total": total,
        "percentage": percentage,
        "message": (
            "Excellent! 🧠" if percentage >= 90 else
            "Great job! 🔥" if percentage >= 70 else
            "Nice try! Keep practicing. 💪"
        )
    })

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
