/**
 * UI 插画 manifest：游戏里统一按 id 取图，缺图时返回 undefined，
 * 由 <ArtThumb> 渲染同风格占位（不会出现白框）。
 * 新增图片只需在这里登记，文件放 public/assets/ui/。
 *
 * 全部大图按 ART_DIRECTION.md 统一规格生成：1920×1920、奶油纸底、
 * 左上 35° 暖光、右下投影、单主体居中留白。
 */
export const ART: Record<string, string> = {
  // ── 作物成品 ──
  'crop.tomato.fruit': 'assets/ui/crop_tomato_fruit.jpg',
  'crop.potato.fruit': 'assets/ui/crop_potato_fruit.jpg',
  'crop.cabbage.fruit': 'assets/ui/crop_cabbage_fruit.jpg',
  'crop.carrot.fruit': 'assets/ui/crop_carrot_fruit.jpg',
  'crop.corn.fruit': 'assets/ui/crop_corn_fruit.jpg',
  'crop.pumpkin.fruit': 'assets/ui/crop_pumpkin_fruit.jpg',
  'crop.rapeseed.fruit': 'assets/ui/crop_rapeseed_fruit.jpg',

  // ── 作物生长阶段（幼苗 / 生长中 / 结实 / 可收获，同一株连续生长）──
  'crop.tomato.s1': 'assets/ui/crop_tomato_s1.jpg',
  'crop.tomato.s2': 'assets/ui/crop_tomato_s2.jpg',
  'crop.tomato.s3': 'assets/ui/crop_tomato_s3.jpg',
  'crop.tomato.s4': 'assets/ui/crop_tomato_s4.jpg',
  'crop.potato.s1': 'assets/ui/crop_potato_s1.jpg',
  'crop.potato.s2': 'assets/ui/crop_potato_s2.jpg',
  'crop.potato.s3': 'assets/ui/crop_potato_s3.jpg',
  'crop.potato.s4': 'assets/ui/crop_potato_s4.jpg',
  'crop.cabbage.s1': 'assets/ui/crop_cabbage_s1.jpg',
  'crop.cabbage.s2': 'assets/ui/crop_cabbage_s2.jpg',
  'crop.cabbage.s3': 'assets/ui/crop_cabbage_s3.jpg',
  'crop.cabbage.s4': 'assets/ui/crop_cabbage_s4.jpg',
  'crop.carrot.s1': 'assets/ui/crop_carrot_s1.jpg',
  'crop.carrot.s2': 'assets/ui/crop_carrot_s2.jpg',
  'crop.carrot.s3': 'assets/ui/crop_carrot_s3.jpg',
  'crop.carrot.s4': 'assets/ui/crop_carrot_s4.jpg',
  'crop.corn.s1': 'assets/ui/crop_corn_s1.jpg',
  'crop.corn.s2': 'assets/ui/crop_corn_s2.jpg',
  'crop.corn.s3': 'assets/ui/crop_corn_s3.jpg',
  'crop.corn.s4': 'assets/ui/crop_corn_s4.jpg',
  'crop.pumpkin.s1': 'assets/ui/crop_pumpkin_s1.jpg',
  'crop.pumpkin.s2': 'assets/ui/crop_pumpkin_s2.jpg',
  'crop.pumpkin.s3': 'assets/ui/crop_pumpkin_s3.jpg',
  'crop.pumpkin.s4': 'assets/ui/crop_pumpkin_s4.jpg',
  'crop.rapeseed.s1': 'assets/ui/crop_rapeseed_s1.jpg',
  'crop.rapeseed.s2': 'assets/ui/crop_rapeseed_s2.jpg',
  'crop.rapeseed.s3': 'assets/ui/crop_rapeseed_s3.jpg',
  'crop.rapeseed.s4': 'assets/ui/crop_rapeseed_s4.jpg',

  // ── 物品（农产 / 鱼 / 小卖部货品 / 药品）──
  'item.rapeseed_oil': 'assets/ui/item_rapeseed_oil.jpg',
  'item.egg': 'assets/ui/item_egg.jpg',
  'item.pork': 'assets/ui/item_pork.jpg',
  'item.tofu': 'assets/ui/item_tofu.jpg',
  'item.rice': 'assets/ui/item_rice.jpg',
  'item.flour': 'assets/ui/item_flour.jpg',
  'item.oil': 'assets/ui/item_oil.jpg',
  'item.feed': 'assets/ui/item_feed.jpg',
  'item.fertilizer': 'assets/ui/item_fertilizer.jpg',
  'item.pesticide': 'assets/ui/item_pesticide.jpg',
  'item.fish_crucian': 'assets/ui/item_fish_crucian.jpg',
  'item.fish_grass': 'assets/ui/item_fish_grass.jpg',
  'item.fish_carp': 'assets/ui/item_fish_carp.jpg',
  'item.salt': 'assets/ui/item_salt.jpg',
  'item.sauce': 'assets/ui/item_sauce.jpg',
  'item.vinegar': 'assets/ui/item_vinegar.jpg',
  'item.sugar': 'assets/ui/item_sugar.jpg',
  'item.honey': 'assets/ui/item_honey.jpg',
  'item.lemon': 'assets/ui/item_lemon.jpg',
  'item.water': 'assets/ui/item_water.jpg',
  'item.wildgreens': 'assets/ui/item_wildgreens.jpg',
  'item.tea': 'assets/ui/item_tea.jpg',
  'item.medicine': 'assets/ui/item_medicine.jpg',

  // ── 种子 ──
  'seed.tomato': 'assets/ui/seed_tomato.jpg',
  'seed.potato': 'assets/ui/seed_potato.jpg',
  'seed.cabbage': 'assets/ui/seed_cabbage.jpg',
  'seed.carrot': 'assets/ui/seed_carrot.jpg',
  'seed.corn': 'assets/ui/seed_corn.jpg',
  'seed.pumpkin': 'assets/ui/seed_pumpkin.jpg',
  'seed.rapeseed': 'assets/ui/seed_rapeseed.jpg',

  // ── 菜谱成品 ──
  'recipe.tomato_egg': 'assets/ui/recipe_tomato_egg.jpg',
  'recipe.potato_pork': 'assets/ui/recipe_potato_pork.jpg',
  'recipe.cabbage_tofu': 'assets/ui/recipe_cabbage_tofu.jpg',
  'recipe.garden_salad': 'assets/ui/recipe_garden_salad.jpg',
  'recipe.corn_soup': 'assets/ui/recipe_corn_soup.jpg',
  'recipe.pumpkin_pie': 'assets/ui/recipe_pumpkin_pie.jpg',
  'recipe.fish_soup': 'assets/ui/recipe_fish_soup.jpg',
  'recipe.rapeseed_stir': 'assets/ui/recipe_rapeseed_stir.jpg',
  'recipe.egg_rice': 'assets/ui/recipe_egg_rice.jpg',
  'recipe.roast_fish': 'assets/ui/recipe_roast_fish.jpg',
  'recipe.tomato_potato_soup': 'assets/ui/recipe_tomato_potato_soup.jpg',
  'recipe.farm_stew': 'assets/ui/recipe_farm_stew.jpg',
  'recipe.braised_carp': 'assets/ui/recipe_braised_carp.jpg',
  'recipe.egg_drop_soup': 'assets/ui/recipe_egg_drop_soup.jpg',
  'recipe.pumpkin_soup': 'assets/ui/recipe_pumpkin_soup.jpg',
  'recipe.wildgreens_soup': 'assets/ui/recipe_wildgreens_soup.jpg',

  // ── 饮品 ──
  'recipe.green_tea': 'assets/ui/recipe_green_tea.jpg',
  'recipe.lemonade': 'assets/ui/recipe_lemonade.jpg',
  'recipe.honey_water': 'assets/ui/recipe_honey_water.jpg',

  // ── 黑暗料理 ──
  'recipe.dark': 'assets/ui/recipe_dark.jpg',
};

const MISSING_LOGGED = new Set<string>();

/** 种子 id 形如 seed_tomato，单独映射 seed.<crop> */
export function itemArt(id: string): string | undefined {
  if (id.startsWith('seed_')) return ART[`seed.${id.slice(5)}`];
  return ART[`crop.${id}.fruit`] ?? ART[`item.${id}`];
}

/** 种子单独取图，id 形如 seed_tomato */
export function seedArt(id: string): string | undefined {
  return ART[`seed.${id.replace(/^seed_/, '')}`];
}

export function recipeArt(id: string): string | undefined {
  return ART[`recipe.${id}`];
}

export function cropStageArt(id: string, stage: 1 | 2 | 3 | 4): string | undefined {
  return ART[`crop.${id}.s${stage}`];
}

/** 缺图时打一次日志，方便后续补图排查 */
export function warnMissingArt(kind: string, id: string) {
  const key = `${kind}:${id}`;
  if (MISSING_LOGGED.has(key)) return;
  MISSING_LOGGED.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[art] 缺图，已用同风格占位：${kind} / ${id}`);
}
