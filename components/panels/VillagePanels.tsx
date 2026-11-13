'use client';
import { useEffect, useRef, useState } from 'react';
import { ITEMS, NPCS, SHOP_FOOD, SHOP_SEASONING, SHOP_SEEDS, SHOP_TOOLS } from '@/lib/data';
import { ECON } from '@/lib/economy';
import type { GameEngine } from '@/lib/engine';
import type { NpcId } from '@/lib/types';
import BgImage from '@/components/BgImage';
import ArtThumb from '@/components/Art';
import { itemArt, recipeArt } from '@/lib/art';
import { reportMissing } from '@/lib/media';

/* ==================== 村民 ==================== */
export function NpcPanel({
  engine, npcId, close, openCards,
}: { engine: GameEngine; npcId: NpcId; close: () => void; openCards: () => void }) {
  const npc = NPCS[npcId];
  const [line, setLine] = useState(npc.intro);
  const [giftOpen, setGiftOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const hearts = engine.hearts(npcId);
  const dishes = engine.state.dishes;

  return (
    <div className="sheet npc-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="npc-hero">
        {imgOk
          ? <img src={npc.img} alt={npc.name} onError={() => { reportMissing(npc.img); setImgOk(false); }} />
          : <div className="npc-img-missing"><span>{npc.name}</span><small>{npc.img}</small></div>}
        <button className="sheet-close" style={{ position: 'absolute', right: 16, top: 16, zIndex: 3 }} onClick={close}>✕</button>
        <div className="npc-hero-tag">
          <b>{npc.name}</b>
          <span>{npc.title}</span>
        </div>
      </div>
      <div className="npc-body">
        <div className="hearts">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`heart ${i <= hearts ? 'on' : 'off'}`}>{i <= hearts ? '♥' : '♡'}</span>
          ))}
          <span style={{ fontSize: 10.5, color: '#9a8168', marginLeft: 6, alignSelf: 'center' }}>
            {hearts >= 5 ? '无话不谈' : hearts >= 3 ? '熟络起来了' : hearts >= 1 ? '点头之交' : '还没说上几句话'}
          </span>
        </div>
        <div className="dialogue">{line}</div>
        {giftOpen ? (
          <div style={{ marginTop: 12 }}>
            <div className="cook-label" style={{ fontSize: 14, marginBottom: 8 }}>送一份自己做的菜</div>
            {dishes.length === 0 ? (
              <div className="bag-empty">饭篮里还没有做好的菜，去厨房做一道吧。</div>
            ) : (
              <div className="dish-list">
                {dishes.map((d, i) => (
                  <div className="dish-row" key={i}>
                    <span className="dr-ico"><ArtThumb src={recipeArt(d.recipeId)} icon={d.icon} alt={d.name} size={46} /></span>
                    <div className="dr-main">
                      <b>{d.name}</b>
                      <span>饥饿 +{d.food} · 心情 +{d.mood}</span>
                    </div>
                    <span className="dr-stars">{'★'.repeat(d.stars)}</span>
                    <button
                      className="btn btn-sm dr-btn"
                      onClick={() => { engine.gift(npcId, i); setGiftOpen(false); close(); }}
                    >
                      送出
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => setGiftOpen(false)}>返回</button>
          </div>
        ) : (
          <div className="npc-actions">
            <button className="btn btn-primary" onClick={() => setLine(engine.talk(npcId))}>聊一会儿 · 20 分钟</button>
            <button className="btn" onClick={() => setGiftOpen(true)}>送一份菜</button>
            {npcId === 'girl' && <button className="btn" onClick={openCards}>打两把牌</button>}
            <button className="btn btn-ghost" onClick={close}>离开</button>
          </div>
        )}
        <div className="farm-tip" style={{ marginTop: 12 }}>
          多和村民聊天、送菜，关系会慢慢变好。每天第一次聊天心情恢复更多。
        </div>
      </div>
    </div>
  );
}

/* ==================== 小卖部 ==================== */
export function ShopPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);
  const s = engine.state;
  const groups: { title: string; ids: string[] }[] = [
    { title: '种子', ids: SHOP_SEEDS },
    { title: '调料货架', ids: SHOP_SEASONING },
    { title: '农资', ids: SHOP_TOOLS },
    { title: '食材', ids: SHOP_FOOD },
  ];
  const sellable = Object.keys(s.inventory).filter((id) => (s.inventory[id] ?? 0) > 0 && ITEMS[id]?.sell > 0);

  return (
    <div className="sheet shop-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🏪</span>村口小卖部</div>
          <div className="sheet-sub">木门上的铃铛一响，阿公就知道你来了</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'buy' ? 'active' : ''}`} onClick={() => setTab('buy')}>买东西</button>
        <button className={`tab ${tab === 'sell' ? 'active' : ''}`} onClick={() => setTab('sell')}>卖收成</button>
        <span className="chip" style={{ marginLeft: 'auto' }}>🪙 {s.coins} 文 · 今日卖出 {s.salesToday} 文</span>
      </div>

      <div className="qty-row">
        <span className="qty-label">一次买卖</span>
        {[1, 2, 3, ECON.batchMax].map((n) => (
          <button key={n} className={`qty-btn ${qty === n ? 'active' : ''}`} onClick={() => setQty(n)}>{n} 份</button>
        ))}
      </div>

      {tab === 'buy' ? (
        <div className="pop-body" style={{ display: 'grid', gap: 14 }}>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="bag-group-title">{g.title}</div>
              <div className="shop-grid">
                {g.ids.map((id) => {
                  const def = ITEMS[id];
                  const stock = s.stock[id] ?? 0;
                  const unit = def.buy ?? 0;
                  const total = unit * qty;
                  const short = s.coins < total ? `还差 ${total - s.coins} 文` : null;
                  return (
                    <button
                      key={id}
                      className="shop-card"
                      disabled={s.coins < total || stock <= 0}
                      onClick={() => engine.buy(id, qty)}
                      title={short ?? undefined}
                    >
                      <span className="sc-badge">库存 {stock}</span>
                      <ArtThumb src={itemArt(id)} icon={def.icon} alt={def.name} size={94} />
                      <b>{def.name}</b>
                      <span className="sc-info">家中 {s.inventory[id] ?? 0}</span>
                      <span className="sc-price">{total} 文{qty > 1 ? <small> · {unit}/份</small> : null}</span>
                      {short && <span className="sc-note">{short}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        sellable.length === 0 ? (
          <div className="empty-note">背包里还没有可以卖的东西，去菜园收获一些吧。</div>
        ) : (
          <div className="shop-grid pop-body">
            {sellable.map((id) => {
              const def = ITEMS[id];
              const meta = s.meta[id];
              const price = engine.priceFor(id);
              const total = price * qty;
              return (
                <button key={id} className="shop-card" onClick={() => engine.sell(id, qty)} title="卖出一批">
                  <span className="sc-badge">持有 {s.inventory[id]}</span>
                  <ArtThumb src={itemArt(id)} icon={def.icon} alt={def.name} size={94} />
                  <b>{def.name}</b>
                  <span className="sc-info">
                    {meta ? `${meta.quality}★ · 新鲜${Math.round(meta.fresh)}` : '当日收成'}
                  </span>
                  <span className="sc-price">+{total} 文</span>
                </button>
              );
            })}
          </div>
        )
      )}

      <div className="farm-foot">
        <div className="farm-tip">
          买东西不额外耗时；卖出是主要的经济来源。品质越好、越新鲜，卖价越高。
          {' '}药材和米面油盐都是要紧的开销，钱不够时得先卖点鸡蛋和菜。
        </div>
        <button className="btn btn-sm" onClick={close}>走了</button>
      </div>
    </div>
  );
}

/* ==================== 打牌 ==================== */
interface Card { rank: number; suit: number }
const SUITS = ['♠', '♥', '♣', '♦'];
const rankText = (r: number) => (r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r));
const drawCard = (): Card => ({ rank: Math.floor(Math.random() * 13) + 1, suit: Math.floor(Math.random() * 4) });
const total = (cards: Card[]) => cards.reduce((a, c) => a + Math.min(10, c.rank), 0);

export function CardsPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [player, setPlayer] = useState<Card[]>([]);
  const [npc, setNpc] = useState<Card[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const start = () => {
    if (!engine.beginCards()) return;
    setPlayer([drawCard(), drawCard()]);
    setNpc([drawCard(), drawCard()]);
    setMsg('小满：来呀，谁先怕谁是小狗。');
    setPhase('playing');
  };

  const finish = (win: boolean) => {
    const bet = engine.resolveCards(win);
    setPhase('done');
    setMsg(win
      ? (bet > 0 ? `你赢了！小满拍着桌子，把 ${bet} 文推了过来。` : '你赢了，小满说下次一定赢回来。')
      : (bet > 0 ? `差一点。${bet} 文进了小满的口袋，她笑得停不下来。` : '这局输了，不过谁也没真在意。'));
  };

  const stand = () => {
    setBusy(true);
    setMsg('小满捏着牌，嘀咕着要不要再抽一张……');
    let hand = [...npc];
    const step = () => {
      if (total(hand) < 17) {
        hand = [...hand, drawCard()];
        setNpc(hand);
        timer.current = window.setTimeout(step, 700);
        return;
      }
      const npcTotal = total(hand);
      const playerTotal = total(player);
      finish(npcTotal > 21 || playerTotal > npcTotal);
      setBusy(false);
    };
    timer.current = window.setTimeout(step, 800);
  };

  const hit = () => {
    const next = [...player, drawCard()];
    setPlayer(next);
    if (total(next) > 21) {
      finish(false);
      return;
    }
    if (total(next) === 21) {
      setMsg('21 点！你憋着笑，等小满反应。');
    }
  };

  return (
    <div className="sheet play-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🃏</span>牌桌</div>
          <div className="sheet-sub">村口老槐树下 · 一局 10 文 · 40 分钟</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>

      <BgImage className="cards-table" src="assets/table.jpg">
        <div className="cards-inner">
          <div className="card-row">
            <span className="card-who">小满</span>
            <div className="card-hand">
              {npc.length === 0 && <span style={{ color: '#f5e6c8', fontSize: 12 }}>还没开始</span>}
              {npc.map((c, i) => (
                <div key={i} className={`pcard ${c.suit === 1 || c.suit === 3 ? 'red' : ''}`}>
                  <span>{rankText(c.rank)}</span>
                  <span className="pc-suit">{SUITS[c.suit]}</span>
                </div>
              ))}
            </div>
            {npc.length > 0 && <span className="card-total">合计 {total(npc)}</span>}
          </div>
          <div className="card-row">
            <span className="card-who">你</span>
            <div className="card-hand">
              {player.length === 0 && <span style={{ color: '#f5e6c8', fontSize: 12 }}>点「开始牌局」</span>}
              {player.map((c, i) => (
                <div key={i} className={`pcard ${c.suit === 1 || c.suit === 3 ? 'red' : ''}`}>
                  <span>{rankText(c.rank)}</span>
                  <span className="pc-suit">{SUITS[c.suit]}</span>
                </div>
              ))}
            </div>
            {player.length > 0 && <span className="card-total">合计 {total(player)}</span>}
          </div>
        </div>
      </BgImage>

      <div className="play-result">{msg}</div>

      <div className="play-actions">
        {phase === 'ready' && <button className="btn btn-primary" onClick={start}>开始牌局</button>}
        {phase === 'playing' && (
          <>
            <button className="btn btn-primary" onClick={hit} disabled={busy}>再抽一张</button>
            <button className="btn" onClick={stand} disabled={busy}>就这些了</button>
          </>
        )}
        {phase === 'done' && (
          <>
            <button className="btn btn-primary" onClick={start}>再来一局</button>
            <button className="btn btn-ghost" onClick={close}>收手回家</button>
          </>
        )}
      </div>
      <div className="farm-tip" style={{ marginTop: 12 }}>
        规则很简单：牌面不超过 21 点，越接近越好；超过就爆掉。小满会一直抽到 17 点以上。
      </div>
    </div>
  );
}
