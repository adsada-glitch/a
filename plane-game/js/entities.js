export function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

const PB_MAX = 80;
const EB_MAX = 120;
const EN_MAX = 48;

export class BulletPool {
  constructor() {
    this.player = [];
    this.enemy = [];
    for (let i = 0; i < PB_MAX; i++) {
      this.player.push({
        active: false,
        x: 0,
        y: 0,
        w: 4,
        h: 14,
        vy: -520,
      });
    }
    for (let i = 0; i < EB_MAX; i++) {
      this.enemy.push({
        active: false,
        x: 0,
        y: 0,
        w: 5,
        h: 10,
        vx: 0,
        vy: 0,
      });
    }
  }

  firePlayerVolley(x, y, count, spread) {
    const n = Math.max(1, Math.min(12, count | 0));
    const half = (n - 1) / 2;
    let fired = 0;
    for (let i = 0; i < n; i++) {
      for (const b of this.player) {
        if (b.active) continue;
        b.active = true;
        b.w = 4;
        b.h = 14;
        b.vy = -520;
        b.x = x - b.w / 2 + (i - half) * spread;
        b.y = y - b.h;
        fired++;
        break;
      }
    }
    return fired;
  }

  fireEnemy(x, y, vx, vy) {
    for (const b of this.enemy) {
      if (b.active) continue;
      b.active = true;
      b.x = x - b.w / 2;
      b.y = y;
      b.vx = vx;
      b.vy = vy;
      return;
    }
  }

