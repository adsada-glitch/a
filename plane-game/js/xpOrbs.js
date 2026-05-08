const MAX = 100;

export class XpOrbPool {
  constructor() {
    this.orbs = [];
    for (let i = 0; i < MAX; i++) {
      this.orbs.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        value: 1,
      });
    }
  }

  reset() {
    for (const o of this.orbs) o.active = false;
  }

  burst(x, y, totalValue, spread = 28) {
    let left = totalValue;
    let spawned = 0;
    const per = Math.max(1, Math.ceil(totalValue / 4));
    for (const o of this.orbs) {
      if (!o.active && left > 0) {
        o.active = true;
        o.x = x + (Math.random() - 0.5) * spread;
        o.y = y + (Math.random() - 0.5) * spread;
        o.vx = (Math.random() - 0.5) * 40;
        o.vy = (Math.random() - 0.5) * 40;
        const chunk = Math.min(per, left);
        o.value = chunk;
        left -= chunk;
        spawned++;
        if (spawned > 10) break;
      }
    }
    if (left > 0) {
      for (const o of this.orbs) {
        if (o.active) continue;
        o.active = true;
        o.x = x;
        o.y = y;
        o.vx = 0;
        o.vy = 0;
        o.value = left;
        break;
      }
    }
  }

  /**
   * @returns {number} xp picked this frame
   */
  update(dt, width, height, player, magnetMul, pickupBaseRadius) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const pullR = pickupBaseRadius * magnetMul;
    let gained = 0;
    for (const o of this.orbs) {
      if (!o.active) continue;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vy += 20 * dt;
      const dx = px - o.x;
      const dy = py - o.y;
      const d = Math.hypot(dx, dy);
      if (d < pullR + 10) {
        const pull = Math.min(1, (pullR + 80 - d) / 80) * 420 * dt;
        if (d > 0.001) {
          o.x += (dx / d) * pull;
          o.y += (dy / d) * pull;
        }
      }
      if (d < 18) {
        gained += o.value;
        o.active = false;
        continue;
      }
      if (o.y > height + 40 || o.x < -30 || o.x > width + 30) {
        o.active = false;
      }
    }
    return gained;
  }

  draw(ctx) {
    ctx.save();
    for (const o of this.orbs) {
      if (!o.active) continue;
      ctx.shadowColor = "#7ad7ff";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(180,230,255,0.95)";
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4 + Math.min(3, o.value * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
