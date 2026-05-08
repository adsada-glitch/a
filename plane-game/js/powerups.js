import { aabb } from "./entities.js";

/**
 * Single-slot pickup: kind 0 = heal (+1 life, max 5), kind 1 = clear screen.
 */
export class PowerupPool {
  constructor() {
    this.p = {
      active: false,
      kind: 0,
      x: 0,
      y: 0,
      w: 28,
      h: 28,
      vy: 110,
    };
  }

  reset() {
    this.p.active = false;
  }

  /** @returns {boolean} whether spawned */
  trySpawnAt(x) {
    if (this.p.active) return false;
    const heal = Math.random() < 0.6;
    this.p.active = true;
    this.p.kind = heal ? 0 : 1;
    this.p.x = x - this.p.w / 2;
    this.p.y = -12;
    this.p.vy = 100 + Math.random() * 35;
    return true;
  }

  update(dt, width, height, player, onPickup) {
    const p = this.p;
    if (!p.active) return;
    p.y += p.vy * dt;
    p.x += Math.sin(p.y * 0.04) * 28 * dt;
    if (p.y > height + 40 || p.x + p.w < -20 || p.x > width + 20) {
      p.active = false;
      return;
    }
    if (
      aabb(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)
    ) {
      p.active = false;
      onPickup(p.kind);
    }
  }

  draw(ctx) {
    const p = this.p;
    if (!p.active) return;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h + 6, p.w * 0.42, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (p.kind === 0) {
      ctx.shadowColor = "#4cff7a";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#4cff7a";
      ctx.fillStyle = "rgba(20,50,30,0.85)";
    } else {
      ctx.shadowColor = "#ffd040";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#ffd040";
      ctx.fillStyle = "rgba(50,40,10,0.85)";
    }
    ctx.lineWidth = 2;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, p.w * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.kind === 0 ? "#b8ffc8" : "#ffe8a0";
    ctx.font = "bold 14px ui-monospace, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.kind === 0 ? "+" : "!", cx, cy + 1);
    ctx.restore();
  }
}
