/**
 * Parallax starfield + scrolling grid (logical CSS pixels).
 */
export class Background {
  constructor() {
    this.gridOffset = 0;
    this.starsNear = [];
    this.starsFar = [];
  }

  resize(width, height) {
    const makeStars = (count, spread) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * (spread ? 1.4 : 0.8),
          a: 0.25 + Math.random() * 0.75,
        });
      }
      return arr;
    };
    const area = width * height;
    const nearCount = Math.min(140, Math.floor(area / 9000));
    const farCount = Math.min(90, Math.floor(area / 14000));
    this.starsNear = makeStars(nearCount, true);
    this.starsFar = makeStars(farCount, false);
    this._w = width;
    this._h = height;
  }

  update(dt) {
    this.gridOffset = (this.gridOffset + 40 * dt) % 48;
    const w = this._w;
    const h = this._h;
    for (const s of this.starsNear) {
      s.y += 120 * dt;
      if (s.y > h + 2) {
        s.y = -2;
        s.x = Math.random() * w;
      }
    }
    for (const s of this.starsFar) {
      s.y += 45 * dt;
      if (s.y > h + 2) {
        s.y = -2;
        s.x = Math.random() * w;
      }
    }
  }

  draw(ctx, width, height) {
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, width, height);

    for (const s of this.starsFar) {
      ctx.globalAlpha = s.a * 0.6;
      ctx.fillStyle = "#a8c8ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(0, 240, 255, 0.06)";
    ctx.lineWidth = 1;
    const step = 48;
    for (let x = (this.gridOffset % step) - step; x < width + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = this.gridOffset; y < height + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (const s of this.starsNear) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
