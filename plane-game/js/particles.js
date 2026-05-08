const MAX = 200;

export class ParticleSystem {
  constructor() {
    this.pool = [];
    for (let i = 0; i < MAX; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        hue: 180,
      });
    }
  }

  burst(x, y, count = 12, hue = 180) {
    let spawned = 0;
    for (const p of this.pool) {
      if (spawned >= count) break;
      if (p.active) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.maxLife = 0.25 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.hue = hue + (Math.random() - 0.5) * 40;
      spawned++;
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.life <= 0) p.active = false;
    }
  }

  draw(ctx) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = `hsl(${p.hue}, 90%, ${55 + t * 30}%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2 + (1 - t) * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
