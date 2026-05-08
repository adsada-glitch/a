/** 技能 id（可叠层，默认策略 A：重复抽取叠加） */
export const SKILLS = {
  DOUBLE: "double",
  RELOAD: "reload",
  SHIELD: "shield",
  MAGNET: "magnet",
  EXPLODE: "explode",
  LASER: "laser",
  REPAIR: "repair",
  THRUST: "thrust",
};

const ALL = [
  SKILLS.DOUBLE,
  SKILLS.RELOAD,
  SKILLS.SHIELD,
  SKILLS.MAGNET,
  SKILLS.EXPLODE,
  SKILLS.LASER,
  SKILLS.REPAIR,
  SKILLS.THRUST,
];

export const SKILL_META = {
  [SKILLS.DOUBLE]: { title: "双重射击", desc: "每次多发射 1 颗子弹" },
  [SKILLS.RELOAD]: { title: "快速装填", desc: "射速提升约 20%" },
  [SKILLS.SHIELD]: { title: "能量护盾", desc: "每 15 秒抵挡一次伤害" },
  [SKILLS.MAGNET]: { title: "磁力吸收", desc: "经验球吸取范围扩大" },
  [SKILLS.EXPLODE]: { title: "爆裂弹头", desc: "击败敌人产生小爆炸" },
  [SKILLS.LASER]: { title: "激光副炮", desc: "每 3 秒一道竖直激光" },
  [SKILLS.REPAIR]: { title: "维修模块", desc: "生命 +1" },
  [SKILLS.THRUST]: { title: "推进强化", desc: "移动速度 +15%" },
};

export function emptySkillLevels() {
  const o = {};
  for (const id of ALL) o[id] = 0;
  return o;
}

/**
 * @param {Record<string, number>} levels
 */
export function computeRunStats(levels) {
  const reload = levels[SKILLS.RELOAD] || 0;
  const thrust = levels[SKILLS.THRUST] || 0;
  const magnet = levels[SKILLS.MAGNET] || 0;
  const explode = levels[SKILLS.EXPLODE] || 0;
  const laser = levels[SKILLS.LASER] || 0;
  const shield = levels[SKILLS.SHIELD] || 0;
  return {
    extraBullets: levels[SKILLS.DOUBLE] || 0,
    /** 冷却倍率，<1 更快 */
    fireRateMul: Math.pow(0.8, reload),
    moveMul: Math.pow(1.15, thrust),
    magnetMul: Math.pow(1.32, magnet),
    explodeRadius: 44 + 20 * explode,
    laserLevel: laser,
    laserInterval: Math.max(1.2, 3 - laser * 0.25),
    shieldLevel: shield,
    pickupBaseRadius: 26,
  };
}

export function randomSkillId() {
  return ALL[Math.floor(Math.random() * ALL.length)];
}

/** 三选一：允许重复 */
export function rollSkillChoices() {
  return [randomSkillId(), randomSkillId(), randomSkillId()];
}
