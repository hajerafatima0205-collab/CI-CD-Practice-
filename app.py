from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

DATA_DIR = Path(app.root_path) / "data"
SCORES_FILE = DATA_DIR / "scores.json"
SCORE_LOCK = threading.Lock()
GAME_DURATION_SECONDS = 30
MAX_LEADERBOARD_ENTRIES = 5


def ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SCORES_FILE.exists():
        SCORES_FILE.write_text("[]", encoding="utf-8")


def load_scores() -> list[dict[str, object]]:
    ensure_storage()
    try:
        data = json.loads(SCORES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        data = []
    if not isinstance(data, list):
        return []
    cleaned_scores: list[dict[str, object]] = []
    for entry in data:
        if isinstance(entry, dict) and "name" in entry and "score" in entry:
            cleaned_scores.append(
                {
                    "name": str(entry.get("name", "Player"))[:20],
                    "score": int(entry.get("score", 0)),
                    "created_at": str(entry.get("created_at", "")),
                }
            )
    return cleaned_scores


def save_scores(scores: list[dict[str, object]]) -> None:
    ensure_storage()
    SCORES_FILE.write_text(json.dumps(scores, indent=2), encoding="utf-8")


def format_scores(scores: list[dict[str, object]]) -> list[dict[str, object]]:
    ordered_scores = sorted(scores, key=lambda item: int(item["score"]), reverse=True)
    return ordered_scores[:MAX_LEADERBOARD_ENTRIES]


@app.route("/")
def index() -> str:
    return render_template("index.html", game_duration=GAME_DURATION_SECONDS)


@app.route("/api/health")
def health() -> tuple[dict[str, object], int]:
    return jsonify({"ok": True}), 200


@app.route("/api/leaderboard")
def leaderboard() -> tuple[dict[str, object], int]:
    with SCORE_LOCK:
        scores = format_scores(load_scores())
    return jsonify({"scores": scores}), 200


@app.route("/api/score", methods=["POST"])
def submit_score() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "Player")).strip() or "Player"
    name = name[:20]

    try:
        score = int(payload.get("score", 0))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Score must be a number."}), 400

    if score < 0:
        return jsonify({"ok": False, "error": "Score must be zero or higher."}), 400

    entry = {
        "name": name,
        "score": score,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with SCORE_LOCK:
        scores = load_scores()
        scores.append(entry)
        scores = format_scores(scores)
        save_scores(scores)

    return jsonify({"ok": True, "best_score": scores[0]["score"] if scores else score}), 200


if __name__ == "__main__":
    app.run(debug=True)
