import { Game } from "./game.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const bestEl = document.getElementById("best");
const waveEl = document.getElementById("wave");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const levelEl = document.getElementById("level");
const xpFillEl = document.getElementById("xp-fill");
const skillOverlay = document.getElementById("skill-overlay");
const skillTitleEl = document.getElementById("skill-title");
const skillButtons = Array.from(document.querySelectorAll(".skill-btn"));

const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  touchActive: false,
  touchX: 0,
  touchY: 0,
  _start: false,
  consumeStart() {
    if (this._start) {
      this._start = false;
      return true;
    }
    return false;
  },
};

const game = new Game(canvas, {
  scoreEl,
  livesEl,
  bestEl,
  waveEl,
  levelEl,
  xpFillEl,
  overlay,
  overlayMsg,
  skillOverlay,
  skillTitleEl,
  skillButtons,
});

function logicalSize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.max(1, Math.floor(rect.width * dpr));
  const bh = Math.max(1, Math.floor(rect.height * dpr));
  canvas.width = bw;
  canvas.height = bh;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

function onResize() {
  const { w, h } = logicalSize();
  game.resize(w, h);
}

function isSkillPicking() {
  return skillOverlay && !skillOverlay.classList.contains("hidden");
}

function keyDown(e) {
  if (isSkillPicking()) {
    if (e.code === "Space") e.preventDefault();
    return;
  }
  if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") input.right = true;
  if (e.code === "ArrowUp" || e.code === "KeyW") input.up = true;
  if (e.code === "ArrowDown" || e.code === "KeyS") input.down = true;
  if (e.code === "Space") {
    e.preventDefault();
    input._start = true;
  }
}
function keyUp(e) {
  if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") input.right = false;
  if (e.code === "ArrowUp" || e.code === "KeyW") input.up = false;
  if (e.code === "ArrowDown" || e.code === "KeyS") input.down = false;
}

function clientToGame(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return { x, y };
}

function onTouchStart(e) {
  if (e.targetTouches.length === 0) return;
  const t = e.targetTouches[0];
  const p = clientToGame(t.clientX, t.clientY);
  input.touchActive = true;
  input.touchX = p.x;
  input.touchY = p.y;
  e.preventDefault();
}
function onTouchMove(e) {
  if (e.targetTouches.length === 0) return;
  const t = e.targetTouches[0];
  const p = clientToGame(t.clientX, t.clientY);
  input.touchX = p.x;
  input.touchY = p.y;
  e.preventDefault();
}
function onTouchEnd(e) {
  if (e.touches.length === 0) input.touchActive = false;
}

let lastStartTap = 0;
function requestStart() {
  const t = performance.now();
  if (t - lastStartTap < 350) return;
  lastStartTap = t;
  input._start = true;
}
overlay.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  requestStart();
});

if (btnStart) {
  btnStart.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    requestStart();
  });
}

for (const btn of skillButtons) {
  btn.addEventListener("click", () => {
    const id = btn.dataset.skill;
    if (id) game.pickSkill(id);
  });
}

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);
canvas.addEventListener("touchstart", onTouchStart, { passive: false });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });
canvas.addEventListener("touchend", onTouchEnd);
canvas.addEventListener("touchcancel", onTouchEnd);

window.addEventListener("resize", onResize);
onResize();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt, input);
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
