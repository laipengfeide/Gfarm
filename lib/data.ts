import type {
  CropDef, CropId, ItemDef, NpcDef, NpcId, Recipe, SceneDef, SceneId, GameState, Weather, PlotState,
} from './types';
import { ECON, SEASONING_IDS, SEASONING_PRESETS } from './economy';

/* ---------------- 作物 ---------------- */
export const CROPS: Record<CropId, CropDef> = {
  tomato: {
    id: 'tomato', name: '番茄', icon: '🍅', seedId: 'seed_tomato', harvestLabel: '采摘番茄',
    growDays: 3, seedPrice: 8, produce: [{ id: 'tomato', qty: 2 }],
    color: '#cf4b3c', leaf: '#5f8a4a', desc: '阳光晒足的小番茄，酸甜多汁。',
  },
  potato: {
    id: 'potato', name: '土豆', icon: '🥔', seedId: 'seed_potato', harvestLabel: '挖土豆',
    growDays: 3, seedPrice: 6, produce: [{ id: 'potato', qty: 2 }],
    color: '#c8a06a', leaf: '#6a8f4f', desc: '埋在土里的踏实滋味，炖肉最香。',
  },
  cabbage: {
    id: 'cabbage', name: '白菜', icon: '🥬', seedId: 'seed_cabbage', harvestLabel: '收白菜',
    growDays: 4, seedPrice: 9, produce: [{ id: 'cabbage', qty: 1 }],
    color: '#a7c47e', leaf: '#7fa05a', desc: '一层层包得紧实，煮汤清甜。',
  },
  carrot: {
    id: 'carrot', name: '胡萝卜', icon: '🥕', seedId: 'seed_carrot', harvestLabel: '拔胡萝卜',
    growDays: 2, seedPrice: 7, produce: [{ id: 'carrot', qty: 2 }],
    color: '#e07a3c', leaf: '#6c9750', desc: '长得快，脆生生的，兔子也爱吃。',
  },
  corn: {
    id: 'corn', name: '玉米', icon: '🌽', seedId: 'seed_corn', harvestLabel: '掰玉米',
    growDays: 5, seedPrice: 12, produce: [{ id: 'corn', qty: 2 }],
    color: '#e8c15a', leaf: '#7c9a54', desc: '要耐心等它拔节、抽穗、灌浆。',
  },
  pumpkin: {
    id: 'pumpkin', name: '南瓜', icon: '🎃', seedId: 'seed_pumpkin', harvestLabel: '抱南瓜',
    growDays: 5, seedPrice: 15, produce: [{ id: 'pumpkin', qty: 1 }],
    color: '#e0833e', leaf: '#6f8f52', desc: '藤蔓爬满架子，秋天结出大南瓜。',
  },
  rapeseed: {
    id: 'rapeseed', name: '油菜', icon: '🌼', seedId: 'seed_rapeseed', harvestLabel: '割油菜',
    growDays: 3, seedPrice: 5,
    produce: [{ id: 'rapeseed', qty: 2 }, { id: 'rapeseed_oil', qty: 1 }],
    color: '#e8c34a', leaf: '#7f9863', desc: '开花时一片金黄，割下来能榨菜籽油。',
  },
};

export const CROP_ORDER: CropId[] = ['tomato', 'potato', 'cabbage', 'carrot', 'corn', 'pumpkin', 'rapeseed'];

export function cropBySeed(seedId: string): CropDef | undefined {
  return Object.values(CROPS).find((c) => c.seedId === seedId);
}