  update(dt, width, height) {
    for (const b of this.player) {
      if (!b.active) continue;
      b.y += b.vy * dt;
      if (b.y + b.h < 0 || b.x + b.w < 0 || b.x > width) b.active = false;
    }
    for (const b of this.enemy) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > height + 20 || b.x + b.w < 0 || b.x > width + 10) b.active = false;
    }
  }

  clearEnemy() {
    for (const b of this.enemy) b.active = false;
  }

  clearPlayer() {
    for (const b of this.player) b.active = false;
  }

  draw(ctx) {
    ctx.save();
    for (const b of this.player) {
      if (!b.active) continue;
      const g = ctx.createLinearGradient(b.x, b.y + b.h + 10, b.x, b.y - 4);
      g.addColorStop(0, "rgba(0,240,255,0)");
      g.addColorStop(1, "rgba(127,252,255,0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(b.x - 1, b.y - 8, b.w + 2, b.h + 14);
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#e8ffff";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.shadowBlur = 0;
    for (const b of this.enemy) {
      if (!b.active) continue;
      ctx.shadowColor = "#ff00aa";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#ff66cc";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.restore();
  }
}

/**
 * 0 Chaser 1 Swarm 2 Heavy 4 Turret 3 Boss
 */
export class EnemyPool {
  constructor() {
    this.list = [];
    for (let i = 0; i < EN_MAX; i++) {
      this.list.push({
        active: false,
        type: 0,
        x: 0,
        y: 0,
        w: 32,
        h: 32,
        hp: 1,
        maxHp: 1,
        vx: 0,
        vy: 0,
        speed: 100,
        t: 0,
        shootCd: 0,
        anchorY: 0,
      });
    }
  }

  hasBoss() {
    return this.list.some((e) => e.active && e.type === 3);
  }

  spawnBoss(width, height, playTime) {
    if (this.hasBoss()) return false;
    for (const e of this.list) {
      if (e.active) continue;
      e.active = true;
      e.type = 3;
      e.w = 78;
      e.h = 58;
      e.x = width * 0.5 - e.w / 2;
      e.y = -e.h - 12;
      e.vx = 125;
      e.vy = 78;
      e.t = 0;
      e.hp = 42 + Math.floor(playTime / 60) * 22;
      e.maxHp = e.hp;
      e.shootCd = 1.0;
      e.anchorY = height * 0.14;
      e.speed = 0;
      return true;
    }
    return false;
  }

  /**
   * @param {0|1|2|4} arche 追击/虫群/重甲/炮台
   */
  spawnArena(arche, width, height, difficulty, px, py, pw, ph) {
    const margin = 36;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = Math.random() * width;
      y = -margin;
    } else if (side === 1) {
      x = Math.random() * width;
      y = height + margin;
    } else if (side === 2) {
      x = -margin;
      y = Math.random() * height;
    } else {
      x = width + margin;
      y = Math.random() * height;
    }

    for (const e of this.list) {
      if (e.active) continue;
      e.active = true;
      e.type = arche;
      e.x = x;
      e.y = y;
      e.t = 0;
      const pcx = px + pw / 2;
      const pcy = py + ph / 2;

      if (arche === 4) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 130 + Math.random() * 90;
        e.x = pcx + Math.cos(ang) * dist - 20;
        e.y = pcy + Math.sin(ang) * dist - 18;
        e.x = Math.max(8, Math.min(width - 48, e.x));
        e.y = Math.max(40, Math.min(height * 0.55, e.y));
        e.w = 36;
        e.h = 30;
        e.hp = 2 + Math.floor(difficulty * 0.12);
        e.maxHp = e.hp;
        e.speed = 55 + Math.random() * 30;
        e.shootCd = 0.6 + Math.random() * 0.5;
        e.vx = 0;
        e.vy = 0;
        return;
      }

      if (arche === 1) {
        e.w = 22;
        e.h = 22;
        e.hp = 1;
        e.speed = 175 + difficulty * 10 + Math.random() * 40;
      } else if (arche === 2) {
        e.w = 44;
        e.h = 44;
        e.hp = 5 + Math.floor(difficulty * 0.45);
        e.speed = 65 + difficulty * 3;
      } else {
        e.w = 30;
        e.h = 30;
        e.hp = 1 + Math.floor(difficulty * 0.08);
        e.speed = 105 + difficulty * 7;
      }
      e.maxHp = e.hp;
      const ecx = e.x + e.w / 2;
      const ecy = e.y + e.h / 2;
      const dx = pcx - ecx;
      const dy = pcy - ecy;
      const len = Math.hypot(dx, dy) || 1;
      e.vx = (dx / len) * e.speed;
      e.vy = (dy / len) * e.speed;
      e.shootCd = 0;
      return;
    }
  }

  update(dt, width, height, onShoot, player) {
    const pcx = player.x + player.w / 2;
    const pcy = player.y + player.h / 2;

    for (const e of this.list) {
      if (!e.active) continue;
      e.t += dt;

      if (e.type === 3) {
        if (e.y < e.anchorY) {
          e.y += e.vy * dt;
        } else {
          e.y = e.anchorY;
        }
        e.x += e.vx * dt;
        if (e.x <= 10 || e.x + e.w >= width - 10) {
          e.vx *= -1;
          e.x = Math.max(10, Math.min(width - e.w - 10, e.x));
        }
        e.shootCd -= dt;
        const ratio = e.hp / (e.maxHp || 1);
        const phase = ratio > 0.66 ? 0 : ratio > 0.33 ? 1 : 2;
        const baseCd = phase === 2 ? 0.48 : phase === 1 ? 0.62 : 0.78;
        if (e.shootCd <= 0) {
          e.shootCd = baseCd;
          const cx = e.x + e.w / 2;
          const by = e.y + e.h;
          if (phase === 0) {
            for (let i = -2; i <= 2; i++) {
              onShoot(cx + i * 10, by, i * 52, 228 + Math.random() * 45);
            }
          } else if (phase === 1) {
            const n = 8;
            for (let i = 0; i < n; i++) {
              const a = (Math.PI * 0.35 * i) / n + Math.PI * 0.32;
              const sp = 210 + Math.random() * 40;
              onShoot(cx, by, Math.cos(a) * sp, Math.sin(a) * sp);
            }
          } else {
            for (let i = -3; i <= 3; i++) {
              onShoot(cx + i * 8, by, i * 42, 260 + Math.random() * 50);
            }
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI * 2 * i) / 6 + e.t;
              const sp = 180;
              onShoot(cx, by + 6, Math.cos(a) * sp, Math.sin(a) * sp + 40);
            }
          }
        }
        if (e.y > height + 80) e.active = false;
        continue;
      }

      if (e.type === 4) {
        const ecx = e.x + e.w / 2;
        const ecy = e.y + e.h / 2;
        const dx = pcx - ecx;
        const dy = pcy - ecy;
        const dist = Math.hypot(dx, dy) || 1;
        const desiredMin = 120;
        const desiredMax = 220;
        let ax = 0;
        let ay = 0;
        if (dist < desiredMin) {
          ax = -dx / dist;
          ay = -dy / dist;
        } else if (dist > desiredMax) {
          ax = dx / dist;
          ay = dy / dist;
        }
        const tx = -dy / dist;
        const ty = dx / dist;
        e.x += (ax * 0.55 + tx * 0.85) * e.speed * dt;
        e.y += (ay * 0.55 + ty * 0.85) * e.speed * dt;
        e.x = Math.max(4, Math.min(width - e.w - 4, e.x));
        e.y = Math.max(36, Math.min(height * 0.58 - e.h, e.y));

        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = 0.85 + Math.random() * 0.45;
          const ux = dx / dist;
          const uy = dy / dist;
          onShoot(ecx, ecy + e.h * 0.35, ux * 260, uy * 260);
        }
        continue;
      }

      const ecx = e.x + e.w / 2;
      const ecy = e.y + e.h / 2;
      const dx = pcx - ecx;
      const dy = pcy - ecy;
      const len = Math.hypot(dx, dy) || 1;
      const sp = e.speed;
      e.vx = (dx / len) * sp;
      e.vy = (dy / len) * sp;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.x < -80 || e.x > width + 80 || e.y < -80 || e.y > height + 80) {
        e.active = false;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const e of this.list) {
      if (!e.active) continue;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h + 8, e.w * 0.45, Math.min(10, e.h * 0.22), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.shadowColor = "#ff00aa";
      ctx.shadowBlur = e.type === 3 ? 22 : 12;
      ctx.strokeStyle = "rgba(255,0,170,0.9)";
      ctx.fillStyle = e.type === 3 ? "rgba(60,10,55,0.92)" : "rgba(40,8,40,0.85)";
      ctx.lineWidth = e.type === 3 ? 3 : 2;
      ctx.beginPath();
      if (e.type === 4) {
        ctx.rect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
      } else if (e.type === 1) {
        ctx.moveTo(e.x + e.w / 2, e.y + e.h);
        ctx.lineTo(e.x, e.y);
        ctx.lineTo(e.x + e.w, e.y);
        ctx.closePath();
      } else if (e.type === 2) {
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        ctx.moveTo(cx, e.y);
        ctx.lineTo(e.x + e.w, cy);
        ctx.lineTo(cx, e.y + e.h);
        ctx.lineTo(e.x, cy);
        ctx.closePath();
      } else if (e.type === 3) {
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        const s = Math.min(e.w, e.h) * 0.48;
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s, cy);
        ctx.closePath();
      } else {
        ctx.moveTo(e.x + e.w / 2, e.y + e.h);
        ctx.lineTo(e.x, e.y);
        ctx.lineTo(e.x + e.w, e.y);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();

      if (e.type === 3 && e.maxHp > 0) {
        const ratio = Math.max(0, e.hp / e.maxHp);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(e.x, e.y - 10, e.w, 5);
        ctx.fillStyle = ratio > 0.35 ? "#00f0ff" : "#ffb020";
        ctx.fillRect(e.x + 1, e.y - 9, (e.w - 2) * ratio, 3);
      }
    }
    ctx.restore();
  }
}

