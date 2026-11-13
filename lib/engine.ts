import {
 CROPS, DARK_DISH, DISHES, DRINKS, ITEMS, NPCS, QUESTS, RECIPES, FISH_POOL, WEATHER_INFO,
  createInitialState, createStock, matchRecipe, type QuestDef,
} from './data';
import type {
  CookResult, CropId, Dish, GameState, NpcId, Recipe, ToastKind, Weather,
} from './types';
import { ECON } from './economy';
import { saveGame } from './save';
import { play, type SoundKind } from './audio';

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const ACTIONS = {
  plow: { min: 30, energy: 8, label: '犁田' },
  plant: { min: 10, energy: 2, label: '播种' },
  water: { min: 10, energy: 3, label: '浇水' },
  weed: { min: 15, energy: 4, label: '拔草' },
  fertilize: { min: 10, energy: 3, label: '施肥' },
  pest: { min: 15, energy: 4, label: '打农药' },
  harvest: { min: 20, energy: 5, label: '收获' },
  feed: { min: 20, energy: 4, label: '喂养' },
  clean: { min: 30, energy: 7, label: '打扫' },
  collect: { min: 5, energy: 1, label: '收蛋' },
  cook: { min: 35, energy: 6, label: '做饭' },
  eat: { min: 15, energy: 0, label: '吃饭' },
  talk: { min: 20, energy: 2, label: '聊天' },
  stroll: { min: 30, energy: 4, label: '溜达' },
  card: { min: 40, energy: 4, label: '打牌' },
  fish: { min: 40, energy: 7, label: '钓鱼' },
  rest: { min: 30, energy: -8, label: '歇息' },
  gift: { min: 10, energy: 0, label: '送菜' },
  washFace: { min: 10, energy: 1, label: '洗脸' },
  washClothes: { min: 30, energy: 5, label: '洗衣服' },
  bath: { min: 45, energy: 8, label: '洗澡' },
  medicine: { min: 5, energy: 0, label: '吃药' },
  tea: { min: 15, energy: 0, label: '泡茶' },
  forage: { min: ECON.forage.minutes, energy: ECON.forage.energy, label: '挑野菜' },
  help: { min: ECON.help.minutes, energy: ECON.help.energy, label: '帮工' },
  brew: { min: ECON.brew.minutes, energy: ECON.brew.energy, label: '做饮品' },
};

export interface SleepSummary {
  day: number;
  coins: number;
  harvest: number;
  cooked: number;
  fish: number;
  questDone: number;
  meals: number;
  nextWeather: Weather;
  health: number;
  hygiene: number;
  cold: number;
  sales: number;
}

export class GameEngine {
  state: GameState;
  version = 0;
  private listeners = new Set<() => void>();
  notifyToast: (msg: string, kind?: ToastKind) => void = () => {};
  fx: (kind: SoundKind) => void = (k) => play(k);

  constructor(state: GameState = createInitialState()) {
    this.state = state;
  }

  /* ---------- 订阅 ---------- */
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  getVersion = () => this.version;
  private commit(save = true) {
    if (save) saveGame(this.state);
    this.version += 1;
    this.listeners.forEach((l) => l());
  }
  private toast(msg: string, kind: ToastKind = 'info') {
    this.notifyToast(msg, kind);
  }
  private sound(k: SoundKind) {
    this.fx(k);
  }

  /* ---------- 通用时间/体力消耗 ---------- */
  now() {
    return (this.state.day - 1) * 1440 + this.state.minutes;
  }

  isStuffed() {
    return this.state.stuffedUntil > this.now();
  }

  canSpend(min: number, energy: number): { ok: boolean; reason?: string } {
    const s = this.state;
    if (s.minutes >= 22 * 60) return { ok: false, reason: '夜深了，先回屋睡觉吧。' };
    if (s.energy < Math.max(0, energy)) return { ok: false, reason: '体力不够了，吃点东西或睡一觉吧。' };
    if (energy > 0 && s.hunger <= 8) return { ok: false, reason: '饿得没力气了，先吃点东西。' };
    if (s.minutes + min > 22 * 60 + 30) return { ok: false, reason: '今天来不及做完这件事了，先回家吧。' };
    return { ok: true };
  }

  private spend(min: number, energy: number, dirt = 0): boolean {
    const s = this.state;
    const stuffed = this.isStuffed();
    const sick = s.cold > 0;
    const minutes = Math.round(min * (stuffed ? 1.2 : 1) * (sick ? 1.08 : 1));
    const extraEnergy = sick && energy > 0 ? 2 : 0;
    const check = this.canSpend(minutes, energy + extraEnergy);
    if (!check.ok) {
      this.toast(check.reason ?? '现在做不了这件事。', 'warn');
      return false;
    }
    s.minutes = Math.min(22 * 60 + 30, s.minutes + minutes);
    s.energy = clamp(s.energy - Math.max(0, energy + extraEnergy));
    if (energy > 0) {
      s.hunger = clamp(s.hunger - minutes * 0.09);
      s.mood = clamp(s.mood - minutes * 0.013 - (stuffed ? minutes * 0.008 : 0));
      s.hygiene = clamp(s.hygiene - dirt - minutes * 0.012);
      if (s.hygiene < 28) s.health = clamp(s.health - 0.6);
      if (s.hunger < 15) s.health = clamp(s.health - 0.5);
    }
    return true;
  }