/* ---------------- 物品 ---------------- */
const manualItems: ItemDef[] = [
  { id: 'tomato', name: '番茄', icon: '🍅', kind: 'produce', sell: 6, desc: '菜园里摘的，还带着太阳的温度。' },
  { id: 'potato', name: '土豆', icon: '🥔', kind: 'produce', sell: 5, desc: '表皮带着泥，是土地的味道。' },
  { id: 'cabbage', name: '白菜', icon: '🥬', kind: 'produce', sell: 8, desc: '叶子脆嫩，一颗能煮一大锅。' },
  { id: 'carrot', name: '胡萝卜', icon: '🥕', kind: 'produce', sell: 5, desc: '刚拔出来，泥土还湿着。' },
  { id: 'corn', name: '玉米', icon: '🌽', kind: 'produce', sell: 10, desc: '颗粒饱满，甜得能生吃。' },
  { id: 'pumpkin', name: '南瓜', icon: '🎃', kind: 'produce', sell: 18, desc: '沉甸甸的，抱起来要用点力气。' },
  { id: 'rapeseed', name: '油菜', icon: '🌿', kind: 'produce', sell: 4, desc: '鲜嫩的小油菜，清炒最好。' },
  { id: 'rapeseed_oil', name: '菜籽油', icon: '🫙', kind: 'material', sell: 12, desc: '新榨的油，有一股淡淡的青香。' },
  { id: 'egg', name: '鸡蛋', icon: '🥚', kind: 'material', sell: 4, buy: 6, desc: '鸡窝里刚捡的，还温着。' },
  { id: 'pork', name: '猪肉', icon: '🥩', kind: 'material', sell: 12, buy: 18, desc: '小卖部唯一会进的荤菜。' },
  { id: 'tofu', name: '豆腐', icon: '⬜', kind: 'material', sell: 4, buy: 6, desc: '阿婆每天清早做的，嫩得晃。' },
  { id: 'rice', name: '大米', icon: '🍚', kind: 'material', sell: 3, buy: ECON.prices.rice, desc: '隔壁村种的稻米，颗粒干净。' },
  { id: 'flour', name: '面粉', icon: '🌾', kind: 'material', sell: 3, buy: ECON.prices.flour, desc: '磨得细细的，做饼做派都行。' },
  { id: 'oil', name: '食用油', icon: '🧴', kind: 'material', sell: 6, buy: ECON.prices.oil, desc: '灶台常备，炒菜离不了。' },
  { id: 'feed', name: '谷糠饲料', icon: '🌾', kind: 'tool', sell: 2, buy: ECON.prices.feed, desc: '鸡和猪的口粮。' },
  { id: 'fertilizer', name: '肥料', icon: '🪣', kind: 'tool', sell: 5, buy: ECON.prices.fertilizer, desc: '让作物长得更快一些。' },
  { id: 'pesticide', name: '农药', icon: '🧪', kind: 'tool', sell: 6, buy: ECON.prices.pesticide, desc: '对付虫害，喷完要等一天。' },
  { id: 'fish_crucian', name: '鲫鱼', icon: '🐟', kind: 'fish', sell: 16, desc: '巴掌大，熬汤最鲜。' },
  { id: 'fish_grass', name: '草鱼', icon: '🐠', kind: 'fish', sell: 24, desc: '在池塘深处游，力气不小。' },
  { id: 'fish_carp', name: '鲤鱼', icon: '🎏', kind: 'fish', sell: 32, desc: '老周说，钓到它是运气好。' },
  { id: 'salt', name: '盐', icon: '🧂', kind: 'material', sell: 1, buy: ECON.prices.salt, desc: '灶台常备。没有盐，什么菜都寡淡。' },
  { id: 'sauce', name: '酱油', icon: '🥢', kind: 'material', sell: 2, buy: ECON.prices.sauce, desc: '小卖部打的散装酱油，颜色很深。' },
  { id: 'vinegar', name: '醋', icon: '🍶', kind: 'material', sell: 2, buy: ECON.prices.vinegar, desc: '阿婆酿的米醋，酸得很温柔。' },
  { id: 'sugar', name: '白糖', icon: '🍬', kind: 'material', sell: 2, buy: ECON.prices.sugar, desc: '糖罐子见底得最快，做糖醋菜和饮品都要它。' },
  { id: 'honey', name: '蜂蜜', icon: '🍯', kind: 'material', sell: 5, buy: ECON.prices.honey, desc: '后山养蜂人捎来的，兑水喝很润。' },
  { id: 'lemon', name: '柠檬', icon: '🍋', kind: 'material', sell: 3, buy: ECON.prices.lemon, desc: '外村拉来的，切开一股清酸。' },
  { id: 'water', name: '清水', icon: '💧', kind: 'material', sell: 1, buy: ECON.prices.water, desc: '井里打的水，泡茶煮汤都用得上。' },
  { id: 'wildgreens', name: '野菜', icon: '🌿', kind: 'produce', sell: 3, desc: '田埂上挑的，卖不了几个钱，但饿不着。' },
  { id: 'tea', name: '茶叶', icon: '🍵', kind: 'material', sell: 3, buy: ECON.prices.tea, desc: '泡一壶，能让心慢下来。' },
  { id: 'medicine', name: '感冒药', icon: '💊', kind: 'tool', sell: 10, buy: ECON.prices.medicine, desc: '村里卫生所的方子，一天最多吃两次。' },
];

