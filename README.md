# 晚风小院 · 田园生活

宫崎骏式治愈田园生活游戏。做饭、种菜、喂鸡喂猪、赶集、串门、钓鱼、打牌，
一整天从晨光过到夜里睡觉；纯客户端运行，可静态导出后套 Tauri 做桌面版。

美术基准取自 `D:\sucai\out img` 那批参考图，风格规范见 [ART_DIRECTION.md](./ART_DIRECTION.md)。

## 运行

前置：Node.js（本机用的是 v16.20.2，因此 Next 锁定在 13.5.6；若升到 Node 18+ 可自行升级 Next）。

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

其它命令：

```bash
npm run build     # 静态导出，产物在 out/
npm run preview   # 本地预览 out/（npx serve out）
```

## 目录结构

```
app/                     Next App Router（layout.tsx / page.tsx / globals.css 视觉系统）
components/
  GameClient.tsx         标题页 + 主场景 + 弹层路由 + HUD
  ClickFX.tsx            全局点击反馈（水波纹 + 一声轻响）
  Petals.tsx             花瓣粒子
  Plant.tsx              地块里的作物 SVG
  panels/                菜园、灶台、商店、牌桌、钓鱼、清洗、收音机、身体、鸡舍、猪圈…
lib/
  data.ts                作物/菜谱/物品/NPC/场景热区/天气/初始存档
  engine.ts              玩法引擎（时间、体力、饥饿、心情、清洁、健康、感冒、经济、睡觉结算）
  types.ts               状态结构
  save.ts                localStorage 存档与旧档补全
  audio.ts               现场合成的音效
  music.ts               背景音乐（首次交互后淡入）
public/assets/           场景图、立绘、BGM（guxiang.mp3）
```

## 玩法与数值（日循环）

- **饥饿 / 做饭**：一天两顿保底、三顿最舒服；吃太饱会「吃撑」，行动变慢且短时间不能再吃。
  灶台选 1–3 样食材，火候指针落在绿色区间决定星级，好菜心情加成更高。
- **清洁 / 健康**：下地干活脏得快，脏到一定程度掉心情、掉健康；洗脸应急、洗衣去脏、
  洗澡最彻底但更花时间与水。家里水缸 / 井边 / 村口溪流三个地点。
- **每日天气**：晴、阴、小雨、雷雨、雾。雷雨不能下地；淋雨掉清洁和健康，可能感冒；
  感冒要一天两次、连吃几天药，否则恶化。收音机与看云可提前一天知道天气。
- **金币经济**：卖鸡蛋、菜、鱼，品质与新鲜度影响价格；买米面油盐酱醋茶、种子、农资、药品。
  早期靠鸡蛋蔬菜起步，买药和调味料是要紧开销。
- **心情 / 体力**：聊天、送菜、溜达、打牌、钓鱼、看云、泡茶都能回心情；体力靠吃和歇息。

睡觉时按当天吃饭顿数、清洁、感冒状况结算，并把新鲜度往下掉一天。

存档：`localStorage` 键名 `wanfeng-yard-save-v1`，音效开关 `wanfeng-sound`，音乐开关 `wanfeng-music`。

## 调料、饮品与数值配置

- 调料（油/盐/糖/醋/蜂蜜/清水）是独立库存，做菜时按菜谱自动消耗；不同的菜配方不同，
  清炒耗油盐、糖醋耗糖醋、腌制重盐，饮品只耗糖/蜂蜜/水。
- 调料不够时会在灶台提示「橱柜里还差…」，并禁止下锅，但不会白扣时间。
- 饮品复用同一套 `Recipe` 数据（`kind: 'drink'`），饱腹很低、心情加成高，不计入「今天第几顿饭」，
  喝多了收益递减，不能靠它顶正餐。
- 价格、库存、调料预设、时间成本都集中在 [lib/economy.ts](./lib/economy.ts)，调数值只改这一处。
- 防死局：田埂可采野菜、每天可帮阿婆干活换点零钱（偶尔还给一把盐），保证没钱没料时仍有活路。

## UI 插画

- 大图放在 `public/assets/ui/`，统一 512×512、奶油底、左上光照，按 id 登记在
  [lib/art.ts](./lib/art.ts)；界面用 `<ArtThumb>` 按 id 取图，缺图会显示同风格占位并在控制台
  打出缺失文件路径，不会出现白框。
- 菜谱、商店、背包、饭篮、图鉴、饮品都是插画卡片布局。

## 交互反馈与音频

- 所有按钮、场景热区、卡片、页签都自动带水波纹 + 一声轻响（`components/ClickFX.tsx`，
  document 级监听，无需逐处手写；波纹颜色随当前场景的浅色调变化）。
- 音效用 Web Audio 现场合成（`lib/audio.ts`），不依赖音频素材。
- 背景音乐为 `public/assets/bgm/guxiang.mp3`（《故乡的原风景》），循环播放、音量 0.3 左右，
  浏览器禁止自动播放，所以等玩家首次点击/按键后淡入；顶栏 `♫` 开关，状态记忆在本地。

## 将来套 Tauri（现在不用装）

1. 先确认静态导出可用：

   ```bash
   npm run build
   ```

   产物 `out/` 下应有 `index.html` 和 `assets/`，直接用浏览器打开 `out/index.html` 也应能玩
   （资源用的是相对路径，没有写死 localhost）。

2. 在项目根目录加壳（只需新增 `src-tauri`，不动现有前端）：

   ```bash
   npm i -D @tauri-apps/cli
   npx tauri init
   ```

   交互式回答时：
   - frontend dist：`../out`
   - dev url：`http://localhost:3000`
   - dev command：`npm run dev`
   - build command：`npm run build`

3. `src-tauri/tauri.conf.json` 关键项：

   ```json
   {
     "build": {
       "beforeDevCommand": "npm run dev",
       "beforeBuildCommand": "npm run build",
       "devUrl": "http://localhost:3000",
       "frontendDist": "../out"
     },
     "app": {
       "windows": [{ "title": "晚风小院", "width": 1280, "height": 800, "resizable": true }]
     }
   }
   ```

4. 开发/打包：

   ```bash
   npx tauri dev     # 桌面上起窗口，前端仍是 next dev
   npx tauri build   # 产出安装包
   ```

要留意的坑：

- **必须 `output: 'export'`**：项目已经配好（`next.config.mjs`），否则 Tauri 找不到可放的静态产物；
  也因此不要引入 API Route / Server Action / 依赖服务端渲染的功能。
- **路径**：生产构建时 `assetPrefix: './'`，所以 `assets/...` 这类相对路径在 `file://` 下也能加载；
  新加图片请继续放 `public/assets/`，代码里用相对路径引用。
- **不要用 `next/image` 的优化服务**：已设 `images.unoptimized: true`。
- **端口**：`devUrl` 与 `npm run dev` 的端口保持一致（默认 3000）。
- **Node 版本**：Tauri CLI 与 Next 都建议 Node 18+；本机当前是 16，先用 13.5.6 跑通，之后可整体升级。
- **窗口比例**：游戏是 16:9 舞台布局，窗口尺寸建议 1280×800 或 1600×900。
- **音乐**：BGM 放在 `public/assets/bgm/`，打包后会进 `out/assets/bgm/`，不会引用外部绝对路径。

## 素材说明

- `D:\sucai\out img` 的参考帧未搬到项目里，只把实际用到的裁切画面放进 `public/assets`；
  其余场景（院子、村口、池塘、灶台、人物立绘等）按同一套风格生成后同样放在这里。
