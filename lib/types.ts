// 游戏数据模型
export type SceneId = 'home' | 'kitchen' | 'farm' | 'yard' | 'village' | 'pond';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'fog';
export type CropId = 'tomato' | 'potato' | 'cabbage' | 'carrot' | 'corn' | 'pumpkin' | 'rapeseed';
export type NpcId = 'grandma' | 'girl' | 'uncle';
export type ItemKind = 'seed' | 'produce' | 'material' | 'fish' | 'tool';
export type ToastKind = 'info' | 'good' | 'warn';

export interface CropDef {
  id: CropId;
  name: string;
  icon: string;
  seedId: string;
  harvestLabel: string;
  growDays: number;
  seedPrice: number;
  produce: { id: string; qty: number }[];
  color: string;
  leaf: string;
  desc: string;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  kind: ItemKind;
  sell: number;
  buy?: number;
  desc?: string;
  edible?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  need: string[];
  food: number;
  mood: number;
  price: number;
  desc: string;
  /** dish = 正餐，drink = 饮品（饱腹小、心情高，不替代正餐） */
  kind?: 'dish' | 'drink';
  /** 这份菜谱要用的调料及数量 */
  seasoning?: Partial<Record<string, number>>;
}

export interface NpcDef {
  id: NpcId;
  name: string;
  title: string;
  scene: SceneId;
  img: string;
  intro: string;
  lines: string[];
}

export interface PlotState {
  crop: CropId | null;
  stage: number;
  tilled: boolean;
  watered: boolean;
  weed: boolean;
  pest: boolean;
  fert: boolean;
}

export interface Dish {
  recipeId: string;
  name: string;
  icon: string;
  stars: number;
  food: number;
  mood: number;
  price: number;
  kind?: 'dish' | 'drink';
}

export interface NpcState {
  points: number;
  lastTalkDay: number;
}

/** 农产品的品质与新鲜度（影响卖价） */
export interface ItemMeta {
  fresh: number;
  quality: number; // 1-3
}

export interface GameState {
  version: number;
  day: number;
  minutes: number; // 从 0:00 起算，开局 360 = 06:00
  weather: Weather;
  tomorrowWeather: Weather;
  coins: number;
  hunger: number;
  mood: number;
  energy: number;
  hygiene: number; // 清洁度
  health: number; // 健康度
  cold: number; // 感冒严重度 0-100
  medicineToday: number;
  mealsToday: number;
  drinksToday: number; // 今天喝了几杯饮品（收益递减）
  salesToday: number; // 今天卖东西的收入，睡觉清零
  helpedToday: boolean; // 今天有没有帮邻居干活
  stuffedUntil: number; // 吃撑到什么时候（绝对分钟）
  inventory: Record<string, number>;
  meta: Record<string, ItemMeta>;
  stock: Record<string, number>;
  plots: PlotState[];
  chickens: { fed: boolean; eggs: number };
  pig: { fed: boolean; manure: number };
  yardClean: number;
  dishes: Dish[];
  npcs: Record<NpcId, NpcState>;
  quests: { cook: boolean; harvest: boolean; feed: boolean; talk: boolean };
  discovered: { crops: string[]; fish: string[]; recipes: string[] };
  counters: { harvest: number; cooked: number; fish: number };
}

export interface CookResult {
  recipe: Recipe;
  stars: number;
  dark: boolean;
  dish: Dish;
}

export interface HotspotDef {
  id: string;
  icon: string;
  label: string;
  note?: string;
  x: number;
  y: number;
  action: string;
  badge?: 'harvest' | 'eggs' | 'manure';
}

export interface SceneDef {
  id: SceneId;
  name: string;
  sub: string;
  bg: string;
  hotspots: HotspotDef[];
}