export class Player {
  constructor() {
    this.w = 36;
    this.h = 44;
    this.x = 0;
    this.y = 0;
    this.speed = 340;
    this.lives = 3;
    this.invuln = 0;
    this.fireCd = 0;
  }

  reset(width, height) {
    this.lives = 3;
    this.invuln = 0;
    this.x = width / 2 - this.w / 2;
    this.y = height * 0.72;
    this.fireCd = 0;
  }

  update(dt, input, width, height, moveMul) {
    const mul = moveMul || 1;
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    if (input.touchActive) {
      const tx = input.touchX - this.w / 2;
      const ty = input.touchY - this.h / 2 - 50;
      this.x += (tx - this.x) * Math.min(1, 14 * dt);
      this.y += (ty - this.y) * Math.min(1, 14 * dt);
    } else {
      const len = Math.hypot(mx, my) || 1;
      this.x += (mx / len) * this.speed * mul * dt;
      this.y += (my / len) * this.speed * mul * dt;
    }
    const margin = 8;
    this.x = Math.max(margin, Math.min(width - this.w - margin, this.x));
    this.y = Math.max(margin, Math.min(height - this.h - margin, this.y));

    if (this.invuln > 0) this.invuln -= dt;

    this.fireCd -= dt;
  }

  tryFire(bullets, fireRateMul, extraBullets) {
    const interval = 0.12 * (fireRateMul || 1);
    if (this.fireCd > 0) return;
    this.fireCd = interval;
    const cx = this.x + this.w / 2;
    const n = 1 + (extraBullets | 0);
    bullets.firePlayerVolley(cx, this.y, n, 8);
  }

  hit() {
    if (this.invuln > 0) return false;
    this.lives -= 1;
    this.invuln = 1.0;
    return true;
  }

  draw(ctx) {
    const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;
    if (blink) {
      ctx.globalAlpha = 0.35;
    }
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.x + this.w / 2, this.y + this.h + 8, this.w * 0.45, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = blink ? 0.35 : 1;

    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "#00f0ff";
    ctx.fillStyle = "rgba(0,40,50,0.9)";
    ctx.lineWidth = 2;
    const x = this.x;
    const y = this.y;
    const w = this.w;
    const h = this.h;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h * 0.72);
    ctx.lineTo(x + w * 0.72, y + h);
    ctx.lineTo(x + w * 0.28, y + h);
    ctx.lineTo(x, y + h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,240,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.25);
    ctx.lineTo(x + w * 0.62, y + h * 0.55);
    ctx.lineTo(x + w * 0.38, y + h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
