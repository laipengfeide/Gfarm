import type {
  CropDef, CropId, Gender, ItemDef, NpcDef, NpcId, Recipe, SceneDef, SceneId, GameState, Weather, PlotState, Season,
} from './types';
import { ECON, SEASONING_IDS, SEASONING_PRESETS } from './economy';
import { fixedHotspot, npcHotspot } from './hotspot-layout';

/* ---------------- 作物 ---------------- */
export const CROPS: Record<CropId, CropDef> = {
  tomato: {
    id: 'tomato', name: '番茄', icon: '🍅', seedId: 'seed_tomato', harvestLabel: '采摘番茄',
    growDays: 3, seedPrice: 8, produce: [{ id: 'tomato', qty: 2 }],
    color: '#cf4b3c', leaf: '#5f8a4a', desc: '阳光晒足的小番茄，酸甜多汁。', seasons: ['summer'],
  },
  potato: {
    id: 'potato', name: '土豆', icon: '🥔', seedId: 'seed_potato', harvestLabel: '挖土豆',
    growDays: 3, seedPrice: 6, produce: [{ id: 'potato', qty: 2 }],
    color: '#c8a06a', leaf: '#6a8f4f', desc: '埋在土里的踏实滋味，炖肉最香。', seasons: ['spring', 'autumn'],
  },
  cabbage: {
    id: 'cabbage', name: '白菜', icon: '🥬', seedId: 'seed_cabbage', harvestLabel: '收白菜',
    growDays: 4, seedPrice: 9, produce: [{ id: 'cabbage', qty: 1 }],
    color: '#a7c47e', leaf: '#7fa05a', desc: '一层层包得紧实，煮汤清甜。', seasons: ['autumn', 'winter'],
  },
  carrot: {
    id: 'carrot', name: '胡萝卜', icon: '🥕', seedId: 'seed_carrot', harvestLabel: '拔胡萝卜',
    growDays: 2, seedPrice: 7, produce: [{ id: 'carrot', qty: 2 }],
    color: '#e07a3c', leaf: '#6c9750', desc: '长得快，脆生生的，兔子也爱吃。', seasons: ['spring', 'autumn'],
  },
  corn: {
    id: 'corn', name: '玉米', icon: '🌽', seedId: 'seed_corn', harvestLabel: '掰玉米',
    growDays: 5, seedPrice: 12, produce: [{ id: 'corn', qty: 2 }],
    color: '#e8c15a', leaf: '#7c9a54', desc: '要耐心等它拔节、抽穗、灌浆。', seasons: ['summer'],
  },
  pumpkin: {
    id: 'pumpkin', name: '南瓜', icon: '🎃', seedId: 'seed_pumpkin', harvestLabel: '抱南瓜',
    growDays: 5, seedPrice: 15, produce: [{ id: 'pumpkin', qty: 1 }],
    color: '#e0833e', leaf: '#6f8f52', desc: '藤蔓爬满架子，秋天结出大南瓜。', seasons: ['autumn'],
  },
  rapeseed: {
    id: 'rapeseed', name: '油菜', icon: '🌼', seedId: 'seed_rapeseed', harvestLabel: '割油菜',
    growDays: 3, seedPrice: 5,
    produce: [{ id: 'rapeseed', qty: 2 }, { id: 'rapeseed_oil', qty: 1 }],
    color: '#e8c34a', leaf: '#7f9863', desc: '开花时一片金黄，割下来能榨菜籽油。', seasons: ['spring'],
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

  /* ---- 可收集：昆虫 ---- */
  { id: 'insect_butterfly', name: '菜粉蝶', icon: '🦋', kind: 'insect', sell: 3, desc: '翅膀上像撒了一层白粉，停在油菜花上最久。' },
  { id: 'insect_ladybug', name: '七星瓢虫', icon: '🐞', kind: 'insect', sell: 2, desc: '圆滚滚的小红壳，数一数背上是不是七颗星。' },
  { id: 'insect_snail', name: '蜗牛', icon: '🐌', kind: 'insect', sell: 2, desc: '雨后从叶背慢慢爬出来，壳上有一圈圈年轮。' },
  { id: 'insect_cicada', name: '蝉蜕', icon: '🦗', kind: 'insect', sell: 6, desc: '老槐树皮上留下的空壳，还保持着蜕壳时的姿势。' },
  { id: 'insect_firefly', name: '萤火虫', icon: '✨', kind: 'insect', sell: 5, desc: '夜里水边一点一点的光，像谁把星星放低了。' },
  { id: 'insect_dragonfly', name: '蜻蜓', icon: '🪰', kind: 'insect', sell: 4, desc: '傍晚贴着水面飞，翅膀薄得能看见纹路。' },

  /* ---- 可收集：家具 ---- */
  { id: 'furniture_stool', name: '木脚凳', icon: '🪑', kind: 'furniture', sell: 12, buy: 45, desc: '阿公亲手打的榫卯小凳，坐着正稳。' },
  { id: 'furniture_lamp', name: '陶油灯', icon: '🪔', kind: 'furniture', sell: 18, buy: 68, desc: '粗陶灯盏，点上豆油，光晕是暖黄的。' },
  { id: 'furniture_shelf', name: '小书架', icon: '📚', kind: 'furniture', sell: 26, buy: 95, desc: '两层矮架，放得下菜谱和几本旧书。' },
  { id: 'furniture_chair', name: '藤椅', icon: '🪟', kind: 'furniture', sell: 32, buy: 120, desc: '藤条编的靠背，夏天坐着有风穿过。' },
  { id: 'furniture_screen', name: '竹编屏风', icon: '🎋', kind: 'furniture', sell: 40, buy: 150, desc: '三扇竹屏，把屋角隔出一点自己的安静。' },
  { id: 'furniture_planter', name: '木花架', icon: '🪴', kind: 'furniture', sell: 22, buy: 80, desc: '摆在窗边，能放两盆草和一盏小灯。' },
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
  student: {
    id: 'student', name: '程远', title: '回乡创业的大学生', scene: 'village', img: 'assets/npc_student.jpg',
    intro: '程远毕业后回村做家乡旅游，脑子里全是新点子，也常和村里老人拌嘴。',
    lines: [
      '我在城里学的是旅游规划，回来才发现，村里最难规划的是人心。',
      '阿婆说游客会踩坏菜地，可我想让他们看见菜地怎么长出来的。',
      '这条老街要是修一修，能把外面的人引进来。',
      '你别笑我，我是真的觉得这村子值得被看见。',
      '我爹说我读了书还回来种地，没出息。可我觉得，回来才是本事。',
      '傍晚光线好，我在这儿拍了几张照，你看像不像明信片？',
      '要是你有一亩闲地，愿不愿意试试做个小市集？',
    ],
  },
  buddy: {
    id: 'buddy', name: '陈石', title: '从小一起长大的发小', scene: 'farm', img: 'assets/npc_buddy.jpg',
    intro: '陈石和你一起上过小学、初中，后来你去外地读高中，他进了职业学校。',
    lines: [
      '你回来啦。我还以为你早把村里忘了。',
      '我在职校学的汽修，手上都是机油，洗不太干净。',
      '你读那么多书，回来能习惯吗？',
      '别老提小时候，怪不好意思的。',
      '菜地要是缺人搭把手，喊我一声就行。',
      '我嘴笨，不会说那些好听的。',
      '你现在过得……挺好的吧？',
    ],
  },
  sweetheart: {
    id: 'sweetheart', name: '苏棠', title: '一起长大的邻家姑娘', scene: 'yard', img: 'assets/npc_sweetheart.jpg',
    intro: '苏棠就住隔壁，从小和你一起在院里长大，熟到不用客套。',
    lines: [
      '你家灶台还是老样子，闭着眼我都知道锅放哪儿。',
      '别跟我客气，咱俩谁跟谁。',
      '今天摘的豆角给你留了一把，放门口了。',
      '你以前可不是这么说话的，去城里几年，学客气了。',
      '有些话太熟了反而说不出口，你懂吧？',
      '晚上院子凉，披件衣服再出来。',
      '我可不是对谁都这样。',
    ],
  },
  teacher: {
    id: 'teacher', name: '林知夏', title: '下乡支教的女老师', scene: 'village', img: 'assets/npc_teacher.jpg',
    intro: '林知夏从城里来村里支教，一个人带着十几本课本，说话轻声细语。',
    lines: [
      '孩子们今天第一次看到真的油菜花，眼睛都亮了。',
      '我的支教期只有一年，时间过得比想象中快。',
      '城里的教室更亮，可这里的孩子更需要有人留下来。',
      '你种的菜，能不能让我带一点给住校的孩子？',
      '有时候我也想，走了以后，这些孩子会记得我吗？',
      '晚上改作业，抬头看见满天星星，就觉得来对了。',
      '如果……我是说如果，我留下来呢？',
    ],
  },
};

export const NPC_ORDER: NpcId[] = ['grandma', 'girl', 'uncle', 'student', 'buddy', 'sweetheart', 'teacher'];
export const LEGACY_NPCS: NpcId[] = ['grandma', 'girl', 'uncle'];
export const ROMANCE_BY_GENDER: Record<Gender, NpcId[]> = {
  female: ['student', 'buddy'],
  male: ['sweetheart', 'teacher'],
};
/** 当前性别下会出现在世界里的 NPC（原有三位 + 对应的两位可攻略角色） */
export function npcVisibleFor(gender: Gender): NpcId[] {
  return [...LEGACY_NPCS, ...ROMANCE_BY_GENDER[gender]];
}
export function isRomanceCandidate(id: NpcId, gender: Gender): boolean {
  return ROMANCE_BY_GENDER[gender].includes(id);
}

/* ---------------- NPC 日程 / 故事 ---------------- */
export interface NpcScheduleBlock {
  from: number;
  to: number;
  period: string;
  scene: SceneId;
  x: number;
  y: number;
  note: string;
}

export const NPC_SCHEDULES: Record<NpcId, NpcScheduleBlock[]> = {
  grandma: [
    { from: 6, to: 11, period: '清早', scene: 'village', ...npcHotspot('grandma', 6), note: '在门口择菜、晒被子' },
    { from: 11, to: 15, period: '午后', scene: 'yard', ...npcHotspot('grandma', 11), note: '来你院里看看鸡窝' },
    { from: 15, to: 22, period: '傍晚', scene: 'village', ...npcHotspot('grandma', 15), note: '坐在槐树下纳凉' },
  ],
  girl: [
    { from: 9, to: 12, period: '上午', scene: 'pond', ...npcHotspot('girl', 9), note: '在栈桥边等人打牌' },
    { from: 12, to: 17, period: '午后', scene: 'village', ...npcHotspot('girl', 12), note: '守着牌桌，手气正旺' },
    { from: 17, to: 22, period: '傍晚', scene: 'village', ...npcHotspot('girl', 17), note: '靠在老槐树边看云' },
  ],
  uncle: [
    { from: 6, to: 11, period: '清早', scene: 'pond', ...npcHotspot('uncle', 6), note: '在木栈桥上试水色' },
    { from: 11, to: 14, period: '中午', scene: 'village', ...npcHotspot('uncle', 11), note: '去小卖部换鱼饵' },
    { from: 14, to: 22, period: '下午', scene: 'pond', ...npcHotspot('uncle', 14), note: '守着鱼竿打盹' },
  ],
  student: [
    { from: 6, to: 10, period: '清早', scene: 'village', ...npcHotspot('student', 6), note: '在老街量尺寸、画草图' },
    { from: 10, to: 16, period: '白天', scene: 'village', ...npcHotspot('student', 10), note: '和小卖部商量游客路线' },
    { from: 16, to: 22, period: '傍晚', scene: 'yard', ...npcHotspot('student', 16), note: '蹲在你院门口拍晚霞' },
  ],
  buddy: [
    { from: 6, to: 11, period: '清早', scene: 'farm', ...npcHotspot('buddy', 6), note: '在田埂上帮你看看水渠' },
    { from: 11, to: 17, period: '白天', scene: 'village', ...npcHotspot('buddy', 11), note: '在村口修一辆旧摩托' },
    { from: 17, to: 22, period: '傍晚', scene: 'pond', ...npcHotspot('buddy', 17), note: '坐在水边抽烟，不太说话' },
  ],
  sweetheart: [
    { from: 6, to: 11, period: '清早', scene: 'yard', ...npcHotspot('sweetheart', 6), note: '在自家院里晾豆角' },
    { from: 11, to: 17, period: '白天', scene: 'village', ...npcHotspot('sweetheart', 11), note: '去村口帮阿婆买东西' },
    { from: 17, to: 22, period: '傍晚', scene: 'pond', ...npcHotspot('sweetheart', 17), note: '在水边等你一起回家' },
  ],
  teacher: [
    { from: 8, to: 12, period: '上午', scene: 'village', ...npcHotspot('teacher', 8), note: '在村口接住校的孩子' },
    { from: 12, to: 17, period: '午后', scene: 'village', ...npcHotspot('teacher', 12), note: '在槐树下给孩子们补课' },
    { from: 17, to: 21, period: '傍晚', scene: 'yard', ...npcHotspot('teacher', 17), note: '来你院里借一盏亮一点的灯' },
  ],
};

export function npcScheduleFor(id: NpcId, minutes: number): NpcScheduleBlock | null {
  const hour = minutes / 60;
  return NPC_SCHEDULES[id].find((b) => hour >= b.from && hour < b.to) ?? null;
}

export function npcScheduleLabel(id: NpcId, minutes: number): string {
  const block = npcScheduleFor(id, minutes);
  if (!block) return '这会儿应该回屋歇着了';
  return `${block.period}${block.note}`;
}

export interface NpcStory {
  level: number;
  title: string;
  text: string;
}

export const NPC_STORIES: Record<NpcId, NpcStory[]> = {
  grandma: [
    { level: 2, title: '墙上的旧照片', text: '阿婆从柜顶取下一个铁盒，里面有张泛黄的合影：年轻时的她站在同一条海边，身后是已经拆掉的老码头。' },
    { level: 3, title: '海那边', text: '她说年轻时想坐船去海那边看看，后来忙着照顾一院子人，就把船票夹进书里，再没翻开过。' },
    { level: 4, title: '阿公的烟斗', text: '阿公留下的烟斗一直摆在窗台。阿婆说，不是舍不得用，是怕用了就真的闻不到那股烟草味了。' },
  ],
  girl: [
    { level: 2, title: '牌桌的来历', text: '这张牌桌是她爷爷用旧船板改的。桌角刻着一道浅痕，是小时候她踮脚够糖罐留下的。' },
    { level: 3, title: '留下来的理由', text: '小满说她也去过城里，热闹是热闹，可夜里听不见海风，总觉得床在晃。最后还是回来了。' },
    { level: 4, title: '雨夜没说完的话', text: '那晚躲雨，她忽然问你：要是有人一直留在村子里，是不是就没出息？话没说完，雨先停了。' },
    { level: 5, title: '留一盏灯', text: '她把牌桌收拾干净，只留一盏灯。“以后你从地里回来，看见这盏灯亮着，就知道有人在等你。”' },
  ],
  uncle: [
    { level: 2, title: '浮子的脾气', text: '老周说每个浮子都有自己的脾气，看懂了浮子，就看懂了水面，也差不多看懂了日子。' },
    { level: 3, title: '一桶鱼给谁', text: '他钓的鱼大半送给阿婆和村里的老人。“钓上来是本事，送出去才是日子。”' },
    { level: 4, title: '老船', text: '滩涂深处有条半埋的老船，是他父亲那辈的。老周每年都去看一眼，不修，也不拖走。' },
  ],
  student: [
    { level: 2, title: '返乡第一张图纸', text: '程远把一张手绘的村子地图铺在桌上，每条路、每块田都标了颜色。他说，想让外面的人沿着这些颜色走进来。' },
    { level: 3, title: '和阿婆的争执', text: '阿婆嫌游客会踩坏菜地，程远急着解释，声音越来越大，最后两个人都沉默了。他后来低声说：我不是要拆掉这里。' },
    { level: 4, title: '老街的灯', text: '他给老街装了三盏灯，夜里亮起来的时候，阿婆站在灯下看了很久，说：倒有点像从前。' },
    { level: 5, title: '留下来的人', text: '“我本来可以留在城里。可我想让这个村子被看见，也想让某个人看见，我回来不是退路。”他看着我，话没说完。' },
  ],
  buddy: [
    { level: 2, title: '分岔的夏天', text: '陈石翻出初中毕业照，照片背后写着两行地址。他说，那年你去外地读高中，他去职校，谁也没说再见。' },
    { level: 3, title: '职校的机油味', text: '他说职校的宿舍有股机油味，洗了三年也没洗干净。可他现在能修好村里所有的摩托，说这话时腰杆是直的。' },
    { level: 4, title: '没寄出的信', text: '他从工具箱底下摸出一封没封口的信，收信人写着你，邮戳停在很多年前。他笑了笑，又放回去了。' },
    { level: 5, title: '一直在原地', text: '“你走的时候我没去送。后来每年过年，我都想，你要是回来，我该说点什么。”他顿了顿，“结果一见到你，还是只会问你吃没吃饭。”' },
  ],
  sweetheart: [
    { level: 2, title: '隔壁的墙', text: '苏棠说小时候她总翻过那道矮墙来找你，有一次摔下来磕破了膝盖，你背她回家，她哭得比谁都响。' },
    { level: 3, title: '太熟的尴尬', text: '她忽然问你，是不是觉得她太熟了，熟到不像个姑娘。你还没答，她自己先笑了，说算了，当我没问。' },
    { level: 4, title: '雨里的伞', text: '那天雨大，她撑伞在村口等你，半边肩膀都湿了。她说顺路，可你家和她家根本不在一个方向。' },
    { level: 5, title: '不用说的那句', text: '“咱俩认识太久了，说喜欢好像怪怪的。”她把脸别过去，“可除了你，我也没想过别人。”' },
  ],
  teacher: [
    { level: 2, title: '第一堂课', text: '林知夏说第一堂课她紧张得手心出汗，孩子们却齐刷刷站起来喊老师好，她差点没忍住眼泪。' },
    { level: 3, title: '一年的期限', text: '她的支教期只有一年。她说开始时天天数日子，后来忙着备课，忽然发现只剩几个月了。' },
    { level: 4, title: '家访', text: '她去最远的学生家里家访，回来时鞋上全是泥。她说那孩子把唯一的鸡蛋塞给她，她一路都没舍得吃。' },
    { level: 5, title: '去留之间', text: '“城里给我留了位置，这里也需要我。”她看着我，“如果我说我想留下，你会不会觉得我傻？”' },
  ],
};

const WORLD_NEWS = [
  '阿婆清早把被子抱到院里晒，竹竿上还挂着去年腌的咸鱼。',
  '小满在牌桌上赢了三把，笑得半个村口都听见了。',
  '老周换了个新浮子，说今天水色好，非要留你吃鱼汤。',
  '槐树落了一地细碎的花，阿婆扫了半筐，说能泡茶。',
  '小满傍晚靠在树边看云，看见你路过，扬了扬手里的牌。',
  '老周把钓到的小鱼放回了水里，说留着明年长。',
  '阿婆给院门口的野猫留了半碗饭，猫现在天天来。',
  '村里有人家修屋顶，小满跑去帮忙，回来时一身木屑。',
];

export function worldNews(day: number): string {
  return WORLD_NEWS[(Math.max(1, day) - 1) % WORLD_NEWS.length];
}

/* ---------------- 季节节日 ---------------- */
export interface FestivalDef {
  id: string;
  name: string;
  icon: string;
  season: Season;
  /** 季节内第几天 */
  day: number;
  desc: string;
  reward: { coins: number; items?: Record<string, number>; note: string };
}

export const FESTIVALS: FestivalDef[] = [
  {
    id: 'spring_flower', name: '春分花会', icon: '🌼', season: 'spring', day: 4,
    desc: '村口摆满新摘的油菜花，阿婆教大家编花环。',
    reward: { coins: 60, items: { seed_rapeseed: 3 }, note: '三包油菜种子' },
  },
  {
    id: 'summer_lantern', name: '夏夜灯会', icon: '🏮', season: 'summer', day: 4,
    desc: '池塘边放一盏盏小灯，萤火虫落在灯沿上。',
    reward: { coins: 80, items: { tea: 2 }, note: '两包花茶' },
  },
  {
    id: 'autumn_market', name: '秋收集市', icon: '🎃', season: 'autumn', day: 4,
    desc: '把今年最好的收成摆上长桌，小满负责吆喝。',
    reward: { coins: 100, items: { seed_pumpkin: 1 }, note: '一包南瓜种子' },
  },
  {
    id: 'winter_stove', name: '冬夜围炉', icon: '🔥', season: 'winter', day: 4,
    desc: '灶膛烧得通红，老周讲了一整晚海上的旧事。',
    reward: { coins: 70, items: { egg: 3 }, note: '三个热鸡蛋' },
  },
];

export function festivalForDay(day: number): FestivalDef | null {
  const season = seasonForDay(day);
  const dayInSeason = seasonDayForDay(day);
  return FESTIVALS.find((f) => f.season === season && f.day === dayInSeason) ?? null;
}

/* ---------------- 场景 ---------------- */
export const SCENES: Record<SceneId, SceneDef> = {
  home: {
    id: 'home', name: '家', sub: '海边的起居室', bg: 'assets/home.jpg',
    hotspots: [
      { id: 'meal', icon: '🍚', label: '吃饭', note: '饭篮里的菜', ...fixedHotspot('home', 'meal'), action: 'open:meals' },
      { id: 'kitchen', icon: '🍳', label: '去厨房', note: '灶台还热着', ...fixedHotspot('home', 'kitchen'), action: 'go:kitchen' },
      { id: 'wash', icon: '🛁', label: '水缸洗漱', note: '洗脸 · 洗衣 · 洗澡', ...fixedHotspot('home', 'wash'), action: 'wash:home' },
      { id: 'radio', icon: '📻', label: '旧收音机', note: '听说明天的天气', ...fixedHotspot('home', 'radio'), action: 'open:radio' },
      { id: 'sleep', icon: '🌙', label: '睡觉', note: '结束这一天', ...fixedHotspot('home', 'sleep'), action: 'open:sleep' },
    ],
  },
  kitchen: {
    id: 'kitchen', name: '厨房', sub: '灶台与冰箱之间', bg: 'assets/kitchen.jpg',
    hotspots: [
      { id: 'cook', icon: '🍲', label: '生火做饭', note: '选食材 · 掌火候', ...fixedHotspot('kitchen', 'cook'), action: 'open:cook' },
      { id: 'drink', icon: '🍵', label: '烧水泡饮', note: '绿茶 · 柠檬水', ...fixedHotspot('kitchen', 'drink'), action: 'open:drink' },
      { id: 'fridge', icon: '🧊', label: '冰箱', note: '看看还有什么', ...fixedHotspot('kitchen', 'fridge'), action: 'open:bag' },
      { id: 'book', icon: '📖', label: '菜谱灵感', note: '正餐与饮品', ...fixedHotspot('kitchen', 'book'), action: 'open:codex' },
    ],
  },
  farm: {
    id: 'farm', name: '菜园', sub: '海风里的六畦地', bg: 'assets/farm.jpg',
    hotspots: [
      { id: 'plots', icon: '🌱', label: '照料菜地', note: '犁田 · 播种 · 收获', ...fixedHotspot('farm', 'plots'), action: 'open:farm' },
      { id: 'forage', icon: '🌿', label: '田埂挑野菜', note: '没钱时的下策', ...fixedHotspot('farm', 'forage'), action: 'act:forage' },
      { id: 'tip', icon: '🌾', label: '田埂上歇会儿', note: '恢复一点体力', ...fixedHotspot('farm', 'tip'), action: 'act:rest' },
      { id: 'bugs', icon: '🦋', label: '找找小虫子', note: '昆虫图鉴', ...fixedHotspot('farm', 'bugs'), action: 'act:bugs' },
    ],
  },
  yard: {
    id: 'yard', name: '小院', sub: '鸡叫、猪哼、晾衣绳', bg: 'assets/bg_yard.jpg',
    hotspots: [
      { id: 'chicken', icon: '🐔', label: '鸡舍', note: '喂鸡 · 收蛋', ...fixedHotspot('yard', 'chicken'), action: 'open:chicken' },
      { id: 'pig', icon: '🐷', label: '猪圈', note: '喂猪 · 出肥料', ...fixedHotspot('yard', 'pig'), action: 'open:pig' },
      { id: 'clean', icon: '🧹', label: '打扫院子', note: '扫落叶 · 理干净', ...fixedHotspot('yard', 'clean'), action: 'act:clean' },
      { id: 'well', icon: '⛲', label: '井边洗涤', note: '洗脸 · 洗澡', ...fixedHotspot('yard', 'well'), action: 'wash:well' },
    ],
  },
  village: {
    id: 'village', name: '村口', sub: '老槐树与牌桌', bg: 'assets/bg_village.jpg',
    hotspots: [
      { id: 'grandma', icon: '👵', label: '阿婆家', note: '串门聊天', ...fixedHotspot('village', 'grandma'), action: 'npc:grandma' },
      { id: 'cards', icon: '🃏', label: '牌桌', note: '和小满打两把', ...fixedHotspot('village', 'cards'), action: 'open:cards' },
      { id: 'shop', icon: '🏪', label: '小卖部', note: '买日用品 · 卖收成', ...fixedHotspot('village', 'shop'), action: 'open:shop' },
      { id: 'stroll', icon: '🚶', label: '沿村口溜达', note: '心情 +12', ...fixedHotspot('village', 'stroll'), action: 'act:stroll' },
      { id: 'help', icon: '🪣', label: '帮阿婆干活', note: '换点零钱 · 一天一次', ...fixedHotspot('village', 'help'), action: 'act:help' },
      { id: 'stream', icon: '🏞️', label: '溪边冲洗', note: '在活水里洗个澡', ...fixedHotspot('village', 'stream'), action: 'wash:stream' },
      { id: 'bugs', icon: '🦗', label: '槐树下找虫子', note: '蝉蜕 · 蜗牛', ...fixedHotspot('village', 'bugs'), action: 'act:bugs' },
    ],
  },
  pond: {
    id: 'pond', name: '池塘', sub: '木栈桥与荷叶', bg: 'assets/bg_pond.jpg',
    hotspots: [
      { id: 'fish', icon: '🎣', label: '钓鱼', note: '看浮子 · 提竿', ...fixedHotspot('pond', 'fish'), action: 'open:fishing' },
      { id: 'uncle', icon: '🧓', label: '老周', note: '聊聊水面的事', ...fixedHotspot('pond', 'uncle'), action: 'npc:uncle' },
      { id: 'bugs', icon: '✨', label: '水边看虫子', note: '萤火虫 · 蜻蜓', ...fixedHotspot('pond', 'bugs'), action: 'act:bugs' },
      { id: 'cloud', icon: '☁️', label: '看云发呆', note: '心情 +10', ...fixedHotspot('pond', 'cloud'), action: 'act:cloud' },
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

/* ---------------- 收集：昆虫 / 家具 ---------------- */
export const SHOP_FURNITURE = [
  'furniture_stool', 'furniture_lamp', 'furniture_shelf',
  'furniture_chair', 'furniture_screen', 'furniture_planter',
];
export const FURNITURE_IDS = SHOP_FURNITURE;

export interface InsectDef {
  id: string;
  name: string;
  emoji: string;
  scenes: SceneId[];
  seasons: Season[];
  /** 出现时段（小时，含端点） */
  from: number;
  to: number;
  weather: Weather[];
  hint: string;
}

export const INSECT_DEFS: InsectDef[] = [
  { id: 'insect_butterfly', name: '菜粉蝶', emoji: '🦋', scenes: ['farm'], seasons: ['spring', 'summer'], from: 9, to: 16, weather: ['sunny', 'cloudy'], hint: '菜园 · 春夏的白天 · 晴或多云' },
  { id: 'insect_ladybug', name: '七星瓢虫', emoji: '🐞', scenes: ['farm'], seasons: ['spring', 'summer'], from: 8, to: 17, weather: ['sunny'], hint: '菜园 · 春夏 · 晴天白天' },
  { id: 'insect_snail', name: '蜗牛', emoji: '🐌', scenes: ['farm', 'village'], seasons: ['spring', 'autumn'], from: 6, to: 18, weather: ['rain', 'cloudy'], hint: '菜园或村口 · 春秋 · 雨天/阴天' },
  { id: 'insect_cicada', name: '蝉蜕', emoji: '🦗', scenes: ['village'], seasons: ['summer'], from: 10, to: 18, weather: ['sunny', 'cloudy'], hint: '村口老槐树 · 夏天白天 · 晴或多云' },
  { id: 'insect_firefly', name: '萤火虫', emoji: '✨', scenes: ['pond', 'village'], seasons: ['summer', 'autumn'], from: 19, to: 22, weather: ['sunny', 'cloudy', 'fog'], hint: '池塘或村口 · 夏秋的夜里 · 非雷雨' },
  { id: 'insect_dragonfly', name: '蜻蜓', emoji: '🪰', scenes: ['pond'], seasons: ['summer'], from: 15, to: 19, weather: ['sunny', 'cloudy'], hint: '池塘水边 · 夏天傍晚 · 晴或多云' },
];
export const INSECT_IDS = INSECT_DEFS.map((d) => d.id);

export const COLLECTIBLE_TOTALS = {
  crops: CROP_ORDER.length,
  fish: 3,
  recipes: RECIPES.length + 1,
  insects: INSECT_IDS.length,
  furniture: FURNITURE_IDS.length,
};

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

/* ---------------- 季节 ---------------- */
export const SEASON_LENGTH = 7;
export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];
/** 第 1 天从夏末开始，沿用原存档的「晚夏」氛围 */
export const SEASON_START: Season = 'summer';

export const SEASON_INFO: Record<Season, {
  name: string; short: string; icon: string; tint: string; note: string;
}> = {
  spring: { name: '春', short: '春', icon: '🌱', tint: 'rgba(190,226,178,.13)', note: '风里有青草和新翻泥土的味道。' },
  summer: { name: '夏', short: '夏', icon: '🌿', tint: 'rgba(255,216,150,.12)', note: '蝉声很长，井水很凉。' },
  autumn: { name: '秋', short: '秋', icon: '🍂', tint: 'rgba(232,168,96,.14)', note: '风把落叶吹到门槛边，收成该归仓了。' },
  winter: { name: '冬', short: '冬', icon: '❄️', tint: 'rgba(176,204,230,.15)', note: '海风冷了，灶膛的火更让人留恋。' },
};

export function seasonForDay(day: number): Season {
  const step = Math.floor((Math.max(1, day) - 1) / SEASON_LENGTH);
  const idx = (SEASON_ORDER.indexOf(SEASON_START) + step) % SEASON_ORDER.length;
  return SEASON_ORDER[idx];
}

export function seasonDayForDay(day: number): number {
  return ((Math.max(1, day) - 1) % SEASON_LENGTH) + 1;
}

/** 例：夏 · 第 3 天 */
export function seasonText(day: number): string {
  const season = seasonForDay(day);
  return `${SEASON_INFO[season].name} · 第 ${seasonDayForDay(day)} 天`;
}

/** 各季节的天气权重（storm 冬天更少，雾在春秋更多） */
export const WEATHER_BY_SEASON: Record<Season, Record<Weather, number>> = {
  spring: { sunny: 0.30, cloudy: 0.24, rain: 0.24, storm: 0.08, fog: 0.14 },
  summer: { sunny: 0.46, cloudy: 0.20, rain: 0.18, storm: 0.12, fog: 0.04 },
  autumn: { sunny: 0.34, cloudy: 0.26, rain: 0.18, storm: 0.06, fog: 0.16 },
  winter: { sunny: 0.30, cloudy: 0.30, rain: 0.12, storm: 0.04, fog: 0.24 },
};

export function rollWeatherFor(season: Season, r = Math.random()): Weather {
  const weights = WEATHER_BY_SEASON[season];
  let acc = 0;
  for (const w of WEATHER_ORDER) {
    acc += weights[w];
    if (r < acc) return w;
  }
  return 'sunny';
}

/* 季节展示统一走 seasonText(day)，原 MONTH 常量保留在下方以兼容旧引用 */

export const STOCK_BASE: Record<string, number> = {
  seed_tomato: 5, seed_potato: 5, seed_cabbage: 4, seed_carrot: 5,
  seed_corn: 4, seed_pumpkin: 3, seed_rapeseed: 6,
  furniture_stool: 1, furniture_lamp: 1, furniture_shelf: 1,
  furniture_chair: 1, furniture_screen: 1, furniture_planter: 1,
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

export function createInitialState(gender: Gender = 'female'): GameState {
  return {
    version: 2,
    gender,
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
      student: { points: 0, lastTalkDay: 0 },
      buddy: { points: 0, lastTalkDay: 0 },
      sweetheart: { points: 0, lastTalkDay: 0 },
      teacher: { points: 0, lastTalkDay: 0 },
    },
    quests: { cook: false, harvest: false, feed: false, talk: false },
    discovered: { crops: [], fish: [], recipes: [] },
    counters: { harvest: 0, cooked: 0, fish: 0 },
    lastSavedAt: Date.now(),
    offlineReport: null,
    streak: { lastDay: 1, count: 1 },
    rating: {
      score: 0, grade: 'C', updatedDay: 1,
      dims: { collection: 0, harvest: 0, bonds: 0, home: 0, savings: 0 },
    },
    collections: { insects: [], furniture: [], festivals: [] },
    npcStories: {
      grandma: { level: 0, seen: [], romance: false },
      girl: { level: 0, seen: [], romance: false },
      uncle: { level: 0, seen: [], romance: false },
      student: { level: 0, seen: [], romance: false },
      buddy: { level: 0, seen: [], romance: false },
      sweetheart: { level: 0, seen: [], romance: false },
      teacher: { level: 0, seen: [], romance: false },
    },
  };
}