export const ITEMS: Record<string, ItemDef> = {};
manualItems.forEach((it) => (ITEMS[it.id] = it));
Object.values(CROPS).forEach((crop) => {
  ITEMS[crop.seedId] = {
    id: crop.seedId, name: `${crop.name}种子`, icon: '🌱', kind: 'seed',
    sell: 1, buy: crop.seedPrice, desc: `${crop.name}的种子。${crop.desc}`,
  };
  crop.produce.forEach((p) => {
    if (ITEMS[p.id] && !ITEMS[p.id].buy) ITEMS[p.id].buy = undefined;
  });
});

export const COOKABLE_IDS = Object.keys(ITEMS).filter((id) => {
  const k = ITEMS[id].kind;
  if ((SEASONING_IDS as readonly string[]).includes(id)) return false;
  return k === 'produce' || k === 'material' || k === 'fish';
});

/* ---------------- 菜谱（正餐 + 饮品共用一套结构） ---------------- */
export const RECIPES: Recipe[] = [
  { id: 'tomato_egg', name: '番茄炒蛋', icon: '🍳', need: ['tomato', 'egg'], food: 30, mood: 6, price: 30, desc: '第一顿自己做的饭，先把番茄炒出汁。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.stir } },
  { id: 'potato_pork', name: '土豆炖肉', icon: '🍲', need: ['potato', 'pork'], food: 42, mood: 9, price: 46, desc: '小火慢炖，等香气从锅盖缝里钻出来。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.stew } },
  { id: 'cabbage_tofu', name: '白菜豆腐汤', icon: '🥣', need: ['cabbage', 'tofu'], food: 30, mood: 7, price: 32, desc: '清清爽爽的一碗，雨天喝最合适。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.soup } },
  { id: 'garden_salad', name: '田园沙拉', icon: '🥗', need: ['tomato', 'cabbage', 'carrot'], food: 26, mood: 13, price: 36, desc: '把园子里的颜色都拌进盘子里。', kind: 'dish', seasoning: { salt: 1, vinegar: 1, sugar: 1 } },
  { id: 'corn_soup', name: '玉米浓汤', icon: '🍜', need: ['corn', 'flour'], food: 32, mood: 9, price: 34, desc: '玉米的甜和面粉的稠，暖乎乎的。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.soup } },
  { id: 'pumpkin_pie', name: '南瓜派', icon: '🥧', need: ['pumpkin', 'flour'], food: 36, mood: 15, price: 48, desc: '烤到边缘焦香，切开时冒热气。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.bake } },
  { id: 'fish_soup', name: '鲫鱼豆腐汤', icon: '🐟', need: ['fish_crucian', 'tofu'], food: 36, mood: 11, price: 44, desc: '奶白色的汤，撒一把小葱。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.soup } },
  { id: 'rapeseed_stir', name: '清炒油菜', icon: '🥬', need: ['rapeseed', 'rapeseed_oil'], food: 26, mood: 8, price: 28, desc: '大火快炒，留住那点脆。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.stir } },
  { id: 'egg_rice', name: '蛋炒饭', icon: '🍚', need: ['egg', 'rice'], food: 34, mood: 9, price: 34, desc: '隔夜饭也能炒得粒粒分明。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.stir } },
  { id: 'roast_fish', name: '香烤草鱼', icon: '🍢', need: ['fish_grass', 'oil'], food: 38, mood: 12, price: 52, desc: '抹上油和盐，烤到表皮微焦。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.roast } },
  { id: 'tomato_potato_soup', name: '番茄土豆汤', icon: '🍅', need: ['tomato', 'potato'], food: 28, mood: 7, price: 30, desc: '一锅红红的，很下饭。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.soup } },
  { id: 'farm_stew', name: '农家大炖菜', icon: '🍲', need: ['potato', 'cabbage', 'carrot'], food: 40, mood: 12, price: 44, desc: '有什么放什么，咕嘟咕嘟炖一锅。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.stew } },
  { id: 'braised_carp', name: '红烧鲤鱼', icon: '🎏', need: ['fish_carp', 'oil'], food: 46, mood: 14, price: 62, desc: '值得好好对待的一条鱼。', kind: 'dish', seasoning: { oil: 1, salt: 2, sauce: 1, sugar: 1 } },
  { id: 'egg_drop_soup', name: '蛋花汤', icon: '🥚', need: ['egg', 'cabbage'], food: 24, mood: 5, price: 24, desc: '把蛋液细细地淋进滚水里。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.soup } },
  { id: 'pumpkin_soup', name: '南瓜浓汤', icon: '🎃', need: ['pumpkin', 'rice'], food: 38, mood: 10, price: 42, desc: '南瓜和米一起熬，甜得很温柔。', kind: 'dish', seasoning: { ...SEASONING_PRESETS.soup } },
  { id: 'wildgreens_soup', name: '野菜汤', icon: '🌿', need: ['wildgreens'], food: 22, mood: 6, price: 14, desc: '田埂上挑的野菜，撒点盐就是一锅热汤。', kind: 'dish', seasoning: { salt: 1, water: 1 } },

  /* ---- 饮品：饱腹小、心情高，不能顶替正餐 ---- */
  { id: 'green_tea', name: '绿茶', icon: '🍵', need: ['tea'], food: 5, mood: 16, price: 12, desc: '一撮茶叶，一壶热水，看它慢慢舒展开。', kind: 'drink', seasoning: { ...SEASONING_PRESETS.drinkPlain } },
  { id: 'lemonade', name: '柠檬水', icon: '🍋', need: ['lemon'], food: 7, mood: 18, price: 16, desc: '柠檬切片，加一勺糖，酸里带甜。', kind: 'drink', seasoning: { ...SEASONING_PRESETS.drinkSweet } },
  { id: 'honey_water', name: '蜂蜜水', icon: '🍯', need: ['honey'], food: 6, mood: 15, price: 14, desc: '温水化开蜂蜜，嗓子一下就润了。', kind: 'drink', seasoning: { ...SEASONING_PRESETS.drinkHoney } },
];

/** 饮品单独取用（同一套 Recipe 结构，kind 区分） */
export const DRINKS: Recipe[] = RECIPES.filter((r) => r.kind === 'drink');
export const DISHES: Recipe[] = RECIPES.filter((r) => r.kind !== 'drink');

export const DARK_DISH: Recipe = {
  id: 'dark', name: '黑暗料理', icon: '🫕', need: [], food: 12, mood: -5, price: 5,
  desc: '锅里的东西糊成一团……下次记得按菜谱来。',
};

export function matchRecipe(selected: string[]): { recipe: Recipe; exact: boolean } | null {
  const sorted = [...selected].sort();
  // 先找完全匹配
  for (const r of DISHES) {
    const need = [...r.need].sort();
    if (need.length === sorted.length && need.every((v, i) => v === sorted[i])) return { recipe: r, exact: true };
  }
  // 再找包含关系（多放了食材）
  for (const r of DISHES) {
    if (r.need.every((id) => sorted.includes(id))) return { recipe: r, exact: false };
  }
  return null;
}

/* ---------------- NPC ---------------- */
export const NPCS: Record<NpcId, NpcDef> = {
  grandma: {
    id: 'grandma', name: '阿婆', title: '村口的邻居', scene: 'village', img: 'assets/npc_grandma.jpg',
    intro: '阿婆在村口住了大半辈子，菜园和鸡舍都打理得妥帖。',
    lines: [
      '来啦？灶上刚蒸了红薯，拿一个垫垫肚子。',
      '你这菜园，草要趁小拔，等它结了籽就费劲咯。',
      '下雨天别急着下地，土太湿，踩实了反而不好。',
      '鸡舍要常扫，鸡舒服了，蛋才下得勤。',
      '一个人住也要好好吃饭，别总凑合。',
      '海边的风夜里凉，睡觉记得关窗。',
      '村口那棵老槐树，我小时候就在了。',
    ],
  },
  girl: {
    id: 'girl', name: '小满', title: '爱打牌的姑娘', scene: 'village', img: 'assets/npc_girl.jpg',
    intro: '小满嗓门大、牌瘾更大，输赢都笑得很响。',
    lines: [
      '来得正好，三缺一！哦不对，二缺一。',
      '你菜园里的番茄红了没？我拿牌技跟你换。',
      '我今天手气差，已经输了三十文了。',
      '钓鱼有什么意思，坐一下午，还不如打两把牌。',
      '听说你把小院收拾得挺像样？改天去串门。',
      '输了不许赖账啊，我可记着呢。',
      '傍晚的村口最好看，云都是橘子味的。',
    ],
  },
  uncle: {
    id: 'uncle', name: '老周', title: '池塘边的钓手', scene: 'pond', img: 'assets/npc_uncle.jpg',
    intro: '老周天天坐在木栈桥上，钓不钓得到都乐呵呵。',
    lines: [
      '钓鱼这事，急不得。你越急，鱼越不来。',
      '今天水色好，怕是要上大货。',
      '浮子动三下再提竿，记住没？',
      '我这一桶鱼，多半是回去给阿婆熬汤的。',
      '心情不好的时候，就来看看水面。看着看着就平了。',
      '你这小院有福气，早上有雾，晚上有风。',
      '钓到鲤鱼记得喊我，我帮你抬。',
    ],
  },
};

export const NPC_ORDER: NpcId[] = ['grandma', 'girl', 'uncle'];

/* ---------------- 场景 ---------------- */
export const SCENES: Record<SceneId, SceneDef> = {
  home: {
    id: 'home', name: '家', sub: '海边的起居室', bg: 'assets/home.jpg',
    hotspots: [
      { id: 'meal', icon: '🍚', label: '吃饭', note: '饭篮里的菜', x: 48, y: 62, action: 'open:meals' },
      { id: 'kitchen', icon: '🍳', label: '去厨房', note: '灶台还热着', x: 24, y: 66, action: 'go:kitchen' },
      { id: 'wash', icon: '🛁', label: '水缸洗漱', note: '洗脸 · 洗衣 · 洗澡', x: 66, y: 64, action: 'wash:home' },
      { id: 'radio', icon: '📻', label: '旧收音机', note: '听说明天的天气', x: 58, y: 48, action: 'open:radio' },
      { id: 'sleep', icon: '🌙', label: '睡觉', note: '结束这一天', x: 45, y: 26, action: 'open:sleep' },
    ],
  },
  kitchen: {
    id: 'kitchen', name: '厨房', sub: '灶台与冰箱之间', bg: 'assets/kitchen.jpg',
    hotspots: [
      { id: 'cook', icon: '🍲', label: '生火做饭', note: '选食材 · 掌火候', x: 46, y: 62, action: 'open:cook' },
      { id: 'drink', icon: '🍵', label: '烧水泡饮', note: '绿茶 · 柠檬水', x: 28, y: 76, action: 'open:drink' },
      { id: 'fridge', icon: '🧊', label: '冰箱', note: '看看还有什么', x: 20, y: 50, action: 'open:bag' },
      { id: 'book', icon: '📖', label: '菜谱灵感', note: '正餐与饮品', x: 76, y: 46, action: 'open:codex' },
    ],
  },
  farm: {
    id: 'farm', name: '菜园', sub: '海风里的六畦地', bg: 'assets/farm.jpg',
    hotspots: [
      { id: 'plots', icon: '🌱', label: '照料菜地', note: '犁田 · 播种 · 收获', x: 50, y: 66, action: 'open:farm' },
      { id: 'forage', icon: '🌿', label: '田埂挑野菜', note: '没钱时的下策', x: 76, y: 44, action: 'act:forage' },
      { id: 'tip', icon: '🌾', label: '田埂上歇会儿', note: '恢复一点体力', x: 26, y: 42, action: 'act:rest' },
    ],
  },
  yard: {
    id: 'yard', name: '小院', sub: '鸡叫、猪哼、晾衣绳', bg: 'assets/bg_yard.jpg',
    hotspots: [
      { id: 'chicken', icon: '🐔', label: '鸡舍', note: '喂鸡 · 收蛋', x: 26, y: 56, action: 'open:chicken' },
      { id: 'pig', icon: '🐷', label: '猪圈', note: '喂猪 · 出肥料', x: 70, y: 62, action: 'open:pig' },
      { id: 'clean', icon: '🧹', label: '打扫院子', note: '扫落叶 · 理干净', x: 50, y: 74, action: 'act:clean' },
      { id: 'well', icon: '⛲', label: '井边洗涤', note: '洗脸 · 洗澡', x: 46, y: 34, action: 'wash:well' },
    ],
  },
  village: {
    id: 'village', name: '村口', sub: '老槐树与牌桌', bg: 'assets/bg_village.jpg',
    hotspots: [
      { id: 'grandma', icon: '👵', label: '阿婆家', note: '串门聊天', x: 18, y: 52, action: 'npc:grandma' },
      { id: 'cards', icon: '🃏', label: '牌桌', note: '和小满打两把', x: 50, y: 62, action: 'open:cards' },
      { id: 'shop', icon: '🏪', label: '小卖部', note: '买日用品 · 卖收成', x: 76, y: 62, action: 'open:shop' },
      { id: 'stroll', icon: '🚶', label: '沿村口溜达', note: '心情 +12', x: 46, y: 24, action: 'act:stroll' },
      { id: 'help', icon: '🪣', label: '帮阿婆干活', note: '换点零钱 · 一天一次', x: 84, y: 30, action: 'act:help' },
      { id: 'stream', icon: '🏞️', label: '溪边冲洗', note: '在活水里洗个澡', x: 64, y: 80, action: 'wash:stream' },
    ],
  },
  pond: {
    id: 'pond', name: '池塘', sub: '木栈桥与荷叶', bg: 'assets/bg_pond.jpg',
    hotspots: [
      { id: 'fish', icon: '🎣', label: '钓鱼', note: '看浮子 · 提竿', x: 36, y: 66, action: 'open:fishing' },
      { id: 'uncle', icon: '🧓', label: '老周', note: '聊聊水面的事', x: 74, y: 60, action: 'npc:uncle' },
      { id: 'cloud', icon: '☁️', label: '看云发呆', note: '心情 +10', x: 52, y: 33, action: 'act:cloud' },
    ],
  },
};

export const SCENE_ORDER: SceneId[] = ['home', 'kitchen', 'farm', 'yard', 'village', 'pond'];
export const NAV_ICONS: Record<SceneId, string> = {
  home: '🏡', kitchen: '🍳', farm: '🌱', yard: '🐔', village: '🏘️', pond: '🎣',
};

/* ---------------- 商店 / 任务 / 鱼 ---------------- */
export const SHOP_SEEDS = CROP_ORDER.map((id) => CROPS[id].seedId);
export const SHOP_TOOLS = ['feed', 'fertilizer', 'pesticide', 'medicine'];
export const SHOP_SEASONING = ['oil', 'salt', 'sugar', 'vinegar', 'honey', 'lemon', 'water'];
export const SHOP_FOOD = ['egg', 'pork', 'tofu', 'rice', 'flour', 'sauce', 'tea'];

export interface QuestDef { key: 'cook' | 'harvest' | 'feed' | 'talk'; icon: string; text: string; reward: number }
export const QUESTS: QuestDef[] = [
  { key: 'cook', icon: '🍳', text: '做一顿饭', reward: 15 },
  { key: 'harvest', icon: '🧺', text: '收获一次作物', reward: 15 },
  { key: 'feed', icon: '🐔', text: '喂一次鸡或猪', reward: 15 },
  { key: 'talk', icon: '💬', text: '和村民聊聊天', reward: 15 },
];

export const FISH_POOL = [
  { id: 'fish_crucian', weight: 50 },
  { id: 'fish_grass', weight: 32 },
  { id: 'fish_carp', weight: 18 },
];

export const WEATHER_INFO: Record<Weather, {
  icon: string; label: string; note: string; field: boolean; exposure: number;
}> = {
  sunny: { icon: '☀️', label: '晴', note: '阳光正好，适合下地。', field: true, exposure: 0 },
  cloudy: { icon: '☁️', label: '多云', note: '不晒，正适合干活。', field: true, exposure: 0 },
  rain: { icon: '🌧️', label: '小雨', note: '雨水会替你浇灌菜地，淋久了却容易着凉。', field: true, exposure: 0.12 },
  storm: { icon: '⛈️', label: '雷雨', note: '雨点砸在瓦上，今天不宜下地。', field: false, exposure: 0.32 },
  fog: { icon: '🌫️', label: '雾', note: '海雾漫进院子，适合慢慢走一走。', field: true, exposure: 0.03 },
};

export const WEATHER_ORDER: Weather[] = ['sunny', 'cloudy', 'rain', 'storm', 'fog'];

export const STOCK_BASE: Record<string, number> = {
  seed_tomato: 5, seed_potato: 5, seed_cabbage: 4, seed_carrot: 5,
  seed_corn: 4, seed_pumpkin: 3, seed_rapeseed: 6,
  ...ECON.stock,
};

export function createStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  Object.entries(STOCK_BASE).forEach(([id, n]) => {
    stock[id] = n + Math.floor(Math.random() * 2);
  });
  return stock;
}

export const MONTH = '晚夏';

export const CLOCK_TEXT = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const TIME_LABEL = (minutes: number) => {
  const h = minutes / 60;
  if (h < 9) return '清晨';
  if (h < 11) return '上午';
  if (h < 14) return '中午';
  if (h < 17) return '午后';
  if (h < 19) return '傍晚';
  if (h < 21) return '夜里';
  return '深夜';
};

export function initialPlot(): PlotState {
  return { crop: null, stage: 0, tilled: false, watered: false, weed: false, pest: false, fert: false };
}

export function createInitialState(): GameState {
  return {
    version: 1,
    day: 1,
    minutes: 6 * 60,
    weather: 'sunny',
    tomorrowWeather: 'rain',
    coins: ECON.startCoins,
    hunger: 68,
    mood: 66,
    energy: 82,
    hygiene: 84,
    health: 88,
    cold: 0,
    medicineToday: 0,
    mealsToday: 0,
    drinksToday: 0,
    salesToday: 0,
    helpedToday: false,
    stuffedUntil: 0,
    inventory: {
      seed_tomato: 3, seed_carrot: 2, seed_cabbage: 2,
      feed: 4, fertilizer: 2, pesticide: 2,
      tomato: 2, egg: 3, potato: 1, rice: 2, flour: 2, tofu: 1, pork: 1,
      oil: 2, salt: 2, sugar: 1, vinegar: 1, honey: 0, lemon: 1, water: 3,
      tea: 1, medicine: 1,
    },
    meta: {
      tomato: { fresh: 92, quality: 2 },
      egg: { fresh: 96, quality: 2 },
      potato: { fresh: 90, quality: 2 },
    },
    stock: createStock(),
    plots: [
      { crop: 'tomato', stage: 2, tilled: true, watered: false, weed: false, pest: false, fert: false },
      { crop: 'carrot', stage: 2, tilled: true, watered: false, weed: false, pest: false, fert: false },
      { crop: 'rapeseed', stage: 1, tilled: true, watered: true, weed: false, pest: false, fert: false },
      initialPlot(), initialPlot(), initialPlot(),
    ],
    chickens: { fed: false, eggs: 2 },
    pig: { fed: false, manure: 1 },
    yardClean: 76,
    dishes: [],
    npcs: {
      grandma: { points: 0, lastTalkDay: 0 },
      girl: { points: 0, lastTalkDay: 0 },
      uncle: { points: 0, lastTalkDay: 0 },
    },
    quests: { cook: false, harvest: false, feed: false, talk: false },
    discovered: { crops: [], fish: [], recipes: [] },
    counters: { harvest: 0, cooked: 0, fish: 0 },
  };
}
