/**
 * 经济与调料数值集中配置：价格、库存、消耗、产量、时间成本都在这里改。
 * 游戏逻辑只读这里的常数，不要在 engine / 组件里再散落魔法数字。
 */

/** 调料配方预设：按菜的类型给不同的消耗，做菜时按菜谱取用 */
export const SEASONING_PRESETS = {
  /** 清炒：主要耗油盐 */
  stir: { oil: 1, salt: 1 },
  /** 汤：盐为主，少量油 */
  soup: { salt: 1, oil: 1 },
  /** 炖菜：油盐酱都要 */
  stew: { oil: 1, salt: 1, sauce: 1 },
  /** 糖醋：糖和醋是大头 */
  sweetSour: { sugar: 2, vinegar: 2, salt: 1 },
  /** 腌制 / 重口：盐多 */
  salted: { salt: 3, sauce: 1 },
  /** 烘焙：糖油 */
  bake: { sugar: 1, oil: 1 },
  /** 烧烤：油盐 */
  roast: { oil: 1, salt: 2 },
  /** 饮品：只按需耗糖 / 蜂蜜 / 水，不耗油盐 */
  drinkSweet: { water: 1, sugar: 1 },
  drinkPlain: { water: 1 },
  drinkHoney: { water: 1, honey: 1 },
} as const;

export type SeasoningPreset = keyof typeof SEASONING_PRESETS;

export const ECON = {
  /** 开局零钱 */
  startCoins: 95,
  /** 调料 / 日用品单价（文） */
  prices: {
    oil: 10,
    salt: 3,
    sugar: 5,
    vinegar: 6,
    honey: 12,
    lemon: 7,
    water: 1,
    rice: 5,
    flour: 6,
    sauce: 6,
    tea: 8,
    medicine: 28,
    pork: 18,
    tofu: 6,
    egg: 6,
    feed: 5,
    fertilizer: 12,
    pesticide: 15,
  } as Record<string, number>,
  /** 小卖部每日基础库存（会加 0~1 的随机浮动） */
  stock: {
    oil: 4, salt: 10, sugar: 5, vinegar: 5, honey: 3, lemon: 4, water: 9,
    rice: 6, flour: 4, sauce: 4, tea: 4, medicine: 2,
    egg: 4, pork: 2, tofu: 4, feed: 6, fertilizer: 3, pesticide: 3,
  } as Record<string, number>,
  /** 一次买卖最多几份（界面上的数量上限） */
  batchMax: 5,
  /** 饮品制作：耗时与体力 */
  brew: { minutes: 12, energy: 2 },
  /** 采野菜：低收益的保底活路 */
  forage: { minutes: 20, energy: 5, yield: 1 },
  /** 帮阿婆干活：时间换钱，下策但不会卡死 */
  help: { minutes: 60, energy: 8, coins: [6, 9] as [number, number], saltChance: 0.35 },
  /** 卖东西的今日流水上限提示（仅展示用） */
  dailySalesSoftCap: 200,
  /** 每天新鲜度衰减 */
  spoilPerDay: 10,
  /** 饮品喝太多后的收益递减阈值 */
  drinksSoftLimit: 3,
};

/** 调料罐展示顺序与名字 */
export const SEASONING_IDS = ['oil', 'salt', 'sugar', 'vinegar', 'honey', 'water'] as const;
export type SeasoningId = (typeof SEASONING_IDS)[number];
