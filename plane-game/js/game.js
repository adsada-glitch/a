import { Background } from "./background.js";
import { ParticleSystem } from "./particles.js";
import { Player, BulletPool, EnemyPool, aabb } from "./entities.js";
import { PowerupPool } from "./powerups.js";
import { XpOrbPool } from "./xpOrbs.js";
import { xpToNext } from "./progression.js";
import {
  SKILLS,
  emptySkillLevels,
  computeRunStats,
  rollSkillChoices,
  SKILL_META,
} from "./skills.js";

const STATE = { MENU: "menu", PLAYING: "playing", GAMEOVER: "gameover", LEVEL_UP: "levelup" };
const BEST_KEY = "starSurvivorBest";
/** 每升多少级触发一次三选一技能 */
const SKILL_PICK_EVERY_LEVELS = 3;

export class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scoreEl = hud.scoreEl;
    this.livesEl = hud.livesEl;
    this.bestEl = hud.bestEl;
    this.waveEl = hud.waveEl;
    this.levelEl = hud.levelEl;
    this.xpFillEl = hud.xpFillEl;
    this.overlay = hud.overlay;
    this.overlayMsg = hud.overlayMsg;
    this.skillOverlay = hud.skillOverlay || null;
    this.skillTitleEl = hud.skillTitleEl || null;
    this.skillButtons = hud.skillButtons || [];

    this.bg = new Background();
    this.particles = new ParticleSystem();
    this.bullets = new BulletPool();
    this.enemies = new EnemyPool();
    this.player = new Player();
    this.powerups = new PowerupPool();
    this.xpOrbs = new XpOrbPool();

    this.state = STATE.MENU;
    this.score = 0;
    this.playTime = 0;
    this.spawnAcc = 0;
    this.width = 300;
    this.height = 500;
    this.difficulty = 0;
    this.bestScore = Number(localStorage.getItem(BEST_KEY) || "0");
    this.killsSinceDrop = 0;
    this.nextBossAt = 60;
    this.shake = 0;

    this.level = 1;
    this.xp = 0;
    this.skillLevels = emptySkillLevels();
    this.runStats = computeRunStats(this.skillLevels);
    this.shieldCdEnd = 0;
    this.laserCd = 0.8;
    this.laserFlash = 0;
    this.pendingChoices = [];

    this.syncHud();
  }

  getWaveNumber() {
    const t = this.playTime;
    if (t < 20) return 1;
    if (t < 45) return 2;
    if (t < 60) return 3;
    if (t < 90) return 4;
    return 5;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.bg.resize(width, height);
    if (this.state === STATE.MENU) {
      this.player.x = width / 2 - this.player.w / 2;
      this.player.y = height * 0.72;
    }
  }

  beginPlay() {
    this.state = STATE.PLAYING;
    this.score = 0;
    this.playTime = 0;
    this.spawnAcc = 0;
    this.difficulty = 0;
    this.killsSinceDrop = 0;
    this.nextBossAt = 60;
    this.shake = 0;
    this.level = 1;
    this.xp = 0;
    this.skillLevels = emptySkillLevels();
    this.runStats = computeRunStats(this.skillLevels);
    this.shieldCdEnd = 0;
    this.laserCd = 0.8;
    this.laserFlash = 0;
    this.pendingChoices = [];
    this.bullets.clearPlayer();
    this.bullets.clearEnemy();
    for (const e of this.enemies.list) e.active = false;
    this.powerups.reset();
    this.xpOrbs.reset();
    this.player.reset(this.width, this.height);
    this.syncHud();
    this.overlay.classList.add("hidden");
    this.hideSkillOverlay();
  }

  gameOver() {
    this.state = STATE.GAMEOVER;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem(BEST_KEY, String(this.bestScore));
    }
    for (const e of this.enemies.list) e.active = false;
    this.bullets.clearPlayer();
    this.bullets.clearEnemy();
    this.powerups.reset();
    this.xpOrbs.reset();
    const seconds = Math.floor(this.playTime);
    this.overlayMsg.textContent = `游戏结束 · 得分 ${this.score} · 生存 ${seconds} 秒 · 等级 ${this.level} · 最高分 ${this.bestScore} · 点击或空格重开`;
    this.overlay.classList.remove("hidden");
    this.hideSkillOverlay();
    this.syncHud();
  }

  hideSkillOverlay() {
    if (this.skillOverlay) this.skillOverlay.classList.add("hidden");
  }

  showSkillOverlay() {
    if (!this.skillOverlay || this.skillButtons.length < 3) return;
    this.pendingChoices = rollSkillChoices();
    for (let i = 0; i < 3; i++) {
      const id = this.pendingChoices[i];
      const meta = SKILL_META[id];
      const btn = this.skillButtons[i];
      if (btn && meta) {
        btn.dataset.skill = id;
        btn.textContent = `${meta.title}：${meta.desc}`;
      }
    }
    if (this.skillTitleEl) {
      this.skillTitleEl.textContent = `等级 ${this.level} · 三选一技能（每 ${SKILL_PICK_EVERY_LEVELS} 级一次）`;
    }
    this.skillOverlay.classList.remove("hidden");
  }

  /** @param {string} id */
  pickSkill(id) {
    if (this.state !== STATE.LEVEL_UP) return;
    if (!id || !(id in this.skillLevels)) return;
    this.skillLevels[id] = (this.skillLevels[id] || 0) + 1;
    if (id === SKILLS.REPAIR) {
      this.player.lives = Math.min(5, this.player.lives + 1);
    }
    this.runStats = computeRunStats(this.skillLevels);
    this.state = STATE.PLAYING;
    this.hideSkillOverlay();
    this.spawnAcc += 0.22;
    while (this.state === STATE.PLAYING && this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level += 1;
      if (this.level % SKILL_PICK_EVERY_LEVELS === 0) {
        this.state = STATE.LEVEL_UP;
        this.showSkillOverlay();
        this.syncHud();
        return;
      }
    }
    this.syncHud();
  }

  applyClearScreen() {
    this.bullets.clearEnemy();
    for (const e of this.enemies.list) {
      if (!e.active) continue;
      if (e.type === 3) {
        const cut = Math.max(10, Math.floor(e.maxHp * 0.14));
        e.hp = Math.max(1, e.hp - cut);
        this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 20, 45);
        continue;
      }
      if (e.y > -40 && e.y < this.height + 20) {
        e.active = false;
        this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 10, 200);
      }
    }
    this.particles.burst(this.width / 2, this.height * 0.35, 28, 50);
  }

  syncHud() {
    this.scoreEl.textContent = String(this.score);
    this.livesEl.textContent = String(Math.max(0, this.player.lives));
    if (this.bestEl) this.bestEl.textContent = String(this.bestScore);
    if (this.waveEl) {
      this.waveEl.textContent =
        this.state === STATE.PLAYING || this.state === STATE.LEVEL_UP
          ? String(this.getWaveNumber())
          : "-";
    }
    if (this.levelEl) {
      this.levelEl.textContent =
        this.state === STATE.PLAYING || this.state === STATE.LEVEL_UP
          ? String(this.level)
          : "-";
    }
    if (this.xpFillEl) {
      const need = Math.max(1, xpToNext(this.level));
      const p = Math.max(0, Math.min(1, this.xp / need));
      this.xpFillEl.style.width = `${(p * 100).toFixed(1)}%`;
    }
  }

  addXp(amount) {
    if (amount <= 0) return;
    if (this.state !== STATE.PLAYING && this.state !== STATE.LEVEL_UP) return;
    this.xp += amount;
    if (this.state !== STATE.PLAYING) {
      this.syncHud();
      return;
    }
    while (this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level += 1;
      if (this.level % SKILL_PICK_EVERY_LEVELS === 0) {
        this.state = STATE.LEVEL_UP;
        this.showSkillOverlay();
        this.syncHud();
        return;
      }
    }
    this.syncHud();
  }

  registerKillForDrop(worldX, weight = 1) {
    this.killsSinceDrop += weight;
    while (this.killsSinceDrop >= 8) {
      this.killsSinceDrop -= 8;
      this.powerups.trySpawnAt(worldX);
    }
  }

  tryDamagePlayer() {
    if (this.runStats.shieldLevel > 0 && this.playTime >= this.shieldCdEnd) {
      this.shieldCdEnd = this.playTime + 15;
      this.shake = 0.18;
      this.particles.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 14, 190);
      return false;
    }
    return this.player.hit();
  }

  applyExplosion(cx, cy, radius) {
    const r2 = radius * radius;
    for (const e of this.enemies.list) {
      if (!e.active) continue;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      const d2 = (ex - cx) ** 2 + (ey - cy) ** 2;
      if (d2 > r2) continue;
      e.hp -= 1;
      if (e.hp <= 0) {
        e.active = false;
        if (e.type === 3) {
          this.score += 80 + Math.floor(this.playTime * 0.25);
          this.particles.burst(ex, ey, 28, 300);
        } else {
          this.score += e.type === 2 ? 18 : e.type === 4 ? 14 : e.type === 1 ? 8 : 6;
          this.particles.burst(ex, ey, 10, 280);
          const wave = this.getWaveNumber();
          const base = 2 + Math.floor(this.difficulty * 0.06);
          const xpGain = Math.max(1, Math.floor(base * (1 + 0.04 * wave)));
          this.addXp(xpGain);
        }
      } else {
        this.particles.burst(ex, ey, 6, 40);
      }
    }
  }

  applyLaserDamage() {
    const lv = this.runStats.laserLevel;
    if (lv <= 0) return;
    const x = this.player.x + this.player.w / 2 - 7;
    const y = 0;
    const w = 14;
    const h = this.player.y + this.player.h * 0.55;
    const dmg = 2 + Math.floor(lv / 2);
    for (const e of this.enemies.list) {
      if (!e.active) continue;
      if (!aabb(x, y, w, h, e.x, e.y, e.w, e.h)) continue;
      e.hp -= dmg;
      if (e.hp <= 0) {
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        e.active = false;
        if (e.type === 3) {
          this.score += 180 + Math.floor(this.playTime * 0.6);
          this.particles.burst(cx, cy, 52, 300);
          this.registerKillForDrop(cx, 4);
          this.addXp(50 + this.level * 5);
          this.xpOrbs.burst(cx, cy, 24);
        } else {
          this.score += e.type === 2 ? 28 : e.type === 4 ? 22 : e.type === 1 ? 12 : 10;
          this.particles.burst(cx, cy, 14, 320);
          this.registerKillForDrop(cx);
          const wave = this.getWaveNumber();
          const base = 4 + Math.floor(this.difficulty * 0.08);
          const xpGain = Math.max(1, Math.floor(base * (1 + 0.05 * wave)));
          this.addXp(xpGain);
          this.xpOrbs.burst(cx, cy, Math.max(2, Math.floor(xpGain * 0.45)));
        }
      } else {
        this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 8, 180);
      }
    }
    this.particles.burst(this.player.x + this.player.w / 2, this.player.y * 0.35, 20, 170);
    this.laserFlash = 0.14;
  }

  onEnemyDestroyed(e, cx, cy) {
    e.active = false;
    if (e.type === 3) {
      this.score += 180 + Math.floor(this.playTime * 0.6);
      this.particles.burst(cx, cy, 52, 300);
      this.registerKillForDrop(cx, 4);
      const chunk = 55 + this.level * 6;
      this.addXp(chunk);
      this.xpOrbs.burst(cx, cy, 24);
    } else {
      this.score += e.type === 2 ? 28 : e.type === 4 ? 22 : e.type === 1 ? 12 : 10;
      this.particles.burst(cx, cy, 14, 320);
      this.registerKillForDrop(cx);
      const wave = this.getWaveNumber();
      const base = 4 + Math.floor(this.difficulty * 0.08);
      const xpGain = Math.max(1, Math.floor(base * (1 + 0.05 * wave)));
      this.addXp(xpGain);
      this.xpOrbs.burst(cx, cy, Math.max(2, Math.floor(xpGain * 0.45)));
      if ((this.skillLevels[SKILLS.EXPLODE] || 0) > 0) {
        this.applyExplosion(cx, cy, this.runStats.explodeRadius);
      }
    }
  }

  update(dt, input) {
    this.bg.update(dt);
    this.particles.update(dt);

    if (this.state === STATE.MENU || this.state === STATE.GAMEOVER) {
      if (input.consumeStart()) {
        this.beginPlay();
      }
      return;
    }

    if (this.state === STATE.LEVEL_UP) {
      return;
    }

    if (this.shake > 0) {
      this.shake -= dt * 2.2;
      if (this.shake < 0) this.shake = 0;
    }

    this.playTime += dt;
    this.difficulty = Math.min(28, this.playTime * 0.38);

    this.runStats = computeRunStats(this.skillLevels);

    this.player.update(dt, input, this.width, this.height, this.runStats.moveMul);
    this.player.tryFire(this.bullets, this.runStats.fireRateMul, this.runStats.extraBullets);

    const onShoot = (px, py, vx, vy) => {
      this.bullets.fireEnemy(px, py, vx, vy);
    };
    this.enemies.update(dt, this.width, this.height, onShoot, this.player);
    this.bullets.update(dt, this.width, this.height);

    if (this.runStats.laserLevel > 0) {
      this.laserCd -= dt;
      if (this.laserCd <= 0) {
        this.laserCd = this.runStats.laserInterval;
        this.applyLaserDamage();
      }
    }
    if (this.laserFlash > 0) this.laserFlash -= dt;

    if (this.playTime >= this.nextBossAt && !this.enemies.hasBoss()) {
      if (this.enemies.spawnBoss(this.width, this.height, this.playTime)) {
        this.nextBossAt = this.playTime + 60;
        this.particles.burst(this.width / 2, 60, 36, 280);
      }
    }

    let spawnInterval = Math.max(0.32, 0.95 - this.playTime * 0.016);
    if (this.playTime > 90) spawnInterval *= 0.72;
    this.spawnAcc += dt;
    while (this.spawnAcc >= spawnInterval) {
      this.spawnAcc -= spawnInterval;
      if (!this.enemies.hasBoss()) {
        const wv = this.getWaveNumber();
        const r = Math.random();
        let arche = 0;
        if (r > 0.55 && wv >= 2) arche = 1;
        if (r > 0.78 && wv >= 3) arche = 2;
        if (r > 0.88 && wv >= 2) arche = 4;
        this.enemies.spawnArena(
          arche,
          this.width,
          this.height,
          this.difficulty,
          this.player.x,
          this.player.y,
          this.player.w,
          this.player.h
        );
      }
    }

    const xpPick = this.xpOrbs.update(
      dt,
      this.width,
      this.height,
      this.player,
      this.runStats.magnetMul,
      this.runStats.pickupBaseRadius
    );
    if (xpPick > 0) {
      this.addXp(xpPick);
    }

    this.powerups.update(dt, this.width, this.height, this.player, (kind) => {
      if (kind === 0) {
        this.player.lives = Math.min(5, this.player.lives + 1);
        this.particles.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 18, 130);
      } else {
        this.applyClearScreen();
      }
      this.syncHud();
    });

    this.resolveCollisions();

    if (this.player.lives <= 0) {
      this.gameOver();
    }
    this.syncHud();
  }

  resolveCollisions() {
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.w;
    const ph = this.player.h;

    for (const e of this.enemies.list) {
      if (!e.active) continue;
      for (const b of this.bullets.player) {
        if (!b.active) continue;
        if (!aabb(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) continue;
        b.active = false;
        e.hp -= 1;
        if (e.hp <= 0) {
          const cx = e.x + e.w / 2;
          const cy = e.y + e.h / 2;
          this.onEnemyDestroyed(e, cx, cy);
        } else {
          this.particles.burst(b.x + b.w / 2, b.y + b.h / 2, 6, 180);
        }
      }
    }

    for (const b of this.bullets.enemy) {
      if (!b.active) continue;
      if (!aabb(b.x, b.y, b.w, b.h, px, py, pw, ph)) continue;
      b.active = false;
      if (this.tryDamagePlayer()) {
        this.shake = 0.38;
        this.particles.burst(px + pw / 2, py + ph / 2, 24, 40);
      }
    }

    for (const e of this.enemies.list) {
      if (!e.active) continue;
      if (!aabb(px, py, pw, ph, e.x, e.y, e.w, e.h)) continue;
      if (e.type === 3) {
        if (this.player.invuln <= 0 && this.tryDamagePlayer()) {
          this.shake = 0.38;
          this.particles.burst(px + pw / 2, py + ph / 2, 22, 25);
          e.hp -= 3;
          if (e.hp <= 0) {
            const cx = e.x + e.w / 2;
            const cy = e.y + e.h / 2;
            this.onEnemyDestroyed(e, cx, cy);
          }
        }
        continue;
      }
      e.active = false;
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 16, 330);
      if (this.player.invuln <= 0 && this.tryDamagePlayer()) {
        this.shake = 0.38;
        this.particles.burst(px + pw / 2, py + ph / 2, 28, 25);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    let sx = 0;
    let sy = 0;
    if (this.shake > 0) {
      const mag = this.shake * 14;
      sx = (Math.random() - 0.5) * mag;
      sy = (Math.random() - 0.5) * mag;
    }
    ctx.save();
    ctx.translate(sx, sy);

    this.bg.draw(ctx, w, h);

    if (this.state === STATE.PLAYING || this.state === STATE.GAMEOVER || this.state === STATE.LEVEL_UP) {
      if (this.runStats.laserLevel > 0 && this.laserFlash > 0) {
        const lx = this.player.x + this.player.w / 2;
        ctx.save();
        ctx.globalAlpha = 0.45;
        const grd = ctx.createLinearGradient(lx, 0, lx, this.player.y + this.player.h * 0.5);
        grd.addColorStop(0, "rgba(0,255,200,0)");
        grd.addColorStop(0.5, "rgba(120,255,255,0.9)");
        grd.addColorStop(1, "rgba(0,255,200,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(lx - 10, 0, 20, this.player.y + this.player.h * 0.55);
        ctx.restore();
      }
      this.enemies.draw(ctx);
      this.bullets.draw(ctx);
      this.xpOrbs.draw(ctx);
      this.powerups.draw(ctx);
      this.player.draw(ctx);
    } else {
      this.player.draw(ctx);
    }

    this.particles.draw(ctx);
    ctx.restore();
  }
}