  /** 雷雨天不能下地；返回 false 时已给出提示 */
  private fieldOpen(): boolean {
    const w = WEATHER_INFO[this.state.weather];
    if (!w.field) {
      this.toast('雷雨太大，田里站不住脚，等雨小一点再说吧。', 'warn');
      return false;
    }
    return true;
  }

  /** 淋雨/受寒：可能感冒 */
  private exposure(scale = 1) {
    const s = this.state;
    if (s.cold > 0) return;
    const risk = WEATHER_INFO[s.weather].exposure * scale + (s.hygiene < 40 ? 0.08 : 0);
    if (risk <= 0) return;
    if (Math.random() < risk) {
      s.cold = 28;
      s.health = clamp(s.health - 4);
      s.mood = clamp(s.mood - 5);
      this.toast('衣服湿了，风一吹打了个寒战……好像有点着凉。找点药吃吧。', 'warn');
      this.sound('fail');
    }
  }

  /* ---------- 任务 / 图鉴 ---------- */
  private completeQuest(key: 'cook' | 'harvest' | 'feed' | 'talk') {
    const s = this.state;
    if (s.quests[key]) return;
    s.quests[key] = true;
    const q = QUESTS.find((x: QuestDef) => x.key === key);
    if (q) {
      s.coins += q.reward;
      this.toast(`今日小事完成：${q.text} · +${q.reward} 文`, 'good');
      this.sound('coin');
    }
  }

  private discover(kind: 'crops' | 'fish' | 'recipes', id: string) {
    const list = this.state.discovered[kind];
    if (!list.includes(id)) list.push(id);
  }

