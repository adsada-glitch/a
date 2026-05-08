/** 升级所需经验曲线 */
export function xpToNext(level) {
  return Math.max(6, Math.floor(8 * Math.pow(1.35, level)));
}
