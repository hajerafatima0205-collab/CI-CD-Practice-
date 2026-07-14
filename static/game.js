const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const startButton = document.getElementById("startButton");
const target = document.getElementById("target");
const playfield = document.getElementById("playfield");
const leaderboardEl = document.getElementById("leaderboard");
const playerNameInput = document.getElementById("playerName");

let score = 0;
let remainingTime = window.GAME_DURATION || 30;
let gameActive = false;
let timerId = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function updateScore(value) {
  score = value;
  scoreEl.textContent = String(score);
}

function updateTimer(value) {
  remainingTime = value;
  timerEl.textContent = String(remainingTime);
}

function randomPosition(limit) {
  return Math.floor(Math.random() * limit);
}

function moveTarget() {
  const playfieldRect = playfield.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const maxX = Math.max(playfieldRect.width - targetRect.width, 0);
  const maxY = Math.max(playfieldRect.height - targetRect.height, 0);

  target.style.left = `${randomPosition(maxX)}px`;
  target.style.top = `${randomPosition(maxY)}px`;
}

function showTarget() {
  target.classList.remove("hidden");
  moveTarget();
}

function hideTarget() {
  target.classList.add("hidden");
}

async function loadLeaderboard() {
  try {
    const response = await fetch("/api/leaderboard");
    const data = await response.json();
    const scores = Array.isArray(data.scores) ? data.scores : [];

    leaderboardEl.innerHTML = "";
    if (scores.length === 0) {
      leaderboardEl.innerHTML = '<li class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-400">No scores yet.</li>';
      return;
    }

    scores.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3";
      item.innerHTML = `
        <span class="font-medium text-slate-100">${index + 1}. ${entry.name}</span>
        <span class="text-gold font-semibold">${entry.score}</span>
      `;
      leaderboardEl.appendChild(item);
    });

    bestScoreEl.textContent = String(scores[0].score ?? 0);
  } catch (error) {
    leaderboardEl.innerHTML = '<li class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-400">Leaderboard unavailable.</li>';
  }
}

async function submitScore() {
  try {
    await fetch("/api/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playerNameInput.value.trim() || "Player",
        score,
      }),
    });
    await loadLeaderboard();
  } catch (error) {
    setStatus("Score could not be saved");
  }
}

function endGame() {
  gameActive = false;
  clearInterval(timerId);
  timerId = null;
  hideTarget();
  setStatus("Round finished");
  startButton.disabled = false;
  startButton.textContent = "Start Game";
  submitScore();
}

function tick() {
  if (!gameActive) {
    return;
  }

  if (remainingTime <= 1) {
    updateTimer(0);
    endGame();
    return;
  }

  updateTimer(remainingTime - 1);
}

function startGame() {
  gameActive = true;
  updateScore(0);
  updateTimer(window.GAME_DURATION || 30);
  setStatus("Go for it");
  startButton.disabled = true;
  startButton.textContent = "Playing...";
  showTarget();

  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
}

target.addEventListener("click", () => {
  if (!gameActive) {
    return;
  }

  updateScore(score + 1);
  moveTarget();
});

startButton.addEventListener("click", startGame);

window.addEventListener("resize", () => {
  if (gameActive) {
    moveTarget();
  }
});

loadLeaderboard();
updateTimer(window.GAME_DURATION || 30);
hideTarget();