  /* ---------- 菜园 ---------- */
  plow(i: number) {
    const p = this.state.plots[i];
    if (!p) return;
    if (p.crop) return this.toast('这一畦还长着作物呢。', 'warn');
    if (p.tilled) return this.toast('土已经松好了，直接播种吧。');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.plow.min, ACTIONS.plow.energy, 14)) return;
    p.tilled = true;
    this.exposure(0.6);
    this.toast('犁好了一畦地，土松软得像新蒸的糕。裤脚溅了些泥。');
    this.commit();
  }

  plant(i: number, seedId: string) {
    const s = this.state;
    const p = s.plots[i];
    const crop = CROPS[seedId.replace('seed_', '') as CropId];
    if (!p || !crop || crop.seedId !== seedId) return;
    if (p.crop) return this.toast('这一畦已经种上了。', 'warn');
    if (!p.tilled) return this.toast('先把土犁一下再播种吧。', 'warn');
    if ((s.inventory[seedId] ?? 0) <= 0) return this.toast('没有这种种子了，去小卖部买一些吧。', 'warn');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.plant.min, ACTIONS.plant.energy, 6)) return;
    s.inventory[seedId] -= 1;
    p.crop = crop.id;
    p.stage = 0;
    p.fert = false;
    p.watered = false;
    p.weed = false;
    p.pest = false;
    this.toast(`播下了${crop.name}，记得浇水。`);
    this.commit();
  }

  water(i: number) {
    const p = this.state.plots[i];
    if (!p || !p.crop) return this.toast('这里还没有作物需要浇水。', 'warn');
    if (p.watered) return this.toast('今天已经浇过水了，土还湿着呢。');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.water.min, ACTIONS.water.energy, 5)) return;
    p.watered = true;
    this.exposure(0.4);
    this.sound('water');
    this.toast('水渗进土里，叶子上挂着亮晶晶的水珠。');
    this.commit();
  }

  pullWeed(i: number) {
    const p = this.state.plots[i];
    if (!p || !p.crop) return;
    if (!p.weed) return this.toast('这一畦很干净，没有杂草。');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.weed.min, ACTIONS.weed.energy, 8)) return;
    p.weed = false;
    this.exposure(0.4);
    this.toast('拔掉了一小把杂草，手上有青草的味道。');
    this.commit();
  }

  fertilize(i: number) {
    const s = this.state;
    const p = s.plots[i];
    if (!p || !p.crop) return this.toast('这里还没有作物。', 'warn');
    if ((s.inventory.fertilizer ?? 0) <= 0) return this.toast('没有肥料了，去小卖部买一些吧。', 'warn');
    if (p.stage >= CROPS[p.crop].growDays) return this.toast('已经熟透了，不需要再施肥。');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.fertilize.min, ACTIONS.fertilize.energy, 10)) return;
    s.inventory.fertilizer -= 1;
    p.fert = true;
    p.stage = Math.min(CROPS[p.crop].growDays, p.stage + 1);
    this.exposure(0.5);
    this.sound('feed');
    this.toast('施了一点肥，叶子明显精神了。手上沾了点土腥味。');
    this.commit();
  }

  sprayPest(i: number) {
    const s = this.state;
    const p = s.plots[i];
    if (!p || !p.crop) return;
    if (!p.pest) return this.toast('这一畦没有虫害。');
    if ((s.inventory.pesticide ?? 0) <= 0) return this.toast('农药用完了，去小卖部补一瓶吧。', 'warn');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.pest.min, ACTIONS.pest.energy, 12)) return;
    s.inventory.pesticide -= 1;
    p.pest = false;
    this.exposure(0.4);
    this.sound('water');
    this.toast('喷过药了，希望小虫子别再来了。身上沾了些药水味。');
    this.commit();
  }

  harvest(i: number) {
    const s = this.state;
    const p = s.plots[i];
    if (!p || !p.crop) return;
    const crop = CROPS[p.crop];
    if (p.stage < crop.growDays) return this.toast('还没熟透，再等一两天吧。');
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.harvest.min, ACTIONS.harvest.energy, 8)) return;
    const weak = s.cold > 0 || s.health < 32;
    const gains: string[] = [];
    crop.produce.forEach((prod, idx) => {
      const extra = p.fert && idx === 0 && !weak ? 1 : 0;
      const qty = Math.max(1, prod.qty + extra - (weak && idx === 0 ? 1 : 0));
      s.inventory[prod.id] = (s.inventory[prod.id] ?? 0) + qty;
      s.meta[prod.id] = { fresh: 100, quality: p.fert ? 3 : 2 };
      gains.push(`${ITEMS[prod.id]?.icon ?? '🌱'} ${ITEMS[prod.id]?.name ?? prod.id} ×${qty}`);
    });
    p.crop = null;
    p.stage = 0;
    p.fert = false;
    p.watered = false;
    p.weed = false;
    p.pest = false;
    p.tilled = true;
    s.counters.harvest += 1;
    this.discover('crops', crop.id);
    this.exposure(0.4);
    this.sound('harvest');
    this.toast(`${crop.harvestLabel}：${gains.join('、')}`, 'good');
    this.completeQuest('harvest');
    this.commit();
  }

  /* ---------- 小院 ---------- */
  feedChickens() {
    const s = this.state;
    if (s.chickens.fed) return this.toast('今天已经撒过谷粒了，鸡们正忙着呢。');
    if ((s.inventory.feed ?? 0) <= 0) return this.toast('没有饲料了，去小卖部买一点吧。', 'warn');
    if (!this.spend(ACTIONS.feed.min, ACTIONS.feed.energy, 4)) return;
    s.inventory.feed -= 1;
    s.chickens.fed = true;
    s.chickens.eggs += 2;
    s.mood = clamp(s.mood + 4);
    this.exposure(0.3);
    this.sound('feed');
    this.toast('撒了一把谷粒，鸡群扑棱棱围过来，明天又能收蛋了。', 'good');
    this.completeQuest('feed');
    this.commit();
  }

  collectEggs() {
    const s = this.state;
    if (s.chickens.eggs <= 0) return this.toast('鸡窝里还没有蛋，再等等。');
    if (!this.spend(ACTIONS.collect.min, ACTIONS.collect.energy, 2)) return;
    const n = s.chickens.eggs;
    s.inventory.egg = (s.inventory.egg ?? 0) + n;
    s.meta.egg = { fresh: 100, quality: 2 };
    s.chickens.eggs = 0;
    this.sound('harvest');
    this.toast(`从草窝里捡到 ${n} 个温热的鸡蛋。`, 'good');
    this.commit();
  }

  feedPig() {
    const s = this.state;
    if (s.pig.fed) return this.toast('猪已经吃饱了，正躺在地上打呼噜。');
    if ((s.inventory.feed ?? 0) <= 0) return this.toast('没有饲料了，去小卖部买一点吧。', 'warn');
    if (!this.spend(ACTIONS.feed.min, ACTIONS.feed.energy, 5)) return;
    s.inventory.feed -= 1;
    s.pig.fed = true;
    s.pig.manure += 1;
    s.mood = clamp(s.mood + 4);
    this.exposure(0.3);
    this.sound('feed');
    this.toast('猪食倒进槽里，它哼哧哼哧吃得欢，明天能清出一份肥料。', 'good');
    this.completeQuest('feed');
    this.commit();
  }

  cleanYard() {
    const s = this.state;
    if (s.yardClean >= 98) return this.toast('院子已经很干净了，扫帚都可以歇会儿。');
    if (!this.spend(ACTIONS.clean.min, ACTIONS.clean.energy, 9)) return;
    s.yardClean = 100;
    s.pig.manure += 1;
    s.mood = clamp(s.mood + 5);
    this.exposure(0.4);
    this.toast('扫掉落叶和尘土，院子又清爽了，还清出一份肥料。不过自己身上也落了灰。', 'good');
    this.commit();
  }

  collectManure() {
    const s = this.state;
    if (s.pig.manure <= 0) return this.toast('猪圈里暂时没有可清的厩肥。');
    if (!this.spend(ACTIONS.collect.min, ACTIONS.collect.energy, 7)) return;
    const n = s.pig.manure;
    s.pig.manure = 0;
    s.inventory.fertilizer = (s.inventory.fertilizer ?? 0) + n;
    this.sound('harvest');
    this.toast(`清出 ${n} 份厩肥，收进了农具棚。`, 'good');
    this.commit();
  }

  rest() {
    if (!this.spend(ACTIONS.rest.min, ACTIONS.rest.energy)) return;
    this.state.energy = clamp(this.state.energy + 8);
    this.state.mood = clamp(this.state.mood + 4);
    this.state.hunger = clamp(this.state.hunger + 4);
    this.state.hygiene = clamp(this.state.hygiene - 2);
    this.sound('page');
    this.toast('在井边坐了一会儿，晒着太阳，力气回来了一点。', 'good');
    this.commit();
  }

  /* ---------- 村口 ---------- */
  stroll() {
    if (!this.spend(ACTIONS.stroll.min, ACTIONS.stroll.energy, 3)) return;
    this.state.mood = clamp(this.state.mood + 12);
    this.exposure(0.5);
    this.sound('page');
    this.toast('沿着村口慢慢走了一圈，风里有稻草和花的气味，心情好多了。', 'good');
    this.commit();
  }

  lookClouds() {
    if (!this.spend(ACTIONS.stroll.min, ACTIONS.stroll.energy, 1)) return;
    this.state.mood = clamp(this.state.mood + 10);
    this.exposure(0.4);
    this.sound('page');
    const tomorrow = WEATHER_INFO[this.state.tomorrowWeather];
    this.toast(`云从山那边慢慢飘过来。看云的老人说，明天多半是${tomorrow.label}。`, 'good');
    this.commit();
  }

  /** 采野菜：没钱没料时的保底活路，收益低但不会卡死 */
  forage() {
    const s = this.state;
    if (!this.fieldOpen()) return;
    if (!this.spend(ACTIONS.forage.min, ACTIONS.forage.energy, 4)) return;
    s.inventory.wildgreens = (s.inventory.wildgreens ?? 0) + ECON.forage.yield;
    s.mood = clamp(s.mood + 3);
    this.sound('harvest');
    this.toast(`蹲在田埂上挑了一把野菜。卖不了几个钱，但能煮一锅汤，饿不着。`, 'good');
    this.commit();
  }

  /** 帮阿婆干活：时间换点零钱，一天一次，属于下策 */
  helpNeighbor() {
    const s = this.state;
    if (s.helpedToday) {
      this.toast('今天已经帮阿婆干过活了，她也得歇歇。明天再来吧。');
      return;
    }
    if (!this.spend(ACTIONS.help.min, ACTIONS.help.energy, 6)) return;
    const [lo, hi] = ECON.help.coins;
    const coins = lo + Math.floor(Math.random() * (hi - lo + 1));
    s.coins += coins;
    s.helpedToday = true;
    s.npcs.grandma.points += 1;
    if (Math.random() < ECON.help.saltChance) {
      s.inventory.salt = (s.inventory.salt ?? 0) + 1;
      this.toast(`帮阿婆把柴火码好，她塞给你 ${coins} 文，还抓了一把盐放进你口袋。`, 'good');
    } else {
      this.toast(`帮阿婆把柴火码好、水缸挑满，她塞给你 ${coins} 文。`, 'good');
    }
    this.sound('coin');
    this.commit();
  }

  talk(npcId: NpcId): string {
    const s = this.state;
    const npc = NPCS[npcId];
    if (!this.spend(ACTIONS.talk.min, ACTIONS.talk.energy, 1)) return '……';
    const firstToday = s.npcs[npcId].lastTalkDay !== s.day;
    s.npcs[npcId].lastTalkDay = s.day;
    s.npcs[npcId].points += firstToday ? 1 : 0;
    s.mood = clamp(s.mood + (firstToday ? 8 : 3));
    this.exposure(0.4);
    if (firstToday) this.completeQuest('talk');
    this.commit();
    return rand(npc.lines);
  }

  hearts(npcId: NpcId) {
    return Math.min(5, Math.floor(this.state.npcs[npcId].points / 3));
  }

  gift(npcId: NpcId, dishIndex: number): boolean {
    const s = this.state;
    const dish = s.dishes[dishIndex];
    if (!dish) return false;
    if (!this.spend(ACTIONS.gift.min, ACTIONS.gift.energy)) return false;
    s.dishes.splice(dishIndex, 1);
    s.npcs[npcId].points += 2;
    s.mood = clamp(s.mood + 4);
    const npc = NPCS[npcId];
    this.toast(`${npc.name}收下了${dish.name}，笑得眼睛都弯了。`, 'good');
    this.sound('success');
    if (this.hearts(npcId) >= 3 && !s.discovered.recipes.includes(`gift_${npcId}`)) {
      s.discovered.recipes.push(`gift_${npcId}`);
    }
    this.commit();
    return true;
  }

  beginCards(): boolean {
    if (!this.spend(ACTIONS.card.min, ACTIONS.card.energy, 2)) return false;
    this.exposure(0.2);
    this.commit();
    return true;
  }

  resolveCards(win: boolean): number {
    const s = this.state;
    const bet = s.coins >= 10 ? 10 : 0;
    if (win) {
      s.coins += bet;
      s.mood = clamp(s.mood + 10);
      s.npcs.girl.points += 1;
      this.sound('success');
      this.toast(bet > 0 ? `赢了小满 ${bet} 文，她嚷嚷着要再来一局。` : '赢了一局，小满不服气地洗着牌。', 'good');
    } else {
      s.coins = Math.max(0, s.coins - bet);
      s.mood = clamp(s.mood + 5);
      this.sound('fail');
      this.toast(bet > 0 ? `输了 ${bet} 文，不过打牌本身就挺开心。` : '输了，小满笑得可响了。');
    }
    this.commit();
    return bet;
  }

  beginFishing(): boolean {
    if (!this.spend(ACTIONS.fish.min, ACTIONS.fish.energy, 4)) return false;
    this.exposure(0.8);
    this.commit();
    return true;
  }

  resolveFishing(successes: number): string | null {
    const s = this.state;
    s.mood = clamp(s.mood + 8);
    let fishId: string | null = null;
    if (successes >= 3) {
      const roll = Math.random();
      fishId = roll < 0.18 ? 'fish_carp' : roll < 0.55 ? 'fish_grass' : 'fish_crucian';
    } else if (successes === 2) {
      fishId = Math.random() < 0.8 ? 'fish_crucian' : 'fish_grass';
    } else if (successes === 1) {
      fishId = Math.random() < 0.45 ? 'fish_crucian' : null;
    }
    if (fishId) {
      s.inventory[fishId] = (s.inventory[fishId] ?? 0) + 1;
      s.meta[fishId] = { fresh: 100, quality: successes >= 3 ? 3 : 2 };
      s.counters.fish += 1;
      this.discover('fish', fishId);
      this.sound('success');
      this.toast(`钓到了${ITEMS[fishId].icon} ${ITEMS[fishId].name}！`, 'good');
    } else {
      this.sound('fail');
      this.toast('水面静悄悄的，鱼都跑掉了，不过吹吹风也挺好。');
    }
    this.commit();
    return fishId;
  }

  /* ---------- 调料 ---------- */
  /** 某份菜谱要用的调料明细（数据来自 RECIPES.seasoning / economy 的预设） */
  seasoningOf(recipe: Recipe): Record<string, number> {
    const out: Record<string, number> = {};
    Object.entries(recipe.seasoning ?? {}).forEach(([id, n]) => {
      if (typeof n === 'number') out[id] = n;
    });
    return out;
  }

  /** 检查调料够不够，返回缺什么、缺多少（界面直接用这个说人话） */
  seasoningCheck(recipe: Recipe) {
    const s = this.state;
    const missing: { id: string; name: string; need: number; have: number }[] = [];
    Object.entries(this.seasoningOf(recipe)).forEach(([id, need]) => {
      const have = s.inventory[id] ?? 0;
      if (have < need) missing.push({ id, name: ITEMS[id]?.name ?? id, need, have });
    });
    return { ok: missing.length === 0, missing };
  }

  /** 打开橱柜发现缺料时的生活化提示 */
  private cabinetHint(missing: { name: string; need: number; have: number }[]) {
    const text = missing.map((m) => `${m.name}还差 ${m.need - m.have}`).join('、');
    this.toast(`打开橱柜看了一眼：${text}。这锅先做不成，去小卖部补一点吧。`, 'warn');
  }

  /* ---------- 做饭 ---------- */
  beginCook(selected: string[]): boolean {
    const s = this.state;
    if (selected.length === 0) return false;
    if (selected.length > 3) return false;
    for (const id of selected) {
      if ((s.inventory[id] ?? 0) <= 0) {
        this.toast('有食材不够了，再看看冰箱。', 'warn');
        return false;
      }
    }
    if (this.isStuffed()) {
      this.toast('肚子还撑着呢，等消化一会儿再做下一顿吧。', 'warn');
      return false;
    }
    // 调料不够就不下锅（先看橱柜，不走时间）
    const recipe = matchRecipe(selected)?.recipe ?? DARK_DISH;
    const cabinet = this.seasoningCheck(recipe);
    if (!cabinet.ok) {
      this.cabinetHint(cabinet.missing);
      return false;
    }
    if (!this.spend(ACTIONS.cook.min, ACTIONS.cook.energy)) return false;
    selected.forEach((id) => { s.inventory[id] -= 1; });
    Object.entries(this.seasoningOf(recipe)).forEach(([id, n]) => {
      s.inventory[id] = (s.inventory[id] ?? 0) - n;
    });
    this.sound('cook');
    this.commit();
    return true;
  }

  finishCook(selected: string[], gaugeScore: number): CookResult {
    const s = this.state;
    const matched = matchRecipe(selected);
    let stars = gaugeScore >= 0.86 ? 3 : gaugeScore >= 0.55 ? 2 : 1;
    let recipe = matched?.recipe ?? DARK_DISH;
    if (matched && !matched.exact) stars = Math.max(1, stars - 1);
    const dark = !matched;
    if (dark) recipe = DARK_DISH;
    const foodFactor = stars === 3 ? 1.1 : stars === 2 ? 1 : 0.9;
    const moodFactor = stars === 3 ? 1.5 : stars === 2 ? 1.15 : 0.85;
    const dish: Dish = {
      recipeId: recipe.id,
      name: recipe.name,
      icon: recipe.icon,
      stars,
      food: Math.round(recipe.food * foodFactor),
      mood: Math.round(recipe.mood * moodFactor),
      price: Math.round(recipe.price * (stars === 3 ? 1.25 : stars === 2 ? 1 : 0.85)),
      kind: 'dish',
    };
    s.dishes.push(dish);
    s.counters.cooked += 1;
    if (!dark) {
      this.discover('recipes', recipe.id);
      this.completeQuest('cook');
      this.sound('success');
    } else {
      this.sound('fail');
    }
    this.commit();
    return { recipe, stars, dark, dish };
  }

  eatDish(index: number): Dish | null {
    const s = this.state;
    const dish = s.dishes[index];
    if (!dish) return null;
    if (dish.kind === 'drink') return this.drinkDish(index);
    if (this.isStuffed()) {
      this.toast('肚子还撑着呢，先缓一缓再吃。', 'warn');
      return null;
    }
    if (!this.spend(ACTIONS.eat.min, ACTIONS.eat.energy)) return null;
    s.dishes.splice(index, 1);
    s.hunger = clamp(s.hunger + dish.food);
    s.mood = clamp(s.mood + Math.max(0, dish.mood));
    s.energy = clamp(s.energy + 8);
    s.mealsToday += 1;
    if (s.hunger >= 92) {
      s.stuffedUntil = this.now() + 180;
      s.mood = clamp(s.mood - 6);
      this.toast(`吃得有点撑了……${dish.name}很香，但下一顿得等肚子缓过来。`, 'warn');
    } else {
      this.toast(`吃掉了${dish.icon} ${dish.name}，饥饿 +${dish.food}，心情 +${dish.mood}。`, 'good');
    }
    this.sound('success');
    this.commit();
    return dish;
  }

  /** 做饮品：耗原料 + 耗调料 + 花时间，结果进同一个饭篮 */
  brew(recipeId: string): CookResult | null {
    const s = this.state;
    const recipe = DRINKS.find((r) => r.id === recipeId);
    if (!recipe) return null;
    if (this.isStuffed()) {
      this.toast('肚子还撑着，喝不下什么了。', 'warn');
      return null;
    }
    const lack = recipe.need.find((id) => (s.inventory[id] ?? 0) <= 0);
    if (lack) {
      this.toast(`${ITEMS[lack].name}没有了，做不成这杯。`, 'warn');
      return null;
    }
    const cabinet = this.seasoningCheck(recipe);
    if (!cabinet.ok) {
      this.cabinetHint(cabinet.missing);
      return null;
    }
    if (!this.spend(ACTIONS.brew.min, ACTIONS.brew.energy)) return null;
    recipe.need.forEach((id) => { s.inventory[id] = (s.inventory[id] ?? 0) - 1; });
    Object.entries(this.seasoningOf(recipe)).forEach(([id, n]) => {
      s.inventory[id] = (s.inventory[id] ?? 0) - n;
    });
    const stars = Math.random() < 0.3 ? 3 : 2;
    const dish: Dish = {
      recipeId: recipe.id,
      name: recipe.name,
      icon: recipe.icon,
      stars,
      food: recipe.food,
      mood: stars === 3 ? Math.round(recipe.mood * 1.3) : recipe.mood,
      price: Math.round(recipe.price * (stars === 3 ? 1.2 : 1)),
      kind: 'drink',
    };
    s.dishes.push(dish);
    s.counters.cooked += 1;
    this.discover('recipes', recipe.id);
    this.sound('water');
    this.toast(`沏好了${recipe.icon} ${recipe.name}，${stars === 3 ? '味道恰到好处。' : '先放着，随时能喝。'}`, 'good');
    this.commit();
    return { recipe, stars, dark: false, dish };
  }

  /** 喝饮品：饱腹很小、心情加成明显，不计入「今天第几顿饭」 */
  drinkDish(index: number): Dish | null {
    const s = this.state;
    const dish = s.dishes[index];
    if (!dish || dish.kind !== 'drink') return null;
    if (this.isStuffed()) {
      this.toast('肚子还撑着，等一会儿再喝吧。', 'warn');
      return null;
    }
    if (!this.spend(ACTIONS.eat.min, 0)) return null;
    const over = s.drinksToday >= ECON.drinksSoftLimit;
    s.dishes.splice(index, 1);
    s.hunger = clamp(s.hunger + (over ? Math.round(dish.food * 0.4) : dish.food));
    s.mood = clamp(s.mood + (over ? 3 : dish.mood));
    s.drinksToday += 1;
    this.sound('water');
    if (over) {
      this.toast(`又喝了一杯${dish.name}，肚子有点水了。正经饭还是要吃的。`, 'warn');
    } else {
      this.toast(`喝下${dish.icon} ${dish.name}，心情 +${dish.mood}。垫了一下，但顶不了一顿饭。`, 'good');
    }
    this.commit();
    return dish;
  }

  sellDish(index: number): number {
    const s = this.state;
    const dish = s.dishes[index];
    if (!dish) return 0;
    s.dishes.splice(index, 1);
    s.coins += dish.price;
    this.sound('coin');
    this.toast(`把${dish.name}卖给了小卖部，+${dish.price} 文。`, 'good');
    this.commit();
    return dish.price;
  }

  /* ---------- 清洁 / 健康 ---------- */
  washFace() {
    if (!this.spend(ACTIONS.washFace.min, ACTIONS.washFace.energy)) return;
    this.state.hygiene = clamp(this.state.hygiene + 10);
    this.state.mood = clamp(this.state.mood + 2);
    this.sound('water');
    this.toast('用凉水拍了拍脸，人清醒了些，脸上的泥也洗掉了。');
    this.commit();
  }

  washClothes() {
    if (!this.spend(ACTIONS.washClothes.min, ACTIONS.washClothes.energy)) return;
    this.state.hygiene = clamp(this.state.hygiene + 26);
    this.state.mood = clamp(this.state.mood + 2);
    this.sound('water');
    this.toast('把沾了泥的衣裳搓洗干净，晾在竹竿上，闻起来是皂角味。', 'good');
    this.commit();
  }

  takeBath(location: 'home' | 'well' | 'stream'): boolean {
    if (!this.spend(ACTIONS.bath.min, ACTIONS.bath.energy)) return false;
    const bonus = location === 'stream' ? 8 : location === 'well' ? 4 : 0;
    const s = this.state;
    s.hygiene = clamp(s.hygiene + 55 + bonus);
    s.health = clamp(s.health + 5);
    s.mood = clamp(s.mood + 8);
    this.sound('water');
    this.toast(
      location === 'stream'
        ? '在溪水里泡了一会儿，凉丝丝的，浑身的疲惫都被冲走了。'
        : location === 'well'
          ? '打了几桶井水冲洗干净，水汽在太阳底下散开。'
          : '烧了一锅热水，关起门来好好洗了个澡，整个人都松快了。',
      'good',
    );
    this.commit();
    return true;
  }

  takeMedicine(): boolean {
    const s = this.state;
    if (s.cold <= 0) {
      this.toast('没有感冒，不用吃药。药还是留着备用吧。');
      return false;
    }
    if (s.medicineToday >= 2) {
      this.toast('今天已经吃过两次药了，按方子来，别贪多。', 'warn');
      return false;
    }
    if ((s.inventory.medicine ?? 0) <= 0) {
      this.toast('药箱空了，去村口小卖部买一盒吧。', 'warn');
      return false;
    }
    if (!this.spend(ACTIONS.medicine.min, ACTIONS.medicine.energy)) return false;
    s.inventory.medicine -= 1;
    s.medicineToday += 1;
    s.cold = Math.max(0, s.cold - 35);
    s.health = clamp(s.health + 4);
    this.sound('page');
    if (s.cold <= 0) {
      this.toast('药见效了，鼻子通了，身子轻快不少。', 'good');
    } else {
      this.toast(`吃过药，感冒缓了一些。今天第 ${s.medicineToday}/2 次。`, 'good');
    }
    this.commit();
    return true;
  }

  drinkTea(): boolean {
    const s = this.state;
    if ((s.inventory.tea ?? 0) <= 0) {
      this.toast('茶叶罐空了，小卖部有卖。', 'warn');
      return false;
    }
    if (!this.spend(ACTIONS.tea.min, ACTIONS.tea.energy)) return false;
    s.inventory.tea -= 1;
    s.mood = clamp(s.mood + 10);
    s.hygiene = clamp(s.hygiene + 2);
    this.sound('page');
    this.toast('泡了一壶热茶，看茶叶慢慢舒展开，心也跟着静下来。', 'good');
    this.commit();
    return true;
  }

  /* ---------- 商店 ---------- */
  priceFor(id: string): number {
    const def = ITEMS[id];
    if (!def) return 0;
    const m = this.state.meta[id];
    if (!m) return def.sell;
    const freshF = 0.55 + Math.min(100, m.fresh) / 220;
    const qF = 1 + (m.quality - 1) * 0.18;
    return Math.max(1, Math.round(def.sell * freshF * qF));
  }

  buy(id: string, qty = 1): boolean {
    const s = this.state;
    const def = ITEMS[id];
    if (!def || !def.buy) return false;
    const n = Math.max(1, Math.min(ECON.batchMax, Math.floor(qty)));
    const stock = s.stock[id] ?? 0;
    if (stock < n) {
      this.toast(`小卖部今天只剩 ${stock} 份${def.name}了，明天再来吧。`, 'warn');
      return false;
    }
    const total = def.buy * n;
    if (s.coins < total) {
      const gap = total - s.coins;
      this.toast(`钱不够：${def.name}×${n} 要 ${total} 文，还差 ${gap} 文。先卖点鸡蛋或菜吧。`, 'warn');
      this.sound('fail');
      return false;
    }
    s.coins -= total;
    s.stock[id] = stock - n;
    s.inventory[id] = (s.inventory[id] ?? 0) + n;
    this.sound('coin');
    this.toast(`买了 ${def.icon} ${def.name} ×${n}，花了 ${total} 文，还剩 ${s.coins} 文。`);
    this.commit();
    return true;
  }

  sell(id: string, qty = 1): boolean {
    const s = this.state;
    const def = ITEMS[id];
    if (!def || def.sell <= 0) return false;
    const n = Math.max(1, Math.min(ECON.batchMax, Math.floor(qty)));
    const have = s.inventory[id] ?? 0;
    if (have < n) {
      this.toast(`只有 ${have} 份${def.name}可卖。`, 'warn');
      return false;
    }
    const unit = this.priceFor(id);
    const total = unit * n;
    s.inventory[id] -= n;
    s.coins += total;
    s.salesToday += total;
    s.stock[id] = (s.stock[id] ?? 0) + n;
    this.sound('coin');
    this.toast(`卖出 ${def.icon} ${def.name} ×${n}，+${total} 文（今日共卖 ${s.salesToday} 文）。`, 'good');
    this.commit();
    return true;
  }

  /* ---------- 睡觉 / 新的一天 ---------- */
  sleep(): SleepSummary {
    const s = this.state;
    const medsTaken = s.medicineToday;
    const summary: SleepSummary = {
      day: s.day + 1,
      coins: s.coins,
      harvest: s.counters.harvest,
      cooked: s.counters.cooked,
      fish: s.counters.fish,
      questDone: QUESTS.filter((q) => s.quests[q.key]).length,
      meals: s.mealsToday,
      nextWeather: s.tomorrowWeather,
      health: s.health,
      hygiene: s.hygiene,
      cold: s.cold,
      sales: s.salesToday,
    };
    s.day += 1;
    s.minutes = 6 * 60;
    s.weather = s.tomorrowWeather;
    s.tomorrowWeather = this.rollWeather();
    summary.nextWeather = s.weather;

    // 夜间身体结算
    s.hunger = clamp(s.hunger - 7, 15, 100);
    s.hygiene = clamp(s.hygiene - (4 + (s.cold > 0 ? 3 : 0)));
    if (s.hygiene < 30) {
      s.health = clamp(s.health - 5);
      s.mood = clamp(s.mood - 5);
    } else {
      s.health = clamp(s.health + 2);
    }
    if (s.hunger < 22) s.health = clamp(s.health - 3);
    if (s.cold > 0) {
      if (s.medicineToday < 2) {
        s.cold = clamp(s.cold + 8);
        s.health = clamp(s.health - 4);
        s.mood = clamp(s.mood - 4);
      } else {
        s.cold = Math.max(0, s.cold - 12);
        s.health = clamp(s.health + 2);
        if (s.cold <= 0) summary.cold = 0;
      }
      summary.cold = s.cold;
    }
    s.energy = 100;
    if (s.mealsToday >= 3) {
      s.mood = clamp(s.mood + 3);
      s.health = clamp(s.health + 2);
    } else if (s.mealsToday <= 1) {
      s.mood = clamp(s.mood - 4);
      s.health = clamp(s.health - 2);
    }
    s.mood = clamp(s.mood + (s.yardClean < 40 ? -6 : 2));
    s.yardClean = clamp(s.yardClean - 18);
    s.mealsToday = 0;
    s.drinksToday = 0;
    s.salesToday = 0;
    s.helpedToday = false;
    s.medicineToday = 0;
    s.stuffedUntil = 0;

    s.plots.forEach((p) => {
      if (!p.crop) { p.watered = false; return; }
      const crop = CROPS[p.crop];
      const mature = p.stage >= crop.growDays;
      if (!mature) {
        if (!p.pest && !p.weed && p.watered) {
          p.stage = Math.min(crop.growDays, p.stage + 1);
          p.watered = false;
        } else if (!p.watered && !p.weed && Math.random() < 0.28) {
          p.weed = true;
        }
        if (p.stage > 0 && Math.random() < (s.weather === 'storm' ? 0.25 : 0.12)) p.pest = true;
      }
      if (s.weather === 'rain' || s.weather === 'storm') p.watered = true;
    });

    if (s.chickens.fed) { s.chickens.eggs += 2; s.chickens.fed = false; }
    if (s.pig.fed) { s.pig.manure += 1; s.pig.fed = false; }

    // 农产品的 freshness 随时间下降
    Object.keys(s.meta).forEach((id) => {
      const m = s.meta[id];
      if (m) m.fresh = clamp(m.fresh - 10, 0, 100);
    });

    s.stock = createStock();
    s.quests = { cook: false, harvest: false, feed: false, talk: false };
    summary.health = s.health;
    summary.hygiene = s.hygiene;
    summary.cold = s.cold;
    if (s.cold > 0 && medsTaken === 0) this.toast('夜里咳了几声，感冒还没好。记得按时吃药。', 'warn');
    this.sound('sleep');
    this.commit();
    return summary;
  }

  private rollWeather(): Weather {
    const r = Math.random();
    if (r < 0.42) return 'sunny';
    if (r < 0.68) return 'cloudy';
    if (r < 0.84) return 'rain';
    if (r < 0.92) return 'storm';
    return 'fog';
  }

  forecast() {
    return {
      today: WEATHER_INFO[this.state.weather],
      tomorrow: WEATHER_INFO[this.state.tomorrowWeather],
      tomorrowKey: this.state.tomorrowWeather,
    };
  }

  /* ---------- 调试 / 其他 ---------- */
  weatherInfo() {
    return WEATHER_INFO[this.state.weather];
  }

  isNight() {
    return this.state.minutes >= 19 * 60;
  }

  reset() {
    this.state = createInitialState();
    this.commit();
  }

  recipeList() {
    return RECIPES;
  }
}

export { NPCS, ITEMS, CROPS, RECIPES };
